"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import { clearAuthReturnState, getPendingAuthDiagnostic, rememberAuthReturnPath } from "./auth-handler";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";

export type Project = {
  id: string;
  title: string;
  genre: string;
  tone: string;
  logline: string;
  inspirations: string[];
  active_stage: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

type StageId =
  | "idea"
  | "treatment"
  | "characters"
  | "locations"
  | "lookbook"
  | "script"
  | "dialogue"
  | "continuity"
  | "breakdown"
  | "schedule"
  | "sound"
  | "production";
type DocType =
  | "idea"
  | "synopsis"
  | "treatment"
  | "character_bible"
  | "location_bible"
  | "look_book"
  | "story"
  | "script"
  | "dialogue_notes"
  | "continuity_tracker"
  | "breakdown_notes"
  | "production_schedule"
  | "sound_map";
export type StartMode = "dashboard" | StageId | "shotlist" | "prompts" | "packet";
type GenerateMode =
  | "treatment"
  | "script"
  | "breakdown"
  | "production"
  | "improve"
  | "dialogue"
  | "lookbook"
  | "schedule"
  | "sound"
  | "insert_shot"
  | "structure";

export type ProjectDocument = {
  id: string;
  doc_type: DocType;
  content: string;
  created_at: string;
  updated_at: string;
};

export type SceneBreakdown = {
  id: string;
  scene_number: number;
  scene_heading: string;
  location: string;
  time_of_day: string;
  summary: string;
  characters: string[];
  props: string[];
  wardrobe: string[];
  makeup_hair: string[];
  set_dressing: string[];
  vehicles: string[];
  sound_notes: string;
  color_palette: string;
  blocking: string;
  tone: string;
  created_at: string;
  updated_at: string;
};

export type ProductionAsset = {
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

type ScenePacketResponse = {
  ok: boolean;
  sceneBreakdowns?: SceneBreakdown[];
  document?: ProjectDocument;
  documents?: ProjectDocument[];
  message?: string;
  error?: string;
};

type ScenePacketEditResponse = {
  ok: boolean;
  sceneBreakdown?: SceneBreakdown;
  sceneBreakdowns?: SceneBreakdown[];
  message?: string;
  error?: string;
};

type ProductionAssetResponse = {
  ok: boolean;
  productionAsset?: ProductionAsset;
  productionAssets?: ProductionAsset[];
  message?: string;
  error?: string;
};

type SceneBreakdownDraft = {
  scene_heading: string;
  location: string;
  time_of_day: string;
  summary: string;
  characters: string;
  props: string;
  wardrobe: string;
  makeup_hair: string;
  set_dressing: string;
  vehicles: string;
  sound_notes: string;
  color_palette: string;
  blocking: string;
  tone: string;
};

type ProjectForm = {
  title: string;
  genre: string;
  tone: string;
  logline: string;
  inspirations: string;
  initialContent: string;
};

type LocalVersion = {
  id: string;
  label: string;
  docType: DocType;
  stageLabel: string;
  content: string;
  createdAt: string;
};

type DialogueFlag = {
  category: string;
  evidence: string;
  fix: string;
  label: string;
  lineNumber?: number;
  severity: "High" | "Medium" | "Low";
};

type DialogueLineEntry = {
  character: string;
  line: string;
  lineNumber: number;
  wordCount: number;
};

type DialogueLineNote = {
  character: string;
  issue: string;
  line: string;
  lineNumber: number;
  rewriteMove: string;
  subtextTest: string;
  tactic: string;
};

type DialogueScoreCard = {
  detail: string;
  label: string;
  score: number;
  status: string;
};

type DialogueCharacterVoice = {
  assignment: string;
  averageWords: number;
  lineCount: number;
  name: string;
  risk: string;
};

type StoryDiagnostic = {
  detail: string;
  isReady: boolean;
  label: string;
  next: string;
};

type DialogueScan = {
  averageWordsPerLine: number;
  characterCount: number;
  characterVoices: DialogueCharacterVoice[];
  dialogueLineCount: number;
  flags: DialogueFlag[];
  lineNotes: DialogueLineNote[];
  nextRewritePass: string;
  prompt: string;
  rubric: string[];
  scoreCards: DialogueScoreCard[];
  score: number;
  sourceExcerpt: string;
  strengths: string[];
  wordCount: number;
  rewriteMoves: string[];
};

export type AccessEntitlement = {
  isAdmin: boolean;
  isPro: boolean;
  planLabel: "Admin" | "Founder Pro" | "Free";
  status: string;
};

type ProjectUsage = {
  projectCount: number;
  freeProjectLimit: number;
};

export type GuideAssistantContext = {
  activeStageLabel: string;
  assetCount: number;
  body: string;
  chips?: string[];
  eyebrow: string;
  nextAction: string;
  planLabel: string;
  projectTitle?: string;
  readinessScore: number;
  sceneCount: number;
  speech: string;
  title: string;
};

type GuideRoute = {
  href: string;
  label: string;
  text: string;
};

type GuideChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type CharacterContinuityProfile = {
  appearances: SceneBreakdown[];
  coCharacters: string[];
  locations: string[];
  missing: string[];
  name: string;
  productionAssets: ProductionAsset[];
  props: string[];
  readiness: number;
  sceneLabels: string[];
  soundNotes: string[];
  toneNotes: string[];
  wardrobe: string[];
};

type LocationContinuityProfile = {
  blockingNotes: string[];
  characters: string[];
  colorNotes: string[];
  missing: string[];
  name: string;
  productionAssets: ProductionAsset[];
  props: string[];
  readiness: number;
  sceneLabels: string[];
  scenes: SceneBreakdown[];
  setDressing: string[];
  soundNotes: string[];
  timeOfDays: string[];
  wardrobe: string[];
};

type ContinuityTrackerRow = {
  blocking: string;
  characters: string[];
  colorState: string;
  id: string;
  location: string;
  missing: string[];
  previousSceneLabel: string;
  props: string[];
  readiness: number;
  riskFlags: string[];
  sceneLabel: string;
  setDressing: string[];
  soundState: string;
  timeOfDay: string;
  wardrobe: string[];
};

type ContinuityItemProfile = {
  id: string;
  label: string;
  locations: string[];
  risk: string;
  sceneLabels: string[];
  type: "Prop" | "Wardrobe" | "Set dressing";
};

type ShotMetadata = {
  action: string;
  angle: string;
  continuity: string;
  dialogueSound: string;
  duration: string;
  lens: string;
  movement: string;
  shotType: string;
};

type VisualStyleRule = {
  anchors: string[];
  body: string;
  id: string;
  readiness: number;
  status: string;
  title: string;
};

type GenerationLockPhase = {
  detail: string;
  id: string;
  isReady: boolean;
  items: string[];
  label: string;
  status: string;
};

type GenerationQueueItem = {
  blocker: string;
  id: string;
  kind: string;
  label: string;
  nextAction: string;
  priority: "High" | "Medium" | "Low";
  status: string;
};

type SoundLayerCard = {
  detail: string;
  id: string;
  isReady: boolean;
  items: string[];
  label: string;
  status: string;
};

type SoundScenePlan = {
  animationHandoff: string;
  blockers: string[];
  dialogueRule: string;
  foleyRule: string;
  id: string;
  label: string;
  locationTime: string;
  priority: "High" | "Medium" | "Low";
  readiness: number;
  roomTone: string;
  silenceRule: string;
  soundPromptCount: number;
  status: string;
};

type VisualSceneProfile = {
  cameraRule: string;
  colorState: string;
  id: string;
  lightingRule: string;
  locationTime: string;
  missing: string[];
  motif: string;
  negativeRisk: string;
  readiness: number;
  sceneLabel: string;
};

const freeEntitlement: AccessEntitlement = {
  isAdmin: false,
  isPro: false,
  planLabel: "Free",
  status: "free",
};

const defaultUsage: ProjectUsage = {
  projectCount: 0,
  freeProjectLimit: 1,
};

const proFeatureList = [
  "Multiple projects",
  "Logline Lab",
  "Treatment Blueprint",
  "Full-script scene parsing",
  "Character Bible",
  "Location Bible",
  "Visual Look Book",
  "Production board",
  "Local version history",
  "AI voice scanner",
  "Continuity tracker",
  "Detailed shot lists",
  "Production schedule",
  "Sound Design Map",
  "Insert-shot prompt cards",
  "Image, animation, sound prompts",
  "Premium PDF packet export",
];

const startModeCopy: Record<
  StartMode,
  {
    eyebrow: string;
    heading: string;
    helper: string;
    starterLabel: string;
    starterPlaceholder: string;
    submitLabel: string;
  }
> = {
  dashboard: {
    eyebrow: "Live workspace",
    heading: "Your MiseForge dashboard.",
    helper: "Create a project, open a saved film, or move into the production pipeline.",
    starterLabel: "Starter idea",
    starterPlaceholder: "Paste the rough idea, opening beat, or script fragment here.",
    submitLabel: "Save Project",
  },
  idea: {
    eyebrow: "Idea start",
    heading: "Start from the first spark.",
    helper: "Begin with a premise, tone, genre, and logline. MiseForge will help turn it into a workable film path.",
    starterLabel: "Idea seed",
    starterPlaceholder: "Describe the film idea, central character, world, conflict, or first image you cannot stop thinking about.",
    submitLabel: "Create Idea Project",
  },
  script: {
    eyebrow: "Script intake",
    heading: "Bring in pages you already have.",
    helper: "Create a project shell first, then paste or import your script pages so MiseForge can organize the next production steps.",
    starterLabel: "Script fragment",
    starterPlaceholder: "Paste the opening scene, rough pages, or script section you want to improve and break down.",
    submitLabel: "Create Script Project",
  },
  dialogue: {
    eyebrow: "Dialogue cleanup",
    heading: "Bring in dialogue that needs a human pass.",
    helper: "Paste pages or dialogue you already have. MiseForge will open the script room so you can scan for AI voice, exposition, and weak subtext.",
    starterLabel: "Dialogue or script pages",
    starterPlaceholder: "Paste the dialogue, scene, or script section you want to test for AI voice, subtext, and playable behavior.",
    submitLabel: "Create Dialogue Project",
  },
  breakdown: {
    eyebrow: "Breakdown builder",
    heading: "Turn scenes into production needs.",
    helper: "Create the project first, then use scene packets to map characters, props, wardrobe, sound, inserts, and shot-list work.",
    starterLabel: "Scene to break down",
    starterPlaceholder: "Paste a scene that needs a breakdown, including slugline, action, and dialogue if you have it.",
    submitLabel: "Create Breakdown Project",
  },
  treatment: {
    eyebrow: "Treatment start",
    heading: "Start from a story map you already have.",
    helper: "Paste your rough synopsis, outline, or treatment notes. MiseForge will open the treatment room so you can shape it into a stronger blueprint.",
    starterLabel: "Treatment or outline",
    starterPlaceholder: "Paste your synopsis, outline, beat sheet, or treatment draft.",
    submitLabel: "Create Treatment Project",
  },
  characters: {
    eyebrow: "Character start",
    heading: "Start with the people in the film.",
    helper: "Paste character notes, casting thoughts, look references, or relationship ideas. MiseForge will open the character bible room.",
    starterLabel: "Character notes",
    starterPlaceholder: "Paste character descriptions, wardrobe notes, speech patterns, relationships, or visual continuity references.",
    submitLabel: "Create Character Project",
  },
  locations: {
    eyebrow: "Location start",
    heading: "Start with the world and recurring places.",
    helper: "Paste location notes, set dressing, lighting direction, or visual rules. MiseForge will open the location bible room.",
    starterLabel: "Location notes",
    starterPlaceholder: "Paste location descriptions, layout notes, lighting rules, set dressing, room tone, or continuity risks.",
    submitLabel: "Create Location Project",
  },
  lookbook: {
    eyebrow: "Look book start",
    heading: "Start from the visual language.",
    helper: "Paste references, palette notes, camera rules, or mood-board thoughts. MiseForge will open the look book room.",
    starterLabel: "Visual language notes",
    starterPlaceholder: "Paste reference films, palette ideas, lighting rules, lens feeling, motifs, or negative prompt rules.",
    submitLabel: "Create Look Book Project",
  },
  continuity: {
    eyebrow: "Continuity start",
    heading: "Start with what must stay consistent.",
    helper: "Paste continuity risks or cross-scene notes. MiseForge will open the continuity tracker room.",
    starterLabel: "Continuity notes",
    starterPlaceholder: "Paste prop, wardrobe, character state, location state, lighting, sound, or timeline continuity notes.",
    submitLabel: "Create Continuity Project",
  },
  schedule: {
    eyebrow: "Schedule start",
    heading: "Start from production order.",
    helper: "Paste your planned generation order, deadline, or workflow stack. MiseForge will open the production schedule room.",
    starterLabel: "Production order notes",
    starterPlaceholder: "Paste generation order, tool handoffs, review gates, deadlines, or production sprint notes.",
    submitLabel: "Create Schedule Project",
  },
  sound: {
    eyebrow: "Sound start",
    heading: "Start from the sound world.",
    helper: "Paste room tone, foley, dialogue, effects, or silence notes. MiseForge will open the sound map room.",
    starterLabel: "Sound design notes",
    starterPlaceholder: "Paste room tone, foley, dialogue space, effects, silence, mix references, or sound continuity notes.",
    submitLabel: "Create Sound Map Project",
  },
  production: {
    eyebrow: "Production start",
    heading: "Start from the production plan.",
    helper: "Paste production notes, prompt needs, or asset lists. MiseForge will open the production room.",
    starterLabel: "Production notes",
    starterPlaceholder: "Paste production checklist items, asset needs, prompts, insert shots, or workflow notes.",
    submitLabel: "Create Production Project",
  },
  shotlist: {
    eyebrow: "Shot list start",
    heading: "Start from the shots you already know.",
    helper: "Paste shot ideas, coverage notes, inserts, or camera movement. MiseForge will open the production room where shot lists live.",
    starterLabel: "Shot list notes",
    starterPlaceholder: "Paste shot numbers, coverage ideas, insert shots, camera movement, lens feeling, or scene coverage notes.",
    submitLabel: "Create Shot List Project",
  },
  prompts: {
    eyebrow: "Prompt card start",
    heading: "Start from image, animation, or sound prompts.",
    helper: "Paste prompt material from another tool. MiseForge will open the production room so prompts can become part of the packet.",
    starterLabel: "Prompt material",
    starterPlaceholder: "Paste image prompts, animation prompts, sound prompts, negative prompts, or tool-specific workflow notes.",
    submitLabel: "Create Prompt Project",
  },
  packet: {
    eyebrow: "Packet start",
    heading: "Start from a production packet in progress.",
    helper: "Paste an existing plan, checklist, or packet draft. MiseForge will open the production room so you can organize and export it.",
    starterLabel: "Packet or checklist",
    starterPlaceholder: "Paste a production packet draft, checklist, asset list, shot plan, or handoff notes.",
    submitLabel: "Create Packet Project",
  },
};

const startModeDefaults: Record<StartMode, { activeStage: string; initialDocType: DocType }> = {
  dashboard: { activeStage: "idea", initialDocType: "idea" },
  idea: { activeStage: "idea", initialDocType: "idea" },
  treatment: { activeStage: "treatment", initialDocType: "treatment" },
  characters: { activeStage: "characters", initialDocType: "character_bible" },
  locations: { activeStage: "locations", initialDocType: "location_bible" },
  lookbook: { activeStage: "lookbook", initialDocType: "look_book" },
  script: { activeStage: "script", initialDocType: "script" },
  dialogue: { activeStage: "script", initialDocType: "script" },
  continuity: { activeStage: "continuity", initialDocType: "continuity_tracker" },
  breakdown: { activeStage: "breakdown", initialDocType: "breakdown_notes" },
  schedule: { activeStage: "schedule", initialDocType: "production_schedule" },
  sound: { activeStage: "sound", initialDocType: "sound_map" },
  production: { activeStage: "production", initialDocType: "story" },
  shotlist: { activeStage: "production", initialDocType: "story" },
  prompts: { activeStage: "production", initialDocType: "story" },
  packet: { activeStage: "production", initialDocType: "story" },
};

const emptyForm: ProjectForm = {
  title: "",
  genre: "",
  tone: "",
  logline: "",
  inspirations: "",
  initialContent: "",
};

const pipelineSteps: Array<{
  id: StageId;
  projectStage: string;
  docType: DocType;
  label: string;
  description: string;
  placeholder: string;
}> = [
  {
    id: "idea",
    projectStage: "idea",
    docType: "idea",
    label: "Idea",
    description: "Shape the core promise and dramatic engine.",
    placeholder: "Write the premise, theme, characters, and the reason this film has to exist.",
  },
  {
    id: "treatment",
    projectStage: "treatment",
    docType: "treatment",
    label: "Treatment",
    description: "Turn the concept into a cinematic story map.",
    placeholder: "Build a treatment with act structure, emotional turns, and a same-but-different hook.",
  },
  {
    id: "characters",
    projectStage: "characters",
    docType: "character_bible",
    label: "Characters",
    description: "Lock character look, voice, wardrobe, props, and continuity.",
    placeholder:
      "Build character bibles with visual continuity, wardrobe, speech patterns, carried props, relationships, and scene-to-scene state changes.",
  },
  {
    id: "locations",
    projectStage: "locations",
    docType: "location_bible",
    label: "Locations",
    description: "Lock location layout, dressing, light, color, and continuity.",
    placeholder:
      "Build location bibles with layout, time-of-day needs, color palette, dressing, lighting, ambient sound, and continuity risks.",
  },
  {
    id: "lookbook",
    projectStage: "lookbook",
    docType: "look_book",
    label: "Look Book",
    description: "Define the visual language that keeps every generated shot coherent.",
    placeholder:
      "Build the visual language: palette, lighting rules, camera grammar, reference spine, recurring motifs, negative prompts, and tool-specific look notes.",
  },
  {
    id: "script",
    projectStage: "script",
    docType: "script",
    label: "Script",
    description: "Draft, import, rewrite, and remove the robotic AI voice.",
    placeholder: "Draft or paste screenplay pages here.",
  },
  {
    id: "dialogue",
    projectStage: "dialogue",
    docType: "dialogue_notes",
    label: "Dialogue",
    description: "Scan for AI voice, exposition, subtext, and playable speech.",
    placeholder:
      "Run the AI Voice Scanner from your script pages, then keep the diagnosis, rewrite checklist, and external AI prompt here.",
  },
  {
    id: "continuity",
    projectStage: "continuity",
    docType: "continuity_tracker",
    label: "Continuity",
    description: "Track people, props, wardrobe, places, and state across scenes.",
    placeholder:
      "Build a continuity tracker from scene packets, then fill what changes, what must stay fixed, and what needs checking before generation.",
  },
  {
    id: "breakdown",
    projectStage: "breakdown",
    docType: "breakdown_notes",
    label: "Breakdown",
    description: "Pull scenes, characters, props, wardrobe, sound, and prompts.",
    placeholder: "Break the script into scene needs, props, wardrobe, prompts, and continuity notes.",
  },
  {
    id: "schedule",
    projectStage: "schedule",
    docType: "production_schedule",
    label: "Schedule",
    description: "Choose the smartest generation order and production sprint plan.",
    placeholder:
      "Build a production schedule with story locks, asset locks, scene order, shot generation order, tool handoffs, and export gates.",
  },
  {
    id: "sound",
    projectStage: "sound",
    docType: "sound_map",
    label: "Sound Map",
    description: "Plan room tone, practical sounds, dialogue space, silence, and effects.",
    placeholder:
      "Build a sound design map with room tone, foley, dialogue handling, silence, effects, animation handoff, and edit notes for every scene.",
  },
  {
    id: "production",
    projectStage: "production",
    docType: "story",
    label: "Production",
    description: "Build the shot plan and pre-production checklist.",
    placeholder: "Plan assets, insert shots, prompts, sound design, and production order.",
  },
];

const stageGuideNotes: Record<StageId, { title: string; speech: string; teaching: string }> = {
  idea: {
    title: "Find the movie in the premise.",
    speech: "Have an idea for a film? Start by naming the pressure inside it.",
    teaching:
      "The idea stage is where you test whether the premise has a character, a pressure, and a reason to become cinema instead of just a cool concept.",
  },
  treatment: {
    title: "Turn the spark into a story path.",
    speech: "A treatment is the bridge between feeling the film and being able to build it.",
    teaching:
      "The treatment forces the film to reveal its shape: beginning, escalation, emotional turn, ending, and the specific promise that makes the project worth finishing.",
  },
  characters: {
    title: "Keep people consistent from shot to shot.",
    speech: "Characters need a memory. AI images will drift unless you give them anchors.",
    teaching:
      "Character bibles protect visual identity, wardrobe, speech, desire, carried props, and emotional state so shot 14 still feels like the same person from shot 3.",
  },
  locations: {
    title: "Make every place behave like a real place.",
    speech: "A location is more than a background. It has rules, light, sound, and memory.",
    teaching:
      "Location bibles lock layout, dressing, color, light direction, room tone, and continuity risks so the film does not feel generated one shot at a time.",
  },
  lookbook: {
    title: "Give the film one visual language.",
    speech: "The look book is the promise that every frame belongs to the same film.",
    teaching:
      "A look book turns taste into rules: palette, lighting, camera distance, lens feeling, motifs, negative prompts, and references that keep the film coherent.",
  },
  script: {
    title: "Make pages playable, not just readable.",
    speech: "Good script pages give actors behavior, not explanations.",
    teaching:
      "The script stage is where you replace generic AI prose with wants, tactics, conflict, silence, visual action, and decisions the camera can actually hold.",
  },
  dialogue: {
    title: "Remove the obvious AI voice.",
    speech: "If a line says exactly what the character feels, it is probably not finished.",
    teaching:
      "Dialogue gets better when characters avoid, attack, hide, bargain, interrupt, and reveal themselves by accident. Subtext is the pressure under the words.",
  },
  continuity: {
    title: "Protect the chain between moments.",
    speech: "Continuity is the quiet discipline that makes a generated film feel intentional.",
    teaching:
      "Continuity tracks what changes and what must not change: props, wardrobe, location state, injuries, emotional momentum, light, sound, and object ownership.",
  },
  breakdown: {
    title: "Translate story into production needs.",
    speech: "Scene breakdowns turn pages into things that must be seen, heard, worn, carried, and remembered.",
    teaching:
      "A scene breakdown matters because production fails in the gap between what the script says and what the shot actually needs: characters, props, wardrobe, sound, blocking, inserts, and continuity.",
  },
  schedule: {
    title: "Build in the smartest order.",
    speech: "Do not generate the whole film at once. Lock the pieces that everything else depends on.",
    teaching:
      "A production schedule reduces waste by deciding what to lock first: story, characters, locations, look, key scenes, still images, animation, sound, review, then export.",
  },
  sound: {
    title: "Make the film feel physically present.",
    speech: "Sound is how the room tells the truth before a character does.",
    teaching:
      "A sound map gives every scene room tone, foley, silence, dialogue space, sync notes, and edit handoff so the final film feels grounded instead of flat.",
  },
  production: {
    title: "Assemble the production packet.",
    speech: "The packet is the moment the film stops being loose ideas and becomes a plan.",
    teaching:
      "The production stage gathers the decisions into one usable artifact: story, scenes, bibles, continuity, shots, prompts, sound, schedule, and export-ready notes.",
  },
};

function splitInspirations(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listText(values: string[] | undefined, fallback: string) {
  return values?.length ? values.join(", ") : fallback;
}

function joinList(values: string[] | undefined) {
  return values?.length ? values.join(", ") : "";
}

function markdownValue(value: string | undefined, fallback = "Not filled yet") {
  return value?.trim() || fallback;
}

function markdownList(values: string[] | undefined, fallback = "Not filled yet") {
  const cleaned = values?.map((value) => value.trim()).filter(Boolean) ?? [];

  return cleaned.length ? cleaned.map((value) => `- ${value}`).join("\n") : fallback;
}

function slugFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "miseforge-production-packet"
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function htmlValue(value: string | undefined, fallback = "Not filled yet") {
  return escapeHtml(markdownValue(value, fallback));
}

function htmlParagraphs(value: string | undefined, fallback = "Not filled yet") {
  return markdownValue(value, fallback)
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function htmlList(values: string[] | undefined, fallback = "Not filled yet") {
  const cleaned = values?.map((value) => value.trim()).filter(Boolean) ?? [];

  if (!cleaned.length) {
    return `<p>${escapeHtml(fallback)}</p>`;
  }

  return `<ul>${cleaned.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function hasList(values: string[] | undefined) {
  return Boolean(values?.some((value) => value.trim()));
}

function firstListItem(values: string[] | undefined, fallback: string) {
  return values?.find((value) => value.trim())?.trim() || fallback;
}

function uniqueSorted(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function scenesForValue(
  scenes: SceneBreakdown[],
  field: "characters" | "props" | "wardrobe" | "set_dressing",
  value: string,
) {
  const normalized = value.trim().toLowerCase();

  return scenes.filter((scene) =>
    (scene[field] ?? []).some((item) => item.trim().toLowerCase() === normalized),
  );
}

function sharedValues(first: string[] | undefined, second: string[] | undefined) {
  const secondSet = new Set((second ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean));

  return (first ?? []).filter((value) => secondSet.has(value.trim().toLowerCase()));
}

function sceneReferenceList(scenes: SceneBreakdown[]) {
  return scenes.length ? scenes.map(sceneBoardLabel).join(", ") : "Not mapped yet";
}

function parseShotMetadata(notes: string | undefined): ShotMetadata {
  const fields: ShotMetadata = {
    action: "",
    angle: "",
    continuity: "",
    dialogueSound: "",
    duration: "",
    lens: "",
    movement: "",
    shotType: "",
  };
  const fieldMap: Record<string, keyof ShotMetadata> = {
    action: "action",
    angle: "angle",
    "camera angle": "angle",
    "camera movement": "movement",
    continuity: "continuity",
    "continuity check": "continuity",
    dialogue: "dialogueSound",
    "dialogue / sound": "dialogueSound",
    "dialogue/sound": "dialogueSound",
    duration: "duration",
    "estimated duration": "duration",
    lens: "lens",
    "lens / feel": "lens",
    movement: "movement",
    "shot type": "shotType",
    type: "shotType",
  };

  for (const line of (notes ?? "").split(/\r?\n/)) {
    const match = line.match(/^\s*([^:]+):\s*(.+)\s*$/);

    if (!match) {
      continue;
    }

    const key = fieldMap[match[1].trim().toLowerCase()];

    if (key) {
      fields[key] = match[2].trim();
    }
  }

  return fields;
}

function hasShotMetadata(metadata: ShotMetadata) {
  return Object.values(metadata).some((value) => value.trim());
}

const dialogueFlagRules: Array<{
  category: string;
  fix: string;
  label: string;
  pattern: RegExp;
  severity: DialogueFlag["severity"];
}> = [
  {
    category: "Subtext",
    label: "Emotion is stated instead of played",
    severity: "High",
    pattern:
      /\b(i feel|i am scared|i'm scared|i am angry|i'm angry|i am sad|i'm sad|i am confused|i'm confused|this hurts|it hurts me)\b/i,
    fix: "Replace the named emotion with a physical choice, object, silence, interruption, or contradiction.",
  },
  {
    category: "Exposition",
    label: "Exposition is too visible",
    severity: "High",
    pattern: /\b(as you know|remember when|the reason is|let me explain|what this means|because we need|you have to understand)\b/i,
    fix: "Move information into conflict, behavior, set dressing, or what one character refuses to say directly.",
  },
  {
    category: "Theme",
    label: "Line sounds like thesis copy",
    severity: "Medium",
    pattern: /\b(this is about|what matters is|the truth is|in the end|our journey|we must learn|it represents)\b/i,
    fix: "Make the line character-specific. Let the theme show through pressure, not explanation.",
  },
  {
    category: "Specificity",
    label: "Generic urgency",
    severity: "Medium",
    pattern: /\b(we have to go|there is no time|we need to move|we need to hurry|everything depends on this)\b/i,
    fix: "Name the specific cost, obstacle, or immediate physical action that makes the urgency real.",
  },
  {
    category: "Rhythm",
    label: "Flat agreement or response",
    severity: "Low",
    pattern: /\b(you're right|i know|okay|fine|sure|i understand)\b/i,
    fix: "Add friction, subtext, status change, or a behavior that changes the rhythm of the exchange.",
  },
  {
    category: "AI Voice",
    label: "Therapy-speak or polished self-summary",
    severity: "Medium",
    pattern:
      /\b(i need to process|i'm trying to understand|i can't do this anymore|i just need closure|i need you to hear me|i am not ready|i'm doing my best)\b/i,
    fix: "Make the line less clean. Give the character a defensive tactic, a concrete object, or a partial truth.",
  },
  {
    category: "Specificity",
    label: "Abstract stakes",
    severity: "Medium",
    pattern: /\b(our future|everything we built|the whole world|all of this|the mission|the plan|what we lost)\b/i,
    fix: "Attach the stakes to a visible cost: a person, a prop, a deadline, a door closing, a body failing, or a choice that cannot be undone.",
  },
];

function isLikelyCharacterCue(line: string) {
  const trimmed = line.trim();

  return (
    /^[A-Z0-9 .'\-()]{2,36}$/.test(trimmed) &&
    !/^(INT\.|EXT\.|EST\.|I\/E\.|CUT TO|FADE|DISSOLVE|SMASH CUT)/.test(trimmed) &&
    /[A-Z]/.test(trimmed)
  );
}

function countWords(value: string) {
  return value.match(/\b[\w']+\b/g)?.length ?? 0;
}

function extractDialogueLines(source: string) {
  const lines = source.split(/\r?\n/).map((line) => line.trim());
  const dialogueLineEntries: DialogueLineEntry[] = [];
  const dialogueLines: string[] = [];
  const characters = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!isLikelyCharacterCue(line)) {
      continue;
    }

    characters.add(line.replace(/\s*\(.*\)\s*$/, "").trim());

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex];

      if (!nextLine || isLikelyCharacterCue(nextLine) || /^(INT\.|EXT\.|EST\.|I\/E\.)/i.test(nextLine)) {
        break;
      }

      if (!/^\(.+\)$/.test(nextLine)) {
        const character = line.replace(/\s*\(.*\)\s*$/, "").trim();

        dialogueLineEntries.push({
          character,
          line: nextLine,
          lineNumber: nextIndex + 1,
          wordCount: countWords(nextLine),
        });
        dialogueLines.push(nextLine);
      }
    }
  }

  return {
    characters: Array.from(characters).filter(Boolean),
    dialogueLineEntries,
    dialogueLines,
    lines,
  };
}

function firstEvidence(lines: string[], pattern: RegExp) {
  return lines.find((line) => pattern.test(line)) ?? "";
}

function flagPenalty(flag: DialogueFlag) {
  if (flag.severity === "High") {
    return 17;
  }

  if (flag.severity === "Medium") {
    return 11;
  }

  return 6;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreStatus(score: number) {
  if (score >= 82) {
    return "Strong";
  }

  if (score >= 62) {
    return "Workable";
  }

  if (score >= 42) {
    return "Needs pass";
  }

  return "At risk";
}

function inferDialogueTactic(line: string) {
  const normalized = line.trim().toLowerCase();

  if (/^(no|don't|stop|never|leave|get out)\b/.test(normalized)) {
    return "Refuse";
  }

  if (/\?$/.test(normalized)) {
    return "Test";
  }

  if (/\b(please|come on|just)\b/.test(normalized)) {
    return "Bargain";
  }

  if (/\b(sorry|fine|okay|i know)\b/.test(normalized)) {
    return "Retreat";
  }

  if (/\b(if|then|or else|unless)\b/.test(normalized)) {
    return "Pressure";
  }

  return "Hide or press";
}

function buildLineIssue(line: string, wordCount: number) {
  const issues = [
    /\b(i feel|i'm scared|i am scared|i'm angry|i am angry|i'm sad|i am sad|i'm confused|i am confused)\b/i.test(line)
      ? "names the emotion"
      : "",
    /\b(as you know|remember when|let me explain|you have to understand|the reason is)\b/i.test(line)
      ? "explains backstory"
      : "",
    /\b(the truth is|what matters is|this is about|in the end|we must learn)\b/i.test(line)
      ? "states the theme"
      : "",
    /\b(everything|something|anything|nothing|all of this|our future|the mission|the plan)\b/i.test(line)
      ? "uses abstract stakes"
      : "",
    wordCount > 18 ? "runs long" : "",
    /^(i|you|we|they|this|that)\b/i.test(line) ? "starts from a familiar pronoun shape" : "",
  ].filter(Boolean);

  return issues.length ? issues.join(", ") : "keep, but test for subtext and behavior";
}

function rewriteMoveForIssue(issue: string, tactic: string) {
  if (issue.includes("emotion")) {
    return "Remove the feeling word and externalize it through a prop, silence, distance shift, or refusal.";
  }

  if (issue.includes("backstory")) {
    return "Let one character weaponize the information instead of explaining it cleanly.";
  }

  if (issue.includes("theme")) {
    return "Turn the theme into a choice or accusation the character can act on.";
  }

  if (issue.includes("abstract")) {
    return "Replace the abstract noun with the specific thing the camera can see or hear.";
  }

  if (issue.includes("long")) {
    return "Split the line into pressure, interruption, and a smaller final turn.";
  }

  if (issue.includes("pronoun")) {
    return `Start the line from a concrete object, action, or ${tactic.toLowerCase()} tactic.`;
  }

  return "Keep the line only if the surrounding beat gives it conflict, behavior, and a reason not to say the full truth.";
}

function buildDialogueLineNotes(entries: DialogueLineEntry[]) {
  return entries
    .map((entry) => {
      const tactic = inferDialogueTactic(entry.line);
      const issue = buildLineIssue(entry.line, entry.wordCount);

      return {
        character: entry.character,
        issue,
        line: entry.line,
        lineNumber: entry.lineNumber,
        rewriteMove: rewriteMoveForIssue(issue, tactic),
        subtextTest: "What does this character want without admitting it?",
        tactic,
      };
    })
    .filter((note) => note.issue !== "keep, but test for subtext and behavior")
    .slice(0, 8);
}

function buildCharacterVoices(entries: DialogueLineEntry[]) {
  const grouped = entries.reduce<Record<string, DialogueLineEntry[]>>((accumulator, entry) => {
    accumulator[entry.character] = [...(accumulator[entry.character] ?? []), entry];
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([name, characterEntries]) => {
      const averageWords = characterEntries.length
        ? Math.round(characterEntries.reduce((total, entry) => total + entry.wordCount, 0) / characterEntries.length)
        : 0;
      const questionCount = characterEntries.filter((entry) => /\?$/.test(entry.line.trim())).length;
      const refusalCount = characterEntries.filter((entry) => /^(no|don't|stop|never)\b/i.test(entry.line.trim())).length;
      const risk =
        averageWords > 18
          ? "may over-explain"
          : questionCount === characterEntries.length && characterEntries.length > 1
            ? "may only ask questions"
            : refusalCount
              ? "has friction"
              : "needs a sharper speech pattern";

      return {
        assignment:
          risk === "has friction"
            ? "Preserve the resistance, but make each refusal specific to the scene object or relationship."
            : "Give this character a repeatable speech behavior: deflects with jokes, answers with objects, interrupts, bargains, or says less than they know.",
        averageWords,
        lineCount: characterEntries.length,
        name,
        risk,
      };
    })
    .sort((first, second) => second.lineCount - first.lineCount)
    .slice(0, 6);
}

function storySourceHas(source: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(source));
}

function analyzeDialogueSource({
  project,
  source,
  workflowTools,
}: {
  project: Project;
  source: string;
  workflowTools: string;
}): DialogueScan {
  const cleanSource = source.trim();
  const { characters, dialogueLineEntries, dialogueLines, lines } = extractDialogueLines(cleanSource);
  const words = cleanSource.match(/\b[\w']+\b/g) ?? [];
  const dialogueWords = dialogueLines.join(" ").match(/\b[\w']+\b/g) ?? [];
  const averageWordsPerLine = dialogueLines.length
    ? Math.round(dialogueWords.length / dialogueLines.length)
    : 0;
  const flags: DialogueFlag[] = [];

  for (const rule of dialogueFlagRules) {
    const evidence = firstEvidence(lines, rule.pattern);

    if (evidence) {
      flags.push({
        category: rule.category,
        evidence,
        fix: rule.fix,
        label: rule.label,
        severity: rule.severity,
      });
    }
  }

  const physicalActionPattern =
    /\b(picks up|sets down|turns|looks|opens|closes|touches|holds|drops|steps|backs away|waits|listens|breathes|reaches|pulls|pushes|stares|glances|crosses|sits|stands)\b/i;

  if (!physicalActionPattern.test(cleanSource)) {
    flags.push({
      category: "Visual behavior",
      evidence: "No clear physical behavior detected in the scanned passage.",
      fix: "Add one playable action that changes the scene: a held object, distance shift, silence, interruption, or refusal.",
      label: "Missing visual behavior",
      severity: "High",
    });
  }

  if (dialogueLines.length === 0) {
    flags.push({
      category: "Formatting",
      evidence: "No screenplay-style dialogue blocks were detected.",
      fix: "Use character cues and dialogue blocks, or scan a smaller scene section with character lines.",
      label: "No dialogue blocks detected",
      severity: "Medium",
    });
  }

  if (averageWordsPerLine > 16) {
    flags.push({
      category: "Compression",
      evidence: `Average dialogue line length is ${averageWordsPerLine} words.`,
      fix: "Cut explanation. Give each line one job: pressure, dodge, reveal, attack, retreat, or decision.",
      label: "Dialogue lines may be over-explaining",
      severity: "Medium",
    });
  }

  const repeatedStarterCount = dialogueLines.filter((line) => /^(i|you|we|they|this|that)\b/i.test(line)).length;

  if (dialogueLines.length >= 4 && repeatedStarterCount / dialogueLines.length >= 0.55) {
    flags.push({
      category: "Rhythm",
      evidence: `${repeatedStarterCount} of ${dialogueLines.length} dialogue lines start with a pronoun or abstract pointer.`,
      fix: "Vary rhythm with interruption, fragment, object reference, silence, or a line that starts from the character's tactic.",
      label: "Line rhythm is too similar",
      severity: "Low",
    });
  }

  const longLineCount = dialogueLineEntries.filter((entry) => entry.wordCount > 20).length;
  const questionLineCount = dialogueLineEntries.filter((entry) => /\?$/.test(entry.line.trim())).length;
  const lineNotes = buildDialogueLineNotes(dialogueLineEntries);
  const characterVoices = buildCharacterVoices(dialogueLineEntries);
  const subtextFlagCount = flags.filter((flag) => ["Subtext", "Theme", "AI Voice"].includes(flag.category)).length;
  const expositionFlagCount = flags.filter((flag) => flag.category === "Exposition").length;
  const specificityFlagCount = flags.filter((flag) => flag.category === "Specificity").length;
  const hasVisualBehavior = physicalActionPattern.test(cleanSource);
  const rhythmPenalty = dialogueLines.length
    ? Math.round((repeatedStarterCount / dialogueLines.length) * 34) + Math.round((longLineCount / dialogueLines.length) * 24)
    : 32;
  const scoreCards: DialogueScoreCard[] = [
    {
      detail: subtextFlagCount
        ? `${subtextFlagCount} direct-emotion or thesis pattern${subtextFlagCount === 1 ? "" : "s"} found`
        : "No major direct-emotion pattern detected",
      label: "Subtext",
      score: clampScore(92 - subtextFlagCount * 22),
      status: scoreStatus(clampScore(92 - subtextFlagCount * 22)),
    },
    {
      detail: expositionFlagCount
        ? "Backstory or logic is being explained too directly"
        : "Exposition is not obviously floating on the surface",
      label: "Exposition control",
      score: clampScore(88 - expositionFlagCount * 28),
      status: scoreStatus(clampScore(88 - expositionFlagCount * 28)),
    },
    {
      detail: specificityFlagCount
        ? `${specificityFlagCount} abstract or generic stake pattern${specificityFlagCount === 1 ? "" : "s"} found`
        : "Stakes are not obviously generic",
      label: "Specificity",
      score: clampScore(86 - specificityFlagCount * 20),
      status: scoreStatus(clampScore(86 - specificityFlagCount * 20)),
    },
    {
      detail: hasVisualBehavior ? "At least one playable physical behavior is present" : "No playable physical behavior detected",
      label: "Visual behavior",
      score: hasVisualBehavior ? 84 : 38,
      status: scoreStatus(hasVisualBehavior ? 84 : 38),
    },
    {
      detail: `${averageWordsPerLine || 0} average words per dialogue line / ${longLineCount} long line${longLineCount === 1 ? "" : "s"}`,
      label: "Compression",
      score: clampScore(90 - Math.max(0, averageWordsPerLine - 12) * 4 - longLineCount * 8),
      status: scoreStatus(clampScore(90 - Math.max(0, averageWordsPerLine - 12) * 4 - longLineCount * 8)),
    },
    {
      detail: `${questionLineCount} question line${questionLineCount === 1 ? "" : "s"} / ${repeatedStarterCount} repeated starter${repeatedStarterCount === 1 ? "" : "s"}`,
      label: "Rhythm",
      score: clampScore(88 - rhythmPenalty),
      status: scoreStatus(clampScore(88 - rhythmPenalty)),
    },
  ];
  const nextRewritePass =
    [...scoreCards]
      .sort((first, second) => first.score - second.score)[0]?.label ?? "Subtext";
  const rewriteMoves = [
    "Give every line a tactic: hide, attack, test, bargain, retreat, interrupt, or decide.",
    "Replace named emotions with behavior the camera can hold.",
    "Turn exposition into a conflict between what one character wants and what another refuses to give.",
    "Cut any line that explains the scene after the viewer already understands it.",
    "Add one silence, interruption, object handoff, or distance shift to carry the emotional turn.",
  ];
  const strengths = [
    characters.length ? `${characters.length} speaking character${characters.length === 1 ? "" : "s"} detected.` : "",
    /^(INT\.|EXT\.|EST\.|I\/E\.)/im.test(cleanSource) ? "Scene heading detected." : "",
    physicalActionPattern.test(cleanSource) ? "Some visual behavior is already present." : "",
    dialogueLines.length > 0 && averageWordsPerLine <= 16 ? "Dialogue line length is workable." : "",
    characterVoices.length ? "Character voice map generated." : "",
  ].filter(Boolean);
  const scoreFromFlags = 100 - flags.reduce((total, flag) => total + flagPenalty(flag), 0);
  const scoreFromCards = scoreCards.reduce((total, card) => total + card.score, 0) / scoreCards.length;
  const score = clampScore((scoreFromFlags + scoreFromCards) / 2);
  const rubric = [
    "Each character wants something specific in the moment.",
    "The line says less than the character means.",
    "Emotion is carried by behavior, object, blocking, or silence.",
    "Exposition is hidden inside conflict or decision.",
    "The scene has at least one visual turn the camera can hold.",
    "Dialogue rhythm changes between attack, dodge, interruption, and retreat.",
    "Every rewritten beat preserves the author's intent and the project's tone.",
  ];
  const flagSummary = flags.length
    ? flags.map((flag) => `- ${flag.severity}: ${flag.label}. Fix: ${flag.fix}`).join("\n")
    : "- No major AI-voice patterns were detected. Tighten for specificity and subtext.";
  const scoreSummary = scoreCards
    .map((card) => `- ${card.label}: ${card.score}% (${card.status}). ${card.detail}`)
    .join("\n");
  const lineSummary = lineNotes.length
    ? lineNotes
        .map(
          (note) =>
            `- Line ${note.lineNumber}, ${note.character}: "${note.line}" / Issue: ${note.issue} / Move: ${note.rewriteMove}`,
        )
        .join("\n")
    : "- No specific line-level issues were isolated. Still add subtext, behavior, and character-specific rhythm.";
  const voiceSummary = characterVoices.length
    ? characterVoices
        .map(
          (voice) =>
            `- ${voice.name}: ${voice.lineCount} lines, ${voice.averageWords} average words, risk: ${voice.risk}. ${voice.assignment}`,
        )
        .join("\n")
    : "- No character voice map available from this scan.";
  const prompt = [
    "You are a professional dialogue editor and script supervisor for AI filmmakers.",
    "",
    "PROJECT CONTEXT",
    `Title: ${project.title || "Untitled"}`,
    `Genre: ${project.genre || "Not specified"}`,
    `Tone: ${project.tone || "Not specified"}`,
    `Logline: ${project.logline || "Not specified"}`,
    `Workflow/tools: ${workflowTools || "Not specified"}`,
    "",
    "DIAGNOSIS TO ADDRESS",
    flagSummary,
    "",
    "SCORECARD",
    scoreSummary,
    "",
    "LINE NOTES",
    lineSummary,
    "",
    "CHARACTER VOICE MAP",
    voiceSummary,
    "",
    "REWRITE RULES",
    ...rubric.map((item) => `- ${item}`),
    "",
    "TASK",
    "Rewrite the dialogue so it feels human, playable, specific, compressed, and full of subtext. Do not add a generic inspirational speech. Preserve the story intent and make the emotion visible through behavior.",
    "",
    "RETURN",
    "1. One-paragraph diagnosis",
    "2. Revised scene or dialogue section",
    "3. Line-by-line change notes",
    "4. Character voice notes",
    "5. One visual beat that should carry the emotional turn",
    "",
    "SOURCE",
    cleanSource,
  ].join("\n");

  return {
    averageWordsPerLine,
    characterCount: characters.length,
    characterVoices,
    dialogueLineCount: dialogueLines.length,
    flags,
    lineNotes,
    nextRewritePass,
    prompt,
    rubric,
    scoreCards,
    score,
    sourceExcerpt: cleanSource.slice(0, 1200),
    strengths,
    wordCount: words.length,
    rewriteMoves,
  };
}

function buildDialogueReportMarkdown(scan: DialogueScan) {
  const flags = scan.flags.length
    ? scan.flags
        .map((flag) =>
          [
            `### ${flag.severity}: ${flag.label}`,
            "",
            `Category: ${flag.category}`,
            "",
            `Evidence: ${flag.evidence}`,
            "",
            `Fix: ${flag.fix}`,
          ].join("\n"),
        )
        .join("\n\n")
    : "No major AI-voice patterns were detected. Tighten for specificity, conflict, and subtext.";

  return [
    "# Dialogue / AI Voice Scan",
    "",
    `Dialogue discipline score: ${scan.score}%`,
    `Words scanned: ${scan.wordCount}`,
    `Dialogue lines detected: ${scan.dialogueLineCount}`,
    `Speaking characters detected: ${scan.characterCount}`,
    `Average words per dialogue line: ${scan.averageWordsPerLine || "Not available"}`,
    `Next rewrite pass: ${scan.nextRewritePass}`,
    "",
    "## Strengths",
    "",
    scan.strengths.length ? scan.strengths.map((strength) => `- ${strength}`).join("\n") : "- Needs a smaller screenplay-formatted scene sample.",
    "",
    "## Dialogue Scorecard",
    "",
    scan.scoreCards
      .map((card) => `- ${card.label}: ${card.score}% (${card.status}) - ${card.detail}`)
      .join("\n"),
    "",
    "## Flags",
    "",
    flags,
    "",
    "## Line-Level Diagnosis",
    "",
    scan.lineNotes.length
      ? scan.lineNotes
          .map((note) =>
            [
              `### Line ${note.lineNumber}: ${note.character}`,
              "",
              `Line: ${note.line}`,
              `Issue: ${note.issue}`,
              `Tactic: ${note.tactic}`,
              `Rewrite move: ${note.rewriteMove}`,
              `Subtext test: ${note.subtextTest}`,
            ].join("\n"),
          )
          .join("\n\n")
      : "No specific line-level issues were isolated. Still test the scene for subtext, behavior, and character-specific rhythm.",
    "",
    "## Character Voice Map",
    "",
    scan.characterVoices.length
      ? scan.characterVoices
          .map(
            (voice) =>
              `- ${voice.name}: ${voice.lineCount} line${voice.lineCount === 1 ? "" : "s"}, ${voice.averageWords} average words, ${voice.risk}. ${voice.assignment}`,
          )
          .join("\n")
      : "- No character voice map available from this scan.",
    "",
    "## Rewrite Moves",
    "",
    scan.rewriteMoves.map((move) => `- ${move}`).join("\n"),
    "",
    "## Rewrite Rubric",
    "",
    scan.rubric.map((item) => `- ${item}`).join("\n"),
    "",
    "## Expert Rewrite Prompt",
    "",
    "```text",
    scan.prompt,
    "```",
  ].join("\n");
}

function completionLine(label: string, isComplete: boolean) {
  return { label, isComplete };
}

function buildGuideAnswer(question: string, context: GuideAssistantContext) {
  const lowerQuestion = question.toLowerCase();
  const projectName = context.projectTitle?.trim() || "this film";
  const projectStatus = `${projectName} is at ${context.readinessScore}% production readiness with ${context.sceneCount} scene packet${context.sceneCount === 1 ? "" : "s"} and ${context.assetCount} production asset${context.assetCount === 1 ? "" : "s"}.`;
  const stageLine = `Right now you are focused on ${context.activeStageLabel}. Next best action: ${context.nextAction}.`;

  if (/\b(scene breakdown|breakdown|why.*break)\b/.test(lowerQuestion)) {
    return [
      "A scene breakdown is the moment the script becomes producible.",
      "A script says what happens. A breakdown asks what must be seen, heard, worn, carried, lit, animated, and kept consistent.",
      "For AI filmmaking, that matters even more because every missing detail becomes drift: different faces, wrong props, random wardrobe, flat sound, or shots that look pretty but do not tell the story.",
      stageLine,
    ].join("\n\n");
  }

  if (/\b(dialogue|line|subtext|ai voice|robotic|sounds like ai)\b/.test(lowerQuestion)) {
    return [
      "Dialogue starts sounding human when it stops explaining the emotion.",
      "Give each line a tactic: hide, attack, test, dodge, seduce, confess, interrupt, retreat, or make a decision. Then let an object, pause, look, or movement carry some of the feeling.",
      "A useful test: if the line names the emotion directly, ask what the character would do to avoid saying it.",
      stageLine,
    ].join("\n\n");
  }

  if (/\b(character|casting|look|face|wardrobe|bible)\b/.test(lowerQuestion)) {
    return [
      "The Character Bible is the antidote to AI visual drift.",
      "It should lock the face, age, body language, wardrobe rules, carried props, speech pattern, relationships, and emotional state across scenes.",
      "Think of it as casting plus continuity. The goal is that a viewer never feels like the actor changed between generations.",
      projectStatus,
    ].join("\n\n");
  }

  if (/\b(location|place|set|room|environment)\b/.test(lowerQuestion)) {
    return [
      "A location needs rules before it needs beauty.",
      "Map the layout, practical lights, time-of-day behavior, color palette, sound texture, dressing, and what changes between scenes.",
      "AI tools can generate impressive spaces, but MiseForge helps make the same space behave like the same place twice.",
      stageLine,
    ].join("\n\n");
  }

  if (/\b(sound|silence|music|foley|dialogue timing|room tone)\b/.test(lowerQuestion)) {
    return [
      "Sound is not decoration. It is invisible continuity.",
      "Room tone tells us where we are. Foley tells us what matters. Silence tells us when a choice has weight. Music should not cover a scene that sound design can make tense by itself.",
      "Use the Sound Map to decide what the audience hears before animation and editing lock you into weak choices.",
      stageLine,
    ].join("\n\n");
  }

  if (/\b(shot list|shot|insert|camera|coverage|storyboard)\b/.test(lowerQuestion)) {
    return [
      "A shot list is not a list of cool images. It is a list of decisions.",
      "Each shot should answer: what changes, what must the audience notice, what information does this angle reveal, and what needs continuity protection?",
      "Insert shots make sense when they externalize the conflict: a key, a glass, a hand, a door, a prop moving from one person to another.",
      stageLine,
    ].join("\n\n");
  }

  if (/\b(treatment|structure|act|story|theme|logline)\b/.test(lowerQuestion)) {
    return [
      "Story structure is not a cage. It is a pressure system.",
      "The logline tests whether the movie has a clean promise. The treatment tests whether that promise can survive a beginning, middle, escalation, reversal, and ending.",
      "Theme is what the film is arguing underneath the plot. If you know that, every scene can make a sharper choice.",
      stageLine,
    ].join("\n\n");
  }

  if (/\b(what next|next step|what should i do|where do i start|stuck)\b/.test(lowerQuestion)) {
    return [
      "Here is the practical next move.",
      projectStatus,
      stageLine,
      "Do not try to perfect the whole film at once. Finish the next missing production layer, save it, then move one stage forward.",
    ].join("\n\n");
  }

  if (/\b(life|meaning|purpose|fear|confidence|give up|philosophy|why make)\b/.test(lowerQuestion)) {
    return [
      "Mini philosopher mode: making a film is a way of arguing that a feeling deserved a shape.",
      "The work will always feel too big if you stare at the whole mountain. Your job is smaller and more honest: make the next scene clearer, the next choice more specific, the next image more truthful.",
      "A film does not become meaningful because it explains life. It becomes meaningful because it notices something true and refuses to look away.",
    ].join("\n\n");
  }

  if (/\b(price|upgrade|free|pro|paywall|subscription|founder)\b/.test(lowerQuestion)) {
    return [
      "Free is for proving the workflow. Founder Pro is for building full projects.",
      "The upgrade is meant to unlock the deeper production system: multiple projects, bibles, shot lists, sound maps, schedules, prompt cards, version history, and premium exports.",
      "The best paywall moment is when the project has become useful enough that exporting the full packet feels obvious.",
    ].join("\n\n");
  }

  return [
    "My read: treat this like a production problem, not just a writing problem.",
    projectStatus,
    stageLine,
    "Ask me about story, dialogue, scene breakdowns, characters, locations, sound, shots, continuity, or the meaning of the work, and I will get more specific.",
  ].join("\n\n");
}

export function MiniPhilosopherGuide({
  compact = false,
  context,
  minimal = false,
  routes = [],
}: {
  compact?: boolean;
  context: GuideAssistantContext;
  minimal?: boolean;
  routes?: GuideRoute[];
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<GuideChatMessage[]>([]);
  const visibleMessages =
    messages.length > 0
      ? messages
      : [
          {
            id: "guide-intro",
            role: "assistant" as const,
            text: [
              context.speech,
              `You can ask me what to do next, why a stage matters, how to fix robotic dialogue, or the philosophical reason a scene needs to exist.`,
            ].join("\n\n"),
          },
        ];
  const quickQuestions = [
    "What should I do next?",
    `Why do I need ${context.activeStageLabel}?`,
    "How do I make this less generic?",
    "What is the philosophical point of this scene?",
  ];

  function askGuide(question: string) {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: createVersionId(),
        role: "user",
        text: cleanQuestion,
      },
      {
        id: createVersionId(),
        role: "assistant",
        text: buildGuideAnswer(cleanQuestion, context),
      },
    ]);
    setMessageText("");
    setIsChatOpen(true);
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askGuide(messageText);
  }

  return (
    <div className={`guide-assistant${compact ? " compact" : ""}${minimal ? " minimal" : ""}`}>
      <button
        aria-expanded={isChatOpen}
        aria-label={isChatOpen ? "Close MiseForge guide chat" : "Open MiseForge guide chat"}
        className="guide-character guide-character-button small"
        type="button"
        onClick={() => setIsChatOpen((current) => !current)}
      >
        <div className="guide-speech">{isChatOpen ? "Ask me the real question." : context.speech}</div>
        <div className="guide-antenna" />
        <div className="guide-head">
          <span />
          <span />
        </div>
        <div className="guide-body">
          <div className="guide-book" />
        </div>
      </button>

      {!minimal ? (
        <div className="guide-stage-card guide-dynamic-card">
          <span>{context.eyebrow}</span>
          <strong>{context.title}</strong>
          <p>{context.body}</p>
          {context.chips?.length ? (
            <div className="guide-chip-row">
              {context.chips.map((chip) => (
                <small key={chip}>{chip}</small>
              ))}
            </div>
          ) : null}
          <button className="button secondary full-width" type="button" onClick={() => setIsChatOpen((current) => !current)}>
            {isChatOpen ? "Close guide chat" : "Ask the guide"}
          </button>
        </div>
      ) : null}

      {routes.length ? (
        <div className="guide-route-list">
          {routes.map((route) => (
            <a href={route.href} key={route.href}>
              <strong>{route.label}</strong>
              <span>{route.text}</span>
            </a>
          ))}
        </div>
      ) : null}

      {isChatOpen ? (
        <section className="guide-chat-panel" aria-label="MiseForge guide chat">
          <div className="guide-chat-heading">
            <span>Mini philosopher robot</span>
            <strong>Ask about life, dialogue, or what to fix next.</strong>
          </div>
          <div className="guide-chat-messages">
            {visibleMessages.map((message) => (
              <article className={`guide-message ${message.role}`} key={message.id}>
                <span>{message.role === "assistant" ? "Guide" : "You"}</span>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
          <div className="guide-quick-questions">
            {quickQuestions.map((question) => (
              <button type="button" key={question} onClick={() => askGuide(question)}>
                {question}
              </button>
            ))}
          </div>
          <form className="guide-chat-form" onSubmit={submitQuestion}>
            <input
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Ask the robot why a stage matters..."
            />
            <button className="button" type="submit">
              Ask
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function sceneBoardLabel(scene: SceneBreakdown) {
  return `Scene ${scene.scene_number}: ${scene.scene_heading || "Unlabeled scene"}`;
}

function versionStorageKey(projectId: string) {
  return `miseforge:versions:${projectId}`;
}

function createVersionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `version-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatVersionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sceneToDraft(scene: SceneBreakdown): SceneBreakdownDraft {
  return {
    scene_heading: scene.scene_heading,
    location: scene.location,
    time_of_day: scene.time_of_day,
    summary: scene.summary,
    characters: joinList(scene.characters),
    props: joinList(scene.props),
    wardrobe: joinList(scene.wardrobe),
    makeup_hair: joinList(scene.makeup_hair),
    set_dressing: joinList(scene.set_dressing),
    vehicles: joinList(scene.vehicles),
    sound_notes: scene.sound_notes,
    color_palette: scene.color_palette,
    blocking: scene.blocking,
    tone: scene.tone,
  };
}

function emptySceneDraft(): SceneBreakdownDraft {
  return {
    scene_heading: "",
    location: "",
    time_of_day: "",
    summary: "",
    characters: "",
    props: "",
    wardrobe: "",
    makeup_hair: "",
    set_dressing: "",
    vehicles: "",
    sound_notes: "",
    color_palette: "",
    blocking: "",
    tone: "",
  };
}

function ProUnlockPanel({
  entitlement,
  compact = false,
  isManagingBilling = false,
  isUpgrading = false,
  onManageBilling,
  onUpgrade,
}: {
  entitlement: AccessEntitlement;
  compact?: boolean;
  isManagingBilling?: boolean;
  isUpgrading?: boolean;
  onManageBilling?: () => void;
  onUpgrade?: () => void;
}) {
  const canManageBilling = entitlement.isPro && !entitlement.isAdmin && onManageBilling;

  if (entitlement.isPro) {
    return (
      <section className={compact ? "pro-panel compact active" : "pro-panel active"}>
        <div>
          <span>{entitlement.planLabel} access</span>
          <strong>Full MiseForge workflow unlocked.</strong>
          <p>
            Your account has access to the complete production workspace: character bibles, location
            bibles, continuity, shot lists, prompt cards, version history, premium exports, and
            multiple projects.
          </p>
        </div>
        {canManageBilling ? (
          <button
            className="button secondary"
            type="button"
            onClick={onManageBilling}
            disabled={isManagingBilling}
          >
            {isManagingBilling ? "Opening billing..." : "Manage billing"}
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className={compact ? "pro-panel compact" : "pro-panel"}>
      <div>
        <span>Free plan</span>
        <strong>Upgrade when you need the complete production packet.</strong>
        <p>
          Free lets you start a real project, preview one scene packet, copy expert prompts, and
          export a basic packet. Founder Pro unlocks full projects, bibles, shot lists, schedule,
          sound maps, version history, and premium PDF export for $12.99/month.
        </p>
      </div>
      {!compact ? (
        <ul>
          {proFeatureList.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ) : null}
      <button
        className="button"
        type="button"
        onClick={onUpgrade}
        disabled={isUpgrading || !onUpgrade}
      >
        {isUpgrading ? "Opening checkout..." : "Upgrade to Founder Pro"}
      </button>
    </section>
  );
}

function DialogueScanPanel({
  onCopyPrompt,
  onRunAgain,
  scan,
}: {
  onCopyPrompt: () => void;
  onRunAgain: () => void;
  scan: DialogueScan;
}) {
  const topFlags = scan.flags.slice(0, 4);
  const weakestCard = [...scan.scoreCards].sort((first, second) => first.score - second.score)[0];

  return (
    <section className="dialogue-scan-panel" aria-label="AI voice scanner report">
      <div className="dialogue-scan-head">
        <div>
          <span>AI voice scanner 2.0</span>
          <strong>{scan.score}% dialogue discipline score</strong>
          <p>
            {scan.dialogueLineCount} dialogue line{scan.dialogueLineCount === 1 ? "" : "s"} /{" "}
            {scan.characterCount} speaking character{scan.characterCount === 1 ? "" : "s"} detected.
          </p>
        </div>
        <div className="dialogue-score-ring">{scan.score}%</div>
      </div>
      <div className="dialogue-next-pass">
        <span>Next rewrite pass</span>
        <strong>{scan.nextRewritePass}</strong>
        <p>
          {weakestCard
            ? `${weakestCard.detail}. Start here before polishing word choice.`
            : "Start with subtext, behavior, and character-specific rhythm."}
        </p>
      </div>
      <div className="dialogue-score-grid">
        {scan.scoreCards.map((card) => (
          <article key={card.label}>
            <span>{card.status}</span>
            <strong>{card.score}%</strong>
            <p>{card.label}</p>
            <small>{card.detail}</small>
          </article>
        ))}
      </div>
      {topFlags.length ? (
        <div className="dialogue-flag-grid">
          {topFlags.map((flag) => (
            <article className="dialogue-flag-card" key={`${flag.label}-${flag.evidence}`}>
              <span>{flag.severity} / {flag.category}</span>
              <strong>{flag.label}</strong>
              <p>{flag.evidence}</p>
              <small>{flag.fix}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="asset-empty">No major AI-voice patterns detected in this pass.</p>
      )}
      <div className="rubric-grid">
        {scan.rubric.slice(0, 4).map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      {scan.lineNotes.length ? (
        <div className="dialogue-line-note-list">
          <div className="mini-section-heading">
            <span>Line diagnosis</span>
            <strong>Where the human pass should start.</strong>
          </div>
          {scan.lineNotes.slice(0, 5).map((note) => (
            <article key={`${note.lineNumber}-${note.character}-${note.line}`}>
              <span>
                Line {note.lineNumber} / {note.character} / {note.tactic}
              </span>
              <strong>{note.line}</strong>
              <p>{note.issue}</p>
              <small>{note.rewriteMove}</small>
            </article>
          ))}
        </div>
      ) : null}
      {scan.characterVoices.length ? (
        <div className="dialogue-voice-grid">
          {scan.characterVoices.map((voice) => (
            <article key={voice.name}>
              <span>{voice.lineCount} line{voice.lineCount === 1 ? "" : "s"}</span>
              <strong>{voice.name}</strong>
              <p>{voice.risk}</p>
              <small>{voice.assignment}</small>
            </article>
          ))}
        </div>
      ) : null}
      <div className="dialogue-move-strip">
        {scan.rewriteMoves.slice(0, 3).map((move) => (
          <span key={move}>{move}</span>
        ))}
      </div>
      <div className="dialogue-actions">
        <button className="button secondary" type="button" onClick={onRunAgain}>
          Re-scan current text
        </button>
        <button className="button" type="button" onClick={onCopyPrompt}>
          Copy rewrite prompt
        </button>
      </div>
    </section>
  );
}

export function StudioWorkspace({ startMode = "dashboard" }: { startMode?: StartMode } = {}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const modeCopy = startModeCopy[startMode] ?? startModeCopy.dashboard;
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entitlement, setEntitlement] = useState<AccessEntitlement>(freeEntitlement);
  const [usage, setUsage] = useState<ProjectUsage>(defaultUsage);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [draftText, setDraftText] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpeningBillingPortal, setIsOpeningBillingPortal] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProjects(accessToken: string) {
    setIsLoadingProjects(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result = (await response.json()) as {
        ok: boolean;
        entitlement?: AccessEntitlement;
        projects?: Project[];
        usage?: ProjectUsage;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to load projects.");
      }

      setProjects(result.projects ?? []);
      setEntitlement(result.entitlement ?? freeEntitlement);
      setUsage(result.usage ?? {
        ...defaultUsage,
        projectCount: result.projects?.length ?? 0,
      });
      setSelectedProjectId((current) =>
        current && result.projects?.some((project) => project.id === current) ? current : "",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load projects.");
    } finally {
      setIsLoadingProjects(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsLoadingSession(false);

      if (!data.session) {
        const authDiagnostic = getPendingAuthDiagnostic();

        if (authDiagnostic) {
          setError(authDiagnostic);
        }
      } else {
        clearAuthReturnState();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setMessage("");
      setError("");

      if (nextSession) {
        clearAuthReturnState();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get("checkout");

    if (checkout === "success") {
      setMessage("Payment complete. Founder Pro access will unlock in a moment.");
      return;
    }

    if (checkout === "cancelled") {
      setMessage("Checkout cancelled. You can upgrade whenever you are ready.");
      return;
    }

    const billing = new URLSearchParams(window.location.search).get("billing");

    if (billing === "return") {
      setMessage("Billing settings saved. Your MiseForge access will refresh automatically.");
    }
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      void loadProjects(session.access_token);
      return;
    }

    setProjects([]);
    setEntitlement(freeEntitlement);
    setUsage(defaultUsage);
  }, [session?.access_token]);

  async function signInWithGoogle() {
    setError("");
    setMessage("");
    const nextPath = `${window.location.pathname}${window.location.search}`;
    rememberAuthReturnPath(nextPath);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (signInError) {
      setError(signInError.message);
    }
  }

  async function signOut() {
    setError("");
    setMessage("");
    clearAuthReturnState();
    await supabase.auth.signOut();
    setProjects([]);
    setEntitlement(freeEntitlement);
    setUsage(defaultUsage);
  }

  async function startCheckout() {
    if (!session?.access_token) {
      setError("Sign in with Google before upgrading.");
      setMessage("");
      return;
    }

    setIsStartingCheckout(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const result = (await response.json()) as { ok: boolean; url?: string; error?: string };

      if (!response.ok || !result.ok || !result.url) {
        throw new Error(result.error ?? "Unable to open checkout.");
      }

      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open checkout.");
    } finally {
      setIsStartingCheckout(false);
    }
  }

  async function openBillingPortal() {
    if (!session?.access_token) {
      setError("Sign in with Google before opening billing.");
      setMessage("");
      return;
    }

    setIsOpeningBillingPortal(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const result = (await response.json()) as { ok: boolean; url?: string; error?: string };

      if (!response.ok || !result.ok || !result.url) {
        throw new Error(result.error ?? "Unable to open billing.");
      }

      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open billing.");
    } finally {
      setIsOpeningBillingPortal(false);
    }
  }

  function updateForm(field: keyof ProjectForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.access_token) {
      setError("Sign in before saving a project.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const modeDefaults = startModeDefaults[startMode] ?? startModeDefaults.dashboard;
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          genre: form.genre,
          tone: form.tone,
          logline: form.logline,
          inspirations: splitInspirations(form.inspirations),
          initialContent: form.initialContent,
          activeStage: modeDefaults.activeStage,
          initialDocType: modeDefaults.initialDocType,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        entitlement?: AccessEntitlement;
        project?: Project;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.project) {
        throw new Error(result.error ?? "Unable to save project.");
      }

      setProjects((current) => [result.project as Project, ...current]);
      setEntitlement(result.entitlement ?? entitlement);
      setUsage((current) => ({
        ...current,
        projectCount: current.projectCount + 1,
      }));
      setSelectedProjectId(result.project.id);
      setDraftText(form.initialContent);
      setForm(emptyForm);
      setMessage(`Project saved to Supabase. Opening workspace. Database ID: ${result.project.id}`);
      window.location.assign(`/app/projects/${result.project.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save project.");
    } finally {
      setIsSaving(false);
    }
  }

  const userEmail = session?.user.email ?? "Signed-in user";
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const hasReachedFreeProjectLimit = !entitlement.isPro && usage.projectCount >= usage.freeProjectLimit;

  return (
    <article className="panel studio-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{selectedProject ? "Live workspace" : modeCopy.eyebrow}</p>
          <h2>{selectedProject ? "Project command center." : "Start where your film is today."}</h2>
          {!selectedProject ? <p className="workspace-helper">{modeCopy.helper}</p> : null}
          {session ? (
            <p className="workspace-account">
              Signed in as <strong>{userEmail}</strong>
              <span className={entitlement.isPro ? "plan-badge active" : "plan-badge"}>
                {entitlement.planLabel}
              </span>
            </p>
          ) : null}
        </div>
        {session ? (
          <button className="button secondary" type="button" onClick={signOut}>
            Sign Out
          </button>
        ) : null}
      </div>

      {isLoadingSession ? (
        <div className="workspace-skeleton" aria-label="Loading MiseForge workspace">
          <div className="skeleton-card large" />
          <div className="skeleton-grid">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : !session ? (
        <div className="auth-box">
          <p>
            Sign in with Google to save your film projects, reopen the command center, and keep
            your production packets organized.
          </p>
          <button className="button" type="button" onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="studio-grid">
          {selectedProject ? (
            <ProjectWorkspace
              draftText={draftText}
              entitlement={entitlement}
              isOpeningBillingPortal={isOpeningBillingPortal}
              isStartingCheckout={isStartingCheckout}
              onManageBilling={openBillingPortal}
              onUpgrade={startCheckout}
              project={selectedProject}
              userEmail={userEmail}
              onBack={() => {
                setSelectedProjectId("");
                setDraftText("");
              }}
              onDraftChange={setDraftText}
            />
          ) : (
            <form className="project-form" onSubmit={saveProject}>
              <div className="signed-in-line">
                <span>Signed in as</span>
                <strong>{userEmail}</strong>
              </div>
              <ProUnlockPanel
                compact
                entitlement={entitlement}
                isManagingBilling={isOpeningBillingPortal}
                isUpgrading={isStartingCheckout}
                onManageBilling={openBillingPortal}
                onUpgrade={startCheckout}
              />

              <label>
                Project title
                <input
                  required
                  minLength={2}
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="The Last Frame"
                />
              </label>

              <div className="field-pair">
                <label>
                  Genre
                  <input
                    value={form.genre}
                    onChange={(event) => updateForm("genre", event.target.value)}
                    placeholder="Sci-fi drama"
                  />
                </label>
                <label>
                  Tone
                  <input
                    value={form.tone}
                    onChange={(event) => updateForm("tone", event.target.value)}
                    placeholder="Elegant, tense, intimate"
                  />
                </label>
              </div>

              <label>
                Logline
                <textarea
                  value={form.logline}
                  onChange={(event) => updateForm("logline", event.target.value)}
                  placeholder="A filmmaker races to preserve the last human memory before an AI archive rewrites history."
                />
              </label>

              <label>
                Cinematic references
                <input
                  value={form.inspirations}
                  onChange={(event) => updateForm("inspirations", event.target.value)}
                  placeholder="Arrival, Children of Men, Ex Machina"
                />
              </label>

              <label>
                {modeCopy.starterLabel}
                <textarea
                  value={form.initialContent}
                  onChange={(event) => updateForm("initialContent", event.target.value)}
                  placeholder={modeCopy.starterPlaceholder}
                />
              </label>

              {hasReachedFreeProjectLimit ? (
                <p className="status error">
                  Free MiseForge includes 1 project. Founder Pro unlocks multiple films and the
                  full production workflow for $12.99/month.
                </p>
              ) : null}

              <button className="button" type="submit" disabled={isSaving || hasReachedFreeProjectLimit}>
                {isSaving ? "Saving..." : hasReachedFreeProjectLimit ? "Pro unlocks more projects" : modeCopy.submitLabel}
              </button>
            </form>
          )}

          <div className="project-list">
            <div className="list-heading">
              <h3>Saved projects</h3>
              <span>{isLoadingProjects ? "Loading" : `${projects.length} saved`}</span>
            </div>

            {projects.length === 0 ? (
              <p className="empty-state">
                No saved projects yet. Choose a start path, create a project shell, then MiseForge
                opens the command center around it.
              </p>
            ) : (
              projects.map((project) => (
                <a
                  className={`project-item ${project.id === selectedProjectId ? "active" : ""}`}
                  href={`/app/projects/${project.id}`}
                  key={project.id}
                >
                  <span>{project.active_stage}</span>
                  <h4>{project.title}</h4>
                  <p>{project.logline || "No logline yet."}</p>
                  <small>
                    {[project.genre, project.tone].filter(Boolean).join(" / ") || "Ready to open"}
                  </small>
                  <strong>Open command center</strong>
                </a>
              ))
            )}

            <button
              className="button secondary full-width"
              type="button"
              onClick={() => {
                setSelectedProjectId("");
                setDraftText("");
              }}
            >
              New Project
            </button>
          </div>
        </div>
      )}

      {message ? (
        <p className="status success" aria-live="polite">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="status error" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export function ProjectWorkspace({
  accessToken,
  draftText,
  documents = [],
  entitlement = freeEntitlement,
  isOpeningBillingPortal = false,
  isStartingCheckout = false,
  onDocumentsChange,
  onManageBilling,
  onUpgrade,
  onProductionAssetsChange,
  onSceneBreakdownsChange,
  productionAssets = [],
  project,
  sceneBreakdowns = [],
  userEmail,
  onBack,
  onDraftChange,
}: {
  accessToken?: string;
  draftText: string;
  documents?: ProjectDocument[];
  entitlement?: AccessEntitlement;
  isOpeningBillingPortal?: boolean;
  isStartingCheckout?: boolean;
  onDocumentsChange?: (documents: ProjectDocument[]) => void;
  onManageBilling?: () => void;
  onUpgrade?: () => void;
  onProductionAssetsChange?: (productionAssets: ProductionAsset[]) => void;
  onSceneBreakdownsChange?: (sceneBreakdowns: SceneBreakdown[]) => void;
  productionAssets?: ProductionAsset[];
  project: Project;
  sceneBreakdowns?: SceneBreakdown[];
  userEmail: string;
  onBack: () => void;
  onDraftChange: (value: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialStep =
    pipelineSteps.find((step) => step.projectStage === project.active_stage)?.id ?? "idea";
  const [activeStepId, setActiveStepId] = useState<StageId>(initialStep);
  const [drafts, setDrafts] = useState<Record<DocType, string>>({
    idea: "",
    synopsis: "",
    treatment: "",
    character_bible: "",
    location_bible: "",
    look_book: "",
    story: "",
    script: "",
    dialogue_notes: "",
    continuity_tracker: "",
    breakdown_notes: "",
    production_schedule: "",
    sound_map: "",
  });
  const [workflowTools, setWorkflowTools] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [versions, setVersions] = useState<LocalVersion[]>([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSavingStage, setIsSavingStage] = useState(false);
  const [isSavingPacket, setIsSavingPacket] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState("");
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, SceneBreakdownDraft>>({});
  const [buildingShotListSceneId, setBuildingShotListSceneId] = useState("");
  const [creatingAssetSceneId, setCreatingAssetSceneId] = useState("");
  const [dialogueScan, setDialogueScan] = useState<DialogueScan | null>(null);
  const [generatingAssetPromptId, setGeneratingAssetPromptId] = useState("");
  const [savingSceneId, setSavingSceneId] = useState("");
  const activeStep = pipelineSteps.find((step) => step.id === activeStepId) ?? pipelineSteps[0];
  const currentDraft = drafts[activeStep.docType] ?? "";
  const assetsBySceneId = useMemo(() => {
    return productionAssets.reduce<Record<string, ProductionAsset[]>>((grouped, asset) => {
      const key = asset.scene_breakdown_id;
      grouped[key] = [...(grouped[key] ?? []), asset];
      return grouped;
    }, {});
  }, [productionAssets]);
  const characterBibleNames = useMemo(() => {
    return uniqueSorted(sceneBreakdowns.flatMap((scene) => scene.characters ?? []));
  }, [sceneBreakdowns]);
  const characterProfiles = useMemo<CharacterContinuityProfile[]>(() => {
    const sceneById = new Map(sceneBreakdowns.map((scene) => [scene.id, scene]));

    return characterBibleNames.map((name) => {
      const appearances = scenesForValue(sceneBreakdowns, "characters", name);
      const appearanceIds = new Set(appearances.map((scene) => scene.id));
      const characterAssets = productionAssets.filter((asset) => appearanceIds.has(asset.scene_breakdown_id));
      const wardrobe = uniqueSorted(appearances.flatMap((scene) => scene.wardrobe ?? [])).slice(0, 10);
      const props = uniqueSorted(appearances.flatMap((scene) => scene.props ?? [])).slice(0, 10);
      const locations = uniqueSorted(appearances.map((scene) => scene.location)).slice(0, 10);
      const coCharacters = uniqueSorted(
        appearances.flatMap((scene) =>
          (scene.characters ?? []).filter((character) => character.trim().toLowerCase() !== name.trim().toLowerCase()),
        ),
      ).slice(0, 10);
      const toneNotes = uniqueSorted(appearances.map((scene) => scene.tone || scene.color_palette)).slice(0, 8);
      const soundNotes = uniqueSorted(appearances.map((scene) => scene.sound_notes)).slice(0, 5);
      const readinessChecks = [
        { label: "scene appearances", ready: appearances.length > 0 },
        { label: "wardrobe baseline", ready: wardrobe.length > 0 },
        { label: "carried props", ready: props.length > 0 },
        { label: "location map", ready: locations.length > 0 },
        { label: "relationship map", ready: coCharacters.length > 0 },
        {
          label: "prompt rows",
          ready: characterAssets.some((asset) => hasText(asset.image_prompt) || hasText(asset.animation_prompt)),
        },
      ];

      return {
        appearances,
        coCharacters,
        locations,
        missing: readinessChecks.filter((check) => !check.ready).map((check) => check.label),
        name,
        productionAssets: characterAssets.sort((first, second) => {
          const firstScene = sceneById.get(first.scene_breakdown_id)?.scene_number ?? 999;
          const secondScene = sceneById.get(second.scene_breakdown_id)?.scene_number ?? 999;
          return firstScene - secondScene || first.order_index - second.order_index;
        }),
        props,
        readiness: Math.round((readinessChecks.filter((check) => check.ready).length / readinessChecks.length) * 100),
        sceneLabels: appearances.map(sceneBoardLabel),
        soundNotes,
        toneNotes,
        wardrobe,
      };
    });
  }, [characterBibleNames, productionAssets, sceneBreakdowns]);
  const locationBibleNames = useMemo(() => {
    return uniqueSorted(sceneBreakdowns.map((scene) => scene.location));
  }, [sceneBreakdowns]);
  const locationProfiles = useMemo<LocationContinuityProfile[]>(() => {
    const sceneById = new Map(sceneBreakdowns.map((scene) => [scene.id, scene]));

    return locationBibleNames.map((name) => {
      const normalizedName = name.trim().toLowerCase();
      const scenes = sceneBreakdowns.filter((scene) => scene.location?.trim().toLowerCase() === normalizedName);
      const sceneIds = new Set(scenes.map((scene) => scene.id));
      const locationAssets = productionAssets.filter((asset) => sceneIds.has(asset.scene_breakdown_id));
      const setDressing = uniqueSorted(scenes.flatMap((scene) => scene.set_dressing ?? [])).slice(0, 12);
      const props = uniqueSorted(scenes.flatMap((scene) => scene.props ?? [])).slice(0, 12);
      const wardrobe = uniqueSorted(scenes.flatMap((scene) => scene.wardrobe ?? [])).slice(0, 12);
      const characters = uniqueSorted(scenes.flatMap((scene) => scene.characters ?? [])).slice(0, 12);
      const timeOfDays = uniqueSorted(scenes.map((scene) => scene.time_of_day)).slice(0, 8);
      const colorNotes = uniqueSorted(scenes.map((scene) => scene.color_palette || scene.tone)).slice(0, 8);
      const soundNotes = uniqueSorted(scenes.map((scene) => scene.sound_notes)).slice(0, 8);
      const blockingNotes = uniqueSorted(scenes.map((scene) => scene.blocking)).slice(0, 8);
      const readinessChecks = [
        { label: "scene usage", ready: scenes.length > 0 },
        { label: "time-of-day rules", ready: timeOfDays.length > 0 },
        { label: "layout or blocking", ready: blockingNotes.length > 0 },
        { label: "set dressing", ready: setDressing.length > 0 },
        { label: "sound texture", ready: soundNotes.length > 0 },
        { label: "color and lighting", ready: colorNotes.length > 0 },
        {
          label: "prompt rows",
          ready: locationAssets.some((asset) => hasText(asset.image_prompt) || hasText(asset.animation_prompt)),
        },
      ];

      return {
        blockingNotes,
        characters,
        colorNotes,
        missing: readinessChecks.filter((check) => !check.ready).map((check) => check.label),
        name,
        productionAssets: locationAssets.sort((first, second) => {
          const firstScene = sceneById.get(first.scene_breakdown_id)?.scene_number ?? 999;
          const secondScene = sceneById.get(second.scene_breakdown_id)?.scene_number ?? 999;
          return firstScene - secondScene || first.order_index - second.order_index;
        }),
        props,
        readiness: Math.round((readinessChecks.filter((check) => check.ready).length / readinessChecks.length) * 100),
        sceneLabels: scenes.map(sceneBoardLabel),
        scenes,
        setDressing,
        soundNotes,
        timeOfDays,
        wardrobe,
      };
    });
  }, [locationBibleNames, productionAssets, sceneBreakdowns]);
  const continuityRows = useMemo<ContinuityTrackerRow[]>(() => {
    const orderedScenes = [...sceneBreakdowns].sort((first, second) => first.scene_number - second.scene_number);

    return orderedScenes.map((scene, index) => {
      const previousScene = orderedScenes[index - 1];
      const missing = [
        hasList(scene.characters) ? "" : "characters",
        hasList(scene.props) ? "" : "props",
        hasList(scene.wardrobe) ? "" : "wardrobe",
        hasText(scene.location) ? "" : "location",
        hasText(scene.time_of_day) ? "" : "time-of-day",
        hasText(scene.sound_notes) ? "" : "sound",
        hasText(scene.blocking) ? "" : "blocking",
        hasText(scene.color_palette || scene.tone) ? "" : "color/light",
      ].filter((value): value is string => Boolean(value));
      const sharedCharacters = previousScene ? sharedValues(scene.characters, previousScene.characters) : [];
      const sharedProps = previousScene ? sharedValues(scene.props, previousScene.props) : [];
      const sameLocation =
        previousScene && scene.location?.trim().toLowerCase() === previousScene.location?.trim().toLowerCase();
      const riskFlags = [
        sharedCharacters.length ? `Character handoff: ${sharedCharacters.join(", ")}` : "",
        sharedProps.length ? `Prop handoff: ${sharedProps.join(", ")}` : "",
        sameLocation ? "Same location as previous scene; verify layout, dressing, light, and sound state." : "",
        missing.length ? `Missing ${missing.join(", ")}` : "",
      ].filter((value): value is string => Boolean(value));
      const readinessChecks = [
        hasList(scene.characters),
        hasList(scene.props),
        hasList(scene.wardrobe),
        hasText(scene.location),
        hasText(scene.time_of_day),
        hasText(scene.sound_notes),
        hasText(scene.blocking),
        hasText(scene.color_palette || scene.tone),
      ];

      return {
        blocking: scene.blocking,
        characters: scene.characters ?? [],
        colorState: scene.color_palette || scene.tone,
        id: scene.id,
        location: scene.location,
        missing,
        previousSceneLabel: previousScene ? sceneBoardLabel(previousScene) : "Opening scene",
        props: scene.props ?? [],
        readiness: Math.round((readinessChecks.filter(Boolean).length / readinessChecks.length) * 100),
        riskFlags,
        sceneLabel: sceneBoardLabel(scene),
        setDressing: scene.set_dressing ?? [],
        soundState: scene.sound_notes,
        timeOfDay: scene.time_of_day,
        wardrobe: scene.wardrobe ?? [],
      };
    });
  }, [sceneBreakdowns]);
  const continuityItemProfiles = useMemo<ContinuityItemProfile[]>(() => {
    const buildProfiles = (
      values: string[],
      field: "props" | "wardrobe" | "set_dressing",
      type: ContinuityItemProfile["type"],
    ) =>
      uniqueSorted(values)
        .map((label) => {
          const scenes = scenesForValue(sceneBreakdowns, field, label);
          const locations = uniqueSorted(scenes.map((scene) => scene.location)).slice(0, 6);
          const sceneLabels = scenes.map(sceneBoardLabel);

          return {
            id: `${type}:${label}`,
            label,
            locations,
            risk:
              scenes.length > 1
                ? "Track first appearance, owner/location, last state, and whether it changes intentionally."
                : "First appearance only; decide if this must carry forward.",
            sceneLabels,
            type,
          };
        })
        .filter((profile) => profile.sceneLabels.length > 0);

    return [
      ...buildProfiles(sceneBreakdowns.flatMap((scene) => scene.props ?? []), "props", "Prop"),
      ...buildProfiles(sceneBreakdowns.flatMap((scene) => scene.wardrobe ?? []), "wardrobe", "Wardrobe"),
      ...buildProfiles(sceneBreakdowns.flatMap((scene) => scene.set_dressing ?? []), "set_dressing", "Set dressing"),
    ].slice(0, 36);
  }, [sceneBreakdowns]);
  const visualSceneProfiles = useMemo<VisualSceneProfile[]>(() => {
    return [...sceneBreakdowns]
      .sort((first, second) => first.scene_number - second.scene_number)
      .map((scene) => {
        const colorState = scene.color_palette || scene.tone;
        const heroProp = firstListItem(scene.props, "story object");
        const missing = [
          hasText(scene.location) ? "" : "location",
          hasText(scene.time_of_day) ? "" : "time",
          hasText(colorState) ? "" : "color/tone",
          hasText(scene.blocking) ? "" : "blocking",
          hasText(scene.sound_notes) ? "" : "sound texture",
          hasList(scene.characters) ? "" : "characters",
          hasList(scene.props) ? "" : "props/motifs",
        ].filter((value): value is string => Boolean(value));
        const readinessChecks = [
          hasText(scene.location),
          hasText(scene.time_of_day),
          hasText(colorState),
          hasText(scene.blocking),
          hasText(scene.sound_notes),
          hasList(scene.characters),
          hasList(scene.props),
        ];

        return {
          cameraRule: scene.blocking
            ? `Camera must preserve this geography: ${scene.blocking}`
            : "Choose camera distance after blocking is mapped.",
          colorState: colorState || "Needs palette assignment",
          id: scene.id,
          lightingRule: colorState
            ? `Motivated light should protect ${colorState}.`
            : "Define practical light source, shadow behavior, and contrast level.",
          locationTime: `${scene.location || "Unmapped location"} / ${scene.time_of_day || "unmapped time"}`,
          missing,
          motif: heroProp,
          negativeRisk: missing.length
            ? `Risk of drift: ${missing.join(", ")} missing.`
            : "Low automatic drift risk; still check faces, wardrobe, props, light direction, and location layout.",
          readiness: Math.round((readinessChecks.filter(Boolean).length / readinessChecks.length) * 100),
          sceneLabel: sceneBoardLabel(scene),
        };
      });
  }, [sceneBreakdowns]);
  const visualStyleRules = useMemo<VisualStyleRule[]>(() => {
    const paletteScenes = visualSceneProfiles.filter((profile) => !profile.missing.includes("color/tone")).length;
    const shotAssets = productionAssets.filter((asset) => asset.asset_type === "shot");
    const imagePrompts = productionAssets.filter((asset) => hasText(asset.image_prompt));
    const promptAnchors = imagePrompts.filter((asset) => {
      const prompt = asset.image_prompt.toLowerCase();

      return prompt.includes("lighting") || prompt.includes("palette") || prompt.includes("continuity");
    }).length;

    return [
      {
        anchors: [
          project.genre || "genre not set",
          project.tone || "tone not set",
          project.inspirations?.length ? project.inspirations.join(", ") : "references not set",
        ],
        body: "Defines what the audience should feel before any individual shot gets generated.",
        id: "visual-thesis",
        readiness: Math.round(
          ([hasText(project.genre), hasText(project.tone), Boolean(project.inspirations?.length)].filter(Boolean).length /
            3) *
            100,
        ),
        status: "Film-wide identity",
        title: "Visual thesis",
      },
      {
        anchors: uniqueSorted(sceneBreakdowns.flatMap((scene) => [scene.color_palette, scene.tone])).slice(0, 8),
        body: "Locks dominant colors, accent colors, contrast, and what should never appear in the palette.",
        id: "color-system",
        readiness: sceneBreakdowns.length ? Math.round((paletteScenes / sceneBreakdowns.length) * 100) : 0,
        status: `${paletteScenes} of ${sceneBreakdowns.length || 0} scenes`,
        title: "Color system",
      },
      {
        anchors: uniqueSorted(sceneBreakdowns.map((scene) => scene.blocking)).slice(0, 5),
        body: "Turns shot choices into repeatable rules for distance, movement, lens feel, and emotional turns.",
        id: "camera-grammar",
        readiness: sceneBreakdowns.length
          ? Math.round((sceneBreakdowns.filter((scene) => hasText(scene.blocking)).length / sceneBreakdowns.length) * 100)
          : 0,
        status: "Lens and movement",
        title: "Camera grammar",
      },
      {
        anchors: characterProfiles.map((profile) => `${profile.name}: ${profile.readiness}% ready`).slice(0, 8),
        body: "Protects faces, silhouettes, wardrobe baselines, carried props, and performance texture.",
        id: "character-anchors",
        readiness: characterProfiles.length
          ? Math.round(characterProfiles.reduce((total, profile) => total + profile.readiness, 0) / characterProfiles.length)
          : 0,
        status: `${characterProfiles.length} character${characterProfiles.length === 1 ? "" : "s"}`,
        title: "Character anchors",
      },
      {
        anchors: locationProfiles.map((profile) => `${profile.name}: ${profile.readiness}% ready`).slice(0, 8),
        body: "Protects layout, practical lights, set dressing, sound texture, weather, and room scale.",
        id: "location-anchors",
        readiness: locationProfiles.length
          ? Math.round(locationProfiles.reduce((total, profile) => total + profile.readiness, 0) / locationProfiles.length)
          : 0,
        status: `${locationProfiles.length} location${locationProfiles.length === 1 ? "" : "s"}`,
        title: "Location anchors",
      },
      {
        anchors: [
          "No text, captions, or logos",
          "No random props or extra characters",
          "No inconsistent wardrobe, wrong time of day, or mismatched location layout",
        ],
        body: "Creates a reusable guardrail for every image, animation, and storyboard prompt.",
        id: "negative-deck",
        readiness: promptAnchors && imagePrompts.length ? Math.round((promptAnchors / imagePrompts.length) * 100) : 0,
        status: `${imagePrompts.length} image prompt${imagePrompts.length === 1 ? "" : "s"}`,
        title: "Negative prompt deck",
      },
      {
        anchors: [
          `${shotAssets.length} shot row${shotAssets.length === 1 ? "" : "s"}`,
          `${imagePrompts.length} image prompt${imagePrompts.length === 1 ? "" : "s"}`,
          workflowTools || "tool stack not set",
        ],
        body: "Adapts the same look rules to image tools, animation tools, sound tools, edit, and color.",
        id: "tool-adapters",
        readiness: Math.round(
          ([Boolean(shotAssets.length), Boolean(imagePrompts.length), hasText(workflowTools)].filter(Boolean).length / 3) *
            100,
        ),
        status: "Workflow handoff",
        title: "Tool adapters",
      },
    ];
  }, [characterProfiles, locationProfiles, productionAssets, project, sceneBreakdowns, visualSceneProfiles, workflowTools]);
  const readiness = useMemo(() => {
    const shotAssets = productionAssets.filter((asset) => asset.asset_type === "shot");
    const promptAssets = productionAssets.filter((asset) => asset.asset_type !== "shot");
    const imagePromptCount = productionAssets.filter((asset) => hasText(asset.image_prompt)).length;
    const animationPromptCount = productionAssets.filter(
      (asset) => hasText(asset.animation_prompt) || hasText(asset.sound_prompt),
    ).length;
    const sceneCompleteness = sceneBreakdowns.length
      ? sceneBreakdowns.filter(
          (scene) =>
            hasText(scene.summary) &&
            hasList(scene.characters) &&
            hasList(scene.props) &&
            hasText(scene.sound_notes) &&
            hasText(scene.blocking),
        ).length / sceneBreakdowns.length
      : 0;

    const checks = [
      completionLine(
        "Project has title, genre, tone, and logline",
        hasText(project.title) && hasText(project.genre) && hasText(project.tone) && hasText(project.logline),
      ),
      completionLine("Idea or script draft saved", hasText(drafts.idea) || hasText(drafts.script)),
      completionLine("Treatment or story notes started", hasText(drafts.treatment) || hasText(drafts.story)),
      completionLine("Character bible started", hasText(drafts.character_bible)),
      completionLine("Location bible started", hasText(drafts.location_bible)),
      completionLine("Visual look book started", hasText(drafts.look_book)),
      completionLine("Dialogue or AI-voice scan completed", hasText(drafts.dialogue_notes)),
      completionLine("Continuity tracker started", hasText(drafts.continuity_tracker)),
      completionLine("At least one scene packet saved", sceneBreakdowns.length > 0),
      completionLine("Scene packets include core production fields", sceneCompleteness >= 0.75),
      completionLine("Detailed shot list built", shotAssets.length > 0),
      completionLine("Image prompts generated", imagePromptCount > 0),
      completionLine("Animation plus sound prompts generated", animationPromptCount > 0),
      completionLine("Insert or prompt cards created", promptAssets.length > 0),
      completionLine("Production schedule started", hasText(drafts.production_schedule)),
      completionLine("Sound design map started", hasText(drafts.sound_map)),
      completionLine("Production packet ready to export", sceneBreakdowns.length > 0 && productionAssets.length > 0),
    ];
    const completedCount = checks.filter((check) => check.isComplete).length;
    const score = Math.round((completedCount / checks.length) * 100);
    const next = checks.find((check) => !check.isComplete)?.label ?? "Export the premium production packet";

    return {
      checks,
      completedCount,
      next,
      score,
      total: checks.length,
    };
  }, [drafts, productionAssets, project, sceneBreakdowns]);
  const scheduleLockPhases = useMemo<GenerationLockPhase[]>(() => {
    const averageCharacterReadiness = characterProfiles.length
      ? Math.round(characterProfiles.reduce((total, profile) => total + profile.readiness, 0) / characterProfiles.length)
      : 0;
    const averageLocationReadiness = locationProfiles.length
      ? Math.round(locationProfiles.reduce((total, profile) => total + profile.readiness, 0) / locationProfiles.length)
      : 0;
    const averageLookReadiness = visualStyleRules.length
      ? Math.round(visualStyleRules.reduce((total, rule) => total + rule.readiness, 0) / visualStyleRules.length)
      : 0;
    const averageContinuityReadiness = continuityRows.length
      ? Math.round(continuityRows.reduce((total, row) => total + row.readiness, 0) / continuityRows.length)
      : 0;
    const completeScenePackets = sceneBreakdowns.filter(
      (scene) =>
        hasText(scene.summary) &&
        hasList(scene.characters) &&
        hasList(scene.props) &&
        hasList(scene.wardrobe) &&
        hasText(scene.sound_notes) &&
        hasText(scene.blocking),
    ).length;
    const shotAssets = productionAssets.filter((asset) => asset.asset_type === "shot");
    const imagePromptAssets = productionAssets.filter((asset) => hasText(asset.image_prompt));
    const animationSoundAssets = productionAssets.filter(
      (asset) => hasText(asset.animation_prompt) || hasText(asset.sound_prompt),
    );

    return [
      {
        detail: "The premise, tone, logline, treatment, and scene intent are stable enough to protect every later choice.",
        id: "story-lock",
        isReady:
          hasText(project.logline) &&
          hasText(project.genre) &&
          hasText(project.tone) &&
          (hasText(drafts.idea) || hasText(drafts.treatment) || hasText(drafts.story)),
        items: [
          project.logline ? `Logline: ${project.logline}` : "Write the one-sentence movie promise.",
          drafts.treatment ? "Treatment or story notes are started." : "Start the treatment blueprint.",
          project.tone ? `Tone locked as ${project.tone}.` : "Name the emotional tone.",
        ],
        label: "Story lock",
        status: hasText(project.logline) ? "Story spine started" : "Needs premise spine",
      },
      {
        detail: "Faces, wardrobe, carried props, speech patterns, and location rules are anchored before image generation.",
        id: "identity-lock",
        isReady: characterProfiles.length > 0 && averageCharacterReadiness >= 60 && locationProfiles.length > 0 && averageLocationReadiness >= 60,
        items: [
          `${characterProfiles.length} character bible profile${characterProfiles.length === 1 ? "" : "s"} at ${averageCharacterReadiness}% average.`,
          `${locationProfiles.length} location bible profile${locationProfiles.length === 1 ? "" : "s"} at ${averageLocationReadiness}% average.`,
          "Fill visual anchors before final still frames.",
        ],
        label: "Character and location lock",
        status: `${averageCharacterReadiness}% character / ${averageLocationReadiness}% location`,
      },
      {
        detail: "The film-wide palette, lighting grammar, camera grammar, negative prompts, and tool adapters are defined.",
        id: "look-lock",
        isReady: hasText(drafts.look_book) && averageLookReadiness >= 55,
        items: [
          drafts.look_book ? "Look book document started." : "Build the visual look book.",
          `${averageLookReadiness}% average look-rule readiness.`,
          workflowTools || "Add image, animation, sound, and edit tools.",
        ],
        label: "Visual language lock",
        status: `${averageLookReadiness}% look ready`,
      },
      {
        detail: "Cross-scene props, wardrobe, light, sound state, geography, and emotional handoffs have been checked.",
        id: "continuity-lock",
        isReady: continuityRows.length > 0 && averageContinuityReadiness >= 70 && hasText(drafts.continuity_tracker),
        items: [
          `${continuityRows.length} continuity row${continuityRows.length === 1 ? "" : "s"} mapped.`,
          `${averageContinuityReadiness}% average continuity readiness.`,
          drafts.continuity_tracker ? "Continuity tracker document started." : "Build the continuity tracker.",
        ],
        label: "Continuity lock",
        status: `${averageContinuityReadiness}% continuity`,
      },
      {
        detail: "Scene packets include enough production data to become a real shot list and prompt plan.",
        id: "scene-lock",
        isReady: sceneBreakdowns.length > 0 && completeScenePackets === sceneBreakdowns.length,
        items: [
          `${sceneBreakdowns.length} scene packet${sceneBreakdowns.length === 1 ? "" : "s"} saved.`,
          `${completeScenePackets} scene packet${completeScenePackets === 1 ? "" : "s"} include core fields.`,
          "Fill purpose, characters, props, wardrobe, sound, and blocking.",
        ],
        label: "Scene packet lock",
        status: `${completeScenePackets} of ${sceneBreakdowns.length || 0} complete`,
      },
      {
        detail: "A detailed shot list exists before image prompts expand into expensive generation work.",
        id: "shot-lock",
        isReady: shotAssets.length > 0,
        items: [
          `${shotAssets.length} detailed shot row${shotAssets.length === 1 ? "" : "s"} built.`,
          "Shots should include type, purpose, visual action, and dialogue/sound handoff.",
          "Insert shots come after scene geography is stable.",
        ],
        label: "Shot-list lock",
        status: `${shotAssets.length} shots`,
      },
      {
        detail: "Still-image anchors exist before animation, sound, and final packet export.",
        id: "image-lock",
        isReady: imagePromptAssets.length > 0,
        items: [
          `${imagePromptAssets.length} image prompt${imagePromptAssets.length === 1 ? "" : "s"} ready.`,
          "Approve character, wardrobe, prop, and location continuity in stills first.",
          "Regenerate failed stills before animation begins.",
        ],
        label: "Image prompt lock",
        status: `${imagePromptAssets.length} image prompts`,
      },
      {
        detail: "Animation, sound design, dialogue timing, and export notes are ready for the final production packet.",
        id: "handoff-lock",
        isReady: animationSoundAssets.length > 0 && hasText(drafts.sound_map) && hasText(drafts.production_schedule),
        items: [
          `${animationSoundAssets.length} animation or sound handoff row${animationSoundAssets.length === 1 ? "" : "s"} ready.`,
          drafts.sound_map ? "Sound map started." : "Build the sound design map.",
          drafts.production_schedule ? "Production schedule started." : "Build the production schedule.",
        ],
        label: "Animation, sound, and export lock",
        status: hasText(drafts.production_schedule) ? "Export path started" : "Needs schedule",
      },
    ];
  }, [
    characterProfiles,
    continuityRows,
    drafts,
    locationProfiles,
    productionAssets,
    project,
    sceneBreakdowns,
    visualStyleRules,
    workflowTools,
  ]);
  const generationQueue = useMemo<GenerationQueueItem[]>(() => {
    const priorityWeight: Record<GenerationQueueItem["priority"], number> = {
      High: 0,
      Medium: 1,
      Low: 2,
    };
    const lockItems = scheduleLockPhases
      .filter((phase) => !phase.isReady)
      .map<GenerationQueueItem>((phase, index) => ({
        blocker: phase.items.slice(0, 2).join(" "),
        id: `lock-${phase.id}`,
        kind: "Lock gate",
        label: phase.label,
        nextAction: phase.items[0] ?? phase.detail,
        priority: index < 3 ? "High" : "Medium",
        status: phase.status,
      }));
    const sceneItems = sceneBreakdowns.map<GenerationQueueItem>((scene) => {
      const sceneAssets = assetsBySceneId[scene.id] ?? [];
      const shotCount = sceneAssets.filter((asset) => asset.asset_type === "shot").length;
      const imagePromptCount = sceneAssets.filter((asset) => hasText(asset.image_prompt)).length;
      const animationSoundCount = sceneAssets.filter(
        (asset) => hasText(asset.animation_prompt) || hasText(asset.sound_prompt),
      ).length;
      const missing = [
        hasText(scene.summary) ? "" : "purpose",
        hasList(scene.characters) ? "" : "characters",
        hasList(scene.props) ? "" : "props",
        hasList(scene.wardrobe) ? "" : "wardrobe",
        hasText(scene.sound_notes) ? "" : "sound",
        hasText(scene.blocking) ? "" : "blocking",
        hasText(scene.color_palette || scene.tone) ? "" : "look",
      ].filter((value): value is string => Boolean(value));
      const priority: GenerationQueueItem["priority"] =
        missing.length >= 3 || !shotCount ? "High" : !imagePromptCount || !animationSoundCount ? "Medium" : "Low";
      const nextAction = missing.length
        ? `Fill ${missing.slice(0, 3).join(", ")} before prompt work.`
        : !shotCount
          ? "Build the detailed shot list before insert expansion."
          : !imagePromptCount
            ? "Generate image prompts for approved shots."
            : !animationSoundCount
              ? "Generate animation, sound, and dialogue handoff prompts."
              : "Review continuity and prepare this scene for export.";

      return {
        blocker: missing.length ? missing.join(", ") : "No core field blocker.",
        id: `scene-${scene.id}`,
        kind: "Scene",
        label: sceneBoardLabel(scene),
        nextAction,
        priority,
        status: `${shotCount} shots / ${imagePromptCount} image / ${animationSoundCount} motion-sound`,
      };
    });

    return [...lockItems, ...sceneItems]
      .sort((first, second) => priorityWeight[first.priority] - priorityWeight[second.priority])
      .slice(0, 8);
  }, [assetsBySceneId, sceneBreakdowns, scheduleLockPhases]);
  const scheduleReadyCount = scheduleLockPhases.filter((phase) => phase.isReady).length;
  const soundScenePlans = useMemo<SoundScenePlan[]>(() => {
    return [...sceneBreakdowns]
      .sort((first, second) => first.scene_number - second.scene_number)
      .map((scene) => {
        const sceneAssets = assetsBySceneId[scene.id] ?? [];
        const soundPromptCount = sceneAssets.filter((asset) => hasText(asset.sound_prompt)).length;
        const animationPromptCount = sceneAssets.filter((asset) => hasText(asset.animation_prompt)).length;
        const dialogueLikely = hasList(scene.characters) || /\b[A-Z][A-Z0-9' -]{1,}\n/.test(drafts.script);
        const heroProp = firstListItem(scene.props, "the key prop");
        const blockers = [
          hasText(scene.location) ? "" : "location",
          hasText(scene.time_of_day) ? "" : "time of day",
          hasText(scene.sound_notes) ? "" : "room tone",
          hasList(scene.props) ? "" : "foley props",
          hasText(scene.blocking) ? "" : "movement and blocking",
          soundPromptCount ? "" : "sound prompt",
          animationPromptCount ? "" : "animation handoff",
        ].filter((value): value is string => Boolean(value));
        const readinessChecks = [
          hasText(scene.location),
          hasText(scene.time_of_day),
          hasText(scene.sound_notes),
          hasList(scene.props),
          hasText(scene.blocking),
          soundPromptCount > 0,
          animationPromptCount > 0,
        ];
        const priority: SoundScenePlan["priority"] =
          blockers.length >= 4 ? "High" : blockers.length >= 2 ? "Medium" : "Low";

        return {
          animationHandoff: animationPromptCount
            ? `${animationPromptCount} animation prompt${animationPromptCount === 1 ? "" : "s"} need sync, perspective, foley, breath, and dialogue timing checks.`
            : "No animation handoff yet. Add timing, movement, sync risk, and what each visible action should sound like.",
          blockers,
          dialogueRule: dialogueLikely
            ? "Protect intelligibility, breath, pause points, overlaps, off-screen space, and the silence before or after major decisions."
            : "No obvious dialogue handoff yet. Decide whether silence, breath, or off-screen texture should carry the beat.",
          foleyRule: scene.props?.length
            ? `${scene.props.slice(0, 4).join(", ")} need close handling texture, ownership, and continuity.`
            : `Build foley around ${heroProp}, clothing movement, footsteps, surfaces, and contact sounds.`,
          id: scene.id,
          label: sceneBoardLabel(scene),
          locationTime: `${scene.location || "Unmapped location"} / ${scene.time_of_day || "unmapped time"}`,
          priority,
          readiness: Math.round((readinessChecks.filter(Boolean).length / readinessChecks.length) * 100),
          roomTone: scene.sound_notes
            ? scene.sound_notes
            : `Define base ambience, distance texture, practical hum, air, and silence behavior for ${scene.location || "this space"}.`,
          silenceRule:
            scene.tone || scene.color_palette
              ? `Use silence to support ${scene.tone || scene.color_palette}; do not let music explain the emotion.`
              : "Name where the scene needs silence, restraint, or a sound drop instead of score.",
          soundPromptCount,
          status: `${soundPromptCount} sound / ${animationPromptCount} animation prompts`,
        };
      });
  }, [assetsBySceneId, drafts.script, sceneBreakdowns]);
  const soundLayerCards = useMemo<SoundLayerCard[]>(() => {
    const sceneSoundCount = sceneBreakdowns.filter((scene) => hasText(scene.sound_notes)).length;
    const propSoundCount = uniqueSorted(sceneBreakdowns.flatMap((scene) => scene.props ?? [])).length;
    const locationSoundCount = locationProfiles.filter((profile) => profile.soundNotes.length > 0).length;
    const soundPromptCount = productionAssets.filter((asset) => hasText(asset.sound_prompt)).length;
    const animationPromptCount = productionAssets.filter((asset) => hasText(asset.animation_prompt)).length;
    const dialogueReady = hasText(drafts.dialogue_notes) || sceneBreakdowns.some((scene) => hasList(scene.characters));
    const soundContinuityReady = continuityRows.some((row) => hasText(row.soundState));

    return [
      {
        detail: "Base ambience, air, practical hum, exterior bleed, and silence behavior for every space.",
        id: "room-tone",
        isReady: sceneBreakdowns.length > 0 && sceneSoundCount === sceneBreakdowns.length,
        items: [
          `${sceneSoundCount} of ${sceneBreakdowns.length || 0} scenes include sound notes.`,
          `${locationSoundCount} location profile${locationSoundCount === 1 ? "" : "s"} include sound texture.`,
          "Room tone should continue under dialogue and cuts.",
        ],
        label: "Room tone",
        status: `${sceneSoundCount} scene${sceneSoundCount === 1 ? "" : "s"} mapped`,
      },
      {
        detail: "Specific handling sounds for props, wardrobe, footsteps, doors, surfaces, and body movement.",
        id: "foley",
        isReady: propSoundCount > 0 && sceneBreakdowns.some((scene) => hasList(scene.props)),
        items: [
          `${propSoundCount} prop or motif sound source${propSoundCount === 1 ? "" : "s"}.`,
          "Give hero props emotional meaning through sound.",
          "Avoid generic whooshes unless motivated by visible movement.",
        ],
        label: "Foley and props",
        status: `${propSoundCount} sources`,
      },
      {
        detail: "Dialogue space, pauses, breath, overlap, off-screen texture, and when silence replaces explanation.",
        id: "dialogue-silence",
        isReady: dialogueReady && hasText(drafts.dialogue_notes),
        items: [
          drafts.dialogue_notes ? "Dialogue notes started." : "Run or write dialogue notes.",
          "Mark breath, pauses, overlaps, and moments that should not be scored.",
          "Keep room tone alive under lines.",
        ],
        label: "Dialogue and silence",
        status: dialogueReady ? "Dialogue source detected" : "Needs dialogue pass",
      },
      {
        detail: "Every animated shot needs sounds tied to visible motion, camera perspective, sync, and dialogue timing.",
        id: "animation-handoff",
        isReady: soundPromptCount > 0 && animationPromptCount > 0,
        items: [
          `${animationPromptCount} animation prompt${animationPromptCount === 1 ? "" : "s"}.`,
          `${soundPromptCount} sound prompt${soundPromptCount === 1 ? "" : "s"}.`,
          "Approve stills, then sync sound to the animation plan.",
        ],
        label: "Animation handoff",
        status: `${soundPromptCount} sound rows`,
      },
      {
        detail: "Sound state must match location, prop, wardrobe, and emotional continuity across scenes.",
        id: "sound-continuity",
        isReady: soundContinuityReady && hasText(drafts.continuity_tracker),
        items: [
          soundContinuityReady ? "Continuity rows include sound state." : "Add sound state to continuity rows.",
          drafts.continuity_tracker ? "Continuity tracker started." : "Build the continuity tracker.",
          "Check room tone and prop sounds across adjacent scenes.",
        ],
        label: "Mix continuity",
        status: soundContinuityReady ? "Sound state started" : "Needs sound state",
      },
      {
        detail: "The export should include a sound thesis, scene map, prompt rows, animation handoff, and final mix checklist.",
        id: "sound-export",
        isReady: hasText(drafts.sound_map) && soundPromptCount > 0,
        items: [
          drafts.sound_map ? "Sound map document started." : "Build the Sound Design Map.",
          `${soundPromptCount} prompt-card sound row${soundPromptCount === 1 ? "" : "s"}.`,
          "Final packet should tell the editor what must be heard.",
        ],
        label: "Sound export",
        status: hasText(drafts.sound_map) ? "Document started" : "Needs sound map",
      },
    ];
  }, [continuityRows, drafts, locationProfiles, productionAssets, sceneBreakdowns]);
  const soundReadyCount = soundLayerCards.filter((layer) => layer.isReady).length;
  const soundPriorityQueue = useMemo<
    Array<{
      id: string;
      label: string;
      nextAction: string;
      priority: SoundScenePlan["priority"];
      status: string;
      type: string;
    }>
  >(() => {
    const priorityWeight: Record<SoundScenePlan["priority"], number> = {
      High: 0,
      Medium: 1,
      Low: 2,
    };
    const globalItems: Array<{
      id: string;
      label: string;
      nextAction: string;
      priority: SoundScenePlan["priority"];
      status: string;
      type: string;
    }> = soundLayerCards
      .filter((layer) => !layer.isReady)
      .map((layer, index) => ({
        id: `sound-layer-${layer.id}`,
        label: layer.label,
        nextAction: layer.items[0] ?? layer.detail,
        priority: index < 2 ? "High" : "Medium",
        status: layer.status,
        type: "Sound layer",
      }));
    const sceneItems: Array<{
      id: string;
      label: string;
      nextAction: string;
      priority: SoundScenePlan["priority"];
      status: string;
      type: string;
    }> = soundScenePlans.map((plan) => ({
      id: `sound-scene-${plan.id}`,
      label: plan.label,
      nextAction: plan.blockers.length
        ? `Fill ${plan.blockers.slice(0, 3).join(", ")}.`
        : "Review sound continuity and export this scene.",
      priority: plan.priority,
      status: `${plan.readiness}% ready`,
      type: "Scene sound",
    }));

    return [...globalItems, ...sceneItems]
      .sort((first, second) => priorityWeight[first.priority] - priorityWeight[second.priority])
      .slice(0, 6);
  }, [soundLayerCards, soundScenePlans]);
  const storyDiagnostics = useMemo<StoryDiagnostic[]>(() => {
    const source = [project.logline, drafts.idea, drafts.treatment, drafts.story, drafts.synopsis, draftText]
      .join("\n")
      .toLowerCase();

    return [
      {
        detail: project.logline || "No one-sentence movie promise has been locked yet.",
        isReady: hasText(project.logline) || storySourceHas(source, [/\blogline\b/, /\bwhen .+ must\b/]),
        label: "Logline promise",
        next: "Write one sentence with protagonist, active goal, pressure, and cost.",
      },
      {
        detail: "Protagonist, external want, inner need, obstacle, stakes, and irony.",
        isReady: storySourceHas(source, [/\bprotagonist\b/, /\bexternal want\b/, /\bwant\b.+\bneed\b/, /\bstakes\b/]),
        label: "Story engine",
        next: "Fill the protagonist want/need and central obstacle before scenes expand.",
      },
      {
        detail: "What the film argues beneath the plot.",
        isReady: storySourceHas(source, [/\btheme statement\b/, /\bcore thesis\b/, /\breally about beneath the plot\b/]),
        label: "Theme statement",
        next: "Name the emotional argument so every scene can make a sharper choice.",
      },
      {
        detail: "Where the main character starts, what pressure changes them, and where they end.",
        isReady: storySourceHas(source, [/\bcharacter arc\b/, /\bprotagonist starts\b/, /\bprotagonist ends\b/, /\bwant vs\.? need\b/]),
        label: "Character arc",
        next: "Map start state, false strategy, pressure, midpoint shift, and final decision.",
      },
      {
        detail: "Opening image, inciting incident, midpoint, low point, final choice, ending image.",
        isReady: storySourceHas(source, [/\bact 1\b/, /\bmidpoint\b/, /\blow point\b/, /\bending image\b/, /\bact movement\b/]),
        label: "Act path",
        next: "Turn the idea into a beginning, escalation, reversal, collapse, and final proof.",
      },
      {
        detail: "Professional prose that can become scenes, packets, shot lists, prompts, and exports.",
        isReady: hasText(drafts.treatment) && storySourceHas(source, [/\btreatment draft\b/, /\bsequence\b/, /\bset piece\b/]),
        label: "Treatment draft",
        next: "Write the story in cinematic paragraphs, not just bullets.",
      },
    ];
  }, [draftText, drafts, project]);
  const storyReadyCount = storyDiagnostics.filter((item) => item.isReady).length;
  const storySuiteScore = Math.round((storyReadyCount / storyDiagnostics.length) * 100);
  const productionBoard = useMemo(() => {
    const sceneById = new Map(sceneBreakdowns.map((scene) => [scene.id, scene]));
    const sceneItems = (field: "props" | "wardrobe" | "set_dressing") =>
      sceneBreakdowns.flatMap((scene) =>
        (scene[field] ?? [])
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => ({
            detail: sceneBoardLabel(scene),
            id: `${field}:${scene.id}:${value}`,
            label: value,
            sceneId: scene.id,
          })),
      );
    const locationItems = sceneBreakdowns
      .filter((scene) => hasText(scene.location))
      .map((scene) => ({
        detail: `${scene.time_of_day || "No time"} / ${sceneBoardLabel(scene)}`,
        id: `location:${scene.id}`,
        label: scene.location,
        sceneId: scene.id,
      }));
    const soundItems = sceneBreakdowns
      .filter((scene) => hasText(scene.sound_notes))
      .map((scene) => ({
        detail: scene.sound_notes,
        id: `sound:${scene.id}`,
        label: sceneBoardLabel(scene),
        sceneId: scene.id,
      }));
    const shotItems = productionAssets
      .filter((asset) => asset.asset_type === "shot")
      .map((asset) => {
        const scene = sceneById.get(asset.scene_breakdown_id);

        return {
          detail: asset.visual || (scene ? sceneBoardLabel(scene) : "No scene source"),
          id: `shot:${asset.id}`,
          label: asset.name,
          sceneId: asset.scene_breakdown_id,
        };
      });
    const insertItems = productionAssets
      .filter((asset) => asset.asset_type !== "shot")
      .map((asset) => ({
        detail: asset.purpose || asset.visual,
        id: `insert:${asset.id}`,
        label: asset.name,
        sceneId: asset.scene_breakdown_id,
      }));
    const promptItems = productionAssets
      .filter((asset) => hasText(asset.image_prompt) || hasText(asset.animation_prompt) || hasText(asset.sound_prompt))
      .map((asset) => ({
        detail: [
          hasText(asset.image_prompt) ? "image" : "",
          hasText(asset.animation_prompt) ? "animation" : "",
          hasText(asset.sound_prompt) ? "sound/dialogue" : "",
        ]
          .filter(Boolean)
          .join(" / "),
        id: `prompt:${asset.id}`,
        label: asset.name,
        sceneId: asset.scene_breakdown_id,
      }));

    return [
      { id: "props", label: "Props", items: sceneItems("props") },
      { id: "wardrobe", label: "Wardrobe", items: sceneItems("wardrobe") },
      { id: "locations", label: "Locations", items: locationItems },
      { id: "sound", label: "Sound", items: soundItems },
      { id: "insert-shots", label: "Insert Shots", items: insertItems },
      { id: "prompt-readiness", label: "Prompt Readiness", items: promptItems },
      { id: "shot-list", label: "Shot List", items: shotItems },
      { id: "set-dressing", label: "Set Dressing", items: sceneItems("set_dressing") },
    ];
  }, [productionAssets, sceneBreakdowns]);
  const guideContext = useMemo<GuideAssistantContext>(() => {
    const guideNote = stageGuideNotes[activeStep.id];
    const activeChips = [
      `${entitlement.planLabel} access`,
      `${readiness.score}% ready`,
      `${sceneBreakdowns.length} scene${sceneBreakdowns.length === 1 ? "" : "s"}`,
      `${productionAssets.length} asset${productionAssets.length === 1 ? "" : "s"}`,
    ];

    return {
      activeStageLabel: activeStep.label,
      assetCount: productionAssets.length,
      body: `${guideNote.teaching} Current readiness is ${readiness.score}%. Next: ${readiness.next}.`,
      chips: activeChips,
      eyebrow: "MiseForge Guide",
      nextAction: readiness.next,
      planLabel: entitlement.planLabel,
      projectTitle: project.title,
      readinessScore: readiness.score,
      sceneCount: sceneBreakdowns.length,
      speech: guideNote.speech,
      title: guideNote.title,
    };
  }, [activeStep.id, activeStep.label, entitlement.planLabel, productionAssets.length, project.title, readiness.next, readiness.score, sceneBreakdowns.length]);

  const launchReadinessCards = useMemo(() => {
    const packetReady = sceneBreakdowns.length > 0 && productionAssets.length > 0;
    const sceneLabel = sceneBreakdowns.length === 1 ? "scene packet" : "scene packets";
    const assetLabel = productionAssets.length === 1 ? "asset" : "assets";

    return [
      {
        detail: activeStep.description,
        label: "Current room",
        value: activeStep.label,
      },
      {
        detail: `${readiness.completedCount} of ${readiness.total} checks complete. Next: ${readiness.next}.`,
        label: "Production readiness",
        value: `${readiness.score}%`,
      },
      {
        detail: `${sceneBreakdowns.length} ${sceneLabel} / ${productionAssets.length} ${assetLabel}.`,
        label: "Packet status",
        value: packetReady ? "Export path open" : "Build the packet",
      },
      {
        detail: entitlement.isPro
          ? "Full workspace, exports, bibles, versions, and project depth are unlocked."
          : "Free preview: one project, one scene-packet preview, prompt copying, and Markdown export.",
        label: "Access",
        value: entitlement.planLabel,
      },
    ];
  }, [
    activeStep.description,
    activeStep.label,
    entitlement.isPro,
    entitlement.planLabel,
    productionAssets.length,
    readiness.completedCount,
    readiness.next,
    readiness.score,
    readiness.total,
    sceneBreakdowns.length,
  ]);

  const completedStageIds = useMemo(() => {
    const completed = new Set<StageId>();
    const hasShotRows = productionAssets.some((asset) => asset.asset_type === "shot");
    const hasPromptRows = productionAssets.some(
      (asset) => hasText(asset.image_prompt) || hasText(asset.animation_prompt) || hasText(asset.sound_prompt),
    );

    if (hasText(project.logline) || hasText(drafts.idea)) completed.add("idea");
    if (hasText(drafts.treatment)) completed.add("treatment");
    if (hasText(drafts.character_bible) || characterProfiles.length > 0) completed.add("characters");
    if (hasText(drafts.location_bible) || locationProfiles.length > 0) completed.add("locations");
    if (hasText(drafts.look_book) || visualStyleRules.length > 0) completed.add("lookbook");
    if (hasText(drafts.script)) completed.add("script");
    if (hasText(drafts.dialogue_notes) || dialogueScan) completed.add("dialogue");
    if (hasText(drafts.continuity_tracker)) completed.add("continuity");
    if (sceneBreakdowns.length > 0) completed.add("breakdown");
    if (hasText(drafts.production_schedule)) completed.add("schedule");
    if (hasText(drafts.sound_map)) completed.add("sound");
    if (hasShotRows || hasPromptRows || productionAssets.length > 0) completed.add("production");

    return completed;
  }, [
    characterProfiles.length,
    dialogueScan,
    drafts,
    locationProfiles.length,
    productionAssets,
    project.logline,
    sceneBreakdowns.length,
    visualStyleRules.length,
  ]);

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };

      for (const document of documents) {
        next[document.doc_type] = document.content;
      }

      if (draftText && !next.idea) {
        next.idea = draftText;
      }

      return next;
    });
  }, [documents, draftText]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(versionStorageKey(project.id));
      const parsed = stored ? (JSON.parse(stored) as LocalVersion[]) : [];

      setVersions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setVersions([]);
    }
  }, [project.id]);

  function writeVersions(nextVersions: LocalVersion[]) {
    setVersions(nextVersions);

    try {
      window.localStorage.setItem(versionStorageKey(project.id), JSON.stringify(nextVersions));
      return true;
    } catch {
      setSaveError("Your browser blocked local version storage.");
      return false;
    }
  }

  function requirePro(feature: string) {
    if (entitlement.isPro) {
      return true;
    }

    setSaveStatus("");
    setSaveError(
      `${feature} belongs to Founder Pro. Your free project can still build a preview, copy expert prompts, and export Markdown; upgrade when you want the full production system and premium PDF packet.`,
    );
    return false;
  }

  function saveLocalVersion() {
    if (!requirePro("Local version history")) {
      return;
    }

    const content = currentDraft.trim();

    if (!content) {
      setSaveError("Write or paste something before saving a version.");
      setSaveStatus("");
      return;
    }

    const nextVersion: LocalVersion = {
      id: createVersionId(),
      label: versionLabel.trim() || `${activeStep.label} pass`,
      docType: activeStep.docType,
      stageLabel: activeStep.label,
      content: currentDraft,
      createdAt: new Date().toISOString(),
    };
    const nextVersions = [nextVersion, ...versions].slice(0, 24);

    const didSave = writeVersions(nextVersions);

    if (!didSave) {
      return;
    }

    setVersionLabel("");
    setSaveStatus(`${nextVersion.label} saved to local version history.`);
    setSaveError("");
  }

  function restoreLocalVersion(version: LocalVersion) {
    if (!requirePro("Restoring saved passes")) {
      return;
    }

    setActiveStepId(pipelineSteps.find((step) => step.docType === version.docType)?.id ?? activeStepId);
    setDrafts((current) => ({ ...current, [version.docType]: version.content }));
    onDraftChange(version.content);
    setSaveStatus(`${version.label} restored into the editor. Click Save Stage Draft to make it active.`);
    setSaveError("");
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function deleteLocalVersion(versionId: string) {
    if (!requirePro("Managing saved passes")) {
      return;
    }

    const nextVersions = versions.filter((version) => version.id !== versionId);

    const didSave = writeVersions(nextVersions);

    if (!didSave) {
      return;
    }

    setSaveStatus("Version deleted.");
    setSaveError("");
  }

  function openBoardScene(sceneId: string) {
    const scene = sceneBreakdowns.find((candidate) => candidate.id === sceneId);

    if (!scene) {
      setSaveError("That production board item is missing its source scene.");
      return;
    }

    setActiveStepId("breakdown");
    startEditingScene(scene);
    setSaveStatus(`Editing ${sceneBoardLabel(scene)} from the production board.`);
    window.setTimeout(() => {
      document.getElementById(`scene-${scene.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  }

  function updateDraft(value: string) {
    setDrafts((current) => ({ ...current, [activeStep.docType]: value }));
    onDraftChange(value);
    setSaveStatus("");
    setSaveError("");
  }

  function loadGeneratedDocument({
    content,
    docType,
    status,
    stepId,
  }: {
    content: string;
    docType: DocType;
    status: string;
    stepId: StageId;
  }) {
    setActiveStepId(stepId);
    setDrafts((current) => ({ ...current, [docType]: content }));
    onDraftChange(content);
    setSaveStatus(status);
    setSaveError("");
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function buildLoglineLabTemplate() {
    const seed = drafts.idea.trim() || draftText.trim() || project.logline || project.notes || "";
    const diagnosticRows = storyDiagnostics
      .map((item) => `- ${item.isReady ? "Ready" : "Needs work"}: ${item.label} - ${item.isReady ? item.detail : item.next}`)
      .join("\n");
    const content = [
      `# Logline Lab - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Current story suite score: ${storySuiteScore}%`,
      "",
      "## Raw Material",
      "",
      seed || "Paste the rough idea, opening image, or premise here.",
      "",
      "## Story Diagnostic",
      "",
      diagnosticRows,
      "",
      "## Premise Lock",
      "",
      "The movie is about:",
      "- ",
      "",
      "The audience should lean forward because:",
      "- ",
      "",
      "The first image that proves this is cinema:",
      "- ",
      "",
      "## Story Engine",
      "",
      "Protagonist:",
      "- Who carries the movie?",
      "",
      "External want:",
      "- What do they actively pursue?",
      "",
      "Inner need:",
      "- What truth, wound, or limitation must change under the plot?",
      "",
      "Central obstacle:",
      "- What person, system, fear, environment, or deadline blocks them?",
      "",
      "Stakes:",
      "- What gets lost if they fail?",
      "",
      "Central conflict:",
      "- The story pressure comes from [want] colliding with [obstacle] while [stakes] get worse.",
      "",
      "Theme statement:",
      "- This film argues that...",
      "",
      "Hook / irony:",
      "- What makes this the same but different?",
      "",
      "## Want vs. Need Test",
      "",
      "- What the protagonist thinks will save them:",
      "- What the story proves they actually need:",
      "- The scene where want and need first collide:",
      "- The final decision that proves change or refusal to change:",
      "",
      "## Logline Tests",
      "",
      "- Can a stranger picture the movie after one sentence?",
      "- Does the protagonist make an active choice?",
      "- Is there pressure, cost, or contradiction?",
      "- Does the genre promise feel clear?",
      "- Does it avoid vague words like journey, destiny, truth, or darkness unless they are concrete?",
      "- Does it imply a movie engine, not just a mood?",
      "",
      "## Logline Drafts",
      "",
      "1. When [protagonist] wants [goal], they must [action] before [stakes], but [obstacle/irony].",
      "",
      "2. After [inciting event], [protagonist] has to [goal/action] while [pressure], or [cost].",
      "",
      "3. In a world where [specific situation], [protagonist] must [active choice] before [consequence].",
      "",
      "## Best Current Logline",
      "",
      project.logline || "- ",
      "",
      "## Next Rewrite Move",
      "",
      "- Strengthen the active verb.",
      "- Replace abstract stakes with a visible cost.",
      "- Make the obstacle specific enough to generate scenes.",
      "- Make the same-but-different hook clear enough that the film does not sound generic.",
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "idea",
      status: "Logline Lab prepared. Fill the story engine, choose the best draft, then save the Idea stage.",
      stepId: "idea",
    });
  }

  function buildStoryEngineTemplate() {
    const source = drafts.idea.trim() || draftText.trim() || project.logline || project.notes || "";
    const content = [
      `# Story Engine Dossier - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      `Story suite score: ${storySuiteScore}% (${storyReadyCount} of ${storyDiagnostics.length} story locks started)`,
      "",
      "Purpose:",
      "This page turns a raw idea into a usable film engine before treatment, script, breakdowns, shot lists, and prompt cards begin.",
      "",
      "## Current Story Locks",
      "",
      storyDiagnostics
        .map((item) => `- ${item.isReady ? "Ready" : "Needs work"}: ${item.label} - ${item.isReady ? item.detail : item.next}`)
        .join("\n"),
      "",
      "## Core Premise",
      "",
      "In one sentence, this film is:",
      "- ",
      "",
      "The world or situation:",
      "- ",
      "",
      "The pressure that makes the story start now:",
      "- ",
      "",
      "The visual image that proves the premise:",
      "- ",
      "",
      "## Protagonist Want vs. Need",
      "",
      "Protagonist:",
      "- ",
      "",
      "External want:",
      "- ",
      "",
      "Inner need:",
      "- ",
      "",
      "False strategy:",
      "- ",
      "",
      "What they avoid admitting:",
      "- ",
      "",
      "## Central Conflict",
      "",
      "Opposing force:",
      "- ",
      "",
      "Why the obstacle is not easy to beat:",
      "- ",
      "",
      "Escalating cost:",
      "- ",
      "",
      "Deadline, trap, rule, or point of no return:",
      "- ",
      "",
      "## Theme Statement",
      "",
      "The film argues:",
      "- ",
      "",
      "The counter-argument:",
      "- ",
      "",
      "How the final image proves or complicates the theme:",
      "- ",
      "",
      "## Same-But-Different Promise",
      "",
      "Familiar cinematic pleasure:",
      "- ",
      "",
      "Fresh angle:",
      "- ",
      "",
      "What this film must never become:",
      "- ",
      "",
      "## Scene Seeds",
      "",
      "1. Opening image:",
      "   - Story purpose:",
      "   - Production promise:",
      "",
      "2. First collision:",
      "   - Story purpose:",
      "   - Production promise:",
      "",
      "3. Midpoint reveal or reversal:",
      "   - Story purpose:",
      "   - Production promise:",
      "",
      "4. Final decision:",
      "   - Story purpose:",
      "   - Production promise:",
      "",
      "## Source Notes",
      "",
      source || "- ",
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "idea",
      status: "Story Engine Dossier prepared. Fill the story locks, then save the Idea stage.",
      stepId: "idea",
    });
  }

  function buildCharacterArcMapTemplate() {
    if (!requirePro("Character Arc Map")) {
      return;
    }

    const detectedCharacters = characterBibleNames.length ? characterBibleNames : ["Protagonist", "Primary Opposition"];
    const characterRows = detectedCharacters
      .slice(0, 8)
      .map((name) =>
        [
          `## ${name}`,
          "",
          "Story function:",
          "- ",
          "",
          "Opening state:",
          "- What they believe:",
          "- What they want:",
          "- What they fear:",
          "- How they protect themselves:",
          "",
          "Pressure path:",
          "- Inciting pressure:",
          "- First wrong strategy:",
          "- Midpoint shift:",
          "- Cost or collapse:",
          "- Final choice:",
          "",
          "Ending state:",
          "- What changed:",
          "- What did not change:",
          "- Visual proof of the change:",
          "",
          "Dialogue and behavior rules:",
          "- What they say when defensive:",
          "- What they never say directly:",
          "- Physical behavior that reveals pressure:",
        ].join("\n"),
      );
    const content = [
      `# Character Arc Map - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      "",
      "Purpose:",
      "Map emotional movement before writing scenes, so characters do not become flat prompt subjects or generic dialogue machines.",
      "",
      "# Film-Wide Arc Question",
      "",
      "- What must change emotionally for the film to feel complete?",
      "- What pressure forces that change?",
      "- What visual action proves it?",
      "",
      "# Character Arc Cards",
      "",
      ...characterRows,
      "",
      "# Relationship Pressure Map",
      "",
      "- Relationship that creates the most story pressure:",
      "- What one character wants from the other:",
      "- What the other refuses to give:",
      "- Secret, debt, wound, or status difference:",
      "- Scene where the relationship changes shape:",
      "",
      "# Production Implications",
      "",
      "- Wardrobe changes that should reflect arc:",
      "- Props or objects that carry emotional state:",
      "- Facial/performance continuity risks:",
      "- Dialogue patterns to preserve:",
      "- Insert shots that could externalize change:",
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "treatment",
      status: "Character Arc Map prepared. Fill character movement, then save the Treatment stage.",
      stepId: "treatment",
    });
  }

  function buildTreatmentBlueprintTemplate() {
    if (!requirePro("Treatment Blueprint")) {
      return;
    }

    const source = drafts.idea.trim() || drafts.script.trim() || project.logline || project.notes || "";
    const diagnosticRows = storyDiagnostics
      .map((item) => `- ${item.isReady ? "Ready" : "Needs work"}: ${item.label} - ${item.isReady ? item.detail : item.next}`)
      .join("\n");
    const content = [
      `# Treatment Blueprint - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      `Cinematic references: ${project.inspirations?.length ? project.inspirations.join(", ") : "Not specified"}`,
      `Story suite score: ${storySuiteScore}%`,
      "",
      "## Story Locks Before Treatment",
      "",
      diagnosticRows,
      "",
      "## Core Thesis",
      "",
      "What the film is really about beneath the plot:",
      "- ",
      "",
      "Theme statement:",
      "- This film argues that...",
      "",
      "Counter-argument:",
      "- The world, antagonist, or protagonist flaw argues that...",
      "",
      "## Cinematic Promise",
      "",
      "The visual, emotional, and genre experience the audience is buying:",
      "- ",
      "",
      "## Same But Different",
      "",
      "Familiar pleasure:",
      "- ",
      "",
      "Fresh angle:",
      "- ",
      "",
      "## Character Arc Map",
      "",
      "Protagonist starts as:",
      "- ",
      "",
      "Protagonist ends as:",
      "- ",
      "",
      "The pressure that changes them:",
      "- ",
      "",
      "Want vs. need collision:",
      "- External want:",
      "- Inner need:",
      "- False strategy:",
      "- Final proof of change:",
      "",
      "## Act Movement",
      "",
      "### Opening Image",
      "",
      "- The first cinematic proof of the world, tone, and wound.",
      "",
      "### Act 1: Setup and Doorway",
      "",
      "- Ordinary world:",
      "- Inciting incident:",
      "- Refusal or wrong move:",
      "- Choice that locks the story:",
      "",
      "### Act 2A: Promise of the Premise",
      "",
      "- New rules:",
      "- First wins:",
      "- New complication:",
      "- Relationship pressure:",
      "",
      "### Midpoint",
      "",
      "- The story changes meaning because:",
      "",
      "### Act 2B: Cost and Collapse",
      "",
      "- Pressure escalates:",
      "- Character flaw gets punished:",
      "- Secret, betrayal, or reversal:",
      "- Low point:",
      "",
      "### Act 3: Final Choice",
      "",
      "- New strategy:",
      "- Final confrontation:",
      "- Visual decision that proves the change:",
      "- Ending image:",
      "",
      "## Sequence Spine",
      "",
      "1. Opening image and wound",
      "   - Story job:",
      "   - Visual proof:",
      "   - Production implication:",
      "",
      "2. Inciting pressure",
      "   - Story job:",
      "   - Visual proof:",
      "   - Production implication:",
      "",
      "3. First wrong strategy",
      "   - Story job:",
      "   - Visual proof:",
      "   - Production implication:",
      "",
      "4. Promise of the premise",
      "   - Story job:",
      "   - Visual proof:",
      "   - Production implication:",
      "",
      "5. Midpoint shift",
      "   - Story job:",
      "   - Visual proof:",
      "   - Production implication:",
      "",
      "6. Cost and collapse",
      "   - Story job:",
      "   - Visual proof:",
      "   - Production implication:",
      "",
      "7. Final choice",
      "   - Story job:",
      "   - Visual proof:",
      "   - Production implication:",
      "",
      "8. Ending image",
      "   - Story job:",
      "   - Visual proof:",
      "   - Production implication:",
      "",
      "## Key Scene Set Pieces",
      "",
      "1. Scene:",
      "   - Purpose:",
      "   - Visual hook:",
      "   - Production need:",
      "",
      "2. Scene:",
      "   - Purpose:",
      "   - Visual hook:",
      "   - Production need:",
      "",
      "3. Scene:",
      "   - Purpose:",
      "   - Visual hook:",
      "   - Production need:",
      "",
      "## Treatment Draft",
      "",
      "Write the treatment here in clean, professional prose. Keep it cinematic, specific, and practical enough that each paragraph can become scenes, breakdowns, shot lists, and prompt cards.",
      "",
      "Paragraph 1 - Opening world, protagonist, wound, and cinematic promise:",
      "",
      "Paragraph 2 - Inciting pressure and locked choice:",
      "",
      "Paragraph 3 - Act 2 promise, complications, relationships, and midpoint shift:",
      "",
      "Paragraph 4 - Escalating cost, collapse, and emotional reckoning:",
      "",
      "Paragraph 5 - Final strategy, confrontation, ending image, and thematic aftertaste:",
      "",
      source ? `Source notes:\n${source}` : "Source notes:\n- ",
      "",
      "## Development Questions",
      "",
      "- What does the protagonist want in the first five minutes?",
      "- What image proves the tone?",
      "- Where does the story stop sounding generic?",
      "- Which scenes will become the strongest prompt-ready production assets?",
      "- What must be solved before the script stage begins?",
      "- Which character, location, prop, or sound element should become a continuity anchor?",
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "treatment",
      status: "Treatment Blueprint prepared. Fill the structure, then save the Treatment stage.",
      stepId: "treatment",
    });
  }

  function buildCharacterBibleTemplate() {
    const profiles = characterProfiles.length
      ? characterProfiles
      : [
          {
             appearances: [],
             coCharacters: [],
             locations: [],
            name: "Primary Character",
            productionAssets: [],
            missing: [
              "scene appearances",
              "wardrobe baseline",
              "carried props",
              "location map",
              "relationship map",
              "prompt rows",
            ],
            props: [],
            readiness: 0,
            sceneLabels: [],
            soundNotes: [],
            toneNotes: [],
            wardrobe: [],
          },
        ];
    const sections = profiles.map((profile) => {
      const promptRows = profile.productionAssets
        .filter((asset) => hasText(asset.image_prompt) || hasText(asset.animation_prompt) || hasText(asset.sound_prompt))
        .slice(0, 8)
        .map((asset) => `- ${asset.name}: ${asset.image_prompt || asset.animation_prompt || asset.sound_prompt}`);

      return [
        `## ${profile.name}`,
        "",
        `Continuity readiness: ${profile.readiness}%`,
        `Scene appearances: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
        `Shared scenes with: ${profile.coCharacters.length ? profile.coCharacters.join(", ") : "Not mapped yet"}`,
        `Locations: ${profile.locations.length ? profile.locations.join(", ") : "Not mapped yet"}`,
        "",
        "### Story Function",
        "",
        "- Role in story:",
        "- External want:",
        "- Need beneath the want:",
        "- Fear, wound, or contradiction:",
        "- First impression:",
        "- Final state:",
        "",
        "### Visual Identity Lock",
        "",
        "- Face, age, build, and silhouette:",
        "- Hair and grooming:",
        "- Eyes / expression baseline:",
        "- Hands, posture, walk, or recurring physical behavior:",
        "- Distinguishing marks, texture, or object:",
        `- Wardrobe detected from scene packets: ${profile.wardrobe.length ? profile.wardrobe.join(", ") : "Not mapped yet"}`,
        `- Props near character: ${profile.props.length ? profile.props.join(", ") : "Not mapped yet"}`,
        "",
        "### Wardrobe Continuity",
        "",
        "- Wardrobe baseline:",
        "- Scene-specific wardrobe changes:",
        "- What must never drift:",
        "- What can change with story state:",
        "",
        "### Performance and Voice",
        "",
        "- Speech pattern:",
        "- Rhythm, pauses, and silence:",
        "- Status behavior:",
        "- What they never say directly:",
        "- Dialogue words or phrases to avoid:",
        "",
        "### Relationship Map",
        "",
        `- Characters sharing scenes: ${profile.coCharacters.length ? profile.coCharacters.join(", ") : "Not mapped yet"}`,
        "- Allies:",
        "- Oppositions:",
        "- Power dynamic:",
        "- Secret, pressure, or unresolved emotional debt:",
        "",
        "### Scene-by-Scene Continuity",
        "",
        profile.appearances.length
          ? profile.appearances
              .map((scene) =>
                [
                  `- ${sceneBoardLabel(scene)}`,
                  `  - Emotional state entering:`,
                  `  - Emotional state leaving:`,
                  `  - Wardrobe: ${listText(scene.wardrobe, "Not filled yet")}`,
                  `  - Props / objects: ${listText(scene.props, "Not filled yet")}`,
                  `  - Sound / physical texture: ${scene.sound_notes || "Not filled yet"}`,
                  `  - Continuity risk:`,
                ].join("\n"),
              )
              .join("\n")
          : "- Scene 1: emotional state, wardrobe, props, sound, and continuity risk.",
        "",
        "### Prompt Consistency Anchor",
        "",
        "- Reusable image prompt language:",
        "- Reusable animation prompt language:",
        "- Sound / dialogue handoff:",
        "- Negative prompt notes:",
        "- Approved reference frame notes:",
        "",
        "### Existing Prompt Rows",
        "",
        promptRows.length ? promptRows.join("\n") : "- No prompt rows tied to this character yet.",
      ].join("\n");
    });

    const content = [
      `# Character Bible - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      "",
      "Purpose:",
      "Keep every recurring character visually, emotionally, and vocally consistent across scenes, images, animation, and dialogue.",
      "",
      "## Character Continuity Rules",
      "",
      "- Every recurring character needs a face, silhouette, wardrobe baseline, voice rule, and emotional state map.",
      "- Every generated image should reuse the approved visual identity lock.",
      "- Wardrobe can change only when the story or scene state explains why.",
      "- Props carried by the character must be tracked scene to scene.",
      "- Dialogue should preserve the character's rhythm, status behavior, and subtext.",
      "- Prompt cards should not introduce new clothing, props, ages, hairstyles, or facial details unless the bible says so.",
      "",
      ...sections,
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "character_bible",
      status: `${profiles.length} character bible section${profiles.length === 1 ? "" : "s"} prepared. Review, fill details, then save.`,
      stepId: "characters",
    });
  }

  function buildCharacterProfileSheet(profile: CharacterContinuityProfile) {
    if (!requirePro("Character profile sheets")) {
      return;
    }

    const sheet = [
      `# Character Profile - ${profile.name}`,
      "",
      `Project: ${project.title || "Untitled MiseForge Project"}`,
      `Continuity readiness: ${profile.readiness}%`,
      `Scene appearances: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
      `Missing anchors: ${profile.missing.length ? profile.missing.join(", ") : "None flagged"}`,
      "",
      "## Identity Lock",
      "",
      "- Face, age, build, and silhouette:",
      "- Hair and grooming:",
      "- Eyes / expression baseline:",
      "- Posture, walk, hands, and recurring physical behavior:",
      "- Distinguishing texture, scar, object, or visual detail:",
      "",
      "## Wardrobe Lock",
      "",
      `- Detected wardrobe: ${profile.wardrobe.length ? profile.wardrobe.join(", ") : "Not mapped yet"}`,
      "- Baseline costume:",
      "- Scene-specific changes:",
      "- What must never drift:",
      "- What can change because of story state:",
      "",
      "## Prop and Object Continuity",
      "",
      `- Props near character: ${profile.props.length ? profile.props.join(", ") : "Not mapped yet"}`,
      "- Objects carried into scenes:",
      "- Objects handed off or lost:",
      "- Close-up / insert-shot risks:",
      "",
      "## Voice and Performance",
      "",
      "- Speech rhythm:",
      "- Status behavior:",
      "- Silence behavior:",
      "- What this character avoids saying directly:",
      "- Dialogue words, cliches, or exposition habits to avoid:",
      "",
      "## Relationship Map",
      "",
      `- Shares scenes with: ${profile.coCharacters.length ? profile.coCharacters.join(", ") : "Not mapped yet"}`,
      "- Power dynamics:",
      "- Secrets, debts, grudges, loyalties:",
      "- How the relationship changes by the final scene:",
      "",
      "## Scene State Map",
      "",
      profile.appearances.length
        ? profile.appearances
            .map((scene) =>
              [
                `### ${sceneBoardLabel(scene)}`,
                "",
                `- Location: ${scene.location || "Not mapped yet"}`,
                `- Wardrobe: ${listText(scene.wardrobe, "Not filled yet")}`,
                `- Props: ${listText(scene.props, "Not filled yet")}`,
                `- Tone: ${scene.tone || scene.color_palette || "Not filled yet"}`,
                "- Emotional state entering:",
                "- Emotional state leaving:",
                "- Continuity risk:",
              ].join("\n"),
            )
            .join("\n\n")
        : "### Scene 1\n\n- Emotional state entering:\n- Emotional state leaving:\n- Wardrobe:\n- Props:\n- Continuity risk:",
      "",
      "## Reusable Prompt Anchor",
      "",
      buildCharacterPromptAnchor(profile),
    ].join("\n");
    const currentBible = drafts.character_bible.trim();
    const content = currentBible && !currentBible.includes(`# Character Profile - ${profile.name}`)
      ? `${currentBible}\n\n---\n\n${sheet}`
      : sheet;

    loadGeneratedDocument({
      content,
      docType: "character_bible",
      status: `${profile.name} profile sheet prepared. Fill identity, wardrobe, voice, relationship, and scene-state locks, then save.`,
      stepId: "characters",
    });
  }

  function buildCharacterPromptAnchor(profile: CharacterContinuityProfile) {
    return [
      "Use this exact character continuity anchor whenever generating images, animation, dialogue, or sound for this character.",
      "",
      `Character: ${profile.name}`,
      `Project: ${project.title || "Untitled MiseForge Project"}`,
      `Genre/tone: ${project.genre || "Not specified"} / ${project.tone || "Not specified"}`,
      `Scene appearances: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
      `Locations: ${profile.locations.length ? profile.locations.join(", ") : "Not mapped yet"}`,
      `Wardrobe continuity: ${profile.wardrobe.length ? profile.wardrobe.join(", ") : "Not mapped yet"}`,
      `Props carried or nearby: ${profile.props.length ? profile.props.join(", ") : "Not mapped yet"}`,
      `Relationship context: ${profile.coCharacters.length ? profile.coCharacters.join(", ") : "Not mapped yet"}`,
      `Tone / sound anchors: ${[...profile.toneNotes, ...profile.soundNotes].filter(Boolean).join("; ") || "Not mapped yet"}`,
      "",
      "Rules:",
      "- Keep face, age, build, silhouette, wardrobe baseline, hair, posture, and carried props consistent.",
      "- Do not invent new clothes, props, injuries, facial details, or emotional state changes unless the scene bible says so.",
      "- Preserve performance rhythm and subtext. Avoid generic AI dialogue and direct emotional explanation.",
      "- If a prompt conflicts with this anchor, rewrite the prompt to protect continuity.",
      `- Missing anchors to fill next: ${profile.missing.length ? profile.missing.join(", ") : "none"}.`,
    ].join("\n");
  }

  async function copyCharacterPromptAnchor(profile: CharacterContinuityProfile) {
    if (!requirePro("Character consistency prompts")) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildCharacterPromptAnchor(profile));
      setSaveStatus(`${profile.name} consistency prompt copied.`);
      setSaveError("");
    } catch {
      setSaveError("Your browser blocked copy. Build the profile sheet and copy the prompt anchor from the editor.");
    }
  }

  function buildLocationBibleTemplate() {
    const names = locationBibleNames.length ? locationBibleNames : ["Primary Location"];
    const sections = names.map((name) => {
      const scenes = sceneBreakdowns
        .filter((scene) => scene.location?.trim().toLowerCase() === name.trim().toLowerCase())
        .map((scene) => `${sceneBoardLabel(scene)} (${scene.time_of_day || "No time"})`);

      return [
        `## ${name}`,
        "",
        `Scenes using this location: ${scenes.length ? scenes.join(", ") : "Not mapped yet"}`,
        "",
        "Physical layout:",
        "- Entrances/exits:",
        "- Key zones:",
        "- Camera-safe directions:",
        "- Blocking constraints:",
        "",
        "Visual continuity:",
        "- Color palette:",
        "- Lighting motivation:",
        "- Time-of-day rules:",
        "- Set dressing:",
        "- Weather or environmental state:",
        "",
        "Sound map:",
        "- Room tone:",
        "- Background texture:",
        "- Practical sounds:",
        "- Silence or pressure points:",
        "",
        "Production assets:",
        "- Required props:",
        "- Background details:",
        "- Insert shot opportunities:",
        "",
        "Prompt consistency anchor:",
        "- Reusable location prompt language:",
        "- Negative prompt notes:",
        "",
        "Continuity risks:",
        "- What must not change between scenes:",
        "- What can change intentionally:",
      ].join("\n");
    });

    const content = [
      `# Location Bible - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      "",
      "Purpose:",
      "Keep every recurring location visually, spatially, and sonically consistent across shots and generated assets.",
      "",
      ...sections,
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "location_bible",
      status: `${names.length} location bible section${names.length === 1 ? "" : "s"} prepared. Review, fill details, then save.`,
      stepId: "locations",
    });
  }

  function buildLocationProfileSheet(profile: LocationContinuityProfile) {
    if (!requirePro("Location profile sheets")) {
      return;
    }

    const sheet = [
      `# Location Profile - ${profile.name}`,
      "",
      `Project: ${project.title || "Untitled MiseForge Project"}`,
      `Continuity readiness: ${profile.readiness}%`,
      `Scene usage: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
      `Missing anchors: ${profile.missing.length ? profile.missing.join(", ") : "None flagged"}`,
      "",
      "## Spatial Layout Lock",
      "",
      "- Entrances and exits:",
      "- Key zones:",
      "- Camera-safe directions:",
      "- Blocking lanes:",
      "- Where characters can hide, cross, enter, or reveal information:",
      "",
      "## Light, Color, and Atmosphere",
      "",
      `- Time-of-day rules: ${profile.timeOfDays.length ? profile.timeOfDays.join(", ") : "Not mapped yet"}`,
      `- Detected color / tone notes: ${profile.colorNotes.length ? profile.colorNotes.join("; ") : "Not mapped yet"}`,
      "- Practical light sources:",
      "- Shadow behavior:",
      "- Weather, air, dust, smoke, haze, or texture:",
      "- What must never appear in this location:",
      "",
      "## Set Dressing and Prop Geography",
      "",
      `- Set dressing detected: ${profile.setDressing.length ? profile.setDressing.join(", ") : "Not mapped yet"}`,
      `- Props used here: ${profile.props.length ? profile.props.join(", ") : "Not mapped yet"}`,
      "- Fixed background details:",
      "- Moveable objects:",
      "- Insert-shot opportunities:",
      "- Continuity risks:",
      "",
      "## Sound Identity",
      "",
      `- Detected sound notes: ${profile.soundNotes.length ? profile.soundNotes.join("; ") : "Not mapped yet"}`,
      "- Room tone:",
      "- Floor / wall / air texture:",
      "- Distant life:",
      "- Practical hums, machines, weather, or exterior bleed:",
      "- Silence behavior:",
      "",
      "## Scene-by-Scene Location State",
      "",
      profile.scenes.length
        ? profile.scenes
            .map((scene) =>
              [
                `### ${sceneBoardLabel(scene)}`,
                "",
                `- Time: ${scene.time_of_day || "Not mapped yet"}`,
                `- Characters present: ${listText(scene.characters, "Not filled yet")}`,
                `- Set dressing: ${listText(scene.set_dressing, "Not filled yet")}`,
                `- Props: ${listText(scene.props, "Not filled yet")}`,
                `- Blocking: ${scene.blocking || "Not filled yet"}`,
                `- Sound: ${scene.sound_notes || "Not filled yet"}`,
                "- What changed since the previous scene here:",
                "- What must stay fixed:",
              ].join("\n"),
            )
            .join("\n\n")
        : "### Scene 1\n\n- Time:\n- Characters present:\n- Set dressing:\n- Props:\n- Blocking:\n- Sound:\n- What changed:\n- What must stay fixed:",
      "",
      "## Reusable Prompt Anchor",
      "",
      buildLocationPromptAnchor(profile),
    ].join("\n");
    const currentBible = drafts.location_bible.trim();
    const content = currentBible && !currentBible.includes(`# Location Profile - ${profile.name}`)
      ? `${currentBible}\n\n---\n\n${sheet}`
      : sheet;

    loadGeneratedDocument({
      content,
      docType: "location_bible",
      status: `${profile.name} profile sheet prepared. Fill layout, light, dressing, sound, and scene-state locks, then save.`,
      stepId: "locations",
    });
  }

  function buildLocationPromptAnchor(profile: LocationContinuityProfile) {
    return [
      "Use this exact location continuity anchor whenever generating images, animation, sound, or shot-list prompts for this location.",
      "",
      `Location: ${profile.name}`,
      `Project: ${project.title || "Untitled MiseForge Project"}`,
      `Genre/tone: ${project.genre || "Not specified"} / ${project.tone || "Not specified"}`,
      `Scene usage: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
      `Time-of-day rules: ${profile.timeOfDays.length ? profile.timeOfDays.join(", ") : "Not mapped yet"}`,
      `Characters appearing here: ${profile.characters.length ? profile.characters.join(", ") : "Not mapped yet"}`,
      `Set dressing: ${profile.setDressing.length ? profile.setDressing.join(", ") : "Not mapped yet"}`,
      `Props in this location: ${profile.props.length ? profile.props.join(", ") : "Not mapped yet"}`,
      `Wardrobe seen here: ${profile.wardrobe.length ? profile.wardrobe.join(", ") : "Not mapped yet"}`,
      `Color / light anchors: ${profile.colorNotes.length ? profile.colorNotes.join("; ") : "Not mapped yet"}`,
      `Sound anchors: ${profile.soundNotes.length ? profile.soundNotes.join("; ") : "Not mapped yet"}`,
      "",
      "Rules:",
      "- Preserve layout, scale, entrance positions, practical lights, color family, set dressing, and room tone.",
      "- Do not invent new background objects, windows, weather, light sources, or architectural features unless the scene state calls for it.",
      "- Keep blocking and eyelines physically possible inside the established space.",
      "- If a prompt conflicts with this anchor, rewrite the prompt to protect location continuity.",
      `- Missing anchors to fill next: ${profile.missing.length ? profile.missing.join(", ") : "none"}.`,
    ].join("\n");
  }

  async function copyLocationPromptAnchor(profile: LocationContinuityProfile) {
    if (!requirePro("Location consistency prompts")) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildLocationPromptAnchor(profile));
      setSaveStatus(`${profile.name} location consistency prompt copied.`);
      setSaveError("");
    } catch {
      setSaveError("Your browser blocked copy. Build the location sheet and copy the prompt anchor from the editor.");
    }
  }

  function buildLookBookTemplate() {
    if (!requirePro("Visual Look Book")) {
      return;
    }

    const styleRuleRows = visualStyleRules.map((rule) =>
      [
        `## ${rule.title}`,
        "",
        `Readiness: ${rule.readiness}%`,
        `Status: ${rule.status}`,
        rule.body,
        "",
        "Current anchors:",
        rule.anchors.length ? rule.anchors.map((anchor) => `- ${anchor}`).join("\n") : "- Not mapped yet",
        "",
        "Rules to lock:",
        "- Must stay consistent:",
        "- Can change intentionally when:",
        "- Must never appear:",
        "- Manual check before final generation:",
      ].join("\n"),
    );
    const sceneLookRows = visualSceneProfiles.length
      ? visualSceneProfiles.map((profile) =>
          [
            `## ${profile.sceneLabel}`,
            "",
            `Readiness: ${profile.readiness}%`,
            `Location / time: ${profile.locationTime}`,
            `Current color or tone: ${profile.colorState}`,
            `Camera rule: ${profile.cameraRule}`,
            `Lighting rule: ${profile.lightingRule}`,
            `Motif / object anchor: ${profile.motif}`,
            `Negative prompt risk: ${profile.negativeRisk}`,
            "",
            "Look assignment:",
            "- Dominant color:",
            "- Accent color:",
            "- Lighting motivation:",
            "- Texture / grain / lens feel:",
            "- Visual motif:",
            "- What must match the character and location bibles:",
          ].join("\n"),
        )
      : [
          [
            "## Scene 1",
            "",
            "Location / time: Not mapped yet",
            "Current color or tone: Not filled yet",
            "",
            "Look assignment:",
            "- Dominant color:",
            "- Accent color:",
            "- Lighting motivation:",
            "- Texture / grain / lens feel:",
            "- Visual motif:",
            "- What must match the character and location bibles:",
          ].join("\n"),
        ];
    const characterAnchors = characterBibleNames.length
      ? characterBibleNames.map((name) => `- ${name}: face, silhouette, wardrobe baseline, color relationship, and one recurring visual behavior.`)
      : ["- Primary Character: face, silhouette, wardrobe baseline, color relationship, and one recurring visual behavior."];
    const locationAnchors = locationBibleNames.length
      ? locationBibleNames.map((name) => `- ${name}: layout, practical lights, color family, dressing, weather/air, and negative prompt risks.`)
      : ["- Primary Location: layout, practical lights, color family, dressing, weather/air, and negative prompt risks."];
    const propMotifs = uniqueSorted(sceneBreakdowns.flatMap((scene) => scene.props ?? [])).slice(0, 12);
    const referenceSpine = project.inspirations?.length
      ? project.inspirations.map((reference) => `- ${reference}: what to borrow / what to avoid`).join("\n")
      : "- Reference 1: what to borrow / what to avoid\n- Reference 2: what to borrow / what to avoid";
    const content = [
      `# Visual Style Bible - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      "",
      "Purpose:",
      "Create a single visual language that keeps characters, locations, prompts, shot lists, and animation passes consistent across the whole film. This is the source of truth for every image prompt, animation prompt, storyboard panel, and final packet export.",
      "",
      "# Visual Thesis",
      "",
      "- The film should feel like:",
      "- The audience should remember this visual idea:",
      "- The look should never become:",
      "- Same-but-different visual promise:",
      "",
      "# Reference Spine",
      "",
      referenceSpine,
      "",
      "# Style Rule Cards",
      "",
      ...styleRuleRows,
      "",
      "# Color System",
      "",
      "Dominant palette:",
      "- ",
      "",
      "Accent palette:",
      "- ",
      "",
      "Colors to avoid:",
      "- ",
      "",
      "Scene color progression:",
      "- Opening look:",
      "- Middle pressure look:",
      "- Final image look:",
      "",
      "# Lighting Grammar",
      "",
      "- Main lighting motivation:",
      "- Practical light rules:",
      "- Shadow behavior:",
      "- Exterior / weather behavior:",
      "- What should never appear in lighting:",
      "- How lighting changes as the story pressure rises:",
      "",
      "# Camera Grammar",
      "",
      "- Default shot language:",
      "- When to use wide shots:",
      "- When to use close-ups:",
      "- Movement rules:",
      "- Lens / texture / grain:",
      "- Framing rules for emotional turns:",
      "- Insert-shot rules:",
      "- What camera behavior would make this feel generic:",
      "",
      "# Character Visual Anchors",
      "",
      ...characterAnchors,
      "",
      "# Location Visual Anchors",
      "",
      ...locationAnchors,
      "",
      "# Recurring Props and Motifs",
      "",
      propMotifs.length
        ? propMotifs.map((prop) => `- ${prop}: visual meaning, first appearance, close-up rules, and continuity risk.`).join("\n")
        : "- Primary prop or motif: visual meaning, first appearance, close-up rules, and continuity risk.",
      "",
      "# Scene-by-Scene Look Map",
      "",
      ...sceneLookRows,
      "",
      "# Prompt Consistency Rules",
      "",
      "Image prompt anchor:",
      "- Always include: film title look, palette, lighting motivation, lens feel, character anchors, location anchors, and continuity props.",
      "",
      "Animation prompt anchor:",
      "- Keep camera movement restrained, preserve eyelines, maintain wardrobe and prop continuity, and avoid new story information.",
      "",
      "Sound prompt anchor:",
      "- Match room tone, practical texture, close physical sounds, and silence. Do not add music unless the story specifically needs it.",
      "",
      "# Negative Prompt Deck",
      "",
      "- No text, captions, logos, malformed hands, extra characters, random props, inconsistent wardrobe, wrong time of day, mismatched location layout, over-polished commercial lighting, or generic sci-fi glow unless specified.",
      "- No unmotivated neon, fog, fantasy glow, fake cinematic bokeh, wrong weather, extra windows, unexpected costumes, mismatched face age, or continuity-breaking background objects unless the style bible explicitly allows it.",
      "",
      "# Tool Adaptation Notes",
      "",
      `Workflow/tools: ${workflowTools || "Not specified"}`,
      "",
      "- Image tools:",
      "- Animation tools:",
      "- Sound tools:",
      "- Edit / color tools:",
      "- What must be manually checked after each generation:",
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "look_book",
      status: "Visual Style Bible prepared. Fill the look rules, then save the Look Book stage.",
      stepId: "lookbook",
    });
  }

  function buildStyleBiblePromptAnchor() {
    const ruleRows = visualStyleRules
      .map((rule) =>
        [
          `- ${rule.title} (${rule.readiness}%): ${rule.body}`,
          `  Anchors: ${rule.anchors.length ? rule.anchors.join("; ") : "not mapped yet"}`,
        ].join("\n"),
      )
      .join("\n");
    const sceneRows = visualSceneProfiles
      .slice(0, 12)
      .map((profile) =>
        [
          `- ${profile.sceneLabel}`,
          `  Location/time: ${profile.locationTime}`,
          `  Color/tone: ${profile.colorState}`,
          `  Camera: ${profile.cameraRule}`,
          `  Light: ${profile.lightingRule}`,
          `  Motif: ${profile.motif}`,
          `  Drift risk: ${profile.negativeRisk}`,
        ].join("\n"),
      )
      .join("\n");

    return [
      "You are a visual development lead, cinematographer, and AI film continuity supervisor.",
      "",
      "Create or refine a visual style bible for this AI film. The goal is not pretty generic images. The goal is one coherent film language that can survive image generation, animation, sound, edit, and export.",
      "",
      "PROJECT",
      `Title: ${project.title || "Untitled"}`,
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      `References: ${project.inspirations?.length ? project.inspirations.join(", ") : "Not specified"}`,
      `Workflow/tools: ${workflowTools || "Not specified"}`,
      "",
      "STYLE RULES",
      ruleRows || "- No style rules mapped yet.",
      "",
      "SCENE LOOK MAP",
      sceneRows || "- No scene packets saved yet.",
      "",
      "RETURN",
      "1. Visual thesis",
      "2. Palette system",
      "3. Lighting grammar",
      "4. Camera and lens grammar",
      "5. Character visual anchors",
      "6. Location visual anchors",
      "7. Motifs and insert-shot rules",
      "8. Negative prompt deck",
      "9. Tool-specific prompt adapters",
      "10. What must never drift",
      "",
      "RULES",
      "- Do not give generic aesthetic advice.",
      "- Every rule must help prompts, shot lists, animation, sound, or continuity.",
      "- Flag anything that would make generated shots look like separate films.",
    ].join("\n");
  }

  async function copyStyleBiblePromptAnchor() {
    if (!requirePro("Style Bible prompt compiler")) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildStyleBiblePromptAnchor());
      setSaveStatus("Style Bible prompt copied.");
      setSaveError("");
    } catch {
      setSaveError("Your browser blocked copy. Build the Style Bible and copy from the editor.");
    }
  }

  function buildContinuityTrackerTemplate() {
    if (!requirePro("Continuity tracker")) {
      return;
    }

    const sceneRows = continuityRows.length
      ? continuityRows.map((row) =>
          [
            `## ${row.sceneLabel}`,
            "",
            `Previous scene handoff: ${row.previousSceneLabel}`,
            `Readiness: ${row.readiness}%`,
            `Location / time: ${row.location || "Not mapped yet"} / ${row.timeOfDay || "Not mapped yet"}`,
            `Characters: ${row.characters.length ? row.characters.join(", ") : "Not mapped yet"}`,
            `Props: ${row.props.length ? row.props.join(", ") : "Not mapped yet"}`,
            `Wardrobe: ${row.wardrobe.length ? row.wardrobe.join(", ") : "Not mapped yet"}`,
            `Set dressing: ${row.setDressing.length ? row.setDressing.join(", ") : "Not mapped yet"}`,
            `Color / light state: ${row.colorState || "Not mapped yet"}`,
            `Sound state: ${row.soundState || "Not mapped yet"}`,
            `Blocking / layout: ${row.blocking || "Not mapped yet"}`,
            "",
            "Risks to check:",
            row.riskFlags.length ? row.riskFlags.map((risk) => `- ${risk}`).join("\n") : "- No major automatic risks flagged.",
            "",
            "Manual state notes:",
            "- Emotional state entering:",
            "- Emotional state leaving:",
            "- Prop owner / location at end:",
            "- Wardrobe or makeup change:",
            "- Light/sound change:",
            "- Generation check before final approval:",
          ].join("\n"),
        )
      : [
          [
            "## Scene 1",
            "",
            "Previous scene handoff: Opening scene",
            "Readiness: 0%",
            "Location / time: Not mapped yet",
            "",
            "Manual state notes:",
            "- Emotional state entering:",
            "- Emotional state leaving:",
            "- Prop owner / location at end:",
            "- Wardrobe or makeup change:",
            "- Light/sound change:",
            "- Generation check before final approval:",
          ].join("\n"),
        ];
    const characterRows = characterProfiles.length
      ? characterProfiles.map((profile) =>
          [
            `## ${profile.name}`,
            "",
            `Scenes: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
            `Readiness: ${profile.readiness}%`,
            `Missing anchors: ${profile.missing.length ? profile.missing.join(", ") : "None flagged"}`,
            `Wardrobe: ${profile.wardrobe.length ? profile.wardrobe.join(", ") : "Not mapped yet"}`,
            `Props: ${profile.props.length ? profile.props.join(", ") : "Not mapped yet"}`,
            `Relationships: ${profile.coCharacters.length ? profile.coCharacters.join(", ") : "Not mapped yet"}`,
            "",
            "- Emotional state after each scene:",
            "- Physical state / injury / fatigue:",
            "- Wardrobe changes:",
            "- Carried props:",
            "- Continuity risk before generation:",
          ].join("\n"),
        )
      : ["## Primary Character\n\nScenes: Not mapped yet\n\n- Emotional state:\n- Wardrobe:\n- Carried props:\n- Continuity risk:"];
    const locationRows = locationProfiles.length
      ? locationProfiles.map((profile) =>
          [
            `## ${profile.name}`,
            "",
            `Scenes: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
            `Readiness: ${profile.readiness}%`,
            `Missing anchors: ${profile.missing.length ? profile.missing.join(", ") : "None flagged"}`,
            `Time states: ${profile.timeOfDays.length ? profile.timeOfDays.join(", ") : "Not mapped yet"}`,
            `Set dressing: ${profile.setDressing.length ? profile.setDressing.join(", ") : "Not mapped yet"}`,
            `Sound: ${profile.soundNotes.length ? profile.soundNotes.join("; ") : "Not mapped yet"}`,
            "",
            "- Layout that must stay fixed:",
            "- Lighting motivation:",
            "- Dressing that can change intentionally:",
            "- Risk before generation:",
          ].join("\n"),
        )
      : ["## Primary Location\n\nScenes: Not mapped yet\n\n- Layout:\n- Lighting motivation:\n- Dressing that must stay fixed:\n- Risk before generation:"];
    const itemRows = continuityItemProfiles.length
      ? continuityItemProfiles.map((item) =>
          [
            `## ${item.type}: ${item.label}`,
            "",
            `Scenes: ${item.sceneLabels.length ? item.sceneLabels.join(", ") : "Not mapped yet"}`,
            `Locations: ${item.locations.length ? item.locations.join(", ") : "Not mapped yet"}`,
            `Risk: ${item.risk}`,
            "",
            "- First appearance:",
            "- Last known state:",
            "- Owner / location:",
            "- Must match across images:",
            "- Continuity risk:",
          ].join("\n"),
        )
      : ["## Primary Prop\n\nScenes: Not mapped yet\n\n- First appearance:\n- Last known state:\n- Owner / location:\n- Continuity risk:"];
    const content = [
      `# Continuity Tracker - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      "",
      "Purpose:",
      "Track what must stay visually, emotionally, physically, and sonically consistent before generating shots, prompts, animation, and exports.",
      "",
      "# Scene Handoff Matrix",
      "",
      ...sceneRows,
      "",
      "# Character State",
      "",
      ...characterRows,
      "",
      "# Location State",
      "",
      ...locationRows,
      "",
      "# Props, Wardrobe, and Set Dressing",
      "",
      ...itemRows,
      "",
      "# Pre-Generation Continuity Checklist",
      "",
      "- Character look matches the character bible.",
      "- Wardrobe changes are intentional, not accidental.",
      "- Props have a first appearance, last known state, and owner/location.",
      "- Location layout, lighting, color, and dressing are consistent.",
      "- Sound texture supports the same physical space.",
      "- Insert shots do not introduce new continuity problems.",
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "continuity_tracker",
      status: "Continuity tracker prepared from saved scene packets. Review, fill gaps, then save.",
      stepId: "continuity",
    });
  }

  function buildContinuityPromptAnchor() {
    const sceneRows = continuityRows.slice(0, 12).map((row) =>
      [
        `- ${row.sceneLabel}`,
        `  Previous: ${row.previousSceneLabel}`,
        `  Location/time: ${row.location || "unknown"} / ${row.timeOfDay || "unknown"}`,
        `  Characters: ${row.characters.length ? row.characters.join(", ") : "unknown"}`,
        `  Props: ${row.props.length ? row.props.join(", ") : "unknown"}`,
        `  Wardrobe: ${row.wardrobe.length ? row.wardrobe.join(", ") : "unknown"}`,
        `  Risks: ${row.riskFlags.length ? row.riskFlags.join("; ") : "none flagged"}`,
      ].join("\n"),
    );

    return [
      "You are a script supervisor and AI film continuity coordinator.",
      "",
      "Review this project continuity map before image generation, animation, sound design, or final export.",
      "",
      "PROJECT",
      `Title: ${project.title || "Untitled"}`,
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      "",
      "TASK",
      "Find continuity risks across scenes. Return a practical checklist of what must stay fixed, what changed intentionally, what is missing, and which scene should be fixed first.",
      "",
      "SCENE HANDOFFS",
      sceneRows.length ? sceneRows.join("\n") : "- No scene packets saved yet.",
      "",
      "RULES",
      "- Protect character face, wardrobe, props, emotional state, location layout, light, color, sound, and object ownership.",
      "- Do not give generic advice. Give exact fixes by scene.",
      "- Flag anything that could make generated shots look like different films.",
    ].join("\n");
  }

  async function copyContinuityPromptAnchor() {
    if (!requirePro("Continuity check prompts")) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildContinuityPromptAnchor());
      setSaveStatus("Continuity check prompt copied.");
      setSaveError("");
    } catch {
      setSaveError("Your browser blocked copy. Build the continuity tracker and copy from the editor.");
    }
  }

  function buildProductionScheduleTemplate() {
    if (!requirePro("Production schedule")) {
      return;
    }

    const sceneRows = sceneBreakdowns.length
      ? sceneBreakdowns.map((scene) => {
          const missing = [
            hasText(scene.summary) ? "" : "scene purpose",
            hasList(scene.characters) ? "" : "characters",
            hasList(scene.props) ? "" : "props",
            hasList(scene.wardrobe) ? "" : "wardrobe",
            hasText(scene.sound_notes) ? "" : "sound",
            hasText(scene.blocking) ? "" : "blocking",
            hasText(scene.color_palette) || hasText(scene.tone) ? "" : "look/tone",
          ].filter(Boolean);
          const sceneAssets = assetsBySceneId[scene.id] ?? [];
          const shotCount = sceneAssets.filter((asset) => asset.asset_type === "shot").length;
          const promptCount = sceneAssets.filter(
            (asset) => hasText(asset.image_prompt) || hasText(asset.animation_prompt) || hasText(asset.sound_prompt),
          ).length;

          return [
            `## ${sceneBoardLabel(scene)}`,
            "",
            `Priority: ${missing.length ? "Lock missing production fields first" : shotCount ? "Generate prompt cards and animation passes" : "Build detailed shot list"}`,
            `Location / time: ${scene.location || "Not mapped yet"} / ${scene.time_of_day || "Not mapped yet"}`,
            `Current blockers: ${missing.length ? missing.join(", ") : "No core scene-packet blockers"}`,
            `Shot-list rows: ${shotCount}`,
            `Prompt-ready assets: ${promptCount}`,
            "",
            "Recommended order:",
            "1. Confirm scene purpose and emotional turn.",
            "2. Lock character, wardrobe, prop, location, sound, and look continuity.",
            "3. Generate establishing/location frame.",
            "4. Generate character coverage frames.",
            "5. Generate inserts only after the scene geography and character look are stable.",
            "6. Generate animation plus sound/dialogue prompts after still images are approved.",
            "7. Check continuity against character bible, location bible, look book, and tracker.",
          ].join("\n");
        })
        .join("\n\n")
      : [
          "## No scene packets yet",
          "",
          "Recommended order:",
          "1. Save or import script pages.",
          "2. Parse and save at least one scene packet.",
          "3. Build character bible, location bible, look book, and continuity tracker.",
          "4. Return here to schedule shot generation and production handoff.",
        ].join("\n");
    const shotRows = sceneBreakdowns.length
      ? sceneBreakdowns.map((scene) => {
          const shotAssets = (assetsBySceneId[scene.id] ?? []).filter((asset) => asset.asset_type === "shot");
          const fallbackShots = [
            "Establish geography and pressure",
            "Lead character intention",
            "Opposing character response",
            "Distance shift",
            "Insert on story object",
            "Final emotional beat",
          ];
          const shots = shotAssets.length
            ? shotAssets.map((asset) => `- ${asset.name}: ${asset.purpose || asset.visual || "Generate image first, then animation and sound."}`)
            : fallbackShots.map((shot, index) => `- Shot ${index + 1}: ${shot}`);

          return [`## ${sceneBoardLabel(scene)}`, "", ...shots].join("\n");
        })
        .join("\n\n")
      : "## Shot order not available yet\n\nBuild scene packets and detailed shot lists first.";
    const lockRows = scheduleLockPhases
      .map((phase, index) =>
        [
          `## Gate ${index + 1}: ${phase.label}`,
          "",
          `Status: ${phase.isReady ? "Ready" : "Needs work"} - ${phase.status}`,
          phase.detail,
          "",
          "Checklist:",
          ...phase.items.map((item) => `- ${item}`),
        ].join("\n"),
      )
      .join("\n\n");
    const queueRows = generationQueue.length
      ? generationQueue
          .map((item, index) =>
            [
              `${index + 1}. ${item.label}`,
              `   Type: ${item.kind}`,
              `   Priority: ${item.priority}`,
              `   Status: ${item.status}`,
              `   Blocker: ${item.blocker}`,
              `   Next action: ${item.nextAction}`,
            ].join("\n"),
          )
          .join("\n\n")
      : "No active blockers. Review the export gates and produce the final packet.";
    const content = [
      `# Production Schedule / Generation Order - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      `Workflow/tools: ${workflowTools || "Not specified"}`,
      "",
      "Purpose:",
      "Turn the project into an ordered production plan so the filmmaker knows what to lock, generate, review, and export next.",
      "",
      "# Readiness Snapshot",
      "",
      `Production readiness: ${readiness.score}%`,
      `Completed checks: ${readiness.completedCount} of ${readiness.total}`,
      `Next best action: ${readiness.next}`,
      "",
      "## Required Locks",
      "",
      `- Logline / Idea: ${hasText(drafts.idea) || hasText(project.logline) ? "Started" : "Missing"}`,
      `- Treatment Blueprint: ${hasText(drafts.treatment) ? "Started" : "Missing"}`,
      `- Character Bible: ${hasText(drafts.character_bible) ? "Started" : "Missing"}`,
      `- Location Bible: ${hasText(drafts.location_bible) ? "Started" : "Missing"}`,
      `- Visual Look Book: ${hasText(drafts.look_book) ? "Started" : "Missing"}`,
      `- Continuity Tracker: ${hasText(drafts.continuity_tracker) ? "Started" : "Missing"}`,
      `- Scene Packets: ${sceneBreakdowns.length}`,
      `- Production Assets: ${productionAssets.length}`,
      "",
      "# Production Lock Gates",
      "",
      lockRows,
      "",
      "# Do First Queue",
      "",
      queueRows,
      "",
      "# Generation Principles",
      "",
      "1. Lock the story, character look, location rules, and visual language before generating final shots.",
      "2. Generate reusable anchors before one-off inserts.",
      "3. Approve still-image continuity before animation.",
      "4. Add sound and dialogue timing after the animation plan is stable.",
      "5. Export only after continuity, look, and prompt cards agree with each other.",
      "",
      "# Generation Order By Dependency",
      "",
      "1. Story spine: logline, treatment, theme, protagonist want/need, and scene purpose.",
      "2. Identity bibles: recurring characters, wardrobe, props, locations, and layout anchors.",
      "3. Visual bible: palette, camera grammar, lighting grammar, motifs, and negative prompts.",
      "4. Continuity matrix: cross-scene prop, wardrobe, time, light, sound, and emotional handoffs.",
      "5. Scene packets: purpose, emotional turn, characters, props, wardrobe, blocking, tone, and sound.",
      "6. Detailed shot lists: shot number, type, angle, movement, visual action, dialogue, and handoff notes.",
      "7. Image anchors: establish approved stills for locations, characters, coverage, and inserts.",
      "8. Animation: animate only approved stills and protect eyelines, props, wardrobe, and camera grammar.",
      "9. Sound: add room tone, practical foley, silence, dialogue timing, and no music unless story-required.",
      "10. Edit and export: review continuity, regenerate failures, then export the production packet.",
      "",
      "# Scene Priority Order",
      "",
      sceneRows,
      "",
      "# Shot Generation Order",
      "",
      shotRows,
      "",
      "# Review Gates",
      "",
      "Before image generation:",
      "- Story, character, location, visual, and continuity locks are ready enough to prevent drift.",
      "- Scene packets have purpose, emotional turn, blocking, props, wardrobe, and sound notes.",
      "",
      "Before animation:",
      "- Still images have approved character look, wardrobe, props, location layout, and lighting direction.",
      "- Insert shots only expand after the main scene geography is stable.",
      "",
      "Before sound:",
      "- Animation timing, dialogue presence, room tone, prop foley, and silence choices are mapped.",
      "- Music is excluded unless the story specifically requires it.",
      "",
      "Before export:",
      "- The production schedule, sound map, shot lists, prompt cards, and continuity tracker agree with each other.",
      "",
      "# Stop Doing Until Ready",
      "",
      "- Do not generate final images until the story, identity, visual, and continuity locks are clear.",
      "- Do not animate a shot until the still frame has been approved.",
      "- Do not create insert-shot variations until the core shot list explains why that insert matters.",
      "- Do not export a production packet until missing scene fields and high-risk continuity notes are resolved.",
      "",
      "# Tool Handoff",
      "",
      "Image generation:",
      "- Generate approved still frames for locations, characters, core coverage, and inserts.",
      "",
      "Animation:",
      "- Animate only approved stills. Preserve camera grammar, eyelines, wardrobe, props, and location layout.",
      "",
      "Sound and dialogue:",
      "- Build room tone, practical object sounds, breath, silence, dialogue timing, and no music unless story-required.",
      "",
      "Edit and color:",
      "- Assemble by scene purpose, then match color and sound continuity against the look book.",
      "",
      "# Suggested Production Sprint",
      "",
      "Sprint 0: Lock logline, treatment, theme, character bible, location bible, and look book.",
      "Sprint 1: Save scene packets and fill continuity gaps.",
      "Sprint 2: Build shot lists for the highest-value scenes.",
      "Sprint 3: Generate still-image anchors and approve continuity.",
      "Sprint 4: Generate animation and sound/dialogue prompts for approved shots.",
      "Sprint 5: Review continuity, regenerate only failed assets, then export the production packet.",
      "",
      "# Export Gates",
      "",
      "- Every recurring character has a visual anchor.",
      "- Every recurring location has a layout and lighting anchor.",
      "- The look book defines palette, camera, and negative prompt rules.",
      "- Scene packets include props, wardrobe, sound, blocking, and tone.",
      "- Shot lists exist before insert-shot expansion.",
      "- Image prompts exist before animation and sound prompts.",
      "- Continuity tracker has no unresolved high-risk items.",
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "production_schedule",
      status: "Generation order prepared. Review the lock gates, then save the Schedule stage.",
      stepId: "schedule",
    });
  }

  function buildSoundMapTemplate() {
    if (!requirePro("Sound Design Map")) {
      return;
    }

    const sceneRows = sceneBreakdowns.length
      ? soundScenePlans
          .map((plan) =>
            [
              `## ${plan.label}`,
              "",
              `Readiness: ${plan.readiness}%`,
              `Priority: ${plan.priority}`,
              `Location / time: ${plan.locationTime}`,
              `Current blockers: ${plan.blockers.length ? plan.blockers.join(", ") : "No major sound blockers flagged"}`,
              `Prompt-card sound rows: ${plan.soundPromptCount}`,
              "",
              "Room tone:",
              `- ${plan.roomTone}`,
              "- Base ambience:",
              "- Distance texture:",
              "- Interior/exterior bleed:",
              "- Practical hum or air:",
              "- Silence behavior:",
              "",
              "Foley and practical sounds:",
              `- ${plan.foleyRule}`,
              "- Footsteps / movement:",
              "- Clothing / body sounds:",
              "- Doors / surfaces / appliances / environment:",
              "- Sounds to avoid:",
              "",
              "Dialogue and silence:",
              `- ${plan.dialogueRule}`,
              `- ${plan.silenceRule}`,
              "- Breath and pause points:",
              "- Off-screen or overlapping lines:",
              "- Processing needs:",
              "",
              "Animation handoff:",
              `- ${plan.animationHandoff}`,
              "- Movement that must create sound:",
              "- Camera movement that affects sound perspective:",
              "- Sync risks:",
              "",
              "Edit notes:",
              "- Lead-in sound:",
              "- Button / cut point:",
              "- Tail-out sound:",
              "- Continuity risk:",
            ].join("\n"),
          )
          .join("\n\n")
      : [
          "## Scene 1",
          "",
          "Location / time: Not mapped yet",
          "Scene tone: Not filled yet",
          "",
          "Room tone:",
          "- Base ambience:",
          "- Distance texture:",
          "- Interior/exterior bleed:",
          "- Silence rule:",
          "",
          "Practical sound list:",
          "- Footsteps / movement:",
          "- Clothing / body sounds:",
          "- Props:",
          "- Doors / surfaces / appliances / environment:",
          "",
          "Dialogue handling:",
          "- Dialogue present:",
          "- Breath and pause points:",
          "- Off-screen or overlapping lines:",
          "- Processing needs:",
          "- Words or moments that need silence instead of score:",
        ].join("\n");
    const layerRows = soundLayerCards
      .map((layer, index) =>
        [
          `## Layer ${index + 1}: ${layer.label}`,
          "",
          `Status: ${layer.isReady ? "Ready" : "Needs work"} - ${layer.status}`,
          layer.detail,
          "",
          "Checklist:",
          ...layer.items.map((item) => `- ${item}`),
        ].join("\n"),
      )
      .join("\n\n");
    const queueRows = soundPriorityQueue.length
      ? soundPriorityQueue
          .map((item, index) =>
            [
              `${index + 1}. ${item.label}`,
              `   Type: ${item.type}`,
              `   Priority: ${item.priority}`,
              `   Status: ${item.status}`,
              `   Next action: ${item.nextAction}`,
            ].join("\n"),
          )
          .join("\n\n")
      : "No active sound blockers. Review the mix continuity and export checklist.";
    const propSounds = uniqueSorted(sceneBreakdowns.flatMap((scene) => scene.props ?? [])).slice(0, 16);
    const locationSounds = locationBibleNames.length
      ? locationBibleNames.map((location) => `- ${location}: room tone, floor texture, air, practical hum, distant life, and silence behavior.`)
      : ["- Primary Location: room tone, floor texture, air, practical hum, distant life, and silence behavior."];
    const promptSoundRows = productionAssets
      .filter((asset) => hasText(asset.sound_prompt))
      .map((asset) => `- ${asset.name}: ${asset.sound_prompt}`)
      .slice(0, 30);
    const content = [
      `# Sound Design Map - ${project.title || "Untitled MiseForge Project"}`,
      "",
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      `Workflow/tools: ${workflowTools || "Not specified"}`,
      "",
      "Purpose:",
      "Make sound a planned production layer before animation, dialogue timing, editing, and final packet export.",
      "",
      "# Sound Layer Board",
      "",
      layerRows,
      "",
      "# Do First Sound Queue",
      "",
      queueRows,
      "",
      "# Sound Thesis",
      "",
      "- The film should sound like:",
      "- The audience should feel this pressure in the room tone:",
      "- Silence should be used when:",
      "- Music should only appear when:",
      "- Sounds to avoid:",
      "",
      "# Location Sound Anchors",
      "",
      ...locationSounds,
      "",
      "# Character Sound Anchors",
      "",
      ...(characterBibleNames.length
        ? characterBibleNames.map((name) => `- ${name}: breath, movement, clothing texture, vocal space, and emotional silence.`)
        : ["- Primary Character: breath, movement, clothing texture, vocal space, and emotional silence."]),
      "",
      "# Prop And Foley Anchors",
      "",
      propSounds.length
        ? propSounds.map((prop) => `- ${prop}: close sound, handling texture, emotional meaning, and continuity risk.`).join("\n")
        : "- Primary prop: close sound, handling texture, emotional meaning, and continuity risk.",
      "",
      "# Scene-by-Scene Sound Map",
      "",
      sceneRows,
      "",
      "# Mix Continuity Rules",
      "",
      "- Room tone must match location, time of day, and scene pressure across cuts.",
      "- Prop sounds should maintain the same material, weight, owner, and emotional meaning.",
      "- Character movement should preserve wardrobe texture, fatigue, injury, breath, and distance.",
      "- Dialogue should sit inside the scene space, not float above it.",
      "- Silence should be intentional and tracked, especially before and after decisions.",
      "",
      "# Existing Prompt Sound Rows",
      "",
      promptSoundRows.length ? promptSoundRows.join("\n") : "- No generated sound prompts yet.",
      "",
      "# Dialogue And Silence Rules",
      "",
      "- Keep dialogue intelligible but not sterile.",
      "- Preserve room tone under every line.",
      "- Use breath, cloth, hands, and object sounds to replace over-explained emotion.",
      "- Use silence before or after decisions.",
      "- Avoid music under scenes where sound design can carry the pressure.",
      "",
      "# Animation Sound Handoff",
      "",
      "- Every animated shot needs a sound layer tied to visible motion.",
      "- Camera movement should change sonic perspective only when motivated.",
      "- Prop movement should have specific foley, not generic whooshes.",
      "- Character movement should include breath, cloth, and contact sounds.",
      "- Dialogue timing must leave space for pauses and reaction beats.",
      "",
      "# Export Checklist",
      "",
      "- Every scene has room tone.",
      "- Every key prop has a sound identity.",
      "- Every location has a sound anchor.",
      "- Every dialogue scene has pause/silence notes.",
      "- Every animation prompt has sound or dialogue handoff notes.",
      "- Music is absent unless the story specifically requires it.",
    ].join("\n");

    loadGeneratedDocument({
      content,
      docType: "sound_map",
      status: "Sound Design Map prepared. Review layers, queue, scene map, and export checks, then save.",
      stepId: "sound",
    });
  }

  function selectedTextareaText() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return { selectedText: "", selectionStart: undefined, selectionEnd: undefined };
    }

    const { selectionStart, selectionEnd } = textarea;
    const selectedText =
      selectionEnd > selectionStart ? currentDraft.slice(selectionStart, selectionEnd) : "";

    return { selectedText, selectionStart, selectionEnd };
  }

  function dialogueScannerSource() {
    const { selectedText } = selectedTextareaText();

    return (
      selectedText.trim() ||
      (activeStepId === "dialogue" ? drafts.script.trim() : currentDraft.trim()) ||
      drafts.script.trim() ||
      drafts.breakdown_notes.trim() ||
      scenePacketSource()
    );
  }

  function runDialogueScanner() {
    const source = dialogueScannerSource();

    if (!source) {
      setSaveError("Paste or import a script section before running the AI Voice Scanner.");
      setSaveStatus("");
      return;
    }

    const scan = analyzeDialogueSource({
      project,
      source,
      workflowTools,
    });

    setDialogueScan(scan);
    loadGeneratedDocument({
      content: buildDialogueReportMarkdown(scan),
      docType: "dialogue_notes",
      status: `AI Voice Scanner finished with a ${scan.score}% dialogue discipline score. Review the flags, then save the Dialogue stage.`,
      stepId: "dialogue",
    });
  }

  async function copyDialogueScannerPrompt() {
    const scan =
      dialogueScan ??
      analyzeDialogueSource({
        project,
        source: dialogueScannerSource(),
        workflowTools,
      });

    if (!scan.sourceExcerpt) {
      setSaveError("Run the AI Voice Scanner after adding script text.");
      setSaveStatus("");
      return;
    }

    try {
      await navigator.clipboard.writeText(scan.prompt);
      setSaveStatus("Dialogue rewrite prompt copied. Paste it into the AI tool you already use.");
      setSaveError("");
    } catch {
      setSaveError("Your browser blocked copy. Run the scanner and copy the prompt from the Dialogue notes.");
    }
  }

  function buildExpertPrompt(mode: GenerateMode) {
    const { selectedText } = selectedTextareaText();
    const source = selectedText || currentDraft || scenePacketSource() || project.logline || project.title;
    const projectContext = [
      `Project title: ${project.title || "Untitled"}`,
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      `Cinematic references: ${project.inspirations?.length ? project.inspirations.join(", ") : "Not specified"}`,
      `Workflow/tools: ${workflowTools || "Not specified"}`,
      `Current MiseForge stage: ${activeStep.label}`,
    ].join("\n");
    const sharedRules = [
      "Do not sound generic or robotic.",
      "Make every note practical for an AI filmmaker preparing production assets.",
      "Favor visual behavior, subtext, blocking, continuity, and production logic over vague advice.",
      "Do not add music unless the story specifically requires it.",
      "Return organized headings and concrete next actions.",
    ].join("\n");
    const instructions: Record<GenerateMode, string> = {
      treatment:
        "Write an industry-level treatment with premise, theme statement, protagonist want versus need, central conflict, act movement, emotional turns, sequence spine, set pieces, ending shape, and a same-but-different hook.",
      script:
        "Turn the material into screenplay-style pages with visual action, subtext, clean dialogue, playable beats, and no obvious AI voice.",
      breakdown:
        "Create a scene breakdown with scene purpose, emotional turn, characters, props, wardrobe, location, lighting, blocking, sound, insert shots, image prompts, animation prompts, continuity risks, and next production action.",
      production:
        "Create a production prompt plan with shot priorities, image prompts, animation prompts, sound design, dialogue timing, continuity notes, tool-specific adaptation notes, and export-ready prompt cards.",
      improve:
        "Improve the selected text while preserving the author's intent. Remove AI voice, add specificity, visual action, subtext, stronger rhythm, and a more cinematic emotional turn.",
      dialogue:
        "Polish the dialogue so it feels human, playable, compressed, character-specific, and full of subtext. Remove exposition and make the emotion live under the line.",
      lookbook:
        "Create a visual look book with a film-wide visual thesis, palette, lighting grammar, camera grammar, character and location anchors, recurring motifs, negative prompts, and tool-specific consistency rules.",
      schedule:
        "Create a production schedule with lock gates, a do-first queue, dependency-based generation order, scene priority, shot generation sequence, image-before-animation review gates, sound handoff, continuity checks, and export gates.",
      sound:
        "Create a sound design map with a sound layer board, do-first sound queue, room tone, practical sounds, prop foley, dialogue and silence rules, animation handoff, mix continuity, edit notes, and final export checklist.",
      insert_shot:
        "Suggest insert shots that externalize the conflict. For each insert, include purpose, visual description, image prompt, animation prompt, sound design, and continuity risks.",
      structure:
        "Diagnose the structure. Identify missing premise pressure, weak logline, unclear protagonist want versus need, missing theme statement, weak act turns, low stakes, repeated information, and the next best rewrite action.",
    };

    return [
      "You are a professional script supervisor, story editor, and AI film pre-production coordinator.",
      "",
      "PROJECT CONTEXT",
      projectContext,
      "",
      "TASK",
      instructions[mode],
      "",
      "RULES",
      sharedRules,
      "",
      "SOURCE MATERIAL",
      source,
    ].join("\n");
  }

  async function copyExpertPrompt(mode: GenerateMode) {
    const prompt = buildExpertPrompt(mode);

    try {
      await navigator.clipboard.writeText(prompt);
      setSaveStatus("Expert prompt copied. Paste it into the AI tool you already use, then bring the result back into MiseForge.");
      setSaveError("");
    } catch {
      setSaveError("Your browser blocked copy. Select the text in the editor and copy it manually.");
    }
  }

  async function importTextFile(file: File) {
    const text = await file.text();
    updateDraft(text);
    setSaveStatus(`${file.name} imported into ${activeStep.label}.`);
  }

  async function saveStageDraft() {
    if (!accessToken) {
      setSaveError("Open this project from its project page before saving stage drafts.");
      return;
    }

    setIsSavingStage(true);
    setSaveStatus("");
    setSaveError("");

    try {
      const response = await fetch(`/api/projects/${project.id}/documents`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docType: activeStep.docType,
          content: currentDraft,
          activeStage: activeStep.projectStage,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        document?: ProjectDocument;
        documents?: ProjectDocument[];
        error?: string;
      };

      if (!response.ok || !result.ok || !result.document) {
        throw new Error(result.error ?? "Unable to save stage draft.");
      }

      onDocumentsChange?.(result.documents ?? [result.document]);
      setSaveStatus(`${activeStep.label} saved to Supabase.`);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to save stage draft.");
    } finally {
      setIsSavingStage(false);
    }
  }

  function scenePacketSource() {
    const activeDraft = currentDraft.trim();

    if (activeStepId === "breakdown" && drafts.script.trim()) {
      return drafts.script.trim();
    }

    return (
      activeDraft ||
      drafts.script.trim() ||
      drafts.idea.trim() ||
      drafts.treatment.trim() ||
      drafts.look_book.trim() ||
      drafts.production_schedule.trim() ||
      drafts.sound_map.trim() ||
      drafts.story.trim()
    );
  }

  async function saveScenePacket() {
    if (!accessToken) {
      setSaveError("Open this project from its project page before saving scene packets.");
      return;
    }

    const content = scenePacketSource();

    if (!content) {
      setSaveError("Paste or import a scene/script before saving a scene packet.");
      return;
    }

    setIsSavingPacket(true);
    setSaveStatus("");
    setSaveError("");

    try {
      const response = await fetch(`/api/projects/${project.id}/scene-packets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          toolStack: workflowTools,
        }),
      });
      const result = (await response.json()) as ScenePacketResponse;

      if (!response.ok || !result.ok || !result.document) {
        throw new Error(result.error ?? "Unable to save scene packet.");
      }

      setDrafts((current) => ({
        ...current,
        breakdown_notes: result.document!.content,
      }));
      onDraftChange(result.document.content);
      onDocumentsChange?.(result.documents ?? [result.document]);
      onSceneBreakdownsChange?.(result.sceneBreakdowns ?? []);
      setActiveStepId("breakdown");
      setSaveStatus(
        result.message ??
          `${result.sceneBreakdowns?.length ?? 0} scene packet row(s) saved to Supabase.`,
      );
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to save scene packet.");
    } finally {
      setIsSavingPacket(false);
    }
  }

  function startEditingScene(scene: SceneBreakdown) {
    setEditingSceneId(scene.id);
    setSceneDrafts((current) => ({
      ...current,
      [scene.id]: current[scene.id] ?? sceneToDraft(scene),
    }));
    setSaveStatus("");
    setSaveError("");
  }

  function updateSceneDraft(sceneId: string, field: keyof SceneBreakdownDraft, value: string) {
    setSceneDrafts((current) => {
      const sourceScene = sceneBreakdowns.find((scene) => scene.id === sceneId);
      const currentDraft = current[sceneId] ?? (sourceScene ? sceneToDraft(sourceScene) : emptySceneDraft());

      return {
        ...current,
        [sceneId]: {
          ...currentDraft,
          [field]: value,
        },
      };
    });
  }

  function cancelSceneEdit(sceneId: string) {
    setEditingSceneId("");
    setSceneDrafts((current) => {
      const next = { ...current };
      delete next[sceneId];
      return next;
    });
  }

  async function saveSceneEdit(scene: SceneBreakdown) {
    if (!accessToken) {
      setSaveError("Open this project from its project page before editing scene packets.");
      return;
    }

    const draft = sceneDrafts[scene.id] ?? sceneToDraft(scene);
    setSavingSceneId(scene.id);
    setSaveStatus("");
    setSaveError("");

    try {
      const response = await fetch(`/api/projects/${project.id}/scene-packets`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sceneBreakdownId: scene.id,
          ...draft,
        }),
      });
      const result = (await response.json()) as ScenePacketEditResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to save scene packet edits.");
      }

      onSceneBreakdownsChange?.(result.sceneBreakdowns ?? []);
      setEditingSceneId("");
      setSceneDrafts((current) => {
        const next = { ...current };
        delete next[scene.id];
        return next;
      });
      setSaveStatus(result.message ?? `Scene ${scene.scene_number} saved.`);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to save scene packet edits.");
    } finally {
      setSavingSceneId("");
    }
  }

  function buildShotListPrompt(scene: SceneBreakdown, shotAssets: ProductionAsset[]) {
    const rows = shotAssets.length
      ? shotAssets
          .map((asset) => {
            const metadata = parseShotMetadata(asset.notes);

            return [
              `- ${asset.name}`,
              `  Purpose: ${asset.purpose || "Not set"}`,
              `  Visual: ${asset.visual || "Not set"}`,
              `  Shot type: ${metadata.shotType || "Not set"}`,
              `  Angle: ${metadata.angle || "Not set"}`,
              `  Movement: ${metadata.movement || "Not set"}`,
              `  Lens / feel: ${metadata.lens || "Not set"}`,
              `  Duration: ${metadata.duration || "Not set"}`,
              `  Dialogue / sound: ${metadata.dialogueSound || "Not set"}`,
              `  Continuity: ${metadata.continuity || "Not set"}`,
            ].join("\n");
          })
          .join("\n")
      : "- No shot rows yet. Build a practical shot list first.";

    return [
      "You are a professional director, DP, and script supervisor preparing a shot list for an AI film workflow.",
      "",
      "PROJECT",
      `Title: ${project.title || "Untitled"}`,
      `Genre: ${project.genre || "Not specified"}`,
      `Tone: ${project.tone || "Not specified"}`,
      `Logline: ${project.logline || "Not specified"}`,
      `Workflow/tools: ${workflowTools || "Not specified"}`,
      "",
      "SCENE",
      `Heading: ${scene.scene_heading || "Not specified"}`,
      `Summary: ${scene.summary || "Not specified"}`,
      `Location/time: ${scene.location || "Not specified"} / ${scene.time_of_day || "Not specified"}`,
      `Characters: ${listText(scene.characters, "Not specified")}`,
      `Props: ${listText(scene.props, "Not specified")}`,
      `Wardrobe: ${listText(scene.wardrobe, "Not specified")}`,
      `Set dressing: ${listText(scene.set_dressing, "Not specified")}`,
      `Sound: ${scene.sound_notes || "Not specified"}`,
      `Blocking: ${scene.blocking || "Not specified"}`,
      "",
      "CURRENT SHOT LIST",
      rows,
      "",
      "TASK",
      "Refine this into a director-ready shot list. For every shot, include shot number, shot type, camera angle, movement, lens/feel, duration, action, dialogue/sound, continuity check, image prompt guidance, and animation prompt guidance.",
      "",
      "RULES",
      "- Keep the scene producible.",
      "- Protect eyelines, screen direction, wardrobe, props, sound, and location continuity.",
      "- Insert shots must externalize story conflict, not decorate it.",
      "- Do not add music unless the story requires it.",
    ].join("\n");
  }

  async function copyShotListPrompt(scene: SceneBreakdown, shotAssets: ProductionAsset[]) {
    if (!requirePro("Shot list prompt compiler")) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildShotListPrompt(scene, shotAssets));
      setSaveStatus(`Shot list prompt copied for scene ${scene.scene_number}.`);
      setSaveError("");
    } catch {
      setSaveError("Your browser blocked copy. Build the shot list and copy from the production packet instead.");
    }
  }

  async function createInsertShot(scene: SceneBreakdown) {
    if (!requirePro("Insert-shot prompt cards")) {
      return;
    }

    if (!accessToken) {
      setSaveError("Open this project from its project page before creating production assets.");
      return;
    }

    setCreatingAssetSceneId(scene.id);
    setSaveStatus("");
    setSaveError("");

    try {
      const response = await fetch(`/api/projects/${project.id}/production-assets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "insert_shot",
          sceneBreakdownId: scene.id,
          assetType: "insert_shot",
        }),
      });
      const result = (await response.json()) as ProductionAssetResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to create insert shot.");
      }

      onProductionAssetsChange?.(result.productionAssets ?? []);
      setSaveStatus(result.message ?? `Insert shot saved for scene ${scene.scene_number}.`);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to create insert shot.");
    } finally {
      setCreatingAssetSceneId("");
    }
  }

  async function buildDetailedShotList(scene: SceneBreakdown) {
    if (!requirePro("Detailed shot lists")) {
      return;
    }

    if (!accessToken) {
      setSaveError("Open this project from its project page before creating the shot list.");
      return;
    }

    setBuildingShotListSceneId(scene.id);
    setSaveStatus("");
    setSaveError("");

    try {
      const response = await fetch(`/api/projects/${project.id}/production-assets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "shot_list",
          sceneBreakdownId: scene.id,
        }),
      });
      const result = (await response.json()) as ProductionAssetResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to build detailed shot list.");
      }

      onProductionAssetsChange?.(result.productionAssets ?? []);
      setSaveStatus(result.message ?? `Detailed shot list saved for scene ${scene.scene_number}.`);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to build detailed shot list.");
    } finally {
      setBuildingShotListSceneId("");
    }
  }

  async function generateAssetPrompt(
    scene: SceneBreakdown,
    asset: ProductionAsset,
    action: "image_prompt" | "animation_prompt",
  ) {
    if (!requirePro(action === "image_prompt" ? "Image prompts" : "Animation, sound, and dialogue prompts")) {
      return;
    }

    if (!accessToken) {
      setSaveError("Open this project from its project page before generating shot prompts.");
      return;
    }

    setGeneratingAssetPromptId(`${action}:${asset.id}`);
    setSaveStatus("");
    setSaveError("");

    try {
      const response = await fetch(`/api/projects/${project.id}/production-assets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          sceneBreakdownId: scene.id,
          productionAssetId: asset.id,
        }),
      });
      const result = (await response.json()) as ProductionAssetResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to generate shot prompt.");
      }

      onProductionAssetsChange?.(result.productionAssets ?? []);
      setSaveStatus(result.message ?? `${asset.name} prompt saved.`);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to generate shot prompt.");
    } finally {
      setGeneratingAssetPromptId("");
    }
  }

  function buildProductionPacketMarkdown() {
    const docSections: Array<{ label: string; value: string }> = [
      { label: "Idea", value: drafts.idea },
      { label: "Synopsis", value: drafts.synopsis },
      { label: "Treatment", value: drafts.treatment },
      { label: "Character Bible", value: drafts.character_bible },
      { label: "Location Bible", value: drafts.location_bible },
      { label: "Visual Look Book", value: drafts.look_book },
      { label: "Script", value: drafts.script },
      { label: "Dialogue / AI Voice Scan", value: drafts.dialogue_notes },
      { label: "Continuity Tracker", value: drafts.continuity_tracker },
      { label: "Breakdown Notes", value: drafts.breakdown_notes },
      { label: "Production Schedule", value: drafts.production_schedule },
      { label: "Sound Design Map", value: drafts.sound_map },
      { label: "Production Notes", value: drafts.story },
    ];

    const projectSummary = [
      `# ${markdownValue(project.title, "Untitled MiseForge Project")}`,
      "",
      "## Project",
      "",
      `Genre: ${markdownValue(project.genre)}`,
      `Tone: ${markdownValue(project.tone)}`,
      `Logline: ${markdownValue(project.logline)}`,
      "",
      "Inspirations:",
      markdownList(project.inspirations),
      "",
      `Workflow/tools: ${markdownValue(workflowTools, "Tool stack not specified")}`,
      "",
      "## Story Development Snapshot",
      "",
      `Story suite score: ${storySuiteScore}%`,
      `${storyReadyCount} of ${storyDiagnostics.length} story locks started`,
      "",
      storyDiagnostics
        .map((item) => `- ${item.isReady ? "Started" : "Next"}: ${item.label} - ${item.isReady ? item.detail : item.next}`)
        .join("\n"),
    ].join("\n");

    const documentBlocks = docSections
      .filter((section) => section.value.trim())
      .map((section) => [`## ${section.label}`, "", section.value.trim()].join("\n"))
      .join("\n\n");
    const visualStyleBibleBlocks = visualStyleRules.length
      ? [
          "## Visual Style Bible Snapshot",
          "",
          ...visualStyleRules.map((rule) =>
            [
              `### ${rule.title}`,
              "",
              `Readiness: ${rule.readiness}%`,
              `Status: ${rule.status}`,
              rule.body,
              "",
              "Anchors:",
              markdownList(rule.anchors, "Not mapped yet"),
            ].join("\n"),
          ),
          "",
          "### Scene Look Map",
          "",
          ...(visualSceneProfiles.length
            ? visualSceneProfiles.map((profile) =>
                [
                  `#### ${profile.sceneLabel}`,
                  "",
                  `Readiness: ${profile.readiness}%`,
                  `Location / time: ${markdownValue(profile.locationTime)}`,
                  `Color / tone: ${markdownValue(profile.colorState)}`,
                  `Lighting: ${markdownValue(profile.lightingRule)}`,
                  `Camera: ${markdownValue(profile.cameraRule)}`,
                  `Motif: ${markdownValue(profile.motif)}`,
                  `Drift risk: ${markdownValue(profile.negativeRisk)}`,
                ].join("\n"),
              )
            : ["No scene look map yet."]),
        ].join("\n\n")
      : "";
    const versionBlocks = entitlement.isPro && versions.length
      ? [
          "## Saved Passes",
          "",
          ...versions.map((version) =>
            [
              `### ${version.label}`,
              "",
              `Stage: ${version.stageLabel}`,
              `Saved: ${formatVersionDate(version.createdAt)}`,
              "",
              version.content.trim(),
            ].join("\n"),
          ),
        ].join("\n\n")
      : "";
    const characterProfileBlocks = characterProfiles.length
      ? [
          "## Character Continuity Cards",
          "",
          ...characterProfiles.map((profile) =>
            [
              `### ${profile.name}`,
              "",
              `Continuity readiness: ${profile.readiness}%`,
              `Scene appearances: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
              `Shared scenes with: ${profile.coCharacters.length ? profile.coCharacters.join(", ") : "Not mapped yet"}`,
              `Missing anchors: ${profile.missing.length ? profile.missing.join(", ") : "None flagged"}`,
              "",
              "Wardrobe:",
              markdownList(profile.wardrobe),
              "",
              "Props:",
              markdownList(profile.props),
              "",
              "Locations:",
              markdownList(profile.locations),
              "",
              "Tone / sound anchors:",
              markdownList([...profile.toneNotes, ...profile.soundNotes]),
            ].join("\n"),
          ),
        ].join("\n\n")
      : "";
    const locationProfileBlocks = locationProfiles.length
      ? [
          "## Location Continuity Cards",
          "",
          ...locationProfiles.map((profile) =>
            [
              `### ${profile.name}`,
              "",
              `Continuity readiness: ${profile.readiness}%`,
              `Scene usage: ${profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}`,
              `Missing anchors: ${profile.missing.length ? profile.missing.join(", ") : "None flagged"}`,
              "",
              "Time-of-day rules:",
              markdownList(profile.timeOfDays),
              "",
              "Set dressing:",
              markdownList(profile.setDressing),
              "",
              "Props:",
              markdownList(profile.props),
              "",
              "Characters:",
              markdownList(profile.characters),
              "",
              "Color / light anchors:",
              markdownList(profile.colorNotes),
              "",
              "Sound anchors:",
              markdownList(profile.soundNotes),
              "",
              "Blocking / layout notes:",
              markdownList(profile.blockingNotes),
            ].join("\n"),
          ),
        ].join("\n\n")
      : "";
    const continuityMatrixBlocks = continuityRows.length
      ? [
          "## Cross-Scene Continuity Matrix",
          "",
          ...continuityRows.map((row) =>
            [
              `### ${row.sceneLabel}`,
              "",
              `Previous scene handoff: ${row.previousSceneLabel}`,
              `Continuity readiness: ${row.readiness}%`,
              `Location / time: ${markdownValue(row.location)} / ${markdownValue(row.timeOfDay)}`,
              "",
              "Characters:",
              markdownList(row.characters),
              "",
              "Props:",
              markdownList(row.props),
              "",
              "Wardrobe:",
              markdownList(row.wardrobe),
              "",
              "Set dressing:",
              markdownList(row.setDressing),
              "",
              `Sound state: ${markdownValue(row.soundState)}`,
              `Color / light state: ${markdownValue(row.colorState)}`,
              `Blocking / layout: ${markdownValue(row.blocking)}`,
              "",
              "Continuity risks:",
              markdownList(row.riskFlags, "No automatic risks flagged yet."),
            ].join("\n"),
          ),
        ].join("\n\n")
      : "";

    const sceneBlocks = sceneBreakdowns
      .map((scene) => {
        const sceneAssets = entitlement.isPro ? assetsBySceneId[scene.id] ?? [] : [];
        const shotAssets = sceneAssets.filter((asset) => asset.asset_type === "shot");
        const promptAssets = sceneAssets.filter((asset) => asset.asset_type !== "shot");

        const sceneBlock = [
          `## Scene ${scene.scene_number}: ${markdownValue(scene.scene_heading, "Unlabeled scene")}`,
          "",
          `Summary: ${markdownValue(scene.summary)}`,
          `Location: ${markdownValue(scene.location)}`,
          `Time of day: ${markdownValue(scene.time_of_day)}`,
          `Tone: ${markdownValue(scene.tone || scene.color_palette)}`,
          "",
          "Characters:",
          markdownList(scene.characters),
          "",
          "Props:",
          markdownList(scene.props),
          "",
          "Wardrobe:",
          markdownList(scene.wardrobe),
          "",
          "Set dressing:",
          markdownList(scene.set_dressing),
          "",
          `Sound notes: ${markdownValue(scene.sound_notes)}`,
          `Blocking: ${markdownValue(scene.blocking)}`,
        ].join("\n");

        const shotBlock = shotAssets.length
          ? [
              "### Detailed Shot List",
              "",
              ...shotAssets.map((asset) =>
                {
                  const shotMetadata = parseShotMetadata(asset.notes);
                  const shotMetadataBlock = hasShotMetadata(shotMetadata)
                    ? [
                        "Shot metadata:",
                        `- Shot type: ${markdownValue(shotMetadata.shotType)}`,
                        `- Camera angle: ${markdownValue(shotMetadata.angle)}`,
                        `- Camera movement: ${markdownValue(shotMetadata.movement)}`,
                        `- Lens / feel: ${markdownValue(shotMetadata.lens)}`,
                        `- Estimated duration: ${markdownValue(shotMetadata.duration)}`,
                        `- Action: ${markdownValue(shotMetadata.action)}`,
                        `- Dialogue / sound: ${markdownValue(shotMetadata.dialogueSound)}`,
                        `- Continuity check: ${markdownValue(shotMetadata.continuity)}`,
                      ].join("\n")
                    : `Shot notes: ${markdownValue(asset.notes)}`;

                  return [
                  `#### ${asset.name}`,
                  "",
                  `Purpose: ${markdownValue(asset.purpose)}`,
                  `Visual: ${markdownValue(asset.visual)}`,
                  "",
                  shotMetadataBlock,
                  "",
                  `Image prompt: ${markdownValue(asset.image_prompt)}`,
                  "",
                  `Animation prompt: ${markdownValue(asset.animation_prompt)}`,
                  "",
                  `Sound/dialogue prompt: ${markdownValue(asset.sound_prompt)}`,
                ].join("\n");
                },
              ),
            ].join("\n\n")
          : "### Detailed Shot List\n\nNot built yet.";

        const promptBlock = promptAssets.length
          ? [
              "### Prompt Cards",
              "",
              ...promptAssets.map((asset) =>
                [
                  `#### ${asset.name}`,
                  "",
                  `Type: ${asset.asset_type.replaceAll("_", " ")}`,
                  `Purpose: ${markdownValue(asset.purpose)}`,
                  `Visual: ${markdownValue(asset.visual)}`,
                  "",
                  `Image prompt: ${markdownValue(asset.image_prompt)}`,
                  "",
                  `Animation prompt: ${markdownValue(asset.animation_prompt)}`,
                  "",
                  `Sound prompt: ${markdownValue(asset.sound_prompt)}`,
                  "",
                  `Notes: ${markdownValue(asset.notes)}`,
                ].join("\n"),
              ),
            ].join("\n\n")
          : "### Prompt Cards\n\nNot built yet.";

        return [sceneBlock, shotBlock, promptBlock].join("\n\n");
      })
      .join("\n\n");

    return [
      projectSummary,
      visualStyleBibleBlocks,
      characterProfileBlocks,
      locationProfileBlocks,
      continuityMatrixBlocks,
      documentBlocks,
      versionBlocks,
      "## Scene Packets",
      sceneBlocks || "No scene packets saved yet.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  function buildPremiumPacketHtml() {
    const docSections: Array<{ label: string; value: string }> = [
      { label: "Idea", value: drafts.idea },
      { label: "Synopsis", value: drafts.synopsis },
      { label: "Treatment", value: drafts.treatment },
      { label: "Character Bible", value: drafts.character_bible },
      { label: "Location Bible", value: drafts.location_bible },
      { label: "Visual Look Book", value: drafts.look_book },
      { label: "Script", value: drafts.script },
      { label: "Dialogue / AI Voice Scan", value: drafts.dialogue_notes },
      { label: "Continuity Tracker", value: drafts.continuity_tracker },
      { label: "Breakdown Notes", value: drafts.breakdown_notes },
      { label: "Production Schedule", value: drafts.production_schedule },
      { label: "Sound Design Map", value: drafts.sound_map },
      { label: "Production Notes", value: drafts.story },
    ].filter((section) => section.value.trim());
    const shotCount = productionAssets.filter((asset) => asset.asset_type === "shot").length;
    const promptCardCount = productionAssets.filter((asset) => asset.asset_type !== "shot").length;
    const imagePromptCount = productionAssets.filter((asset) => hasText(asset.image_prompt)).length;
    const animationSoundPromptCount = productionAssets.filter(
      (asset) => hasText(asset.animation_prompt) || hasText(asset.sound_prompt),
    ).length;
    const soundSceneCount = sceneBreakdowns.filter((scene) => hasText(scene.sound_notes)).length;
    const completeSceneCount = sceneBreakdowns.filter(
      (scene) =>
        hasText(scene.summary) &&
        hasList(scene.characters) &&
        hasList(scene.props) &&
        hasText(scene.sound_notes) &&
        hasText(scene.blocking),
    ).length;
    const packetDate = new Date().toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const readinessItems = [
      { label: "Story documents", value: `${docSections.length} saved` },
      { label: "Scene packets", value: `${sceneBreakdowns.length} mapped` },
      { label: "Complete scene packets", value: `${completeSceneCount} of ${sceneBreakdowns.length || 0}` },
      { label: "Shot rows", value: `${shotCount} built` },
      { label: "Prompt cards", value: `${promptCardCount} built` },
      { label: "Image prompts", value: `${imagePromptCount} ready` },
      { label: "Animation / sound prompts", value: `${animationSoundPromptCount} ready` },
      { label: "Sound mapped scenes", value: `${soundSceneCount} of ${sceneBreakdowns.length || 0}` },
    ];
    const exportGates = [
      {
        detail: project.logline || "Logline not entered yet.",
        isReady: hasText(project.logline),
        label: "Story spine",
      },
      {
        detail: characterProfiles.length
          ? `${characterProfiles.length} character identity card${characterProfiles.length === 1 ? "" : "s"}`
          : "Character bible not mapped yet.",
        isReady: characterProfiles.length > 0,
        label: "Character identity",
      },
      {
        detail: locationProfiles.length
          ? `${locationProfiles.length} location identity card${locationProfiles.length === 1 ? "" : "s"}`
          : "Location bible not mapped yet.",
        isReady: locationProfiles.length > 0,
        label: "Location identity",
      },
      {
        detail: visualStyleRules.length
          ? `${visualStyleRules.length} visual rule card${visualStyleRules.length === 1 ? "" : "s"}`
          : "Style bible not started yet.",
        isReady: visualStyleRules.some((rule) => rule.readiness > 0),
        label: "Visual language",
      },
      {
        detail: continuityRows.length
          ? `${continuityRows.length} scene handoff${continuityRows.length === 1 ? "" : "s"}`
          : "Continuity tracker not mapped yet.",
        isReady: continuityRows.length > 0,
        label: "Continuity handoff",
      },
      {
        detail: shotCount ? `${shotCount} detailed shot row${shotCount === 1 ? "" : "s"}` : "Detailed shot lists not built yet.",
        isReady: shotCount > 0,
        label: "Shot plan",
      },
      {
        detail: imagePromptCount
          ? `${imagePromptCount} image prompt${imagePromptCount === 1 ? "" : "s"} ready`
          : "Image prompts not generated yet.",
        isReady: imagePromptCount > 0,
        label: "Image prompts",
      },
      {
        detail: animationSoundPromptCount
          ? `${animationSoundPromptCount} animation/sound prompt${animationSoundPromptCount === 1 ? "" : "s"} ready`
          : "Animation and sound prompts not generated yet.",
        isReady: animationSoundPromptCount > 0,
        label: "Animation and sound",
      },
    ];
    const openRiskList = [
      sceneBreakdowns.length ? "" : "No scene packets are saved yet.",
      characterProfiles.length ? "" : "Character identity locks still need to be mapped.",
      locationProfiles.length ? "" : "Location layout, light, and sound locks still need to be mapped.",
      shotCount ? "" : "Detailed shot lists still need to be built.",
      imagePromptCount ? "" : "Image prompts still need to be generated from approved shot rows.",
      animationSoundPromptCount ? "" : "Animation and sound prompts still need to be generated after image prompts.",
    ].filter((value): value is string => Boolean(value));
    const coverageItems = [
      { label: "Readiness", value: `${readiness.score}%`, detail: `${readiness.completedCount} of ${readiness.total} checks` },
      { label: "Scenes", value: `${sceneBreakdowns.length}`, detail: `${completeSceneCount} complete` },
      { label: "Characters", value: `${characterProfiles.length}`, detail: "identity cards" },
      { label: "Locations", value: `${locationProfiles.length}`, detail: "location cards" },
      { label: "Style Rules", value: `${visualStyleRules.length}`, detail: "visual anchors" },
      { label: "Continuity", value: `${continuityRows.length}`, detail: "scene handoffs" },
      { label: "Shots", value: `${shotCount}`, detail: "shot rows" },
      { label: "Prompts", value: `${imagePromptCount + animationSoundPromptCount}`, detail: "image/animation/sound" },
    ];
    const tocItems = [
      "Cover",
      "Producer Handoff",
      "Story Development Snapshot",
      "Production Readiness",
      "Project Roadmap",
      visualStyleRules.length ? "Visual Style Bible Snapshot" : "",
      characterProfiles.length ? "Character Continuity Cards" : "",
      locationProfiles.length ? "Location Continuity Cards" : "",
      continuityRows.length ? "Cross-Scene Continuity Matrix" : "",
      ...docSections.map((section) => section.label),
      versions.length ? "Version History" : "",
      sceneBreakdowns.length ? "Scene Packets" : "",
      sceneBreakdowns.length ? "Detailed Shot Lists" : "",
      sceneBreakdowns.length ? "Prompt Cards" : "",
    ].filter(Boolean);

    const sceneSections = sceneBreakdowns
      .map((scene) => {
        const sceneAssets = assetsBySceneId[scene.id] ?? [];
        const shotAssets = sceneAssets.filter((asset) => asset.asset_type === "shot");
        const promptAssets = sceneAssets.filter((asset) => asset.asset_type !== "shot");
        const sceneReadiness = [
          hasText(scene.summary),
          hasList(scene.characters),
          hasList(scene.props),
          hasList(scene.wardrobe),
          hasText(scene.sound_notes),
          hasText(scene.blocking),
        ].filter(Boolean).length;

        const shotRows = shotAssets.length
          ? shotAssets
              .map((asset) => {
                const shotMetadata = parseShotMetadata(asset.notes);
                const shotMetadataGrid = hasShotMetadata(shotMetadata)
                  ? `
                    <div class="shot-meta-export">
                      <section><b>Shot Type</b>${htmlParagraphs(shotMetadata.shotType)}</section>
                      <section><b>Camera Angle</b>${htmlParagraphs(shotMetadata.angle)}</section>
                      <section><b>Camera Movement</b>${htmlParagraphs(shotMetadata.movement)}</section>
                      <section><b>Lens / Feel</b>${htmlParagraphs(shotMetadata.lens)}</section>
                      <section><b>Estimated Duration</b>${htmlParagraphs(shotMetadata.duration)}</section>
                      <section><b>Action</b>${htmlParagraphs(shotMetadata.action)}</section>
                      <section><b>Dialogue / Sound</b>${htmlParagraphs(shotMetadata.dialogueSound)}</section>
                      <section><b>Continuity Check</b>${htmlParagraphs(shotMetadata.continuity)}</section>
                    </div>
                  `
                  : `<p>${htmlValue(asset.notes)}</p>`;

                return `
                  <article class="shot">
                    <div class="shot-number">${String(asset.order_index).padStart(2, "0")}</div>
                    <div>
                      <h4>${htmlValue(asset.name, "Untitled shot")}</h4>
                      <p class="purpose">${htmlValue(asset.purpose)}</p>
                      <p>${htmlValue(asset.visual)}</p>
                      ${shotMetadataGrid}
                      <div class="prompt-grid">
                        <section><b>Image Prompt</b>${htmlParagraphs(asset.image_prompt)}</section>
                        <section><b>Animation Prompt</b>${htmlParagraphs(asset.animation_prompt)}</section>
                        <section><b>Sound / Dialogue</b>${htmlParagraphs(asset.sound_prompt)}</section>
                      </div>
                    </div>
                  </article>
                `;
              })
              .join("")
          : `<p class="empty">Shot list not built yet.</p>`;

        const promptCards = promptAssets.length
          ? promptAssets
              .map(
                (asset) => `
                  <article class="prompt-card">
                    <span>${htmlValue(asset.asset_type.replaceAll("_", " "), "prompt card")}</span>
                    <h4>${htmlValue(asset.name, "Untitled prompt card")}</h4>
                    <p class="purpose">${htmlValue(asset.purpose)}</p>
                    <p>${htmlValue(asset.visual)}</p>
                    <div class="prompt-grid">
                      <section><b>Image Prompt</b>${htmlParagraphs(asset.image_prompt)}</section>
                      <section><b>Animation Prompt</b>${htmlParagraphs(asset.animation_prompt)}</section>
                      <section><b>Sound Prompt</b>${htmlParagraphs(asset.sound_prompt)}</section>
                    </div>
                  </article>
                `,
              )
              .join("")
          : `<p class="empty">Prompt cards not built yet.</p>`;

        return `
          <section class="packet-section scene-page">
            <div class="section-label">Scene ${scene.scene_number}</div>
            <h2>${htmlValue(scene.scene_heading, "Unlabeled scene")}</h2>
            <p class="lede">${htmlValue(scene.summary)}</p>
            <div class="meta-grid">
              <div><b>Location</b><span>${htmlValue(scene.location)}</span></div>
              <div><b>Time</b><span>${htmlValue(scene.time_of_day)}</span></div>
              <div><b>Tone</b><span>${htmlValue(scene.tone || scene.color_palette)}</span></div>
            </div>
            <div class="scene-status">
              <span>${sceneReadiness}/6 core fields filled</span>
              <span>${shotAssets.length} shot rows</span>
              <span>${promptAssets.length} prompt cards</span>
            </div>
            <div class="details-grid">
              <section><h3>Characters</h3>${htmlList(scene.characters)}</section>
              <section><h3>Props</h3>${htmlList(scene.props)}</section>
              <section><h3>Wardrobe</h3>${htmlList(scene.wardrobe)}</section>
              <section><h3>Set Dressing</h3>${htmlList(scene.set_dressing)}</section>
              <section><h3>Sound Notes</h3>${htmlParagraphs(scene.sound_notes)}</section>
              <section><h3>Blocking</h3>${htmlParagraphs(scene.blocking)}</section>
            </div>
          </section>
          <section class="packet-section">
            <div class="section-label">Scene ${scene.scene_number} / Page 2</div>
            <h2>Detailed Shot List</h2>
            <p class="lede">Coverage, inserts, camera intent, animation handoff, and sound notes for the scene.</p>
            ${shotRows}
          </section>
          <section class="packet-section">
            <div class="section-label">Scene ${scene.scene_number} / Prompt Cards</div>
            <h2>Image, Animation, Sound</h2>
            <p class="lede">Prompt-ready production assets for image generation, animation, sound design, and dialogue timing.</p>
            ${promptCards}
          </section>
        `;
      })
      .join("");
    const characterProfileSection = characterProfiles.length
      ? `
          <section class="packet-section">
            <div class="section-label">Character Continuity Cards</div>
            <h2>Character identity locks.</h2>
            <p class="lede">Visual, wardrobe, prop, relationship, and scene-state anchors for keeping recurring characters consistent across generated images and animation.</p>
            <div class="character-export-grid">
              ${characterProfiles
                .map(
                  (profile) => `
                    <article class="character-export-card">
                      <div class="character-export-head">
                        <span>${profile.readiness}% ready</span>
                        <h3>${htmlValue(profile.name)}</h3>
                      </div>
                      <p>${profile.sceneLabels.length} scene appearance${profile.sceneLabels.length === 1 ? "" : "s"} / ${profile.productionAssets.length} production row${profile.productionAssets.length === 1 ? "" : "s"}</p>
                      <div class="details-grid compact">
                        <section><h4>Scenes</h4>${htmlList(profile.sceneLabels)}</section>
                        <section><h4>Wardrobe</h4>${htmlList(profile.wardrobe)}</section>
                        <section><h4>Props</h4>${htmlList(profile.props)}</section>
                        <section><h4>Relationships</h4>${htmlList(profile.coCharacters)}</section>
                        <section><h4>Locations</h4>${htmlList(profile.locations)}</section>
                        <section><h4>Tone / Sound</h4>${htmlList([...profile.toneNotes, ...profile.soundNotes])}</section>
                        <section><h4>Missing Anchors</h4>${htmlList(profile.missing, "None flagged")}</section>
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
      : "";
    const visualStyleBibleSection = visualStyleRules.length
      ? `
          <section class="packet-section">
            <div class="section-label">Visual Style Bible Snapshot</div>
            <h2>Rules that keep the film looking like one film.</h2>
            <p class="lede">Palette, light, camera, face, location, motif, and negative-prompt rules built from the project, scene packets, bibles, shot lists, and prompt cards.</p>
            <div class="style-export-grid">
              ${visualStyleRules
                .map(
                  (rule) => `
                    <article class="style-export-card">
                      <div class="character-export-head">
                        <span>${rule.readiness}% ready</span>
                        <h3>${htmlValue(rule.title)}</h3>
                      </div>
                      <p>${htmlValue(rule.status)}</p>
                      <p>${htmlValue(rule.body)}</p>
                      <div class="details-grid compact">
                        <section><h4>Anchors</h4>${htmlList(rule.anchors, "Not mapped yet")}</section>
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
          ${
            visualSceneProfiles.length
              ? `<section class="packet-section">
                  <div class="section-label">Scene Look Map</div>
                  <h2>Scene-by-scene visual assignments.</h2>
                  <p class="lede">The visual state, camera rule, lighting rule, motif, and drift risk for each mapped scene.</p>
                  <div class="character-export-grid">
                    ${visualSceneProfiles
                      .map(
                        (profile) => `
                          <article class="character-export-card">
                            <div class="character-export-head">
                              <span>${profile.readiness}% ready</span>
                              <h3>${htmlValue(profile.sceneLabel)}</h3>
                            </div>
                            <div class="details-grid compact">
                              <section><h4>Location / Time</h4>${htmlParagraphs(profile.locationTime)}</section>
                              <section><h4>Color / Tone</h4>${htmlParagraphs(profile.colorState)}</section>
                              <section><h4>Lighting</h4>${htmlParagraphs(profile.lightingRule)}</section>
                              <section><h4>Camera</h4>${htmlParagraphs(profile.cameraRule)}</section>
                              <section><h4>Motif</h4>${htmlParagraphs(profile.motif)}</section>
                              <section><h4>Drift Risk</h4>${htmlParagraphs(profile.negativeRisk)}</section>
                            </div>
                          </article>
                        `,
                      )
                      .join("")}
                  </div>
                </section>`
              : ""
          }
        `
      : "";
    const locationProfileSection = locationProfiles.length
      ? `
          <section class="packet-section">
            <div class="section-label">Location Continuity Cards</div>
            <h2>Location identity locks.</h2>
            <p class="lede">Layout, light, set dressing, sound, time-of-day, and prompt anchors for keeping recurring places consistent across generated shots.</p>
            <div class="character-export-grid">
              ${locationProfiles
                .map(
                  (profile) => `
                    <article class="character-export-card">
                      <div class="character-export-head">
                        <span>${profile.readiness}% ready</span>
                        <h3>${htmlValue(profile.name)}</h3>
                      </div>
                      <p>${profile.sceneLabels.length} scene use${profile.sceneLabels.length === 1 ? "" : "s"} / ${profile.productionAssets.length} production row${profile.productionAssets.length === 1 ? "" : "s"}</p>
                      <div class="details-grid compact">
                        <section><h4>Scenes</h4>${htmlList(profile.sceneLabels)}</section>
                        <section><h4>Time / Light</h4>${htmlList([...profile.timeOfDays, ...profile.colorNotes])}</section>
                        <section><h4>Set Dressing</h4>${htmlList(profile.setDressing)}</section>
                        <section><h4>Props</h4>${htmlList(profile.props)}</section>
                        <section><h4>Characters</h4>${htmlList(profile.characters)}</section>
                        <section><h4>Sound</h4>${htmlList(profile.soundNotes)}</section>
                        <section><h4>Layout / Blocking</h4>${htmlList(profile.blockingNotes)}</section>
                        <section><h4>Missing Anchors</h4>${htmlList(profile.missing, "None flagged")}</section>
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
      : "";
    const continuityMatrixSection = continuityRows.length
      ? `
          <section class="packet-section">
            <div class="section-label">Cross-Scene Continuity Matrix</div>
            <h2>Scene handoffs and continuity risks.</h2>
            <p class="lede">What must stay fixed across character identity, wardrobe, props, location layout, light, sound, and object state before generated shots are approved.</p>
            <div class="character-export-grid">
              ${continuityRows
                .map(
                  (row) => `
                    <article class="character-export-card">
                      <div class="character-export-head">
                        <span>${row.readiness}% mapped</span>
                        <h3>${htmlValue(row.sceneLabel)}</h3>
                      </div>
                      <p>Previous handoff: ${htmlValue(row.previousSceneLabel)}</p>
                      <div class="details-grid compact">
                        <section><h4>Location / Time</h4>${htmlParagraphs(`${row.location || "Not mapped"} / ${row.timeOfDay || "Not mapped"}`)}</section>
                        <section><h4>Characters</h4>${htmlList(row.characters)}</section>
                        <section><h4>Props</h4>${htmlList(row.props)}</section>
                        <section><h4>Wardrobe</h4>${htmlList(row.wardrobe)}</section>
                        <section><h4>Set Dressing</h4>${htmlList(row.setDressing)}</section>
                        <section><h4>Sound / Light</h4>${htmlParagraphs([row.soundState, row.colorState].filter(Boolean).join(" / "))}</section>
                        <section><h4>Blocking</h4>${htmlParagraphs(row.blocking)}</section>
                        <section><h4>Risks</h4>${htmlList(row.riskFlags, "No automatic risks flagged yet.")}</section>
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `
      : "";

    const documentSections = docSections
      .map(
        (section) => `
          <section class="packet-section">
            <div class="section-label">${htmlValue(section.label)}</div>
            <h2>${htmlValue(section.label)}</h2>
            <div class="document-body">${htmlParagraphs(section.value)}</div>
          </section>
        `,
      )
      .join("");
    const versionSections = versions.length
      ? `
          <section class="packet-section">
            <div class="section-label">Saved Passes</div>
            <h2>Version History</h2>
            ${versions
              .map(
                (version) => `
                  <article class="prompt-card">
                    <span>${htmlValue(version.stageLabel)}</span>
                    <h4>${htmlValue(version.label)}</h4>
                    <p class="purpose">Saved ${htmlValue(formatVersionDate(version.createdAt))}</p>
                    <div class="document-body">${htmlParagraphs(version.content)}</div>
                  </article>
                `,
              )
              .join("")}
          </section>
        `
      : "";
    const tocSection = `
      <section class="packet-section contents-page">
        <div class="section-label">Production Index</div>
        <h2>What is inside this packet.</h2>
        <p class="lede">A clean handoff document for story, continuity, shot planning, prompts, sound, and export-ready pre-production decisions.</p>
        <div class="toc-grid">
          ${tocItems
            .map(
              (item, index) => `
                <article>
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <strong>${htmlValue(item)}</strong>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
    const producerHandoffSection = `
      <section class="packet-section handoff-page">
        <div class="section-label">Producer Handoff</div>
        <h2>This is the working plan for the film.</h2>
        <p class="lede">A premium production packet should tell a creator what has been locked, what still needs attention, and what can move into image, animation, sound, edit, and festival-ready refinement.</p>
        <div class="handoff-hero">
          <div>
            <span class="readiness-number">${readiness.score}%</span>
            <strong>${htmlValue(readiness.next)}</strong>
          </div>
          <p>${htmlValue(project.logline, "No logline entered yet. Add the project spine before final export.")}</p>
        </div>
        <div class="coverage-grid">
          ${coverageItems
            .map(
              (item) => `
                <article>
                  <span>${htmlValue(item.label)}</span>
                  <strong>${htmlValue(item.value)}</strong>
                  <p>${htmlValue(item.detail)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
        <div class="gate-grid">
          ${exportGates
            .map(
              (gate) => `
                <article class="${gate.isReady ? "complete" : ""}">
                  <span>${gate.isReady ? "Ready" : "Needs Work"}</span>
                  <strong>${htmlValue(gate.label)}</strong>
                  <p>${htmlValue(gate.detail)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
        <div class="handoff-grid">
          <article>
            <span>Production Strength</span>
            <strong>${htmlValue(readiness.completedCount ? `${readiness.completedCount} production checks are complete.` : "The project shell is ready to be filled.")}</strong>
            <p>MiseForge has converted saved project data into bibles, packets, shot rows, prompts, and exportable production decisions.</p>
          </article>
          <article>
            <span>Open Risks</span>
            <strong>${openRiskList.length ? `${openRiskList.length} remaining risk${openRiskList.length === 1 ? "" : "s"}` : "No major automatic risks flagged."}</strong>
            ${htmlList(openRiskList, "No major automatic risks flagged.")}
          </article>
        </div>
      </section>
    `;
    const storyDiagnosticSection = `
      <section class="packet-section">
        <div class="section-label">Story Development Snapshot</div>
        <h2>${storySuiteScore}% story development ready.</h2>
        <p class="lede">A treatment only becomes useful when the premise, protagonist pressure, theme, character arc, act path, and cinematic promise are visible enough to guide production.</p>
        <div class="handoff-hero">
          <div>
            <span class="readiness-number">${storySuiteScore}%</span>
            <strong>${storyReadyCount} of ${storyDiagnostics.length} story locks started</strong>
          </div>
          <p>${htmlValue(project.logline, "No logline entered yet. Lock the one-sentence story promise before final export.")}</p>
        </div>
        <div class="gate-grid">
          ${storyDiagnostics
            .map(
              (item) => `
                <article class="${item.isReady ? "complete" : ""}">
                  <span>${item.isReady ? "Started" : "Next"}</span>
                  <strong>${htmlValue(item.label)}</strong>
                  <p>${htmlValue(item.isReady ? item.detail : item.next)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
    const readinessSection = `
      <section class="packet-section readiness-page">
        <div class="section-label">Production Readiness</div>
        <h2>${readiness.score}% ready for production planning.</h2>
        <p class="lede">Next best action: ${htmlValue(readiness.next)}.</p>
        <div class="readiness-hero">
          <div>
            <span class="readiness-number">${readiness.score}%</span>
            <strong>${readiness.completedCount} of ${readiness.total} production checks complete</strong>
          </div>
          <p>MiseForge measures whether the project has enough story, scene, continuity, shot, prompt, schedule, and sound information to become a reliable production packet.</p>
        </div>
        <div class="readiness-grid">
          ${readinessItems
            .map(
              (item) => `
                <article>
                  <span>${htmlValue(item.label)}</span>
                  <strong>${htmlValue(item.value)}</strong>
                </article>
              `,
            )
            .join("")}
        </div>
        <div class="checklist">
          ${readiness.checks
            .map(
              (check) => `
                <div class="${check.isComplete ? "complete" : ""}">
                  <span>${check.isComplete ? "Done" : "Next"}</span>
                  <p>${htmlValue(check.label)}</p>
                </div>
              `,
            )
            .join("")}
        </div>
      </section>
    `;

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlValue(project.title, "MiseForge Production Packet")}</title>
    <style>
      :root {
        --paper: #fbfaf7;
        --ink: #151515;
        --muted: #6d655f;
        --line: #ddd4cb;
        --accent: #9d4853;
        --accent-deep: #74343d;
        --accent-soft: #f5dde1;
        --deep: #1d1a1c;
        --soft: #f0e7de;
        --sage: #dfe7e2;
        --gold: #c6a45f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at 20% 0%, rgba(157, 72, 83, 0.16), transparent 32%),
          #e7e2dc;
        color: var(--ink);
        font-family: "Aptos", "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.55;
        letter-spacing: 0;
      }
      .print-bar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 18px;
        background: rgba(21, 21, 21, 0.94);
        color: white;
      }
      .print-bar button {
        border: 0;
        border-radius: 6px;
        padding: 10px 14px;
        background: white;
        color: #151515;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      .packet {
        width: min(980px, calc(100% - 32px));
        margin: 24px auto;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 34px 110px rgba(28, 23, 20, 0.24);
      }
      .cover,
      .packet-section {
        break-after: page;
        min-height: 980px;
        padding: 56px;
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(240, 231, 222, 0.68)),
          var(--paper);
      }
      .cover {
        display: grid;
        align-content: space-between;
        min-height: 1100px;
        color: white;
        background:
          radial-gradient(circle at 78% 18%, rgba(255, 255, 255, 0.2), transparent 19%),
          radial-gradient(circle at 12% 86%, rgba(157, 72, 83, 0.38), transparent 34%),
          linear-gradient(135deg, rgba(14, 14, 14, 0.98), rgba(50, 42, 42, 0.9)),
          linear-gradient(90deg, rgba(157, 72, 83, 0.46), transparent 44%, rgba(223, 231, 226, 0.18)),
          #171717;
      }
      .cover-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
      }
      .brand {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      .cover-mark {
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.84);
        font-weight: 900;
      }
      .cover-title-block {
        display: grid;
        gap: 16px;
      }
      .cover-kicker {
        margin: 0 0 14px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .packet-code {
        display: inline-flex;
        width: fit-content;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 999px;
        padding: 8px 11px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.78);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .cover h1 {
        max-width: 760px;
        margin: 0 0 18px;
        font-size: 72px;
        line-height: 0.96;
        letter-spacing: 0;
      }
      .cover .subtitle {
        max-width: 650px;
        color: rgba(255, 255, 255, 0.78);
        font-size: 20px;
      }
      .cover-footer {
        display: grid;
        gap: 18px;
      }
      .cover-footer-line {
        height: 1px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.48), transparent);
      }
      .cover-footer-meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 12px;
        color: rgba(255, 255, 255, 0.68);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .cover-grid,
      .meta-grid,
      .details-grid,
      .prompt-grid,
      .readiness-grid,
      .toc-grid,
      .roadmap-strip,
      .coverage-grid,
      .gate-grid,
      .handoff-grid {
        display: grid;
        gap: 12px;
      }
      .cover-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      .cover-grid div,
      .meta-grid div,
      .details-grid section,
      .prompt-grid section,
      .readiness-grid article,
      .toc-grid article,
      .roadmap-strip article {
        border: 1px solid rgba(21, 21, 21, 0.12);
        border-radius: 8px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.58);
      }
      .cover-grid div {
        border-color: rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.08);
      }
      b,
      .section-label,
      .section-kicker,
      .prompt-card span,
      .roadmap-strip span,
      .readiness-grid span,
      .toc-grid span {
        display: block;
        color: var(--accent);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      .cover-grid b {
        color: rgba(255, 255, 255, 0.68);
      }
      .cover-grid span {
        display: block;
        margin-top: 8px;
        color: white;
        font-weight: 760;
      }
      .packet-section h2 {
        margin: 10px 0 18px;
        font-size: 42px;
        line-height: 1;
        letter-spacing: 0;
      }
      .packet-section::before {
        content: "MiseForge";
        display: block;
        width: fit-content;
        margin-bottom: 22px;
        border: 1px solid rgba(157, 72, 83, 0.16);
        border-radius: 999px;
        padding: 5px 9px;
        color: var(--accent);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .packet-section h3,
      .packet-section h4 {
        margin: 0 0 8px;
        line-height: 1.18;
        letter-spacing: 0;
      }
      .lede {
        max-width: 760px;
        color: var(--muted);
        font-size: 18px;
      }
      .contents-page h2,
      .readiness-page h2,
      .handoff-page h2 {
        max-width: 720px;
      }
      .handoff-hero {
        display: grid;
        grid-template-columns: 0.76fr 1.24fr;
        gap: 18px;
        align-items: center;
        border: 1px solid rgba(157, 72, 83, 0.18);
        border-radius: 10px;
        padding: 24px;
        background:
          linear-gradient(135deg, rgba(29, 26, 28, 0.96), rgba(116, 52, 61, 0.88)),
          var(--deep);
        color: white;
      }
      .handoff-hero .readiness-number {
        color: white;
      }
      .handoff-hero strong,
      .handoff-hero p {
        color: rgba(255, 255, 255, 0.78);
      }
      .coverage-grid {
        grid-template-columns: repeat(4, 1fr);
        margin-top: 18px;
      }
      .coverage-grid article,
      .gate-grid article,
      .handoff-grid article {
        border: 1px solid rgba(21, 21, 21, 0.1);
        border-radius: 8px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.68);
      }
      .coverage-grid span,
      .gate-grid span,
      .handoff-grid span {
        display: block;
        color: var(--accent);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .coverage-grid strong {
        display: block;
        margin-top: 8px;
        color: var(--deep);
        font-size: 34px;
        line-height: 1;
      }
      .coverage-grid p,
      .gate-grid p,
      .handoff-grid p {
        margin: 7px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      .gate-grid {
        grid-template-columns: repeat(2, 1fr);
        margin-top: 18px;
      }
      .gate-grid article.complete {
        border-color: rgba(77, 115, 100, 0.22);
        background:
          linear-gradient(145deg, rgba(223, 231, 226, 0.7), rgba(255, 255, 255, 0.72)),
          white;
      }
      .gate-grid strong,
      .handoff-grid strong {
        display: block;
        margin-top: 7px;
        color: var(--deep);
        font-size: 18px;
        line-height: 1.14;
      }
      .handoff-grid {
        grid-template-columns: repeat(2, 1fr);
        margin-top: 18px;
      }
      .handoff-grid ul {
        margin: 8px 0 0;
        padding-left: 18px;
        color: var(--muted);
        font-size: 12px;
      }
      .toc-grid {
        grid-template-columns: repeat(2, 1fr);
        margin-top: 28px;
      }
      .toc-grid article {
        min-height: 74px;
        display: grid;
        align-content: space-between;
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(223, 231, 226, 0.44)),
          white;
      }
      .toc-grid strong,
      .readiness-grid strong,
      .roadmap-strip strong {
        display: block;
        margin-top: 8px;
        color: var(--deep);
        font-size: 18px;
        line-height: 1.14;
      }
      .readiness-hero {
        display: grid;
        grid-template-columns: 0.8fr 1.2fr;
        gap: 18px;
        align-items: center;
        border: 1px solid rgba(157, 72, 83, 0.16);
        border-radius: 8px;
        padding: 22px;
        background:
          linear-gradient(135deg, rgba(245, 221, 225, 0.74), rgba(255, 255, 255, 0.74)),
          white;
      }
      .readiness-number {
        display: block;
        color: var(--accent);
        font-size: 72px;
        font-weight: 900;
        line-height: 0.94;
      }
      .readiness-hero strong {
        display: block;
        margin-top: 10px;
        font-size: 18px;
        line-height: 1.2;
      }
      .readiness-hero p {
        margin: 0;
        color: var(--muted);
        font-size: 16px;
      }
      .readiness-grid {
        grid-template-columns: repeat(4, 1fr);
        margin-top: 18px;
      }
      .checklist {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-top: 22px;
      }
      .checklist div {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        border-top: 1px solid var(--line);
        padding-top: 8px;
      }
      .checklist span {
        border: 1px solid rgba(157, 72, 83, 0.18);
        border-radius: 999px;
        padding: 4px 6px;
        color: var(--accent);
        font-size: 9px;
        font-weight: 900;
        text-align: center;
        text-transform: uppercase;
      }
      .checklist .complete span {
        border-color: rgba(77, 115, 100, 0.24);
        color: #4d7364;
      }
      .checklist p {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.3;
      }
      .roadmap-strip {
        grid-template-columns: repeat(4, 1fr);
        margin: 24px 0;
      }
      .meta-grid {
        grid-template-columns: repeat(3, 1fr);
        margin: 24px 0;
      }
      .meta-grid span {
        display: block;
        margin-top: 6px;
        font-weight: 760;
      }
      .details-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .details-grid.compact {
        grid-template-columns: repeat(2, 1fr);
        margin-top: 14px;
      }
      .details-grid.compact section {
        padding: 12px;
      }
      .character-export-grid {
        display: grid;
        gap: 14px;
      }
      .style-export-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
      }
      .character-export-card {
        border: 1px solid rgba(21, 21, 21, 0.1);
        border-radius: 8px;
        padding: 18px;
        background:
          linear-gradient(145deg, rgba(255, 255, 255, 0.76), rgba(223, 231, 226, 0.44)),
          white;
        break-inside: avoid;
      }
      .style-export-card {
        border: 1px solid rgba(21, 21, 21, 0.1);
        border-radius: 8px;
        padding: 16px;
        background:
          linear-gradient(145deg, rgba(255, 250, 241, 0.76), rgba(223, 231, 226, 0.42)),
          white;
        break-inside: avoid;
      }
      .character-export-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
      }
      .character-export-head span {
        border: 1px solid rgba(157, 72, 83, 0.18);
        border-radius: 999px;
        padding: 5px 9px;
        color: var(--accent);
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .character-export-card > p {
        margin: 8px 0 0;
        color: var(--muted);
        font-weight: 760;
      }
      .scene-status {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: -8px 0 22px;
      }
      .scene-status span {
        border: 1px solid rgba(157, 72, 83, 0.18);
        border-radius: 999px;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.64);
        color: var(--accent);
        font-size: 11px;
        font-weight: 850;
        text-transform: uppercase;
      }
      .details-grid ul {
        margin: 0;
        padding-left: 18px;
      }
      .shot,
      .prompt-card {
        display: grid;
        gap: 14px;
        border: 1px solid rgba(21, 21, 21, 0.1);
        border-radius: 8px;
        padding: 16px;
        margin-top: 12px;
        background:
          linear-gradient(145deg, rgba(255, 255, 255, 0.72), rgba(240, 231, 222, 0.4)),
          white;
        break-inside: avoid;
      }
      .shot {
        grid-template-columns: 48px minmax(0, 1fr);
      }
      .shot-number {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 12px;
        font-weight: 900;
      }
      .purpose {
        color: var(--muted);
        font-weight: 760;
      }
      .shot-meta-export {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-top: 12px;
      }
      .shot-meta-export section {
        border: 1px solid rgba(21, 21, 21, 0.1);
        border-radius: 8px;
        padding: 10px;
        background: rgba(251, 250, 247, 0.74);
      }
      .prompt-grid {
        grid-template-columns: repeat(3, 1fr);
        margin-top: 12px;
      }
      .prompt-grid section {
        background: rgba(251, 250, 247, 0.72);
      }
      .prompt-grid p,
      .document-body p {
        margin: 8px 0 0;
      }
      .document-body {
        columns: 1;
      }
      .document-body p {
        max-width: 780px;
      }
      .empty {
        border: 1px dashed var(--line);
        border-radius: 8px;
        padding: 18px;
        color: var(--muted);
      }
      @page {
        size: Letter;
        margin: 0.35in;
      }
      @media print {
        body { background: white; }
        .print-bar { display: none; }
        .packet {
          width: 100%;
          margin: 0;
          border-radius: 0;
          overflow: visible;
          box-shadow: none;
        }
        .packet-section::before {
          margin-bottom: 14px;
        }
        .cover,
        .packet-section {
          min-height: 10.35in;
          padding: 0.55in;
        }
        .toc-grid,
        .details-grid,
        .checklist {
          grid-template-columns: repeat(2, 1fr);
        }
        .readiness-grid,
        .roadmap-strip {
          grid-template-columns: repeat(4, 1fr);
        }
      }
    </style>
  </head>
  <body>
    <div class="print-bar">
      <strong>MiseForge premium production packet</strong>
      <button onclick="window.print()">Save / Print PDF</button>
    </div>
    <main class="packet">
      <section class="cover">
        <div class="cover-top">
          <div class="brand">MiseForge Production Packet</div>
          <div class="cover-mark">MF</div>
        </div>
        <div class="cover-title-block">
          <span class="packet-code">Founder production packet / ${packetDate}</span>
          <div>
            <p class="cover-kicker">Pre-production command packet</p>
            <h1>${htmlValue(project.title, "Untitled Project")}</h1>
            <p class="subtitle">${htmlValue(project.logline, "A production-ready packet built for AI filmmaking workflow.")}</p>
          </div>
        </div>
        <div class="cover-footer">
          <div class="cover-grid">
            <div><b>Genre</b><span>${htmlValue(project.genre)}</span></div>
            <div><b>Tone</b><span>${htmlValue(project.tone)}</span></div>
            <div><b>Readiness</b><span>${readiness.score}%</span></div>
            <div><b>Scenes</b><span>${sceneBreakdowns.length}</span></div>
            <div><b>Shots</b><span>${shotCount}</span></div>
            <div><b>Prompt Cards</b><span>${promptCardCount}</span></div>
          </div>
          <div class="cover-footer-line"></div>
          <div class="cover-footer-meta">
            <span>MiseForge</span>
            <span>${packetDate}</span>
            <span>${readiness.score}% ready</span>
          </div>
        </div>
      </section>
      ${producerHandoffSection}
      ${tocSection}
      ${storyDiagnosticSection}
      ${readinessSection}
      <section class="packet-section">
        <div class="section-label">Project Overview</div>
        <h2>Production Roadmap</h2>
        <p class="lede">${htmlValue(project.logline, "No logline entered yet.")}</p>
        <div class="roadmap-strip">
          <article><span>Story</span><strong>${docSections.length} docs</strong></article>
          <article><span>Scenes</span><strong>${sceneBreakdowns.length} packets</strong></article>
          <article><span>Assets</span><strong>${productionAssets.length} rows</strong></article>
          <article><span>Next</span><strong>${htmlValue(readiness.next)}</strong></article>
        </div>
        <div class="details-grid">
          <section><h3>Inspirations</h3>${htmlList(project.inspirations)}</section>
          <section><h3>Workflow / Tools</h3>${htmlParagraphs(workflowTools, "Tool stack not specified.")}</section>
        </div>
      </section>
      ${visualStyleBibleSection}
      ${characterProfileSection}
      ${locationProfileSection}
      ${continuityMatrixSection}
      ${documentSections}
      ${versionSections}
      ${sceneSections || `<section class="packet-section"><h2>No scene packets yet</h2><p class="empty">Build a scene packet before exporting the premium PDF layout.</p></section>`}
    </main>
    <script>
      window.addEventListener("load", function () {
        window.setTimeout(function () {
          window.print();
        }, 500);
      });
    </script>
  </body>
</html>`;
  }

  async function copyProductionPacket() {
    const packet = buildProductionPacketMarkdown();

    try {
      await navigator.clipboard.writeText(packet);
      setSaveStatus("Production packet copied.");
      setSaveError("");
    } catch {
      setSaveError("Your browser blocked copy. Use Download Markdown or Premium PDF preview instead.");
    }
  }

  function downloadProductionPacket() {
    const packet = buildProductionPacketMarkdown();
    const blob = new Blob([packet], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${slugFileName(project.title)}-production-packet.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setSaveStatus("Markdown production packet downloaded.");
    setSaveError("");
  }

  function openPremiumPacketPreview() {
    if (!requirePro("Premium PDF packet export")) {
      return;
    }

    const html = buildPremiumPacketHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank");

    if (!opened) {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slugFileName(project.title)}-premium-packet.html`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setSaveStatus("Premium packet layout downloaded. Open it, then choose Print or Save as PDF.");
      setSaveError("");
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      return;
    }

    setSaveStatus("Premium PDF preview opened. Choose Save as PDF in the print window.");
    setSaveError("");
    window.setTimeout(() => URL.revokeObjectURL(url), 12000);
  }

  return (
    <section className="project-workspace">
      <div className="project-toolbar">
        <button className="button secondary" type="button" onClick={onBack}>
          All Projects
        </button>
        <span>Opened by {userEmail}</span>
        <strong className={entitlement.isPro ? "plan-badge active" : "plan-badge"}>
          {entitlement.planLabel}
        </strong>
      </div>

      <div className="project-hero">
        <p className="eyebrow">Project workspace</p>
        <h3>{project.title}</h3>
        <p>
          {project.logline ||
            "Start from whatever you already have, then use the production spine to build the missing pieces."}
        </p>
      </div>

      <div className="launch-readiness-strip" aria-label="Project status summary">
        {launchReadinessCards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>

      <ProUnlockPanel
        entitlement={entitlement}
        isManagingBilling={isOpeningBillingPortal}
        isUpgrading={isStartingCheckout}
        onManageBilling={onManageBilling}
        onUpgrade={onUpgrade}
      />

      <MiniPhilosopherGuide context={guideContext} />

      <section className="story-lab-board" aria-label="Story development tools">
        <div className="board-heading">
          <div>
            <span>Story development suite</span>
            <h4>Make the idea strong before the production machine starts.</h4>
            <p>
              Build the premise, theme, protagonist want versus need, central conflict, character
              arc, act path, and treatment before scenes move into production.
            </p>
          </div>
          <strong>{storySuiteScore}% story ready</strong>
        </div>
        <div className="story-diagnostic-grid">
          {storyDiagnostics.map((item) => (
            <article className={item.isReady ? "story-diagnostic-card ready" : "story-diagnostic-card"} key={item.label}>
              <span>{item.isReady ? "Started" : "Next"}</span>
              <strong>{item.label}</strong>
              <p>{item.isReady ? item.detail : item.next}</p>
            </article>
          ))}
        </div>
        <div className="story-lab-grid">
          <article className={hasText(drafts.idea) ? "story-lab-card active" : "story-lab-card"}>
            <span>Logline Lab</span>
            <strong>{project.logline ? "Current logline ready to test" : "Find the movie in one sentence"}</strong>
            <p>
              Clarify protagonist, want, need, obstacle, stakes, hook, and the strongest one-line
              pitch before scenes get built.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("idea")}>
                Open
              </button>
              <button className="button" type="button" onClick={buildLoglineLabTemplate}>
                Build Logline Lab
              </button>
            </div>
          </article>
          <article className={storyDiagnostics[1]?.isReady ? "story-lab-card active" : "story-lab-card"}>
            <span>Premise Engine</span>
            <strong>Lock the story pressure before writing pages</strong>
            <p>
              Build protagonist, want, need, central conflict, stakes, theme, and same-but-different
              promise into one usable development dossier.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("idea")}>
                Open
              </button>
              <button className="button" type="button" onClick={buildStoryEngineTemplate}>
                Build Story Engine
              </button>
            </div>
          </article>
          <article className={storyDiagnostics[3]?.isReady ? "story-lab-card active" : "story-lab-card"}>
            <span>Theme + Arc Map</span>
            <strong>Make characters change for a reason</strong>
            <p>
              Map opening state, false strategy, midpoint pressure, collapse, final choice,
              relationship pressure, and behavior rules.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("treatment")}>
                Open
              </button>
              <button
                className="button"
                type="button"
                onClick={buildCharacterArcMapTemplate}
                disabled={!entitlement.isPro}
              >
                {entitlement.isPro ? "Build Arc Map" : "Pro: Build Arc Map"}
              </button>
            </div>
          </article>
          <article className={hasText(drafts.treatment) ? "story-lab-card active" : "story-lab-card"}>
            <span>Treatment Blueprint</span>
            <strong>Turn the premise into a professional story map</strong>
            <p>
              Build theme, cinematic promise, same-but-different hook, character arc, act movement,
              set pieces, and development questions.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("treatment")}>
                Open
              </button>
              <button
                className="button"
                type="button"
                onClick={buildTreatmentBlueprintTemplate}
                disabled={!entitlement.isPro}
              >
                {entitlement.isPro ? "Build Treatment Blueprint" : "Pro: build treatment"}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="bible-board" aria-label="Character and location bibles">
        <div className="board-heading">
          <div>
            <span>Story bibles</span>
            <h4>Lock the people, places, and continuity before generating shots.</h4>
            <p>
              Character bibles, location bibles, and continuity tracking create the anchors that AI
              films need before shot lists, prompt cards, and animation passes.
            </p>
          </div>
          <strong>
            {(hasText(drafts.character_bible) ? 1 : 0) +
              (hasText(drafts.location_bible) ? 1 : 0) +
              (hasText(drafts.continuity_tracker) ? 1 : 0)}{" "}
            of 3 started
          </strong>
        </div>
        <div className="bible-grid">
          <article className={hasText(drafts.character_bible) ? "bible-card active" : "bible-card"}>
            <span>Character Bible</span>
            <strong>{characterBibleNames.length || "No"} character{characterBibleNames.length === 1 ? "" : "s"} detected</strong>
            <p>
              Track look, wardrobe, voice, props carried, relationships, and emotional continuity.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("characters")}>
                Open
              </button>
              <button
                className="button"
                type="button"
                onClick={buildCharacterBibleTemplate}
                disabled={!entitlement.isPro}
              >
                {entitlement.isPro ? "Build from scene packets" : "Pro: build bible"}
              </button>
            </div>
          </article>
          <article className={hasText(drafts.location_bible) ? "bible-card active" : "bible-card"}>
            <span>Location Bible</span>
            <strong>{locationBibleNames.length || "No"} location{locationBibleNames.length === 1 ? "" : "s"} detected</strong>
            <p>
              Track layout, light, color, dressing, sound texture, and cross-scene continuity risks.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("locations")}>
                Open
              </button>
              <button
                className="button"
                type="button"
                onClick={buildLocationBibleTemplate}
                disabled={!entitlement.isPro}
              >
                {entitlement.isPro ? "Build from scene packets" : "Pro: build bible"}
              </button>
            </div>
          </article>
          <article className={hasText(drafts.continuity_tracker) ? "bible-card active" : "bible-card"}>
            <span>Continuity Tracker</span>
            <strong>{sceneBreakdowns.length || "No"} scene{sceneBreakdowns.length === 1 ? "" : "s"} mapped</strong>
            <p>
              Track cross-scene character state, props, wardrobe, set dressing, locations, sound,
              lighting, and generation risks.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("continuity")}>
                Open
              </button>
              <button
                className="button"
                type="button"
                onClick={buildContinuityTrackerTemplate}
                disabled={!entitlement.isPro}
              >
                {entitlement.isPro ? "Build from scene packets" : "Pro: build tracker"}
              </button>
            </div>
          </article>
        </div>
        <div className="character-continuity-board" aria-label="Character continuity cards">
          <div className="tool-heading">
            <div>
              <h4>Character continuity cards</h4>
              <p>
                These cards turn detected characters into visual and production anchors for faces,
                wardrobe, props, relationships, locations, and prompt consistency.
              </p>
            </div>
            <span>{characterProfiles.length ? `${characterProfiles.length} detected` : "Needs scene packets"}</span>
          </div>
          {characterProfiles.length ? (
            <div className="character-card-grid">
              {characterProfiles.map((profile) => (
                <article className="character-profile-card" key={profile.name}>
                  <div className="character-profile-head">
                    <div>
                      <span>{profile.readiness}% continuity ready</span>
                      <strong>{profile.name}</strong>
                    </div>
                    <small>{profile.appearances.length} scene{profile.appearances.length === 1 ? "" : "s"}</small>
                  </div>
                  <p>
                    {profile.coCharacters.length
                      ? `Shares scenes with ${profile.coCharacters.join(", ")}.`
                      : "No relationship map detected yet."}
                  </p>
                  <div className="character-profile-meta">
                    <div>
                      <span>Wardrobe</span>
                      <strong>{profile.wardrobe.length ? profile.wardrobe.slice(0, 3).join(", ") : "Not mapped"}</strong>
                    </div>
                    <div>
                      <span>Props</span>
                      <strong>{profile.props.length ? profile.props.slice(0, 3).join(", ") : "Not mapped"}</strong>
                    </div>
                    <div>
                      <span>Locations</span>
                      <strong>{profile.locations.length ? profile.locations.slice(0, 3).join(", ") : "Not mapped"}</strong>
                    </div>
                    <div>
                      <span>Prompt rows</span>
                      <strong>{profile.productionAssets.length}</strong>
                    </div>
                  </div>
                  <div className="character-scene-strip">
                    {profile.sceneLabels.slice(0, 4).map((sceneLabel) => (
                      <span key={sceneLabel}>{sceneLabel}</span>
                    ))}
                    {profile.sceneLabels.length > 4 ? <span>+{profile.sceneLabels.length - 4} more</span> : null}
                  </div>
                  <div className="bible-actions">
                    <button className="button secondary" type="button" onClick={() => setActiveStepId("characters")}>
                      Open bible
                    </button>
                    <button
                      className="button"
                      type="button"
                      onClick={buildCharacterBibleTemplate}
                      disabled={!entitlement.isPro}
                    >
                      {entitlement.isPro ? "Refresh Bible" : "Pro: refresh bible"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="asset-empty">
              Save at least one scene packet with character names, then MiseForge will create
              character continuity cards here.
            </p>
          )}
        </div>
      </section>

      <section className="visual-board" aria-label="Visual look book">
        <div className="board-heading">
          <div>
            <span>Visual language</span>
            <h4>Make the film look like one film, not a pile of separate generations.</h4>
            <p>
              The Look Book defines palette, lighting, camera grammar, visual motifs, negative
              prompts, and tool-specific consistency rules before images or animation drift.
            </p>
          </div>
          <strong>{hasText(drafts.look_book) ? "Started" : "Not started"}</strong>
        </div>
        <div className="visual-grid">
          <article className={hasText(drafts.look_book) ? "visual-card active" : "visual-card"}>
            <span>Look Book</span>
            <strong>Film-wide visual rules</strong>
            <p>
              Build a reusable visual thesis, color system, lighting grammar, camera language,
              character anchors, location anchors, and negative prompt deck.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("lookbook")}>
                Open
              </button>
              <button
                className="button"
                type="button"
                onClick={buildLookBookTemplate}
                disabled={!entitlement.isPro}
              >
                {entitlement.isPro ? "Build Look Book" : "Pro: build look book"}
              </button>
            </div>
          </article>
          <article className="visual-card">
            <span>Palette Coverage</span>
            <strong>
              {sceneBreakdowns.filter((scene) => hasText(scene.color_palette) || hasText(scene.tone)).length} of{" "}
              {sceneBreakdowns.length || 0} scene{sceneBreakdowns.length === 1 ? "" : "s"}
            </strong>
            <p>
              Scene packets with color or tone notes feed the look map and help keep shots
              consistent across the production packet.
            </p>
          </article>
          <article className="visual-card">
            <span>Prompt Anchors</span>
            <strong>{productionAssets.filter((asset) => hasText(asset.image_prompt)).length} image prompt{productionAssets.filter((asset) => hasText(asset.image_prompt)).length === 1 ? "" : "s"}</strong>
            <p>
              Prompt cards should reuse the same palette, lighting, lens feel, continuity anchors,
              and negative prompt rules.
            </p>
          </article>
        </div>
      </section>

      <section className="readiness-panel" aria-label="Production readiness score">
        <div className="readiness-score">
          <span>Production readiness</span>
          <strong>{readiness.score}%</strong>
          <p>
            {readiness.completedCount} of {readiness.total} production checks complete.
          </p>
        </div>
        <div className="readiness-next">
          <span>Next best action</span>
          <strong>{readiness.next}</strong>
          <div className="readiness-checks">
            {readiness.checks.slice(0, 5).map((check) => (
              <small className={check.isComplete ? "complete" : ""} key={check.label}>
                <span>{check.isComplete ? "Done" : "Next"}</span>
                {check.label}
              </small>
            ))}
          </div>
        </div>
      </section>

      <section className="schedule-board" aria-label="Production schedule and generation order">
        <div className="board-heading">
          <div>
            <span>Generation order</span>
            <h4>Know what to lock, generate, review, and export next.</h4>
            <p>
              The Production Schedule turns the project into a practical sprint plan: story locks,
              scene priority, shot order, tool handoff, continuity checks, and export gates.
            </p>
          </div>
          <strong>
            {scheduleReadyCount} of {scheduleLockPhases.length} locks ready
          </strong>
        </div>
        <div className="schedule-lock-grid">
          {scheduleLockPhases.map((phase) => (
            <article className={phase.isReady ? "schedule-lock-card ready" : "schedule-lock-card"} key={phase.id}>
              <span>{phase.isReady ? "Ready" : "Lock gate"}</span>
              <strong>{phase.label}</strong>
              <p>{phase.detail}</p>
              <small>{phase.status}</small>
              <ul>
                {phase.items.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="generation-queue-list">
          <div className="queue-heading">
            <div>
              <span>Do first queue</span>
              <strong>Dependency-aware next work</strong>
            </div>
            <small>{generationQueue.length ? `${generationQueue.length} active items` : "No active blockers"}</small>
          </div>
          {generationQueue.length ? (
            generationQueue.map((item) => (
              <article className={`generation-queue-item priority-${item.priority.toLowerCase()}`} key={item.id}>
                <div>
                  <span>{item.kind}</span>
                  <strong>{item.label}</strong>
                  <p>{item.nextAction}</p>
                </div>
                <aside>
                  <small>{item.priority}</small>
                  <em>{item.status}</em>
                </aside>
              </article>
            ))
          ) : (
            <article className="generation-queue-item priority-low">
              <div>
                <span>Ready</span>
                <strong>Review export gates</strong>
                <p>All major blockers are clear. Build the schedule document, review it, then export the packet.</p>
              </div>
              <aside>
                <small>Low</small>
                <em>Ready for packet</em>
              </aside>
            </article>
          )}
        </div>
        <div className="schedule-grid">
          <article className={hasText(drafts.production_schedule) ? "schedule-card active" : "schedule-card"}>
            <span>Production Schedule</span>
            <strong>{hasText(drafts.production_schedule) ? "Schedule document saved" : readiness.next}</strong>
            <p>
              Build an ordered plan that shows which bibles, scene packets, shot lists, prompt
              cards, and exports should happen first.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("schedule")}>
                Open
              </button>
              <button
                className="button"
                type="button"
                onClick={buildProductionScheduleTemplate}
                disabled={!entitlement.isPro}
              >
                {entitlement.isPro ? "Build Schedule" : "Pro: build schedule"}
              </button>
            </div>
          </article>
          <article className="schedule-card">
            <span>Scene Queue</span>
            <strong>{sceneBreakdowns.length} scene{sceneBreakdowns.length === 1 ? "" : "s"} mapped</strong>
            <p>
              Scene packets become the schedule spine. Missing fields become blockers; complete
              fields move into shot-list and prompt-card work.
            </p>
          </article>
          <article className="schedule-card">
            <span>Asset Handoff</span>
            <strong>{productionAssets.length} asset{productionAssets.length === 1 ? "" : "s"} ready</strong>
            <p>
              Still images come first, animation and sound come after approved continuity, and the
              packet export comes after all gates are clear.
            </p>
          </article>
        </div>
      </section>

      <section className="sound-board" aria-label="Sound design map">
        <div className="board-heading">
          <div>
            <span>Sound design</span>
            <h4>Plan what the film hears before the edit exposes what is missing.</h4>
            <p>
              The Sound Design Map tracks room tone, foley, dialogue space, silence, animation
              handoff, and export checks so generated scenes feel physically present.
            </p>
          </div>
          <strong>
            {soundReadyCount} of {soundLayerCards.length} sound layers ready
          </strong>
        </div>
        <div className="sound-layer-grid">
          {soundLayerCards.map((layer) => (
            <article className={layer.isReady ? "sound-layer-card ready" : "sound-layer-card"} key={layer.id}>
              <span>{layer.isReady ? "Ready" : "Sound layer"}</span>
              <strong>{layer.label}</strong>
              <p>{layer.detail}</p>
              <small>{layer.status}</small>
              <ul>
                {layer.items.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="sound-queue-list">
          <div className="queue-heading">
            <div>
              <span>Do first sound queue</span>
              <strong>Fix the sounds that will break continuity first.</strong>
            </div>
            <small>{soundPriorityQueue.length ? `${soundPriorityQueue.length} active items` : "No sound blockers"}</small>
          </div>
          {soundPriorityQueue.length ? (
            soundPriorityQueue.map((item) => (
              <article className={`sound-queue-item priority-${item.priority.toLowerCase()}`} key={item.id}>
                <div>
                  <span>{item.type}</span>
                  <strong>{item.label}</strong>
                  <p>{item.nextAction}</p>
                </div>
                <aside>
                  <small>{item.priority}</small>
                  <em>{item.status}</em>
                </aside>
              </article>
            ))
          ) : (
            <article className="sound-queue-item priority-low">
              <div>
                <span>Ready</span>
                <strong>Review the final mix checklist</strong>
                <p>Sound blockers are clear. Build the Sound Design Map and include it in the production packet.</p>
              </div>
              <aside>
                <small>Low</small>
                <em>Ready for export</em>
              </aside>
            </article>
          )}
        </div>
        <div className="sound-scene-grid">
          {soundScenePlans.length ? (
            soundScenePlans.slice(0, 6).map((plan) => (
              <article className={`sound-scene-card priority-${plan.priority.toLowerCase()}`} key={plan.id}>
                <div>
                  <span>{plan.priority} priority</span>
                  <strong>{plan.label}</strong>
                </div>
                <small>{plan.readiness}% sound-ready</small>
                <p>{plan.roomTone}</p>
                <dl>
                  <div>
                    <dt>Foley</dt>
                    <dd>{plan.foleyRule}</dd>
                  </div>
                  <div>
                    <dt>Dialogue / silence</dt>
                    <dd>{plan.dialogueRule}</dd>
                  </div>
                  <div>
                    <dt>Animation handoff</dt>
                    <dd>{plan.animationHandoff}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <article className="sound-scene-card empty">
              <div>
                <span>No scenes yet</span>
                <strong>Build scene packets first.</strong>
              </div>
              <p>Sound mapping becomes useful once there is at least one scene with location, blocking, props, and tone.</p>
            </article>
          )}
        </div>
        <div className="sound-grid">
          <article className={hasText(drafts.sound_map) ? "sound-card active" : "sound-card"}>
            <span>Sound Design Map</span>
            <strong>{hasText(drafts.sound_map) ? "Sound map document saved" : "Room tone, foley, silence, dialogue, and handoff notes"}</strong>
            <p>
              Build scene-by-scene sound direction that supports animation, dialogue timing, and
              final edit decisions without defaulting to generic music.
            </p>
            <div className="bible-actions">
              <button className="button secondary" type="button" onClick={() => setActiveStepId("sound")}>
                Open
              </button>
              <button
                className="button"
                type="button"
                onClick={buildSoundMapTemplate}
                disabled={!entitlement.isPro}
              >
                {entitlement.isPro ? "Build Sound Map" : "Pro: build sound map"}
              </button>
            </div>
          </article>
          <article className="sound-card">
            <span>Scene Sound Coverage</span>
            <strong>{sceneBreakdowns.filter((scene) => hasText(scene.sound_notes)).length} of {sceneBreakdowns.length || 0} scene{sceneBreakdowns.length === 1 ? "" : "s"}</strong>
            <p>
              Scene packets with sound notes become the first layer of the map: location texture,
              close physical sounds, dialogue pressure, and silence.
            </p>
          </article>
          <article className="sound-card">
            <span>Prompt Sound Rows</span>
            <strong>{productionAssets.filter((asset) => hasText(asset.sound_prompt)).length} sound prompt{productionAssets.filter((asset) => hasText(asset.sound_prompt)).length === 1 ? "" : "s"}</strong>
            <p>
              Prompt-card sound rows tell animation and edit tools what must be heard, what should
              stay quiet, and what sync risks need checking.
            </p>
          </article>
        </div>
      </section>

      <div className="export-panel" aria-label="Production packet export">
        <div>
          <span>Production packet</span>
          <strong>
            {sceneBreakdowns.length} scene{sceneBreakdowns.length === 1 ? "" : "s"} / {productionAssets.length} asset
            {productionAssets.length === 1 ? "" : "s"}
          </strong>
        </div>
        <div className="export-actions">
          <button className="button secondary" type="button" onClick={copyProductionPacket}>
            Copy packet
          </button>
          <button className="button" type="button" onClick={downloadProductionPacket}>
            Download Markdown
          </button>
          <button className="button" type="button" onClick={openPremiumPacketPreview}>
            {entitlement.isPro ? "Premium PDF preview" : "Pro: Premium PDF preview"}
          </button>
        </div>
      </div>

      {entitlement.isPro ? (
      <section className="production-board" aria-label="Manual production board">
        <div className="board-heading">
          <div>
            <span>Manual production board</span>
            <h4>All production needs in one place.</h4>
            <p>
              Scan props, wardrobe, locations, sound, prompt cards, and shot-list coverage across
              the whole project.
            </p>
          </div>
          <strong>
            {productionBoard.reduce((total, category) => total + category.items.length, 0)} item
            {productionBoard.reduce((total, category) => total + category.items.length, 0) === 1 ? "" : "s"}
          </strong>
        </div>
        <div className="production-board-grid">
          {productionBoard.map((category) => (
            <article className="production-board-card" key={category.id}>
              <div className="production-board-card-top">
                <strong>{category.label}</strong>
                <span>{category.items.length}</span>
              </div>
              {category.items.length ? (
                <div className="production-board-list">
                  {category.items.slice(0, 8).map((item) => (
                    <div className="production-board-item" key={item.id}>
                      <div>
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </div>
                      <button type="button" onClick={() => openBoardScene(item.sceneId)}>
                        Edit source
                      </button>
                    </div>
                  ))}
                  {category.items.length > 8 ? (
                    <p className="production-board-more">
                      {category.items.length - 8} more included in the exported packet.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="asset-empty">Not filled yet.</p>
              )}
            </article>
          ))}
        </div>
      </section>
      ) : (
        <section className="production-board locked-board" aria-label="Locked production board">
          <div className="board-heading">
            <div>
              <span>Pro production board</span>
              <h4>Upgrade to see every production need across the film.</h4>
              <p>
                The free plan lets you save one scene-packet preview. Founder Pro turns the whole
                project into a board of props, wardrobe, locations, sound, shot lists, prompt cards,
                and continuity needs.
              </p>
            </div>
            <strong>Locked</strong>
          </div>
          <ul className="locked-feature-grid">
            {proFeatureList.slice(2).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="pipeline-strip" aria-label="MiseForge pipeline">
        {pipelineSteps.map((step, index) => {
          const isActive = step.id === activeStepId;
          const isComplete = completedStageIds.has(step.id);
          const stateLabel = isActive ? "Current room" : isComplete ? "Started" : "Ready";

          return (
            <button
              className={`pipeline-step${isActive ? " active" : ""}${isComplete ? " complete" : ""}`}
              key={step.id}
              type="button"
              onClick={() => {
                setActiveStepId(step.id);
                setSaveStatus("");
                setSaveError("");
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
              <em>{stateLabel}</em>
            </button>
          );
        })}
      </div>

      <div className="workspace-tools">
        <section>
          <div className="tool-heading">
            <h4>{activeStep.label} room</h4>
            <span>{activeStep.projectStage}</span>
          </div>
          {activeStepId === "idea" ? (
            <div className="story-tool-card">
              <div>
                <span>Story engine discipline</span>
                <strong>Make the pitch specific enough to generate the right scenes.</strong>
                <p>
                  Use the Logline Lab and Story Engine Dossier to define protagonist, want, need,
                  obstacle, stakes, theme, and hook before the project moves into treatment or script.
                </p>
              </div>
              <div className="dialogue-actions">
                <button className="button" type="button" onClick={buildLoglineLabTemplate}>
                  Build Logline Lab
                </button>
                <button className="button secondary" type="button" onClick={buildStoryEngineTemplate}>
                  Build Story Engine
                </button>
              </div>
            </div>
          ) : null}
          {activeStepId === "treatment" ? (
            <div className="story-tool-card">
              <div>
                <span>Treatment discipline</span>
                <strong>Turn the premise into a professional story blueprint.</strong>
                <p>
                  Build theme, act movement, character change, set pieces, character arc, and the
                  story questions that need answering before production planning.
                </p>
              </div>
              <div className="dialogue-actions">
                <button
                  className="button"
                  type="button"
                  onClick={buildTreatmentBlueprintTemplate}
                  disabled={!entitlement.isPro}
                >
                  {entitlement.isPro ? "Build Treatment Blueprint" : "Pro: Build Treatment Blueprint"}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={buildCharacterArcMapTemplate}
                  disabled={!entitlement.isPro}
                >
                  {entitlement.isPro ? "Build Arc Map" : "Pro: Build Arc Map"}
                </button>
              </div>
            </div>
          ) : null}
          {activeStepId === "characters" ? (
            <>
              <div className="bible-tool-card">
                <div>
                  <span>Character continuity</span>
                  <strong>Make every recurring person reusable across images, animation, and dialogue.</strong>
                  <p>
                    Use the scene packets to start a bible, then fill the visual anchor, wardrobe,
                    speech pattern, carried props, and continuity risks.
                  </p>
                </div>
                <button
                  className="button"
                  type="button"
                  onClick={buildCharacterBibleTemplate}
                  disabled={!entitlement.isPro}
                >
                  {entitlement.isPro ? "Build Character Bible" : "Pro: Build Character Bible"}
                </button>
              </div>
              <div className="character-bible-studio" aria-label="Character bible sheets">
                <div className="tool-heading">
                  <div>
                    <h4>Character sheets</h4>
                    <p>
                      Build one reusable profile per character so visual identity, wardrobe, props,
                      voice, relationships, and scene state stop drifting between generated shots.
                    </p>
                  </div>
                  <span>{characterProfiles.length ? `${characterProfiles.length} detected` : "Start manually"}</span>
                </div>
                {characterProfiles.length ? (
                  <div className="character-sheet-grid">
                    {characterProfiles.map((profile) => (
                      <article className="character-sheet-card" key={profile.name}>
                        <div className="character-profile-head">
                          <div>
                            <span>{profile.readiness}% ready</span>
                            <strong>{profile.name}</strong>
                          </div>
                          <small>{profile.appearances.length} scene{profile.appearances.length === 1 ? "" : "s"}</small>
                        </div>
                        <dl className="character-sheet-list">
                          <div>
                            <dt>Visual source</dt>
                            <dd>{profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}</dd>
                          </div>
                          <div>
                            <dt>Wardrobe</dt>
                            <dd>{profile.wardrobe.length ? profile.wardrobe.slice(0, 4).join(", ") : "Needs baseline"}</dd>
                          </div>
                          <div>
                            <dt>Props</dt>
                            <dd>{profile.props.length ? profile.props.slice(0, 4).join(", ") : "Needs carried objects"}</dd>
                          </div>
                          <div>
                            <dt>Relationships</dt>
                            <dd>{profile.coCharacters.length ? profile.coCharacters.join(", ") : "Needs relationship map"}</dd>
                          </div>
                        </dl>
                        <div className="missing-anchor-row">
                          <span>Missing</span>
                          <p>{profile.missing.length ? profile.missing.join(", ") : "No major anchors flagged."}</p>
                        </div>
                        <div className="bible-actions">
                          <button
                            className="button"
                            type="button"
                            onClick={() => buildCharacterProfileSheet(profile)}
                            disabled={!entitlement.isPro}
                          >
                            {entitlement.isPro ? "Build profile sheet" : "Pro: profile sheet"}
                          </button>
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => void copyCharacterPromptAnchor(profile)}
                            disabled={!entitlement.isPro}
                          >
                            {entitlement.isPro ? "Copy consistency prompt" : "Pro: consistency prompt"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="character-empty-studio">
                    <strong>No characters have been detected yet.</strong>
                    <p>
                      Save a scene packet with character names, or start a manual Primary Character
                      profile and fill the identity locks yourself.
                    </p>
                    <button
                      className="button"
                      type="button"
                      onClick={buildCharacterBibleTemplate}
                      disabled={!entitlement.isPro}
                    >
                      {entitlement.isPro ? "Start Primary Character Bible" : "Pro: start character bible"}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : null}
          {activeStepId === "locations" ? (
            <>
              <div className="bible-tool-card">
                <div>
                  <span>Location continuity</span>
                  <strong>Make every recurring place feel like the same real space.</strong>
                  <p>
                    Use scene packets to start a location bible, then fill layout, light, color,
                    dressing, ambient sound, and what must stay consistent.
                  </p>
                </div>
                <button
                  className="button"
                  type="button"
                  onClick={buildLocationBibleTemplate}
                  disabled={!entitlement.isPro}
                >
                  {entitlement.isPro ? "Build Location Bible" : "Pro: Build Location Bible"}
                </button>
              </div>
              <div className="location-bible-studio" aria-label="Location bible sheets">
                <div className="tool-heading">
                  <div>
                    <h4>Location sheets</h4>
                    <p>
                      Build one reusable profile per recurring place so layout, light, dressing,
                      props, room tone, and time-of-day rules stay coherent across scenes.
                    </p>
                  </div>
                  <span>{locationProfiles.length ? `${locationProfiles.length} detected` : "Start manually"}</span>
                </div>
                {locationProfiles.length ? (
                  <div className="location-sheet-grid">
                    {locationProfiles.map((profile) => (
                      <article className="location-sheet-card" key={profile.name}>
                        <div className="character-profile-head">
                          <div>
                            <span>{profile.readiness}% ready</span>
                            <strong>{profile.name}</strong>
                          </div>
                          <small>{profile.scenes.length} scene{profile.scenes.length === 1 ? "" : "s"}</small>
                        </div>
                        <dl className="character-sheet-list">
                          <div>
                            <dt>Scene usage</dt>
                            <dd>{profile.sceneLabels.length ? profile.sceneLabels.join(", ") : "Not mapped yet"}</dd>
                          </div>
                          <div>
                            <dt>Time / light</dt>
                            <dd>{profile.timeOfDays.length ? profile.timeOfDays.join(", ") : "Needs time rules"}</dd>
                          </div>
                          <div>
                            <dt>Set dressing</dt>
                            <dd>{profile.setDressing.length ? profile.setDressing.slice(0, 5).join(", ") : "Needs fixed details"}</dd>
                          </div>
                          <div>
                            <dt>Sound</dt>
                            <dd>{profile.soundNotes.length ? profile.soundNotes.slice(0, 2).join("; ") : "Needs room tone"}</dd>
                          </div>
                        </dl>
                        <div className="missing-anchor-row">
                          <span>Missing</span>
                          <p>{profile.missing.length ? profile.missing.join(", ") : "No major anchors flagged."}</p>
                        </div>
                        <div className="bible-actions">
                          <button
                            className="button"
                            type="button"
                            onClick={() => buildLocationProfileSheet(profile)}
                            disabled={!entitlement.isPro}
                          >
                            {entitlement.isPro ? "Build profile sheet" : "Pro: profile sheet"}
                          </button>
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => void copyLocationPromptAnchor(profile)}
                            disabled={!entitlement.isPro}
                          >
                            {entitlement.isPro ? "Copy location prompt" : "Pro: location prompt"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="location-empty-studio">
                    <strong>No locations have been detected yet.</strong>
                    <p>
                      Save a scene packet with a location, or start a manual Primary Location profile
                      and fill the layout, light, dressing, and sound locks yourself.
                    </p>
                    <button
                      className="button"
                      type="button"
                      onClick={buildLocationBibleTemplate}
                      disabled={!entitlement.isPro}
                    >
                      {entitlement.isPro ? "Start Primary Location Bible" : "Pro: start location bible"}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : null}
          {activeStepId === "lookbook" ? (
            <>
              <div className="bible-tool-card">
                <div>
                  <span>Visual consistency</span>
                  <strong>Build the look rules that every image, animation, and prompt should obey.</strong>
                  <p>
                    Use project references, scene packets, character bibles, location bibles, shot
                    lists, and continuity to define palette, lighting, camera grammar, motifs, and
                    negative prompt rules.
                  </p>
                </div>
                <div className="dialogue-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={buildLookBookTemplate}
                    disabled={!entitlement.isPro}
                  >
                    {entitlement.isPro ? "Build Style Bible" : "Pro: Build Style Bible"}
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void copyStyleBiblePromptAnchor()}
                    disabled={!entitlement.isPro}
                  >
                    {entitlement.isPro ? "Copy style prompt" : "Pro: style prompt"}
                  </button>
                </div>
              </div>
              <div className="style-bible-studio">
                <div className="tool-heading">
                  <div>
                    <h4>Style Bible command board</h4>
                    <p>
                      Film-wide rules for palette, lighting, camera grammar, faces, locations,
                      motifs, negative prompts, and tool-specific adapters.
                    </p>
                  </div>
                  <span>{visualSceneProfiles.length ? `${visualSceneProfiles.length} scene look${visualSceneProfiles.length === 1 ? "" : "s"}` : "Needs scene packets"}</span>
                </div>
                <div className="style-rule-grid">
                  {visualStyleRules.map((rule) => (
                    <article className="style-rule-card" key={rule.id}>
                      <div>
                        <span>{rule.status}</span>
                        <strong>{rule.title}</strong>
                      </div>
                      <small>{rule.readiness}% ready</small>
                      <p>{rule.body}</p>
                      <ul>
                        {(rule.anchors.length ? rule.anchors : ["Not mapped yet"]).slice(0, 4).map((anchor) => (
                          <li key={anchor}>{anchor}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
                <div className="tool-heading compact">
                  <div>
                    <h4>Scene look map</h4>
                    <p>Each scene gets a specific look assignment so the film does not visually drift.</p>
                  </div>
                  <span>{visualSceneProfiles.length ? `${visualSceneProfiles.length} mapped` : "No scenes yet"}</span>
                </div>
                {visualSceneProfiles.length ? (
                  <div className="scene-look-grid">
                    {visualSceneProfiles.slice(0, 8).map((profile) => (
                      <article className="scene-look-card" key={profile.id}>
                        <div className="scene-look-head">
                          <div>
                            <span>{profile.readiness}% look-ready</span>
                            <strong>{profile.sceneLabel}</strong>
                          </div>
                          <button className="button secondary" type="button" onClick={() => openBoardScene(profile.id)}>
                            Edit source scene
                          </button>
                        </div>
                        <dl>
                          <div>
                            <dt>Location / time</dt>
                            <dd>{profile.locationTime}</dd>
                          </div>
                          <div>
                            <dt>Color / tone</dt>
                            <dd>{profile.colorState}</dd>
                          </div>
                          <div>
                            <dt>Lighting</dt>
                            <dd>{profile.lightingRule}</dd>
                          </div>
                          <div>
                            <dt>Camera</dt>
                            <dd>{profile.cameraRule}</dd>
                          </div>
                          <div>
                            <dt>Motif</dt>
                            <dd>{profile.motif}</dd>
                          </div>
                          <div>
                            <dt>Drift risk</dt>
                            <dd>{profile.negativeRisk}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="style-empty-state">
                    <strong>No scene look map yet.</strong>
                    <p>
                      Save a scene packet first, then the Style Bible can map each scene’s color,
                      lighting, camera, motif, and drift risks.
                    </p>
                    <button className="button" type="button" onClick={() => setActiveStepId("breakdown")}>
                      Open Scene Breakdown
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : null}
          {activeStepId === "continuity" ? (
            <>
              <div className="bible-tool-card">
                <div>
                  <span>Cross-scene continuity</span>
                  <strong>Track the things that break AI films between shots.</strong>
                  <p>
                    Build a tracker from scene packets, then fill character state, prop ownership,
                    wardrobe changes, location state, lighting, sound, and generation risks.
                  </p>
                </div>
                <div className="dialogue-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={buildContinuityTrackerTemplate}
                    disabled={!entitlement.isPro}
                  >
                    {entitlement.isPro ? "Build Continuity Tracker" : "Pro: Build Continuity Tracker"}
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void copyContinuityPromptAnchor()}
                    disabled={!entitlement.isPro}
                  >
                    {entitlement.isPro ? "Copy continuity prompt" : "Pro: continuity prompt"}
                  </button>
                </div>
              </div>
              <div className="continuity-studio">
                <div className="tool-heading">
                  <div>
                    <h4>Continuity matrix</h4>
                    <p>
                      Scene handoffs, missing anchors, recurring objects, wardrobe, set dressing,
                      and location states that need to stay consistent before images and animation.
                    </p>
                  </div>
                  <span>{continuityRows.length ? `${continuityRows.length} scene handoff${continuityRows.length === 1 ? "" : "s"}` : "Needs scene packets"}</span>
                </div>
                <div className="continuity-stat-grid">
                  <article className="continuity-stat-card">
                    <span>Scene handoffs</span>
                    <strong>{continuityRows.length}</strong>
                  </article>
                  <article className="continuity-stat-card">
                    <span>Characters</span>
                    <strong>{characterProfiles.length}</strong>
                  </article>
                  <article className="continuity-stat-card">
                    <span>Locations</span>
                    <strong>{locationProfiles.length}</strong>
                  </article>
                  <article className="continuity-stat-card">
                    <span>Tracked items</span>
                    <strong>{continuityItemProfiles.length}</strong>
                  </article>
                </div>
                {continuityRows.length ? (
                  <div className="continuity-row-list">
                    {continuityRows.slice(0, 8).map((row) => (
                      <article className="continuity-row-card" key={row.id}>
                        <div className="continuity-row-head">
                          <div>
                            <span>{row.readiness}% mapped</span>
                            <strong>{row.sceneLabel}</strong>
                          </div>
                          <button className="button secondary" type="button" onClick={() => openBoardScene(row.id)}>
                            Edit source scene
                          </button>
                        </div>
                        <div className="continuity-row-meta">
                          <div>
                            <span>Previous</span>
                            <strong>{row.previousSceneLabel}</strong>
                          </div>
                          <div>
                            <span>Location / time</span>
                            <strong>
                              {row.location || "Not mapped"} / {row.timeOfDay || "Not mapped"}
                            </strong>
                          </div>
                          <div>
                            <span>Characters</span>
                            <strong>{row.characters.length ? row.characters.slice(0, 4).join(", ") : "Not mapped"}</strong>
                          </div>
                          <div>
                            <span>Props</span>
                            <strong>{row.props.length ? row.props.slice(0, 4).join(", ") : "Not mapped"}</strong>
                          </div>
                          <div>
                            <span>Wardrobe</span>
                            <strong>{row.wardrobe.length ? row.wardrobe.slice(0, 4).join(", ") : "Not mapped"}</strong>
                          </div>
                          <div>
                            <span>Sound / light</span>
                            <strong>{row.soundState || row.colorState || "Not mapped"}</strong>
                          </div>
                        </div>
                        <div className="continuity-risk-list">
                          {(row.riskFlags.length ? row.riskFlags : ["No automatic risks flagged yet."]).map((risk) => (
                            <span key={risk}>{risk}</span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="continuity-empty-state">
                    <strong>No scene handoffs yet.</strong>
                    <p>
                      Save a scene packet first. MiseForge will use those scene packets to map
                      cross-scene character, prop, wardrobe, location, sound, and lighting risks.
                    </p>
                    <button className="button" type="button" onClick={() => setActiveStepId("breakdown")}>
                      Open Scene Breakdown
                    </button>
                  </div>
                )}
                <div className="tool-heading compact">
                  <div>
                    <h4>Props, wardrobe, and set dressing</h4>
                    <p>Recurring physical details that can break visual consistency if they drift between scenes.</p>
                  </div>
                  <span>{continuityItemProfiles.length ? `${continuityItemProfiles.length} tracked` : "No items yet"}</span>
                </div>
                {continuityItemProfiles.length ? (
                  <div className="continuity-item-grid">
                    {continuityItemProfiles.slice(0, 12).map((item) => (
                      <article className="continuity-item-card" key={item.id}>
                        <span>{item.type}</span>
                        <strong>{item.label}</strong>
                        <p>{item.risk}</p>
                        <div>
                          <small>Scenes</small>
                          <p>{item.sceneLabels.slice(0, 4).join(", ")}</p>
                        </div>
                        <div>
                          <small>Locations</small>
                          <p>{item.locations.length ? item.locations.join(", ") : "Not mapped"}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
          {activeStepId === "schedule" ? (
            <div className="bible-tool-card">
              <div>
                <span>Production order</span>
                <strong>Turn the film into lock gates, a do-first queue, and a practical generation sequence.</strong>
                <p>
                  Build the schedule after story, bible, look, continuity, and scene-packet work
                  have started. It will show what to lock first, what should happen next, and what should wait.
                </p>
              </div>
              <div className="dialogue-actions">
                <button
                  className="button"
                  type="button"
                  onClick={buildProductionScheduleTemplate}
                  disabled={!entitlement.isPro}
                >
                  {entitlement.isPro ? "Build Production Schedule" : "Pro: Build Production Schedule"}
                </button>
                <button className="button secondary" type="button" onClick={() => copyExpertPrompt("schedule")}>
                  Copy schedule prompt
                </button>
              </div>
            </div>
          ) : null}
          {activeStepId === "sound" ? (
            <div className="bible-tool-card">
              <div>
                <span>Sound discipline</span>
                <strong>Map sound layers, scene blockers, dialogue space, and mix continuity before final export.</strong>
                <p>
                  Build the sound plan from scene packets, prompt cards, locations, props, and
                  workflow tools so animation, sound design, and edit passes know what must be heard and what must stay quiet.
                </p>
              </div>
              <div className="dialogue-actions">
                <button
                  className="button"
                  type="button"
                  onClick={buildSoundMapTemplate}
                  disabled={!entitlement.isPro}
                >
                  {entitlement.isPro ? "Build Sound Map" : "Pro: Build Sound Map"}
                </button>
                <button className="button secondary" type="button" onClick={() => copyExpertPrompt("sound")}>
                  Copy sound map prompt
                </button>
              </div>
            </div>
          ) : null}
          {activeStepId === "script" || activeStepId === "dialogue" ? (
            <div className="dialogue-tool-card">
              <div>
                <span>Dialogue discipline</span>
                <strong>Find the lines that sound too robotic, expositional, or unplayable.</strong>
                <p>
                  Highlight a section or scan the script draft. MiseForge creates scorecards,
                  line notes, character voice risks, rewrite moves, and an expert prompt you can use anywhere.
                </p>
              </div>
              <div className="dialogue-actions">
                <button className="button" type="button" onClick={runDialogueScanner}>
                  Run AI Voice Scanner 2.0
                </button>
                <button className="button secondary" type="button" onClick={copyDialogueScannerPrompt}>
                  Copy scanner prompt
                </button>
              </div>
            </div>
          ) : null}
          {activeStepId === "dialogue" && dialogueScan ? (
            <DialogueScanPanel
              scan={dialogueScan}
              onCopyPrompt={copyDialogueScannerPrompt}
              onRunAgain={runDialogueScanner}
            />
          ) : null}
          <div className="stage-focus-card">
            <div>
              <span>{activeStep.label} room</span>
              <strong>{currentDraft.trim() ? "Draft in progress" : "Ready for source material"}</strong>
              <p>{stageGuideNotes[activeStep.id].teaching}</p>
            </div>
            <small>
              {currentDraft.trim() ? `${currentDraft.trim().split(/\s+/).length} words` : "No draft yet"}
            </small>
          </div>
          <textarea
            ref={textareaRef}
            className="script-pad"
            value={currentDraft}
            onChange={(event) => updateDraft(event.target.value)}
            placeholder={activeStep.placeholder}
          />
          <input
            ref={fileInputRef}
            className="hidden-file"
            type="file"
            accept=".txt,.fountain,.md,.text"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void importTextFile(file);
              }

              event.currentTarget.value = "";
            }}
          />
          <div className="actions">
            <button className="button" type="button" onClick={saveStageDraft} disabled={isSavingStage}>
              {isSavingStage ? "Saving..." : "Save Stage Draft"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => copyExpertPrompt("improve")}
            >
              Copy improve prompt
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => copyExpertPrompt("dialogue")}
            >
              Copy dialogue prompt
            </button>
            <button className="button secondary" type="button" onClick={runDialogueScanner}>
              Run AI Voice Scanner 2.0
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => copyExpertPrompt("structure")}
            >
              Copy structure prompt
            </button>
            <button className="button secondary" type="button" onClick={() => fileInputRef.current?.click()}>
              Import Script
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={saveScenePacket}
              disabled={isSavingPacket}
            >
              {isSavingPacket ? "Saving packet..." : "Save Scene Packet"}
            </button>
          </div>
          <div className={entitlement.isPro ? "version-panel" : "version-panel locked-version"} aria-label="Local version history">
            <div className="version-heading">
              <div>
                <span>Local version history</span>
                <strong>
                  {entitlement.isPro ? "Save passes before you rewrite." : "Version history is a Pro workflow."}
                </strong>
              </div>
              <small>{versions.length} saved</small>
            </div>
            {entitlement.isPro ? (
              <>
                <div className="version-save-row">
                  <input
                    value={versionLabel}
                    onChange={(event) => setVersionLabel(event.target.value)}
                    placeholder={`${activeStep.label} pass label`}
                  />
                  <button className="button secondary" type="button" onClick={saveLocalVersion}>
                    Save version
                  </button>
                </div>
                {versions.length ? (
                  <div className="version-list">
                    {versions.slice(0, 6).map((version) => (
                      <article className="version-item" key={version.id}>
                        <div>
                          <strong>{version.label}</strong>
                          <small>
                            {version.stageLabel} / {formatVersionDate(version.createdAt)}
                          </small>
                        </div>
                        <div className="version-actions">
                          <button type="button" onClick={() => restoreLocalVersion(version)}>
                            Restore
                          </button>
                          <button type="button" onClick={() => deleteLocalVersion(version.id)}>
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="asset-empty">No saved passes yet.</p>
                )}
              </>
            ) : (
              <p className="asset-empty">
                Founder Pro keeps rewrite passes available inside the project and includes them in
                the premium packet.
              </p>
            )}
          </div>
          {saveStatus ? <p className="status success">{saveStatus}</p> : null}
          {saveError ? <p className="status error">{saveError}</p> : null}
        </section>

        <aside className="next-actions">
          <h4>Next production moves</h4>
          <label className="workflow-field">
            Workflow tools
            <textarea
              value={workflowTools}
              onChange={(event) => setWorkflowTools(event.target.value)}
              placeholder="Image: Midjourney. Animation: Runway. Sound: ElevenLabs. Edit: Premiere."
            />
          </label>
          <div className="ai-off-note">
            <strong>Production guidance</strong>
            <p>
              Use these tools to shape treatments, strengthen scenes, build breakdowns, and keep
              every production decision connected to the film you are making.
            </p>
          </div>
          <button type="button" onClick={() => copyExpertPrompt("treatment")}>
            Copy treatment prompt
          </button>
          <button type="button" onClick={() => copyExpertPrompt("script")}>
            Copy script prompt
          </button>
          <button type="button" onClick={runDialogueScanner}>
            Run AI voice scan 2.0
          </button>
          <button type="button" onClick={() => copyExpertPrompt("breakdown")}>
            Copy breakdown prompt
          </button>
          <button type="button" onClick={() => copyExpertPrompt("lookbook")}>
            Copy look book prompt
          </button>
          <button type="button" onClick={() => copyExpertPrompt("schedule")}>
            Copy schedule prompt
          </button>
          <button type="button" onClick={() => copyExpertPrompt("sound")}>
            Copy sound map prompt
          </button>
          <button type="button" onClick={saveScenePacket} disabled={isSavingPacket}>
            {isSavingPacket ? "Saving scene packet..." : "Parse + save scene packet"}
          </button>
          <button type="button" onClick={() => copyExpertPrompt("production")}>
            Copy production prompt plan
          </button>
          <button type="button" onClick={() => copyExpertPrompt("insert_shot")}>
            Copy insert-shot prompt
          </button>
          <p>
            MiseForge keeps the next move clear: develop the idea, strengthen the writing, map the
            production needs, and export a packet you can actually work from.
          </p>
        </aside>
      </div>

      {sceneBreakdowns.length ? (
        <section className="scene-packet-board" aria-label="Saved scene packets">
          <div className="tool-heading">
            <div>
              <h4>Saved scene packets</h4>
              <p>{sceneBreakdowns.length} structured scene breakdown row(s) saved in Supabase.</p>
            </div>
            <span>Production-ready</span>
          </div>

          <div className="scene-packet-grid">
            {sceneBreakdowns.map((scene) => {
              const isEditing = editingSceneId === scene.id;
              const draft = sceneDrafts[scene.id] ?? sceneToDraft(scene);
              const sceneAssets = entitlement.isPro ? assetsBySceneId[scene.id] ?? [] : [];
              const shotAssets = sceneAssets.filter((asset) => asset.asset_type === "shot");
              const promptAssets = sceneAssets.filter((asset) => asset.asset_type !== "shot");

              return (
                <article className="scene-packet-card" id={`scene-${scene.id}`} key={scene.id}>
                  <div className="packet-card-top">
                    <div>
                      <span>{String(scene.scene_number).padStart(2, "0")}</span>
                      <strong>{scene.scene_heading || "Unlabeled scene"}</strong>
                    </div>
                    {isEditing ? (
                      <div className="packet-card-actions">
                        <button
                          className="button"
                          type="button"
                          onClick={() => saveSceneEdit(scene)}
                          disabled={savingSceneId === scene.id}
                        >
                          {savingSceneId === scene.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => cancelSceneEdit(scene.id)}
                          disabled={savingSceneId === scene.id}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="button secondary" type="button" onClick={() => startEditingScene(scene)}>
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="packet-edit-grid">
                      <label>
                        Scene heading
                        <input
                          value={draft.scene_heading}
                          onChange={(event) => updateSceneDraft(scene.id, "scene_heading", event.target.value)}
                        />
                      </label>
                      <div className="field-pair">
                        <label>
                          Location
                          <input
                            value={draft.location}
                            onChange={(event) => updateSceneDraft(scene.id, "location", event.target.value)}
                          />
                        </label>
                        <label>
                          Time
                          <input
                            value={draft.time_of_day}
                            onChange={(event) => updateSceneDraft(scene.id, "time_of_day", event.target.value)}
                          />
                        </label>
                      </div>
                      <label>
                        Summary
                        <textarea
                          value={draft.summary}
                          onChange={(event) => updateSceneDraft(scene.id, "summary", event.target.value)}
                        />
                      </label>
                      <label>
                        Characters
                        <input
                          value={draft.characters}
                          onChange={(event) => updateSceneDraft(scene.id, "characters", event.target.value)}
                          placeholder="Mara, Jonah"
                        />
                      </label>
                      <label>
                        Props
                        <input
                          value={draft.props}
                          onChange={(event) => updateSceneDraft(scene.id, "props", event.target.value)}
                          placeholder="Key, door, folder"
                        />
                      </label>
                      <label>
                        Wardrobe
                        <input
                          value={draft.wardrobe}
                          onChange={(event) => updateSceneDraft(scene.id, "wardrobe", event.target.value)}
                          placeholder="Rain coat, work shirt"
                        />
                      </label>
                      <label>
                        Set dressing
                        <input
                          value={draft.set_dressing}
                          onChange={(event) => updateSceneDraft(scene.id, "set_dressing", event.target.value)}
                          placeholder="Kitchen, table, practical lamp"
                        />
                      </label>
                      <label>
                        Sound
                        <textarea
                          value={draft.sound_notes}
                          onChange={(event) => updateSceneDraft(scene.id, "sound_notes", event.target.value)}
                        />
                      </label>
                      <label>
                        Blocking
                        <textarea
                          value={draft.blocking}
                          onChange={(event) => updateSceneDraft(scene.id, "blocking", event.target.value)}
                        />
                      </label>
                      <div className="field-pair">
                        <label>
                          Color/feel
                          <input
                            value={draft.color_palette}
                            onChange={(event) => updateSceneDraft(scene.id, "color_palette", event.target.value)}
                          />
                        </label>
                        <label>
                          Tone
                          <input
                            value={draft.tone}
                            onChange={(event) => updateSceneDraft(scene.id, "tone", event.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>{scene.summary || "Add the scene purpose and emotional turn."}</p>
                      <div className="packet-meta">
                        <span>{scene.location || "No location"}</span>
                        <span>{scene.time_of_day || "No time"}</span>
                        <span>{scene.tone || "Needs tone"}</span>
                      </div>
                      <dl className="packet-list">
                        <div>
                          <dt>Characters</dt>
                          <dd>{listText(scene.characters, "Not filled yet")}</dd>
                        </div>
                        <div>
                          <dt>Props</dt>
                          <dd>{listText(scene.props, "Not filled yet")}</dd>
                        </div>
                        <div>
                          <dt>Wardrobe</dt>
                          <dd>{listText(scene.wardrobe, "Not filled yet")}</dd>
                        </div>
                        <div>
                          <dt>Set</dt>
                          <dd>{listText(scene.set_dressing, "Not filled yet")}</dd>
                        </div>
                        <div>
                          <dt>Sound</dt>
                          <dd>{scene.sound_notes || "Not filled yet"}</dd>
                        </div>
                        <div>
                          <dt>Blocking</dt>
                          <dd>{scene.blocking || "Not filled yet"}</dd>
                        </div>
                      </dl>
                      <div className="shot-list-section">
                        <div className="asset-heading">
                          <div>
                            <strong>Page 2: Detailed shot list</strong>
                            <p>
                              Build the coverage first, then generate the image prompt and animation
                              prompt for each shot.
                            </p>
                          </div>
                          <div className="asset-heading-actions">
                            <button
                              className="button secondary"
                              type="button"
                              onClick={() => buildDetailedShotList(scene)}
                              disabled={buildingShotListSceneId === scene.id}
                            >
                              {!entitlement.isPro
                                ? "Pro: Build detailed shot list"
                                : buildingShotListSceneId === scene.id
                                ? "Building..."
                                : shotAssets.length
                                  ? "Regenerate shot list"
                                  : "Build detailed shot list"}
                            </button>
                            <button
                              className="button secondary"
                              type="button"
                              onClick={() => void copyShotListPrompt(scene, shotAssets)}
                              disabled={!entitlement.isPro}
                            >
                              {entitlement.isPro ? "Copy shot-list prompt" : "Pro: shot-list prompt"}
                            </button>
                          </div>
                        </div>

                        {shotAssets.length ? (
                          <div className="shot-list">
                            {shotAssets.map((asset) => {
                              const imagePromptKey = `image_prompt:${asset.id}`;
                              const animationPromptKey = `animation_prompt:${asset.id}`;
                              const isGeneratingImage = generatingAssetPromptId === imagePromptKey;
                              const isGeneratingAnimation = generatingAssetPromptId === animationPromptKey;
                              const shotMetadata = parseShotMetadata(asset.notes);
                              const showShotMetadata = hasShotMetadata(shotMetadata);

                              return (
                                <article className="shot-row" key={asset.id}>
                                  <div className="shot-row-main">
                                    <span>{String(asset.order_index).padStart(2, "0")}</span>
                                    <div>
                                      <strong>{asset.name}</strong>
                                      <p>{asset.purpose}</p>
                                      <small>{asset.visual}</small>
                                    </div>
                                  </div>
                                  {showShotMetadata ? (
                                    <dl className="shot-meta-grid">
                                      <div>
                                        <dt>Shot type</dt>
                                        <dd>{shotMetadata.shotType || "Not set"}</dd>
                                      </div>
                                      <div>
                                        <dt>Angle</dt>
                                        <dd>{shotMetadata.angle || "Not set"}</dd>
                                      </div>
                                      <div>
                                        <dt>Movement</dt>
                                        <dd>{shotMetadata.movement || "Not set"}</dd>
                                      </div>
                                      <div>
                                        <dt>Lens / feel</dt>
                                        <dd>{shotMetadata.lens || "Not set"}</dd>
                                      </div>
                                      <div>
                                        <dt>Duration</dt>
                                        <dd>{shotMetadata.duration || "Not set"}</dd>
                                      </div>
                                      <div>
                                        <dt>Action</dt>
                                        <dd>{shotMetadata.action || "Not set"}</dd>
                                      </div>
                                      <div>
                                        <dt>Dialogue / sound</dt>
                                        <dd>{shotMetadata.dialogueSound || "Not set"}</dd>
                                      </div>
                                      <div>
                                        <dt>Continuity</dt>
                                        <dd>{shotMetadata.continuity || "Not set"}</dd>
                                      </div>
                                    </dl>
                                  ) : null}
                                  <div className="shot-progress-track">
                                    <span className={asset.image_prompt ? "complete" : ""}>Image prompt</span>
                                    <span className={asset.animation_prompt || asset.sound_prompt ? "complete" : ""}>
                                      Animation + sound
                                    </span>
                                  </div>
                                  <div className="shot-row-actions">
                                    <button
                                      className="button secondary"
                                      type="button"
                                      onClick={() => generateAssetPrompt(scene, asset, "image_prompt")}
                                      disabled={Boolean(generatingAssetPromptId)}
                                    >
                                      {isGeneratingImage
                                        ? "Generating..."
                                        : !entitlement.isPro
                                          ? "Pro: image prompt"
                                          : asset.image_prompt
                                          ? "Regenerate image prompt"
                                          : "Generate image prompt"}
                                    </button>
                                    {asset.image_prompt ? (
                                      <button
                                        className="button secondary"
                                        type="button"
                                        onClick={() => generateAssetPrompt(scene, asset, "animation_prompt")}
                                        disabled={Boolean(generatingAssetPromptId)}
                                      >
                                        {isGeneratingAnimation
                                          ? "Generating..."
                                          : !entitlement.isPro
                                            ? "Pro: animation + sound"
                                            : asset.animation_prompt || asset.sound_prompt
                                            ? "Regenerate animation + sound/dialogue"
                                            : "Generate animation + sound/dialogue"}
                                      </button>
                                    ) : null}
                                  </div>
                                  {asset.image_prompt || asset.animation_prompt || asset.sound_prompt ? (
                                    <dl className="shot-prompt-output">
                                      {asset.image_prompt ? (
                                        <div>
                                          <dt>Image prompt</dt>
                                          <dd>{asset.image_prompt}</dd>
                                        </div>
                                      ) : null}
                                      {asset.animation_prompt ? (
                                        <div>
                                          <dt>Animation prompt</dt>
                                          <dd>{asset.animation_prompt}</dd>
                                        </div>
                                      ) : null}
                                      {asset.sound_prompt ? (
                                        <div>
                                          <dt>Sound/dialogue prompt</dt>
                                          <dd>{asset.sound_prompt}</dd>
                                        </div>
                                      ) : null}
                                    </dl>
                                  ) : null}
                                </article>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="asset-empty">
                            No shot list yet. Build the detailed shot list before creating insert-shot
                            prompt cards.
                          </p>
                        )}
                      </div>
                      <div className="asset-section">
                        <div className="asset-heading">
                          <strong>Prompt cards</strong>
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => createInsertShot(scene)}
                            disabled={creatingAssetSceneId === scene.id}
                          >
                            {creatingAssetSceneId === scene.id
                              ? "Adding..."
                              : entitlement.isPro
                                ? "I need another insert shot"
                                : "Pro: another insert shot"}
                          </button>
                        </div>
                        {promptAssets.length ? (
                          <div className="asset-card-list">
                            {promptAssets.map((asset) => (
                              <article className="asset-card" key={asset.id}>
                                <div className="asset-card-top">
                                  <span>{asset.asset_type.replaceAll("_", " ")}</span>
                                  <strong>{asset.name}</strong>
                                </div>
                                <div className="asset-card-actions">
                                  <button
                                    className="button secondary"
                                    type="button"
                                    onClick={() => generateAssetPrompt(scene, asset, "image_prompt")}
                                    disabled={Boolean(generatingAssetPromptId)}
                                  >
                                    {generatingAssetPromptId === `image_prompt:${asset.id}`
                                      ? "Regenerating..."
                                      : entitlement.isPro
                                        ? "Regenerate image prompt"
                                        : "Pro: image prompt"}
                                  </button>
                                  <button
                                    className="button secondary"
                                    type="button"
                                    onClick={() => generateAssetPrompt(scene, asset, "animation_prompt")}
                                    disabled={Boolean(generatingAssetPromptId)}
                                  >
                                    {generatingAssetPromptId === `animation_prompt:${asset.id}`
                                      ? "Regenerating..."
                                      : entitlement.isPro
                                        ? "Regenerate animation + sound/dialogue"
                                        : "Pro: animation + sound"}
                                  </button>
                                </div>
                                <p>{asset.purpose}</p>
                                <dl>
                                  <div>
                                    <dt>Visual</dt>
                                    <dd>{asset.visual}</dd>
                                  </div>
                                  <div>
                                    <dt>Image prompt</dt>
                                    <dd>{asset.image_prompt}</dd>
                                  </div>
                                  <div>
                                    <dt>Animation prompt</dt>
                                    <dd>{asset.animation_prompt}</dd>
                                  </div>
                                  <div>
                                    <dt>Sound prompt</dt>
                                    <dd>{asset.sound_prompt}</dd>
                                  </div>
                                </dl>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <p className="asset-empty">No prompt cards yet.</p>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}
