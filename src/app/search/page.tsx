import type { Metadata } from "next";
import { SearchExperience } from "@/components/search-experience";
import {
  getCurrentUserProfile,
  getGuestRecentTripCities,
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

type SearchPageProps = {
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const query = await searchParams;
  const search = parseSearchParams(query);
  const destination = search.destination.trim();
  const hasQuery = Object.values(query).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );
  const title = destination ? `${destination} stays` : "Search stays";
  const description = destination
    ? `Search real StayWise listings near ${destination} with AI-ranked recommendations, explainable matches, and booking-ready filters.`
    : "Search real StayWise listings with AI-ranked recommendations, explainable matches, and booking-ready filters.";

  return {
    title,
    description,
    alternates: {
      canonical: "/search",
    },
    robots: hasQuery ? { follow: true, index: false } : undefined,
    openGraph: {
      title: `${title} | StayWise`,
      description,
      url: "/search",
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = await searchParams;
  const search = parseSearchParams(query);
  const { user, profile } = await getCurrentUserProfile();
  const [favoriteIds, preferredCities] = user
    ? await Promise.all([
        getFavoriteListingIds(user.id),
        getGuestRecentTripCities(user.id),
      ])
    : [[], []];
  const location = search.destination
    ? await resolveLocationForPage(search.destination)
    : null;
  const listingResult = await searchPublicListings(search, {
    location,
    page: parseSearchPage(query),
    pageSize: 24,
    recommendationContext: {
      favoriteListingIds: favoriteIds,
      preferredCities,
    },
  });
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
