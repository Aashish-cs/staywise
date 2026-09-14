import type { Metadata } from "next";
import { SearchExperience } from "@/components/search-experience";
import {
  filterListingsByAvailability,
  getCurrentUserProfile,
  getFavoriteListingIds,
  getPublicListings,
} from "@/lib/listing-data";
import {
  buildSearchQueryString,
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
  const publicListings = await getPublicListings();
  const listings = await filterListingsByAvailability(
    publicListings,
    search.checkIn,
    search.checkOut,
  );
  const { user, profile } = await getCurrentUserProfile();
  const favoriteIds = user ? await getFavoriteListingIds(user.id) : [];
  const location = search.destination
    ? await resolveLocationForPage(search.destination)
    : null;
  const accountRole =
    profile?.role === "host" ? "host" : profile?.role === "guest" ? "guest" : null;

  return (
    <SearchExperience
      key={buildSearchQueryString(search)}
      accountRole={accountRole}
      initialFavoriteIds={favoriteIds}
      initialListings={listings}
      initialLocation={location}
      initialSearch={search}
      isSignedIn={Boolean(user)}
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
