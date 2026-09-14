import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicListings } from "@/lib/listing-data";
import { parseNaturalLanguageSearch } from "@/lib/natural-language-search";
import { recordRecommendationEvent } from "@/lib/recommendation-events";
import { type SearchInput } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

const aiSearchRequestSchema = z.object({
  currentSearch: z.unknown().optional(),
  prompt: z.string().trim().min(3).max(500),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = aiSearchRequestSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Tell StayWise what kind of stay you want.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const listings = await getPublicListings();
  const currentSearch =
    parsed.data.currentSearch &&
    typeof parsed.data.currentSearch === "object" &&
    !Array.isArray(parsed.data.currentSearch)
      ? (parsed.data.currentSearch as Partial<SearchInput>)
      : {};
  const interpretedSearch = parseNaturalLanguageSearch(
    parsed.data.prompt,
    currentSearch,
    listings,
  );

  await recordRecommendationEvent({
    eventName: "ai_search_parsed",
    resultCount: listings.length,
    searchFilters: interpretedSearch,
    searchQuery: parsed.data.prompt,
  });

  return NextResponse.json(interpretedSearch);
}
