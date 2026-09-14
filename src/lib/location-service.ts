export type LocationBounds = {
  east: number;
  north: number;
  south: number;
  west: number;
};

export type LocationLookupResult = {
  attribution: string;
  bounds: LocationBounds | null;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  formattedAddress: string;
  lat: number;
  lng: number;
  name: string;
  provider: "nominatim";
  providerId: string;
  query: string;
  region: string | null;
};

type NominatimSearchRow = {
  address?: {
    city?: string;
    country?: string;
    country_code?: string;
    county?: string;
    hamlet?: string;
    neighbourhood?: string;
    state?: string;
    suburb?: string;
    town?: string;
    village?: string;
  };
  boundingbox?: [string, string, string, string];
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
  osm_id?: number;
  osm_type?: string;
  place_id?: number;
};

const nominatimEndpoint =
  process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org/search";
const nominatimReverseEndpoint =
  process.env.NOMINATIM_REVERSE_BASE_URL ??
  "https://nominatim.openstreetmap.org/reverse";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://staywise-tau.vercel.app";
const contactEmail = process.env.NOMINATIM_EMAIL;
const cacheTtlMs = 1000 * 60 * 60 * 24 * 30;
const memoryCache = new Map<
  string,
  {
    expiresAt: number;
    results: LocationLookupResult[];
  }
>();
const reverseCache = new Map<
  string,
  {
    expiresAt: number;
    result: LocationLookupResult | null;
  }
>();

export async function resolveSearchLocation(query: string) {
  const results = await searchLocations(query, 1);

  return results[0] ?? null;
}

export async function searchLocations(query: string, limit = 5) {
  const normalizedQuery = normalizeLocationQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 5);
  const cacheKey = `${normalizedQuery}:${safeLimit}`;
  const cached = memoryCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const url = new URL(nominatimEndpoint);
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("dedupe", "1");
  url.searchParams.set("featureType", "settlement");
  url.searchParams.set("limit", String(safeLimit));

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
      revalidate: Math.floor(cacheTtlMs / 1000),
    },
  });

  if (!response.ok) {
    throw new Error(`Location lookup failed with ${response.status}.`);
  }

  const rows = (await response.json()) as NominatimSearchRow[];
  const results = rows
    .map((row) => mapNominatimRow(normalizedQuery, row))
    .filter((row): row is LocationLookupResult => Boolean(row));

  memoryCache.set(cacheKey, {
    expiresAt: Date.now() + cacheTtlMs,
    results,
  });

  return results;
}

export async function reverseGeocodeLocation(lat: number, lng: number) {
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return null;
  }

  const safeLat = Number(lat.toFixed(6));
  const safeLng = Number(lng.toFixed(6));
  const cacheKey = `${safeLat},${safeLng}`;
  const cached = reverseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const url = new URL(nominatimReverseEndpoint);
  url.searchParams.set("lat", String(safeLat));
  url.searchParams.set("lon", String(safeLng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("layer", "address");

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
      revalidate: Math.floor(cacheTtlMs / 1000),
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse location lookup failed with ${response.status}.`);
  }

  const row = (await response.json()) as NominatimSearchRow & {
    error?: string;
  };
  const result = row.error
    ? null
    : mapNominatimRow(cacheKey, row, {
        lat: safeLat,
        lng: safeLng,
      });

  reverseCache.set(cacheKey, {
    expiresAt: Date.now() + cacheTtlMs,
    result,
  });

  return result;
}

function mapNominatimRow(
  query: string,
  row: NominatimSearchRow,
  coordinatesOverride?: {
    lat: number;
    lng: number;
  },
) {
  const lat = coordinatesOverride?.lat ?? Number(row.lat);
  const lng = coordinatesOverride?.lng ?? Number(row.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const address = row.address ?? {};
  const bounds = parseBounds(row.boundingbox);
  const providerId =
    row.osm_type && row.osm_id
      ? `${row.osm_type}:${row.osm_id}`
      : `place:${row.place_id ?? `${lat},${lng}`}`;
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.suburb ??
    address.neighbourhood ??
    null;

  return {
    attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
    bounds,
    city,
    country: address.country ?? null,
    countryCode: address.country_code?.toUpperCase() ?? null,
    formattedAddress: row.display_name ?? row.name ?? query,
    lat,
    lng,
    name: row.name ?? city ?? row.display_name ?? query,
    provider: "nominatim" as const,
    providerId,
    query,
    region: address.state ?? address.county ?? null,
  };
}

function parseBounds(value: NominatimSearchRow["boundingbox"]) {
  if (!value) {
    return null;
  }

  const [south, north, west, east] = value.map(Number);

  if (![south, north, west, east].every(Number.isFinite)) {
    return null;
  }

  return {
    east,
    north,
    south,
    west,
  };
}

function normalizeLocationQuery(query: string) {
  const normalized = query.trim().replace(/\s+/g, " ");

  return normalized.length >= 2 ? normalized : "";
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}
