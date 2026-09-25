import { describe, expect, it } from "vitest";
import {
  calculateDistanceMiles,
  formatCoordinateForUrl,
  formatDistanceMiles,
  hasValidCoordinates,
} from "@/lib/location-distance";

describe("location distance helpers", () => {
  it("calculates realistic mileage between city coordinates", () => {
    const distance = calculateDistanceMiles(
      { lat: 32.7767, lng: -96.797 },
      { lat: 30.2672, lng: -97.7431 },
    );

    expect(distance).not.toBeNull();
    expect(distance as number).toBeGreaterThan(175);
    expect(distance as number).toBeLessThan(205);
  });

  it("rejects invalid coordinates instead of calculating nonsense distance", () => {
    expect(calculateDistanceMiles({ lat: 91, lng: 0 }, { lat: 30, lng: -97 })).toBeNull();
    expect(hasValidCoordinates({ lat: 45, lng: -181 })).toBe(false);
  });

  it("formats distance and coordinates consistently for UI and URLs", () => {
    expect(formatDistanceMiles(0.04)).toBe("less than 0.1 mi");
    expect(formatDistanceMiles(5.24)).toBe("5.2 mi");
    expect(formatDistanceMiles(12.6)).toBe("13 mi");
    expect(formatCoordinateForUrl(32.7767004)).toBe("32.7767");
  });
});
