"use client";

import Link from "next/link";
import clsx from "clsx";
import { Map, MapPin, SlidersHorizontal, Sparkles } from "lucide-react";
import {
  ListingCardMedia,
  ListingSaveButton,
} from "@/components/listing-card-primitives";
import {
  getOpenStreetMapEmbedUrl,
  getOpenStreetMapUrl,
} from "@/lib/listing-map";
import { formatDistanceMiles } from "@/lib/location-distance";
import type { RankedListing } from "@/lib/recommendations";
import type { SortMode } from "@/lib/search-results";

type SearchResultsSectionProps = {
  activeFilterCount: number;
  activeFilterLabels: string[];
  availabilityFilterApplied: boolean;
  displayedListings: RankedListing[];
  listingDetailQuery: string;
  onClearAdvancedFilters: () => void;
  onFocusSearch: () => void;
  onSelectListing: (listingId: string | null) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onToggleMapPanel: () => void;
  onToggleSaved: (listingId: string) => void;
  pagination?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextHref: string;
    page: number;
    previousHref: string;
    totalCount: number;
  };
  resultSummary: string;
  savedIds: string[];
  selectedListing?: RankedListing;
  showMapPanel: boolean;
  sortMode: SortMode;
};

export function SearchResultsSection({
  activeFilterCount,
  activeFilterLabels,
  availabilityFilterApplied,
  displayedListings,
  listingDetailQuery,
  onClearAdvancedFilters,
  onFocusSearch,
  onSelectListing,
  onSortModeChange,
  onToggleMapPanel,
  onToggleSaved,
  pagination,
  resultSummary,
  savedIds,
  selectedListing,
  showMapPanel,
  sortMode,
}: SearchResultsSectionProps) {
  return (
    <section id="results" className="min-w-0 scroll-mt-24">
      <div className="flex flex-col gap-4 border-b border-[#eadfd6] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#786a60]">
            {resultSummary}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Recommended stays
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148]">
            Smart sort weighs budget, trip style, guest count, amenities, and the
            filters in your shareable search URL.
          </p>
          {availabilityFilterApplied && (
            <p className="mt-2 inline-flex rounded-full bg-[#e7f2e4] px-3 py-1 text-xs font-extrabold text-[#315d3b]">
              Dates checked against live reservations and host blocks
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button type="button" className="toolbar-button" onClick={onFocusSearch}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <label className="toolbar-button">
            <span>Sort</span>
            <select
              aria-label="Sort results"
              value={sortMode}
              onChange={(event) => onSortModeChange(event.target.value as SortMode)}
              className="bg-transparent text-sm font-extrabold outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Lowest price</option>
              <option value="space">Most space</option>
            </select>
          </label>
          <button
            type="button"
            aria-pressed={showMapPanel}
            className={clsx(
              "toolbar-button",
              showMapPanel && "border-[#ff385c] text-[#df2348]",
            )}
            onClick={onToggleMapPanel}
          >
            <Map className="h-4 w-4" aria-hidden="true" />
            Map view
          </button>
        </div>
      </div>

      {activeFilterLabels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilterLabels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148]"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {displayedListings.length > 0 ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5 md:grid-cols-2">
            {displayedListings.map((listing, index) => (
              <article
                key={listing.id}
                className={clsx(
                  "group overflow-hidden rounded-[22px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  selectedListing?.id === listing.id
                    ? "border-[#ff385c]"
                    : "border-[#eadfd6]",
                )}
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  aria-label={`View details for ${listing.title}`}
                  onClick={() => onSelectListing(listing.id)}
                >
                  <ListingCardMedia
                    imageClassName="transition duration-500 group-hover:scale-105"
                    listing={listing}
                    priority={index === 0}
                    sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                  >
                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold shadow-sm">
                      {listing.matchScore}% match
                    </div>
                  </ListingCardMedia>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="line-clamp-2 text-base font-semibold">
                          {listing.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#786a60]">
                          {listing.neighborhood}, {listing.city}
                          {listing.distanceMiles !== null
                            ? ` · ${formatDistanceMiles(listing.distanceMiles)} away`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148]">
                        Live
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#5f5148]">
                      <span>{listing.propertyType}</span>
                      <span>{listing.bedrooms} bed</span>
                      <span>{listing.capacity} guests</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm">
                        <span className="font-semibold">${listing.pricePerNight}</span>{" "}
                        night
                      </p>
                      <p className="text-xs font-semibold text-[#315d3b]">
                        {listing.matchReasons[0]}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="flex items-center justify-between border-t border-[#f0e7df] px-4 py-3">
                  <ListingSaveButton
                    className="flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-[#fff3f5]"
                    iconClassName="h-4 w-4"
                    listingTitle={listing.title}
                    onClick={() => onToggleSaved(listing.id)}
                    saved={savedIds.includes(listing.id)}
                    showLabel
                  />
                  <Link
                    href={`/listings/${listing.id}${
                      listingDetailQuery ? `?${listingDetailQuery}` : ""
                    }`}
                    aria-label={`Reserve ${listing.title}`}
                    className="rounded-full bg-[#201a18] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                  >
                    Reserve
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {selectedListing && (
            <aside className="self-start rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm xl:sticky xl:top-24">
              {showMapPanel ? (
                <ListingMapPanel
                  listings={displayedListings}
                  listing={selectedListing}
                  listingDetailQuery={listingDetailQuery}
                  onSelectListing={onSelectListing}
                />
              ) : (
                <ListingFitPanel listing={selectedListing} />
              )}
            </aside>
          )}

          {pagination &&
            (pagination.hasPreviousPage || pagination.hasNextPage) && (
              <div className="md:col-span-2 xl:col-span-1">
                <SearchPagination pagination={pagination} />
              </div>
            )}
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-[#d7c8bd] bg-white p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[#ff385c]" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold">No stays match this trip yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#786a60]">
            {availabilityFilterApplied
              ? "Those dates may already be booked or blocked by hosts. Try nearby dates, widen the budget, or clear advanced filters."
              : "StayWise can loosen the filters, widen the budget, or use AI search to translate the trip into a better set of matches."}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
              onClick={onClearAdvancedFilters}
            >
              Clear advanced filters
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#eadfd6] px-5 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348]"
              onClick={onFocusSearch}
            >
              Try AI search
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function SearchPagination({
  pagination,
}: {
  pagination: NonNullable<SearchResultsSectionProps["pagination"]>;
}) {
  return (
    <nav
      aria-label="Search result pages"
      className="flex flex-col gap-3 rounded-[22px] border border-[#eadfd6] bg-white p-4 text-sm font-extrabold sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-[#5f5148]">
        Page {pagination.page}
        {pagination.totalCount > 0 ? ` · ${pagination.totalCount} total` : ""}
      </p>
      <div className="flex gap-2">
        {pagination.hasPreviousPage && (
          <Link
            href={pagination.previousHref}
            className="rounded-full border border-[#eadfd6] px-4 py-2 hover:border-[#ff385c] hover:text-[#df2348]"
          >
            Previous
          </Link>
        )}
        {pagination.hasNextPage && (
          <Link
            href={pagination.nextHref}
            className="rounded-full bg-[#201a18] px-4 py-2 text-white hover:bg-black"
          >
            Next page
          </Link>
        )}
      </div>
    </nav>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f3ee] p-3">
      <p className="text-xs font-semibold uppercase text-[#786a60]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ListingFitPanel({ listing }: { listing: RankedListing }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ff385c]">StayWise fit</p>
          <h3 className="mt-1 text-xl font-semibold">{listing.title}</h3>
        </div>
        <span className="rounded-full bg-[#fff3f5] px-3 py-1 text-sm font-semibold text-[#bd1740]">
          {listing.matchScore}%
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#5f5148]">{listing.description}</p>

      <div className="mt-5 space-y-3">
        {listing.matchReasons.map((reason) => (
          <div key={reason} className="flex gap-3">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-[#ff385c]"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">{reason}</p>
          </div>
        ))}
      </div>

      {listing.tradeoffs.length > 0 && (
        <div className="mt-5 rounded-2xl bg-[#f7f3ee] p-4">
          <p className="text-sm font-semibold">Tradeoffs</p>
          <ul className="mt-2 space-y-2 text-sm text-[#5f5148]">
            {listing.tradeoffs.map((tradeoff) => (
              <li key={tradeoff}>{tradeoff}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Host" value={listing.host.name} />
        <Metric label="Status" value="Verified" />
        {listing.distanceMiles !== null && (
          <Metric
            label="Distance"
            value={`${formatDistanceMiles(listing.distanceMiles)} away`}
          />
        )}
        <Metric label="Beds" value={`${listing.bedrooms}`} />
        <Metric label="Baths" value={`${listing.bathrooms}`} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {listing.amenities.slice(0, 5).map((amenity) => (
          <span
            key={amenity}
            className="rounded-full bg-[#edf6f8] px-3 py-1 text-xs font-semibold text-[#23515a]"
          >
            {amenity}
          </span>
        ))}
      </div>
    </>
  );
}

function ListingMapPanel({
  listings,
  listing,
  listingDetailQuery,
  onSelectListing,
}: {
  listings: RankedListing[];
  listing: RankedListing;
  listingDetailQuery: string;
  onSelectListing: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ff385c]">Map search</p>
          <h3 className="mt-1 text-xl font-semibold">
            {listings.length} stays near {listing.city}
          </h3>
        </div>
        <MapPin className="h-5 w-5 shrink-0 text-[#ff385c]" aria-hidden="true" />
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-[#eadfd6] bg-[#edf6f8]">
        <div className="relative h-72">
          <iframe
            title={`OpenStreetMap area for ${listing.title}`}
            src={getOpenStreetMapEmbedUrl(listing)}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
          />
          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#5f5148] shadow-sm">
            Real map source
          </div>
          <Link
            href={getOpenStreetMapUrl(listing)}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#201a18] shadow-sm hover:text-[#df2348]"
          >
            Open map
          </Link>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-[#786a60]">
        Map uses the listing coordinates stored in Supabase and shows an approximate
        area, not an exact address.
      </p>

      <div className="mt-5 max-h-[310px] space-y-3 overflow-y-auto pr-1">
        {listings.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx(
              "w-full rounded-2xl border p-3 text-left transition hover:border-[#ff385c]",
              item.id === listing.id
                ? "border-[#ff385c] bg-[#fff3f5]"
                : "border-[#eadfd6] bg-white",
            )}
            onClick={() => onSelectListing(item.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="line-clamp-1 text-sm font-extrabold">{item.title}</p>
                <p className="mt-1 text-xs font-semibold text-[#786a60]">
                  {item.neighborhood}, {item.city}
                  {item.distanceMiles !== null
                    ? ` · ${formatDistanceMiles(item.distanceMiles)} away`
                    : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold">
                ${item.pricePerNight}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#315d3b]">
              {item.matchScore}% match · {item.matchReasons[0]}
            </p>
          </button>
        ))}
      </div>

      <Link
        href={`/listings/${listing.id}${
          listingDetailQuery ? `?${listingDetailQuery}` : ""
        }`}
        className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#201a18] px-4 text-sm font-semibold text-white hover:bg-black"
      >
        Open listing
      </Link>
    </>
  );
}
