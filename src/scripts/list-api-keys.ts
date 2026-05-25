
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function listApiKeys({ container }: ExecArgs) {
  const apiKeyService = container.resolve(Modules.API_KEY)
  const logger = container.resolve("logger")

  logger.info("Listing all Publishable API Keys...")

  try {
    const [keys, count] = await apiKeyService.listAndCountApiKeys({
      type: "publishable",
    })

    logger.info(`Found ${count} Publishable API Keys:`)
    keys.forEach((key) => {
      logger.info(`- ID: ${key.id} | Token: ${key.token} | Title: ${key.title} | Created: ${key.created_at}`)
    })

    if (count === 0) {
        logger.warn("No Publishable API Keys found! You may need to run the seed script or create one in the Admin dashboard.")
    }

  } catch (error) {
    logger.error("Failed to list API keys", error)
  }
}
