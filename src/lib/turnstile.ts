import axios from "axios";

export const verifyTurnstileToken = async (token: string): Promise<boolean> => {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
        console.error("TURNSTILE_SECRET_KEY is not set");
        return false;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("secret", secretKey);
        formData.append("response", token);

        const response = await axios.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            formData,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout: 10000, // 10 seconds timeout
            }
        );

        const data = response.data;

        if (!data.success) {
            console.warn("Turnstile verification failed:", data["error-codes"]);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error verifying Turnstile token:", error);
        return false;
    }
};
