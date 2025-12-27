// Runtime-safe backend client wrapper.
// Some hosting/build environments may fail to inject Vite env vars at build-time.
// This wrapper keeps the app booting by falling back to the known project URL + publishable (anon) key.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { resolveBackendUrl, resolveBackendPublishableKey } from "@/lib/public-config";

const supabaseUrl = resolveBackendUrl();
const supabasePublishableKey = resolveBackendPublishableKey();

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

