import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import {
  getPaymentNotConfiguredMessage,
  getPaymentProviderConfig,
} from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const checkoutRequestSchema = z.object({ reservationId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = checkoutRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a valid reservation." },
      { status: 400 },
    );
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) {
    return NextResponse.json(
      { error: "Sign in before opening payment checkout." },
      { status: 401 },
    );
  }

  const { data: payment, error } = await supabase
    .from("payment_records")
    .select(
      "id, reservation_id, amount_cents, currency, status, provider_checkout_id",
    )
    .eq("reservation_id", parsed.data.reservationId)
    .eq("guest_id", user.id)
    .maybeSingle();
  if (error || !payment) {
    return NextResponse.json(
      { error: "Payment details were not found for this reservation." },
      { status: 404 },
    );
  }
  if (payment.status !== "requires_payment") {
    return NextResponse.json(
      { error: "This reservation does not have an open payment checkout." },
      { status: 409 },
    );
  }
  const config = getPaymentProviderConfig(request.url);
  const admin = createSupabaseAdminClient();
  if (!config.stripeCheckoutEnabled || !config.stripeSecretKey || !admin) {
    return NextResponse.json(
      { error: getPaymentNotConfiguredMessage() },
      { status: 503 },
    );
  }
  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", payment.reservation_id)
    .eq("guest_id", user.id)
    .maybeSingle();
  if (reservationError || reservation?.status !== "awaiting_payment") {
    return NextResponse.json(
      { error: "This reservation is no longer awaiting payment." },
      { status: 409 },
    );
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    timeout: 10000,
    maxNetworkRetries: 1,
  });
  try {
    if (payment.provider_checkout_id) {
      const existing = await stripe.checkout.sessions.retrieve(
        payment.provider_checkout_id,
      );
      if (existing.status === "open" && existing.url) {
        return NextResponse.json({ checkoutUrl: existing.url });
      }
      return NextResponse.json(
        {
          error:
            "Checkout has ended. Refresh your reservation to see its payment status.",
        },
        { status: 409 },
      );
    }
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        allowed_payment_method_types: ["card"],
        success_url: `${config.siteUrl}/reservations/${payment.reservation_id}?payment=success`,
        cancel_url: `${config.siteUrl}/reservations/${payment.reservation_id}?payment=cancelled`,
        client_reference_id: payment.reservation_id,
        metadata: { reservation_id: payment.reservation_id },
        line_items: [
          {
            price_data: {
              currency: payment.currency.toLowerCase(),
              unit_amount: payment.amount_cents,
              product_data: { name: "StayWise reservation" },
            },
            quantity: 1,
          },
        ],
      },
      { idempotencyKey: `staywise-checkout-${payment.id}` },
    );

    const { data: savedPayment, error: saveError } = await admin
      .from("payment_records")
      .update({
        provider: "stripe",
        provider_checkout_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "requires_payment")
      .select("id")
      .maybeSingle();
    if (saveError || !savedPayment || !session.url) {
      console.error(
        "Unable to record Stripe checkout session",
        saveError?.code,
      );
      return NextResponse.json(
        { error: "Payment checkout could not be saved. Please retry." },
        { status: 503 },
      );
    }
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error(
      "Unable to open Stripe checkout",
      error instanceof Stripe.errors.StripeError
        ? error.type
        : "request_failed",
    );
    return NextResponse.json(
      { error: "Payment checkout could not be opened. Please retry." },
      { status: 502 },
    );
  }
}
