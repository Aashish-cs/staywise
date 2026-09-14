import { NextResponse } from "next/server";
import {
  filterListingsByAvailability,
  getPublicListings,
} from "@/lib/listing-data";
import { recordRecommendationEvent } from "@/lib/recommendation-events";
import { rankListings, searchSchema } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = searchSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid recommendation request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const publicListings = await getPublicListings();
  const listings = await filterListingsByAvailability(
    publicListings,
    parsed.data.checkIn,
    parsed.data.checkOut,
  );
  const rankedListings = rankListings(parsed.data, listings);

  await recordRecommendationEvent({
    eventName: "search_submitted",
    reasonCodes: rankedListings[0]?.matchReasons ?? [],
    resultCount: rankedListings.length,
    score: rankedListings[0]?.matchScore ?? null,
    searchFilters: parsed.data,
    searchQuery: parsed.data.destination,
  });

  return NextResponse.json({
    listings: rankedListings,
  });
}
