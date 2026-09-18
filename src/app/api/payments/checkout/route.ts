import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaymentNotConfiguredMessage, getPaymentProviderConfig } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const checkoutRequestSchema = z.object({
  reservationId: z.string().uuid(),
});

type PaymentRecord = {
  amount_cents: number;
  currency: string;
  id: string;
  reservation_id: string;
  status: string;
};

export async function POST(request: Request) {
  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid reservation." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in before opening payment checkout." }, { status: 401 });
  }

  const { data: payment, error } = await supabase
    .from("payment_records")
    .select("id, reservation_id, amount_cents, currency, status")
    .eq("reservation_id", parsed.data.reservationId)
    .eq("guest_id", user.id)
    .maybeSingle();

  if (error || !payment) {
    return NextResponse.json({ error: "Payment details were not found for this reservation." }, { status: 404 });
  }

  const paymentRecord = payment as PaymentRecord;
  if (paymentRecord.status !== "requires_payment") {
    return NextResponse.json(
      {
        error:
          paymentRecord.status === "not_required"
            ? getPaymentNotConfiguredMessage()
            : "This reservation does not have an open payment checkout.",
      },
      { status: 409 },
    );
  }

  const config = getPaymentProviderConfig(request.url);
  if (!config.stripeSecretKey) {
    return NextResponse.json({ error: getPaymentNotConfiguredMessage() }, { status: 503 });
  }

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${config.siteUrl}/reservations/${paymentRecord.reservation_id}?payment=success`);
  body.set("cancel_url", `${config.siteUrl}/reservations/${paymentRecord.reservation_id}?payment=cancelled`);
  body.set("client_reference_id", paymentRecord.reservation_id);
  body.set("metadata[reservation_id]", paymentRecord.reservation_id);
  body.set("line_items[0][price_data][currency]", paymentRecord.currency.toLowerCase());
  body.set("line_items[0][price_data][unit_amount]", String(paymentRecord.amount_cents));
  body.set("line_items[0][price_data][product_data][name]", "StayWise reservation");
  body.set("line_items[0][quantity]", "1");

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.stripeSecretKey}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(10000),
  });
  const stripePayload = (await stripeResponse.json().catch(() => null)) as
    | { id?: string; url?: string; error?: { message?: string } }
    | null;

  if (!stripeResponse.ok || !stripePayload?.id || !stripePayload.url) {
    console.error("Unable to create Stripe Checkout session", stripePayload?.error?.message);
    return NextResponse.json({ error: "Payment checkout could not be opened." }, { status: 502 });
  }

  const admin = createSupabaseAdminClient();
  if (admin) {
    await admin
      .from("payment_records")
      .update({
        provider: "stripe",
        provider_checkout_id: stripePayload.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRecord.id);
  }

  return NextResponse.json({ checkoutUrl: stripePayload.url });
}
