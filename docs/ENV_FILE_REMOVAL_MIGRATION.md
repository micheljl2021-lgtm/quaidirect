# Migration Guide: .env File Removal

## 🚨 CRITICAL CHANGE: .env File Removed from Repository

**Date**: December 2024  
**Status**: IMMEDIATE ACTION REQUIRED

---

## What Changed

The `.env` file has been **permanently removed** from the Git repository. This file previously contained all environment variables, including sensitive API keys, and was blocking Lovable Cloud Secrets from being used.

### Before (BROKEN)

```
❌ .env file committed to Git
❌ Hardcoded fallback values in code
❌ Lovable Cloud Secrets ignored
❌ Keys exposed in Git history
❌ No way to change secrets without committing
```

### After (FIXED)

```
✅ No .env in repository
✅ No hardcoded fallbacks
✅ Lovable Cloud Secrets prioritized
✅ Clear error messages when secrets missing
✅ Easy key rotation via dashboards
```

---

## Immediate Actions Required

### For Production Deployments (Lovable Cloud)

#### 1. Configure All Secrets in Lovable Dashboard

**Required Frontend Secrets** (add in Lovable Dashboard → Secrets):

```env
VITE_SUPABASE_URL
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_GOOGLE_MAPS_API_KEY        # ⚠️ CREATE NEW KEY
VITE_FIREBASE_API_KEY
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_VAPID_PUBLIC_KEY           # ⚠️ GENERATE NEW KEY
```

**Required Backend Secrets** (add in Supabase Dashboard → Edge Functions → Secrets):

```env
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
INTERNAL_FUNCTION_SECRET
# Optional: TWILIO_*, GOOGLE_MAPS_API_KEY_SERVER, LOVABLE_API_KEY
```

See [Complete Setup Guide](./LOVABLE_CLOUD_SECRETS.md) for detailed instructions.

#### 2. Rotate All Previously Exposed Keys

**CRITICAL**: All keys that were in the old `.env` file are compromised and must be rotated:

| Service | Action Required | Priority |
|---------|----------------|----------|
| Google Maps | Create NEW API key, delete old one | 🔴 HIGH |
| Firebase | Rotate all keys or create new project | 🔴 HIGH |
| VAPID Keys | Generate new key pair | 🔴 HIGH |
| Supabase | Review if service role key exposed | 🟡 MEDIUM |
| Stripe | Roll secret and webhook keys | 🟡 MEDIUM |

See [Key Rotation Guide](../SECURITY.md#key-rotation-procedures) for step-by-step instructions.

---

### For Local Development

#### 1. Create Your Local .env File

```bash
# Copy the template
cp .env.example .env

# Edit .env and fill in your values
# DO NOT commit this file
```

#### 2. Verify .env is Not Tracked

```bash
git status
# Should NOT show .env in the list

git diff
# Should NOT show .env changes
```

#### 3. Get Your Credentials

- **Supabase**: https://app.supabase.com → Your Project → Settings → API
- **Google Maps**: https://console.cloud.google.com/apis/credentials
- **Firebase**: https://console.firebase.google.com → Project Settings
- **VAPID Keys**: Run `npx web-push generate-vapid-keys`

---

## What Happens If Secrets Are Missing

### Old Behavior (Silent Failures)

```javascript
// Old code used fallbacks
const apiKey = env.VITE_FIREBASE_API_KEY || "hardcoded-fallback-key"
// Result: App used wrong/old keys silently
```

### New Behavior (Clear Errors)

```javascript
// New code validates and fails clearly
if (!env.VITE_FIREBASE_API_KEY) {
  throw new Error(
    "[Firebase] CRITICAL: Missing VITE_FIREBASE_API_KEY. " +
    "Configure in Lovable Cloud Secrets or .env file."
  )
}
```

**Result**: Clear error in console with instructions to fix.

---

## Troubleshooting

### "Firebase CRITICAL: Missing required environment variables"

**Cause**: Firebase secrets not configured

**Solution**:
1. Check Lovable Dashboard → Secrets for all `VITE_FIREBASE_*` variables
2. Verify no typos in secret names (case-sensitive)
3. Redeploy after adding secrets

### "Google Maps API key configured ✗"

**Cause**: Google Maps key missing or invalid

**Solution**:
1. Create new key in Google Cloud Console (old one exposed)
2. Enable: Maps JavaScript API, Places API, Geocoding API
3. Restrict to your domains
4. Add to Lovable Cloud Secrets as `VITE_GOOGLE_MAPS_API_KEY`

### "Push notifications not working"

**Cause**: VAPID key missing, invalid, or using old key

**Solution**:
1. Generate new VAPID keys: `npx web-push generate-vapid-keys`
2. Add public key to Lovable Cloud as `VITE_VAPID_PUBLIC_KEY`
3. Old subscriptions may need to re-subscribe

### "Build failing in CI/CD"

**Cause**: No `.env` file in repository

**Solution**:
- For local builds: Create `.env` from `.env.example`
- For Lovable Cloud: Configure all secrets in dashboard
- For other CI: Set environment variables in CI configuration

---

## Migration Checklist

Use this checklist to ensure successful migration:

### Production (Lovable Cloud)

- [ ] All `VITE_*` secrets configured in Lovable Dashboard
- [ ] All backend secrets configured in Supabase Dashboard  
- [ ] Google Maps API key rotated (new key created)
- [ ] Firebase keys rotated (new project or keys)
- [ ] VAPID keys regenerated
- [ ] Application deployed with new secrets
- [ ] All features tested and working:
  - [ ] Maps display correctly
  - [ ] Push notifications work
  - [ ] Payments process
  - [ ] Emails send
- [ ] Old keys revoked/deleted
- [ ] No errors in browser console
- [ ] No errors in deployment logs

### Local Development

- [ ] `.env.example` copied to `.env`
- [ ] All values filled in `.env`
- [ ] `.env` NOT tracked by Git
- [ ] Application runs locally
- [ ] All features work in development

### Team Communication

- [ ] Team notified of changes
- [ ] New developers onboarded with setup guide
- [ ] Documentation links shared
- [ ] Key rotation schedule established (every 90 days)

---

## Benefits of This Change

### Security

- ✅ **No secrets in Git history** - Keys no longer exposed
- ✅ **Proper secret management** - Using industry best practices
- ✅ **Easy key rotation** - Update in dashboards, no code changes
- ✅ **Separation of concerns** - Dev and prod use different secrets

### Maintainability

- ✅ **Clear error messages** - Know immediately when secrets missing
- ✅ **Better documentation** - Complete guides for setup
- ✅ **Lovable Cloud integration** - Secrets managed properly
- ✅ **No code changes needed** - Change secrets in dashboards

### Development Workflow

- ✅ **Local .env not committed** - Each dev uses own credentials
- ✅ **Template provided** - `.env.example` has everything needed
- ✅ **Production secrets separate** - No risk of using prod in dev
- ✅ **Easier onboarding** - Clear setup instructions

---

## Additional Resources

- **[Complete Secrets Setup Guide](./LOVABLE_CLOUD_SECRETS.md)** - Detailed configuration instructions
- **[Security Policy](../SECURITY.md)** - Key rotation procedures
- **[Environment Template](../.env.example)** - All required variables
- **[Configuration Checklist](./CONFIGURATION_CHECKLIST.md)** - Deployment checklist

---

## Questions?

If you encounter issues:

1. Check browser console for specific error messages
2. Review [Troubleshooting Guide](./LOVABLE_CLOUD_SECRETS.md#troubleshooting)
3. Verify all secrets in dashboards (no typos, no extra spaces)
4. Check deployment/Edge Function logs
5. Refer to security documentation

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Secret Storage | Committed `.env` file | Lovable/Supabase dashboards |
| Priority | `.env` overrides cloud | Cloud secrets have priority |
| Fallbacks | Hardcoded in code | None (clear errors) |
| Security | Keys exposed in Git | Keys in secure storage |
| Rotation | Commit new `.env` | Update in dashboard |
| Development | Use committed `.env` | Create local `.env` from template |

**Last Updated**: December 2024  
**Status**: ✅ Migration Complete
