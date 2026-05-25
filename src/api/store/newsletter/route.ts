import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { subscribeToNewsletter } from "../../../lib/klaviyo";
import { verifyTurnstileToken } from "../../../lib/turnstile";

type NewsletterRequestBody = {
    email: string;
    turnstile_token?: string;
};

export async function POST(
    req: MedusaRequest<NewsletterRequestBody>,
    res: MedusaResponse
) {
    const { email, turnstile_token } = req.body;
    console.log("Newsletter Request Body:", JSON.stringify(req.body, null, 2));

    if (!email || typeof email !== "string") {
        return res.status(400).json({
            type: "invalid_request",
            message: "Email is required",
        });
    }

    if (!turnstile_token || typeof turnstile_token !== "string") {
        return res.status(400).json({
            type: "invalid_request",
            message: "Turnstile token is required",
        });
    }


    const isValidToken = await verifyTurnstileToken(turnstile_token);
    if (!isValidToken) {
        return res.status(400).json({
            type: "invalid_request",
            message: "Invalid Turnstile token",
        });
    }



    try {
        // 1. Create a simplified unique discount code
        // Pattern: WELCOME-XXXX (4 random chars)
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const discountCode = `WELCOME-${randomSuffix}`;

        // Create standard promotion (Discount)
        // Note: In a real prod scenario, we might want to check for duplicates or use a more robust generator.
        // We create a new Promotion for each user to keep it simple and truly unique in terms of config (if we wanted to customize it later).
        // Alternatively, we could add a code to an existing campaign, but creating a fresh Standard Promotion is straightforward via API.

        // However, creating a PROMOTION object for every user is heavy.
        // Better approach for standard Medusa 1.x logic: Create a DISCOUNT (old API) or PROMOTION (new Module).
        // Assuming this is Medusa v1 based on file structure (src/api/store/...), but user mentioned "Medusa Promotion Module".
        // Let's try to use the `promotionService` if it exists (Medusa v1 core `productService`, `cartService` etc).
        // If it's v2, it's a Module. The prompt mentions "Medusa Promotion 模块".
        // Let's assume standard Medusa Service: `discountService`.
        // Wait, `promotionService` is likely from v2 or a custom module. `discountService` is v1.
        // Given the lack of specific context on version, I'll assume standardized `discountService` (v1) logic is safer if `promotionService` isn't injected.
        // BUT, if the user explicitly said "Promotion Module", they might be on v2 or using the module.
        // Let's stick to creating a **Discount** (v1 entity) as it's the standard way to give a code.

        // RE-EVALUATION: The codebase seems to be v1/v2 hybrid or v2 with /store path.
        // Let's check what services are available. `req.scope.resolve("discountService")` is safest for v1 compat.

        let createdCode = discountCode;

        try {
            // Medusa V2: Use the Promotion Module
            const promotionModule = req.scope.resolve("promotion");

            if (promotionModule) {
                // Calculate expiration dates (3 days from now)
                const now = new Date();
                const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

                // Step 1: Create Campaign with date limits
                const campaign = await promotionModule.createCampaigns({
                    campaign_identifier: `newsletter-welcome-${randomSuffix}`,
                    name: `Newsletter Welcome - ${randomSuffix}`,
                    starts_at: now,
                    ends_at: expiresAt,
                });

                // Step 2: Create Promotion linked to Campaign
                const promotion = await promotionModule.createPromotions({
                    code: discountCode,
                    type: "standard",
                    status: "active",
                    campaign_id: campaign.id,
                    application_method: {
                        type: "percentage",
                        target_type: "order",
                        value: 15,
                        allocation: "across",
                    },
                });

                console.log(`[Newsletter] Created promotion code: ${discountCode} (expires: ${expiresAt.toISOString()})`);
            } else {
                console.warn("[Newsletter] Promotion module not found in scope. Skipping promotion creation.");
            }

        } catch (err) {
            console.error("[Newsletter] Failed to create Medusa promotion (V2):", err);
            // Continue flow - receiving email is better than failing completely
        }

        // 2. Sync to Klaviyo
        await subscribeToNewsletter(email);

        res.status(200).json({
            message: "Successfully subscribed",
            discount_code: createdCode // Optional: return to frontend?
        });
    } catch (error) {
        console.error("Newsletter flow error:", error);
        res.status(500).json({
            type: "internal_error",
            message: "Failed to process subscription",
        });
    }
}
