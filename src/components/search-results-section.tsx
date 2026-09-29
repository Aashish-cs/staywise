"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import clsx from "clsx";
import {
  ExternalLink,
  Map as MapIcon,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  ListingFacts,
  ListingCardMedia,
  ListingLocationLine,
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
import { formatDistanceMiles } from "@/lib/location-distance";
import type { ListingDataState } from "@/lib/listing-data";
import type { NearbyPlace } from "@/lib/nearby-places";
import type { RankedListing, SearchInput } from "@/lib/recommendations";
import type { SortMode } from "@/lib/search-results";

const SearchMapPanel = dynamic(
  () =>
    import("@/components/search-map-panel").then((module) => module.SearchMapPanel),
  {
    loading: () => <SearchMapPanelLoading />,
    ssr: false,
  },
);

type SearchResultsSectionProps = {
  activeFilterCount: number;
  activeFilterLabels: string[];
  availabilityFilterApplied: boolean;
  dataState: ListingDataState;
  displayedListings: RankedListing[];
  listingDetailQuery: string;
  onClearAdvancedFilters: () => void;
  onFocusSearch: () => void;
  onSelectListing: (listingId: string | null) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onToggleMapPanel: () => void;
  onToggleSaved: (listingId: string) => void;
  nearbyPlaces?: NearbyPlace[];
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
  search: SearchInput;
  selectedListing?: RankedListing;
  showMapPanel: boolean;
  sortMode: SortMode;
};

export function SearchResultsSection({
  activeFilterCount,
  activeFilterLabels,
  availabilityFilterApplied,
  dataState,
  displayedListings,
  listingDetailQuery,
  onClearAdvancedFilters,
  onFocusSearch,
  onSelectListing,
  onSortModeChange,
  onToggleMapPanel,
  onToggleSaved,
  nearbyPlaces = [],
  pagination,
  resultSummary,
  savedIds,
  search,
  selectedListing,
  showMapPanel,
  sortMode,
}: SearchResultsSectionProps) {
  const dataUnavailable = dataState.status !== "ready";
  const hasNearbyPlaceFallback =
    !dataUnavailable && displayedListings.length === 0 && nearbyPlaces.length > 0;
  const destinationLabel = search.destination.trim() || "this area";
  const searchSummary = hasNearbyPlaceFallback
    ? `${nearbyPlaces.length} stay options near ${destinationLabel}`
    : resultSummary;

  return (
    <section id="results" className="min-w-0 scroll-mt-24">
      <div className="flex flex-col gap-4 border-b border-[#eadfd6] pb-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#786a60]">
            {dataUnavailable ? "Marketplace data unavailable" : searchSummary}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {dataUnavailable
              ? "Live stays need attention"
              : hasNearbyPlaceFallback
                ? `Places to stay in ${destinationLabel}`
                : "Recommended stays"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148]">
            {dataUnavailable
              ? "StayWise does not fall back to hardcoded places when Supabase is missing or failing."
              : hasNearbyPlaceFallback
                ? "Compare external hotel and guest-stay options with photos, maps, provider links, and a StayWise reserve handoff."
                : "Smart sort weighs budget, trip style, guest count, amenities, and the filters in your shareable search URL."}
          </p>
          {availabilityFilterApplied && (
            <Badge tone="success" className="mt-2">
              Dates checked against live reservations and host blocks
            </Badge>
          )}
        </div>

        <div className="scrollbar-hide flex max-w-full items-center gap-2 overflow-x-auto pb-1">
          <div className="hidden md:block">
            <button type="button" className="toolbar-button" onClick={onFocusSearch}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
          <label className="toolbar-button">
            <span>Sort</span>
            <select
              aria-label="Sort results"
              value={sortMode}
              onChange={(event) => onSortModeChange(event.target.value as SortMode)}
              className="min-w-0 bg-transparent text-sm font-extrabold outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Lowest price</option>
              <option value="space">Most space</option>
            </select>
          </label>
          <div className="hidden md:block">
            <button
              type="button"
              aria-pressed={showMapPanel}
              className={clsx(
                "toolbar-button",
                showMapPanel && "border-[#ff385c] text-[#df2348]",
              )}
              onClick={onToggleMapPanel}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              Map view
            </button>
          </div>
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
          {selectedListing && showMapPanel && (
            <Surface as="aside" className="p-5 xl:hidden">
              <SearchMapPanel
                listings={displayedListings}
                listing={selectedListing}
                listingDetailQuery={listingDetailQuery}
                onSelectListing={onSelectListing}
                search={search}
              />
            </Surface>
          )}

          <div className={clsx("grid gap-5 md:grid-cols-2", showMapPanel && "hidden xl:grid")}>
            {displayedListings.map((listing, index) => {
              const listingHref = `/listings/${listing.id}${
                listingDetailQuery ? `?${listingDetailQuery}` : ""
              }`;

              return (
                <Surface
                  as="article"
                  key={listing.id}
                  className={clsx(
                    "group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md",
                    selectedListing?.id === listing.id && "border-[#ff385c]",
                  )}
                >
                  <Link
                    href={listingHref}
                    className="block"
                    aria-label={`View ${listing.title}`}
                    onFocus={() => onSelectListing(listing.id)}
                    onMouseEnter={() => onSelectListing(listing.id)}
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
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-base font-extrabold leading-6">
                            {listing.title}
                          </h3>
                          <ListingLocationLine
                            listing={listing}
                            distanceMiles={listing.distanceMiles}
                            className="mt-1"
                          />
                        </div>
                        <Badge tone="neutral" className="shrink-0">
                          Live
                        </Badge>
                      </div>

                      <ListingFacts listing={listing} className="mt-3" />

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <p className="text-sm">
                          <Price amount={listing.pricePerNight} />
                        </p>
                        <p className="line-clamp-2 text-right text-xs font-semibold leading-5 text-[#315d3b]">
                          {listing.matchReasons[0]}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between border-t border-[#f0e7df] px-4 py-3">
                    <ListingSaveButton
                      className="flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-[#fff3f5]"
                      iconClassName="h-4 w-4"
                      listingTitle={listing.title}
                      onClick={() => onToggleSaved(listing.id)}
                      saved={savedIds.includes(listing.id)}
                      showLabel
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        aria-label={`Preview ${listing.title}`}
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectListing(listing.id)}
                      >
                        Preview
                      </Button>
                      <ButtonLink
                        href={listingHref}
                        aria-label={`Reserve ${listing.title}`}
                        size="sm"
                        variant="secondary"
                      >
                        Reserve
                      </ButtonLink>
                    </div>
                  </div>
                </Surface>
              );
            })}
          </div>

          {selectedListing && (
            <Surface
              as="aside"
              className="hidden self-start p-5 xl:sticky xl:top-24 xl:block"
            >
              {showMapPanel ? (
                <SearchMapPanel
                  listings={displayedListings}
                  listing={selectedListing}
                  listingDetailQuery={listingDetailQuery}
                  onSelectListing={onSelectListing}
                  search={search}
                />
              ) : (
                <ListingFitPanel listing={selectedListing} />
              )}
            </Surface>
          )}

          {pagination &&
            (pagination.hasPreviousPage || pagination.hasNextPage) && (
              <div
                className={clsx(
                  "md:col-span-2 xl:col-span-1",
                  showMapPanel && "hidden xl:block",
                )}
              >
                <SearchPagination pagination={pagination} />
              </div>
            )}
        </div>
      ) : hasNearbyPlaceFallback ? (
        <NearbyPlacesFallback
          destinationLabel={destinationLabel}
          nearbyPlaces={nearbyPlaces}
          onClearAdvancedFilters={onClearAdvancedFilters}
          onFocusSearch={onFocusSearch}
          search={search}
        />
      ) : (
        <EmptyState
          className="mt-6"
          icon={Sparkles}
          title={
            dataState.status === "unconfigured"
              ? "Connect Supabase to show live stays."
              : dataState.status === "error"
                ? "We could not load live stays."
                : "No stays match this trip yet."
          }
          body={
            dataState.message ??
            (availabilityFilterApplied
              ? "Those dates may already be booked or blocked by hosts. Try nearby dates, widen the nightly budget, or clear advanced filters."
              : "StayWise can loosen the filters, widen the nightly budget, or use AI search to translate the trip into a better set of matches.")
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

function NearbyPlacesFallback({
  destinationLabel,
  nearbyPlaces,
  onClearAdvancedFilters,
  onFocusSearch,
  search,
}: {
  destinationLabel: string;
  nearbyPlaces: NearbyPlace[];
  onClearAdvancedFilters: () => void;
  onFocusSearch: () => void;
  search: SearchInput;
}) {
  const attributionLabel = nearbyPlaces.some((place) => place.source === "amadeus")
    ? "Hotel availability powered by Amadeus Self-Service APIs. Map links use OpenStreetMap."
    : "Data © OpenStreetMap contributors, ODbL 1.0.";

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge tone="info">Live place data</Badge>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight">
            Places to stay in {destinationLabel}
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5f5148]">
            These options come from live hotel/place providers. Reserve opens the
            StayWise booking handoff while provider links stay visible for source checking.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          <Button type="button" variant="secondary" onClick={onClearAdvancedFilters}>
            Clear advanced filters
          </Button>
          <Button type="button" variant="outline" onClick={onFocusSearch}>
            Adjust search
          </Button>
        </div>
      </div>

      <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {nearbyPlaces.map((place) => {
          const reserveHref = makeExternalStayHref(place, search);

          return (
            <article key={place.id} className="group min-w-0">
              <Link
                href={reserveHref}
                aria-label={`Reserve ${place.name}`}
                className="relative block overflow-hidden rounded-[18px] bg-[#f7f3ee] shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={place.imageUrl}
                  alt=""
                  className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <Badge tone="neutral" className="absolute left-3 top-3 bg-white/95 shadow-sm">
                  {place.typeLabel}
                </Badge>
                {place.priceLabel && (
                  <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-sm font-extrabold text-[#201a18] shadow-sm">
                    {place.priceLabel}
                  </div>
                )}
              </Link>

              <div className="mt-3">
                <Link href={reserveHref} className="block">
                  <h3 className="line-clamp-1 text-base font-extrabold leading-6">
                    {place.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-[#6f655e]">
                    {formatExternalPlaceMeta(place)}
                  </p>
                  {place.address && (
                    <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-[#8b7d74]">
                      {place.address}
                    </p>
                  )}
                </Link>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={reserveHref}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[#201a18] px-4 text-xs font-extrabold text-white transition hover:bg-black"
                  >
                    Reserve
                  </Link>
                  {place.actionUrl !== place.mapUrl && (
                    <a
                      href={place.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${place.name} on map`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfd6] bg-white text-[#201a18] transition hover:border-[#ff385c] hover:text-[#df2348]"
                    >
                      <MapIcon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  <a
                    href={place.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open provider for ${place.name}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfd6] bg-white text-[#201a18] transition hover:border-[#ff385c] hover:text-[#df2348]"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs font-semibold text-[#786a60]">
        {attributionLabel}
      </p>
    </div>
  );
}

function formatExternalPlaceMeta(place: NearbyPlace) {
  if (place.priceLabel) {
    return `${place.priceLabel} provider total`;
  }

  if (place.distanceMiles === null) {
    return "Inside searched area";
  }

  return `${formatDistanceMiles(place.distanceMiles)} from search center`;
}

function makeExternalStayHref(place: NearbyPlace, search: SearchInput) {
  const params = new URLSearchParams({
    actionUrl: place.actionUrl,
    destination: search.destination,
    id: place.id,
    imageUrl: place.imageUrl,
    kind: place.kind,
    lat: String(place.lat),
    lng: String(place.lng),
    mapUrl: place.mapUrl,
    name: place.name,
    source: place.source,
    typeLabel: place.typeLabel,
  });

  if (place.address) params.set("address", place.address);
  if (place.description) params.set("description", place.description);
  if (place.priceLabel) params.set("providerPrice", place.priceLabel);
  if (search.checkIn) params.set("checkIn", search.checkIn);
  if (search.checkOut) params.set("checkOut", search.checkOut);
  if (search.guests) params.set("guests", String(search.guests));

  return `/external-stays?${params.toString()}`;
}

function SearchMapPanelLoading() {
  return (
    <div className="space-y-4" aria-label="Loading map tools">
      <div className="h-5 w-28 animate-pulse rounded-full bg-[#f1ebe6]" />
      <div className="h-8 w-44 animate-pulse rounded-full bg-[#f1ebe6]" />
      <div className="h-[22rem] min-h-80 animate-pulse rounded-[22px] bg-[#edf6f8]" />
      <div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-[#f1ebe6]" />
    </div>
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
