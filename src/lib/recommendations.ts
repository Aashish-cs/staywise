import { z } from "zod";
import {
  featuredAmenities,
  staywiseListings,
  type Listing,
  type TripPurpose,
} from "@/lib/listings";

export const searchSchema = z.object({
  destination: z.string().trim().min(0).default(""),
  guests: z.coerce.number().int().min(1).max(16).default(2),
  maxNightlyBudget: z.coerce.number().int().min(50).max(1200).default(250),
  tripPurpose: z
    .enum(["business", "family", "remote-work", "romantic", "solo", "group", "outdoor"])
    .default("remote-work"),
  amenities: z.array(z.enum(featuredAmenities as [string, ...string[]])).default([]),
  month: z.string().trim().default("Sep"),
});

export type SearchInput = z.infer<typeof searchSchema>;

export type RankedListing = Listing & {
  matchScore: number;
  matchReasons: string[];
  tradeoffs: string[];
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
  listings: Listing[] = staywiseListings,
): RankedListing[] {
  const input = searchSchema.parse(rawInput);
  const destination = input.destination.toLowerCase();

  return listings
    .filter((listing) => {
      const matchesDestination =
        !destination ||
        `${listing.city} ${listing.state} ${listing.neighborhood}`
          .toLowerCase()
          .includes(destination);
      const hasCapacity = listing.capacity >= input.guests;
      const isAvailable = !input.month || listing.availableMonths.includes(input.month);

      return matchesDestination && hasCapacity && isAvailable;
    })
    .map((listing) => scoreListing(listing, input))
    .sort((a, b) => b.matchScore - a.matchScore);
}

function scoreListing(listing: Listing, input: SearchInput): RankedListing {
  let score = 36;
  const reasons: string[] = [];
  const tradeoffs: string[] = [];

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

  if (listing.host.isSuperhost) {
    score += 5;
    reasons.push("Hosted by a Superhost");
  }

  score += Math.round((listing.rating - 4.7) * 18);

  if (listing.reviewCount > 100) {
    score += 3;
  }

  if (reasons.length === 0) {
    reasons.push("Balanced match across price, space, and location");
  }

  return {
    ...listing,
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
