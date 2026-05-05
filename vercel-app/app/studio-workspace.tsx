"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

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

type StageId = "idea" | "treatment" | "script" | "breakdown" | "production";
type DocType = "idea" | "synopsis" | "treatment" | "story" | "script" | "breakdown_notes";
type GenerateMode =
  | "treatment"
  | "script"
  | "breakdown"
  | "production"
  | "improve"
  | "dialogue"
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

type GenerateResponse = {
  ok: boolean;
  mode?: GenerateMode;
  generatedText?: string;
  content?: string;
  document?: ProjectDocument;
  documents?: ProjectDocument[];
  message?: string;
  error?: string;
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
    id: "script",
    projectStage: "script",
    docType: "script",
    label: "Script",
    description: "Draft, import, rewrite, and remove the robotic AI voice.",
    placeholder: "Draft or paste screenplay pages here.",
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
    id: "production",
    projectStage: "story",
    docType: "story",
    label: "Production",
    description: "Build the shot plan and pre-production checklist.",
    placeholder: "Plan assets, insert shots, prompts, sound design, and production order.",
  },
];

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
      .slice(0, 64) || "studiobuild-production-packet"
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

function completionLine(label: string, isComplete: boolean) {
  return { label, isComplete };
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

export function StudioWorkspace() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [draftText, setDraftText] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      const result = (await response.json()) as { ok: boolean; projects?: Project[]; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to load projects.");
      }

      setProjects(result.projects ?? []);
      setSelectedProjectId((current) => current || result.projects?.[0]?.id || "");
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
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setMessage("");
      setError("");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (session?.access_token) {
      void loadProjects(session.access_token);
      return;
    }

    setProjects([]);
  }, [session?.access_token]);

  async function signInWithGoogle() {
    setError("");
    setMessage("");

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
    await supabase.auth.signOut();
    setProjects([]);
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
        }),
      });
      const result = (await response.json()) as { ok: boolean; project?: Project; error?: string };

      if (!response.ok || !result.ok || !result.project) {
        throw new Error(result.error ?? "Unable to save project.");
      }

      setProjects((current) => [result.project as Project, ...current]);
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

  return (
    <article className="panel studio-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live workspace</p>
          <h2>{selectedProject ? "Project command center." : "Save the first real project."}</h2>
        </div>
        {session ? (
          <button className="button secondary" type="button" onClick={signOut}>
            Sign Out
          </button>
        ) : null}
      </div>

      {isLoadingSession ? (
        <p className="subtle">Checking sign-in status...</p>
      ) : !session ? (
        <div className="auth-box">
          <p>
            This is the real Vercel workspace. Sign in with Google here, then save a project to the
            StudioBuild Supabase database.
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
                Starter idea
                <textarea
                  value={form.initialContent}
                  onChange={(event) => updateForm("initialContent", event.target.value)}
                  placeholder="Paste the rough idea, opening beat, or script fragment here."
                />
              </label>

              <button className="button" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Project"}
              </button>
            </form>
          )}

          <div className="project-list">
            <div className="list-heading">
              <h3>Saved projects</h3>
              <span>{isLoadingProjects ? "Loading" : `${projects.length} saved`}</span>
            </div>

            {projects.length === 0 ? (
              <p className="empty-state">No saved projects yet.</p>
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
                    {[project.genre, project.tone].filter(Boolean).join(" / ") || "Project shell"}
                  </small>
                  <strong>Open project</strong>
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
  onDocumentsChange,
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
  onDocumentsChange?: (documents: ProjectDocument[]) => void;
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
    story: "",
    script: "",
    breakdown_notes: "",
  });
  const [workflowTools, setWorkflowTools] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSavingStage, setIsSavingStage] = useState(false);
  const [isSavingPacket, setIsSavingPacket] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState("");
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, SceneBreakdownDraft>>({});
  const [buildingShotListSceneId, setBuildingShotListSceneId] = useState("");
  const [creatingAssetSceneId, setCreatingAssetSceneId] = useState("");
  const [generatingAssetPromptId, setGeneratingAssetPromptId] = useState("");
  const [savingSceneId, setSavingSceneId] = useState("");
  const [generatingMode, setGeneratingMode] = useState<GenerateMode | null>(null);
  const activeStep = pipelineSteps.find((step) => step.id === activeStepId) ?? pipelineSteps[0];
  const currentDraft = drafts[activeStep.docType] ?? "";
  const assetsBySceneId = useMemo(() => {
    return productionAssets.reduce<Record<string, ProductionAsset[]>>((grouped, asset) => {
      const key = asset.scene_breakdown_id;
      grouped[key] = [...(grouped[key] ?? []), asset];
      return grouped;
    }, {});
  }, [productionAssets]);
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
      completionLine("At least one scene packet saved", sceneBreakdowns.length > 0),
      completionLine("Scene packets include core production fields", sceneCompleteness >= 0.75),
      completionLine("Detailed shot list built", shotAssets.length > 0),
      completionLine("Image prompts generated", imagePromptCount > 0),
      completionLine("Animation plus sound prompts generated", animationPromptCount > 0),
      completionLine("Insert or prompt cards created", promptAssets.length > 0),
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

  function updateDraft(value: string) {
    setDrafts((current) => ({ ...current, [activeStep.docType]: value }));
    onDraftChange(value);
    setSaveStatus("");
    setSaveError("");
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

  async function runGeneration(mode: GenerateMode) {
    if (!accessToken) {
      setSaveError("Open this project from its project page before using StudioBuild AI.");
      return;
    }

    const { selectedText, selectionStart, selectionEnd } = selectedTextareaText();
    setGeneratingMode(mode);
    setSaveStatus("");
    setSaveError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          projectId: project.id,
          docType: activeStep.docType,
          content: currentDraft,
          selectedText,
          selectionStart,
          selectionEnd,
          workflow: workflowTools,
        }),
      });
      const result = (await response.json()) as GenerateResponse;

      if (!response.ok || !result.ok || !result.document) {
        throw new Error(result.message ?? result.error ?? "StudioBuild AI could not complete that pass.");
      }

      const nextContent = result.content ?? result.document.content;
      const nextStep = pipelineSteps.find((step) => step.docType === result.document?.doc_type);

      setDrafts((current) => ({
        ...current,
        [result.document!.doc_type]: nextContent,
      }));
      onDraftChange(nextContent);
      onDocumentsChange?.(result.documents ?? [result.document]);

      if (nextStep) {
        setActiveStepId(nextStep.id);
      }

      setSaveStatus(`${nextStep?.label ?? activeStep.label} generated and saved to Supabase.`);
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "StudioBuild AI could not complete that pass.");
    } finally {
      setGeneratingMode(null);
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

  async function createInsertShot(scene: SceneBreakdown) {
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
      { label: "Treatment", value: drafts.treatment },
      { label: "Script", value: drafts.script },
      { label: "Breakdown Notes", value: drafts.breakdown_notes },
      { label: "Production Notes", value: drafts.story },
    ];

    const projectSummary = [
      `# ${markdownValue(project.title, "Untitled StudioBuild Project")}`,
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
    ].join("\n");

    const documentBlocks = docSections
      .filter((section) => section.value.trim())
      .map((section) => [`## ${section.label}`, "", section.value.trim()].join("\n"))
      .join("\n\n");

    const sceneBlocks = sceneBreakdowns
      .map((scene) => {
        const sceneAssets = assetsBySceneId[scene.id] ?? [];
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
                [
                  `#### ${asset.name}`,
                  "",
                  `Purpose: ${markdownValue(asset.purpose)}`,
                  `Visual: ${markdownValue(asset.visual)}`,
                  "",
                  `Image prompt: ${markdownValue(asset.image_prompt)}`,
                  "",
                  `Animation prompt: ${markdownValue(asset.animation_prompt)}`,
                  "",
                  `Sound/dialogue prompt: ${markdownValue(asset.sound_prompt)}`,
                ].join("\n"),
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

    return [projectSummary, documentBlocks, "## Scene Packets", sceneBlocks || "No scene packets saved yet."]
      .filter(Boolean)
      .join("\n\n");
  }

  function buildPremiumPacketHtml() {
    const docSections: Array<{ label: string; value: string }> = [
      { label: "Idea", value: drafts.idea },
      { label: "Treatment", value: drafts.treatment },
      { label: "Script", value: drafts.script },
      { label: "Breakdown Notes", value: drafts.breakdown_notes },
      { label: "Production Notes", value: drafts.story },
    ].filter((section) => section.value.trim());

    const sceneSections = sceneBreakdowns
      .map((scene) => {
        const sceneAssets = assetsBySceneId[scene.id] ?? [];
        const shotAssets = sceneAssets.filter((asset) => asset.asset_type === "shot");
        const promptAssets = sceneAssets.filter((asset) => asset.asset_type !== "shot");

        const shotRows = shotAssets.length
          ? shotAssets
              .map(
                (asset) => `
                  <article class="shot">
                    <div class="shot-number">${String(asset.order_index).padStart(2, "0")}</div>
                    <div>
                      <h4>${htmlValue(asset.name, "Untitled shot")}</h4>
                      <p class="purpose">${htmlValue(asset.purpose)}</p>
                      <p>${htmlValue(asset.visual)}</p>
                      <div class="prompt-grid">
                        <section><b>Image Prompt</b>${htmlParagraphs(asset.image_prompt)}</section>
                        <section><b>Animation Prompt</b>${htmlParagraphs(asset.animation_prompt)}</section>
                        <section><b>Sound / Dialogue</b>${htmlParagraphs(asset.sound_prompt)}</section>
                      </div>
                    </div>
                  </article>
                `,
              )
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
            <div class="section-kicker">Scene ${scene.scene_number}</div>
            <h2>${htmlValue(scene.scene_heading, "Unlabeled scene")}</h2>
            <p class="lede">${htmlValue(scene.summary)}</p>
            <div class="meta-grid">
              <div><b>Location</b><span>${htmlValue(scene.location)}</span></div>
              <div><b>Time</b><span>${htmlValue(scene.time_of_day)}</span></div>
              <div><b>Tone</b><span>${htmlValue(scene.tone || scene.color_palette)}</span></div>
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
            <div class="section-kicker">Page 2</div>
            <h2>Detailed Shot List</h2>
            ${shotRows}
          </section>
          <section class="packet-section">
            <div class="section-kicker">Prompt Cards</div>
            <h2>Image, Animation, Sound</h2>
            ${promptCards}
          </section>
        `;
      })
      .join("");

    const documentSections = docSections
      .map(
        (section) => `
          <section class="packet-section">
            <div class="section-kicker">${htmlValue(section.label)}</div>
            <h2>${htmlValue(section.label)}</h2>
            <div class="document-body">${htmlParagraphs(section.value)}</div>
          </section>
        `,
      )
      .join("");

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlValue(project.title, "StudioBuild Production Packet")}</title>
    <style>
      :root {
        --paper: #fbfaf7;
        --ink: #151515;
        --muted: #70665f;
        --line: #ded6cd;
        --accent: #9d4853;
        --soft: #f0e7de;
        --sage: #dfe7e2;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #e7e2dc;
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
        background: rgba(21, 21, 21, 0.92);
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
        box-shadow: 0 30px 100px rgba(28, 23, 20, 0.18);
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
          linear-gradient(135deg, rgba(18, 18, 18, 0.92), rgba(73, 58, 52, 0.72)),
          linear-gradient(90deg, rgba(157, 72, 83, 0.34), transparent 44%, rgba(223, 231, 226, 0.18)),
          #171717;
      }
      .brand {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      .cover h1 {
        max-width: 760px;
        margin: 120px 0 18px;
        font-size: 72px;
        line-height: 0.96;
        letter-spacing: 0;
      }
      .cover .subtitle {
        max-width: 650px;
        color: rgba(255, 255, 255, 0.78);
        font-size: 20px;
      }
      .cover-grid,
      .meta-grid,
      .details-grid,
      .prompt-grid {
        display: grid;
        gap: 12px;
      }
      .cover-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      .cover-grid div,
      .meta-grid div,
      .details-grid section,
      .prompt-grid section {
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
      .section-kicker,
      .prompt-card span {
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
      .details-grid ul {
        margin: 0;
        padding-left: 18px;
      }
      .shot,
      .prompt-card {
        display: grid;
        gap: 14px;
        border-top: 1px solid var(--line);
        padding: 18px 0;
        break-inside: avoid;
      }
      .shot {
        grid-template-columns: 44px minmax(0, 1fr);
      }
      .shot-number {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
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
      .prompt-grid {
        grid-template-columns: repeat(3, 1fr);
        margin-top: 12px;
      }
      .prompt-grid p,
      .document-body p {
        margin: 8px 0 0;
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
          box-shadow: none;
        }
        .cover,
        .packet-section {
          min-height: 10.35in;
          padding: 0.55in;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-bar">
      <strong>StudioBuild premium packet preview</strong>
      <button onclick="window.print()">Save as PDF</button>
    </div>
    <main class="packet">
      <section class="cover">
        <div class="brand">StudioBuild Production Packet</div>
        <div>
          <h1>${htmlValue(project.title, "Untitled Project")}</h1>
          <p class="subtitle">${htmlValue(project.logline, "A production-ready packet built for AI filmmaking workflow.")}</p>
        </div>
        <div class="cover-grid">
          <div><b>Genre</b><span>${htmlValue(project.genre)}</span></div>
          <div><b>Tone</b><span>${htmlValue(project.tone)}</span></div>
          <div><b>Scenes / Assets</b><span>${sceneBreakdowns.length} / ${productionAssets.length}</span></div>
        </div>
      </section>
      <section class="packet-section">
        <div class="section-kicker">Project Overview</div>
        <h2>Production Roadmap</h2>
        <p class="lede">${htmlValue(project.logline, "No logline entered yet.")}</p>
        <div class="details-grid">
          <section><h3>Inspirations</h3>${htmlList(project.inspirations)}</section>
          <section><h3>Workflow / Tools</h3>${htmlParagraphs(workflowTools, "Tool stack not specified.")}</section>
        </div>
      </section>
      ${documentSections}
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
          New Project
        </button>
        <span>Opened by {userEmail}</span>
      </div>

      <div className="project-hero">
        <p className="eyebrow">Project workspace</p>
        <h3>{project.title}</h3>
        <p>{project.logline || "Start with the idea, then move through the full filmmaking pipeline."}</p>
      </div>

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
            Premium PDF preview
          </button>
        </div>
      </div>

      <div className="pipeline-strip" aria-label="StudioBuild pipeline">
        {pipelineSteps.map((step, index) => (
          <button
            className={step.id === activeStepId ? "pipeline-step active" : "pipeline-step"}
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
          </button>
        ))}
      </div>

      <div className="workspace-tools">
        <section>
          <div className="tool-heading">
            <h4>{activeStep.label} room</h4>
            <span>{activeStep.projectStage}</span>
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
              onClick={() => runGeneration("improve")}
              disabled={Boolean(generatingMode)}
            >
              {generatingMode === "improve" ? "Improving..." : "Improve Selected"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => runGeneration("dialogue")}
              disabled={Boolean(generatingMode)}
            >
              {generatingMode === "dialogue" ? "Polishing..." : "Dialogue Polish"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => runGeneration("structure")}
              disabled={Boolean(generatingMode)}
            >
              {generatingMode === "structure" ? "Structuring..." : "Structure Pass"}
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
          <button type="button" onClick={() => runGeneration("treatment")} disabled={Boolean(generatingMode)}>
            {generatingMode === "treatment" ? "Writing treatment..." : "Write industry treatment"}
          </button>
          <button type="button" onClick={() => runGeneration("script")} disabled={Boolean(generatingMode)}>
            {generatingMode === "script" ? "Writing script..." : "Write script pages"}
          </button>
          <button type="button" onClick={() => runGeneration("breakdown")} disabled={Boolean(generatingMode)}>
            {generatingMode === "breakdown" ? "Breaking down..." : "Build scene breakdown"}
          </button>
          <button type="button" onClick={saveScenePacket} disabled={isSavingPacket}>
            {isSavingPacket ? "Saving no-AI packet..." : "Parse + save no-AI scene packet"}
          </button>
          <button type="button" onClick={() => runGeneration("production")} disabled={Boolean(generatingMode)}>
            {generatingMode === "production" ? "Building prompts..." : "Create production prompt plan"}
          </button>
          <button type="button" onClick={() => runGeneration("insert_shot")} disabled={Boolean(generatingMode)}>
            {generatingMode === "insert_shot" ? "Finding insert..." : "I need another insert shot"}
          </button>
          <p>
            Use the no-AI scene packet first to create real production data. Hosted AI actions stay
            available for higher-leverage passes once API credits are ready.
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
            <span>No hosted AI cost</span>
          </div>

          <div className="scene-packet-grid">
            {sceneBreakdowns.map((scene) => {
              const isEditing = editingSceneId === scene.id;
              const draft = sceneDrafts[scene.id] ?? sceneToDraft(scene);
              const sceneAssets = assetsBySceneId[scene.id] ?? [];
              const shotAssets = sceneAssets.filter((asset) => asset.asset_type === "shot");
              const promptAssets = sceneAssets.filter((asset) => asset.asset_type !== "shot");

              return (
                <article className="scene-packet-card" key={scene.id}>
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
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => buildDetailedShotList(scene)}
                            disabled={buildingShotListSceneId === scene.id}
                          >
                            {buildingShotListSceneId === scene.id
                              ? "Building..."
                              : shotAssets.length
                                ? "Regenerate shot list"
                                : "Build detailed shot list"}
                          </button>
                        </div>

                        {shotAssets.length ? (
                          <div className="shot-list">
                            {shotAssets.map((asset) => {
                              const imagePromptKey = `image_prompt:${asset.id}`;
                              const animationPromptKey = `animation_prompt:${asset.id}`;
                              const isGeneratingImage = generatingAssetPromptId === imagePromptKey;
                              const isGeneratingAnimation = generatingAssetPromptId === animationPromptKey;

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
                                  <div className="shot-row-actions">
                                    <button
                                      className="button secondary"
                                      type="button"
                                      onClick={() => generateAssetPrompt(scene, asset, "image_prompt")}
                                      disabled={Boolean(generatingAssetPromptId)}
                                    >
                                      {isGeneratingImage
                                        ? "Generating..."
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
                            {creatingAssetSceneId === scene.id ? "Adding..." : "I need another insert shot"}
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
                                      : "Regenerate image prompt"}
                                  </button>
                                  <button
                                    className="button secondary"
                                    type="button"
                                    onClick={() => generateAssetPrompt(scene, asset, "animation_prompt")}
                                    disabled={Boolean(generatingAssetPromptId)}
                                  >
                                    {generatingAssetPromptId === `animation_prompt:${asset.id}`
                                      ? "Regenerating..."
                                      : "Regenerate animation + sound/dialogue"}
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
