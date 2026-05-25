import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3"

/**
 * Admin API: 清理 R2 中的孤立图片文件
 * 
 * POST /admin/cleanup-images
 * 
 * 工作流程：
 * 1. 列出 R2 bucket 中的所有图片文件
 * 2. 获取所有产品正在使用的图片 URL
 * 3. 找出并删除不再被使用的文件
 */

// 创建 S3 客户端（用于 R2）
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

// 从 URL 提取文件 key
function extractFileKeyFromUrl(url: string, bucketName: string): string | null {
    try {
        const urlObj = new URL(url)
        // R2 URL 格式通常是: https://<bucket>.<account>.r2.cloudflarestorage.com/<key>
        // 或: https://pub-xxx.r2.dev/<key>
        // 或自定义域名: https://your-domain.com/<key>

        const pathname = urlObj.pathname
        if (pathname.startsWith('/')) {
            return pathname.slice(1) // 移除开头的 /
        }
        return pathname
    } catch {
        return null
    }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const logger = req.scope.resolve("logger")
    const query = req.scope.resolve("query")

    logger.info("[CleanupImages] Starting R2 cleanup...")

    const bucketName = process.env.S3_BUCKET
    if (!bucketName) {
        return res.status(500).json({
            error: "S3_BUCKET environment variable is not configured"
        })
    }

    try {
        // 1. 获取所有产品的图片 URL
        const { data: allProducts } = await query.graph({
            entity: "product",
            fields: ["id", "thumbnail", "images.url", "metadata"],
        })

        // 收集所有正在使用的图片 URL
        const usedUrls = new Set<string>()

        for (const product of allProducts || []) {
            if (product.thumbnail) usedUrls.add(product.thumbnail)
            if (product.images) {
                for (const img of product.images) {
                    if (img.url) usedUrls.add(img.url)
                }
            }
            // 检查 detail_sections (自定义 widget)
            if (product.metadata?.detail_sections) {
                const sections = product.metadata.detail_sections as Array<{
                    type: string
                    content: string
                }>
                for (const section of sections) {
                    if (section.type === 'image_full' && section.content) {
                        usedUrls.add(section.content)
                    }
                }
            }
        }

        // 获取变体图片
        const { data: allVariants } = await query.graph({
            entity: "product_variant",
            fields: ["id", "metadata"],
        })

        for (const variant of allVariants || []) {
            if (variant.metadata?.images) {
                const variantImages = variant.metadata.images as { url: string }[]
                for (const img of variantImages) {
                    if (img.url) usedUrls.add(img.url)
                }
            }
        }

        logger.info(`[CleanupImages] Found ${usedUrls.size} active image URLs`)

        // 2. 列出 R2 bucket 中的所有对象
        const r2Client = getR2Client()
        const allR2Objects: { key: string; url: string }[] = []
        let continuationToken: string | undefined

        do {
            const listCommand = new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
            })

            const listResponse = await r2Client.send(listCommand)

            if (listResponse.Contents) {
                for (const obj of listResponse.Contents) {
                    if (obj.Key) {
                        // 重建完整 URL
                        const fileUrl = `${process.env.S3_FILE_URL}/${obj.Key}`
                        allR2Objects.push({ key: obj.Key, url: fileUrl })
                    }
                }
            }

            continuationToken = listResponse.NextContinuationToken
        } while (continuationToken)

        logger.info(`[CleanupImages] Found ${allR2Objects.length} objects in R2 bucket`)

        // 3. 找出孤立文件
        const orphanedFiles = allR2Objects.filter(obj => {
            // 只处理图片文件
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(obj.key)
            if (!isImage) return false

            // 检查是否被使用
            return !usedUrls.has(obj.url)
        })

        logger.info(`[CleanupImages] Found ${orphanedFiles.length} orphaned files to delete`)

        // 4. 删除孤立文件
        let deletedCount = 0
        let failedCount = 0
        const deletedFiles: string[] = []
        const failedFiles: string[] = []

        for (const file of orphanedFiles) {
            try {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: file.key,
                })
                await r2Client.send(deleteCommand)
                deletedCount++
                deletedFiles.push(file.key)
                logger.info(`[CleanupImages] ✅ Deleted: ${file.key}`)
            } catch (err) {
                failedCount++
                failedFiles.push(file.key)
                logger.error(`[CleanupImages] ❌ Failed to delete ${file.key}:`, err)
            }
        }

        return res.json({
            success: true,
            summary: {
                totalR2Objects: allR2Objects.length,
                activeUrls: usedUrls.size,
                orphanedFiles: orphanedFiles.length,
                deletedCount,
                failedCount,
            },
            deletedFiles,
            failedFiles,
        })

    } catch (err) {
        logger.error("[CleanupImages] Error during cleanup:", err)
        return res.status(500).json({
            error: "Cleanup failed",
            message: err instanceof Error ? err.message : String(err),
        })
    }
}
