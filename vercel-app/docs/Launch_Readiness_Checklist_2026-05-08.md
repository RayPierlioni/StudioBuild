# MiseForge Launch Readiness Checklist

Date: May 8, 2026

Goal: stop treating MiseForge as an endless build and move it into a professional beta that can accept real traffic, real signups, and real Founder Pro purchases.

## Launch Definition

MiseForge is launch-ready when a new visitor can:

- Understand the promise in the first viewport.
- Open the complete Signal House sample project.
- Start a free project with Google sign-in.
- Save at least one useful scene packet.
- Understand why Founder Pro is worth paying for.
- Upgrade through Stripe checkout.
- Export a production packet that feels like a serious film artifact.

## Instrumented Funnel

These events are now tracked through Vercel Web Analytics custom events:

- `CTA Click`: landing navigation, hero CTAs, sample project CTAs, pricing CTAs, demo CTAs.
- `Pricing Click`: free and Founder Pro pricing actions.
- `Auth Intent`: app and project sign-in intent.
- `Checkout Intent`: Founder Pro checkout attempts.
- `Project Created`: successful project creation, grouped by start path and plan.
- `Scene Packet Saved`: successful scene-packet save, grouped by active room and plan.
- `Export Click`: copy packet, Markdown export, and premium PDF export attempts.

## Before Paid Traffic

- Confirm Vercel Web Analytics is enabled for `miseforge.com`.
- Confirm Stripe live mode products, monthly Founder Pro price, portal, and webhook are live.
- Confirm Google OAuth redirect URLs include `https://miseforge.com`.
- Confirm Supabase production tables and policies match the deployed app.
- Confirm admin access still works for `rpierlioni@gmail.com`.
- Confirm checkout success returns to `/app?checkout=success`.
- Confirm a non-admin free account can create one project and hits the right upgrade gates.
- Confirm a paid account can access multiple projects, shot lists, prompt cards, and premium export.

## Launch Fence

Do not block launch for:

- Hosted AI generation.
- The $9 Project Pass checkout.
- Additional demo projects.
- Full component refactors.
- Perfect mobile polish.
- More production rooms.

These can ship after traffic starts.

## Recommended First Marketing Test

Run a small organic/beta push before paid ads:

- Share the Signal House demo.
- Ask filmmakers to start one free project.
- Watch event flow from landing CTA to project creation to scene-packet save.
- Look for the first conversion pressure point: export click, second-project attempt, or premium PDF preview.

## Success Signals

Early signal is not just revenue. The product is working if:

- Visitors open the sample project.
- Users create projects after seeing the demo.
- Users save scene packets without help.
- Users click export or premium PDF preview.
- Free users hit Pro gates after doing meaningful work.
- At least one user upgrades without a manual walkthrough.
