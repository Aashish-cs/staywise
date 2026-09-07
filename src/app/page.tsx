import { SearchExperience } from "@/components/search-experience";
import {
  getCurrentUserProfile,
  getFavoriteListingIds,
  getPublicListings,
} from "@/lib/listing-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await getPublicListings();
  const { user } = await getCurrentUserProfile();
  const favoriteIds = user ? await getFavoriteListingIds(user.id) : [];

  return (
    <SearchExperience
      initialFavoriteIds={favoriteIds}
      initialListings={listings}
      isSignedIn={Boolean(user)}
    />
  );
}
