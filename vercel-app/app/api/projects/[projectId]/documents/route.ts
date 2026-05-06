import { getVerifiedRequestUser } from "../../../../../lib/auth";
import { getSupabaseAdminClient } from "../../../../../lib/supabase/server";

const allowedDocTypes = new Set([
  "idea",
  "synopsis",
  "treatment",
  "character_bible",
  "location_bible",
  "story",
  "script",
  "dialogue_notes",
  "breakdown_notes",
]);
const allowedStages = new Set([
  "idea",
  "synopsis",
  "treatment",
  "characters",
  "locations",
  "story",
  "script",
  "dialogue",
  "breakdown",
]);

type RouteContext = {
  params: { projectId: string } | Promise<{ projectId: string }>;
};

type SaveDocumentPayload = {
  docType?: string;
  content?: string;
  activeStage?: string;
};

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const { projectId } = await context.params;
    const body = (await request.json()) as SaveDocumentPayload;
    const docType = body.docType ?? "";
    const activeStage = body.activeStage ?? "";
    const content = typeof body.content === "string" ? body.content : "";

    if (!projectId) {
      return Response.json({ ok: false, error: "Missing project ID." }, { status: 400 });
    }

    if (!allowedDocTypes.has(docType)) {
      return Response.json({ ok: false, error: "Unsupported document type." }, { status: 400 });
    }

    if (activeStage && !allowedStages.has(activeStage)) {
      return Response.json({ ok: false, error: "Unsupported project stage." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      return Response.json(
        { ok: false, error: projectError?.message ?? "Project not found." },
        { status: 404 },
      );
    }

    const { data: existingDocument, error: existingError } = await supabase
      .from("documents")
      .select("id")
      .eq("project_id", projectId)
      .eq("owner_id", user.id)
      .eq("doc_type", docType)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return Response.json({ ok: false, error: existingError.message }, { status: 502 });
    }

    const documentQuery = existingDocument
      ? supabase
          .from("documents")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", existingDocument.id)
      : supabase.from("documents").insert({
          project_id: projectId,
          owner_id: user.id,
          doc_type: docType,
          content,
        });

    const { data: document, error: documentError } = await documentQuery
      .select("id,doc_type,content,created_at,updated_at")
      .single();

    if (documentError || !document) {
      return Response.json(
        { ok: false, error: documentError?.message ?? "Unable to save document." },
        { status: 502 },
      );
    }

    if (activeStage) {
      await supabase
        .from("projects")
        .update({ active_stage: activeStage, updated_at: new Date().toISOString() })
        .eq("id", projectId)
        .eq("owner_id", user.id);
    }

    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id,doc_type,content,created_at,updated_at")
      .eq("project_id", projectId)
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (documentsError) {
      return Response.json({ ok: false, error: documentsError.message }, { status: 502 });
    }

    return Response.json({ ok: true, document, documents: documents ?? [] });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to save document.",
      },
      { status: 401 },
    );
  }
}
