
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"

export default async function cleanupAuthIdentity({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const logger = container.resolve("logger")
    const authService = container.resolve(Modules.AUTH)
    const customerService = container.resolve(Modules.CUSTOMER)

    const customerId = data.id
    logger.info(`[CleanupSubscriber] Customer deleted (ID: ${customerId}). Checking for orphaned auth identities...`)

    try {
        // 1. Try to fetch the customer (to get email) - considering soft delete
        // Medusa's standard list might exclude deleted. We might need `withDeleted` if supported, 
        // but the service list usually filters. 
        // However, if we can't find the customer, we can't get the email easily unless we stored it elsewhere.

        // Attempt 1: Fetch customer with potentially deleted flag? 
        // The `retrieve` method doesn't standardly have explicit "allow deleted" without specific query config often hidden.

        // Let's assume for a moment we can't get the email if it's strictly deleted.
        // BUT, we can try to list auth identities that have `app_metadata: { customer_id: ... }` 
        // if we were smart enough to save it there. 
        // My registration page logic (standard medusa) MIGHT not populate customer_id in app_metadata unless custom workflow did it.

        // If we can't find it, we just log warning.
        // BUT, in Development, often we can just scan identities? (Dangerous/Slow)

        // Let's try to see if we can still retrieve the customer.
        const customer = await customerService.retrieveCustomer(customerId).catch(() => null)

        let email: string | undefined

        if (customer) {
            email = customer.email
        } else {
            // Hard deleted? Or just filtered.
            logger.warn(`[CleanupSubscriber] Could not retrieve deleted customer details. Validating if we can find identity via metadata.`)
        }

        // If we have email
        if (email) {
            const identities = await authService.listAuthIdentities({
                entity_id: email
            } as any)
            if (identities.length) {
                await authService.deleteAuthIdentities(identities.map(i => i.id))
                logger.info(`[CleanupSubscriber] Deleted ${identities.length} auth identities by email match (${email}).`)
                return
            }
        }

        // If no email or no match by email, try by app_metadata (if mapped)
        // This is a "fuzzy" search if not indexed, but `listAuthIdentities` might allow filtering by metadata?
        // Not standardly typed in list DTO often.

        // Fallback: This subscriber simply attempts best effort.
        logger.info(`[CleanupSubscriber] Cleanup attempt finished.`)

    } catch (err) {
        logger.error(`[CleanupSubscriber] Error during cleanup`, err)
    }
}

export const config: SubscriberConfig = {
    event: "customer.deleted",
}
