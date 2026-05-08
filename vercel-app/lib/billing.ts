import type Stripe from "stripe";

import { getStripeClient } from "./stripe";
import { getSupabaseAdminClient } from "./supabase/server";

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

export function stripeObjectId(value: string | { id?: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? "";
}

export function stripePeriodEnd(subscription: Stripe.Subscription) {
  const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

  return typeof currentPeriodEnd === "number" ? new Date(currentPeriodEnd * 1000).toISOString() : undefined;
}

export async function saveSubscription(record: SubscriptionRecord) {
  if (!record.userId && !record.email) {
    throw new Error("Stripe event did not include a MiseForge user reference.");
  }

  const supabase = getSupabaseAdminClient();
  const normalizedEmail = String(record.email ?? "").trim().toLowerCase();
  const updatedAt = new Date().toISOString();
  const fullRow = {
    current_period_end: record.currentPeriodEnd ?? null,
    email: normalizedEmail,
    plan: "founder_pro",
    status: record.status,
    stripe_customer_id: record.customerId ?? "",
    stripe_subscription_id: record.subscriptionId ?? "",
    updated_at: updatedAt,
    user_id: record.userId ?? "",
  };
  const ownerFullRow = {
    current_period_end: record.currentPeriodEnd ?? null,
    email: normalizedEmail,
    owner_id: record.userId ?? "",
    plan: "founder_pro",
    status: record.status,
    stripe_customer_id: record.customerId ?? "",
    stripe_subscription_id: record.subscriptionId ?? "",
    updated_at: updatedAt,
  };
  const minimalRow = {
    email: normalizedEmail,
    status: record.status,
    updated_at: updatedAt,
    user_id: record.userId ?? "",
  };
  const ownerMinimalRow = {
    email: normalizedEmail,
    owner_id: record.userId ?? "",
    status: record.status,
    updated_at: updatedAt,
  };
  const emailRow = {
    email: normalizedEmail,
    status: record.status,
    updated_at: updatedAt,
  };
  const bareRow = {
    status: record.status,
    user_id: record.userId ?? "",
  };

  const attempts: Array<() => Promise<SubscriptionWriteResult>> = [];

  if (record.userId) {
    attempts.push(
      async () =>
        supabase.from("subscriptions").update(fullRow, { count: "exact" }).eq("user_id", record.userId).select("status"),
      async () =>
        supabase.from("subscriptions").update(minimalRow, { count: "exact" }).eq("user_id", record.userId).select("status"),
      async () =>
        supabase.from("subscriptions").update(ownerFullRow, { count: "exact" }).eq("owner_id", record.userId).select("status"),
      async () =>
        supabase
          .from("subscriptions")
          .update(ownerMinimalRow, { count: "exact" })
          .eq("owner_id", record.userId)
          .select("status"),
      async () => supabase.from("subscriptions").upsert(fullRow, { onConflict: "user_id" }),
      async () => supabase.from("subscriptions").upsert(minimalRow, { onConflict: "user_id" }),
      async () => supabase.from("subscriptions").upsert(bareRow, { onConflict: "user_id" }),
    );
  }

  if (normalizedEmail) {
    attempts.push(
      async () => supabase.from("subscriptions").update(emailRow, { count: "exact" }).eq("email", normalizedEmail).select("status"),
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

function expandedSubscription(session: Stripe.Checkout.Session) {
  return typeof session.subscription === "object" && session.subscription && !("deleted" in session.subscription)
    ? (session.subscription as Stripe.Subscription)
    : null;
}

export function checkoutSessionUserId(session: Stripe.Checkout.Session) {
  return session.metadata?.user_id ?? session.client_reference_id ?? expandedSubscription(session)?.metadata?.user_id ?? "";
}

export async function syncCheckoutSessionSubscription(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") {
    return;
  }

  const stripe = getStripeClient();
  const subscriptionId = stripeObjectId(session.subscription);
  const subscription = expandedSubscription(session) ?? (subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null);

  await saveSubscription({
    currentPeriodEnd: subscription ? stripePeriodEnd(subscription) : undefined,
    customerId: stripeObjectId(session.customer) || (subscription ? stripeObjectId(subscription.customer) : ""),
    email: session.customer_details?.email ?? session.customer_email ?? session.metadata?.email ?? "",
    status: subscription?.status ?? "active",
    subscriptionId,
    userId: checkoutSessionUserId(session),
  });
}

export async function syncStripeSubscription(subscription: Stripe.Subscription, fallbackStatus?: string) {
  await saveSubscription({
    currentPeriodEnd: stripePeriodEnd(subscription),
    customerId: stripeObjectId(subscription.customer),
    email: subscription.metadata?.email ?? "",
    status: fallbackStatus ?? subscription.status,
    subscriptionId: subscription.id,
    userId: subscription.metadata?.user_id,
  });
}
