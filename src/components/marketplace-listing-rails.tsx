"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import {
  ListingCardMedia,
  ListingSaveButton,
} from "@/components/listing-card-primitives";
import { Badge } from "@/components/ui/primitives";
import {
  createListingSearchInput,
  homeSearchInput,
} from "@/lib/search-presets";
import { buildSearchQueryString } from "@/lib/search-url";
import type { RankedListing } from "@/lib/recommendations";

export type MarketplaceListingSection = {
  href: string;
  listings: RankedListing[];
  subtitle?: string;
  title: string;
};

type MarketplaceListingRailsProps = {
  onToggleSaved: (id: string) => void;
  savedIds: string[];
  sections: MarketplaceListingSection[];
};

export function MarketplaceListingRails({
  onToggleSaved,
  savedIds,
  sections,
}: MarketplaceListingRailsProps) {
  return (
    <section className="space-y-14 py-10">
      {sections.map((section, sectionIndex) => (
        <ListingRail
          key={section.title}
          href={section.href}
          listings={section.listings}
          onToggleSaved={onToggleSaved}
          savedIds={savedIds}
          sectionIndex={sectionIndex}
          subtitle={section.subtitle}
          title={section.title}
        />
      ))}
    </section>
  );
}

function ListingRail({
  href,
  listings,
  onToggleSaved,
  savedIds,
  sectionIndex,
  subtitle,
  title,
}: {
  href: string;
  listings: RankedListing[];
  onToggleSaved: (id: string) => void;
  savedIds: string[];
  sectionIndex: number;
  subtitle?: string;
  title: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollRail(direction: "next" | "previous") {
    railRef.current?.scrollBy({
      behavior: "smooth",
      left:
        direction === "next"
          ? railRef.current.clientWidth * 0.82
          : -railRef.current.clientWidth * 0.82,
    });
  }

  return (
    <section className="mx-auto max-w-[1760px] px-5 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <Link href={href} className="group inline-flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">
              {title}
            </h2>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f1f1] text-[#201a18] transition group-hover:bg-[#201a18] group-hover:text-white">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm font-semibold text-[#786a60]">
              {subtitle}
            </p>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label={`Show previous ${title.toLowerCase()}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ded6d0] bg-white text-[#201a18] transition hover:bg-[#f7f3ee] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => scrollRail("previous")}
            title="Show previous stays"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Show more ${title.toLowerCase()}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ded6d0] bg-white text-[#201a18] transition hover:bg-[#f7f3ee]"
            onClick={() => scrollRail("next")}
            title="Show more stays"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="scrollbar-hide grid snap-x auto-cols-[78vw] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-[250px] sm:gap-5 lg:auto-cols-[224px] xl:auto-cols-[228px] 2xl:auto-cols-[232px]"
      >
        {listings.map((listing, index) => (
          <MarketplaceListingCard
            key={`${title}-${listing.id}`}
            listing={listing}
            onToggleSaved={onToggleSaved}
            priority={sectionIndex === 0 && index < 2}
            saved={savedIds.includes(listing.id)}
          />
        ))}
      </div>
    </section>
  );
}

function MarketplaceListingCard({
  listing,
  onToggleSaved,
  priority,
  saved,
}: {
  listing: RankedListing;
  onToggleSaved: (id: string) => void;
  priority: boolean;
  saved: boolean;
}) {
  const query = buildSearchQueryString({
    ...homeSearchInput,
    ...createListingSearchInput(listing),
  });
  const href = `/listings/${listing.id}${query ? `?${query}` : ""}`;

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-[22px] bg-[#e8dfd6] shadow-sm">
        <ListingCardMedia
          href={href}
          aria-label={`View ${listing.title}`}
          frameClassName="block aspect-[4/3] rounded-[18px]"
          imageClassName="transition duration-500 group-hover:scale-105"
          listing={listing}
          priority={priority}
          sizes="(min-width: 1536px) 250px, (min-width: 1024px) 238px, (min-width: 640px) 250px, 78vw"
        />
        {isGuestFavorite(listing) && (
          <Badge tone="neutral" className="absolute left-3 top-3 bg-white/95 shadow-sm">
            Guest favorite
          </Badge>
        )}
        <ListingSaveButton
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)] transition hover:scale-105"
          iconClassName="h-7 w-7 fill-black/25 stroke-[2.5]"
          listingTitle={listing.title}
          onClick={() => onToggleSaved(listing.id)}
          saved={saved}
        />
      </div>

      <Link href={href} className="mt-3 block">
        <h3 className="line-clamp-1 text-base font-extrabold leading-6">
          {formatListingCardTitle(listing)}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-[#6f655e]">
          {formatTwoNightPrice(listing.pricePerNight)}
          {listing.ratingAverage ? (
            <> · ★ {formatRating(listing.ratingAverage)}</>
          ) : null}
        </p>
      </Link>
    </article>
  );
}

function formatListingCardTitle(listing: RankedListing) {
  const type = listing.propertyType === "House" ? "Home" : listing.propertyType;

  return `${type} in ${listing.city}`;
}

function formatTwoNightPrice(pricePerNight: number) {
  return `${new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(pricePerNight * 2)} for 2 nights`;
}

function formatRating(rating: number) {
  return rating.toFixed(2).replace(/0$/, "").replace(/\.0$/, ".0");
}

function isGuestFavorite(listing: RankedListing) {
  return (listing.ratingAverage ?? 0) >= 4.8 || listing.matchScore >= 88;
}
