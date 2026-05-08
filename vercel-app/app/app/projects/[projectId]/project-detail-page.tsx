"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { AuthReturnHandler, rememberAuthReturnPath } from "../../../auth-handler";
import { getSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import {
  ProjectWorkspace,
  type AccessEntitlement,
  type Project,
  type ProjectDocument,
  type ProductionAsset,
  type SceneBreakdown,
} from "../../../studio-workspace";

type ProjectResponse = {
  ok: boolean;
  project?: Project;
  documents?: ProjectDocument[];
  entitlement?: AccessEntitlement;
  sceneBreakdowns?: SceneBreakdown[];
  productionAssets?: ProductionAsset[];
  error?: string;
};

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [entitlement, setEntitlement] = useState<AccessEntitlement>({
    isAdmin: false,
    isPro: false,
    planLabel: "Free",
    status: "free",
  });
  const [sceneBreakdowns, setSceneBreakdowns] = useState<SceneBreakdown[]>([]);
  const [productionAssets, setProductionAssets] = useState<ProductionAsset[]>([]);
  const [draftText, setDraftText] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isOpeningBillingPortal, setIsOpeningBillingPortal] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [error, setError] = useState("");

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
      setError("");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    async function loadProject(accessToken: string) {
      setIsLoadingProject(true);
      setError("");

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const result = (await response.json()) as ProjectResponse;

        if (!response.ok || !result.ok || !result.project) {
          throw new Error(result.error ?? "Unable to open project.");
        }

        setProject(result.project);
        setDocuments(result.documents ?? []);
        setEntitlement(
          result.entitlement ?? {
            isAdmin: false,
            isPro: false,
            planLabel: "Free",
            status: "free",
          },
        );
        setSceneBreakdowns(result.sceneBreakdowns ?? []);
        setProductionAssets(result.productionAssets ?? []);
        setDraftText(
          result.documents?.find((document) => document.doc_type === "idea")?.content ??
            result.documents?.find((document) => document.doc_type === "script")?.content ??
            "",
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to open project.");
      } finally {
        setIsLoadingProject(false);
      }
    }

    if (session?.access_token) {
      void loadProject(session.access_token);
    }
  }, [projectId, session?.access_token]);

  async function signInWithGoogle() {
    setError("");
    const nextPath = `${window.location.pathname}${window.location.search}`;
    rememberAuthReturnPath(nextPath);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (signInError) {
      setError(signInError.message);
    }
  }

  async function startCheckout() {
    if (!session?.access_token) {
      setError("Sign in with Google before upgrading.");
      return;
    }

    setIsStartingCheckout(true);
    setError("");

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
      return;
    }

    setIsOpeningBillingPortal(true);
    setError("");

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

  return (
    <main className="detail-shell">
      <AuthReturnHandler fallbackNext={`/app/projects/${projectId}`} quiet />
      <div className="detail-topbar">
        <a className="brand-link" href="/">
          MISEFORGE
        </a>
        <a className="button secondary" href="/app">
          All Projects
        </a>
      </div>

      <section className="detail-panel panel">
        {isLoadingSession || isLoadingProject ? (
          <p className="subtle">Opening project...</p>
        ) : !session ? (
          <div className="auth-box">
            <p>Sign in with Google to open this MiseForge project.</p>
            <button className="button" type="button" onClick={signInWithGoogle}>
              Sign in with Google
            </button>
          </div>
        ) : project ? (
          <ProjectWorkspace
            accessToken={session.access_token}
            draftText={draftText}
            documents={documents}
            entitlement={entitlement}
            isOpeningBillingPortal={isOpeningBillingPortal}
            isStartingCheckout={isStartingCheckout}
            onManageBilling={openBillingPortal}
            onUpgrade={startCheckout}
            productionAssets={productionAssets}
            project={project}
            sceneBreakdowns={sceneBreakdowns}
            userEmail={session.user.email ?? "Signed-in user"}
            onBack={() => {
              window.location.assign("/app");
            }}
            onDocumentsChange={setDocuments}
            onProductionAssetsChange={setProductionAssets}
            onSceneBreakdownsChange={setSceneBreakdowns}
            onDraftChange={setDraftText}
          />
        ) : (
          <p className="status error">{error || "Project could not be opened."}</p>
        )}

        {error && project ? <p className="status error">{error}</p> : null}
      </section>
    </main>
  );
}
