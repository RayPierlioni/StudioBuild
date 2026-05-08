import { getVerifiedRequestUser } from "../../../../lib/auth";
import { getUserEntitlement } from "../../../../lib/entitlements";
import { getStripeClient } from "../../../../lib/stripe";

export const dynamic = "force-dynamic";

const FALLBACK_SITE_URL = "https://miseforge.com";
const ALLOWED_SITE_HOSTS = new Set([
  "miseforge.com",
  "www.miseforge.com",
  "studio-build-raypierlionis-projects.vercel.app",
  "studio-build-git-main-raypierlionis-projects.vercel.app",
]);

function normalizeAllowedBaseUrl(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const isLocalhost = url.hostname === "localhost";
    const isVercelPreview = url.hostname.endsWith("-raypierlionis-projects.vercel.app");
    const isAllowedHost = ALLOWED_SITE_HOSTS.has(url.hostname) || isVercelPreview || isLocalhost;
    const isAllowedProtocol = url.protocol === "https:" || isLocalhost;

    return isAllowedHost && isAllowedProtocol ? url.origin : "";
  } catch {
    return "";
  }
}

function getBaseUrl(request: Request) {
  return (
    normalizeAllowedBaseUrl(request.headers.get("origin")) ||
    normalizeAllowedBaseUrl(new URL(request.url).origin) ||
    normalizeAllowedBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    FALLBACK_SITE_URL
  );
}

export async function POST(request: Request) {
  try {
    const { user } = await getVerifiedRequestUser(request);
    const entitlement = await getUserEntitlement(user);
    const priceId = process.env.STRIPE_FOUNDER_PRO_MONTHLY_PRICE_ID;

    if (entitlement.isPro) {
      return Response.json(
        {
          ok: false,
          alreadyPro: true,
          error: "Founder Pro is already unlocked for this account.",
        },
        { status: 409 },
      );
    }

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
      success_url: `${baseUrl}/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
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
