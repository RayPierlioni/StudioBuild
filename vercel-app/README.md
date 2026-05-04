# StudioBuild Vercel App

This is the Vercel-ready foundation for the real dynamic StudioBuild app.

The GitHub Pages demo stays online while this folder becomes the production architecture for:

- Supabase-backed users and projects
- Admin full-access sign-in
- Stripe `$4.99/week` subscriptions
- Protected server-side AI generation
- Multi-page app workflows

## Local Commands

After installing dependencies:

```powershell
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill values locally. On Vercel, add the same variables in Project Settings.

Never commit real values for:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` defaults to `gpt-5.5` if omitted
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Current Routes

- `/` - Vercel foundation screen
- `/api/health` - checks which environment variable groups are configured
- `/api/db-status` - confirms the app can reach the StudioBuild Supabase auth service
- `/api/admin-db-check` - confirms the server-only Supabase key can reach protected tables
- `/api/projects` - authenticated project list/create route backed by Supabase
- `/api/projects/[projectId]` - authenticated single-project loader
- `/api/projects/[projectId]/documents` - saves editable stage drafts per project
- `/app/projects/[projectId]` - project command center route
- `/api/generate` - protected StudioBuild AI route for treatments, scripts, breakdowns, prompt
  plans, dialogue polish, improvement passes, structure passes, and insert shots

Successful project saves show the saved Supabase project ID in the browser so the database write can
be verified immediately.

Saved project cards are normal links to a project command center route with the writing room,
production pipeline, and protected AI action buttons.

Pipeline stages are clickable. AI generation and manual draft saves both write editable stage
documents back to Supabase.

## Deployment Direction

When ready, create a Vercel project connected to the GitHub repository and set the root directory to:

```text
vercel-app
```
