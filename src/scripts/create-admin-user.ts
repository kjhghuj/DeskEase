import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createUserAccountWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Script to create an admin user for the Medusa backend.
 * 
 * Usage:
 *   Set environment variables ADMIN_EMAIL and ADMIN_PASSWORD, then run:
 *   npx medusa exec ./src/scripts/create-admin-user.ts
 * 
 * Example (PowerShell):
 *   $env:ADMIN_EMAIL="admin@lumiera.com"
 *   $env:ADMIN_PASSWORD="Lumiera2024!Admin"
 *   npx medusa exec ./src/scripts/create-admin-user.ts
 */

export default async function createAdminUser({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const authModuleService = container.resolve(Modules.AUTH);
  const userModuleService = container.resolve(Modules.USER);

  // Get credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    logger.error("❌ Missing required environment variables!");
    logger.error("Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.");
    logger.error("");
    logger.error("Example (PowerShell):");
    logger.error('  $env:ADMIN_EMAIL="admin@lumiera.com"');
    logger.error('  $env:ADMIN_PASSWORD="Lumiera2024!Admin"');
    logger.error("  npx medusa exec ./src/scripts/create-admin-user.ts");
    throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables");
  }

  logger.info("======================================");
  logger.info("Creating admin user...");
  logger.info(`Email: ${adminEmail}`);
  logger.info("======================================");

  try {
    // Check if user already exists
    const existingUsers = await userModuleService.listUsers({
      email: adminEmail,
    });

    if (existingUsers.length > 0) {
      logger.warn("⚠️  User with this email already exists!");
      logger.info(`User ID: ${existingUsers[0].id}`);
      logger.info("If you need to reset the password, please delete the user first or use a different email.");
      return;
    }

    // Register the user with the emailpass provider
    // This creates the auth identity and stores the hashed password
    const { success, authIdentity, error } = await authModuleService.register("emailpass", {
      body: {
        email: adminEmail,
        password: adminPassword,
      },
    } as any);

    if (!success || !authIdentity) {
      logger.error("❌ Failed to register auth identity:");
      logger.error(error || "Unknown error");
      throw new Error(error || "Failed to register auth identity");
    }

    logger.info(`✅ Auth identity created: ${authIdentity.id}`);

    // Create the user account
    // Note: createUserAccountWorkflow automatically links the auth identity to the user
    const { result: createdUser } = await createUserAccountWorkflow(container).run({
      input: {
        authIdentityId: authIdentity.id,
        userData: {
          email: adminEmail,
          first_name: "Admin",
          last_name: "User",
        },
      },
    });

    logger.info("======================================");
    logger.info("✅ Admin user created successfully!");
    logger.info(`Email: ${createdUser.email}`);
    logger.info(`User ID: ${createdUser.id}`);
    logger.info(`Auth Identity ID: ${authIdentity.id}`);
    logger.info("======================================");
    logger.info("");
    logger.info("You can now log in to the admin panel at:");
    logger.info("http://localhost:9030/app/login");
    logger.info("");
    logger.info(`Email: ${adminEmail}`);
    logger.info("Password: [the password you set in ADMIN_PASSWORD]");
    logger.info("======================================");
  } catch (error) {
    logger.error("❌ Failed to create admin user:");
    logger.error(error);
    throw error;
  }
}
