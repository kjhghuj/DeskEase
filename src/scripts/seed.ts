import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { ApiKey } from "../../.medusa/types/query-entry-points"

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[]
    store_id: string
  }) => {
    const normalizedInput = transform({ input }, (data) => ({
      selector: { id: data.input.store_id },
      update: {
        supported_currencies: data.input.supported_currencies.map((currency) => ({
          currency_code: currency.currency_code,
          is_default: currency.is_default ?? false,
        })),
      },
    }))

    const stores = updateStoresStep(normalizedInput)

    return new WorkflowResponse(stores)
  }
)

export default async function seedDeskEaseData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  logger.info("Seeding DeskEase MVP data...")

  const [store] = await storeModuleService.listStores()

  await storeModuleService.updateStores(store.id, {
    name: "DeskEase",
  })

  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "DeskEase Storefront",
  })

  if (!defaultSalesChannel.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "DeskEase Storefront",
            description: "US MVP storefront for desk-day comfort hardware",
          },
        ],
      },
    })
    defaultSalesChannel = result
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [{ currency_code: "usd", is_default: true }],
    },
  })

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  })

  logger.info("Seeding US region...")
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "United States",
          currency_code: "usd",
          countries: ["us"],
          payment_providers: ["pp_stripe_stripe"],
        },
      ],
    },
  })
  const usRegion = regionResult[0]

  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "us",
        provider_id: "tp_system",
      },
    ],
  })

  logger.info("Seeding fulfillment...")
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "DeskEase Shenzhen Fulfillment",
          address: {
            city: "Shenzhen",
            country_code: "CN",
            address_1: "Validation launch fulfillment",
          },
        },
      ],
    },
  })
  const stockLocation = stockLocationResult[0]

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  })

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null

  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: "DeskEase Standard Shipping",
            type: "default",
          },
        ],
      },
    })
    shippingProfile = result[0]
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "DeskEase US Delivery",
    type: "shipping",
    service_zones: [
      {
        name: "United States",
        geo_zones: [
          {
            country_code: "us",
            type: "country" as const,
          },
        ],
      },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "US Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "US Standard",
          description: "Tracked delivery in 7-12 business days.",
          code: "us-standard",
        },
        prices: [
          { currency_code: "usd", amount: 0 },
          { region_id: usRegion.id, amount: 0 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  })

  logger.info("Seeding publishable API key...")
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: {
      type: "publishable",
    },
  })

  let publishableApiKey = data?.[0] as ApiKey | undefined

  if (!publishableApiKey) {
    const {
      result: [createdKey],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "DeskEase Storefront",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })

    publishableApiKey = createdKey as ApiKey
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  })

  logger.info("Seeding product category and MVP product...")
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Neck & Shoulder Comfort",
          handle: "neck-shoulder-comfort",
          description: "Desk-day comfort hardware for short daily reset routines.",
          is_active: true,
        },
      ],
    },
  })

  const comfortCategory = categoryResult[0]

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "DeskEase Neck Reset Wrap",
          handle: "desk-reset-neck-reliever",
          subtitle: "Warm, quiet neck and shoulder comfort for desk-heavy days",
          description:
            "A lightweight neck and shoulder comfort wrap designed for short daily reset routines between screen-heavy work blocks. This consumer comfort product is not a medical device.",
          category_ids: [comfortCategory.id],
          weight: 420,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            story_sections: JSON.stringify([
              {
                id: "desk-routine",
                title: "Built for a 12-minute desk reset",
                body: "Use gentle heat, quiet vibration, or both together between focus blocks.",
              },
              {
                id: "not-medical",
                title: "Comfort positioning",
                body: "DeskEase is positioned for relaxation and comfort, not treatment or diagnosis.",
              },
            ]),
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=85&w=1200",
            },
            {
              url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=85&w=1200",
            },
          ],
          options: [{ title: "Color", values: ["Graphite"] }],
          variants: [
            {
              title: "Graphite",
              sku: "DE-NECK-WRAP-GRAPHITE",
              options: { Color: "Graphite" },
              prices: [{ amount: 9900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
      ],
    },
  })

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  const inventoryLevels: CreateInventoryLevelInput[] = inventoryItems.map((item) => ({
    location_id: stockLocation.id,
    stocked_quantity: 100,
    inventory_item_id: item.id,
  }))

  if (inventoryLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryLevels,
      },
    })
  }

  logger.info("======================================")
  logger.info("DeskEase seed data complete.")
  logger.info(`Publishable API Key: ${(publishableApiKey as any).token || publishableApiKey.id}`)
  logger.info("======================================")
}
