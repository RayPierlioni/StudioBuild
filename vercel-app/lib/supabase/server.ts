import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requiredServerEnv } from "../env";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseRuntimeConfig() {
  return {
    url: requiredServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: requiredServerEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}

export function getSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseRuntimeConfig();

  if (!cachedClient) {
    cachedClient = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return cachedClient;
}
