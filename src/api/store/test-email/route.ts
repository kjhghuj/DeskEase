import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

    const { email, first_name, last_name } = req.body as any

    if (!email) {
        return res.status(400).json({ message: "Email is required" })
    }

    try {
        await notificationModuleService.createNotifications({
            to: email,
            channel: "email",
            template: "customer_created",
            data: {
                first_name: first_name || "Test User",
                last_name: last_name || "",
                email: email,
            },
        })

        return res.json({ message: "Test email triggered successfully" })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Failed to send email", error: error.message })
    }
}
