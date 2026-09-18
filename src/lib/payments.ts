export type PaymentProviderConfig = {
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
  siteUrl: string;
};

export function getPaymentProviderConfig(requestUrl?: string): PaymentProviderConfig {
  const fallbackSiteUrl = requestUrl ? new URL(requestUrl).origin : "http://localhost:3000";

  return {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? null,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl,
  };
}

export function getPaymentNotConfiguredMessage() {
  return "Payment checkout is not configured yet. Your StayWise reservation remains valid in the MVP.";
}
