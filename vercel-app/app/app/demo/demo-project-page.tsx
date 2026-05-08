"use client";

import { useState } from "react";

import {
  ProjectWorkspace,
  type ProductionAsset,
  type ProjectDocument,
  type SceneBreakdown,
} from "../../studio-workspace";
import {
  demoDocuments,
  demoEntitlement,
  demoProductionAssets,
  demoProject,
  demoSceneBreakdowns,
} from "./sample-data";

export function DemoProjectPage() {
  const [documents, setDocuments] = useState<ProjectDocument[]>(demoDocuments);
  const [sceneBreakdowns, setSceneBreakdowns] = useState<SceneBreakdown[]>(demoSceneBreakdowns);
  const [productionAssets, setProductionAssets] = useState<ProductionAsset[]>(demoProductionAssets);
  const [draftText, setDraftText] = useState(
    demoDocuments.find((document) => document.doc_type === "script")?.content ?? "",
  );

  return (
    <main className="detail-shell command-app-shell demo-detail-shell">
      <div className="detail-topbar command-topbar">
        <a className="brand-link" href="/">
          MISEFORGE
        </a>
        <nav aria-label="Demo project navigation">
          <a href="/">Landing</a>
          <a data-analytics-area="demo_nav" data-analytics-event="CTA Click" data-analytics-target="open_app" href="/app">Open App</a>
          <a data-analytics-area="demo_nav" data-analytics-event="CTA Click" data-analytics-target="new_film" href="/app/start/idea">New Film</a>
        </nav>
      </div>

      <section className="detail-panel panel command-project-panel demo-project-panel">
        <div className="demo-project-notice">
          <div>
            <span>Complete sample project</span>
            <strong>See what a filled MiseForge workspace can become.</strong>
            <p>
              Signal House is a read-only short-film sample with story docs, character and
              location bibles, scene packets, shot rows, prompt cards, sound notes, continuity, and
              production scheduling already filled in.
            </p>
          </div>
          <a className="button" data-analytics-area="demo_project" data-analytics-event="CTA Click" data-analytics-target="start_own_film" href="/app/start/idea">
            Start your own film
          </a>
        </div>

        <ProjectWorkspace
          draftText={draftText}
          documents={documents}
          entitlement={demoEntitlement}
          isReadOnlyDemo
          productionAssets={productionAssets}
          project={demoProject}
          sceneBreakdowns={sceneBreakdowns}
          userEmail="Public sample"
          onBack={() => {
            window.location.assign("/app");
          }}
          onDocumentsChange={setDocuments}
          onDraftChange={setDraftText}
          onProductionAssetsChange={setProductionAssets}
          onSceneBreakdownsChange={setSceneBreakdowns}
        />
      </section>
    </main>
  );
}
