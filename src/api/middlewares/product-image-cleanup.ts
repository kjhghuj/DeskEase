import { MedusaRequest, MedusaNextFunction, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

/**
 * 中间件：在产品更新时自动删除被移除的图片文件
 * 
 * 工作流程：
 * 1. 捕获 POST /admin/products/:id 请求（前置）
 * 2. 对比更新前后的图片列表
 * 3. 删除被移除的图片文件
 */

function getR2Client() {
    return new S3Client({
        region: process.env.S3_REGION || "auto",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
    })
}

function extractFileKeyFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname
        // 移除开头的 /
        return pathname.startsWith('/') ? pathname.slice(1) : pathname
    } catch {
        return null
    }
}

export async function productImageCleanupMiddleware(
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
) {
    const logger = req.scope.resolve("logger")

    // 只处理产品更新请求
    if (req.method !== "POST" || !req.path.match(/^\/admin\/products\/[^/]+$/)) {
        return next()
    }

    const productId = req.path.split('/').pop()
    const body = req.body as { images?: { id?: string; url?: string }[] } | undefined

    // 如果请求体中没有 images 字段，跳过
    if (!body?.images) {
        return next()
    }

    try {
        // 获取更新前的产品图片
        const query = req.scope.resolve("query")
        const { data: products } = await query.graph({
            entity: "product",
            filters: { id: productId },
            fields: ["id", "images.url"],
        })

        if (!products || products.length === 0) {
            return next()
        }

        const currentProduct = products[0]
        const currentImageUrls = new Set<string>(
            (currentProduct.images || []).map((img: { url: string }) => img.url).filter(Boolean)
        )

        // 计算新的图片 URL 集合
        const newImageUrls = new Set<string>(
            (body.images || []).map((img) => img.url).filter(Boolean) as string[]
        )

        // 找出被删除的图片 URL
        const removedImageUrls: string[] = []
        for (const url of currentImageUrls) {
            if (!newImageUrls.has(url)) {
                removedImageUrls.push(url)
            }
        }

        if (removedImageUrls.length > 0) {
            logger.info(`[ImageCleanup] Detected ${removedImageUrls.length} image(s) removed from product ${productId}`)

            // 删除 R2 中的文件
            const bucketName = process.env.S3_BUCKET
            if (bucketName) {
                const r2Client = getR2Client()

                for (const url of removedImageUrls) {
                    const fileKey = extractFileKeyFromUrl(url)
                    if (fileKey) {
                        try {
                            const deleteCommand = new DeleteObjectCommand({
                                Bucket: bucketName,
                                Key: fileKey,
                            })
                            await r2Client.send(deleteCommand)
                            logger.info(`[ImageCleanup] ✅ Deleted R2 file: ${fileKey}`)
                        } catch (err) {
                            logger.error(`[ImageCleanup] ❌ Failed to delete R2 file ${fileKey}:`, err)
                        }
                    }
                }
            }
        }
    } catch (err) {
        logger.error(`[ImageCleanup] Error in middleware:`, err)
    }

    return next()
}
