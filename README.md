# Studiobuild

Studiobuild is a cinematic pre-production workspace for moving from a raw idea to synopsis, treatment, short story, script, and production breakdowns.

This first build is a static, local-first MVP designed for free GitHub Pages hosting. It uses browser storage for projects, Supabase Google login, an admin unlock, a simulated subscription state, and mock generation routines that mirror the eventual OpenAI-backed workflow.

The product promise is focused on a real AI filmmaking gap: visuals are getting cinematic, but pre-production still decides whether the film works. Studiobuild is designed to make aspiring AI filmmakers feel the need for a disciplined production system if they want to break in early and compete. It removes AI voice, improves highlighted script sections, teaches the pre-production pipeline, and turns ideas or imported scripts into scene breakdowns, character notes, shot lists, storyboard prep, and production packets.

## What Works Now

- Project creation and project switching
- Landing-page login flow with a Google sign-in option for the static prototype
- Free tier for project setup and core drafting
- Studio Pass paywall at `$4.99/week` for full access
- Filmmaker inspiration capture
- Pipeline stages: idea, synopsis, treatment, short story, script, breakdown
- Local persistence in `localStorage`
- Gated premium actions for script import, highlighted rewrites, dialogue passes, versions, breakdowns, production kit prompts, insert shots, and exports
- Script import for `.txt`, `.fountain`, and `.fdx`
- Highlighted script-section tools for improve, dialogue, and tightening passes
- Traditional script breakdowns plus an AI Production Kit for scene language, continuity, wardrobe, props, image prompts, animation prompts, and no-music sound design
- Workflow adapters for image, animation, sound, and editing tools
- Insert-shot prompt generation with editable ordering
- Fountain text export from the script editor
- GitHub Pages deployment workflow

## Why This Is Static

GitHub Pages can host frontend files for free, but it cannot safely run backend code or hide API keys. Real OpenAI generation, auth, Stripe billing, and database writes should be added through a backend later, such as Supabase Edge Functions, Vercel Functions, Cloudflare Workers, or another serverless API.

## Run Locally

Open `index.html` in a browser, or use the small static server:

```powershell
& "C:\Users\joeyp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools/dev-server.js
```

Then visit `http://localhost:4173`.

## Deploy Free On GitHub Pages

1. Create a new GitHub repository.
2. Add these files to the repository and push them to the `main` branch.
3. In GitHub, open `Settings -> Pages`.
4. Set `Build and deployment` to `GitHub Actions`.
5. Push to `main`; the included workflow deploys the site.

The published URL will usually be:

```text
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## Next Build Steps

The next production foundation now lives in `vercel-app`.

1. Deploy `vercel-app` to Vercel with the project root set to `vercel-app`.
2. Add Supabase database tables that match the product spec.
3. Replace mock generation in `src/generation.js` with real API calls to protected Vercel routes.
4. Add real Stripe checkout and webhook handling before enabling paid tiers.
5. Move premium generation behind a backend paywall so API calls are never made from the browser.

See `docs/vercel-migration-roadmap.md` for the step-by-step migration path.
