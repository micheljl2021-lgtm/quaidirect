// Runtime-safe backend client wrapper.
// Some hosting/build environments may fail to inject Vite env vars at build-time.
// This wrapper keeps the app booting by falling back to the known project URL + publishable (anon) key.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Fallbacks (safe to ship to the browser): project URL + anon/public key.
const FALLBACK_PROJECT_ID = "topqlhxdflykejrlbuqx";
const FALLBACK_URL = `https://${FALLBACK_PROJECT_ID}.supabase.co`;
const FALLBACK_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcHFsaHhkZmx5a2VqcmxidXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUyNDcsImV4cCI6MjA3ODIxMTI0N30.lJu6tlpvhsUpXWCwqHJ6iVEVpSYkxBq_GZQh9ZtNpKc";

const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const resolvedProjectId = envProjectId || FALLBACK_PROJECT_ID;

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || `https://${resolvedProjectId}.supabase.co` || FALLBACK_URL;

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
