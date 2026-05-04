import { getVerifiedRequestUser } from "../../../../lib/auth";
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

    return Response.json({ ok: true, project, documents: documents ?? [] });
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
