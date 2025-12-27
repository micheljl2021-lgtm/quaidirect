# Environment Variable Validation - Troubleshooting Guide

## Overview

QuaiDirect now includes **automatic environment variable validation** that runs at application startup. This prevents the common "supabaseUrl is required" error that caused blank pages in production.

## What Changed

### Before (Problem)
- ❌ Supabase client initialized immediately without checking env vars
- ❌ Silent failures leading to blank pages
- ❌ No helpful error messages
- ❌ Difficult to debug production issues

### After (Solution)
- ✅ Environment validation runs before app initialization
- ✅ Clear error messages when variables are missing
- ✅ Improved error boundary with configuration-specific UI
- ✅ Easy to identify and fix configuration issues

## Implementation Details

### 1. Environment Validation Utility
**File**: `src/lib/validate-env.ts`

This utility validates that required environment variables are present:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Functions:
- `validateEnvironment()`: Throws error if variables are missing
- `checkEnvironment()`: Returns error object without throwing (for conditional checks)

### 2. Supabase Client Guard
**File**: `src/integrations/supabase/client.ts`

Added validation guard that checks credentials before creating the Supabase client. Provides detailed console logs showing which variables are missing.

### 3. Startup Validation
**File**: `src/main.tsx`

Calls `validateEnvironment()` at the very beginning of app initialization, before React renders. If validation fails, the error is caught by the ErrorBoundary.

### 4. Enhanced Error Boundary
**File**: `src/main.tsx`

The Sentry ErrorBoundary now shows a configuration-specific error UI when environment variables are missing, with:
- Clear error message
- Helpful instructions
- Direct link to reload the page

## Troubleshooting

### "Missing required environment variables" Error

**Symptoms:**
- Application shows error page instead of blank page
- Console shows which specific variables are missing
- Error message mentions "Lovable Cloud Settings" or ".env file"

**Solution:**

#### For Lovable Cloud Deployments:
1. Go to Lovable Dashboard → Your Project → Secrets
2. Ensure these secrets are configured:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Redeploy the application
4. Verify the secrets are visible in the Lovable dashboard

#### For Local Development:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```
3. Restart the development server:
   ```bash
   npm run dev
   ```

### "Supabase credentials are not configured" Error

**Symptoms:**
- Similar to above but error occurs when Supabase client is imported
- Console shows which specific credentials are missing

**Solution:**
Same as above - ensure the Supabase environment variables are properly configured.

### Page Loads but Supabase Features Don't Work

**Symptoms:**
- Application loads but authentication/database queries fail
- Console shows Supabase errors

**Solution:**
1. Check browser console for specific Supabase errors
2. Verify the Supabase URL and key are correct (not test/example values)
3. Check Supabase dashboard for project status
4. Verify Row Level Security (RLS) policies are configured correctly

## Testing Environment Validation

### Run Tests
```bash
npx vitest run tests/lib/validate-env.test.ts
```

### Manual Testing

1. **Test Missing Variables (Local)**:
   - Temporarily remove variables from `.env`
   - Start dev server: `npm run dev`
   - Should see clear error message

2. **Test Valid Configuration**:
   - Ensure all required variables are set
   - Start dev server: `npm run dev`
   - Application should load normally
   - Console should show: `[ENV VALIDATION] ✅ All required environment variables are configured`

3. **Test Production Build**:
   ```bash
   npm run build
   ```
   - Build should succeed if all variables are present
   - Check for any environment-related warnings

## Best Practices

### DO ✅
- Configure all required secrets in Lovable Cloud before deploying
- Use `.env.example` as a template for local development
- Check console logs for validation status
- Test the application after updating environment variables

### DON'T ❌
- Don't commit `.env` files to Git (they're in `.gitignore`)
- Don't hardcode sensitive values in the code
- Don't ignore environment validation errors
- Don't use test/example values in production

## Related Documentation

- [.env File Removal Migration](./ENV_FILE_REMOVAL_MIGRATION.md)
- [Configuration Checklist](./CONFIGURATION_CHECKLIST.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Security Guide](../SECURITY.md)

## Support

If you continue to have issues after following this guide:
1. Check the console for detailed error messages
2. Verify all secrets in Lovable Cloud dashboard
3. Review the `.env.example` file for required variables
4. Contact support with:
   - Error message from console
   - Steps you've already tried
   - Environment (Lovable Cloud / local development)
