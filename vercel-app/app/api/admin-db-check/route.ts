import { envStatus } from "../../../lib/env";
import { getSupabaseAdminClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = envStatus();

  try {
    const supabase = getSupabaseAdminClient();
    const { count: profileCount, error, status, statusText } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return Response.json(
        {
          ok: false,
          service: "studiobuild-admin-db-check",
          checkedAt: new Date().toISOString(),
          env,
          serviceRoleValid: false,
          profilesTableReachable: false,
          supabaseStatus: status,
          supabaseStatusText: statusText,
          error: error.message,
        },
        { status: 502 },
      );
    }

    const [{ count: projectCount }, { count: documentCount }] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("id", { count: "exact", head: true }),
    ]);

    return Response.json({
      ok: true,
      service: "studiobuild-admin-db-check",
      checkedAt: new Date().toISOString(),
      env,
      serviceRoleValid: true,
      profilesTableReachable: true,
      profileCount: profileCount ?? 0,
      projectCount: projectCount ?? 0,
      documentCount: documentCount ?? 0,
      note: "The server-only Supabase key can reach protected StudioBuild tables. No secret value is exposed.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "studiobuild-admin-db-check",
        checkedAt: new Date().toISOString(),
        env,
        serviceRoleValid: false,
        profilesTableReachable: false,
        error: error instanceof Error ? error.message : "Unknown admin database check error",
      },
      { status: 500 },
    );
  }
}
