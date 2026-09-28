import {
  calculateDistanceMiles,
  formatCoordinateForUrl,
} from "@/lib/location-distance";
import type { LocationLookupResult } from "@/lib/location-service";

export type NearbyPlaceKind =
  | "apartment"
  | "chalet"
  | "guest_house"
  | "hostel"
  | "hotel"
  | "motel"
  | "place";

export type NearbyPlace = {
  address: string | null;
  attribution: string;
  distanceMiles: number | null;
  id: string;
  kind: NearbyPlaceKind;
  lat: number;
  lng: number;
  mapUrl: string;
  name: string;
  source: "openstreetmap";
  typeLabel: string;
};

type NominatimPlaceRow = {
  address?: {
    city?: string;
    country?: string;
    county?: string;
    hamlet?: string;
    house_number?: string;
    neighbourhood?: string;
    postcode?: string;
    road?: string;
    state?: string;
    suburb?: string;
    tourism?: string;
    town?: string;
    village?: string;
  };
  category?: string;
  display_name?: string;
  importance?: number;
  lat?: string;
  lon?: string;
  name?: string;
  osm_id?: number;
  osm_type?: string;
  place_id?: number;
  type?: string;
};

const nominatimEndpoint =
  process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org/search";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://staywise-tau.vercel.app";
const contactEmail = process.env.NOMINATIM_EMAIL;
const nearbyPlacesCacheTtlMs = 1000 * 60 * 60 * 24 * 7;
const maxNearbyDistanceMiles = 75;
const maxFetchedPlaces = 12;
const maxDisplayedPlaces = 8;
const minSufficientPlaces = 4;
const nearbyPlacesCache = new Map<
  string,
  {
    expiresAt: number;
    places: NearbyPlace[];
  }
>();

const typeLabels: Record<NearbyPlaceKind, string> = {
  apartment: "Apartment hotel",
  chalet: "Chalet",
  guest_house: "Guest house",
  hostel: "Hostel",
  hotel: "Hotel",
  motel: "Motel",
  place: "Place",
};

export async function getNearbyPlacesForLocation(location: LocationLookupResult | null) {
  if (!location) {
    return [];
  }

  const cacheKey = makeCacheKey(location);
  const cached = nearbyPlacesCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.places;
  }

  try {
    const areaSearch = isAreaSearch(location);
    const places = await fetchNearbyPlaces(location, { areaSearch });

    nearbyPlacesCache.set(cacheKey, {
      expiresAt: Date.now() + nearbyPlacesCacheTtlMs,
      places,
    });

    return places;
  } catch (error) {
    console.warn("Unable to load nearby places", error);

    nearbyPlacesCache.set(cacheKey, {
      expiresAt: Date.now() + 1000 * 60 * 10,
      places: [],
    });

    return [];
  }
}

async function fetchNearbyPlaces(
  location: LocationLookupResult,
  {
    areaSearch,
  }: {
    areaSearch: boolean;
  },
) {
  const places: NearbyPlace[] = [];

  for (const query of getPlaceQueries(location)) {
    const rows = await fetchNominatimRows(query);
    const mappedPlaces = rows
      .map((row) => mapNearbyPlace(location, row, { areaSearch }))
      .filter((place): place is NearbyPlace => Boolean(place));

    places.push(...mappedPlaces);

    const rankedPlaces = rankPlaces(places);

    if (rankedPlaces.length >= minSufficientPlaces) {
      return rankedPlaces;
    }
  }

  return rankPlaces(places);
}

async function fetchNominatimRows(query: string) {
  const url = new URL(nominatimEndpoint);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("dedupe", "1");
  url.searchParams.set("limit", String(maxFetchedPlaces));

  if (contactEmail) {
    url.searchParams.set("email", contactEmail);
  }

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "en-US,en;q=0.9",
      Referer: siteUrl,
      "User-Agent": `StayWiseSeniorDesign/1.0 (${siteUrl})`,
    },
    next: {
      revalidate: Math.floor(nearbyPlacesCacheTtlMs / 1000),
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Nearby place lookup failed with ${response.status}.`);
  }

  return (await response.json()) as NominatimPlaceRow[];
}

function mapNearbyPlace(
  location: LocationLookupResult,
  row: NominatimPlaceRow,
  {
    areaSearch,
  }: {
    areaSearch: boolean;
  },
) {
  const lat = Number(row.lat);
  const lng = Number(row.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (!isTourismPlace(row)) {
    return null;
  }

  if (areaSearch && location.bounds && !isInsideBounds(location.bounds, { lat, lng })) {
    return null;
  }

  const name = normalizeName(row.name ?? row.address?.tourism ?? "");

  if (!name) {
    return null;
  }

  const distanceMiles = areaSearch
    ? null
    : calculateDistanceMiles({ lat: location.lat, lng: location.lng }, { lat, lng });

  if (!areaSearch && distanceMiles !== null && distanceMiles > maxNearbyDistanceMiles) {
    return null;
  }

  const kind = normalizePlaceKind(row.type);

  return {
    address: formatAddress(row),
    attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
    distanceMiles,
    id: makePlaceId(row, lat, lng),
    kind,
    lat,
    lng,
    mapUrl: makeMapUrl(row, lat, lng),
    name,
    source: "openstreetmap" as const,
    typeLabel: typeLabels[kind],
  };
}

function getPlaceQueries(location: LocationLookupResult) {
  const placeQuery = getPlaceQuery(location);
  const regionQuery = uniqueParts([location.region, location.country]).join(", ");
  const countryQuery = location.country ?? "";

  return uniqueParts([
    `hotel in ${placeQuery}`,
    `guest house in ${placeQuery}`,
    `hostel in ${placeQuery}`,
    `motel in ${placeQuery}`,
    location.city && regionQuery ? `hotel in ${regionQuery}` : null,
    location.city && regionQuery ? `guest house in ${regionQuery}` : null,
    location.city && countryQuery ? `hotel in ${countryQuery}` : null,
  ]);
}

function getPlaceQuery(location: LocationLookupResult) {
  return uniqueParts([
    location.city ?? location.name,
    location.region,
    location.country,
  ]).join(", ");
}

function makeCacheKey(location: LocationLookupResult) {
  return `${location.providerId}:${formatCoordinateForUrl(location.lat)},${formatCoordinateForUrl(
    location.lng,
  )}`;
}

function normalizePlaceKind(type: string | undefined): NearbyPlaceKind {
  if (
    type === "apartment" ||
    type === "chalet" ||
    type === "guest_house" ||
    type === "hostel" ||
    type === "hotel" ||
    type === "motel"
  ) {
    return type;
  }

  return "place";
}

function isTourismPlace(row: NominatimPlaceRow) {
  return (
    row.category === "tourism" &&
    (row.type === "apartment" ||
      row.type === "chalet" ||
      row.type === "guest_house" ||
      row.type === "hostel" ||
      row.type === "hotel" ||
      row.type === "motel")
  );
}

function formatAddress(row: NominatimPlaceRow) {
  const address = row.address;

  if (!address) {
    return row.display_name ?? null;
  }

  const street = uniqueParts([address.house_number, address.road]).join(" ");
  const locality =
    address.neighbourhood ??
    address.hamlet ??
    address.suburb ??
    address.city ??
    address.town ??
    address.village ??
    null;
  const region = address.state ?? address.county ?? null;
  const formatted = uniqueParts([street, locality, region, address.country]).join(", ");

  return formatted || row.display_name || null;
}

function makePlaceId(row: NominatimPlaceRow, lat: number, lng: number) {
  if (row.osm_type && row.osm_id) {
    return `${row.osm_type}:${row.osm_id}`;
  }

  return `place:${row.place_id ?? `${formatCoordinateForUrl(lat)},${formatCoordinateForUrl(lng)}`}`;
}

function makeMapUrl(row: NominatimPlaceRow, lat: number, lng: number) {
  if (row.osm_type && row.osm_id) {
    return `https://www.openstreetmap.org/${row.osm_type}/${row.osm_id}`;
  }

  const safeLat = formatCoordinateForUrl(lat);
  const safeLng = formatCoordinateForUrl(lng);

  return `https://www.openstreetmap.org/?mlat=${safeLat}&mlon=${safeLng}#map=16/${safeLat}/${safeLng}`;
}

function isAreaSearch(location: LocationLookupResult) {
  return !location.city && Boolean(location.bounds);
}

function isInsideBounds(
  bounds: NonNullable<LocationLookupResult["bounds"]>,
  coordinates: { lat: number; lng: number },
) {
  return (
    coordinates.lat >= bounds.south &&
    coordinates.lat <= bounds.north &&
    coordinates.lng >= bounds.west &&
    coordinates.lng <= bounds.east
  );
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function rankPlaces(places: NearbyPlace[]) {
  return places
    .sort(
      (first, second) =>
        (first.distanceMiles ?? Number.POSITIVE_INFINITY) -
          (second.distanceMiles ?? Number.POSITIVE_INFINITY) ||
        first.name.localeCompare(second.name),
    )
    .filter(dedupePlace)
    .slice(0, maxDisplayedPlaces);
}

function uniqueParts(parts: Array<string | null | undefined>) {
  const seen = new Set<string>();

  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const key = part.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
}

function dedupePlace(place: NearbyPlace, index: number, places: NearbyPlace[]) {
  return (
    places.findIndex(
      (candidate) =>
        candidate.id === place.id ||
        `${candidate.name}:${formatCoordinateForUrl(candidate.lat)},${formatCoordinateForUrl(
          candidate.lng,
        )}` ===
          `${place.name}:${formatCoordinateForUrl(place.lat)},${formatCoordinateForUrl(
            place.lng,
          )}`,
    ) === index
  );
}
