import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Script to clean up auth identities and users for testing purposes.
 * 
 * Usage:
 *   $env:CLEANUP_EMAIL="admin@lumiera.com"
 *   npx medusa exec ./src/scripts/cleanup-user.ts
 */

export default async function cleanupUser({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const authModuleService = container.resolve(Modules.AUTH);
    const userModuleService = container.resolve(Modules.USER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const email = process.env.CLEANUP_EMAIL;

    if (!email) {
        logger.error("❌ Missing CLEANUP_EMAIL environment variable!");
        throw new Error("Missing CLEANUP_EMAIL environment variable");
    }

    logger.info(`Cleaning up user and auth identities for: ${email}`);

    try {
        // Find and delete user
        const users = await userModuleService.listUsers({ email });
        if (users.length > 0) {
            for (const user of users) {
                logger.info(`Deleting user: ${user.id}`);
                await userModuleService.deleteUsers([user.id]);
            }
        }

        // Find and delete auth identities
        const { data: authIdentities } = await query.graph({
            entity: "auth_identity",
            fields: ["id", "provider_identities.*"],
            filters: {},
        });

        for (const authIdentity of authIdentities) {
            const emailPassIdentity = authIdentity.provider_identities?.find(
                (pi: any) => pi.provider === "emailpass" && pi.entity_id === email
            );

            if (emailPassIdentity) {
                logger.info(`Deleting auth identity: ${authIdentity.id}`);
                await authModuleService.deleteAuthIdentities([authIdentity.id]);
            }
        }

        logger.info("✅ Cleanup completed!");
    } catch (error) {
        logger.error("❌ Cleanup failed:");
        logger.error(error);
        throw error;
    }
}
