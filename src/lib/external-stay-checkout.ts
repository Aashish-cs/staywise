import {
  addDaysToIso,
  calculateReservationTotal,
  countNights,
  getFutureIso,
  isValidIsoDate,
} from "@/lib/reservation-utils";
import { firstParam, type RawSearchParams } from "@/lib/search-url";

export type ExternalStay = {
  actionUrl: string | null;
  address: string | null;
  checkIn: string;
  checkOut: string;
  description: string | null;
  destination: string;
  guests: number;
  id: string;
  imageUrl: string;
  kind: string;
  lat: string | null;
  lng: string | null;
  mapUrl: string | null;
  name: string;
  providerPrice: string | null;
  source: "amadeus" | "openstreetmap";
  typeLabel: string;
};

export const fallbackExternalStayImageUrl =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

export const externalStayQueryKeys = new Set([
  "actionUrl",
  "address",
  "checkIn",
  "checkOut",
  "description",
  "destination",
  "guests",
  "id",
  "imageUrl",
  "kind",
  "lat",
  "lng",
  "mapUrl",
  "name",
  "providerPrice",
  "source",
  "typeLabel",
]);

export function parseExternalStay(query: RawSearchParams): ExternalStay | null {
  const name = firstParam(query.name)?.trim();

  if (!name) {
    return null;
  }

  const checkIn = resolveCheckIn(firstParam(query.checkIn));
  const checkOut = resolveCheckOut(checkIn, firstParam(query.checkOut));
  const guests = clampInteger(firstParam(query.guests), 1, 16, 2);
  const source = firstParam(query.source) === "amadeus" ? "amadeus" : "openstreetmap";
  const imageUrl = sanitizeExternalUrl(firstParam(query.imageUrl)) ?? fallbackExternalStayImageUrl;

  return {
    actionUrl: sanitizeExternalUrl(firstParam(query.actionUrl)),
    address: optionalText(firstParam(query.address)),
    checkIn,
    checkOut,
    description: optionalText(firstParam(query.description)),
    destination: optionalText(firstParam(query.destination)) ?? "",
    guests,
    id: optionalText(firstParam(query.id)) ?? "external-stay",
    imageUrl,
    kind: optionalText(firstParam(query.kind)) ?? "hotel",
    lat: optionalCoordinate(firstParam(query.lat)),
    lng: optionalCoordinate(firstParam(query.lng)),
    mapUrl: sanitizeExternalUrl(firstParam(query.mapUrl)),
    name,
    providerPrice: optionalText(firstParam(query.providerPrice)),
    source,
    typeLabel: optionalText(firstParam(query.typeLabel)) ?? "Hotel",
  };
}

export function buildExternalStayPath(
  query: RawSearchParams,
  options: { payment?: "cancelled" | "success"; reserved?: boolean } = {},
) {
  const params = new URLSearchParams(buildExternalStayFields(query, options));

  return `/external-stays?${params.toString()}`;
}

export function buildExternalStayFields(
  query: RawSearchParams,
  options: { payment?: "cancelled" | "success"; reserved?: boolean } = {},
) {
  const fields: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(query)) {
    if (key === "payment" || key === "reserved" || !externalStayQueryKeys.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        fields.push([key, item]);
      }
      continue;
    }

    if (value) {
      fields.push([key, value]);
    }
  }

  if (options.reserved) {
    fields.push(["reserved", "true"]);
  }

  if (options.payment) {
    fields.push(["payment", options.payment]);
  }

  return fields;
}

export function fieldsToRawSearchParams(fields: Array<[string, string]>): RawSearchParams {
  const query: RawSearchParams = {};

  for (const [key, value] of fields) {
    if (!externalStayQueryKeys.has(key)) {
      continue;
    }

    const current = query[key];
    if (Array.isArray(current)) {
      current.push(value);
      continue;
    }

    if (current) {
      query[key] = [current, value];
      continue;
    }

    query[key] = value;
  }

  return query;
}

export function getExternalStayPricing(stay: ExternalStay) {
  const nights = Math.max(1, countNights(stay.checkIn, stay.checkOut));
  const nightlyRate = estimateExternalStayNightlyRate(stay);
  const totals = calculateReservationTotal(nightlyRate, nights);

  return { nightlyRate, nights, totals };
}

export function estimateExternalStayNightlyRate(stay: ExternalStay) {
  const seed = hashString(`${stay.id}:${stay.name}:${stay.destination}`);

  return 145 + (Math.abs(seed) % 180);
}

function resolveCheckIn(value: string | undefined) {
  return isValidIsoDate(value) ? value : getFutureIso(7);
}

function resolveCheckOut(checkIn: string, value: string | undefined) {
  return isValidIsoDate(value) && countNights(checkIn, value) > 0
    ? value
    : addDaysToIso(checkIn, 3);
}

function sanitizeExternalUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function optionalCoordinate(value: string | undefined) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? String(numeric) : null;
}

function clampInteger(
  value: string | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  const numeric = Number(value);

  if (!Number.isInteger(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
