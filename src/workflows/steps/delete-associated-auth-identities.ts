
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export const deleteAssociatedAuthIdentitiesStep = createStep(
    "delete-associated-auth-identities",
    async (ids: string[], { container }) => {
        const logger = container.resolve("logger")
        const customerService = container.resolve(Modules.CUSTOMER)
        const authService = container.resolve(Modules.AUTH)

        // 1. Fetch Customers to get Emails
        // Even if we are taking actions, checking first is good.
        const customers = await customerService.listCustomers({
            id: ids
        })

        const emails = customers.map(c => c.email).filter(Boolean) as string[]

        if (emails.length === 0) {
            return new StepResponse([], [])
        }

        logger.info(`[Auto-Cleanup] Found customers to delete: ${emails.join(", ")}. Deleting associated AuthIdentities...`)

        const deletedAuthIds: string[] = []

        for (const email of emails) {
            try {
                const identities = await authService.listAuthIdentities({
                    entity_id: email
                } as any)

                if (identities.length) {
                    const idsToDelete = identities.map(i => i.id)
                    await authService.deleteAuthIdentities(idsToDelete)
                    deletedAuthIds.push(...idsToDelete)
                }
            } catch (e) {
                logger.error(`[Auto-Cleanup] Failed to delete auth identity for ${email}`, e)
            }
        }

        logger.info(`[Auto-Cleanup] Deleted ${deletedAuthIds.length} auth identities.`)

        return new StepResponse(deletedAuthIds, deletedAuthIds)
    },
    async (deletedAuthIds, { container }) => {
        const logger = container.resolve("logger")
        // We cannot truly compensate "delete" easily without backups. 
        // But we acknowledge it.
        if (deletedAuthIds?.length) {
            logger.warn(`[Auto-Cleanup] Compensation triggered. Deleted auth identities cannot be restored automatically: ${deletedAuthIds.join(", ")}`)
        }
    }
)
