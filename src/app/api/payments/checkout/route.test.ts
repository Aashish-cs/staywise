import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  user: { id: "guest-test" } as { id: string } | null,
  payment: {
    id: "ledger-test",
    reservation_id: "33333333-3333-4333-8333-333333333333",
    amount_cents: 22400,
    currency: "USD",
    status: "requires_payment",
    provider_checkout_id: null as string | null,
  },
  saveFails: false,
  create: vi.fn(),
  retrieve: vi.fn(),
  filter: vi.fn(),
}));
vi.mock("stripe", () => ({
  default: class Stripe {
    static errors = { StripeError: Error };
    checkout = { sessions: { create: state.create, retrieve: state.retrieve } };
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: (key: string, value: string) => {
          state.filter(key, value);
          return query;
        },
        maybeSingle: async () => ({
          data:
            table === "payment_records"
              ? state.payment
              : { status: "awaiting_payment" },
          error: null,
        }),
      };
      return query;
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => {
      const query = {
        update: () => query,
        eq: () => query,
        select: () => query,
        maybeSingle: async () =>
          state.saveFails
            ? { data: null, error: { code: "XX000" } }
            : { data: { id: "ledger-test" }, error: null },
      };
      return query;
    },
  }),
}));
import { POST } from "./route";

function request() {
  return new Request("https://staywise.example/api/payments/checkout", {
    method: "POST",
    body: JSON.stringify({ reservationId: state.payment.reservation_id }),
    headers: { "content-type": "application/json" },
  });
}

describe("owned reservation checkout", () => {
  beforeEach(() => {
    state.user = { id: "guest-test" };
    state.payment.provider_checkout_id = null;
    state.payment.status = "requires_payment";
    state.saveFails = false;
    state.create
      .mockReset()
      .mockResolvedValue({
        id: "cs_test",
        url: "https://checkout.stripe.com/test",
      });
    state.retrieve
      .mockReset()
      .mockResolvedValue({
        id: "cs_test",
        status: "open",
        url: "https://checkout.stripe.com/test",
      });
    state.filter.mockReset();
    vi.stubEnv("STAYWISE_ENABLE_STRIPE_CHECKOUT", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_mock");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service_mock");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("requires sign-in before looking up payment", async () => {
    state.user = null;
    expect((await POST(request())).status).toBe(401);
    expect(state.create).not.toHaveBeenCalled();
  });

  it("uses the ledger amount and guest ownership with a stable retry key", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(state.filter).toHaveBeenCalledWith("guest_id", "guest-test");
    const [params, options] = state.create.mock.calls[0];
    expect(params.line_items[0].price_data.unit_amount).toBe(22400);
    expect(params.metadata.reservation_id).toBe(state.payment.reservation_id);
    expect(options.idempotencyKey).toBe("staywise-checkout-ledger-test");
  });

  it("reuses an open session", async () => {
    state.payment.provider_checkout_id = "cs_test";
    expect((await POST(request())).status).toBe(200);
    expect(state.retrieve).toHaveBeenCalledWith("cs_test");
    expect(state.create).not.toHaveBeenCalled();
  });

  it("returns a retryable error when the checkout cannot be saved", async () => {
    state.saveFails = true;
    expect((await POST(request())).status).toBe(503);
    state.saveFails = false;
    expect((await POST(request())).status).toBe(200);
    expect(state.create.mock.calls[0][1]).toEqual(
      state.create.mock.calls[1][1],
    );
  });

  it("leaves existing pay-later reservations out of checkout", async () => {
    state.payment.status = "not_required";
    expect((await POST(request())).status).toBe(409);
    expect(state.create).not.toHaveBeenCalled();
  });
});
