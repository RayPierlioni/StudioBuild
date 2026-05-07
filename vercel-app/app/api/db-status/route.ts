import { getSupabaseRuntimeConfig, getSupabaseServerClient } from "../../../lib/supabase/server";

type AuthSettings = {
  external?: Record<string, boolean>;
};

export const dynamic = "force-dynamic";

export async function GET() {
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
        service: "miseforge-database",
        checkedAt: new Date().toISOString(),
        databaseClientReady: true,
        auth: {
          reachable: response.ok,
          googleProviderEnabled: Boolean(authSettings.external?.google),
        },
        database: {
          ready: true,
        },
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "miseforge-database",
        checkedAt: new Date().toISOString(),
        databaseClientReady: false,
        error: "MiseForge database check could not complete.",
      },
      { status: 500 },
    );
  }
}
