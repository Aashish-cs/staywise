import { centsToDollars, dollarsToCents } from "@/lib/currency";

export const staywisePricingPolicy = {
  cleaningFeeCents: 0,
  currency: "USD",
  serviceFeeRateBps: 1200,
  taxRateBps: 0,
} as const;

export type ReservationPricingInput = {
  nightlyRate: number;
  nights: number;
};

export type ReservationPricingQuote = {
  cleaningFee: number;
  cleaningFeeCents: number;
  currency: typeof staywisePricingPolicy.currency;
  nights: number;
  nightlyRate: number;
  nightlyRateCents: number;
  serviceFee: number;
  serviceFeeCents: number;
  stayTotal: number;
  stayTotalCents: number;
  tax: number;
  taxCents: number;
  total: number;
  totalCents: number;
};

export function calculateReservationPricing({
  nightlyRate,
  nights,
}: ReservationPricingInput): ReservationPricingQuote {
  const safeNights = Math.max(0, Math.trunc(nights));
  const nightlyRateCents = dollarsToCents(nightlyRate);
  const stayTotalCents = nightlyRateCents * safeNights;
  const cleaningFeeCents = safeNights > 0 ? staywisePricingPolicy.cleaningFeeCents : 0;
  const serviceFeeCents = roundToWholeDollarCents(
    percentageOfCents(
      stayTotalCents + cleaningFeeCents,
      staywisePricingPolicy.serviceFeeRateBps,
    ),
  );
  const taxCents = percentageOfCents(
    stayTotalCents + cleaningFeeCents + serviceFeeCents,
    staywisePricingPolicy.taxRateBps,
  );
  const totalCents =
    stayTotalCents + cleaningFeeCents + serviceFeeCents + taxCents;

  return {
    cleaningFee: centsToDollars(cleaningFeeCents),
    cleaningFeeCents,
    currency: staywisePricingPolicy.currency,
    nights: safeNights,
    nightlyRate: centsToDollars(nightlyRateCents),
    nightlyRateCents,
    serviceFee: centsToDollars(serviceFeeCents),
    serviceFeeCents,
    stayTotal: centsToDollars(stayTotalCents),
    stayTotalCents,
    tax: centsToDollars(taxCents),
    taxCents,
    total: centsToDollars(totalCents),
    totalCents,
  };
}

function percentageOfCents(amountCents: number, basisPoints: number) {
  return Math.round((amountCents * basisPoints) / 10000);
}

function roundToWholeDollarCents(amountCents: number) {
  return Math.round(amountCents / 100) * 100;
}
