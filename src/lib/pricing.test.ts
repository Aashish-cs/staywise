import { describe, expect, it } from "vitest";
import { calculateReservationPricing } from "@/lib/pricing";

describe("reservation pricing", () => {
  it("calculates integer-cent totals with the StayWise fee policy", () => {
    const quote = calculateReservationPricing({
      nightlyRate: 184,
      nights: 3,
    });

    expect(quote.nightlyRateCents).toBe(18400);
    expect(quote.stayTotalCents).toBe(55200);
    expect(quote.serviceFeeCents).toBe(6600);
    expect(quote.taxCents).toBe(0);
    expect(quote.totalCents).toBe(61800);
    expect(quote.total).toBe(618);
  });

  it("normalizes invalid night counts to a zero-night quote", () => {
    const quote = calculateReservationPricing({
      nightlyRate: 199.49,
      nights: -2,
    });

    expect(quote.nights).toBe(0);
    expect(quote.stayTotalCents).toBe(0);
    expect(quote.serviceFeeCents).toBe(0);
    expect(quote.totalCents).toBe(0);
  });
});
