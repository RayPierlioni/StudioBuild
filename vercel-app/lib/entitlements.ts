import type { User } from "@supabase/supabase-js";

import { isAdminEmail } from "./admin";
import { getSupabaseAdminClient } from "./supabase/server";

export type AccessEntitlement = {
  isAdmin: boolean;
  isPro: boolean;
  planLabel: "Admin" | "Founder Pro" | "Free";
  status: string;
};

const proStatuses = new Set(["active", "trialing", "paid", "pro", "founder", "admin"]);

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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

async function loadSubscriptionStatus({
  email,
  supabase,
  userId,
}: {
  email: string | null | undefined;
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  userId: string;
}) {
  const byUserId = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const userIdStatus = normalizeStatus(byUserId.data?.status);

  if (!byUserId.error && userIdStatus) {
    return userIdStatus;
  }

  const byOwnerId = await supabase
    .from("subscriptions")
    .select("status")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  const ownerIdStatus = normalizeStatus(byOwnerId.data?.status);

  if (!byOwnerId.error && ownerIdStatus) {
    return ownerIdStatus;
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return "";
  }

  const byEmail = await supabase
    .from("subscriptions")
    .select("status")
    .eq("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  return byEmail.error ? "" : normalizeStatus(byEmail.data?.status);
}

export async function getUserEntitlement(user: User): Promise<AccessEntitlement> {
  const supabase = getSupabaseAdminClient();
  const [profileRole, subscriptionStatus] = await Promise.all([
    loadProfileRole({ supabase, userId: user.id }),
    loadSubscriptionStatus({ email: user.email, supabase, userId: user.id }),
  ]);
  const isAdmin = isAdminEmail(user.email) || profileRole === "admin";
  const status = isAdmin ? "admin" : subscriptionStatus || "free";
  const isPro = isAdmin || proStatuses.has(status);

  return {
    isAdmin,
    isPro,
    planLabel: isAdmin ? "Admin" : isPro ? "Founder Pro" : "Free",
    status,
  };
}
