// Runtime-safe Supabase client wrapper.
// We avoid depending solely on VITE_SUPABASE_URL because some build environments may not inject it.
// Instead, we derive the URL from VITE_SUPABASE_PROJECT_ID (when available).

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

// Prefer explicit URL, otherwise derive from project id.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (projectId ? `https://${projectId}.supabase.co` : "");

const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Backend URL is missing (VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID)."
  );
}

if (!supabasePublishableKey) {
  throw new Error("Backend publishable key is missing (VITE_SUPABASE_PUBLISHABLE_KEY).");
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
