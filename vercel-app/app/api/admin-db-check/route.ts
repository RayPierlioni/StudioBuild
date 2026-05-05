import { getSupabaseAdminClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return Response.json(
        {
          ok: false,
          service: "studiobuild-admin-check",
          checkedAt: new Date().toISOString(),
          serviceRoleValid: false,
          profilesTableReachable: false,
          error: "StudioBuild admin database check could not complete.",
        },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      service: "studiobuild-admin-check",
      checkedAt: new Date().toISOString(),
      serviceRoleValid: true,
      profilesTableReachable: true,
      note: "StudioBuild server checks are passing.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "studiobuild-admin-check",
        checkedAt: new Date().toISOString(),
        serviceRoleValid: false,
        profilesTableReachable: false,
        error: "StudioBuild admin database check could not complete.",
      },
      { status: 500 },
    );
  }
}
