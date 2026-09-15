"use client";

import Link from "next/link";
import clsx from "clsx";
import { Map, MapPin, SlidersHorizontal, Sparkles } from "lucide-react";
import {
  ListingCardMedia,
  ListingSaveButton,
} from "@/components/listing-card-primitives";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Price,
  Surface,
} from "@/components/ui/primitives";
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
            <Badge tone="success" className="mt-2">
              Dates checked against live reservations and host blocks
            </Badge>
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
            <Badge key={label} tone="neutral">
              {label}
            </Badge>
          ))}
        </div>
      )}

      {displayedListings.length > 0 ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5 md:grid-cols-2">
            {displayedListings.map((listing, index) => (
              <Surface
                as="article"
                key={listing.id}
                className={clsx(
                  "group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md",
                  selectedListing?.id === listing.id && "border-[#ff385c]",
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
                    <Badge
                      tone="neutral"
                      className="absolute left-3 top-3 bg-white/95 text-sm font-semibold shadow-sm"
                    >
                      {listing.matchScore}% match
                    </Badge>
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
                      <Badge tone="neutral" className="shrink-0">
                        Live
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#5f5148]">
                      <span>{listing.propertyType}</span>
                      <span>{listing.bedrooms} bed</span>
                      <span>{listing.capacity} guests</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm">
                        <Price amount={listing.pricePerNight} />
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
                  <ButtonLink
                    href={`/listings/${listing.id}${
                      listingDetailQuery ? `?${listingDetailQuery}` : ""
                    }`}
                    aria-label={`Reserve ${listing.title}`}
                    size="sm"
                    variant="secondary"
                  >
                    Reserve
                  </ButtonLink>
                </div>
              </Surface>
            ))}
          </div>

          {selectedListing && (
            <Surface as="aside" className="self-start p-5 xl:sticky xl:top-24">
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
            </Surface>
          )}

          {pagination &&
            (pagination.hasPreviousPage || pagination.hasNextPage) && (
              <div className="md:col-span-2 xl:col-span-1">
                <SearchPagination pagination={pagination} />
              </div>
            )}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          icon={Sparkles}
          title="No stays match this trip yet."
          body={
            availabilityFilterApplied
              ? "Those dates may already be booked or blocked by hosts. Try nearby dates, widen the budget, or clear advanced filters."
              : "StayWise can loosen the filters, widen the budget, or use AI search to translate the trip into a better set of matches."
          }
          actions={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onClearAdvancedFilters}
              >
                Clear advanced filters
              </Button>
              <Button
              type="button"
                variant="outline"
                onClick={onFocusSearch}
              >
                Try AI search
              </Button>
            </>
          }
        />
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
    <Surface
      as="nav"
      aria-label="Search result pages"
      className="flex flex-col gap-3 p-4 text-sm font-extrabold sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-[#5f5148]">
        Page {pagination.page}
        {pagination.totalCount > 0 ? ` · ${pagination.totalCount} total` : ""}
      </p>
      <div className="flex gap-2">
        {pagination.hasPreviousPage && (
          <ButtonLink
            href={pagination.previousHref}
            size="sm"
            variant="outline"
          >
            Previous
          </ButtonLink>
        )}
        {pagination.hasNextPage && (
          <ButtonLink
            href={pagination.nextHref}
            size="sm"
            variant="secondary"
          >
            Next page
          </ButtonLink>
        )}
      </div>
    </Surface>
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
        <Badge tone="brand" className="text-sm font-semibold">
          {listing.matchScore}%
        </Badge>
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
          <Badge key={amenity} tone="info" className="font-semibold">
            {amenity}
          </Badge>
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
          <Badge
            tone="neutral"
            className="absolute left-4 top-4 bg-white/95 shadow-sm"
          >
            Real map source
          </Badge>
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

      <ButtonLink
        href={`/listings/${listing.id}${
          listingDetailQuery ? `?${listingDetailQuery}` : ""
        }`}
        className="mt-5 w-full"
        variant="secondary"
      >
        Open listing
      </ButtonLink>
    </>
  );
}
