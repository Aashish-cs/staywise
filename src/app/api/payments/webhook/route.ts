import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getPaymentProviderConfig } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type StripeEvent = {
  data?: {
    object?: {
      metadata?: { reservation_id?: string };
      payment_intent?: string | null;
    };
  };
  type?: string;
};

export async function POST(request: Request) {
  const config = getPaymentProviderConfig(request.url);
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!config.stripeWebhookSecret || !signature) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  if (!verifyStripeSignature(payload, signature, config.stripeWebhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  const reservationId = event.data?.object?.metadata?.reservation_id;
  const admin = createSupabaseAdminClient();

  if (!admin || !reservationId) {
    return NextResponse.json({ received: true });
  }

  const paymentStatus = getPaymentStatusForEvent(event.type);
  if (!paymentStatus) {
    return NextResponse.json({ received: true });
  }

  const { error: paymentError } = await admin
    .from("payment_records")
    .update({
      provider: "stripe",
      provider_payment_intent_id: event.data?.object?.payment_intent ?? null,
      status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("reservation_id", reservationId);

  if (paymentError) {
    console.error("Unable to update payment record from Stripe webhook", paymentError);
    return NextResponse.json({ error: "Payment status could not be recorded." }, { status: 500 });
  }

  if (paymentStatus === "succeeded") {
    await admin
      .from("reservations")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", reservationId)
      .in("status", ["pending", "awaiting_payment"]);
  }

  if (paymentStatus === "failed") {
    await admin
      .from("reservations")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", reservationId)
      .eq("status", "awaiting_payment");
  }

  return NextResponse.json({ received: true });
}

function getPaymentStatusForEvent(eventType: string | undefined) {
  if (eventType === "checkout.session.completed" || eventType === "payment_intent.succeeded") {
    return "succeeded" as const;
  }

  if (
    eventType === "checkout.session.expired" ||
    eventType === "payment_intent.payment_failed"
  ) {
    return "failed" as const;
  }

  return null;
}

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = new Map(
    header.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key, value] as const;
    }),
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");

  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}
