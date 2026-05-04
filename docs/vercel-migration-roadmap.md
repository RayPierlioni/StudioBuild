# StudioBuild Vercel Migration Roadmap

## Why We Are Moving Beyond GitHub Pages

GitHub Pages is enough for the public demo, but it cannot safely run backend code. StudioBuild needs backend routes for private API keys, payments, database writes, and admin-only logic.

The production direction is:

```text
Vercel app hosting + Vercel server functions + Supabase database/auth + Stripe billing
```

## Phase 1: Vercel Foundation

- Keep the GitHub Pages demo live.
- Add `vercel-app` as the new dynamic app folder.
- Connect Vercel to the GitHub repository.
- Set Vercel root directory to `vercel-app`.
- Add environment variables in Vercel.
- Deploy the foundation screen and `/api/health`.

## Phase 2: Supabase Data Model

Create Supabase tables for:

- `profiles`
- `projects`
- `documents`
- `script_versions`
- `scene_breakdowns`
- `production_assets`
- `subscriptions`

Keep row-level security on and make policies user-owned by default. Admin access should be server-verified, not only client-side.

## Phase 3: Real Authentication

- Replace local-only app state with Supabase sessions.
- Persist projects per user.
- Keep `rpierlioni@gmail.com` as admin.
- Show admin controls only after the server verifies the signed-in user.

## Phase 4: Secure AI Generation

Move generation from browser mock functions to Vercel routes:

- `/api/generate/idea`
- `/api/generate/script-pass`
- `/api/generate/breakdown`
- `/api/generate/production-kit`

The browser sends project context. The server calls the AI provider with private keys.

## Phase 5: Stripe

- Create the `$4.99/week` recurring product in Stripe.
- Add checkout from the app.
- Add a Stripe webhook route.
- Store subscription state in Supabase.
- Let admin bypass paid checks.

## Phase 6: Production App Pages

Split the app into real routes:

- `/` landing page
- `/login`
- `/app`
- `/app/projects`
- `/app/projects/[projectId]`
- `/app/projects/[projectId]/script`
- `/app/projects/[projectId]/breakdown`
- `/account`
- `/admin`

## Immediate Next Step

Deploy `vercel-app` to Vercel as a preview, then verify:

- `/` loads
- `/api/health` returns JSON
- Vercel environment variables are visible as configured flags, not exposed secrets
