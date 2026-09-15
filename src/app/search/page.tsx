import type { Metadata } from "next";
import { SearchExperience } from "@/components/search-experience";
import {
  getCurrentUserProfile,
  getFavoriteListingIds,
  searchPublicListings,
} from "@/lib/listing-data";
import {
  buildSearchPageQueryString,
  parseSearchPage,
  parseSearchParams,
  type RawSearchParams,
} from "@/lib/search-url";
import { resolveSearchLocation } from "@/lib/location-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search stays",
  description: "Search real StayWise listings with AI-ranked recommendations.",
};

type SearchPageProps = {
  searchParams: Promise<RawSearchParams>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = await searchParams;
  const search = parseSearchParams(query);
  const location = search.destination
    ? await resolveLocationForPage(search.destination)
    : null;
  const listingResult = await searchPublicListings(search, {
    location,
    page: parseSearchPage(query),
    pageSize: 24,
  });
  const { user, profile } = await getCurrentUserProfile();
  const favoriteIds = user ? await getFavoriteListingIds(user.id) : [];
  const accountRole =
    profile?.role === "host" ? "host" : profile?.role === "guest" ? "guest" : null;
  const currentQuery = buildSearchPageQueryString(search, listingResult.page);
  const nextQuery = buildSearchPageQueryString(search, listingResult.page + 1);
  const previousQuery = buildSearchPageQueryString(search, listingResult.page - 1);

  return (
    <SearchExperience
      key={currentQuery}
      accountRole={accountRole}
      initialFavoriteIds={favoriteIds}
      initialListings={listingResult.listings}
      initialLocation={location}
      initialSearch={search}
      isSignedIn={Boolean(user)}
      pagination={{
        hasNextPage: listingResult.hasNextPage,
        hasPreviousPage: listingResult.hasPreviousPage,
        nextHref: `/search${nextQuery ? `?${nextQuery}` : ""}`,
        page: listingResult.page,
        previousHref: `/search${previousQuery ? `?${previousQuery}` : ""}`,
        totalCount: listingResult.totalCount,
      }}
      showProductSections={false}
    />
  );
}

async function resolveLocationForPage(destination: string) {
  try {
    return await resolveSearchLocation(destination);
  } catch (error) {
    console.error("Unable to resolve destination", error);
    return null;
  }
}
