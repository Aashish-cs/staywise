import { afterEach, describe, expect, it } from "vitest";
import { getPaymentProviderConfig, isStripeCheckoutEnabled } from "@/lib/payments";

const originalStripeMode = process.env.STAYWISE_ENABLE_STRIPE_CHECKOUT;
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;

describe("payment provider config", () => {
  afterEach(() => {
    restoreEnv("STAYWISE_ENABLE_STRIPE_CHECKOUT", originalStripeMode);
    restoreEnv("STRIPE_SECRET_KEY", originalStripeSecretKey);
  });

  it("keeps Stripe checkout disabled by default", () => {
    delete process.env.STAYWISE_ENABLE_STRIPE_CHECKOUT;
    delete process.env.STRIPE_SECRET_KEY;

    expect(getPaymentProviderConfig().stripeCheckoutEnabled).toBe(false);
    expect(isStripeCheckoutEnabled()).toBe(false);
  });

  it("requires both the explicit flag and a Stripe secret key", () => {
    process.env.STAYWISE_ENABLE_STRIPE_CHECKOUT = "true";
    delete process.env.STRIPE_SECRET_KEY;

    expect(isStripeCheckoutEnabled()).toBe(false);

    process.env.STRIPE_SECRET_KEY = "sk_test_staywise";

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
