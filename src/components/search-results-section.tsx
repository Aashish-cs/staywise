"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import Link from "next/link";
import clsx from "clsx";
import {
  ExternalLink,
  LocateFixed,
  Map as MapIcon,
  MapPin,
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
import {
  getListingCoordinates,
  getOpenStreetMapAreaUrl,
} from "@/lib/listing-map";
import { formatDistanceMiles, hasSearchCoordinates } from "@/lib/location-distance";
import type { RankedListing, SearchInput } from "@/lib/recommendations";
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
  search: SearchInput;
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
  search,
  selectedListing,
  showMapPanel,
  sortMode,
}: SearchResultsSectionProps) {
  return (
    <section id="results" className="min-w-0 scroll-mt-24">
      <div className="flex flex-col gap-4 border-b border-[#eadfd6] pb-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="min-w-0">
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
              <ListingMapPanel
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
                <ListingMapPanel
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
      ) : (
        <EmptyState
          className="mt-6"
          icon={Sparkles}
          title="No stays match this trip yet."
          body={
            availabilityFilterApplied
              ? "Those dates may already be booked or blocked by hosts. Try nearby dates, widen the nightly budget, or clear advanced filters."
              : "StayWise can loosen the filters, widen the nightly budget, or use AI search to translate the trip into a better set of matches."
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
  search,
}: {
  listings: RankedListing[];
  listing: RankedListing;
  listingDetailQuery: string;
  onSelectListing: (id: string) => void;
  search: SearchInput;
}) {
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRefs = useRef<Map<string, LeafletMarker>>(new Map());
  const currentLocationMarkerRef = useRef<LeafletMarker | null>(null);
  const listingPoints = useMemo(
    () =>
      listings.map((item) => ({
        coordinates: getListingCoordinates(item),
        listing: item,
      })),
    [listings],
  );
  const currentLocation = useMemo(
    () =>
      hasSearchCoordinates(search)
        ? {
            lat: Number(search.nearLat),
            lng: Number(search.nearLng),
          }
        : null,
    [search],
  );
  const mapPoints = useMemo(
    () => [
      ...listingPoints.map(({ coordinates }) => coordinates),
      ...(currentLocation ? [currentLocation] : []),
    ],
    [currentLocation, listingPoints],
  );
  const openMapHref = useMemo(
    () => getOpenStreetMapAreaUrl(mapPoints),
    [mapPoints],
  );
  const activeOrHoveredListingId = hoveredListingId ?? listing.id;
  const locationLabel = currentLocation ? "you" : listing.city;

  useEffect(() => {
    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;
    const markers = markerRefs.current;

    async function createMap() {
      try {
        const leafletModule = await import("leaflet");

        if (isDisposed || !mapContainerRef.current || mapRef.current) {
          return;
        }

        const map = leafletModule.map(mapContainerRef.current, {
          attributionControl: true,
          keyboard: true,
          scrollWheelZoom: true,
          zoomControl: true,
        });

        leafletModule
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })
          .addTo(map);

        mapRef.current = map;
        setLeaflet(leafletModule);
        setMapStatus("ready");

        if ("ResizeObserver" in window) {
          resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
          });
          resizeObserver.observe(mapContainerRef.current);
        }

        window.setTimeout(() => {
          map.invalidateSize();
        }, 120);
      } catch {
        setMapStatus("error");
      }
    }

    void createMap();

    return () => {
      isDisposed = true;
      resizeObserver?.disconnect();
      markers.forEach((marker) => marker.remove());
      markers.clear();
      currentLocationMarkerRef.current?.remove();
      currentLocationMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !leaflet) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current.clear();
    currentLocationMarkerRef.current?.remove();
    currentLocationMarkerRef.current = null;

    if (mapPoints.length > 0) {
      const latLngs = mapPoints.map(
        (point) => [point.lat, point.lng] as [number, number],
      );
      const bounds = leaflet.latLngBounds(latLngs);

      if (mapPoints.length === 1) {
        map.setView([mapPoints[0].lat, mapPoints[0].lng], 14, {
          animate: false,
        });
      } else if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.24), {
          animate: false,
          maxZoom: 14,
          padding: [36, 36],
        });
      }
    }

    listingPoints.forEach(({ coordinates, listing: item }) => {
      const marker = leaflet
        .marker([coordinates.lat, coordinates.lng], {
          alt: `${item.title}, $${item.pricePerNight} per night`,
          icon: createPriceMarkerIcon(
            leaflet,
            item.pricePerNight,
            item.id === activeOrHoveredListingId,
          ),
          keyboard: true,
          title: `${item.title}, $${item.pricePerNight} per night`,
        })
        .addTo(map);

      marker
        .on("click", () => onSelectListing(item.id))
        .on("keypress", () => onSelectListing(item.id))
        .on("mouseover", () => setHoveredListingId(item.id))
        .on("mouseout", () => setHoveredListingId(null));

      markerRefs.current.set(item.id, marker);
    });

    if (currentLocation) {
      currentLocationMarkerRef.current = leaflet
        .marker([currentLocation.lat, currentLocation.lng], {
          alt: "Your current location",
          icon: leaflet.divIcon({
            className: "staywise-current-location-wrapper",
            html: '<span class="staywise-current-location-marker" aria-hidden="true"></span>',
            iconAnchor: [14, 14],
            iconSize: [28, 28],
          }),
          title: "Your current location",
        })
        .addTo(map);
    }

    window.setTimeout(() => {
      map.invalidateSize();
    }, 80);
  }, [
    activeOrHoveredListingId,
    currentLocation,
    leaflet,
    listingPoints,
    mapPoints,
    onSelectListing,
  ]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ff385c]">Map search</p>
          <h3 className="mt-1 text-xl font-semibold">
            {listings.length} stays near {locationLabel}
          </h3>
        </div>
        <MapPin className="h-5 w-5 shrink-0 text-[#ff385c]" aria-hidden="true" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="info">Price markers</Badge>
        <Badge tone="success">Fit bounds</Badge>
        {currentLocation && <Badge tone="brand">Current location</Badge>}
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-[#eadfd6] bg-[#edf6f8]">
        <div className="relative h-[22rem] min-h-80">
          <div
            ref={mapContainerRef}
            aria-label="Interactive map of matching stays"
            className="staywise-map-container absolute inset-0"
          />

          {mapStatus === "loading" && (
            <div className="absolute inset-0 grid place-items-center bg-[#edf6f8] text-sm font-extrabold text-[#5f5148]">
              Loading map
            </div>
          )}

          {mapStatus === "error" && (
            <div className="absolute inset-0 grid place-items-center bg-[#edf6f8] p-6 text-center">
              <div>
                <p className="font-extrabold">Map could not load.</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">
                  Listings are still shown below, and the full OpenStreetMap
                  view is available.
                </p>
              </div>
            </div>
          )}

          <Badge
            tone="neutral"
            className="absolute left-4 top-4 z-[401] bg-white/95 shadow-sm"
          >
            OpenStreetMap
          </Badge>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-[#786a60]">
        Map uses listing coordinates stored in Supabase and shows approximate
        areas, not exact private addresses.
      </p>

      <Link
        href={openMapHref}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-xs font-extrabold text-[#201a18] hover:border-[#ff385c] hover:text-[#df2348]"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Open full map
      </Link>

      <div className="mt-5 max-h-[310px] space-y-3 overflow-y-auto pr-1">
        {listings.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === listing.id}
            className={clsx(
              "w-full rounded-2xl border p-3 text-left transition hover:border-[#ff385c]",
              item.id === listing.id || item.id === hoveredListingId
                ? "border-[#ff385c] bg-[#fff3f5]"
                : "border-[#eadfd6] bg-white",
            )}
            onClick={() => onSelectListing(item.id)}
            onFocus={() => setHoveredListingId(item.id)}
            onBlur={() => setHoveredListingId(null)}
            onMouseEnter={() => setHoveredListingId(item.id)}
            onMouseLeave={() => setHoveredListingId(null)}
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

      {currentLocation && (
        <div className="mt-4 flex gap-3 rounded-2xl bg-[#f7f3ee] p-4">
          <LocateFixed
            className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold leading-5 text-[#5f5148]">
            The blue marker is your browser location. Listing distances are
            approximate and used for ranking only.
          </p>
        </div>
      )}

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

type LeafletModule = typeof import("leaflet");

function createPriceMarkerIcon(
  leaflet: LeafletModule,
  pricePerNight: number,
  isActive: boolean,
) {
  return leaflet.divIcon({
    className: "staywise-price-marker-wrapper",
    html: `<span class="staywise-price-marker${
      isActive ? " staywise-price-marker-active" : ""
    }">$${pricePerNight}</span>`,
    iconAnchor: [36, 17],
    iconSize: [72, 34],
  });
}
