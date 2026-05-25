# Security Guidelines

## Overview

This document outlines security best practices and requirements for the Lumiera backend application.

## Critical Security Requirements

### 1. Environment Variables

**Never commit sensitive credentials to version control.** All secrets must be configured via environment variables.

#### Required Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret for JWT token signing | Random 32+ char string | Yes (Production) |
| `COOKIE_SECRET` | Secret for cookie signing | Random 32+ char string | Yes (Production) |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` | Yes |
| `RESEND_API_KEY` | Resend email service API key | `re_xxxxxxxxxxxx` | Yes (if using email) |
| `RESEND_FROM_EMAIL` | Email sender address | `noreply@yourdomain.com` | Yes (if using email) |
| `FRONTEND_URL` | Frontend application URL | `https://yourdomain.com` | Yes |
| `STRIPE_API_KEY` | Stripe secret API key | `your_stripe_secret_key` | Yes (if using Stripe) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (for frontend) | `pk_test_xxxxxxxxxxxx` | Yes (if using Stripe) |
| `ADMIN_EMAIL` | Admin user email (for scripts) | `admin@yourdomain.com` | Yes (for admin scripts) |
| `ADMIN_PASSWORD` | Admin password (for scripts) | Secure password | Yes (for admin scripts) |

### 2. Generating Secure Secrets

**JWT_SECRET and COOKIE_SECRET must be cryptographically secure random strings.**

Generate secure secrets using:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Production Deployment Checklist

Before deploying to production:

- [ ] Set `JWT_SECRET` to a secure random value (NOT "supersecret")
- [ ] Set `COOKIE_SECRET` to a secure random value (NOT "supersecret")
- [ ] Configure `DATABASE_URL` with production database credentials
- [ ] Set `RESEND_API_KEY` with your production API key
- [ ] Configure `RESEND_FROM_EMAIL` with your domain email
- [ ] Set `FRONTEND_URL` to your production frontend URL
- [ ] Set `STRIPE_API_KEY` to your production Stripe secret key
- [ ] Set `STRIPE_PUBLISHABLE_KEY` for frontend integration
- [ ] Configure Stripe webhooks for production
- [ ] Ensure `NODE_ENV=production` is set
- [ ] Verify `.env` file is in `.gitignore`
- [ ] Review all CORS settings for production domains
- [ ] Test admin user creation with environment variables

## Security Features

### Input Validation

All API endpoints validate user input:

- **Cart API**: Validates UUID format for cart IDs
- **Product API**: Validates UUID or handle format for product IDs
- **Email Service**: Validates email address format

### Error Handling

Error messages are sanitized to prevent information disclosure:

- Internal error details are logged but not exposed to clients
- Generic error messages are returned to API consumers
- Stack traces are never sent in API responses

### Admin User Creation

Admin users must be created using environment variables:

```bash
# Secure way to create admin user
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=YourSecurePassword123! npm run medusa exec ./src/scripts/create-admin-user.ts
```

**Never use hardcoded passwords in scripts.**

## Common Security Mistakes to Avoid

### ❌ DON'T

```bash
# Don't commit .env with real credentials
git add .env

# Don't use default secrets in production
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret

# Don't hardcode passwords
const password = "password123"

# Don't log sensitive data
console.log("Discount code:", discountCode)
```

### ✅ DO

```bash
# Add .env to .gitignore
echo ".env" >> .gitignore

# Generate secure random secrets
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)

# Use environment variables
const password = process.env.ADMIN_PASSWORD

# Log without sensitive details
logger.info("Promotion created successfully")
```

## API Security

### Rate Limiting

Currently, rate limiting is not implemented. For production deployment, consider:

- Implementing rate limiting middleware
- Using services like Cloudflare or AWS WAF
- Setting up API gateway with rate limiting

### CORS Configuration

Review and update CORS settings in `.env`:

```bash
STORE_CORS=https://yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://yourdomain.com,https://admin.yourdomain.com
```

**Remove localhost URLs in production.**

## Vulnerability Reporting

If you discover a security vulnerability:

1. **Do not** create a public GitHub issue
2. Email security concerns to: admin@lumiera.com
3. Include detailed steps to reproduce
4. Allow time for the issue to be fixed before public disclosure

## Security Updates

### Recent Security Fixes

- ✅ Removed exposed Resend API key from `.env`
- ✅ Removed hardcoded passwords from admin scripts
- ✅ Added input validation to API endpoints
- ✅ Sanitized error messages
- ✅ Replaced hardcoded URLs with environment variables
- ✅ Added email format validation
- ✅ Fixed typo in security error message

### Recommended Security Enhancements

Consider implementing these additional security measures:

1. **Authentication**: Implement API key authentication for store endpoints
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Security Headers**: Add security headers (HSTS, CSP, X-Frame-Options)
4. **Monitoring**: Set up logging and monitoring for security events
5. **Database**: Use read-only database users where possible
6. **Encryption**: Ensure database connections use SSL/TLS
7. **Backups**: Implement regular encrypted backups
8. **Dependency Scanning**: Regular security audits with `npm audit`

## Compliance

### Data Protection

- Customer data is stored securely in PostgreSQL
- Email addresses are validated before storage
- Passwords are hashed using industry-standard algorithms

### GDPR Considerations

- Implement data deletion workflows for customer requests
- Ensure data minimization practices
- Document data processing activities

## Additional Resources

- [Medusa Security Documentation](https://docs.medusajs.com/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## Questions or Concerns?

For security-related questions, contact: admin@lumiera.com
