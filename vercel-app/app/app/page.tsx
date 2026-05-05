import { StudioWorkspace } from "../studio-workspace";

const guidePaths = [
  {
    href: "/app/start/idea",
    label: "Have an idea for a film?",
    text: "Start with a project shell. Shape the premise, genre, tone, logline, and first story beat before anything gets messy.",
  },
  {
    href: "/app/start/script",
    label: "Already have a script?",
    text: "Paste or import pages, then move into scene packets, breakdowns, shot lists, prompt cards, and production notes.",
  },
  {
    href: "/app/start/breakdown",
    label: "Need a breakdown?",
    text: "Use the pipeline to organize characters, props, wardrobe, sound, locations, inserts, and export-ready production packets.",
  },
];

export default function AppHome() {
  return (
    <main className="app-shell">
      <header className="app-topbar">
        <a className="brand-link" href="/">
          STUDIOBUILD
        </a>
        <nav aria-label="App navigation">
          <a href="/">Landing</a>
          <a href="#workspace-dashboard">Dashboard</a>
        </nav>
      </header>

      <section className="app-guide" aria-label="StudioBuild guide">
        <div className="guide-character" aria-hidden="true">
          <div className="guide-speech">Have an idea, script, or scene? Start here.</div>
          <div className="guide-antenna" />
          <div className="guide-head">
            <span />
            <span />
          </div>
          <div className="guide-body">
            <div className="guide-book" />
          </div>
        </div>
        <div className="guide-copy">
          <p className="eyebrow">StudioBuild Guide</p>
          <h1>What are you building today?</h1>
          <p>
            I’ll help you turn a loose idea, rough script, or unfinished scene into a clear
            pre-production path.
          </p>
          <div className="guide-paths">
            {guidePaths.map((path) => (
              <a href={path.href} key={path.label}>
                <strong>{path.label}</strong>
                <span>{path.text}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="workspace-dashboard" className="app-workspace">
        <StudioWorkspace />
      </section>
    </main>
  );
}
