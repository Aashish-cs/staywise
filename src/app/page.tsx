import { MarketplaceHome } from "@/components/marketplace-home";
import {
  getCurrentUserProfile,
  getFavoriteListingIds,
  getPublicListings,
} from "@/lib/listing-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await getPublicListings();
  const { user, profile } = await getCurrentUserProfile();
  const favoriteIds = user ? await getFavoriteListingIds(user.id) : [];
  const accountRole =
    profile?.role === "host" ? "host" : profile?.role === "guest" ? "guest" : null;

  return (
    <MarketplaceHome
      accountRole={accountRole}
      initialFavoriteIds={favoriteIds}
      initialListings={listings}
      isSignedIn={Boolean(user)}
    />
  );
}
