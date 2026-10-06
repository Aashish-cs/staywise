import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildExternalStayPath,
  fieldsToRawSearchParams,
  getExternalStayPricing,
  parseExternalStay,
} from "@/lib/external-stay-checkout";
import { getPaymentNotConfiguredMessage, getPaymentProviderConfig } from "@/lib/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const checkoutRequestSchema = z.object({
  fields: z.array(z.tuple([z.string().max(48), z.string().max(1200)])).max(24),
});

export async function POST(request: Request) {
  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid stay before reserving." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in before opening payment checkout." }, { status: 401 });
  }

  const query = fieldsToRawSearchParams(parsed.data.fields);
  const stay = parseExternalStay(query);

  if (!stay) {
    return NextResponse.json({ error: "Choose a valid stay before reserving." }, { status: 400 });
  }

  const config = getPaymentProviderConfig(request.url);
  if (!config.stripeCheckoutEnabled || !config.stripeSecretKey) {
    return NextResponse.json({ error: getPaymentNotConfiguredMessage() }, { status: 503 });
  }

  const { nights, totals } = getExternalStayPricing(stay);
  const successPath = buildExternalStayPath(query, {
    payment: "success",
    reserved: true,
  });
  const cancelPath = buildExternalStayPath(query, { payment: "cancelled" });
  const body = new URLSearchParams();
  const productName = trimForStripe(`StayWise booking request: ${stay.name}`, 250);
  const productDescription = trimForStripe(
    `${nights} ${nights === 1 ? "night" : "nights"} in ${stay.destination || "selected destination"} for ${stay.guests} ${stay.guests === 1 ? "guest" : "guests"}`,
    500,
  );

  body.set("mode", "payment");
  body.set("success_url", `${config.siteUrl}${successPath}`);
  body.set("cancel_url", `${config.siteUrl}${cancelPath}`);
  body.set("client_reference_id", `external:${trimForStripe(stay.id, 180)}`);
  body.set("metadata[kind]", "external_stay");
  body.set("metadata[external_stay_id]", trimForStripe(stay.id, 500));
  body.set("metadata[external_stay_name]", trimForStripe(stay.name, 500));
  body.set("metadata[destination]", trimForStripe(stay.destination, 500));
  body.set("metadata[check_in]", stay.checkIn);
  body.set("metadata[check_out]", stay.checkOut);
  body.set("metadata[guests]", String(stay.guests));
  body.set("metadata[source]", stay.source);
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(totals.totalCents));
  body.set("line_items[0][price_data][product_data][name]", productName);
  body.set("line_items[0][price_data][product_data][description]", productDescription);
  body.set("line_items[0][quantity]", "1");

  if (user.email) {
    body.set("customer_email", user.email);
  }

  if (stay.imageUrl.startsWith("https://")) {
    body.set("line_items[0][price_data][product_data][images][0]", stay.imageUrl);
  }

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.stripeSecretKey}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    signal: AbortSignal.timeout(10000),
  });
  const stripePayload = (await stripeResponse.json().catch(() => null)) as
    | { id?: string; url?: string; error?: { message?: string } }
    | null;

  if (!stripeResponse.ok || !stripePayload?.id || !stripePayload.url) {
    console.error("Unable to create external stay Stripe Checkout session", stripePayload?.error?.message);
    return NextResponse.json({ error: "Payment checkout could not be opened." }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: stripePayload.url });
}

function trimForStripe(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}
