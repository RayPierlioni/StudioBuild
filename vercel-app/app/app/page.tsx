import { MiniPhilosopherGuide, StudioWorkspace, type GuideAssistantContext } from "../studio-workspace";

const guidePaths = [
  {
    href: "/app/start/idea",
    label: "Start from an idea",
    text: "Shape the premise, genre, tone, logline, and first story pressure point.",
  },
  {
    href: "/app/start/script",
    label: "Import a script",
    text: "Bring in pages, parse the scenes, and move into rewrite and breakdown work.",
  },
  {
    href: "/app/start/breakdown",
    label: "Break down a scene",
    text: "Turn one scene into props, wardrobe, sound, shots, prompts, and continuity notes.",
  },
];

const pipelineStages = [
  ["Idea", "Premise, hook, story engine"],
  ["Treatment", "Theme, structure, emotional turns"],
  ["Characters", "Look, wardrobe, speech, continuity"],
  ["Locations", "Layout, palette, dressing, risks"],
  ["Look Book", "Palette, lighting, camera, motifs"],
  ["Script", "Pages, dialogue, AI voice cleanup"],
  ["Scene Breakdown", "Props, cast, sound, blocking"],
  ["Shot List", "Coverage, inserts, camera intent"],
  ["Production Schedule", "Generation order, review gates"],
  ["Sound Map", "Room tone, effects, dialogue needs"],
  ["Prompt Cards", "Image, animation, sound prompts"],
  ["Production Packet", "Export-ready film plan"],
];

const dashboardGuideContext: GuideAssistantContext = {
  activeStageLabel: "Dashboard",
  assetCount: 0,
  body:
    "Pick the way your film enters StudioBuild, then I will keep explaining why each production layer matters and what to do next.",
  chips: ["Idea", "Script", "Breakdown"],
  eyebrow: "StudioBuild Guide",
  nextAction: "Choose idea, script, or breakdown start path",
  planLabel: "Free",
  projectTitle: "New film",
  readinessScore: 0,
  sceneCount: 0,
  speech: "Have an idea for a film? Start here. Already have pages? Bring them in.",
  title: "Tell me where you are starting.",
};

export default function AppHome() {
  return (
    <main className="app-shell command-app-shell">
      <header className="app-topbar command-topbar">
        <a className="brand-link" href="/">
          STUDIOBUILD
        </a>
        <nav aria-label="App navigation">
          <a href="/">Landing</a>
          <a href="/app/start/idea">New Film</a>
          <a href="/app/start/script">Import Script</a>
          <a href="/app/start/breakdown">Breakdown</a>
        </nav>
      </header>

      <section className="command-layout" aria-label="StudioBuild command center">
        <aside className="command-sidebar" aria-label="Pre-production pipeline">
          <div className="sidebar-brand-block">
            <span>Production spine</span>
            <strong>Build the film in order.</strong>
            <p>Move from story discipline into the production details that keep an AI film consistent.</p>
          </div>
          <nav className="pipeline-nav" aria-label="StudioBuild pipeline">
            {pipelineStages.map(([stage, detail], index) => (
              <a href="#workspace-dashboard" key={stage}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{stage}</strong>
                <small>{detail}</small>
              </a>
            ))}
          </nav>
        </aside>

        <section id="workspace-dashboard" className="command-main">
          <div className="command-main-head">
            <p className="eyebrow">StudioBuild command center</p>
            <h1>Start the project, then build the production system around it.</h1>
            <p>
              Create a project shell, open a saved film, or pick a guided path. StudioBuild keeps
              the work organized from first idea through production packet.
            </p>
          </div>
          <StudioWorkspace />
        </section>

        <aside className="command-guide-panel" aria-label="StudioBuild guide">
          <MiniPhilosopherGuide compact context={dashboardGuideContext} routes={guidePaths} />
        </aside>
      </section>
    </main>
  );
}
