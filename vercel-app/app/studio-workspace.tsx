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
  project,
  userEmail,
  onBack,
  onDraftChange,
}: {
  accessToken?: string;
  draftText: string;
  documents?: ProjectDocument[];
  onDocumentsChange?: (documents: ProjectDocument[]) => void;
  project: Project;
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
  const [generatingMode, setGeneratingMode] = useState<GenerateMode | null>(null);
  const activeStep = pipelineSteps.find((step) => step.id === activeStepId) ?? pipelineSteps[0];
  const currentDraft = drafts[activeStep.docType] ?? "";

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
          <button type="button" onClick={() => runGeneration("production")} disabled={Boolean(generatingMode)}>
            {generatingMode === "production" ? "Building prompts..." : "Create production prompt plan"}
          </button>
          <button type="button" onClick={() => runGeneration("insert_shot")} disabled={Boolean(generatingMode)}>
            {generatingMode === "insert_shot" ? "Finding insert..." : "I need another insert shot"}
          </button>
          <p>
            These actions now run through protected StudioBuild AI and save their results to this
            project.
          </p>
        </aside>
      </div>
    </section>
  );
}
