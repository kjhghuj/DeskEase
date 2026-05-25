import { defineMiddlewares } from "@medusajs/medusa"
import cors from "cors"
import { productImageCleanupMiddleware } from "./middlewares/product-image-cleanup"
import { variantThumbnailProcessor } from "./middlewares/variant-thumbnail-processor"

const STORE_CORS = process.env.STORE_CORS || "http://localhost:3030"

const corsOptions = {
    origin: STORE_CORS.split(",").map(o => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-publishable-api-key", "x-medusa-access-token"],
}

export default defineMiddlewares({
    routes: [
        {
            matcher: "/admin/products/:id",
            method: "POST",
            middlewares: [productImageCleanupMiddleware],
        },
        {
            matcher: "/store/products",
            method: "GET",
            middlewares: [variantThumbnailProcessor],
        },
        {
            matcher: "/store/products/:id",
            method: "GET",
            middlewares: [variantThumbnailProcessor],
        },
    ],
})


