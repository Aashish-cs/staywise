import type { RankedListing, SearchInput } from "@/lib/recommendations";

export type SortMode = "recommended" | "price-low" | "space";

export function getSearchResultSummary(
  listings: RankedListing[],
  search: SearchInput,
) {
  return `${listings.length} ${listings.length === 1 ? "match" : "matches"}${
    search.destination ? ` near ${search.destination}` : ""
  }`;
}

export function getActiveSearchFilterLabels(search: SearchInput) {
  const labels: string[] = [];

  if (search.destination) labels.push(search.destination);
  if (search.guests > 1) labels.push(`${search.guests} guests`);
  if (search.maxNightlyBudget) labels.push(`Up to $${search.maxNightlyBudget}`);
  if (search.minBedrooms > 0) labels.push(`${search.minBedrooms}+ bedrooms`);
  if (search.minBathrooms > 0) labels.push(`${search.minBathrooms}+ baths`);
  labels.push(...search.propertyTypes);
  labels.push(...search.amenities);

  return labels.slice(0, 10);
}

export function sortRankedListings(
  listings: RankedListing[],
  sortMode: SortMode,
) {
  const sorted = [...listings];

  if (sortMode === "price-low") {
    return sorted.sort(
      (first, second) =>
        first.pricePerNight - second.pricePerNight ||
        second.matchScore - first.matchScore,
    );
  }

  if (sortMode === "space") {
    return sorted.sort(
      (first, second) =>
        second.bedrooms - first.bedrooms ||
        second.capacity - first.capacity ||
        second.matchScore - first.matchScore,
    );
  }

  return sorted;
}
