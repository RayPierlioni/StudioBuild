import type Stripe from "stripe";

import { getSupabaseAdminClient } from "../../../../lib/supabase/server";
import { getStripeClient } from "../../../../lib/stripe";

export const dynamic = "force-dynamic";

type SubscriptionRecord = {
  currentPeriodEnd?: string;
  customerId?: string;
  email?: string;
  status: string;
  subscriptionId?: string;
  userId?: string;
};

type SubscriptionWriteResult = {
  count?: number | null;
  error: { message: string } | null;
};

function objectId(value: string | { id?: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? "";
}

function periodEnd(subscription: Stripe.Subscription) {
  const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

  return typeof currentPeriodEnd === "number" ? new Date(currentPeriodEnd * 1000).toISOString() : undefined;
}

async function saveSubscription(record: SubscriptionRecord) {
  if (!record.userId && !record.email) {
    throw new Error("Stripe event did not include a MiseForge user reference.");
  }

  const supabase = getSupabaseAdminClient();
  const fullRow = {
    current_period_end: record.currentPeriodEnd ?? null,
    email: record.email ?? "",
    plan: "founder_pro",
    status: record.status,
    stripe_customer_id: record.customerId ?? "",
    stripe_subscription_id: record.subscriptionId ?? "",
    updated_at: new Date().toISOString(),
    user_id: record.userId ?? "",
  };
  const ownerFullRow = {
    current_period_end: record.currentPeriodEnd ?? null,
    email: record.email ?? "",
    owner_id: record.userId ?? "",
    plan: "founder_pro",
    status: record.status,
    stripe_customer_id: record.customerId ?? "",
    stripe_subscription_id: record.subscriptionId ?? "",
    updated_at: new Date().toISOString(),
  };
  const minimalRow = {
    email: record.email ?? "",
    status: record.status,
    updated_at: new Date().toISOString(),
    user_id: record.userId ?? "",
  };
  const ownerMinimalRow = {
    email: record.email ?? "",
    owner_id: record.userId ?? "",
    status: record.status,
    updated_at: new Date().toISOString(),
  };
  const emailRow = {
    email: record.email ?? "",
    status: record.status,
    updated_at: new Date().toISOString(),
  };
  const bareRow = {
    status: record.status,
    user_id: record.userId ?? "",
  };

  const attempts: Array<() => Promise<SubscriptionWriteResult>> = [];

  const userId = record.userId;
  const email = record.email;

  if (userId) {
    attempts.push(
      async () => supabase.from("subscriptions").update(fullRow, { count: "exact" }).eq("user_id", userId).select("status"),
      async () =>
        supabase.from("subscriptions").update(minimalRow, { count: "exact" }).eq("user_id", userId).select("status"),
      async () =>
        supabase.from("subscriptions").update(ownerFullRow, { count: "exact" }).eq("owner_id", userId).select("status"),
      async () =>
        supabase
          .from("subscriptions")
          .update(ownerMinimalRow, { count: "exact" })
          .eq("owner_id", userId)
          .select("status"),
      async () => supabase.from("subscriptions").upsert(fullRow, { onConflict: "user_id" }),
      async () => supabase.from("subscriptions").upsert(minimalRow, { onConflict: "user_id" }),
      async () => supabase.from("subscriptions").upsert(bareRow, { onConflict: "user_id" }),
    );
  }

  if (email) {
    attempts.push(
      async () => supabase.from("subscriptions").update(emailRow, { count: "exact" }).eq("email", email).select("status"),
      async () => supabase.from("subscriptions").upsert(emailRow, { onConflict: "email" }),
    );
  }

  let lastError = "";

  for (const attempt of attempts) {
    const { count, error } = await attempt();

    if (!error && count !== 0) {
      return;
    }

    lastError = error?.message ?? "No matching subscription row.";
  }

  throw new Error(lastError || "Unable to save subscription status.");
}

async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") {
    return;
  }

  const stripe = getStripeClient();
  const subscriptionId = objectId(session.subscription);
  const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;

  await saveSubscription({
    currentPeriodEnd: subscription ? periodEnd(subscription) : undefined,
    customerId: objectId(session.customer) || (subscription ? objectId(subscription.customer) : ""),
    email: session.customer_details?.email ?? session.customer_email ?? session.metadata?.email ?? "",
    status: subscription?.status ?? "active",
    subscriptionId,
    userId: session.metadata?.user_id ?? session.client_reference_id ?? subscription?.metadata?.user_id,
  });
}

async function syncSubscription(subscription: Stripe.Subscription, fallbackStatus?: string) {
  await saveSubscription({
    currentPeriodEnd: periodEnd(subscription),
    customerId: objectId(subscription.customer),
    email: subscription.metadata?.email ?? "",
    status: fallbackStatus ?? subscription.status,
    subscriptionId: subscription.id,
    userId: subscription.metadata?.user_id,
  });
}

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
        await syncCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription, "canceled");
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
