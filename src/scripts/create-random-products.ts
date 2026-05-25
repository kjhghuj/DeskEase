import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import {
    createProductsWorkflow,
    createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

// Product names and descriptions for wellness products
const productData = [
    {
        title: "Serenity Silk",
        subtitle: "Premium Relaxation Device",
        description: "Experience ultimate tranquility with the Serenity Silk. Crafted from premium body-safe silicone, this elegant device features whisper-quiet motors and 8 customizable settings for personalized comfort.",
    },
    {
        title: "Harmony Wave",
        subtitle: "Sonic Wellness Massager",
        description: "The Harmony Wave uses innovative sonic technology to deliver deep, satisfying vibrations. With an ergonomic grip and waterproof design, it's perfect for relaxation anywhere.",
    },
    {
        title: "Bliss Touch",
        subtitle: "Warming Massage Device",
        description: "Featuring gentle warming function and ultra-soft silicone surface, the Bliss Touch provides soothing comfort and relaxation. USB rechargeable with travel lock.",
    },
    {
        title: "Luxe Glow",
        subtitle: "LED Therapy Massager",
        description: "Combine the benefits of gentle LED therapy with soothing vibrations. The Luxe Glow features medical-grade materials and 10 intensity levels.",
    },
    {
        title: "Velvet Dream",
        subtitle: "Dual-Action Massager",
        description: "The Velvet Dream offers simultaneous dual stimulation with independently controlled motors. Premium velvet-touch silicone for a luxurious experience.",
    },
    {
        title: "Orchid Bloom",
        subtitle: "Pulsation Therapy Device",
        description: "Inspired by nature's beauty, the Orchid Bloom delivers rhythmic pulsation patterns that mimic natural sensations. Compact and travel-friendly.",
    },
    {
        title: "Moonstone Touch",
        subtitle: "Crystal-Inspired Massager",
        description: "Elegant design meets powerful performance. The Moonstone Touch features a unique crystalline texture and 12 vibration modes for customized wellness.",
    },
    {
        title: "Aurora Pulse",
        subtitle: "Smart App-Connected Device",
        description: "Control your wellness journey with the Aurora Pulse app. Features Bluetooth connectivity, customizable patterns, and intimate partner control features.",
    },
    {
        title: "Ember Warmth",
        subtitle: "Heated Comfort Device",
        description: "Experience gentle warming comfort with the Ember Warmth. Heats to body temperature for natural-feeling relaxation. Safe auto-shutoff included.",
    },
    {
        title: "Zen Garden",
        subtitle: "Meditation Massager",
        description: "Designed for mindful relaxation, the Zen Garden combines gentle vibrations with calming aesthetics. Perfect for stress relief and self-care rituals.",
    },
];

const colors = ["Rose Gold", "Midnight Black", "Pearl White", "Lavender", "Sage Green"];

function getRandomPrice(): number {
    // Price between $100-$200 in cents (10000-20000)
    return Math.floor(Math.random() * 10001) + 10000;
}

export default async function createRandomProducts({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const inventoryService = container.resolve(Modules.INVENTORY);

    logger.info("Creating 10 random products...");

    // Get sales channel
    const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        fields: ["id", "name"],
    });

    if (!salesChannels.length) {
        logger.error("No sales channel found. Please run seed first.");
        return;
    }

    const defaultSalesChannel = salesChannels[0];
    logger.info(`Using sales channel: ${defaultSalesChannel.name}`);

    // Get shipping profile
    const { data: shippingProfiles } = await query.graph({
        entity: "shipping_profile",
        fields: ["id"],
        filters: { type: "default" },
    });

    if (!shippingProfiles.length) {
        logger.error("No shipping profile found. Please run seed first.");
        return;
    }

    const shippingProfile = shippingProfiles[0];

    // Get stock location
    const { data: stockLocations } = await query.graph({
        entity: "stock_location",
        fields: ["id"],
    });

    if (!stockLocations.length) {
        logger.error("No stock location found. Please run seed first.");
        return;
    }

    const stockLocation = stockLocations[0];

    // Create products
    const productsToCreate = productData.map((product, index) => {
        const colorIndex = index % colors.length;
        const selectedColor = colors[colorIndex];
        const priceUsd = getRandomPrice();
        const priceGbp = Math.floor(priceUsd * 0.79); // Rough GBP conversion
        const priceEur = Math.floor(priceUsd * 0.92); // Rough EUR conversion

        return {
            title: product.title,
            handle: product.title.toLowerCase().replace(/\s+/g, "-"),
            subtitle: product.subtitle,
            description: product.description,
            weight: Math.floor(Math.random() * 200) + 100, // 100-300g
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            images: [
                { url: `https://images.unsplash.com/photo-${1580000000000 + index * 1000000}?auto=format&fit=crop&q=80&w=800` },
            ],
            options: [
                { title: "Color", values: [selectedColor] },
            ],
            variants: [
                {
                    title: selectedColor,
                    sku: `${product.title.toUpperCase().replace(/\s+/g, "-")}-${selectedColor.toUpperCase().replace(/\s+/g, "")}`,
                    options: { Color: selectedColor },
                    manage_inventory: true,
                    prices: [
                        { amount: priceUsd, currency_code: "usd" },
                        { amount: priceGbp, currency_code: "gbp" },
                        { amount: priceEur, currency_code: "eur" },
                    ],
                },
            ],
            sales_channels: [{ id: defaultSalesChannel.id }],
        };
    });

    try {
        const { result: createdProducts } = await createProductsWorkflow(container).run({
            input: { products: productsToCreate },
        });

        logger.info(`Created ${createdProducts.length} products`);

        // Set inventory levels for each variant
        const inventoryLevels: any[] = [];

        for (const product of createdProducts) {
            for (const variant of product.variants || []) {
                const variantWithInventory = variant as any;
                if (variantWithInventory.inventory_items?.length) {
                    for (const inventoryItem of variantWithInventory.inventory_items) {
                        inventoryLevels.push({
                            inventory_item_id: inventoryItem.inventory_item_id,
                            location_id: stockLocation.id,
                            stocked_quantity: 100,
                        });
                    }
                }
            }
        }

        if (inventoryLevels.length > 0) {
            await createInventoryLevelsWorkflow(container).run({
                input: { inventory_levels: inventoryLevels },
            });
            logger.info(`Set inventory to 100 for ${inventoryLevels.length} variants`);
        }

        logger.info("✅ Successfully created 10 random products with $100-200 prices and 100 inventory each!");

        // Log product details
        for (const product of createdProducts) {
            const variant = product.variants?.[0] as any;
            const usdPrice = variant?.prices?.find((p: any) => p.currency_code === "usd");
            logger.info(`  - ${product.title}: $${(usdPrice?.amount || 0) / 100}`);
        }

    } catch (error) {
        logger.error("Error creating products:", error);
        throw error;
    }
}
