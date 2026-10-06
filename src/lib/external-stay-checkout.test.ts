import { describe, expect, it } from "vitest";
import {
  buildExternalStayFields,
  buildExternalStayPath,
  fieldsToRawSearchParams,
  getExternalStayPricing,
  parseExternalStay,
} from "@/lib/external-stay-checkout";

describe("external stay checkout helpers", () => {
  it("parses and prices a live place checkout payload", () => {
    const query = {
      actionUrl: "https://example.com/hotel",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      destination: "London",
      guests: "2",
      id: "hotel-123",
      imageUrl: "https://example.com/hotel.jpg",
      name: "The Test Hotel",
      source: "amadeus",
      typeLabel: "Hotel",
    };

    const stay = parseExternalStay(query);

    expect(stay).toMatchObject({
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      destination: "London",
      guests: 2,
      imageUrl: "https://example.com/hotel.jpg",
      name: "The Test Hotel",
      source: "amadeus",
      typeLabel: "Hotel",
    });
    expect(stay).not.toBeNull();

    const pricing = getExternalStayPricing(stay!);

    expect(pricing.nights).toBe(3);
    expect(pricing.totals.totalCents).toBeGreaterThan(0);
  });

  it("round-trips allowed checkout fields and strips control params", () => {
    const query = {
      name: "Safe Stay",
      destination: "Germany",
      payment: "cancelled",
      reserved: "true",
      unknown: "ignored",
    };

    const fields = buildExternalStayFields(query, {
      payment: "success",
      reserved: true,
    });

    expect(fields).toContainEqual(["name", "Safe Stay"]);
    expect(fields).toContainEqual(["destination", "Germany"]);
    expect(fields).toContainEqual(["payment", "success"]);
    expect(fields).toContainEqual(["reserved", "true"]);
    expect(fields).not.toContainEqual(["unknown", "ignored"]);

    expect(fieldsToRawSearchParams(fields)).toMatchObject({
      destination: "Germany",
      name: "Safe Stay",
    });
    expect(buildExternalStayPath(query)).toBe(
      "/external-stays?name=Safe+Stay&destination=Germany",
    );
  });
});
