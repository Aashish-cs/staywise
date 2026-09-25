import { describe, expect, it } from "vitest";
import {
  countNights,
  dateRangesOverlap,
  getFutureIso,
  validateReservationDateRange,
} from "@/lib/reservation-utils";

describe("reservation date helpers", () => {
  it("counts nights only for valid ISO date ranges", () => {
    expect(countNights("2026-10-01", "2026-10-04")).toBe(3);
    expect(countNights("2026-02-30", "2026-03-02")).toBe(0);
    expect(countNights("2026-10-04", "2026-10-01")).toBe(-3);
  });

  it("validates future reservation ranges and max-stay policy", () => {
    const valid = validateReservationDateRange(getFutureIso(10), getFutureIso(13));
    const sameDay = validateReservationDateRange(getFutureIso(10), getFutureIso(10));
    const tooLong = validateReservationDateRange(getFutureIso(10), getFutureIso(45));

    expect(valid).toEqual({ ok: true, nights: 3 });
    expect(sameDay.ok).toBe(false);
    expect(tooLong.ok).toBe(false);
  });

  it("matches database-style half-open overlap behavior", () => {
    expect(dateRangesOverlap("2026-10-01", "2026-10-05", "2026-10-04", "2026-10-08")).toBe(true);
    expect(dateRangesOverlap("2026-10-01", "2026-10-05", "2026-10-05", "2026-10-08")).toBe(false);
    expect(dateRangesOverlap("2026-10-05", "2026-10-08", "2026-10-01", "2026-10-05")).toBe(false);
    expect(dateRangesOverlap("bad", "2026-10-08", "2026-10-01", "2026-10-05")).toBe(false);
  });
});
