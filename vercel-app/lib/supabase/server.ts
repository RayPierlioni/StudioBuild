import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requiredServerEnv } from "../env";

let cachedClient: SupabaseClient | null = null;
let cachedAdminClient: SupabaseClient | null = null;

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

export function getSupabaseAdminClient() {
  const url = requiredServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return cachedAdminClient;
}
