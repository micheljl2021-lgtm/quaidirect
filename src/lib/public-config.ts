/**
 * Configuration publique (safe côté navigateur)
 * - Utilisée en fallback quand `import.meta.env` n'est pas injecté.
 * - Ne contient AUCUN secret privé.
 */

export const FALLBACK_BACKEND_PROJECT_ID = "topqlhxdflykejrlbuqx";

export const FALLBACK_BACKEND_URL = `https://${FALLBACK_BACKEND_PROJECT_ID}.supabase.co`;

// Clé publique (anon) : nécessaire côté navigateur, OK à exposer.
export const FALLBACK_BACKEND_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcHFsaHhkZmx5a2VqcmxidXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUyNDcsImV4cCI6MjA3ODIxMTI0N30.lJu6tlpvhsUpXWCwqHJ6iVEVpSYkxBq_GZQh9ZtNpKc";

export function resolveBackendProjectId(): string {
  return import.meta.env.VITE_SUPABASE_PROJECT_ID || FALLBACK_BACKEND_PROJECT_ID;
}

export function resolveBackendUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || `https://${resolveBackendProjectId()}.supabase.co`;
}

export function resolveBackendPublishableKey(): string {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_BACKEND_PUBLISHABLE_KEY;
}
