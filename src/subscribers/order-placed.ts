import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"
// import { INotificationModuleService } from "@medusajs/types" // Types might not be directly available if not installed, we can infer or use any if needed to avoid build error, but let's try.

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const notificationModuleService = container.resolve(
        Modules.NOTIFICATION
    )

    const query = container.resolve("query")

    const { data: orders } = await query.graph({
        entity: "order",
        fields: [
            "id",
            "display_id",
            "email",
            "total",
            "subtotal",
            "shipping_total",
            "currency_code",
            "items.*",
            "shipping_address.first_name",
            "shipping_address.last_name"
        ],
        filters: { id: data.id }
    })

    const order = orders[0]

    if (!order) {
        console.warn(`[OrderPlacedSubscriber] Order ${data.id} not found.`)
        return
    }

    const firstName = order.shipping_address?.first_name || "Valued Customer"

    if (!order.email) {
        console.warn(`[OrderPlacedSubscriber] Order ${data.id} has no email address.`)
        return
    }

    console.log(`[OrderPlacedSubscriber] Sending email for order ${order.id} to ${order.email}`)

    try {
        await notificationModuleService.createNotifications({
            to: order.email,
            channel: "email",
            template: "order_placed",
            data: {
                id: order.id,
                display_id: order.display_id,
                email: order.email,
                first_name: firstName,
                total: order.total,
                subtotal: order.subtotal,
                shipping_total: order.shipping_total,
                currency_code: order.currency_code,
                items: order.items || [],
            },
        })
        console.log(`[OrderPlacedSubscriber] Notification triggered successfully.`)
    } catch (error) {
        console.error(`[OrderPlacedSubscriber] Failed to trigger notification:`, error)
    }
}

export const config: SubscriberConfig = {
    event: "order.placed",
}
