import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

/**
 * Middleware to populate variant.thumbnail from metadata.images[0]
 * This ensures frontend gets the variant image even if the core model doesn't support the field directly.
 */
export async function variantThumbnailProcessor(
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
) {
    const originalJson = res.json

    res.json = function (data: any) {
        // Handle single product response
        if (data?.product) {
            processProduct(data.product)
        }

        // Handle products list response
        if (data?.products && Array.isArray(data.products)) {
            data.products.forEach(processProduct)
        }

        return originalJson.call(this, data)
    }

    next()
}

function processProduct(product: any) {
    if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant: any) => {
            // If thumbnail is missing, try to get it from metadata
            if (!variant.thumbnail) {
                const metaImages = variant.metadata?.images as { url: string }[] | undefined
                if (metaImages?.[0]?.url) {
                    variant.thumbnail = metaImages[0].url
                }
            }
        })
    }
}
