# DeskEase Medusa Backend

Medusa backend for the DeskEase US single-product validation store.

## Scope

- United States region
- USD pricing
- First product: `DeskEase Neck Reset Wrap`
- Launch price: `$99`
- Free US standard delivery, promised as `7-12 business days`
- Stripe payments
- Resend order confirmation email
- No Strapi CMS dependency

## Local Commands

```bash
npm install
npm run build
npm run migrate
npm run seed
npm run dev
```

## Railway

This repo includes `railway.json` for Railway deployment:

- Build command: `npm run build`
- Pre-deploy command: `npm run migrate`
- Start command: `npm run start`
- Health check: `/health`

Deployment notes and required environment variables are in `docs/DESKEASE_MVP_DEPLOYMENT.md`.
