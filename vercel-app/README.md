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
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Current Routes

- `/` - Vercel foundation screen
- `/api/health` - checks which environment variable groups are configured
- `/api/db-status` - confirms the app can reach the StudioBuild Supabase auth service
- `/api/generate` - reserved backend route for future protected AI generation

## Deployment Direction

When ready, create a Vercel project connected to the GitHub repository and set the root directory to:

```text
vercel-app
```
