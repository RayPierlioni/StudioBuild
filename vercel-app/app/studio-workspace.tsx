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
  const [creatingAssetSceneId, setCreatingAssetSceneId] = useState("");
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
                        {sceneAssets.length ? (
                          <div className="asset-card-list">
                            {sceneAssets.map((asset) => (
                              <article className="asset-card" key={asset.id}>
                                <div className="asset-card-top">
                                  <span>{asset.asset_type.replaceAll("_", " ")}</span>
                                  <strong>{asset.name}</strong>
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
