import { AuthReturnHandler } from "./auth-handler";
import { SceneFixDemo } from "./scene-fix-demo";

const heroImageUrl = "/cinematic-hero.webp";

const deliverables = [
  ["Rough scene", "rewrite, scene purpose, emotional turn, and production notes"],
  ["Imported script", "scene count, locations, speaking characters, and readiness gaps"],
  ["Finished scene", "props, wardrobe, sound, blocking, insert shots, and continuity needs"],
  ["Production need", "image prompts, animation prompts, sound prompts, and exportable packets"],
];

const workflowPhases = [
  ["Develop", "Idea, logline, synopsis, and treatment"],
  ["Write", "Script import, rewrite prompts, dialogue rubrics, and AI voice removal"],
  ["Produce", "Scene cards, shot needs, prompt packs, and production packet export"],
];

const pricingCards = [
  ["Free", "$0", "One project, one scene-packet preview, basic prompt copying, and Markdown export."],
  [
    "Founder Pro",
    "$12.99/mo",
    "Multiple projects, full-script parsing, production board, shot lists, prompt cards, version history, and premium PDF packets.",
  ],
  ["Project Pass", "$9/project", "One production packet for filmmakers who think in films, not weeks."],
];

export default function Home() {
  return (
    <main className="shell">
      <AuthReturnHandler quiet />
      <section className="hero">
        <img src={heroImageUrl} alt="" />
        <div className="landing-nav">
          <div className="brand">
            <img className="mark" src="/favicon.svg" alt="" />
            <span>STUDIOBUILD</span>
          </div>
          <nav aria-label="StudioBuild sections">
            <a href="#fix-scene">Demo</a>
            <a href="#pricing">Pricing</a>
            <a href="/app">Open App</a>
          </nav>
        </div>
        <div className="hero-copy">
          <p className="kicker">Pre-production for AI filmmakers</p>
          <h1>Make AI scripts stop sounding like AI.</h1>
          <p>
            StudioBuild turns rough AI film ideas and scripts into treatments, scene breakdowns,
            shot plans, and prompt-ready production packets so your film has story logic before you
            generate a single shot.
          </p>
          <div className="hero-actions">
            <a className="button" href="#fix-scene">
              Fix a Scene Free
            </a>
            <a className="button secondary ghost" href="/app">
              Open App
            </a>
          </div>
          <div className="hero-chips" aria-label="StudioBuild focus">
            <span>Remove AI voice</span>
            <span>Build scene logic</span>
            <span>Map production needs</span>
            <span>Generate prompt packs</span>
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="topline">
          <span className="pill">Workflow-first</span>
          <span className="pill">Production-ready packets</span>
        </div>

        <SceneFixDemo />

        <article className="panel" id="what-you-get">
          <p className="eyebrow">What StudioBuild Gives You</p>
          <h2>Concrete film outputs, not another blank prompt box.</h2>
          <div className="deliverable-grid">
            {deliverables.map(([input, output]) => (
              <article className="deliverable-card" key={input}>
                <span>{input}</span>
                <strong>{output}</strong>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Workflow Path</p>
          <h2>From rough idea to production packet.</h2>
          <div className="phase-grid">
            {workflowPhases.map(([phase, text]) => (
              <article className="phase-card" key={phase}>
                <span>{phase}</span>
                <strong>{text}</strong>
              </article>
            ))}
          </div>
        </article>

        <article className="panel pricing-panel" id="pricing">
          <p className="eyebrow">Pricing Direction</p>
          <h2>Start free. Upgrade when the workflow saves real time.</h2>
          <p>
            Start with one project and a scene-packet preview. Upgrade when you want the complete
            pre-production system: full-script parsing, production boards, shot lists, prompt cards,
            version history, and premium production packets.
          </p>
          <div className="pricing-grid">
            {pricingCards.map(([name, price, text]) => (
              <article className="pricing-card" key={name}>
                <span>{name}</span>
                <strong>{price}</strong>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
