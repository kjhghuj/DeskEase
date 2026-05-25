# Lumiera Frontend Cart & Checkout Guide

This document outlines the API endpoints, data structures, and integration steps for building the Cart and Checkout pages in the Lumiera storefront.

## 1. Environment Configuration

Ensure your frontend project has the Stripe Publishable Key configured.

```bash
# .env.local (Frontend)
NEXT_PUBLIC_STRIPE_KEY=pk_test_51SnxOYAdZvVEMilt2E6zRjs4XMjurRBd7S53myaxQRmM8pzcj5qQGfhl0UL9Twu11jDBdxtz8uzNh5Dk7BrkcT2b00NAwujNmN
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

## 2. Cart API Endpoints

Base URL: `http://localhost:9000/store`

### 2.1 Get Cart

Retrieve a cart by its ID.

- **Endpoint**: `GET /carts/:id`
- **Parameters**: `id` (UUID)

**Rules**:
- ID must be a valid UUID v4 format (e.g., `123e4567-e89b-12d3-a456-426614174000`).
- Invalid ID formats return `400 Bad Request`.

**Response (Success)**:
```json
{
  "cart": {
    "id": "cart_01...",
    "region_id": "reg_01...",
    "email": "customer@example.com",
    "items": [
      {
        "id": "item_01...",
        "title": "Lumiera Skin Serum",
        "quantity": 1,
        "unit_price": 5000,
        "thumbnail": "..."
      }
    ],
    "total": 5000,
    "currency_code": "usd"
  }
}
```

**Response (Error - Invalid ID)**:
```json
{
  "error": "Invalid cart ID format"
}
```

**Response (Error - Not Found)**:
```json
{
  "error": "Cart not found"
}
```

**Response (Error - Server Error)**:
```json
{
  "error": "Failed to retrieve cart" // Generic message for security
}
```

### 2.2 Create Cart

Initialize a new empty cart.

- **Endpoint**: `POST /carts`
- **Body**:
  ```json
  {
    "region_id": "reg_01..." // Optional
  }
  ```

### 2.3 Add Line Item

- **Endpoint**: `POST /carts/:id/line-items`
- **Body**:
  ```json
  {
    "variant_id": "variant_01...",
    "quantity": 1
  }
  ```

### 2.4 Update Line Item

- **Endpoint**: `POST /carts/:id/line-items/:line_id`
- **Body**:
  ```json
  {
    "quantity": 2
  }
  ```

### 2.5 Delete Line Item

- **Endpoint**: `DELETE /carts/:id/line-items/:line_id`

## 3. Stripe Payment Integration

We use the built-in Stripe module.

### 3.1 Initialize Payment Session

When the user proceeds to checkout:

1. **Create Payment Session**:
   - **Endpoint**: `POST /carts/:id/payment-sessions`
   - **Response**:
     ```json
     {
       "cart": {
         "payment_session": {
           "provider_id": "stripe",
           "data": {
             "client_secret": "pi_3SoIDP..."
           }
         }
       }
     }
     ```

2. **Select Payment Session**:
   - **Endpoint**: `POST /carts/:id/payment-session`
   - **Body**: `{ "provider_id": "stripe" }`

### 3.2 Frontend Implementation (React/Next.js)

Use `@stripe/react-stripe-js` and `@stripe/stripe-js`.

```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize with your Publishable Key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

const CheckoutPage = ({ cart }) => {
  const clientSecret = cart.payment_session?.data.client_secret;

  if (!clientSecret) return <Loading />;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
};
```

### 3.3 Confirm Payment

Inside `CheckoutForm`:

```tsx
const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe || !elements) return;

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/order/confirmed`,
    },
  });

  if (error) {
    console.error(error.message);
  }
};
```

## 4. Error Handling Guide

API responses have been sanitized for security.

| Status Code | Message | Action |
|-------------|---------|--------|
| `400` | "Invalid cart ID format" | Ensure Cart ID is a valid UUID. Check local storage logic. |
| `404` | "Cart not found" | Cart ID does not exist or was deleted. |
| `500` | "Failed to retrieve cart" | Internal server error. Retry or create a new cart. |

## 5. Testing

Use Stripe Test Cards:
- **Success**: `4242 4242 4242 4242` (Any future date, any CVC)
- **Decline**: `4000 0000 0000 0002`
