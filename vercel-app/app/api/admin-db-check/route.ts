import { getVerifiedRequestUser } from "../../../lib/auth";
import { getUserEntitlement } from "../../../lib/entitlements";
import { getSupabaseAdminClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.ENABLE_ADMIN_DB_CHECK !== "true") {
    return Response.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  try {
    const { user } = await getVerifiedRequestUser(request);
    const entitlement = await getUserEntitlement(user);

    if (!entitlement.isAdmin) {
      return Response.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return Response.json(
        {
          ok: false,
          service: "miseforge-admin-check",
          checkedAt: new Date().toISOString(),
          serviceRoleValid: false,
          profilesTableReachable: false,
          error: "MiseForge admin database check could not complete.",
        },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      service: "miseforge-admin-check",
      checkedAt: new Date().toISOString(),
      serviceRoleValid: true,
      profilesTableReachable: true,
      note: "MiseForge server checks are passing.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "miseforge-admin-check",
        checkedAt: new Date().toISOString(),
        serviceRoleValid: false,
        profilesTableReachable: false,
        error: "MiseForge admin database check could not complete.",
      },
      { status: 500 },
    );
  }
}
