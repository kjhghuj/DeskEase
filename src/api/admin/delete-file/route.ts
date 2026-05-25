import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

/**
 * Admin API: 删除 R2 中的指定文件
 * 
 * POST /admin/delete-file
 * Body: { fileKey: string }
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const logger = req.scope.resolve("logger")
    const { fileKey } = req.body as { fileKey?: string }

    if (!fileKey) {
        return res.status(400).json({ error: "fileKey is required" })
    }

    const bucketName = process.env.S3_BUCKET
    if (!bucketName) {
        return res.status(500).json({ error: "S3_BUCKET not configured" })
    }

    try {
        const r2Client = getR2Client()

        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
        })

        await r2Client.send(deleteCommand)

        logger.info(`[DeleteFile] ✅ Deleted R2 file: ${fileKey}`)

        return res.json({
            success: true,
            deleted: fileKey
        })

    } catch (err) {
        logger.error(`[DeleteFile] ❌ Failed to delete R2 file ${fileKey}:`, err)
        return res.status(500).json({
            error: "Delete failed",
            message: err instanceof Error ? err.message : String(err),
        })
    }
}
