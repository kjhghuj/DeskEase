import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * GET /store/store-info
 * 
 * Custom endpoint to retrieve store information including metadata.
 * This is needed because MedusaJS v2 Store API doesn't have a default store endpoint.
 */
export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    try {
        const storeModule = req.scope.resolve(Modules.STORE);

        // Get the first (default) store
        const stores = await storeModule.listStores();
        const store = stores?.[0];

        if (!store) {
            return res.status(404).json({
                type: "not_found",
                message: "Store not found",
            });
        }

        res.status(200).json({
            store: {
                id: store.id,
                name: store.name,
                metadata: store.metadata || {},
            },
        });
    } catch (error: any) {
        console.error("[store-info] Error fetching store:", error);
        res.status(500).json({
            type: "internal_error",
            message: "Failed to fetch store information",
        });
    }
}
