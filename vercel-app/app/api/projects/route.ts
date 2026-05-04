import { getVerifiedRequestUser } from "../../../lib/auth";
import { getSupabaseAdminClient } from "../../../lib/supabase/server";

type ProjectPayload = {
  title?: string;
  genre?: string;
  tone?: string;
  logline?: string;
  inspirations?: string[];
  notes?: string;
  initialContent?: string;
};

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanInspirations(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const supabase = getSupabaseAdminClient();

    const { data: projects, error } = await supabase
      .from("projects")
      .select("id,title,genre,tone,logline,inspirations,active_stage,notes,created_at,updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 502 });
    }

    return Response.json({ ok: true, projects: projects ?? [] });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load projects.",
      },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const body = (await request.json()) as ProjectPayload;
    const title = cleanText(body.title, "Untitled Project");

    if (title.length < 2) {
      return Response.json({ ok: false, error: "Project title is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        title,
        genre: cleanText(body.genre),
        tone: cleanText(body.tone),
        logline: cleanText(body.logline),
        inspirations: cleanInspirations(body.inspirations),
        notes: cleanText(body.notes),
        active_stage: "idea",
      })
      .select("id,title,genre,tone,logline,inspirations,active_stage,notes,created_at,updated_at")
      .single();

    if (projectError || !project) {
      return Response.json(
        { ok: false, error: projectError?.message ?? "Unable to save project." },
        { status: 502 },
      );
    }

    const initialContent = cleanText(body.initialContent);
    let document = null;

    if (initialContent) {
      const { data: savedDocument, error: documentError } = await supabase
        .from("documents")
        .insert({
          project_id: project.id,
          owner_id: user.id,
          doc_type: "idea",
          content: initialContent,
        })
        .select("id,doc_type,content,created_at,updated_at")
        .single();

      if (documentError) {
        return Response.json(
          {
            ok: false,
            error: `Project saved, but the starter document failed: ${documentError.message}`,
            project,
          },
          { status: 502 },
        );
      }

      document = savedDocument;
    }

    return Response.json({ ok: true, project, document }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to save project.",
      },
      { status: 401 },
    );
  }
}
