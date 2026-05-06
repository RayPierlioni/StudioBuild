# StudioBuild Vercel App

This is the Vercel-ready foundation for the real dynamic StudioBuild app.

The GitHub Pages demo stays online while this folder becomes the production architecture for:

- Supabase-backed users and projects
- Admin full-access sign-in
- Stripe `$12.99/month` Founder Pro subscriptions
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

- `/` - public product landing page with the no-cost Fix a Scene Free parser and Prompt Compiler
- `/api/health` - basic app health check
- `/api/db-status` - confirms the app can reach the StudioBuild Supabase auth service
- `/api/admin-db-check` - confirms the server-only Supabase key can reach protected tables
- `/api/billing/checkout` - opens Founder Pro subscription checkout for signed-in users
- `/api/billing/webhook` - receives billing events and updates subscription access
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

The public landing page now leads with the workflow-first product model: parse a rough scene, show
production readiness, generate a bring-your-own-AI prompt, and offer hosted StudioBuild AI as a
credit-based convenience path.

Founder Pro pricing is now positioned as `$12.99/month`. Set
`STRIPE_FOUNDER_PRO_MONTHLY_PRICE_ID` to a monthly Stripe Price ID before enabling checkout.

## Deployment Direction

When ready, create a Vercel project connected to the GitHub repository and set the root directory to:

```text
vercel-app
```
