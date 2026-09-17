import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FavoritesExperience } from "@/components/favorites-experience";
import { StayWiseHeader } from "@/components/staywise-header";
import {
  getCurrentUserProfile,
  getFavoriteListings,
} from "@/lib/listing-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Stays",
  description:
    "Review and manage the StayWise listings saved to your verified guest account.",
};

export default async function FavoritesPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/auth?mode=signin&next=/favorites");
  }

  const accountRole =
    profile?.role === "host" ? "host" : profile?.role === "guest" ? "guest" : null;
  const listings = accountRole === "guest" ? await getFavoriteListings(user.id) : [];

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <StayWiseHeader
        actions={
          <>
            <Link
              href="/search"
              className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] sm:block"
            >
              Search
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold shadow-sm hover:border-[#ff385c]"
            >
              My trips
            </Link>
          </>
        }
      />

      <FavoritesExperience
        accountRole={accountRole}
        initialListings={listings}
        isSignedIn={Boolean(user)}
      />
    </main>
  );
}
