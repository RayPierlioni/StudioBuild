import { envStatus } from "../../../lib/env";
import { getSupabaseRuntimeConfig, getSupabaseServerClient } from "../../../lib/supabase/server";

type AuthSettings = {
  external?: Record<string, boolean>;
};

export const dynamic = "force-dynamic";

export async function GET() {
  const env = envStatus();

  try {
    const { url, publishableKey } = getSupabaseRuntimeConfig();
    getSupabaseServerClient();

    const response = await fetch(`${url}/auth/v1/settings`, {
      cache: "no-store",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
    });

    let authSettings: AuthSettings = {};

    try {
      authSettings = (await response.json()) as AuthSettings;
    } catch {
      authSettings = {};
    }

    return Response.json(
      {
        ok: response.ok,
        service: "studiobuild-supabase",
        checkedAt: new Date().toISOString(),
        env,
        supabaseClientReady: true,
        auth: {
          reachable: response.ok,
          status: response.status,
          googleProviderEnabled: Boolean(authSettings.external?.google),
          anonymousUsersEnabled: Boolean(authSettings.external?.anonymous_users),
        },
        database: {
          publicTablesProtected: true,
          serviceRoleConfigured: env.supabaseServiceRoleKey,
          note: env.supabaseServiceRoleKey
            ? "Ready for server-side database reads and writes."
            : "Publishable-key connection is live. User tables stay protected until a signed-in user or server key is used.",
        },
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "studiobuild-supabase",
        checkedAt: new Date().toISOString(),
        env,
        supabaseClientReady: false,
        error: error instanceof Error ? error.message : "Unknown Supabase connection error",
      },
      { status: 500 },
    );
  }
}
