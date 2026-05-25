import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import {
    ICustomerModuleService,
    IOrderModuleService,
    CreateCustomerAddressDTO
} from "@medusajs/types";


type TransferOrderRequestBody = {
    order_id: string;
    customer_id: string;
    customer_email: string;
};

/**
 * POST /store/orders/transfer
 * 
 * Transfer a guest order to a customer.
 * This endpoint should be called after a user registers on the order confirmation page.
 * Security: The order's email must match the provided customer email.
 */
export async function POST(
    req: MedusaRequest<TransferOrderRequestBody>,
    res: MedusaResponse
) {
    const { order_id, customer_id, customer_email } = req.body;

    if (!order_id) {
        return res.status(400).json({
            type: "invalid_request",
            message: "order_id is required",
        });
    }

    if (!customer_id) {
        return res.status(400).json({
            type: "invalid_request",
            message: "customer_id is required",
        });
    }

    if (!customer_email) {
        return res.status(400).json({
            type: "invalid_request",
            message: "customer_email is required",
        });
    }

    try {
        // Resolve required modules
        const orderModule = req.scope.resolve<IOrderModuleService>(Modules.ORDER);
        const customerModule = req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER);

        // Step 2: Retrieve order details with addresses
        const order = await orderModule.retrieveOrder(order_id, {
            relations: ["shipping_address", "billing_address"]
        });

        if (!order) {
            return res.status(404).json({
                type: "not_found",
                message: "Order not found",
            });
        }

        // Step 3: Security Check - Verify order.email matches provided customer_email
        const orderEmail = order.email?.toLowerCase().trim();
        const providedEmail = customer_email?.toLowerCase().trim();

        if (!orderEmail || !providedEmail || orderEmail !== providedEmail) {
            console.warn(`[Transfer] Email mismatch! Order email: ${orderEmail}, Provided email: ${providedEmail}`);
            return res.status(403).json({
                type: "forbidden",
                message: "Order email does not match customer email. Cannot transfer order.",
            });
        }

        // Step 4: Update - If emails match, update the order's customer_id
        await orderModule.updateOrders(order_id, {
            customer_id: customer_id,
        });

        console.log(`[Transfer] Successfully transferred order ${order_id} to customer ${customer_id} (email verified: ${providedEmail})`);

        // Step 5: Copy addresses to customer profile
        try {
            const addressesToAdd: CreateCustomerAddressDTO[] = [];

            // Helper to map OrderAddress to CreateCustomerAddressDTO
            const mapAddress = (addr: any, type: 'shipping' | 'billing'): CreateCustomerAddressDTO => ({
                customer_id: customer_id,
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

            // Only add billing if it exists and is different from shipping (simple check)
            // Or just add it and let the user manage duplicates.
            // For better UX during "sign up from order", usually shipping is the main one. 
            // If billing is distinct, add it too.
            if (order.billing_address) {
                // Determine if billing is effectively the same as shipping to avoid duplicates
                // This is a naive check; ideally we compare key fields.
                // Assuming if they are different objects in DB, we treat them as potentially different.
                // But let's check if we already added a shipping address that looks identical.
                const shippingAddr = order.shipping_address;
                const billingAddr = order.billing_address;

                const isSame = shippingAddr &&
                    shippingAddr.address_1 === billingAddr.address_1 &&
                    shippingAddr.postal_code === billingAddr.postal_code &&
                    shippingAddr.city === billingAddr.city;

                if (!isSame) {
                    addressesToAdd.push(mapAddress(billingAddr, 'billing'));
                } else if (addressesToAdd.length > 0) {
                    // Update the existing one (the shipping one) to be default billing too
                    addressesToAdd[0].is_default_billing = true;
                }
            }

            if (addressesToAdd.length > 0) {
                await customerModule.createCustomerAddresses(addressesToAdd);
                console.log(`[Transfer] Added ${addressesToAdd.length} address(es) to customer profile.`);
            }

        } catch (addressError) {
            // Non-critical error, log but don't fail the transfer result
            console.error("[Transfer] Failed to copy addresses to customer profile:", addressError);
        }

        res.status(200).json({
            success: true,
            message: "Order transferred successfully",
            order_id: order_id,
            customer_id: customer_id,
        });
    } catch (error: any) {
        console.error("[Transfer] Failed to transfer order:", error);

        // Handle specific error cases
        if (error.message?.includes("not found")) {
            return res.status(404).json({
                type: "not_found",
                message: "Order not found",
            });
        }

        res.status(500).json({
            type: "internal_error",
            message: "Failed to transfer order",
        });
    }
}
