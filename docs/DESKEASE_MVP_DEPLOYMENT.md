# DeskEase Medusa MVP Deployment

## Target

Deploy the Medusa backend to a managed Node host such as Railway or Render with managed Postgres and Redis. The first production pass should stay under the MVP budget and avoid deploying Strapi.

## Required Environment Variables

```bash
NODE_ENV=production
HOST=0.0.0.0
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
STORE_CORS=https://your-domain.com
ADMIN_CORS=https://api.your-domain.com,https://${{RAILWAY_PUBLIC_DOMAIN}}
AUTH_CORS=https://your-domain.com,https://api.your-domain.com,https://${{RAILWAY_PUBLIC_DOMAIN}}
JWT_SECRET=your_strong_random_jwt_secret
COOKIE_SECRET=your_strong_random_cookie_secret
STRIPE_API_KEY=your_stripe_secret_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=orders@your-domain.com
STOREFRONT_URL=https://your-domain.com
MEDUSA_BACKEND_URL=https://api.your-domain.com
S3_FILE_URL=https://your-public-bucket-url.example
S3_ACCESS_KEY_ID=your_s3_access_key_id
S3_SECRET_ACCESS_KEY=your_s3_secret_access_key
S3_BUCKET=your_bucket_name
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_REGION=auto
```

Generate `JWT_SECRET` and `COOKIE_SECRET` locally with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Launch Checks

- Railway runs migrations from `railway.json` before each deploy.
- Run the seed command once after the first successful deployment: `npm run seed`.
- Confirm the seed creates the `United States` region, `DeskEase Neck Reset Wrap`, a USD $99 price, and free US standard shipping.
- Copy the generated Medusa publishable API key into the Vercel storefront environment.
- Complete one real low-value Stripe payment, confirm the order appears in Medusa, then test refund handling before launching ads.

## Railway Dashboard Path

1. Create a Railway project.
2. Add PostgreSQL and Redis services.
3. Add this backend repo as a service.
4. Keep the service root at the repository root if deploying `lumiera-backend` directly.
5. Import the variables above into the backend service variables.
6. Generate a Railway public domain, then set `MEDUSA_BACKEND_URL` and `ADMIN_CORS` to include that HTTPS domain.
7. Deploy and check `/health`.

## Security Notes

- Rotate any object storage keys that were ever committed or shared in templates.
- Keep production secrets only in the hosting provider environment variable store.
- Restrict CORS to the production storefront domain and necessary preview domains.
