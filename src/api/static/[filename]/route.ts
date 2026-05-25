import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"

/**
 * Static file serving route
 * Serves files from the /static directory
 * URL: GET /static/:filename
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const { filename } = req.params

    if (!filename) {
        return res.status(400).json({ message: "File name is required" })
    }

    // Construct absolute path to the file
    const staticDir = path.resolve(process.cwd(), "static")
    const absolutePath = path.join(staticDir, filename)

    // Security: Ensure the file is within the static directory (prevent directory traversal)
    if (!absolutePath.startsWith(staticDir)) {
        return res.status(403).json({ message: "Access denied" })
    }

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: "File not found" })
    }

    // Get file stats
    const stats = fs.statSync(absolutePath)
    if (stats.isDirectory()) {
        return res.status(403).json({ message: "Cannot serve directories" })
    }

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase()
    const contentTypes: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
    }
    const contentType = contentTypes[ext] || "application/octet-stream"

    // Set headers for caching and content type
    res.setHeader("Content-Type", contentType)
    res.setHeader("Content-Length", stats.size)
    res.setHeader("Cache-Control", "public, max-age=86400") // 1 day cache
    res.setHeader("Access-Control-Allow-Origin", "*") // Allow cross-origin access

    // Stream the file
    const fileStream = fs.createReadStream(absolutePath)
    fileStream.pipe(res)
}
