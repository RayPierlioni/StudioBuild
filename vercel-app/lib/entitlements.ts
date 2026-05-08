import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";

import { isAdminEmail } from "./admin";
import { getStripeClient } from "./stripe";
import { getSupabaseAdminClient } from "./supabase/server";

export type AccessEntitlement = {
  isAdmin: boolean;
  isPro: boolean;
  planLabel: "Admin" | "Founder Pro" | "Free";
  status: string;
};

type SubscriptionAccessRecord = {
  email?: string | null;
  plan?: string | null;
  status?: string | null;
  stripe_customer_id?: string | null;
  stripe_price_id?: string | null;
  stripe_subscription_id?: string | null;
};

const manualProStatuses = new Set(["paid", "pro", "founder"]);
const stripeProStatuses = new Set(["active", "trialing"]);
const profileProRoles = new Set(["subscriber", "pro", "founder"]);

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function currentFounderPriceId() {
  return process.env.STRIPE_FOUNDER_PRO_MONTHLY_PRICE_ID?.trim() ?? "";
}

function subscriptionPriceId(subscription: Stripe.Subscription) {
  const firstItem = (subscription as unknown as {
    items?: { data?: Array<{ price?: { id?: string } }> };
  }).items?.data?.[0];

  return firstItem?.price?.id ?? "";
}

async function loadProfileRole({
  supabase,
  userId,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  userId: string;
}) {
  const byId = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const idRole = normalizeStatus(byId.data?.role);

  if (!byId.error && idRole) {
    return idRole;
  }

  const byUserId = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle();

  return byUserId.error ? "" : normalizeStatus(byUserId.data?.role);
}

async function selectSubscriptionBy({
  field,
  supabase,
  value,
}: {
  field: "email" | "owner_id" | "user_id";
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  value: string;
}) {
  const selects = [
    "status,plan,stripe_subscription_id,stripe_price_id,stripe_customer_id,email",
    "status,plan,stripe_subscription_id,stripe_customer_id,email",
    "status,stripe_subscription_id,stripe_customer_id,email",
    "status",
  ];

  for (const columns of selects) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(columns)
      .eq(field, value)
      .limit(1)
      .maybeSingle();

    if (!error) {
      return (data ?? null) as SubscriptionAccessRecord | null;
    }
  }

  return null;
}

async function loadSubscriptionRecord({
  email,
  supabase,
  userId,
}: {
  email: string | null | undefined;
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  userId: string;
}) {
  const byUserId = await selectSubscriptionBy({ field: "user_id", supabase, value: userId });

  if (byUserId?.status) {
    return byUserId;
  }

  const byOwnerId = await selectSubscriptionBy({ field: "owner_id", supabase, value: userId });

  if (byOwnerId?.status) {
    return byOwnerId;
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  return selectSubscriptionBy({ field: "email", supabase, value: normalizedEmail });
}

async function stripeSubscriptionMatchesCurrentPrice(record: SubscriptionAccessRecord) {
  const expectedPriceId = currentFounderPriceId();

  if (!expectedPriceId) {
    return stripeProStatuses.has(normalizeStatus(record.status));
  }

  if (record.stripe_price_id) {
    return record.stripe_price_id === expectedPriceId;
  }

  if (!record.stripe_subscription_id) {
    return false;
  }

  try {
    const subscription = await getStripeClient().subscriptions.retrieve(record.stripe_subscription_id);

    return stripeProStatuses.has(normalizeStatus(subscription.status)) && subscriptionPriceId(subscription) === expectedPriceId;
  } catch {
    return false;
  }
}

async function subscriptionGrantsPro(record: SubscriptionAccessRecord | null) {
  const status = normalizeStatus(record?.status);

  if (!record || !status) {
    return false;
  }

  if (manualProStatuses.has(status)) {
    return true;
  }

  if (!stripeProStatuses.has(status)) {
    return false;
  }

  return stripeSubscriptionMatchesCurrentPrice(record);
}

export async function getUserEntitlement(user: User): Promise<AccessEntitlement> {
  const supabase = getSupabaseAdminClient();
  const [profileRole, subscriptionRecord] = await Promise.all([
    loadProfileRole({ supabase, userId: user.id }),
    loadSubscriptionRecord({ email: user.email, supabase, userId: user.id }),
  ]);
  const subscriptionStatus = normalizeStatus(subscriptionRecord?.status);
  const isAdmin = isAdminEmail(user.email) || profileRole === "admin";
  const profileHasPro = profileProRoles.has(profileRole);
  const subscriptionHasPro = await subscriptionGrantsPro(subscriptionRecord);
  const status = isAdmin ? "admin" : profileHasPro ? profileRole : subscriptionStatus || "free";
  const isPro = isAdmin || profileHasPro || subscriptionHasPro;

  return {
    isAdmin,
    isPro,
    planLabel: isAdmin ? "Admin" : isPro ? "Founder Pro" : "Free",
    status,
  };
}
