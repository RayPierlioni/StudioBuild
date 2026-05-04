"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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

const pipelineSteps = [
  ["Idea", "Shape the core promise and dramatic engine."],
  ["Treatment", "Turn the concept into a cinematic story map."],
  ["Script", "Draft, import, rewrite, and remove the robotic AI voice."],
  ["Breakdown", "Pull scenes, characters, props, wardrobe, sound, and prompts."],
  ["Production", "Build the shot plan and pre-production checklist."],
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
  draftText,
  project,
  userEmail,
  onBack,
  onDraftChange,
}: {
  draftText: string;
  project: Project;
  userEmail: string;
  onBack: () => void;
  onDraftChange: (value: string) => void;
}) {
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
        {pipelineSteps.map(([name, description], index) => (
          <div className={index === 0 ? "pipeline-step active" : "pipeline-step"} key={name}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{name}</strong>
            <small>{description}</small>
          </div>
        ))}
      </div>

      <div className="workspace-tools">
        <section>
          <div className="tool-heading">
            <h4>Writing room</h4>
            <span>{project.active_stage}</span>
          </div>
          <textarea
            className="script-pad"
            value={draftText}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Start writing the idea, scene, dialogue, or script fragment for this project."
          />
          <div className="actions">
            <button className="button" type="button" disabled>
              Improve Selection
            </button>
            <button className="button secondary" type="button" disabled>
              Import Script
            </button>
          </div>
        </section>

        <aside className="next-actions">
          <h4>Next production moves</h4>
          <button type="button" disabled>
            Generate treatment
          </button>
          <button type="button" disabled>
            Build scene breakdown
          </button>
          <button type="button" disabled>
            Create production asset prompts
          </button>
          <p>
            These buttons are placed now so the app has the correct workflow shape. We will connect
            them to AI routes one by one.
          </p>
        </aside>
      </div>
    </section>
  );
}
