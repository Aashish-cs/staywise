import type { Listing, PropertyType } from "@/lib/listings";
import type { SearchInput } from "@/lib/recommendations";

export const propertyTypeOptions: PropertyType[] = [
  "Apartment",
  "House",
  "Cabin",
  "Loft",
  "Townhome",
  "Villa",
];

export const defaultSearchInput = createSearchInput();

export const homeSearchInput = createSearchInput({
  maxNightlyBudget: 300,
});

export const broadMarketplaceSearchInput = createSearchInput({
  amenities: [],
  destination: "",
  maxNightlyBudget: 300,
});

export const workReadySearchPreset = {
  amenities: ["Fast Wi-Fi", "Workspace"],
  tripPurpose: "remote-work",
} satisfies Partial<SearchInput>;

export const familySearchPreset = {
  amenities: ["Kitchen", "Parking", "Washer"],
  guests: 5,
  tripPurpose: "family",
} satisfies Partial<SearchInput>;

export const outdoorSearchPreset = {
  amenities: ["Parking", "Pet friendly"],
  tripPurpose: "outdoor",
} satisfies Partial<SearchInput>;

export const valueSearchPreset = {
  maxNightlyBudget: 220,
} satisfies Partial<SearchInput>;

export function createSearchInput(overrides: Partial<SearchInput> = {}): SearchInput {
  const base: SearchInput = {
    destination: "",
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    infants: 0,
    pets: 0,
    guests: 2,
    maxNightlyBudget: 250,
    minBathrooms: 0,
    minBedrooms: 0,
    nearLat: null,
    nearLng: null,
    propertyTypes: [],
    tripPurpose: "remote-work",
    amenities: ["Fast Wi-Fi", "Workspace"],
  };

  const next = {
    ...base,
    ...overrides,
    amenities: overrides.amenities ? [...overrides.amenities] : [...base.amenities],
    propertyTypes: overrides.propertyTypes
      ? [...overrides.propertyTypes]
      : [...base.propertyTypes],
  };

  if (
    overrides.guests !== undefined &&
    overrides.adults === undefined &&
    overrides.children === undefined
  ) {
    next.adults = overrides.guests;
    next.children = 0;
  }

  next.guests = next.adults + next.children;

  return next;
}

export function createListingSearchInput(listing: Pick<Listing, "city" | "pricePerNight">) {
  return createSearchInput({
    ...homeSearchInput,
    destination: listing.city,
    maxNightlyBudget: Math.max(
      listing.pricePerNight + 60,
      homeSearchInput.maxNightlyBudget,
    ),
  });
}
