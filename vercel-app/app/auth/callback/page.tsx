import { AuthReturnHandler } from "../../auth-handler";

export default function AuthCallbackPage() {
  return (
    <main className="app-shell auth-callback-shell">
      <section className="panel">
        <p className="eyebrow">StudioBuild Sign In</p>
        <h1>Opening your workspace...</h1>
        <p className="subtle">One moment while StudioBuild finishes your Google sign-in.</p>
        <AuthReturnHandler />
      </section>
    </main>
  );
}
