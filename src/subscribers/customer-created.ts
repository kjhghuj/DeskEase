import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(
    `[CustomerCreatedSubscriber] Customer ${data.id} created. Welcome coupon automation is disabled for the DeskEase MVP.`
  )
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
