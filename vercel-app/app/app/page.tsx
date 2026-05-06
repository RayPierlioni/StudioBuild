import { StudioWorkspace } from "../studio-workspace";

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
  ["Sound Map", "Room tone, effects, dialogue needs"],
  ["Prompt Cards", "Image, animation, sound prompts"],
  ["Production Packet", "Export-ready film plan"],
];

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
          <div className="guide-character small" aria-hidden="true">
            <div className="guide-speech">Choose the fastest route to a usable production packet.</div>
            <div className="guide-antenna" />
            <div className="guide-head">
              <span />
              <span />
            </div>
            <div className="guide-body">
              <div className="guide-book" />
            </div>
          </div>

          <div className="guide-stage-card">
            <span>Next best action</span>
            <strong>Pick the way your film enters StudioBuild.</strong>
            <p>
              Start from an idea, import pages you already have, or break down a single scene into
              production-ready pieces.
            </p>
          </div>

          <div className="guide-route-list">
            {guidePaths.map((path) => (
              <a href={path.href} key={path.href}>
                <strong>{path.label}</strong>
                <span>{path.text}</span>
              </a>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
