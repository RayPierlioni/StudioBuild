import { getVerifiedRequestUser } from "../../../../../lib/auth";
import { getSupabaseAdminClient } from "../../../../../lib/supabase/server";

type RouteContext = {
  params: { projectId: string } | Promise<{ projectId: string }>;
};

type ProductionAssetPayload = {
  sceneBreakdownId?: string;
  assetType?: string;
};

type SceneBreakdownRecord = {
  id: string;
  scene_number: number;
  scene_heading: string;
  location: string;
  time_of_day: string;
  summary: string;
  characters: string[];
  props: string[];
  wardrobe: string[];
  set_dressing: string[];
  sound_notes: string;
  color_palette: string;
  blocking: string;
  tone: string;
};

type ProductionAsset = {
  id: string;
  project_id: string;
  scene_breakdown_id: string;
  owner_id: string;
  order_index: number;
  asset_type: string;
  name: string;
  purpose: string;
  visual: string;
  image_prompt: string;
  animation_prompt: string;
  sound_prompt: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export const dynamic = "force-dynamic";

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function firstListItem(values: string[] | undefined, fallback: string) {
  return values?.find((item) => item.trim())?.trim() || fallback;
}

function joinList(values: string[] | undefined, fallback: string) {
  return values?.length ? values.join(", ") : fallback;
}

async function loadProductionAssets({
  projectId,
  supabase,
  userId,
}: {
  projectId: string;
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  userId: string;
}) {
  const { data: productionAssets, error } = await supabase
    .from("production_assets")
    .select("id,project_id,scene_breakdown_id,owner_id,order_index,asset_type,name,purpose,visual,image_prompt,animation_prompt,sound_prompt,notes,created_at,updated_at")
    .eq("project_id", projectId)
    .eq("owner_id", userId)
    .order("scene_breakdown_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (productionAssets ?? []) as ProductionAsset[];
}

function buildInsertShotAsset(scene: SceneBreakdownRecord, orderIndex: number) {
  const heroProp = firstListItem(scene.props, "a story-specific object");
  const characters = joinList(scene.characters, "the characters");
  const wardrobe = joinList(scene.wardrobe, "current scene wardrobe");
  const setDressing = joinList(scene.set_dressing, scene.location || "the location");
  const tone = scene.tone || scene.color_palette || "restrained cinematic tension";
  const shotName = `Insert ${orderIndex}: ${heroProp}`;
  const visual = `A close insert on ${heroProp} inside ${scene.location || "the scene"} that turns the dialogue into a visible decision.`;

  return {
    asset_type: "insert_shot",
    name: shotName,
    purpose:
      "Create a concrete visual beat that externalizes the scene conflict and gives the edit a usable cutaway.",
    visual,
    image_prompt: `${visual} ${scene.time_of_day || ""}. Characters present in continuity: ${characters}. Wardrobe continuity: ${wardrobe}. Set dressing: ${setDressing}. Tone and palette: ${tone}. Cinematic, grounded, no text, no extra characters.`,
    animation_prompt: `Animate ${heroProp} as a controlled insert shot: slow push-in or subtle handheld tension, motivated by the scene blocking. Keep continuity with ${scene.scene_heading}. No new story information beyond the visual beat.`,
    sound_prompt: `Close, specific sound for ${heroProp} and the surrounding room tone. Use ${scene.sound_notes || "natural location sound"}. No music unless the story requires it.`,
    notes:
      "Generated without hosted AI. Edit this prompt card to match the exact image, animation, and sound tools you use.",
  };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const { projectId } = await context.params;
    const body = (await request.json()) as ProductionAssetPayload;
    const sceneBreakdownId = cleanText(body.sceneBreakdownId);

    if (!projectId) {
      return Response.json({ ok: false, error: "Missing project ID." }, { status: 400 });
    }

    if (!sceneBreakdownId) {
      return Response.json({ ok: false, error: "Missing scene packet ID." }, { status: 400 });
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

    const { data: sceneBreakdown, error: sceneError } = await supabase
      .from("scene_breakdowns")
      .select("id,scene_number,scene_heading,location,time_of_day,summary,characters,props,wardrobe,set_dressing,sound_notes,color_palette,blocking,tone")
      .eq("id", sceneBreakdownId)
      .eq("project_id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (sceneError || !sceneBreakdown) {
      return Response.json(
        { ok: false, error: sceneError?.message ?? "Scene packet not found." },
        { status: 404 },
      );
    }

    const { data: existingAssets, error: existingError } = await supabase
      .from("production_assets")
      .select("order_index")
      .eq("project_id", projectId)
      .eq("owner_id", user.id)
      .eq("scene_breakdown_id", sceneBreakdownId)
      .order("order_index", { ascending: false })
      .limit(1);

    if (existingError) {
      return Response.json({ ok: false, error: existingError.message }, { status: 502 });
    }

    const orderIndex = (existingAssets?.[0]?.order_index ?? 0) + 1;
    const insertShot = buildInsertShotAsset(sceneBreakdown as SceneBreakdownRecord, orderIndex);

    const { data: productionAsset, error: insertError } = await supabase
      .from("production_assets")
      .insert({
        project_id: projectId,
        scene_breakdown_id: sceneBreakdownId,
        owner_id: user.id,
        order_index: orderIndex,
        ...insertShot,
      })
      .select("id,project_id,scene_breakdown_id,owner_id,order_index,asset_type,name,purpose,visual,image_prompt,animation_prompt,sound_prompt,notes,created_at,updated_at")
      .single();

    if (insertError || !productionAsset) {
      return Response.json(
        { ok: false, error: insertError?.message ?? "Unable to create production asset." },
        { status: 502 },
      );
    }

    const productionAssets = await loadProductionAssets({ projectId, supabase, userId: user.id });

    return Response.json({
      ok: true,
      productionAsset,
      productionAssets,
      message: `${productionAsset.name} saved.`,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to create production asset.",
      },
      { status: 401 },
    );
  }
}
