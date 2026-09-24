import type { Metadata } from "next";
import { MarketplaceHome } from "@/components/marketplace-home";
import {
  getCurrentUserProfile,
  getFavoriteListingIds,
  getPublicListingsResult,
} from "@/lib/listing-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Smart Stays, Better Days",
  description:
    "Find real StayWise stays with AI-ranked recommendations, verified account flows, saved stays, and host-ready booking workflows.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "StayWise: Smart Stays, Better Days.",
    description:
      "Find real StayWise stays with AI-ranked recommendations, verified account flows, saved stays, and host-ready booking workflows.",
    url: "/",
  },
};

export default async function Home() {
  const { user, profile } = await getCurrentUserProfile();
  const [listingResult, favoriteIds] = await Promise.all([
    getPublicListingsResult(),
    user ? getFavoriteListingIds(user.id) : Promise.resolve([]),
  ]);
  const accountRole =
    profile?.role === "host" ? "host" : profile?.role === "guest" ? "guest" : null;

  return (
    <MarketplaceHome
      accountRole={accountRole}
      dataState={listingResult.dataState}
      initialFavoriteIds={favoriteIds}
      initialListings={listingResult.listings}
      isSignedIn={Boolean(user)}
    />
  );
}
