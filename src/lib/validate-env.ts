/**
 * Environment Variables Validation
 * 
 * Validates that all required environment variables are present and configured
 * before the application starts. This prevents silent failures and provides
 * clear error messages when configuration is missing.
 * 
 * This is critical for production deployments where environment variables
 * must be configured in Lovable Cloud Secrets.
 */

export interface EnvironmentValidationError {
  missing: string[];
  message: string;
}

/**
 * Validates that all required environment variables are present
 * 
 * @throws {Error} If any required environment variables are missing
 * @returns {void}
 */
export const validateEnvironment = (): void => {
  const required = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(
      `❌ CRITICAL: Missing required environment variables:\n${missing.join('\n')}\n\n` +
      `Configure these in Lovable Cloud Settings → Secrets:\n` +
      `- VITE_SUPABASE_URL\n` +
      `- VITE_SUPABASE_PUBLISHABLE_KEY\n\n` +
      `Or add to .env file for local development.`
    );
    
    // Log to console for debugging
    console.error('[ENV VALIDATION] Failed:', {
      missing,
      currentEnv: {
        VITE_SUPABASE_URL: required.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        VITE_SUPABASE_PUBLISHABLE_KEY: required.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
      }
    });
    
    throw error;
  }

  console.log('[ENV VALIDATION] ✅ All required environment variables are configured');
};

/**
 * Checks environment validation without throwing
 * Useful for conditional checks
 * 
 * @returns {EnvironmentValidationError | null} Error object if validation fails, null otherwise
 */
export const checkEnvironment = (): EnvironmentValidationError | null => {
  const required = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    return {
      missing,
      message: `Missing required environment variables: ${missing.join(', ')}`
    };
  }

  return null;
};
