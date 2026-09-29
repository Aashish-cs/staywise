import { describe, expect, it } from "vitest";
import { parseNaturalLanguageSearch } from "@/lib/natural-language-search";
import { defaultSearchInput } from "@/lib/search-presets";

describe("parseNaturalLanguageSearch", () => {
  it("extracts a worldwide hotel destination even when StayWise has no local inventory there", () => {
    const result = parseNaturalLanguageSearch(
      "find hotel in cyprus",
      defaultSearchInput,
      [],
    );

    expect(result.search.destination).toBe("Cyprus");
    expect(result.detected).toContain("Cyprus");
  });

  it("keeps destination, guests, and amenities from a natural hotel request", () => {
    const result = parseNaturalLanguageSearch(
      "Find hotels in new orleans for 2 people with wifi",
      defaultSearchInput,
      [],
    );

    expect(result.search.destination).toBe("New Orleans");
    expect(result.search.guests).toBe(2);
    expect(result.search.amenities).toContain("Fast Wi-Fi");
  });
});
