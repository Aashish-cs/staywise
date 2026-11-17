import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, createAdmin } = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpc, createAdmin: vi.fn(() => ({ rpc })) };
});
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createAdmin,
}));
import { POST } from "./route";

const stripe = new Stripe("sk_test_mock");
const webhookSecret = "whsec_mock";
const reservationId = "33333333-3333-4333-8333-333333333333";

function signedRequest(
  overrides: Record<string, unknown> = {},
  type = "checkout.session.completed",
) {
  const payload = JSON.stringify({
    id: "evt_test",
    type,
    data: {
      object: {
        id: "cs_test",
        mode: "payment",
        metadata: { reservation_id: reservationId },
        payment_status: "paid",
        payment_intent: "pi_test",
        amount_total: 22400,
        currency: "usd",
        ...overrides,
      },
    },
  });
  return new Request("https://staywise.example/api/payments/webhook", {
    method: "POST",
    body: payload,
    headers: {
      "stripe-signature": stripe.webhooks.generateTestHeaderString({
        payload,
        secret: webhookSecret,
      }),
    },
  });
}

describe("Stripe reservation webhook", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", webhookSecret);
    rpc.mockReset().mockResolvedValue({ error: null });
    createAdmin.mockReturnValue({ rpc });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects unsigned requests without updating reservations", async () => {
    const response = await POST(
      new Request("https://staywise.example/api/payments/webhook", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a forged signature", async () => {
    const request = signedRequest();
    request.headers.set("stripe-signature", "t=1,v1=forged");
    expect((await POST(request)).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("records paid sessions atomically with their expected amount and identity", async () => {
    expect((await POST(signedRequest())).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("apply_stripe_checkout_event", {
      requested_reservation_id: reservationId,
      requested_checkout_id: "cs_test",
      requested_payment_intent_id: "pi_test",
      requested_amount_cents: 22400,
      requested_currency: "usd",
      requested_status: "succeeded",
    });
  });

  it("does not confirm unpaid completed sessions", async () => {
    expect(
      (await POST(signedRequest({ payment_status: "unpaid" }))).status,
    ).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("releases expired checkout holds through the same atomic update", async () => {
    expect(
      (
        await POST(
          signedRequest(
            { payment_status: "unpaid" },
            "checkout.session.expired",
          ),
        )
      ).status,
    ).toBe(200);
    expect(rpc.mock.calls[0][1].requested_status).toBe("failed");
  });

  it("returns a retryable failure when the database rejects an update", async () => {
    rpc.mockResolvedValue({ error: { code: "XX000" } });
    expect((await POST(signedRequest())).status).toBe(500);
  });

  it("does not process external stay sessions as owned reservations", async () => {
    expect(
      (await POST(signedRequest({ metadata: { kind: "external_stay" } })))
        .status,
    ).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });
});
