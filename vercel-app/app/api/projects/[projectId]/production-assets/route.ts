import { getVerifiedRequestUser } from "../../../../../lib/auth";
import { getUserEntitlement } from "../../../../../lib/entitlements";
import { getSupabaseAdminClient } from "../../../../../lib/supabase/server";

type RouteContext = {
  params: { projectId: string } | Promise<{ projectId: string }>;
};

type ProductionAssetAction = "insert_shot" | "shot_list" | "image_prompt" | "animation_prompt";

type ProductionAssetPayload = {
  action?: ProductionAssetAction;
  sceneBreakdownId?: string;
  productionAssetId?: string;
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

function sceneTone(scene: SceneBreakdownRecord) {
  return scene.tone || scene.color_palette || "restrained cinematic tension";
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
  const tone = sceneTone(scene);
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
      "Edit this prompt card to match the exact image, animation, and sound tools you use.",
  };
}

function buildDetailedShotList(scene: SceneBreakdownRecord) {
  const location = scene.location || "the location";
  const timeOfDay = scene.time_of_day || "the scene time";
  const characters = scene.characters?.filter(Boolean) ?? [];
  const firstCharacter = characters[0] || "the lead character";
  const secondCharacter = characters[1] || "the opposing character";
  const heroProp = firstListItem(scene.props, "the key story object");
  const tone = sceneTone(scene);
  const blocking = scene.blocking || "Use the scene blocking to track entrances, exits, eyelines, and distance shifts.";

  return [
    {
      asset_type: "shot",
      name: "Shot 1: Establish geography and pressure",
      purpose: "Orient the viewer before the emotional beat starts.",
      visual: `Wide or controlled medium-wide of ${location} at ${timeOfDay}, showing the practical light, blocking space, and the pressure around ${firstCharacter}.`,
      image_prompt: "",
      animation_prompt: "",
      sound_prompt: "",
      notes: `Shot-list page. Tone: ${tone}. ${blocking}`,
    },
    {
      asset_type: "shot",
      name: `Shot 2: ${firstCharacter} intention`,
      purpose: "Make the character want visible before the line lands.",
      visual: `Medium close coverage on ${firstCharacter}, framed around the object or doorway that matters most to the scene.`,
      image_prompt: "",
      animation_prompt: "",
      sound_prompt: "",
      notes: "Generate the image prompt first, then unlock animation, sound design, and dialogue timing.",
    },
    {
      asset_type: "shot",
      name: `Shot 3: ${secondCharacter} response`,
      purpose: "Give the edit a clean counter-beat so the scene has pressure instead of exposition.",
      visual: `Reverse or complementary angle on ${secondCharacter}, with eyeline continuity back to ${firstCharacter} and the central story object.`,
      image_prompt: "",
      animation_prompt: "",
      sound_prompt: "",
      notes: "Keep camera language consistent with the previous shot.",
    },
    {
      asset_type: "shot",
      name: "Shot 4: Distance shift",
      purpose: "Turn the scene from talking into behavior by showing how the characters move or refuse to move.",
      visual: `Two-shot or profile angle that shows the distance between ${firstCharacter} and ${secondCharacter}, with ${heroProp} visible when possible.`,
      image_prompt: "",
      animation_prompt: "",
      sound_prompt: "",
      notes: "Use this as the bridge into an insert shot when the scene needs a concrete visual beat.",
    },
    {
      asset_type: "shot",
      name: `Shot 5: Insert on ${heroProp}`,
      purpose: "Justify the insert-shot workflow by giving the edit one specific object, texture, or action to cut to.",
      visual: `Close insert of ${heroProp} inside ${location}, designed to externalize the scene conflict without adding explanation.`,
      image_prompt: "",
      animation_prompt: "",
      sound_prompt: "",
      notes: "This is the row that naturally connects to the I need another insert shot button.",
    },
    {
      asset_type: "shot",
      name: "Shot 6: Final emotional beat",
      purpose: "End the scene with a visual decision, not a purely verbal explanation.",
      visual: `A held frame after the last line where the blocking, object placement, or character silence shows what changed in the scene.`,
      image_prompt: "",
      animation_prompt: "",
      sound_prompt: "",
      notes: "Use dialogue timing only where it supports the final beat.",
    },
  ];
}

function buildImagePrompt(scene: SceneBreakdownRecord, asset: ProductionAsset) {
  const characters = joinList(scene.characters, "the characters");
  const wardrobe = joinList(scene.wardrobe, "current scene wardrobe");
  const props = joinList(scene.props, "story-specific props");
  const setDressing = joinList(scene.set_dressing, scene.location || "the location");
  const tone = sceneTone(scene);

  return [
    `${asset.name}. ${asset.visual}`,
    `Scene: ${scene.scene_heading}. Location: ${scene.location || "unspecified"} at ${scene.time_of_day || "unspecified time"}.`,
    `Characters in continuity: ${characters}. Wardrobe: ${wardrobe}. Props: ${props}. Set dressing: ${setDressing}.`,
    `Color and feel: ${tone}. Cinematic, natural physical texture, motivated lighting, no text, no captions, no extra characters, no distorted hands.`,
  ].join(" ");
}

function buildAnimationPrompt(scene: SceneBreakdownRecord, asset: ProductionAsset) {
  const characters = joinList(scene.characters, "the characters");
  const sound = scene.sound_notes || "room tone, close physical sounds, and location texture";
  const blocking = scene.blocking || "follow the scene blocking and preserve eyelines";

  return {
    animation_prompt: [
      `${asset.name}. Animate the image as a usable film shot, not a flashy trailer shot.`,
      `Motion: controlled camera movement, subtle performance behavior, and continuity with ${scene.scene_heading}.`,
      `Blocking: ${blocking}. Characters: ${characters}.`,
      "Dialogue timing: preserve the exact script dialogue for this shot when available, keep lip movement restrained and believable, and leave room for natural pauses.",
      "Do not add new characters, new props, extra story events, subtitles, or music unless the story specifically calls for it.",
    ].join(" "),
    sound_prompt: [
      `Sound design for ${asset.name}: ${sound}.`,
      "Layer dialogue cleanly over practical room tone. Add specific object sounds, foot movement, cloth movement, breathing, and silence where the beat needs pressure.",
      "No music unless the scene absolutely requires it.",
    ].join(" "),
  };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const { projectId } = await context.params;
    const body = (await request.json()) as ProductionAssetPayload;
    const sceneBreakdownId = cleanText(body.sceneBreakdownId);
    const productionAssetId = cleanText(body.productionAssetId);
    const action = body.action ?? (body.assetType === "insert_shot" ? "insert_shot" : "insert_shot");

    if (!projectId) {
      return Response.json({ ok: false, error: "Missing project ID." }, { status: 400 });
    }

    if (!sceneBreakdownId) {
      return Response.json({ ok: false, error: "Missing scene packet ID." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const entitlement = await getUserEntitlement(user);
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

    if (!entitlement.isPro) {
      return Response.json(
        {
          ok: false,
          entitlement,
          error:
            "Production assets are a Founder Pro feature. Upgrade to unlock detailed shot lists, insert shots, image prompts, animation prompts, sound prompts, and premium packet export.",
        },
        { status: 402 },
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

    if (action === "shot_list") {
      const shotRows = buildDetailedShotList(sceneBreakdown as SceneBreakdownRecord);
      const { data: existingShots, error: existingShotsError } = await supabase
        .from("production_assets")
        .select("id,order_index")
        .eq("project_id", projectId)
        .eq("owner_id", user.id)
        .eq("scene_breakdown_id", sceneBreakdownId)
        .eq("asset_type", "shot")
        .order("order_index", { ascending: true });

      if (existingShotsError) {
        return Response.json({ ok: false, error: existingShotsError.message }, { status: 502 });
      }

      const existing = existingShots ?? [];

      for (const [index, shot] of shotRows.entries()) {
        const orderIndex = index + 1;
        const existingShot = existing[index];

        if (existingShot) {
          const { error: updateError } = await supabase
            .from("production_assets")
            .update({
              order_index: orderIndex,
              name: shot.name,
              purpose: shot.purpose,
              visual: shot.visual,
              notes: shot.notes,
            })
            .eq("id", existingShot.id)
            .eq("project_id", projectId)
            .eq("owner_id", user.id);

          if (updateError) {
            return Response.json({ ok: false, error: updateError.message }, { status: 502 });
          }
        } else {
          const { error: insertError } = await supabase.from("production_assets").insert({
            project_id: projectId,
            scene_breakdown_id: sceneBreakdownId,
            owner_id: user.id,
            order_index: orderIndex,
            ...shot,
          });

          if (insertError) {
            return Response.json({ ok: false, error: insertError.message }, { status: 502 });
          }
        }
      }

      const productionAssets = await loadProductionAssets({ projectId, supabase, userId: user.id });

      return Response.json({
        ok: true,
        entitlement,
        productionAssets,
        message: `Detailed shot list saved for scene ${(sceneBreakdown as SceneBreakdownRecord).scene_number}.`,
      });
    }

    if (action === "image_prompt" || action === "animation_prompt") {
      if (!productionAssetId) {
        return Response.json({ ok: false, error: "Missing shot ID." }, { status: 400 });
      }

      const { data: productionAsset, error: assetError } = await supabase
        .from("production_assets")
        .select("id,project_id,scene_breakdown_id,owner_id,order_index,asset_type,name,purpose,visual,image_prompt,animation_prompt,sound_prompt,notes,created_at,updated_at")
        .eq("id", productionAssetId)
        .eq("project_id", projectId)
        .eq("scene_breakdown_id", sceneBreakdownId)
        .eq("owner_id", user.id)
        .single();

      if (assetError || !productionAsset) {
        return Response.json(
          { ok: false, error: assetError?.message ?? "Shot not found." },
          { status: 404 },
        );
      }

      const updates =
        action === "image_prompt"
          ? {
              image_prompt: buildImagePrompt(
                sceneBreakdown as SceneBreakdownRecord,
                productionAsset as ProductionAsset,
              ),
            }
          : buildAnimationPrompt(
              sceneBreakdown as SceneBreakdownRecord,
              productionAsset as ProductionAsset,
            );

      const { error: updateError } = await supabase
        .from("production_assets")
        .update(updates)
        .eq("id", productionAssetId)
        .eq("project_id", projectId)
        .eq("owner_id", user.id);

      if (updateError) {
        return Response.json({ ok: false, error: updateError.message }, { status: 502 });
      }

      const productionAssets = await loadProductionAssets({ projectId, supabase, userId: user.id });

      return Response.json({
        ok: true,
        entitlement,
        productionAssets,
        message:
          action === "image_prompt"
            ? `${(productionAsset as ProductionAsset).name} image prompt saved.`
            : `${(productionAsset as ProductionAsset).name} animation, sound, and dialogue prompt saved.`,
      });
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
      entitlement,
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
