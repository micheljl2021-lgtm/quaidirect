# Security Policy

## Overview

QuaiDirect takes security seriously. This document outlines security best practices and policies for the project.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it by:
1. **DO NOT** create a public GitHub issue
2. Email the maintainers directly with details
3. Include steps to reproduce the vulnerability
4. Allow reasonable time for a fix before public disclosure

## ⚠️ IMPORTANT: Key Rotation Required

**If API keys or secrets were previously committed to the repository, they must be rotated immediately**, even after removing them from tracking. Git history preserves all previous commits, so exposed keys remain accessible.

### Why Key Rotation is Critical

When secrets are committed to Git:
- They remain in Git history forever (even after deletion)
- They can be accessed by anyone with repository access
- They can be found by automated secret scanners
- They pose a security risk to your application and users

### Keys That Need Rotation After Exposure

**Exposed in Git History** (from previously committed `.env`):
- ✅ Supabase API keys (Project ID, Publishable Key)
- ✅ Google Maps API Key
- ✅ Firebase configuration (all keys)
- ✅ VAPID keys (public and private)
- ✅ Any other API keys or secrets

**IMMEDIATE ACTION REQUIRED**: Follow the rotation procedures below.

---

## Key Rotation Procedures

### 1. Google Maps API Key Rotation

**Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the new API key
4. Click "Restrict Key" and configure:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your domains
     - For Lovable: `*.lovableproject.com/*`
     - For production: `yourdomain.com/*`, `*.yourdomain.com/*`
   - **API restrictions**: Select APIs
     - Enable: Maps JavaScript API
     - Enable: Places API  
     - Enable: Geocoding API
5. Update `VITE_GOOGLE_MAPS_API_KEY` in:
   - Lovable Cloud Secrets (for production)
   - Local `.env` file (for development)
6. Test the new key in your application
7. **Delete the old exposed key** from Google Cloud Console

**Verification**:
```bash
# Check maps load correctly on your deployed app
# Browser console should show: [Google Maps] API key configured ✓
```

### 2. Supabase Keys Rotation

Supabase provides two types of keys:
- **Publishable (anon) key**: Safe to expose in frontend (protected by RLS)
- **Service role key**: Must NEVER be exposed (full database access)

**If Publishable Key was Exposed**:
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project
2. Navigate to Settings → API
3. The `anon` `public` key is designed to be public (protected by Row Level Security)
4. However, if you want to rotate it:
   - Contact Supabase support or
   - Create a new project and migrate data
5. Update `VITE_SUPABASE_PUBLISHABLE_KEY` in Lovable Cloud Secrets

**If Service Role Key was Exposed** (CRITICAL):
1. This is a security breach - full database access
2. Contact Supabase support immediately
3. Rotate the key via Supabase Dashboard → Settings → API
4. Update all Edge Functions using this key
5. Review audit logs for unauthorized access

**Note**: Supabase `anon` key is designed to be public and is safe when Row Level Security (RLS) policies are properly configured.

### 3. Firebase Configuration Rotation

**Option A: Rotate Keys in Existing Project**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Project Settings
3. Navigate to Service Accounts tab
4. Generate new config (Web API Key regeneration may require support ticket)

**Option B: Create New Firebase Project** (Recommended for security):
1. Create new Firebase project
2. Enable Cloud Messaging
3. Copy all new configuration values
4. Update secrets in Lovable Cloud:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
5. Migrate existing FCM tokens (if needed)
6. Disable/delete old Firebase project

### 4. VAPID Keys Rotation

VAPID keys are used for push notifications. Both public and private keys should be rotated.

**Steps**:
1. Generate new VAPID key pair:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. This outputs:
   ```
   Public Key: BAbC123...
   Private Key: dEfG456...
   ```

3. Update public key in Lovable Cloud Secrets:
   - `VITE_VAPID_PUBLIC_KEY` = Public Key

4. Update private key in your notification service backend (if applicable)

5. **Important**: Existing push notification subscriptions will need to be re-subscribed with the new key

**Migration Strategy**:
- Keep old VAPID key active for 30 days
- Prompt users to re-enable notifications
- After 30 days, remove old key completely

### 5. Stripe Keys Rotation

**Steps**:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API Keys
3. Click "Roll" next to the secret key
4. Confirm the rollover
5. Copy the new secret key immediately
6. Update `STRIPE_SECRET_KEY` in Supabase Edge Functions Secrets
7. Update your local `.env` if needed

**For Webhook Secret**:
1. Go to Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Roll secret"
4. Update `STRIPE_WEBHOOK_SECRET` in Supabase Edge Functions Secrets

**Verification**:
```bash
# Test a payment or subscription to verify new keys work
# Check Stripe Dashboard → Events for successful webhook events
```

### 6. Other Service Keys

For any other exposed API keys:

1. **Resend (Email)**:
   - Go to Resend Dashboard → API Keys
   - Delete old key
   - Create new key
   - Update `RESEND_API_KEY` in Supabase

2. **Twilio (SMS)**:
   - Contact Twilio support to rotate Auth Token
   - Update `TWILIO_AUTH_TOKEN` in Supabase

3. **Sentry**:
   - Go to Sentry → Project Settings → Client Keys (DSN)
   - Rotate DSN
   - Update `VITE_SENTRY_DSN` in Lovable Cloud

---

## Post-Rotation Checklist

After rotating keys, verify everything works:

- [ ] All secrets updated in Lovable Cloud Secrets
- [ ] All secrets updated in Supabase Edge Functions Secrets
- [ ] Local `.env` updated (for development)
- [ ] Old keys deleted/revoked in respective service dashboards
- [ ] Application deployed with new secrets
- [ ] All features tested and working:
  - [ ] Map loads correctly
  - [ ] Push notifications work
  - [ ] Payments process successfully
  - [ ] Emails send correctly
  - [ ] SMS sends correctly (if applicable)
- [ ] No errors in browser console
- [ ] No errors in deployment logs
- [ ] No errors in Edge Function logs

---

## Preventing Future Exposure

### Development Workflow

1. **Never commit `.env` files**:
   ```bash
   # .gitignore should contain:
   .env
   .env.local
   .env*.local
   ```

2. **Always verify before committing**:
   ```bash
   git status
   git diff
   # Ensure no .env files or secrets in changes
   ```

3. **Use pre-commit hooks** (optional):
   ```bash
   # Install git-secrets or similar tool
   # Scans commits for potential secrets
   ```

### Secret Management Best Practices

1. **Use Lovable Cloud Secrets** for production
2. **Use `.env` files** only for local development
3. **Rotate keys regularly** (every 90 days recommended)
4. **Use different keys** for development and production
5. **Monitor for unauthorized access** in service dashboards
6. **Review Git history** if repository was public at any point

### If Repository Was Public

If your repository was ever public with exposed secrets:

1. **Assume all secrets are compromised**
2. **Rotate ALL keys immediately** (use procedures above)
3. **Review service logs** for unauthorized access
4. **Consider making repository private** (if not already)
5. **Use Git history rewrite** (optional, advanced):
   ```bash
   # WARNING: This rewrites Git history
   # Only do this if you understand the implications
   git filter-branch --tree-filter 'rm -f .env' HEAD
   ```

---

## Additional Security Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Git-Secrets Tool](https://github.com/awslabs/git-secrets)
- [QuaiDirect Lovable Cloud Secrets Guide](docs/LOVABLE_CLOUD_SECRETS.md)

## Environment Variables and Secrets

### Critical Security Rules

1. **Never commit secrets to the repository**
   - API keys, passwords, tokens, and other sensitive data must NEVER be committed
   - The `.env` file is excluded from git tracking via `.gitignore`
   - Always use environment variables for sensitive configuration
   - **IMPORTANT**: The `.env` file was previously committed and has been removed. All keys must be rotated.

2. **Use Lovable Cloud Secrets for production**
   - Lovable Cloud Secrets have TOP PRIORITY
   - Configure all `VITE_*` secrets in Lovable Dashboard
   - No `.env` file is used in production deployments
   - See [Lovable Cloud Secrets Guide](docs/LOVABLE_CLOUD_SECRETS.md) for complete instructions

3. **Use `.env.example` as a template for local development**
   - The `.env.example` file contains placeholder values and documentation
   - Copy `.env.example` to `.env` and fill in your actual values
   - Never commit your `.env` file
   - Local `.env` is only for development, not production

4. **Required Environment Variables**
   
   **Frontend (VITE_* prefix)**:
   ```
   # Supabase
   VITE_SUPABASE_PROJECT_ID
   VITE_SUPABASE_PUBLISHABLE_KEY
   VITE_SUPABASE_URL
   
   # Google Maps
   VITE_GOOGLE_MAPS_API_KEY
   
   # Firebase Cloud Messaging
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_FIREBASE_STORAGE_BUCKET
   
   # Push Notifications
   VITE_VAPID_PUBLIC_KEY
   
   # Optional
   VITE_SENTRY_DSN
   ```
   
   **Backend (Supabase Edge Functions)**:
   ```
   # Stripe
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   
   # Email
   RESEND_API_KEY
   
   # Internal Security
   INTERNAL_FUNCTION_SECRET
   
   # Optional: SMS
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   TWILIO_PHONE_NUMBER
   
   # Optional: Server-side APIs
   GOOGLE_MAPS_API_KEY_SERVER
   LOVABLE_API_KEY
   ```

### Setting Up Environment Variables

**For Production (Lovable Cloud)**:

1. Configure frontend secrets in Lovable Dashboard:
   - Navigate to Your Project → Secrets
   - Add all `VITE_*` variables
   - See [Lovable Cloud Secrets Guide](docs/LOVABLE_CLOUD_SECRETS.md)

2. Configure backend secrets in Supabase Dashboard:
   - Navigate to Project Settings → Edge Functions → Secrets
   - Add all backend variables (no `VITE_` prefix)
   - See [Lovable Cloud Secrets Guide](docs/LOVABLE_CLOUD_SECRETS.md)

3. Verify configuration:
   - Deploy application
   - Check browser console for errors
   - Test all features (maps, notifications, payments)

**For Local Development**:

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in the actual values in `.env`:
   - Get Supabase credentials from https://app.supabase.com
   - Generate Google Maps API key at https://console.cloud.google.com
   - Configure Firebase at https://console.firebase.google.com
   - Generate VAPID keys with: `npx web-push generate-vapid-keys`

3. Verify `.env` is not tracked:
   ```bash
   git status  # .env should not appear in tracked files
   ```

### Secret Loading Priority

**Production Deployments** (Lovable Cloud):
1. ✅ Lovable Cloud Secrets (highest priority)
2. ✅ Supabase Edge Function Secrets (backend only)
3. ❌ No `.env` file used
4. ❌ No hardcoded fallbacks

**Local Development**:
1. ✅ Local `.env` file
2. ❌ No cloud secrets accessed
3. ❌ No hardcoded fallbacks

**Important Changes**:
- Previous behavior: `.env` file committed → loaded before cloud secrets → blocked cloud configuration
- Current behavior: `.env` removed → cloud secrets have priority → proper secret management

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
