# Security Policy

## Overview

QuaiDirect takes security seriously. This document outlines security best practices and policies for the project.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it by:
1. **DO NOT** create a public GitHub issue
2. Email the maintainers directly with details
3. Include steps to reproduce the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Environment Variables and Secrets

### Critical Security Rules

1. **Never commit secrets to the repository**
   - API keys, passwords, tokens, and other sensitive data must NEVER be committed
   - The `.env` file is excluded from git tracking via `.gitignore`
   - Always use environment variables for sensitive configuration

2. **Use `.env.example` as a template**
   - The `.env.example` file contains placeholder values only
   - Copy `.env.example` to `.env` and fill in your actual values
   - Never commit your `.env` file

3. **Required Environment Variables**
   ```
   VITE_SUPABASE_PROJECT_ID       # Your Supabase project ID
   VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase public/anon key
   VITE_SUPABASE_URL              # Your Supabase project URL
   VITE_GOOGLE_MAPS_API_KEY       # Google Maps API key
   VITE_VAPID_PUBLIC_KEY          # VAPID public key for push notifications
   ```

### Setting Up Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in the actual values in `.env`:
   - Get Supabase credentials from https://app.supabase.com
   - Generate Google Maps API key at https://console.cloud.google.com
   - Generate VAPID keys with: `npx web-push generate-vapid-keys`

3. Verify `.env` is not tracked:
   ```bash
   git status  # .env should not appear in tracked files
   ```

## API Key Security

### Supabase Security

- **Row Level Security (RLS)** is enabled on all sensitive tables
- Public API keys are safe to expose in frontend code (by design)
- Service role keys must NEVER be used in frontend code
- Always validate user permissions server-side via RLS policies

### Google Maps API Key

- Restrict API key usage to your domain in Google Cloud Console
- Enable only necessary Google Maps APIs
- Monitor API key usage regularly
- Rotate keys if compromised

### Stripe Integration

- Use test keys in development environments
- Production keys must be stored as environment variables
- Webhook endpoints must verify signatures
- Never log sensitive payment information

## Dependencies Security

### Regular Security Audits

1. Run security audits regularly:
   ```bash
   npm audit
   npm audit fix
   ```

2. Keep dependencies up to date:
   ```bash
   npm outdated
   npm update
   ```

3. Review dependency changes before updating

### Development vs Production Dependencies

- Test libraries are in `devDependencies` to reduce production bundle size
- Production dependencies should be minimal and well-vetted
- Avoid dependencies with known security vulnerabilities

## Authentication & Authorization

### User Authentication

- All authentication is handled by Supabase Auth
- Never store passwords or tokens in localStorage
- Use secure session management
- Implement proper session timeout

### Role-Based Access Control

- Fishermen must have verified subscriptions to post arrivals
- Admin functions are protected by role checks
- All sensitive operations verify user permissions server-side

## Data Protection

### Personal Data

- Follow GDPR and privacy regulations
- Minimize personal data collection
- Encrypt sensitive data in transit and at rest
- Implement data retention policies

### Payment Data

- Payment data is handled exclusively by Stripe
- Never store credit card information
- PCI compliance is managed by Stripe

## Best Practices for Developers

1. **Code Review**
   - All code changes require review
   - Security-sensitive changes require extra scrutiny
   - Check for hardcoded secrets in PR diffs

2. **Input Validation**
   - Validate all user inputs
   - Use Zod schemas for type-safe validation
   - Sanitize data before database operations

3. **Error Handling**
   - Don't expose sensitive information in error messages
   - Log errors securely (use Sentry)
   - Provide user-friendly error messages

4. **HTTPS Only**
   - Always use HTTPS in production
   - Enable HSTS headers
   - Secure cookies with `Secure` and `SameSite` flags

5. **Regular Security Updates**
   - Monitor security advisories
   - Update dependencies promptly
   - Test updates in development first

## Security Checklist for Pull Requests

Before submitting a PR, ensure:

- [ ] No secrets or API keys in code
- [ ] Environment variables used for configuration
- [ ] Input validation implemented
- [ ] Authentication/authorization checks in place
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date and secure
- [ ] Security best practices followed

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NPM Security Best Practices](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities)
- [Stripe Security](https://stripe.com/docs/security/stripe)

## License

This security policy is part of the QuaiDirect project and follows the same license terms.
