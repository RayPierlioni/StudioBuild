import type Stripe from "stripe";

import { syncCheckoutSessionSubscription, syncStripeSubscription } from "../../../../lib/billing";
import { getStripeClient } from "../../../../lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return Response.json({ ok: false, error: "Billing webhook is not available." }, { status: 503 });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return Response.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid Stripe webhook signature.",
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncCheckoutSessionSubscription(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncStripeSubscription(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await syncStripeSubscription(event.data.object as Stripe.Subscription, "canceled");
        break;
      default:
        break;
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process Stripe webhook.",
      },
      { status: 500 },
    );
  }
}
