import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RecommendationEventName =
  | "search_submitted"
  | "ai_search_parsed"
  | "listing_clicked"
  | "favorite_created"
  | "reservation_started"
  | "reservation_confirmed";

type RecommendationEventInput = {
  eventName: RecommendationEventName;
  listingId?: string | null;
  rankPosition?: number | null;
  reasonCodes?: string[];
  resultCount?: number | null;
  score?: number | null;
  searchFilters?: Record<string, unknown>;
  searchQuery?: string | null;
};

export async function recordRecommendationEvent(input: RecommendationEventInput) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("recommendation_events").insert({
    event_name: input.eventName,
    listing_id: input.listingId ?? null,
    profile_id: user?.id ?? null,
    rank_position: input.rankPosition ?? null,
    reason_codes: input.reasonCodes ?? [],
    result_count: input.resultCount ?? null,
    score: input.score ?? null,
    search_filters: input.searchFilters ?? {},
    search_query: input.searchQuery ?? null,
  });

  if (error && !isMissingRecommendationTable(error.message)) {
    console.warn("Unable to record recommendation event", error.message);
  }
}

function isMissingRecommendationTable(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("schema cache") ||
    normalized.includes("could not find") ||
    normalized.includes("does not exist")
  );
}
