import { getVerifiedRequestUser } from "../../../../lib/auth";
import { getStripeClient } from "../../../../lib/stripe";
import { getSupabaseAdminClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type SubscriptionRow = {
  email?: string | null;
  status?: string | null;
  stripe_customer_id?: string | null;
};

function getBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    request.headers.get("origin") ||
    new URL(request.url).origin
  );
}

async function loadStoredCustomerId({
  email,
  userId,
}: {
  email: string | null | undefined;
  userId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const queries = [
    () => supabase.from("subscriptions").select("stripe_customer_id,email,status").eq("user_id", userId).limit(1).maybeSingle(),
    () => supabase.from("subscriptions").select("stripe_customer_id,email,status").eq("owner_id", userId).limit(1).maybeSingle(),
    () =>
      normalizedEmail
        ? supabase.from("subscriptions").select("stripe_customer_id,email,status").eq("email", normalizedEmail).limit(1).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
  ];

  for (const query of queries) {
    const { data, error } = (await query()) as { data: SubscriptionRow | null; error: { message: string } | null };

    if (!error && data?.stripe_customer_id) {
      return data.stripe_customer_id;
    }
  }

  return "";
}

async function loadStripeCustomerIdByEmail(email: string | null | undefined) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return "";
  }

  const stripe = getStripeClient();
  const customers = await stripe.customers.list({
    email: normalizedEmail,
    limit: 1,
  });

  return customers.data[0]?.id ?? "";
}

export async function POST(request: Request) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const stripe = getStripeClient();
    const customerId =
      (await loadStoredCustomerId({ email: user.email, userId: user.id })) ||
      (await loadStripeCustomerIdByEmail(user.email));

    if (!customerId) {
      return Response.json(
        {
          ok: false,
          error: "Billing management becomes available after checkout is completed for this account.",
        },
        { status: 404 },
      );
    }

    const baseUrl = getBaseUrl(request);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/app?billing=return`,
    });

    return Response.json({ ok: true, url: portalSession.url });
  } catch (error) {
    const message =
      error instanceof Error && error.message.toLowerCase().includes("supabase")
        ? "Sign in again before opening billing."
        : "Billing management is not available yet. Please try again shortly.";

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: message.startsWith("Sign in") ? 401 : 503 },
    );
  }
}
