import { describe, expect, it } from "vitest";
import {
  buildSearchPageQueryString,
  buildSearchQueryString,
  parseSearchPage,
  parseSearchParams,
} from "@/lib/search-url";

describe("search URL helpers", () => {
  it("parses and clamps unsafe query values", () => {
    const search = parseSearchParams({
      adults: "99",
      amenities: ["Fast Wi-Fi", "Bad amenity"],
      budget: "9000",
      destination: " Dallas ",
      nearLat: "91",
      nearLng: "-96.797",
      purpose: "bad-purpose",
    });

    expect(search.adults).toBe(16);
    expect(search.maxNightlyBudget).toBe(1200);
    expect(search.amenities).toEqual(["Fast Wi-Fi"]);
    expect(search.tripPurpose).toBe("remote-work");
    expect(search.nearLat).toBeNull();
    expect(search.nearLng).toBe(-96.797);
  });

  it("builds shareable search URLs with coordinates and pagination", () => {
    const query = buildSearchQueryString({
      amenities: ["Fast Wi-Fi"],
      destination: "Dallas",
      guests: 2,
      maxNightlyBudget: 300,
      nearLat: 32.7767004,
      nearLng: -96.7970004,
      tripPurpose: "remote-work",
    });
    const paged = buildSearchPageQueryString(parseSearchParams(Object.fromEntries(new URLSearchParams(query))), 3);

    expect(query).toContain("destination=Dallas");
    expect(query).toContain("nearLat=32.7767");
    expect(query).toContain("amenities=Fast+Wi-Fi");
    expect(paged).toContain("page=3");
    expect(parseSearchPage({ page: "0" })).toBe(1);
    expect(parseSearchPage({ page: "101" })).toBe(100);
  });
});
