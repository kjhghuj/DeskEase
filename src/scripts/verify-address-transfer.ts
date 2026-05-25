
import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { IOrderModuleService, ICustomerModuleService, IRegionModuleService, CreateCustomerAddressDTO } from "@medusajs/types";


export default async function verifyAddressTransfer({ container }: ExecArgs) {
    const orderModule = container.resolve<IOrderModuleService>(Modules.ORDER);
    const customerModule = container.resolve<ICustomerModuleService>(Modules.CUSTOMER);
    const regionModule = container.resolve<IRegionModuleService>(Modules.REGION);

    console.log("Starting verification (simulation mode)...");

    // 1. Get a region
    const [region] = await regionModule.listRegions({}, { take: 1 });
    if (!region) {
        console.error("No regions found to create order.");
        return;
    }

    // 2. Create a dummy guest order with address
    const testEmail = `test-transfer-${Date.now()}@example.com`;
    console.log(`Creating order for email: ${testEmail}`);

    let order = await orderModule.createOrders({
        region_id: region.id,
        email: testEmail,
        currency_code: region.currency_code,
        items: [],
        shipping_address: {
            first_name: "Test",
            last_name: "User",
            address_1: "123 Test St",
            city: "Test City",
            country_code: "us",
            postal_code: "12345",
            phone: "1234567890",
        },
        billing_address: {
            first_name: "Test",
            last_name: "Billing",
            address_1: "456 Billing Ave",
            city: "Billing City",
            country_code: "us",
            postal_code: "67890",
            phone: "0987654321",
        }
    });

    console.log(`Created order: ${order.id}`);

    // 3. Create a customer (simulating signup)
    const customer = await customerModule.createCustomers({
        email: testEmail,
        first_name: "Test",
        last_name: "User",
    });

    console.log(`Created customer: ${customer.id}`);

    // 4. Simulate the logic from the route
    console.log("Simulating transfer logic...");

    // Retrieve order with relations (mimicking what we added to the route)
    order = await orderModule.retrieveOrder(order.id, {
        relations: ["shipping_address", "billing_address"]
    });

    // Verify email (skip for test as we created them matching)

    // Update order customer_id
    await orderModule.updateOrders(order.id, {
        customer_id: customer.id,
    });

    // Copy addresses (The core logic we want to test)
    console.log("Copying addresses...");
    const addressesToAdd: CreateCustomerAddressDTO[] = [];

    // Helper to map OrderAddress to CreateCustomerAddressDTO
    const mapAddress = (addr: any, type: 'shipping' | 'billing'): CreateCustomerAddressDTO => ({
        customer_id: customer.id,
        first_name: addr.first_name,
        last_name: addr.last_name,
        company: addr.company,
        address_1: addr.address_1,
        address_2: addr.address_2,
        city: addr.city,
        country_code: addr.country_code,
        province: addr.province,
        postal_code: addr.postal_code,
        phone: addr.phone,
        metadata: addr.metadata,
        is_default_shipping: type === 'shipping',
        is_default_billing: type === 'billing'
    });

    if (order.shipping_address) {
        addressesToAdd.push(mapAddress(order.shipping_address, 'shipping'));
    }

    if (order.billing_address) {
        const shippingAddr = order.shipping_address;
        const billingAddr = order.billing_address;

        const isSame = shippingAddr &&
            shippingAddr.address_1 === billingAddr.address_1 &&
            shippingAddr.postal_code === billingAddr.postal_code &&
            shippingAddr.city === billingAddr.city;

        if (!isSame) {
            addressesToAdd.push(mapAddress(billingAddr, 'billing'));
        } else if (addressesToAdd.length > 0) {
            addressesToAdd[0].is_default_billing = true;
        }
    }

    if (addressesToAdd.length > 0) {
        await customerModule.createCustomerAddresses(addressesToAdd);
        console.log(`[Simulation] Added ${addressesToAdd.length} address(es) to customer profile.`);
    }


    // 5. Verify the customer has addresses
    const customerAddresses = await customerModule.listCustomerAddresses({
        customer_id: customer.id,
    });

    console.log(`Customer has ${customerAddresses.length} addresses.`);
    if (customerAddresses.length > 0) {
        console.log("Address copied successfully!");
        customerAddresses.forEach((addr, idx) => {
            console.log(`Address ${idx + 1}: ${addr.address_1}, ${addr.city} (${addr.is_default_shipping ? 'Default Shipping' : ''} ${addr.is_default_billing ? 'Default Billing' : ''})`);
        });
    } else {
        console.error("Address NOT copied.");
    }
}
