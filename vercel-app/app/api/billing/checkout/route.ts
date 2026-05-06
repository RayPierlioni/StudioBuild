import { getVerifiedRequestUser } from "../../../../lib/auth";
import { getStripeClient } from "../../../../lib/stripe";

export const dynamic = "force-dynamic";

function getBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    request.headers.get("origin") ||
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const priceId = process.env.STRIPE_FOUNDER_PRO_MONTHLY_PRICE_ID;

    if (!priceId) {
      return Response.json(
        {
          ok: false,
          error: "Founder Pro monthly checkout is not available yet. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    const baseUrl = getBaseUrl(request);
    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      cancel_url: `${baseUrl}/app?checkout=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        email: user.email ?? "",
        plan: "founder_pro",
        user_id: user.id,
      },
      mode: "subscription",
      subscription_data: {
        metadata: {
          email: user.email ?? "",
          plan: "founder_pro",
          user_id: user.id,
        },
      },
      success_url: `${baseUrl}/app?checkout=success`,
    });

    if (!checkoutSession.url) {
      return Response.json({ ok: false, error: "Checkout could not open. Please try again shortly." }, { status: 502 });
    }

    return Response.json({ ok: true, url: checkoutSession.url });
  } catch (error) {
    const message =
      error instanceof Error && error.message.toLowerCase().includes("supabase")
        ? "Sign in again before opening checkout."
        : "Checkout is not available yet. Please try again shortly.";

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: message.startsWith("Sign in") ? 401 : 503 },
    );
  }
}
