import { getVerifiedRequestUser } from "../../../../lib/auth";
import { getUserEntitlement } from "../../../../lib/entitlements";
import { getSupabaseAdminClient } from "../../../../lib/supabase/server";

type RouteContext = {
  params: { projectId: string } | Promise<{ projectId: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const { projectId } = await context.params;

    if (!projectId) {
      return Response.json({ ok: false, error: "Missing project ID." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const entitlement = await getUserEntitlement(user);
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id,title,genre,tone,logline,inspirations,active_stage,notes,created_at,updated_at")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      return Response.json(
        { ok: false, error: projectError?.message ?? "Project not found." },
        { status: 404 },
      );
    }

    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id,doc_type,content,created_at,updated_at")
      .eq("project_id", project.id)
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (documentsError) {
      return Response.json({ ok: false, error: documentsError.message }, { status: 502 });
    }

    let sceneBreakdownsQuery = supabase
      .from("scene_breakdowns")
      .select("id,scene_number,scene_heading,location,time_of_day,summary,characters,props,wardrobe,makeup_hair,set_dressing,vehicles,sound_notes,color_palette,blocking,tone,created_at,updated_at")
      .eq("project_id", project.id)
      .eq("owner_id", user.id)
      .order("scene_number", { ascending: true });

    if (!entitlement.isPro) {
      sceneBreakdownsQuery = sceneBreakdownsQuery.limit(1);
    }

    const { data: sceneBreakdowns, error: sceneBreakdownsError } = await sceneBreakdownsQuery;

    if (sceneBreakdownsError) {
      return Response.json({ ok: false, error: sceneBreakdownsError.message }, { status: 502 });
    }

    const productionAssetsResult = entitlement.isPro
      ? await supabase
          .from("production_assets")
          .select("id,project_id,scene_breakdown_id,owner_id,order_index,asset_type,name,purpose,visual,image_prompt,animation_prompt,sound_prompt,notes,created_at,updated_at")
          .eq("project_id", project.id)
          .eq("owner_id", user.id)
          .order("scene_breakdown_id", { ascending: true })
          .order("order_index", { ascending: true })
      : { data: [], error: null };

    if (productionAssetsResult.error) {
      return Response.json({ ok: false, error: productionAssetsResult.error.message }, { status: 502 });
    }

    return Response.json({
      ok: true,
      entitlement,
      project,
      documents: documents ?? [],
      sceneBreakdowns: sceneBreakdowns ?? [],
      productionAssets: productionAssetsResult.data ?? [],
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load project.",
      },
      { status: 401 },
    );
  }
}
