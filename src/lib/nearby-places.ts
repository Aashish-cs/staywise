import {
  calculateDistanceMiles,
  formatCoordinateForUrl,
} from "@/lib/location-distance";
import type { LocationLookupResult } from "@/lib/location-service";
import {
  addDaysToIso,
  getFutureIso,
  isValidIsoDate,
} from "@/lib/reservation-utils";

export type NearbyPlaceKind =
  | "apartment"
  | "chalet"
  | "guest_house"
  | "hostel"
  | "hotel"
  | "motel"
  | "place";

export type NearbyPlace = {
  actionLabel: string;
  actionUrl: string;
  address: string | null;
  attribution: string;
  description: string | null;
  distanceMiles: number | null;
  id: string;
  kind: NearbyPlaceKind;
  imageUrl: string;
  lat: number;
  lng: number;
  mapUrl: string;
  name: string;
  priceLabel: string | null;
  source: "amadeus" | "openstreetmap";
  typeLabel: string;
};

export type NearbyPlaceSection = {
  destination: string;
  href: string;
  places: NearbyPlace[];
  title: string;
};

export type NearbyPlaceSearchOptions = {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
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
  extratags?: {
    "contact:website"?: string;
    "reservation:website"?: string;
    image?: string;
    image_1?: string;
    phone?: string;
    rooms?: string;
    stars?: string;
    website?: string;
    wikidata?: string;
    wikipedia?: string;
    wikimedia_commons?: string;
  };
  importance?: number;
  lat?: string;
  lon?: string;
  name?: string;
  osm_id?: number;
  osm_type?: string;
  place_id?: number;
  type?: string;
};

type AmadeusHotelListRow = {
  address?: {
    cityName?: string;
    countryCode?: string;
    lines?: string[];
    postalCode?: string;
    stateCode?: string;
  };
  chainCode?: string;
  geoCode?: {
    latitude?: number;
    longitude?: number;
  };
  hotelId?: string;
  name?: string;
  rating?: string;
};

type AmadeusHotelOfferRow = {
  hotel?: AmadeusHotelListRow;
  offers?: Array<{
    id?: string;
    price?: {
      currency?: string;
      total?: string;
    };
    room?: {
      description?: {
        text?: string;
      };
      typeEstimated?: {
        bedType?: string;
        beds?: number;
        category?: string;
      };
    };
  }>;
};

type AmadeusOffer = NonNullable<AmadeusHotelOfferRow["offers"]>[number];

type AmadeusTokenCache = {
  accessToken: string;
  expiresAt: number;
  key: string;
};

const nominatimEndpoint =
  process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org/search";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://staywise-tau.vercel.app";
const contactEmail = process.env.NOMINATIM_EMAIL;
const amadeusDefaultBaseUrl = "https://test.api.amadeus.com";
const nearbyPlacesCacheTtlMs = 1000 * 60 * 60 * 24 * 7;
const maxNearbyDistanceMiles = 75;
const maxFetchedPlaces = 24;
const maxDisplayedPlaces = 14;
const minSufficientPlaces = 7;
const providerTimeoutMs = 15000;
const amadeusHotelRadiusKm = 35;
let amadeusTokenCache: AmadeusTokenCache | null = null;
const nearbyPlacesCache = new Map<
  string,
  {
    expiresAt: number;
    places: NearbyPlace[];
  }
>();
const wikidataImageCache = new Map<
  string,
  {
    expiresAt: number;
    imageUrl: string | null;
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
const representativePlaceImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80",
];
const homepageDiscoveryLocations: Array<{
  location: LocationLookupResult;
  title: string;
}> = [
  {
    location: makeStaticLocation({
      city: "Galveston",
      country: "United States",
      countryCode: "US",
      lat: 29.3013,
      lng: -94.7977,
      name: "Galveston",
      region: "Texas",
    }),
    title: "Available in Galveston this weekend",
  },
  {
    location: makeStaticLocation({
      city: "Fort Worth",
      country: "United States",
      countryCode: "US",
      lat: 32.7555,
      lng: -97.3308,
      name: "Fort Worth",
      region: "Texas",
    }),
    title: "Check out homes in Fort Worth",
  },
  {
    location: makeStaticLocation({
      city: "New Orleans",
      country: "United States",
      countryCode: "US",
      lat: 29.9511,
      lng: -90.0715,
      name: "New Orleans",
      region: "Louisiana",
    }),
    title: "Popular stays in New Orleans",
  },
  {
    location: makeStaticLocation({
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      lat: 51.5072,
      lng: -0.1276,
      name: "London",
      region: "England",
    }),
    title: "Great hotels for your next trip",
  },
  {
    location: makeStaticLocation({
      bounds: {
        east: 34.6045,
        north: 35.7089,
        south: 34.4384,
        west: 32.2457,
      },
      city: null,
      country: "Cyprus",
      countryCode: "CY",
      lat: 35.1264,
      lng: 33.4299,
      name: "Cyprus",
      region: null,
    }),
    title: "Mediterranean stays to explore",
  },
];

export async function getNearbyPlacesForLocation(
  location: LocationLookupResult | null,
  searchOptions: NearbyPlaceSearchOptions = {},
) {
  if (!location) {
    return [];
  }

  const cacheKey = makeCacheKey(location, searchOptions);
  const cached = nearbyPlacesCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.places;
  }

  try {
    const areaSearch = isAreaSearch(location);
    const places =
      (await fetchAmadeusNearbyPlaces(location, searchOptions, { areaSearch })) ??
      (await fetchOpenStreetMapNearbyPlaces(location, { areaSearch }));

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

export async function getHomepageDiscoverySections(
  searchOptions: NearbyPlaceSearchOptions = {},
): Promise<NearbyPlaceSection[]> {
  const results = await Promise.allSettled(
    homepageDiscoveryLocations.map(async ({ location, title }) => {
      const places = await getNearbyPlacesForLocation(location, searchOptions);

      return {
        destination: location.name,
        href: makeSearchHref(location.name),
        places,
        title,
      };
    }),
  );

  return results
    .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
    .filter((section) => section.places.length > 0);
}

async function fetchOpenStreetMapNearbyPlaces(
  location: LocationLookupResult,
  {
    areaSearch,
  }: {
    areaSearch: boolean;
  },
) {
  const places: NearbyPlace[] = [];
  let lastError: unknown = null;

  for (const query of getPlaceQueries(location)) {
    let rows: NominatimPlaceRow[] = [];

    try {
      rows = await fetchNominatimRows(query);
    } catch (error) {
      lastError = error;
      console.warn("Nearby place query failed", { error, query });
      continue;
    }

    const mappedPlaces = (
      await Promise.all(
        rows.map((row) => mapNearbyPlace(location, row, { areaSearch })),
      )
    ).filter((place): place is NearbyPlace => Boolean(place));

    places.push(...mappedPlaces);

    const rankedPlaces = rankPlaces(places);

    if (rankedPlaces.length >= minSufficientPlaces) {
      return rankedPlaces;
    }
  }

  if (places.length === 0 && lastError) {
    throw lastError;
  }

  return rankPlaces(places);
}

async function fetchNominatimRows(query: string) {
  const url = new URL(nominatimEndpoint);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("dedupe", "1");
  url.searchParams.set("extratags", "1");
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
    signal: AbortSignal.timeout(providerTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Nearby place lookup failed with ${response.status}.`);
  }

  return (await response.json()) as NominatimPlaceRow[];
}

async function fetchAmadeusNearbyPlaces(
  location: LocationLookupResult,
  searchOptions: NearbyPlaceSearchOptions,
  {
    areaSearch,
  }: {
    areaSearch: boolean;
  },
) {
  const config = getAmadeusConfig();

  if (!config) {
    return null;
  }

  try {
    const token = await getAmadeusAccessToken(config);
    const hotelRows = await fetchAmadeusHotelList(location, token, config);
    const hotelIds = uniqueParts(hotelRows.map((hotel) => hotel.hotelId)).slice(
      0,
      maxFetchedPlaces,
    );

    if (hotelIds.length === 0) {
      return null;
    }

    const offerRows = await fetchAmadeusHotelOffers(hotelIds, searchOptions, token, config);
    const places = offerRows
      .map((row) => mapAmadeusPlace(location, row, { areaSearch }))
      .filter((place): place is NearbyPlace => Boolean(place));

    return places.length > 0 ? rankPlaces(places) : null;
  } catch (error) {
    console.warn("Amadeus hotel provider failed; falling back to place search", error);
    return null;
  }
}

function getAmadeusConfig() {
  const clientId = process.env.AMADEUS_CLIENT_ID?.trim();
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    baseUrl: process.env.AMADEUS_BASE_URL?.trim() || amadeusDefaultBaseUrl,
    clientId,
    clientSecret,
  };
}

async function getAmadeusAccessToken(config: NonNullable<ReturnType<typeof getAmadeusConfig>>) {
  const cacheKey = `${config.baseUrl}:${config.clientId}`;

  if (
    amadeusTokenCache &&
    amadeusTokenCache.key === cacheKey &&
    amadeusTokenCache.expiresAt > Date.now() + 30_000
  ) {
    return amadeusTokenCache.accessToken;
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
  });
  const response = await fetch(`${config.baseUrl}/v1/security/oauth2/token`, {
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    signal: AbortSignal.timeout(providerTimeoutMs),
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        access_token?: string;
        expires_in?: number;
      }
    | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(`Amadeus auth failed with ${response.status}.`);
  }

  amadeusTokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(payload.expires_in ?? 0, 60) * 1000,
    key: cacheKey,
  };

  return payload.access_token;
}

async function fetchAmadeusHotelList(
  location: LocationLookupResult,
  accessToken: string,
  config: NonNullable<ReturnType<typeof getAmadeusConfig>>,
) {
  const url = new URL(`${config.baseUrl}/v1/reference-data/locations/hotels/by-geocode`);
  url.searchParams.set("latitude", formatCoordinateForUrl(location.lat));
  url.searchParams.set("longitude", formatCoordinateForUrl(location.lng));
  url.searchParams.set("radius", String(amadeusHotelRadiusKm));
  url.searchParams.set("radiusUnit", "KM");
  url.searchParams.set("hotelSource", "ALL");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: {
      revalidate: Math.floor(nearbyPlacesCacheTtlMs / 1000),
    },
    signal: AbortSignal.timeout(providerTimeoutMs),
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        data?: AmadeusHotelListRow[];
      }
    | null;

  if (!response.ok) {
    throw new Error(`Amadeus hotel list failed with ${response.status}.`);
  }

  return payload?.data ?? [];
}

async function fetchAmadeusHotelOffers(
  hotelIds: string[],
  searchOptions: NearbyPlaceSearchOptions,
  accessToken: string,
  config: NonNullable<ReturnType<typeof getAmadeusConfig>>,
) {
  const dates = resolveProviderDates(searchOptions);
  const adults = Math.min(Math.max(searchOptions.guests ?? 1, 1), 9);
  const url = new URL(`${config.baseUrl}/v3/shopping/hotel-offers`);
  url.searchParams.set("hotelIds", hotelIds.join(","));
  url.searchParams.set("adults", String(adults));
  url.searchParams.set("checkInDate", dates.checkIn);
  url.searchParams.set("checkOutDate", dates.checkOut);
  url.searchParams.set("currency", "USD");
  url.searchParams.set("bestRateOnly", "true");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: {
      revalidate: Math.floor(nearbyPlacesCacheTtlMs / 1000),
    },
    signal: AbortSignal.timeout(providerTimeoutMs),
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        data?: AmadeusHotelOfferRow[];
      }
    | null;

  if (!response.ok) {
    throw new Error(`Amadeus hotel offers failed with ${response.status}.`);
  }

  return payload?.data ?? [];
}

function mapAmadeusPlace(
  location: LocationLookupResult,
  row: AmadeusHotelOfferRow,
  {
    areaSearch,
  }: {
    areaSearch: boolean;
  },
): NearbyPlace | null {
  const hotel = row.hotel;
  const offer = row.offers?.[0];
  const lat = Number(hotel?.geoCode?.latitude);
  const lng = Number(hotel?.geoCode?.longitude);

  if (!hotel?.hotelId || !hotel.name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (areaSearch && location.bounds && !isInsideBounds(location.bounds, { lat, lng })) {
    return null;
  }

  const distanceMiles = areaSearch
    ? null
    : calculateDistanceMiles({ lat: location.lat, lng: location.lng }, { lat, lng });

  if (!areaSearch && distanceMiles !== null && distanceMiles > maxNearbyDistanceMiles) {
    return null;
  }

  const address = formatAmadeusAddress(hotel);
  const mapUrl = makeCoordinateMapUrl(lat, lng);
  const priceLabel = formatProviderPrice(offer?.price?.total, offer?.price?.currency);

  return {
    actionLabel: "View availability",
    actionUrl: makeBookingSearchUrl({ address, name: hotel.name }),
    address,
    attribution: "Hotel availability powered by Amadeus Self-Service APIs.",
    description: formatAmadeusRoomDescription(offer),
    distanceMiles,
    id: `amadeus:${hotel.hotelId}`,
    imageUrl: getRepresentativeImageUrl({
      name: hotel.name,
      osm_id: Number.parseInt(hotel.hotelId.replace(/\D/g, ""), 10) || undefined,
      osm_type: hotel.chainCode,
    }),
    kind: "hotel" as const,
    lat,
    lng,
    mapUrl,
    name: normalizeName(hotel.name),
    priceLabel,
    source: "amadeus" as const,
    typeLabel: hotel.rating ? `${hotel.rating}-star hotel` : "Hotel",
  };
}

async function mapNearbyPlace(
  location: LocationLookupResult,
  row: NominatimPlaceRow,
  {
    areaSearch,
  }: {
    areaSearch: boolean;
  },
): Promise<NearbyPlace | null> {
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
  const websiteUrl = getWebsiteUrl(row);
  const providerImageUrl = await getImageUrl(row);
  const imageUrl = providerImageUrl ?? getRepresentativeImageUrl(row);
  const address = formatAddress(row);
  const mapUrl = makeMapUrl(row, lat, lng);

  return {
    actionLabel: websiteUrl ? "Check availability" : "Find booking options",
    actionUrl: websiteUrl ?? makeBookingSearchUrl({ address, name }),
    address,
    attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
    description: null,
    distanceMiles,
    id: makePlaceId(row, lat, lng),
    imageUrl,
    kind,
    lat,
    lng,
    mapUrl,
    name,
    priceLabel: null,
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

function makeSearchHref(destination: string) {
  const params = new URLSearchParams({
    budget: "300",
    destination,
    guests: "2",
    purpose: "remote-work",
  });

  return `/search?${params.toString()}`;
}

function makeStaticLocation({
  bounds = null,
  city,
  country,
  countryCode,
  lat,
  lng,
  name,
  region,
}: {
  bounds?: LocationLookupResult["bounds"];
  city: string | null;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  name: string;
  region: string | null;
}): LocationLookupResult {
  return {
    attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
    bounds,
    city,
    country,
    countryCode,
    formattedAddress: uniqueParts([name, region, country]).join(", "),
    lat,
    lng,
    name,
    provider: "nominatim",
    providerId: `staywise-home:${name.toLowerCase().replace(/\s+/g, "-")}`,
    query: name,
    region,
  };
}

function makeCacheKey(
  location: LocationLookupResult,
  searchOptions: NearbyPlaceSearchOptions = {},
) {
  const dates = resolveProviderDates(searchOptions);

  return `${location.providerId}:${formatCoordinateForUrl(location.lat)},${formatCoordinateForUrl(
    location.lng,
  )}:${dates.checkIn}:${dates.checkOut}:${searchOptions.guests ?? 1}`;
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

  return makeCoordinateMapUrl(lat, lng);
}

function makeCoordinateMapUrl(lat: number, lng: number) {
  const safeLat = formatCoordinateForUrl(lat);
  const safeLng = formatCoordinateForUrl(lng);

  return `https://www.openstreetmap.org/?mlat=${safeLat}&mlon=${safeLng}#map=16/${safeLat}/${safeLng}`;
}

function formatAmadeusAddress(hotel: AmadeusHotelListRow) {
  const address = hotel.address;

  if (!address) {
    return null;
  }

  return (
    uniqueParts([
      ...(address.lines ?? []),
      address.cityName,
      address.stateCode,
      address.postalCode,
      address.countryCode,
    ]).join(", ") || null
  );
}

function formatAmadeusRoomDescription(offer: AmadeusOffer | undefined) {
  const description = offer?.room?.description?.text?.trim();

  if (description) {
    return description.replace(/\s+/g, " ");
  }

  const room = offer?.room?.typeEstimated;
  const roomParts = uniqueParts([
    room?.category?.replace(/_/g, " ").toLowerCase(),
    room?.beds ? `${room.beds} ${room.beds === 1 ? "bed" : "beds"}` : null,
    room?.bedType?.replace(/_/g, " ").toLowerCase(),
  ]);

  return roomParts.length > 0 ? roomParts.join(" · ") : null;
}

function formatProviderPrice(total: string | undefined, currency: string | undefined) {
  const amount = Number(total);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      currency: currency ?? "USD",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(amount);
  } catch {
    return `$${Math.round(amount)}`;
  }
}

function resolveProviderDates(searchOptions: NearbyPlaceSearchOptions) {
  const fallbackCheckIn = getFutureIso(7);
  const checkIn = isValidIsoDate(searchOptions.checkIn)
    ? searchOptions.checkIn
    : fallbackCheckIn;
  const checkOut =
    isValidIsoDate(searchOptions.checkOut) && searchOptions.checkOut > checkIn
      ? searchOptions.checkOut
      : addDaysToIso(checkIn, 3);

  return {
    checkIn,
    checkOut,
  };
}

function getWebsiteUrl(row: NominatimPlaceRow) {
  return normalizeExternalUrl(
    row.extratags?.["reservation:website"] ??
      row.extratags?.website ??
      row.extratags?.["contact:website"] ??
      null,
  );
}

async function getImageUrl(row: NominatimPlaceRow) {
  const directImage = normalizeExternalUrl(row.extratags?.image ?? row.extratags?.image_1 ?? null);

  if (directImage) {
    return directImage;
  }

  const commons = row.extratags?.wikimedia_commons?.trim();

  if (commons) {
    const fileName = commons.replace(/^File:/i, "");

    if (fileName) {
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
        fileName,
      )}`;
    }
  }

  const wikidataImage = await getWikidataImageUrl(row.extratags?.wikidata);

  if (wikidataImage) {
    return wikidataImage;
  }

  return null;
}

async function getWikidataImageUrl(wikidataId: string | undefined) {
  const id = wikidataId?.trim();

  if (!id || !/^Q\d+$/.test(id)) {
    return null;
  }

  const cached = wikidataImageCache.get(id);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.imageUrl;
  }

  try {
    const response = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`,
      {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          Referer: siteUrl,
          "User-Agent": `StayWiseSeniorDesign/1.0 (${siteUrl})`,
        },
        next: {
          revalidate: Math.floor(nearbyPlacesCacheTtlMs / 1000),
        },
        signal: AbortSignal.timeout(providerTimeoutMs),
      },
    );

    if (!response.ok) {
      throw new Error(`Wikidata image lookup failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      entities?: Record<
        string,
        {
          claims?: {
            P18?: Array<{
              mainsnak?: {
                datavalue?: {
                  value?: string;
                };
              };
            }>;
          };
        }
      >;
    };
    const fileName = payload.entities?.[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    const imageUrl = fileName
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
          fileName,
        )}`
      : null;

    wikidataImageCache.set(id, {
      expiresAt: Date.now() + nearbyPlacesCacheTtlMs,
      imageUrl,
    });

    return imageUrl;
  } catch (error) {
    console.warn("Unable to load Wikidata hotel image", { error, wikidataId: id });
    wikidataImageCache.set(id, {
      expiresAt: Date.now() + 1000 * 60 * 60,
      imageUrl: null,
    });

    return null;
  }
}

function makeBookingSearchUrl({
  address,
  name,
}: {
  address: string | null;
  name: string;
}) {
  const query = uniqueParts([name, address, "availability booking"]).join(" ");

  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

function normalizeExternalUrl(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function getRepresentativeImageUrl(row: NominatimPlaceRow) {
  const seed = `${row.osm_type ?? "place"}:${row.osm_id ?? row.place_id ?? row.name ?? "stay"}`;
  const index = Math.abs(hashString(seed)) % representativePlaceImages.length;

  return representativePlaceImages[index];
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

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
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
