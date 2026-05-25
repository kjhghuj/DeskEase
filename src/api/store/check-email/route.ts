import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

type CheckEmailRequestBody = {
    email: string;
};

export async function POST(
    req: MedusaRequest<CheckEmailRequestBody>,
    res: MedusaResponse
) {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
        return res.status(400).json({
            type: "invalid_request",
            message: "Email is required",
        });
    }

    const authService = req.scope.resolve(Modules.AUTH);

    const identities = await authService.listAuthIdentities({
        provider_identities: {
            entity_id: email.toLowerCase(),
        },
    });

    res.json({
        email: email.toLowerCase(),
        is_registered: identities.length > 0,
    });
}
