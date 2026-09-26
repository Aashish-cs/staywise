import { z } from "zod";
import {
  featuredAmenities,
  type Listing,
  type PropertyType,
  type TripPurpose,
} from "@/lib/listings";
import {
  calculateDistanceMiles,
  formatDistanceMiles,
  hasSearchCoordinates,
  nearbySearchRadiusMiles,
} from "@/lib/location-distance";

const amenityValues = [...featuredAmenities] as [string, ...string[]];
const propertyTypeValues = [
  "Apartment",
  "House",
  "Cabin",
  "Loft",
  "Townhome",
  "Villa",
] as [PropertyType, ...PropertyType[]];
const optionalIsoDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Use YYYY-MM-DD dates",
  })
  .default("");
const optionalLatitude = z
  .preprocess(
    normalizeOptionalNumber,
    z.coerce.number().min(-90).max(90).nullable(),
  )
  .default(null);
const optionalLongitude = z
  .preprocess(
    normalizeOptionalNumber,
    z.coerce.number().min(-180).max(180).nullable(),
  )
  .default(null);

const searchObjectSchema = z.object({
  destination: z.string().trim().min(0).default(""),
  checkIn: optionalIsoDate,
  checkOut: optionalIsoDate,
  adults: z.coerce.number().int().min(1).max(16).default(2),
  children: z.coerce.number().int().min(0).max(16).default(0),
  infants: z.coerce.number().int().min(0).max(5).default(0),
  pets: z.coerce.number().int().min(0).max(5).default(0),
  guests: z.coerce.number().int().min(1).max(16).default(2),
  maxNightlyBudget: z.coerce.number().int().min(50).max(1200).default(250),
  minBathrooms: z.coerce.number().min(0).max(12).default(0),
  minBedrooms: z.coerce.number().int().min(0).max(12).default(0),
  propertyTypes: z.array(z.enum(propertyTypeValues)).default([]),
  tripPurpose: z
    .enum(["business", "family", "remote-work", "romantic", "solo", "group", "outdoor"])
    .default("remote-work"),
  amenities: z.array(z.enum(amenityValues)).default([]),
  nearLat: optionalLatitude,
  nearLng: optionalLongitude,
});

export const searchSchema = searchObjectSchema.transform((input) => {
  const selectedGuests = input.adults + input.children;

  if (selectedGuests === input.guests) {
    return input;
  }

  return {
    ...input,
    adults: input.guests,
    children: 0,
  };
});

export type SearchInput = z.infer<typeof searchSchema>;

export type RankedListing = Listing & {
  distanceMiles: number | null;
  matchScore: number;
  matchReasons: string[];
  tradeoffs: string[];
};

export type RecommendationContext = {
  favoriteListingIds?: string[];
  preferredCities?: string[];
};

const purposeSignals: Record<TripPurpose, string[]> = {
  business: ["Fast Wi-Fi", "Workspace", "Self check-in"],
  family: ["Kitchen", "Parking", "Washer", "Pet friendly"],
  "remote-work": ["Fast Wi-Fi", "Workspace", "Kitchen"],
  romantic: ["Kitchen", "Self check-in"],
  solo: ["Fast Wi-Fi", "Self check-in", "Workspace"],
  group: ["Kitchen", "Parking", "Washer"],
  outdoor: ["Parking", "Pet friendly", "Washer"],
};

export function rankListings(
  rawInput: Partial<SearchInput>,
  listings: Listing[] = [],
  context: RecommendationContext = {},
): RankedListing[] {
  const input = searchSchema.parse(rawInput);
  const destination = normalizeSearchText(input.destination);
  const hasNearMeSearch = hasSearchCoordinates(input);
  const origin = hasNearMeSearch
    ? {
        lat: input.nearLat,
        lng: input.nearLng,
      }
    : null;

  return listings
    .map((listing) => ({
      distanceMiles: origin
        ? calculateDistanceMiles(origin, listing.coordinates)
        : null,
      listing,
    }))
    .filter(({ distanceMiles, listing }) => {
      const matchesDestination =
        hasNearMeSearch ||
        !destination ||
        normalizeSearchText(
          `${listing.city} ${listing.state} ${listing.neighborhood}`,
        ).includes(destination);
      const matchesNearby =
        !hasNearMeSearch ||
        (distanceMiles !== null && distanceMiles <= nearbySearchRadiusMiles);
      const hasCapacity = listing.capacity >= input.guests;
      const matchesPropertyType =
        input.propertyTypes.length === 0 ||
        input.propertyTypes.includes(listing.propertyType);
      const matchesAmenities = input.amenities.every((amenity) =>
        listing.amenities.includes(amenity),
      );
      const hasBedrooms = listing.bedrooms >= input.minBedrooms;
      const hasBathrooms = listing.bathrooms >= input.minBathrooms;

      return (
        matchesDestination &&
        matchesNearby &&
        hasCapacity &&
        matchesPropertyType &&
        matchesAmenities &&
        hasBedrooms &&
        hasBathrooms
      );
    })
    .map(({ distanceMiles, listing }) =>
      scoreListing(listing, input, distanceMiles, context),
    )
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        (b.reviewCount ?? 0) - (a.reviewCount ?? 0) ||
        a.pricePerNight - b.pricePerNight,
    );
}

function scoreListing(
  listing: Listing,
  input: SearchInput,
  distanceMiles: number | null,
  context: RecommendationContext,
): RankedListing {
  let score = 36;
  const reasons: string[] = [];
  const tradeoffs: string[] = [];

  if (distanceMiles !== null) {
    const distanceLabel = formatDistanceMiles(distanceMiles);

    if (distanceMiles <= 10) {
      score += 22;
      reasons.push(`${distanceLabel} from your location`);
    } else if (distanceMiles <= 35) {
      score += 16;
      reasons.push(`${distanceLabel} from your location`);
    } else {
      score += Math.max(2, 14 - Math.round(distanceMiles / 10));
      tradeoffs.push(`${distanceLabel} from your current location`);
    }
  }

  const budgetDelta = input.maxNightlyBudget - listing.pricePerNight;
  if (budgetDelta >= 0) {
    const budgetScore = Math.min(22, Math.round((budgetDelta / input.maxNightlyBudget) * 22));
    score += 14 + budgetScore;
    reasons.push(`Fits the $${input.maxNightlyBudget}/night budget`);
  } else {
    const penalty = Math.min(20, Math.ceil(Math.abs(budgetDelta) / 15));
    score -= penalty;
    tradeoffs.push(`Runs $${Math.abs(budgetDelta)} above the nightly target`);
  }

  if (listing.bestFor.includes(input.tripPurpose)) {
    score += 18;
    reasons.push(`Strong match for ${input.tripPurpose.replace("-", " ")} travel`);
  }

  if (listing.ratingAverage && (listing.reviewCount ?? 0) > 0) {
    const ratingScore = Math.min(10, Math.round(listing.ratingAverage * 2));
    score += ratingScore;
    reasons.push(
      `${listing.ratingAverage.toFixed(1)} guest rating from ${listing.reviewCount} ${
        listing.reviewCount === 1 ? "review" : "reviews"
      }`,
    );
  }

  if ((listing.completedReservationCount ?? 0) > 0) {
    const completedReservationCount = listing.completedReservationCount ?? 0;
    const popularityScore = Math.min(
      8,
      Math.max(2, Math.round(Math.log2(completedReservationCount + 1) * 2)),
    );

    score += popularityScore;
    reasons.push(
      `${completedReservationCount} completed ${
        completedReservationCount === 1 ? "stay" : "stays"
      } on StayWise`,
    );
  }

  const amenityMatches = input.amenities.filter((amenity) =>
    listing.amenities.includes(amenity),
  );
  if (amenityMatches.length > 0) {
    score += amenityMatches.length * 6;
    reasons.push(`Includes ${formatList(amenityMatches)}`);
  }

  const missingAmenities = input.amenities.filter(
    (amenity) => !listing.amenities.includes(amenity),
  );
  if (missingAmenities.length > 0) {
    score -= missingAmenities.length * 3;
    tradeoffs.push(`Missing ${formatList(missingAmenities)}`);
  }

  const purposeAmenityMatches = purposeSignals[input.tripPurpose].filter((amenity) =>
    listing.amenities.includes(amenity),
  );
  score += purposeAmenityMatches.length * 4;

  const capacityBuffer = listing.capacity - input.guests;
  if (capacityBuffer >= 2) {
    score += 5;
    reasons.push("Comfortable space for the group");
  } else if (capacityBuffer === 0 && input.guests > 2) {
    tradeoffs.push("Capacity is exact with little extra room");
  }

  if (context.favoriteListingIds?.includes(listing.id)) {
    score += 7;
    reasons.push("Saved in your StayWise stays");
  }

  if (
    context.preferredCities?.some(
      (city) => normalizeSearchText(city) === normalizeSearchText(listing.city),
    )
  ) {
    score += 5;
    reasons.push("In a city from your recent trips");
  }

  if (listing.createdAt && isRecentlyAdded(listing.createdAt)) {
    score += 3;
    reasons.push("Recently added to StayWise");
  }

  if (reasons.length === 0) {
    reasons.push("Balanced match across price, space, and location");
  }

  return {
    ...listing,
    distanceMiles,
    matchScore: clamp(score, 1, 99),
    matchReasons: reasons.slice(0, 3),
    tradeoffs: tradeoffs.slice(0, 2),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatList(items: string[]) {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function normalizeOptionalNumber(value: unknown) {
  return value === "" || value === null || value === undefined ? null : value;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isRecentlyAdded(createdAt: string) {
  const createdAtMs = Date.parse(createdAt);

  if (!Number.isFinite(createdAtMs)) {
    return false;
  }

  const ageMs = Date.now() - createdAtMs;
  return ageMs >= 0 && ageMs <= 1000 * 60 * 60 * 24 * 45;
}
