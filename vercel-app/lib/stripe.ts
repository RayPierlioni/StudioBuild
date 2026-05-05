import Stripe from "stripe";

import { requiredServerEnv } from "./env";

let cachedStripe: Stripe | null = null;

export function getStripeClient() {
  if (!cachedStripe) {
    cachedStripe = new Stripe(requiredServerEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-04-22.dahlia",
    });
  }

  return cachedStripe;
}
