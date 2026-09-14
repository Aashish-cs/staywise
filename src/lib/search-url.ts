import {
  featuredAmenities,
  type PropertyType,
  tripPurposeLabels,
  type TripPurpose,
} from "@/lib/listings";
import {
  formatCoordinateForUrl,
  hasSearchCoordinates,
} from "@/lib/location-distance";
import { searchSchema, type SearchInput } from "@/lib/recommendations";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseSearchParams(params: RawSearchParams): SearchInput {
  const tripPurpose = parseTripPurpose(
    firstParam(params.purpose) ?? firstParam(params.tripPurpose),
  );
  const amenities = allParams(params.amenities).filter(isFeaturedAmenity);
  const propertyTypes = allParams(params.propertyTypes).filter(isPropertyType);

  return searchSchema.parse({
    destination: firstParam(params.destination) ?? "",
    checkIn: parseDateParam(firstParam(params.checkIn)),
    checkOut: parseDateParam(firstParam(params.checkOut)),
    guests: clampNumberParam(firstParam(params.guests), 2, 1, 16),
    maxNightlyBudget: clampNumberParam(
      firstParam(params.budget) ?? firstParam(params.maxNightlyBudget),
      250,
      50,
      1200,
    ),
    minBathrooms: clampNumberParam(firstParam(params.minBathrooms), 0, 0, 12),
    minBedrooms: clampNumberParam(
      firstParam(params.minBedrooms) ?? firstParam(params.bedrooms),
      0,
      0,
      12,
    ),
    propertyTypes,
    tripPurpose,
    amenities,
    nearLat: parseCoordinateParam(firstParam(params.nearLat), -90, 90),
    nearLng: parseCoordinateParam(firstParam(params.nearLng), -180, 180),
  });
}

export function buildSearchQueryString(input: Partial<SearchInput>) {
  const parsed = searchSchema.parse(input);
  const params = new URLSearchParams();

  if (parsed.destination) {
    params.set("destination", parsed.destination);
  }

  if (parsed.checkIn) {
    params.set("checkIn", parsed.checkIn);
  }

  if (parsed.checkOut) {
    params.set("checkOut", parsed.checkOut);
  }

  params.set("guests", String(parsed.guests));
  params.set("budget", String(parsed.maxNightlyBudget));

  if (parsed.minBedrooms > 0) {
    params.set("minBedrooms", String(parsed.minBedrooms));
  }

  if (parsed.minBathrooms > 0) {
    params.set("minBathrooms", String(parsed.minBathrooms));
  }

  parsed.propertyTypes.forEach((propertyType) => {
    params.append("propertyTypes", propertyType);
  });

  params.set("purpose", parsed.tripPurpose);

  parsed.amenities.forEach((amenity) => {
    params.append("amenities", amenity);
  });

  if (hasSearchCoordinates(parsed)) {
    params.set("nearLat", formatCoordinateForUrl(parsed.nearLat as number));
    params.set("nearLng", formatCoordinateForUrl(parsed.nearLng as number));
  }

  return params.toString();
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function allParams(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function clampNumberParam(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function parseDateParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? "" : value;
}

function parseCoordinateParam(
  value: string | undefined,
  min: number,
  max: number,
) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    return null;
  }

  return numeric;
}

function parseTripPurpose(value: string | undefined): TripPurpose {
  const allowed = Object.keys(tripPurposeLabels) as TripPurpose[];

  return allowed.includes(value as TripPurpose)
    ? (value as TripPurpose)
    : "remote-work";
}

function isFeaturedAmenity(
  value: string,
): value is (typeof featuredAmenities)[number] {
  return (featuredAmenities as readonly string[]).includes(value);
}

function isPropertyType(value: string): value is PropertyType {
  return (
    ["Apartment", "House", "Cabin", "Loft", "Townhome", "Villa"] as readonly string[]
  ).includes(value);
}
