import { getVerifiedRequestUser } from "../../../../../lib/auth";
import { buildScenePacket, buildScenePacketDocument, parseScript } from "../../../../../lib/script-parser";
import { getSupabaseAdminClient } from "../../../../../lib/supabase/server";

type RouteContext = {
  params: { projectId: string } | Promise<{ projectId: string }>;
};

type ScenePacketPayload = {
  content?: string;
  toolStack?: string;
};

type ProjectDocument = {
  id: string;
  doc_type: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type SavedSceneBreakdown = {
  id: string;
  scene_number: number;
  scene_heading: string;
  location: string;
  time_of_day: string;
  summary: string;
  characters: string[];
  props: string[];
  wardrobe: string[];
  sound_notes: string;
  color_palette: string;
  blocking: string;
  tone: string;
  created_at: string;
  updated_at: string;
};

export const dynamic = "force-dynamic";

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

async function saveBreakdownDocument({
  content,
  projectId,
  supabase,
  userId,
}: {
  content: string;
  projectId: string;
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  userId: string;
}) {
  const { data: existingDocument, error: existingError } = await supabase
    .from("documents")
    .select("id")
    .eq("project_id", projectId)
    .eq("owner_id", userId)
    .eq("doc_type", "breakdown_notes")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const now = new Date().toISOString();
  const documentResult = existingDocument
    ? await supabase
        .from("documents")
        .update({ content, updated_at: now })
        .eq("id", existingDocument.id)
        .select("id,doc_type,content,created_at,updated_at")
        .single()
    : await supabase
        .from("documents")
        .insert({
          project_id: projectId,
          owner_id: userId,
          doc_type: "breakdown_notes",
          content,
        })
        .select("id,doc_type,content,created_at,updated_at")
        .single();

  if (documentResult.error || !documentResult.data) {
    throw new Error(documentResult.error?.message || "Unable to save scene packet document.");
  }

  return documentResult.data as ProjectDocument;
}

async function loadDocuments({
  projectId,
  supabase,
  userId,
}: {
  projectId: string;
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  userId: string;
}) {
  const { data: documents, error } = await supabase
    .from("documents")
    .select("id,doc_type,content,created_at,updated_at")
    .eq("project_id", projectId)
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (documents ?? []) as ProjectDocument[];
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const { projectId } = await context.params;
    const body = (await request.json()) as ScenePacketPayload;
    const content = cleanText(body.content);
    const toolStack = cleanText(body.toolStack);

    if (!projectId) {
      return Response.json({ ok: false, error: "Missing project ID." }, { status: 400 });
    }

    if (!content) {
      return Response.json(
        { ok: false, error: "Paste or import a scene/script before saving a scene packet." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id,title,tone")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      return Response.json(
        { ok: false, error: projectError?.message ?? "Project not found." },
        { status: 404 },
      );
    }

    const parsed = parseScript(content);
    const packets = parsed.scenes.map((scene, index) =>
      buildScenePacket(scene, index + 1, {
        projectTone: typeof project.tone === "string" ? project.tone : "",
        toolStack,
      }),
    );
    const sceneNumbers = packets.map((packet) => packet.sceneNumber);
    const { data: existingRows, error: existingRowsError } = await supabase
      .from("scene_breakdowns")
      .select("id,scene_number")
      .eq("project_id", projectId)
      .eq("owner_id", user.id)
      .in("scene_number", sceneNumbers);

    if (existingRowsError) {
      return Response.json({ ok: false, error: existingRowsError.message }, { status: 502 });
    }

    const existingByNumber = new Map<number, string>(
      (existingRows ?? []).map((row) => [Number(row.scene_number), String(row.id)]),
    );
    const savedBreakdowns: SavedSceneBreakdown[] = [];
    const now = new Date().toISOString();

    for (const packet of packets) {
      const row = {
        project_id: projectId,
        owner_id: user.id,
        scene_number: packet.sceneNumber,
        scene_heading: packet.heading,
        location: packet.location,
        time_of_day: packet.timeOfDay,
        summary: packet.summary,
        characters: packet.characters,
        props: packet.props,
        wardrobe: packet.wardrobe,
        makeup_hair: packet.makeupHair,
        set_dressing: packet.setDressing,
        vehicles: packet.vehicles,
        sound_notes: packet.soundNotes,
        color_palette: packet.colorPalette,
        blocking: packet.blocking,
        tone: packet.tone,
        updated_at: now,
      };
      const existingId = existingByNumber.get(packet.sceneNumber);
      const result = existingId
        ? await supabase
            .from("scene_breakdowns")
            .update(row)
            .eq("id", existingId)
            .select("id,scene_number,scene_heading,location,time_of_day,summary,characters,props,wardrobe,sound_notes,color_palette,blocking,tone,created_at,updated_at")
            .single()
        : await supabase
            .from("scene_breakdowns")
            .insert(row)
            .select("id,scene_number,scene_heading,location,time_of_day,summary,characters,props,wardrobe,sound_notes,color_palette,blocking,tone,created_at,updated_at")
            .single();

      if (result.error || !result.data) {
        return Response.json(
          {
            ok: false,
            error: result.error?.message || `Unable to save scene ${packet.sceneNumber}.`,
          },
          { status: 502 },
        );
      }

      savedBreakdowns.push(result.data);
    }

    const packetDocument = buildScenePacketDocument(parsed, packets, { toolStack });
    const document = await saveBreakdownDocument({
      content: packetDocument,
      projectId,
      supabase,
      userId: user.id,
    });

    await supabase
      .from("projects")
      .update({ active_stage: "breakdown", updated_at: now })
      .eq("id", projectId)
      .eq("owner_id", user.id);

    const documents = await loadDocuments({ projectId, supabase, userId: user.id });

    return Response.json({
      ok: true,
      parsed,
      sceneBreakdowns: savedBreakdowns,
      document,
      documents,
      message: `${savedBreakdowns.length} scene packet${savedBreakdowns.length === 1 ? "" : "s"} saved.`,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to save scene packet.",
      },
      { status: 401 },
    );
  }
}
