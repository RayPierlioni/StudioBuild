import { StudioWorkspace } from "./studio-workspace";

const heroImageUrl = "/cinematic-hero.webp";

const foundationTiles = [
  ["01", "Vercel will host the real app shell, routes, and server functions."],
  ["02", "Supabase will store users, projects, scripts, breakdowns, and admin status."],
  ["03", "Stripe will enforce the $4.99/week Studio Pass for non-admin users."],
  ["04", "AI calls will move behind protected API routes so secrets never touch the browser."],
];

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <img src={heroImageUrl} alt="" />
        <div className="brand">
          <img className="mark" src="/favicon.svg" alt="" />
          <span>STUDIOBUILD</span>
        </div>
        <div className="hero-copy">
          <p className="kicker">Vercel foundation</p>
          <h1>The real app starts here.</h1>
          <p>
            GitHub Pages proved the demo. This Vercel foundation gives StudioBuild the server-side
            room it needs for saved projects, subscriptions, secure AI, and a real production pipeline.
          </p>
        </div>
      </section>

      <section className="workspace">
        <div className="topline">
          <span className="pill">Live Vercel app</span>
          <span className="pill">Database-backed saves</span>
        </div>

        <StudioWorkspace />

        <article className="panel">
          <h2>Next build target</h2>
          <p>
            This is the live Vercel version of StudioBuild. Use the workspace above for real
            database-backed saves; the older GitHub Pages demo is now only a visual reference.
          </p>
          <div className="actions" style={{ marginTop: 22 }}>
            <a className="button secondary" href="/api/health">
              Check API Health
            </a>
            <a className="button secondary" href="/api/db-status">
              Check Database Status
            </a>
            <a className="button secondary" href="/api/admin-db-check">
              Check Admin DB Key
            </a>
          </div>
        </article>

        <section className="grid" aria-label="Foundation steps">
          {foundationTiles.map(([number, text]) => (
            <article className="tile" key={number}>
              <span>{number}</span>
              <strong>{text}</strong>
            </article>
          ))}
        </section>

        <article className="panel">
          <h2>Backend checkpoint</h2>
          <p>
            The first server route is <code>/api/health</code>. The database handshake route is{" "}
            <code>/api/db-status</code>. The server-only admin key check is{" "}
            <code>/api/admin-db-check</code>. The reserved generation route is{" "}
            <code>/api/generate</code>. Once Vercel environment variables are connected, those routes
            become the safe place for OpenAI, Stripe, and service-role Supabase calls.
          </p>
        </article>
      </section>
    </main>
  );
}
