"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ListingFacts,
  ListingCardMedia,
  ListingLocationLine,
  ListingSaveButton,
} from "@/components/listing-card-primitives";
import { Badge, Price } from "@/components/ui/primitives";
import {
  createListingSearchInput,
  homeSearchInput,
} from "@/lib/search-presets";
import { buildSearchQueryString } from "@/lib/search-url";
import type { RankedListing } from "@/lib/recommendations";

export type MarketplaceListingSection = {
  href: string;
  listings: RankedListing[];
  subtitle: string;
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
    <section className="space-y-11 py-12">
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
  subtitle: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-[1536px] px-5 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-[#786a60]">
            {subtitle}
          </p>
        </div>
        <Link
          href={href}
          aria-label={`View all ${title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1ebe6] text-[#201a18] hover:bg-[#201a18] hover:text-white"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid auto-cols-[minmax(245px,1fr)] grid-flow-col gap-5 overflow-x-auto pb-3 [scrollbar-width:none] md:auto-cols-[minmax(260px,1fr)] lg:auto-cols-[minmax(275px,1fr)]">
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
      <div className="relative overflow-hidden rounded-[24px] bg-[#e8dfd6] shadow-sm">
        <ListingCardMedia
          href={href}
          aria-label={`View ${listing.title}`}
          frameClassName="block aspect-square rounded-[24px]"
          imageClassName="transition duration-500 group-hover:scale-105"
          listing={listing}
          priority={priority}
          sizes="(min-width: 1280px) 280px, (min-width: 768px) 33vw, 82vw"
        />
        <Badge tone="neutral" className="absolute left-3 top-3 bg-white/95 shadow-sm">
          {listing.matchScore}% match
        </Badge>
        <ListingSaveButton
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#201a18] shadow-sm backdrop-blur transition hover:scale-105"
          iconClassName="h-5 w-5"
          listingTitle={listing.title}
          onClick={() => onToggleSaved(listing.id)}
          saved={saved}
        />
      </div>

      <Link href={href} className="mt-3 block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-extrabold leading-5">
              {listing.title}
            </h3>
            <ListingLocationLine listing={listing} className="mt-1" />
          </div>
          <Badge tone="neutral" className="shrink-0">Live</Badge>
        </div>
        <ListingFacts listing={listing} className="mt-2" />
        <p className="mt-2 text-sm text-[#5f5148]">
          <Price amount={listing.pricePerNight} />
        </p>
        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#315d3b]">
          {listing.matchReasons[0]}
        </p>
      </Link>
    </article>
  );
}
