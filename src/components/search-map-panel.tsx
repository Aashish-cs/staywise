"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import Link from "next/link";
import clsx from "clsx";
import { ExternalLink, LocateFixed, MapPin } from "lucide-react";
import {
  Badge,
  ButtonLink,
} from "@/components/ui/primitives";
import {
  getListingCoordinates,
  getOpenStreetMapAreaUrl,
} from "@/lib/listing-map";
import { formatDistanceMiles, hasSearchCoordinates } from "@/lib/location-distance";
import type { RankedListing, SearchInput } from "@/lib/recommendations";

type SearchMapPanelProps = {
  listings: RankedListing[];
  listing: RankedListing;
  listingDetailQuery: string;
  onSelectListing: (id: string) => void;
  search: SearchInput;
};

export function SearchMapPanel({
  listings,
  listing,
  listingDetailQuery,
  onSelectListing,
  search,
}: SearchMapPanelProps) {
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
