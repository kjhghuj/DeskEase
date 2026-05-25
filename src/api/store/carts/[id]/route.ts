import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";


export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const cartId = req.params.id;

    // Validate cart ID is provided
    if (!cartId) {
        return res.status(400).json({ error: "Cart ID is required" });
    }


    try {
        const { data: carts } = await query.graph({
            entity: "cart",
            fields: [
                // Basic cart info
                "id",
                "email",
                "currency_code",
                "region_id",
                "completed_at",

                // Calculated totals - CRITICAL for cart page
                "total",
                "subtotal",
                "item_subtotal",
                "discount_total",
                "tax_total",
                "shipping_total",
                "item_tax_total",

                // Items with variants
                "items.*",
                "items.adjustments.*",
                "items.variant.*",
                "items.variant.images.*",
                "items.variant.product.id",
                "items.variant.product.title",
                "items.variant.product.thumbnail",
                "items.variant.product.handle",

                // Promotions/Coupons
                "promotions.*",

                // Region and addresses
                "region.*",
                "shipping_address.*",
                "billing_address.*",
            ],
            filters: { id: cartId },
        });

        if (!carts || carts.length === 0) {
            return res.status(404).json({ error: "Cart not found" });
        }

        const cart = carts[0];

        if (cart.completed_at) {
            return res.status(404).json({ error: "Cart is already completed" });
        }

        return res.json({ cart });
    } catch (error) {
        // Log the error but don't expose internal details to the client
        console.error("[API Error] Failed to fetch cart:", error instanceof Error ? error.message : "Unknown error");
        return res.status(500).json({ error: "Failed to retrieve cart" });
    }
}

