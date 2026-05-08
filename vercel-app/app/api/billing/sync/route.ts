import type Stripe from "stripe";

import { getVerifiedRequestUser } from "../../../../lib/auth";
import { checkoutSessionUserId, syncCheckoutSessionSubscription } from "../../../../lib/billing";
import { getUserEntitlement } from "../../../../lib/entitlements";
import { getStripeClient } from "../../../../lib/stripe";

export const dynamic = "force-dynamic";

type BillingSyncPayload = {
  checkoutSessionId?: string;
  sessionId?: string;
};

function cleanCheckoutSessionId(value: unknown) {
  return typeof value === "string" && value.trim().startsWith("cs_") ? value.trim() : "";
}

async function readPayload(request: Request) {
  try {
    return (await request.json()) as BillingSyncPayload;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const payload = await readPayload(request);
    const sessionId =
      cleanCheckoutSessionId(payload.checkoutSessionId) ||
      cleanCheckoutSessionId(payload.sessionId) ||
      cleanCheckoutSessionId(new URL(request.url).searchParams.get("session_id"));

    if (!sessionId) {
      return Response.json({ ok: false, error: "Missing Stripe checkout session ID." }, { status: 400 });
    }

    const stripe = getStripeClient();
    const checkoutSession = (await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })) as Stripe.Checkout.Session;
    const sessionUserId = checkoutSessionUserId(checkoutSession);

    if (sessionUserId !== user.id) {
      return Response.json({ ok: false, error: "Checkout session does not belong to this account." }, { status: 403 });
    }

    if (checkoutSession.mode !== "subscription") {
      return Response.json({ ok: false, error: "Checkout session is not a Founder Pro subscription." }, { status: 400 });
    }

    if (checkoutSession.status !== "complete") {
      return Response.json({ ok: false, error: "Checkout is not complete yet." }, { status: 409 });
    }

    await syncCheckoutSessionSubscription(checkoutSession);

    const entitlement = await getUserEntitlement(user);

    return Response.json({
      ok: true,
      checkoutStatus: checkoutSession.status,
      entitlement,
      paymentStatus: checkoutSession.payment_status,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.toLowerCase().includes("supabase")
        ? "Sign in again before confirming billing."
        : error instanceof Error
          ? error.message
          : "Unable to confirm billing.";

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: message.startsWith("Sign in") ? 401 : 503 },
    );
  }
}
