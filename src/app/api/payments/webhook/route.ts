import Stripe from "stripe";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaymentProviderConfig } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = getPaymentProviderConfig(request.url);
  const signature = request.headers.get("stripe-signature");
  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const stripe = new Stripe(config.stripeSecretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      config.stripeWebhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature or payload." },
      { status: 400 },
    );
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.expired" &&
    event.type !== "checkout.session.async_payment_failed"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const reservationId = session.metadata?.reservation_id;
  if (!reservationId) return NextResponse.json({ received: true });
  if (
    !z.string().uuid().safeParse(reservationId).success ||
    session.mode !== "payment"
  ) {
    return NextResponse.json(
      { error: "Invalid reservation checkout." },
      { status: 400 },
    );
  }
  const succeeded =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded";
  if (succeeded && session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Payment reconciliation is unavailable." },
      { status: 503 },
    );
  }
  const { error } = await admin.rpc("apply_stripe_checkout_event", {
    requested_reservation_id: reservationId,
    requested_checkout_id: session.id,
    requested_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    requested_amount_cents: session.amount_total,
    requested_currency: session.currency,
    requested_status: succeeded ? "succeeded" : "failed",
  });
  if (error) {
    console.error("Unable to reconcile Stripe checkout", error.code);
    return NextResponse.json(
      { error: "Payment status could not be recorded." },
      { status: 500 },
    );
  }
  return NextResponse.json({ received: true });
}
