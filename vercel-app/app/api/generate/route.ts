import { getVerifiedRequestUser } from "../../../lib/auth";
import { getUserEntitlement } from "../../../lib/entitlements";
import { getSupabaseAdminClient } from "../../../lib/supabase/server";

type GenerateMode =
  | "treatment"
  | "script"
  | "breakdown"
  | "production"
  | "improve"
  | "dialogue"
  | "insert_shot"
  | "structure";

type DocType = "idea" | "synopsis" | "treatment" | "story" | "script" | "breakdown_notes";

type GeneratePayload = {
  mode?: GenerateMode;
  projectId?: string;
  docType?: string;
  content?: string;
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  workflow?: string;
};

type ProjectRecord = {
  id: string;
  title: string;
  genre: string;
  tone: string;
  logline: string;
  inspirations: string[];
  active_stage: string;
  notes: string;
  workflow?: Record<string, unknown>;
};

type ProjectDocument = {
  id: string;
  doc_type: DocType;
  content: string;
  created_at: string;
  updated_at: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const allowedDocTypes = new Set<DocType>([
  "idea",
  "synopsis",
  "treatment",
  "story",
  "script",
  "breakdown_notes",
]);

const rewriteModes = new Set<GenerateMode>(["improve", "dialogue", "structure"]);

const modeConfig: Record<
  GenerateMode,
  {
    label: string;
    docType: DocType;
    activeStage: string;
    maxOutputTokens: number;
  }
> = {
  treatment: {
    label: "industry treatment",
    docType: "treatment",
    activeStage: "treatment",
    maxOutputTokens: 4200,
  },
  script: {
    label: "screenplay draft",
    docType: "script",
    activeStage: "script",
    maxOutputTokens: 4600,
  },
  breakdown: {
    label: "scene breakdown",
    docType: "breakdown_notes",
    activeStage: "breakdown",
    maxOutputTokens: 5200,
  },
  production: {
    label: "production prompt plan",
    docType: "story",
    activeStage: "production",
    maxOutputTokens: 5200,
  },
  improve: {
    label: "improvement pass",
    docType: "script",
    activeStage: "script",
    maxOutputTokens: 3600,
  },
  dialogue: {
    label: "dialogue polish",
    docType: "script",
    activeStage: "script",
    maxOutputTokens: 3200,
  },
  insert_shot: {
    label: "insert shot",
    docType: "story",
    activeStage: "production",
    maxOutputTokens: 1800,
  },
  structure: {
    label: "structure pass",
    docType: "treatment",
    activeStage: "treatment",
    maxOutputTokens: 3400,
  },
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function trimForPrompt(value: string, maxLength = 18000) {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(value.length - maxLength);
}

function extractOpenAIText(result: OpenAIResponse) {
  if (typeof result.output_text === "string" && result.output_text.trim()) {
    return result.output_text.trim();
  }

  const text = result.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();

  return text || "";
}

function resolveDocType(value: string | undefined, fallback: DocType) {
  return allowedDocTypes.has(value as DocType) ? (value as DocType) : fallback;
}

function stageForDocType(docType: DocType) {
  if (docType === "breakdown_notes") {
    return "breakdown";
  }

  if (docType === "story") {
    return "story";
  }

  return docType;
}

function spliceSelection(content: string, start: number | undefined, end: number | undefined, replacement: string) {
  const hasSelection =
    typeof start === "number" &&
    typeof end === "number" &&
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    end > start &&
    end <= content.length;

  if (!hasSelection) {
    return replacement;
  }

  return `${content.slice(0, start)}${replacement}${content.slice(end)}`;
}

function formatProjectContext(project: ProjectRecord, workflow: string) {
  const inspirations = Array.isArray(project.inspirations) ? project.inspirations.join(", ") : "";
  const savedWorkflow = project.workflow ? JSON.stringify(project.workflow) : "";

  return `Project title: ${project.title || "Untitled Project"}
Genre: ${project.genre || "Not specified"}
Tone: ${project.tone || "Not specified"}
Logline: ${project.logline || "Not written yet"}
Cinematic references: ${inspirations || "Not specified"}
Creator notes: ${project.notes || "None"}
Production workflow/tools: ${workflow || savedWorkflow || "Ask-ready, tool-agnostic workflow"}`;
}

function formatDocumentContext(documents: ProjectDocument[]) {
  if (!documents.length) {
    return "No saved project documents yet.";
  }

  return documents
    .map((document) => {
      return `## Saved ${document.doc_type}
${trimForPrompt(document.content, 7000)}`;
    })
    .join("\n\n");
}

function buildUserPrompt({
  content,
  documents,
  mode,
  project,
  selectedText,
  workflow,
}: {
  content: string;
  documents: ProjectDocument[];
  mode: GenerateMode;
  project: ProjectRecord;
  selectedText: string;
  workflow: string;
}) {
  const projectContext = formatProjectContext(project, workflow);
  const documentContext = formatDocumentContext(documents);
  const currentDraft = trimForPrompt(content || selectedText || "", 20000);

  const sharedInput = `PROJECT CONTEXT
${projectContext}

SAVED DOCUMENTS
${documentContext}

CURRENT WORKING DRAFT
${currentDraft || "No current draft provided."}

SELECTED TEXT
${selectedText || "No selected text."}`;

  if (mode === "treatment") {
    return `${sharedInput}

Write a complete industry-level film treatment for this project. It should feel like something a serious development executive, producer, and writer could read before committing resources.

Include:
- A sharpened logline
- The cinematic promise
- The thematic engine
- Main character profile and emotional flaw
- Supporting character web
- World/rules if relevant
- Act I, Act II-A, midpoint, Act II-B, Act III
- Set pieces and emotional reversals
- Ending image
- Why this can compete in AI filmmaking
- Immediate next writing tasks

Make it polished, specific, and visual.`;
  }

  if (mode === "script") {
    return `${sharedInput}

Write professional screenplay pages from the strongest available material. Use industry screenplay formatting conventions: scene headings, lean action lines, character names, parentheticals only when essential, and dialogue with subtext.

The pages should:
- Remove generic AI voice
- Feel shootable
- Introduce clear visual behavior
- Use conflict and withheld information
- Avoid exposition dumps
- Give every character a distinct rhythm
- End on a beat that makes the reader want the next scene`;
  }

  if (mode === "breakdown") {
    return `${sharedInput}

Create a production-ready scene breakdown. Put the traditional breakdown first, then the AI filmmaking prompt materials under it.

For each scene include:
- Scene heading
- Story purpose
- Characters and concise casting/look notes
- Location
- Props
- Wardrobe
- Hair/makeup
- Set dressing
- Vehicles/creatures/special elements if any
- Continuity concerns
- Blocking
- Color palette
- Feeling/tone
- Sound design notes, explicitly no music unless story-necessary
- Image prompt ingredients
- Animation prompt ingredients
- Editable prompt pack adapted to the listed workflow/tools

Make it practical enough for a filmmaker to start producing assets from it.`;
  }

  if (mode === "production") {
    return `${sharedInput}

Build a complete pre-production and AI asset-generation plan for this project.

Include:
- Production order of operations
- Asset checklist in editable order
- Character consistency bible
- Wardrobe and prop consistency bible
- Environment continuity
- Image prompt templates
- Animation prompt templates
- Sound design prompt templates, no music unless specified
- Insert shot queue
- Shot-by-shot production priorities
- Risks that will hurt the film if ignored

Adapt the prompts to the creator's workflow/tools when tools are named.`;
  }

  if (mode === "insert_shot") {
    return `${sharedInput}

Create one additional insert shot that would make the scene or film feel more cinematic.

Return:
- Insert shot name
- Why this shot matters emotionally or narratively
- Exact visual
- Image prompt
- Animation prompt
- Sound design prompt, no music
- Continuity notes
- Where it should be placed in the sequence`;
  }

  if (mode === "dialogue") {
    return `${sharedInput}

Rewrite the selected text if present; otherwise rewrite the current draft. Focus only on dialogue and immediate action around the dialogue.

Make it:
- Human, specific, and character-driven
- Less on-the-nose
- Built around subtext, interruption, pressure, status, and silence
- Free of robotic AI phrasing

If selected text exists, return only the replacement text for that selected passage.`;
  }

  if (mode === "structure") {
    return `${sharedInput}

Run a professional structure pass. Diagnose the dramatic engine, then rewrite the material into a stronger version.

Focus on:
- Want, need, flaw, stakes
- The same-but-different hook
- Escalation
- Reversals
- The ending promise
- What must be cut because it weakens momentum

Return a polished version with clear headings and actionable notes.`;
  }

  return `${sharedInput}

Improve the selected text if present; otherwise improve the full current draft.

Make the writing:
- More cinematic
- More emotionally specific
- Less generic
- Less robotic
- More disciplined and professional
- Clearer in character desire, conflict, and consequence

If selected text exists, return only the replacement text for that selected passage.`;
}

async function callOpenAI({
  maxOutputTokens,
  prompt,
}: {
  maxOutputTokens: number;
  prompt: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        status: "generation_unavailable",
        message: "MiseForge generation is not available yet. Use the prompt workflow for now, or try again shortly.",
      },
      { status: 503 },
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "medium" },
      instructions: `You are MiseForge, an elite filmmaker's development partner: part Hollywood script doctor, part producer, part script supervisor, part AI pre-production strategist.

Write at an industry-professional level. Be concrete, visual, useful, and specific. Do not sound like generic AI copy. Do not mention that you are an AI. Do not apologize. Do not explain the task back.

Use cinematic references only as craft references. Do not imitate copyrighted dialogue or prose from existing films. Extract principles: pacing, escalation, tone, structure, camera language, and emotional design.

Output only the finished artifact the user can work with immediately.`,
      input: prompt,
      max_output_tokens: maxOutputTokens,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as OpenAIResponse;

  if (!response.ok) {
    return Response.json(
      {
        ok: false,
        status: "openai_error",
        message: "MiseForge generation could not finish that request. Try a shorter passage or use the prompt workflow.",
      },
      { status: response.status },
    );
  }

  const generatedText = extractOpenAIText(result);

  if (!generatedText) {
    return Response.json(
      {
        ok: false,
        status: "empty_generation",
        message: "The AI returned an empty result. Try again with a little more project context.",
      },
      { status: 502 },
    );
  }

  return generatedText;
}

async function saveGeneratedDocument({
  activeStage,
  content,
  docType,
  projectId,
  supabase,
  userId,
}: {
  activeStage: string;
  content: string;
  docType: DocType;
  projectId: string;
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  userId: string;
}) {
  const { data: existingDocument, error: existingError } = await supabase
    .from("documents")
    .select("id")
    .eq("project_id", projectId)
    .eq("owner_id", userId)
    .eq("doc_type", docType)
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
          doc_type: docType,
          content,
        })
        .select("id,doc_type,content,created_at,updated_at")
        .single();

  if (documentResult.error || !documentResult.data) {
    throw new Error(documentResult.error?.message || "Unable to save generated document.");
  }

  await supabase
    .from("projects")
    .update({ active_stage: activeStage, updated_at: now })
    .eq("id", projectId)
    .eq("owner_id", userId);

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id,doc_type,content,created_at,updated_at")
    .eq("project_id", projectId)
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  return { document: documentResult.data, documents: documents ?? [] };
}

export async function POST(request: Request) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const body = (await request.json()) as GeneratePayload;
    const mode = body.mode && modeConfig[body.mode] ? body.mode : null;
    const projectId = cleanText(body.projectId);

    if (!mode) {
      return Response.json({ ok: false, error: "Choose a valid generation mode." }, { status: 400 });
    }

    if (!projectId) {
      return Response.json({ ok: false, error: "Missing project ID." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const entitlement = await getUserEntitlement(user);

    if (!entitlement.isPro) {
      return Response.json(
        {
          ok: false,
          status: "premium_required",
          message: "MiseForge generation is included with admin access or Founder Pro.",
        },
        { status: 402 },
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id,title,genre,tone,logline,inspirations,active_stage,notes,workflow")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      return Response.json(
        { ok: false, error: projectError?.message || "Project not found." },
        { status: 404 },
      );
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

    const config = modeConfig[mode];
    const requestedDocType = resolveDocType(body.docType, config.docType);
    const docType = rewriteModes.has(mode) ? requestedDocType : config.docType;
    const activeStage = rewriteModes.has(mode) ? stageForDocType(docType) : config.activeStage;
    const content = typeof body.content === "string" ? body.content : "";
    const selectedText = cleanText(body.selectedText);
    const prompt = buildUserPrompt({
      content,
      documents: (documents ?? []) as ProjectDocument[],
      mode,
      project: project as ProjectRecord,
      selectedText,
      workflow: cleanText(body.workflow),
    });

    const generation = await callOpenAI({
      maxOutputTokens: config.maxOutputTokens,
      prompt,
    });

    if (generation instanceof Response) {
      return generation;
    }

    const shouldSpliceSelection = rewriteModes.has(mode) && selectedText;
    const contentToSave =
      mode === "insert_shot" && content.trim()
        ? `${content.trim()}\n\n---\n\n${generation}`
        : shouldSpliceSelection
          ? spliceSelection(content, body.selectionStart, body.selectionEnd, generation)
          : generation;

    const { document, documents: updatedDocuments } = await saveGeneratedDocument({
      activeStage,
      content: contentToSave,
      docType,
      projectId,
      supabase,
      userId: user.id,
    });

    return Response.json({
      ok: true,
      mode,
      label: config.label,
      generatedText: generation,
      content: contentToSave,
      document,
      documents: updatedDocuments,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.toLowerCase().includes("supabase")
        ? "Sign in again before using this MiseForge tool."
        : "MiseForge could not complete that request. Please try again shortly.";

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: message.startsWith("Sign in") ? 401 : 503 },
    );
  }
}
