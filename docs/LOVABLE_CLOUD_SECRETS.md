# Lovable Cloud Secrets Configuration Guide

## Overview

This guide provides a complete checklist for configuring all required secrets in Lovable Cloud for the QuaiDirect application. Proper secret configuration is critical for the application to function correctly.

## Table of Contents

1. [Why This Matters](#why-this-matters)
2. [Quick Start Checklist](#quick-start-checklist)
3. [Frontend Secrets (Lovable Cloud)](#frontend-secrets-lovable-cloud)
4. [Backend Secrets (Supabase Dashboard)](#backend-secrets-supabase-dashboard)
5. [Secret Priority & Loading Order](#secret-priority--loading-order)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## Why This Matters

**CRITICAL**: The `.env` file has been removed from the repository to prevent exposing secrets. This means:

- ✅ **Lovable Cloud Secrets are now the primary configuration method**
- ✅ **No more hardcoded fallbacks** - the app will fail clearly if secrets are missing
- ✅ **Improved security** - secrets are not exposed in Git history
- ✅ **Proper separation** - development and production use different secrets

**Important**: If you previously used the committed `.env` file, you MUST rotate all those keys as they were exposed in Git history.

---

## Quick Start Checklist

### For Lovable Cloud Deployment

1. ✅ Configure all Frontend Secrets in Lovable Dashboard
2. ✅ Configure all Backend Secrets in Supabase Dashboard
3. ✅ Verify each secret is properly set (no typos, no extra spaces)
4. ✅ Test the application to ensure all features work
5. ✅ Rotate any previously exposed keys

### For Local Development

1. ✅ Copy `.env.example` to `.env`
2. ✅ Fill in all required values in `.env`
3. ✅ Never commit your `.env` file
4. ✅ Verify with: `git status` (should not show `.env`)

---

## Frontend Secrets (Lovable Cloud)

Configure these in: **Lovable Dashboard → Your Project → Secrets**

All frontend secrets must be prefixed with `VITE_` to be accessible in the browser.

### Required Secrets

#### Supabase Configuration

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID | Extracted from URL (e.g., `abc123xyz` from `abc123xyz.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API → `anon` `public` key |

**Example Values**:
```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PROJECT_ID=yourproject
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Google Maps Configuration

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Google Cloud Console → APIs & Services → Credentials |

**⚠️ CRITICAL**: If you previously used a key from the committed `.env` file, create a NEW key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new API key
3. Restrict it to your domains (add `*.lovableproject.com/*`)
4. Enable required APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
5. Delete the old exposed key

**Example Value**:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAbcDefGhiJklMnoPqrStuvWxyZ123456
```

#### Firebase Configuration

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | Firebase Console → Project Settings → General → Web API Key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Firebase Console → Project Settings → General → Project ID |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Firebase Console → Project Settings → General (usually `{project-id}.firebaseapp.com`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Firebase Console → Project Settings → Cloud Messaging → Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | Firebase Console → Project Settings → General → App ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Firebase Console → Project Settings → General → Storage Bucket |

**Example Values**:
```
VITE_FIREBASE_API_KEY=AIzaSyBcDefGhiJklMnoPqrStuvWxYz987654
VITE_FIREBASE_PROJECT_ID=your-firebase-project
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project.firebaseapp.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-project.firebasestorage.app
```

#### Push Notifications (VAPID)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for push notifications | Generate with: `npx web-push generate-vapid-keys` |

**How to Generate**:
```bash
npx web-push generate-vapid-keys
```

This will output a public and private key pair. Use the **public key** for this secret.

**Example Value**:
```
VITE_VAPID_PUBLIC_KEY=BFlT5LESzAzzvYJTqqfN3XSZLsvIdPmS0cDn7yK0kK55Py2e3EjSp93WnRFKRaTyDlyhiSfl0OzAo0H3V6ishn4
```

#### Error Tracking (Optional)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | Sentry Dashboard → Your Project → Settings → Client Keys (DSN) |

**Example Value**:
```
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
```

---

## Backend Secrets (Supabase Dashboard)

Configure these in: **Supabase Dashboard → Your Project → Settings → Edge Functions → Secrets**

These secrets are only available to Edge Functions (server-side) and should NEVER be exposed in frontend code.

### Required Secrets

#### Stripe Configuration

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Stripe Dashboard → Developers → Webhooks → Signing secret |

**⚠️ Important**: 
- Use `sk_test_...` keys for development
- Use `sk_live_...` keys for production only

**Example Values**:
```
STRIPE_SECRET_KEY=sk_test_51AbcDefGhiJklMnoPqrStuvWxyZ123...
STRIPE_WEBHOOK_SECRET=whsec_abc123xyz...
```

#### Email Configuration

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `RESEND_API_KEY` | Resend API key for sending emails | Resend Dashboard → API Keys |

**Example Value**:
```
RESEND_API_KEY=re_abc123xyz...
```

#### Internal Security

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `INTERNAL_FUNCTION_SECRET` | Secret for securing internal edge function calls | Generate a random string (e.g., `openssl rand -base64 32`) |

**Example Value**:
```
INTERNAL_FUNCTION_SECRET=abc123xyz789randomsecurestring456def
```

#### SMS Configuration (Optional)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Twilio Console → Account Info |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Twilio Console → Phone Numbers |

**Example Values**:
```
TWILIO_ACCOUNT_SID=ACabcdefghijklmnopqrstuvwxyz123456
TWILIO_AUTH_TOKEN=abcdef123456789...
TWILIO_PHONE_NUMBER=+15551234567
```

#### Server-Side API Keys

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `GOOGLE_MAPS_API_KEY_SERVER` | Separate Google Maps key for server-side geocoding | Google Cloud Console (create a separate key with IP restrictions) |
| `LOVABLE_API_KEY` | Lovable API key (if using Lovable integrations) | Lovable Dashboard |

**Example Values**:
```
GOOGLE_MAPS_API_KEY_SERVER=AIzaSyServerSideKey123456789...
LOVABLE_API_KEY=lovable_abc123xyz...
```

### Auto-Configured Secrets

These are automatically available in Supabase Edge Functions and don't need manual configuration:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (full database access)

---

## Secret Priority & Loading Order

Understanding how secrets are loaded:

### Previous Behavior (DEPRECATED)

❌ Committed `.env` file loaded BEFORE cloud secrets  
❌ Hardcoded fallbacks used when secrets missing  
❌ Impossible to override local values with cloud secrets

### Current Behavior (CORRECT)

✅ **Lovable Cloud Secrets have TOP PRIORITY**  
✅ **Local `.env` only used in local development**  
✅ **No fallbacks** - clear errors when secrets missing  
✅ **Easy to rotate keys** - just update in Lovable/Supabase dashboards

### Loading Order

1. **Production (Lovable Cloud)**:
   - Lovable Cloud Secrets (frontend)
   - Supabase Edge Function Secrets (backend)
   - No `.env` file used

2. **Local Development**:
   - Local `.env` file
   - Must be manually created from `.env.example`
   - Never committed to Git

---

## Verification & Testing

### After Configuring Secrets

#### 1. Verify Frontend Secrets

Open browser console on your deployed app and check for error messages:

```
✅ Good: [Firebase] Config loaded successfully
✅ Good: [Google Maps] API key configured ✓
❌ Bad: [Firebase] CRITICAL: Missing required environment variables
```

#### 2. Test Each Feature

- [ ] **Maps**: Navigate to the map page - should load without errors
- [ ] **Push Notifications**: Try enabling notifications - should work
- [ ] **Payments**: Test subscription flow - should process correctly
- [ ] **SMS** (if enabled): Test SMS sending - should receive messages
- [ ] **Emails**: Test email sending - should receive emails

#### 3. Check Logs

In Lovable Dashboard, check deployment logs for configuration issues:

```bash
# Good - all secrets loaded
✓ VITE_SUPABASE_URL loaded
✓ VITE_GOOGLE_MAPS_API_KEY loaded
✓ VITE_FIREBASE_API_KEY loaded

# Bad - missing secrets
✗ VITE_FIREBASE_API_KEY not found
```

---

## Troubleshooting

### Common Issues

#### "Missing required environment variables"

**Cause**: Secret not configured in Lovable Cloud or has typo

**Solution**:
1. Check secret name exactly matches (case-sensitive)
2. Check for extra spaces in secret value
3. Verify secret is saved in correct dashboard (Lovable vs Supabase)
4. Re-deploy application after adding secrets

#### "Google Maps API key invalid"

**Cause**: 
- Key not restricted properly
- Required APIs not enabled
- Key still loading

**Solution**:
1. Verify key in Google Cloud Console
2. Enable: Maps JavaScript API, Places API, Geocoding API
3. Add domain restrictions: `*.lovableproject.com/*`
4. Wait 1-2 minutes for changes to propagate

#### "Firebase messaging not working"

**Cause**: 
- One or more Firebase config values incorrect
- VAPID key not set
- Service worker not registered

**Solution**:
1. Double-check ALL Firebase secrets
2. Verify VAPID key is the PUBLIC key (starts with 'B')
3. Check browser console for specific error
4. Ensure `/sw.js` service worker file exists

#### "Stripe webhook failed"

**Cause**:
- Webhook secret mismatch
- Stripe secret key incorrect

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` in Supabase Dashboard
2. Check webhook endpoint is configured in Stripe Dashboard
3. Verify endpoint URL matches your Edge Function URL
4. Check Supabase Edge Function logs for errors

### Still Having Issues?

1. **Check deployment logs**: Lovable Dashboard → Your Project → Logs
2. **Check edge function logs**: Supabase Dashboard → Edge Functions → Logs
3. **Check browser console**: F12 → Console tab
4. **Verify all secrets**: Go through checklist again one by one
5. **Review documentation**: See `SECURITY.md` and `.env.example`

---

## Key Rotation Procedure

If keys were previously exposed (e.g., committed to Git), you MUST rotate them:

### 1. Google Maps API Key

1. Create new key in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Restrict to your domains
3. Enable required APIs
4. Update `VITE_GOOGLE_MAPS_API_KEY` in Lovable Cloud
5. Delete old key

### 2. Firebase Keys

1. Go to [Firebase Console](https://console.firebase.google.com)
2. For security, consider creating a new Firebase project
3. Update all `VITE_FIREBASE_*` secrets
4. Generate new VAPID keys: `npx web-push generate-vapid-keys`
5. Update `VITE_VAPID_PUBLIC_KEY`

### 3. Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Roll secret key in API Keys section
3. Update `STRIPE_SECRET_KEY` in Supabase
4. Roll webhook secret
5. Update `STRIPE_WEBHOOK_SECRET` in Supabase

### 4. Other Services

Follow each service's key rotation procedure and update corresponding secrets.

---

## Additional Resources

- [QuaiDirect Security Policy](../SECURITY.md)
- [Environment Variables Template](../.env.example)
- [Configuration Checklist](./CONFIGURATION_CHECKLIST.md)
- [Lovable Documentation](https://docs.lovable.dev)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)

---

## Summary

✅ **All frontend secrets** configured in Lovable Cloud with `VITE_` prefix  
✅ **All backend secrets** configured in Supabase Dashboard (no `VITE_` prefix)  
✅ **No `.env` file committed** to Git (excluded in `.gitignore`)  
✅ **Clear error messages** when secrets are missing  
✅ **Key rotation completed** for any previously exposed keys  

**Last Updated**: December 2024
