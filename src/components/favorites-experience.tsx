"use client";

import Link from "next/link";
import { ArrowRight, Heart, Search, Sparkles } from "lucide-react";
import {
  ListingCardMedia,
  ListingFacts,
  ListingLocationLine,
  ListingSaveButton,
} from "@/components/listing-card-primitives";
import { useSavedListings } from "@/hooks/use-saved-listings";
import type { Listing } from "@/lib/listings";
import { formatMoney } from "@/lib/reservation-utils";

export function FavoritesExperience({
  accountRole,
  initialListings,
  isSignedIn,
}: {
  accountRole: "guest" | "host" | null;
  initialListings: Listing[];
  isSignedIn: boolean;
}) {
  const { notice, savedIds, toggleSaved } = useSavedListings({
    accountRole,
    initialSavedIds: initialListings.map((listing) => listing.id),
    isSignedIn,
    showSuccessMessage: true,
    signInHref: "/auth?mode=signin&next=/favorites",
  });
  const visibleListings = initialListings.filter((listing) =>
    savedIds.includes(listing.id),
  );

  return (
    <section className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div>
          <p className="text-sm font-extrabold text-[#ff385c]">Saved stays</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Compare your favorite StayWise homes.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#5f5148]">
            Saved stays persist to your guest account, survive refreshes, and stay synced
            with the heart buttons across search, home, and listing pages.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-extrabold text-white hover:bg-[#df2348]"
            >
              Find more stays
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold hover:border-[#ff385c]"
            >
              My trips
            </Link>
          </div>
        </div>

        <aside className="rounded-[28px] border border-[#eadfd6] bg-[#fbfaf8] p-5 shadow-sm">
          <Sparkles className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold text-[#5f5148]">Saved count</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">
            {visibleListings.length}
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#5f5148]">
            Remove a stay here and the saved state will also disappear on search and
            listing detail after refresh.
          </p>
        </aside>
      </div>

      {notice && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f7f3ee] px-4 py-2 text-sm font-extrabold text-[#5f5148]">
          <Heart className="h-4 w-4 fill-[#ff385c] text-[#ff385c]" aria-hidden="true" />
          {notice}
        </p>
      )}

      {accountRole !== "guest" ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-[#d7c8bd] bg-white p-8">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Use a guest account to save stays.
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#5f5148]">
            Host accounts manage listings and reservations. Guest accounts keep saved
            homes, trips, and reservation confirmations.
          </p>
        </div>
      ) : visibleListings.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleListings.map((listing, index) => (
            <FavoriteCard
              key={listing.id}
              listing={listing}
              onToggleSaved={toggleSaved}
              priority={index < 2}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[28px] border border-dashed border-[#d7c8bd] bg-white p-8">
          <h2 className="text-2xl font-extrabold tracking-tight">
            No saved stays yet.
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#5f5148]">
            Tap the heart on a listing to build a shortlist. Your saved stays will
            appear here as real persisted favorites.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
          >
            Search stays
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}

function FavoriteCard({
  listing,
  onToggleSaved,
  priority,
}: {
  listing: Listing;
  onToggleSaved: (id: string) => void;
  priority: boolean;
}) {
  const href = `/listings/${listing.id}?destination=${encodeURIComponent(
    listing.city,
  )}&guests=2&budget=${listing.pricePerNight + 75}`;

  return (
    <article className="group overflow-hidden rounded-[24px] border border-[#eadfd6] bg-white shadow-sm">
      <div className="relative">
        <ListingCardMedia
          href={href}
          ariaLabel={`View ${listing.title}`}
          frameClassName="block aspect-[4/3] rounded-none"
          imageClassName="transition duration-500 group-hover:scale-105"
          listing={listing}
          priority={priority}
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <ListingSaveButton
          className="absolute right-3 top-3 inline-flex h-10 items-center gap-2 rounded-full bg-white/95 px-3 text-sm font-extrabold text-[#201a18] shadow-sm transition hover:text-[#df2348]"
          iconClassName="h-4 w-4"
          listingTitle={listing.title}
          onClick={() => onToggleSaved(listing.id)}
          saved
          showLabel
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-lg font-extrabold tracking-tight">
            {listing.title}
          </h2>
          <span className="shrink-0 rounded-full bg-[#fff3f5] px-3 py-1 text-xs font-extrabold text-[#bd1740]">
            Saved
          </span>
        </div>
        <ListingLocationLine listing={listing} className="mt-2" />
        <ListingFacts listing={listing} className="mt-2" />
        <p className="mt-4 text-sm font-semibold leading-6 text-[#5f5148]">
          {listing.description}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-extrabold">{formatMoney(listing.pricePerNight)}</span>{" "}
            night
          </p>
          <Link
            href={href}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#201a18] px-4 text-sm font-extrabold text-white hover:bg-black"
          >
            Open stay
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
