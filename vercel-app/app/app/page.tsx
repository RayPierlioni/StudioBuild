import { AuthReturnHandler } from "../auth-handler";
import { MiniPhilosopherGuide, StudioWorkspace, type GuideAssistantContext } from "../studio-workspace";

const guidePaths = [
  {
    href: "/app/start/idea",
    label: "I have an idea",
    text: "Shape the premise, genre, tone, logline, and first story pressure point.",
  },
  {
    href: "/app/start/script",
    label: "I have a script",
    text: "Bring in pages, parse the scenes, and move into rewrite and breakdown work.",
  },
  {
    href: "/app/start/breakdown",
    label: "I need a breakdown",
    text: "Turn one scene into props, wardrobe, sound, shots, prompts, and continuity notes.",
  },
  {
    href: "/app/start/characters",
    label: "I need consistency",
    text: "Build character bibles, location bibles, and visual rules before generating shots.",
  },
  {
    href: "/app/start/packet",
    label: "I need a packet",
    text: "Move toward an exportable production packet with shots, sound, prompts, and continuity.",
  },
];

const pipelineStages = [
  { mode: "idea", stage: "Idea", detail: "Premise, hook, story engine" },
  { mode: "treatment", stage: "Treatment", detail: "Theme, structure, emotional turns" },
  { mode: "characters", stage: "Characters", detail: "Look, wardrobe, speech, continuity" },
  { mode: "locations", stage: "Locations", detail: "Layout, palette, dressing, risks" },
  { mode: "lookbook", stage: "Look Book", detail: "Palette, lighting, camera, motifs" },
  { mode: "script", stage: "Script", detail: "Pages, dialogue, AI voice cleanup" },
  { mode: "breakdown", stage: "Scene Breakdown", detail: "Props, cast, sound, blocking" },
  { mode: "shotlist", stage: "Shot List", detail: "Coverage, inserts, camera intent" },
  { mode: "schedule", stage: "Production Schedule", detail: "Generation order, review gates" },
  { mode: "sound", stage: "Sound Map", detail: "Room tone, effects, dialogue needs" },
  { mode: "prompts", stage: "Prompt Cards", detail: "Image, animation, sound prompts" },
  { mode: "packet", stage: "Production Packet", detail: "Export-ready film plan" },
];

const dashboardGuideContext: GuideAssistantContext = {
  activeStageLabel: "Dashboard",
  assetCount: 0,
  body:
    "Pick the place where your film already exists. MiseForge will open the right room first, then keep the rest of the production system organized around it.",
  chips: ["Idea", "Script", "Scene", "Packet"],
  eyebrow: "MiseForge Guide",
  nextAction: "Choose the start path that matches what you already have",
  planLabel: "Free",
  projectTitle: "New film",
  readinessScore: 0,
  sceneCount: 0,
  speech: "Have an idea for a film? Start there. Already have pages, a scene, or a production mess? Bring that in instead.",
  title: "Start where your film is today.",
};

export default function AppHome() {
  return (
    <main className="app-shell command-app-shell">
      <AuthReturnHandler fallbackNext="/app" quiet />
      <header className="app-topbar command-topbar">
        <a className="brand-link" href="/">
          MISEFORGE
        </a>
        <nav aria-label="App navigation">
          <a href="/">Landing</a>
          <a href="/app/start/idea">New Film</a>
          <a href="/app/start/script">Import Script</a>
          <a href="/app/start/breakdown">Breakdown</a>
        </nav>
      </header>

      <section className="command-layout" aria-label="MiseForge command center">
        <aside className="command-sidebar" aria-label="Pre-production pipeline">
          <div className="sidebar-brand-block">
            <span>Production spine</span>
            <strong>Start anywhere. Keep the film organized.</strong>
            <p>Open the room you need now, then use the spine to move through story, continuity, shots, sound, and export.</p>
          </div>
          <nav className="pipeline-nav" aria-label="MiseForge pipeline">
            {pipelineStages.map(({ detail, mode, stage }, index) => (
              <a
                className={index === 0 ? "active" : index < 5 ? "complete" : "upcoming"}
                href={`/app/start/${mode}`}
                key={stage}
              >
                <span className="pipeline-index">{String(index + 1).padStart(2, "0")}</span>
                <strong>{stage}</strong>
                <small>{detail}</small>
              </a>
            ))}
          </nav>
        </aside>

        <section id="workspace-dashboard" className="command-main">
          <div className="command-main-head">
            <p className="eyebrow">MiseForge command center</p>
            <h1>Start where your film is today.</h1>
            <p>
              Bring an idea, rough pages, a single scene, a character problem, or an existing
              production packet. MiseForge turns the starting point into a structured film workspace.
            </p>
          </div>
          <StudioWorkspace />
        </section>

        <aside className="command-guide-panel" aria-label="MiseForge guide">
          <MiniPhilosopherGuide compact context={dashboardGuideContext} routes={guidePaths} />
        </aside>
      </section>
    </main>
  );
}
