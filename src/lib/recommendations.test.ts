import { describe, expect, it } from "vitest";
import type { Listing } from "@/lib/listings";
import { rankListings, searchSchema } from "@/lib/recommendations";

const baseListing: Listing = {
  amenities: ["Fast Wi-Fi", "Workspace", "Kitchen"],
  bathrooms: 1,
  bedrooms: 1,
  bestFor: ["remote-work", "business"],
  capacity: 2,
  city: "Dallas",
  coordinates: { lat: 32.7767, lng: -96.797 },
  country: "United States",
  description: "A quiet work-ready stay.",
  host: { name: "StayWise host" },
  hostId: "host-1",
  id: "listing-1",
  imageAlt: "Listing",
  imageUrl: "https://example.com/listing.jpg",
  images: [{ alt: "Listing", url: "https://example.com/listing.jpg" }],
  isActive: true,
  neighborhood: "Uptown",
  pricePerNight: 180,
  propertyType: "Apartment",
  state: "TX",
  title: "Uptown work suite",
  traits: [],
};

describe("recommendation ranking", () => {
  it("normalizes guest totals when only total guests are supplied", () => {
    const parsed = searchSchema.parse({ guests: 4 });

    expect(parsed.adults).toBe(4);
    expect(parsed.children).toBe(0);
    expect(parsed.guests).toBe(4);
  });

  it("filters by destination and required amenities", () => {
    const listings = [
      baseListing,
      {
        ...baseListing,
        amenities: ["Kitchen"],
        city: "Austin",
        id: "listing-2",
        title: "Austin kitchen stay",
      },
    ];

    const ranked = rankListings(
      {
        amenities: ["Fast Wi-Fi", "Workspace"],
        destination: "Dallas",
        guests: 2,
        maxNightlyBudget: 250,
        tripPurpose: "remote-work",
      },
      listings,
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0].id).toBe("listing-1");
    expect(ranked[0].matchReasons.join(" ")).toContain("Fits the $250/night budget");
  });

  it("boosts saved listings without fabricating reasons", () => {
    const lowerPrice = {
      ...baseListing,
      id: "listing-2",
      pricePerNight: 150,
      title: "Lower price suite",
    };

    const ranked = rankListings(
      {
        destination: "Dallas",
        guests: 2,
        maxNightlyBudget: 250,
        tripPurpose: "remote-work",
      },
      [lowerPrice, baseListing],
      {
        favoriteListingIds: ["listing-1"],
        preferredCities: ["Dallas"],
      },
    );

    expect(ranked[0].id).toBe("listing-1");
    expect(ranked[0].matchScore).toBeGreaterThan(ranked[1].matchScore);
    expect(ranked[0].matchReasons).toContain("Saved in your StayWise stays");
    expect(ranked[0].matchReasons.every((reason) => reason.length > 0)).toBe(true);
  });
});
