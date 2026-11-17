import { afterEach, describe, expect, it, vi } from "vitest";
import { getPaymentProviderConfig, isStripeCheckoutEnabled } from "@/lib/payments";

const originalStripeMode = process.env.STAYWISE_ENABLE_STRIPE_CHECKOUT;
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;

describe("payment provider config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    restoreEnv("STAYWISE_ENABLE_STRIPE_CHECKOUT", originalStripeMode);
    restoreEnv("STRIPE_SECRET_KEY", originalStripeSecretKey);
  });

  it("keeps Stripe checkout disabled by default", () => {
    delete process.env.STAYWISE_ENABLE_STRIPE_CHECKOUT;
    delete process.env.STRIPE_SECRET_KEY;

    expect(getPaymentProviderConfig().stripeCheckoutEnabled).toBe(false);
    expect(isStripeCheckoutEnabled()).toBe(false);
  });

  it("requires checkout credentials and webhook reconciliation credentials", () => {
    process.env.STAYWISE_ENABLE_STRIPE_CHECKOUT = "true";
    delete process.env.STRIPE_SECRET_KEY;

    expect(isStripeCheckoutEnabled()).toBe(false);

    process.env.STRIPE_SECRET_KEY = "sk_test_staywise";

    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(isStripeCheckoutEnabled()).toBe(false);

    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    expect(isStripeCheckoutEnabled()).toBe(false);

    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service_test");

    expect(isStripeCheckoutEnabled()).toBe(true);
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
