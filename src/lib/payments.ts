export type PaymentProviderConfig = {
  stripeCheckoutEnabled: boolean;
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
  siteUrl: string;
};

export function getPaymentProviderConfig(
  requestUrl?: string,
): PaymentProviderConfig {
  const fallbackSiteUrl = requestUrl
    ? new URL(requestUrl).origin
    : "http://localhost:3000";
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? null;

  return {
    stripeCheckoutEnabled:
      process.env.STAYWISE_ENABLE_STRIPE_CHECKOUT === "true" &&
      Boolean(
        stripeSecretKey &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      ),
    stripeSecretKey,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl,
  };
}

export function isStripeCheckoutEnabled() {
  return getPaymentProviderConfig().stripeCheckoutEnabled;
}

export function getPaymentNotConfiguredMessage() {
  return "Secure checkout is being set up. Please try again later.";
}
