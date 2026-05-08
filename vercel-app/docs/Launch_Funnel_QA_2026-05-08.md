# MiseForge Launch Funnel QA

Date: May 8, 2026

Purpose: confirm the app can accept real beta traffic without losing users between signup, free value, checkout, and Pro access.

## Automated Hardening Added

- Stripe Checkout now returns to `/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`.
- `/api/billing/sync` verifies the returned Checkout Session belongs to the signed-in Supabase user.
- The app syncs the subscription immediately after checkout success, then refreshes project entitlement.
- The existing Stripe webhook still handles ongoing subscription created, updated, and canceled events.
- Checkout is blocked server-side for accounts that already have Pro/Admin access to prevent accidental duplicate subscriptions.

## Manual Non-Admin Test

Use a Google account that is not `rpierlioni@gmail.com`.

1. Open `https://miseforge.com/app?fresh=<commit>`.
2. Sign in with Google.
3. Confirm the plan badge says `Free`.
4. Create one project from `/app/start/idea`.
5. Confirm the project saves and opens.
6. Try to create a second project.
7. Confirm the free-project limit asks for Founder Pro.
8. Click Upgrade to Founder Pro.
9. Complete Stripe checkout.
10. Confirm the app returns to `/app?checkout=success&session_id=...`.
11. Confirm the page changes to Founder Pro without needing manual support.
12. Open the paid project and confirm Pro rooms, shot-list prompts, version history, production board, and Premium Packet Preview are available.
13. Open Manage billing and confirm the Stripe portal opens.
14. Return from the portal and confirm the app still shows Founder Pro.

## Failure Checks

- If checkout succeeds but the plan stays Free, inspect `/api/billing/sync` and the Stripe webhook event.
- If `/api/billing/sync` returns account mismatch, make sure the same Google account completed checkout.
- If billing portal does not open, confirm the `subscriptions` row has a Stripe customer ID or the Stripe customer email matches the signed-in email.
- If a canceled subscription still shows Pro, confirm the `customer.subscription.deleted` webhook reached `/api/billing/webhook`.

## Launch Pass Criteria

- One free project works.
- Second project hits the Pro gate.
- Stripe Checkout opens from the app.
- Checkout return unlocks Pro automatically.
- Billing portal opens after purchase.
- Premium Packet Preview is available only to Pro/Admin.
