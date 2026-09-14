export type Coordinates = {
  lat?: number | null;
  lng?: number | null;
};

export const nearbySearchRadiusMiles = 120;

const earthRadiusMiles = 3958.8;

export function calculateDistanceMiles(
  origin: Coordinates,
  destination: Coordinates,
) {
  if (!hasValidCoordinates(origin) || !hasValidCoordinates(destination)) {
    return null;
  }

  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);
  const latDelta = toRadians(destination.lat - origin.lat);
  const lngDelta = toRadians(destination.lng - origin.lng);
  const halfChord =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(lngDelta / 2) ** 2;
  const angularDistance =
    2 * Math.atan2(Math.sqrt(halfChord), Math.sqrt(1 - halfChord));

  return earthRadiusMiles * angularDistance;
}

export function formatDistanceMiles(distanceMiles: number) {
  if (distanceMiles < 0.1) {
    return "less than 0.1 mi";
  }

  if (distanceMiles < 10) {
    return `${distanceMiles.toFixed(1)} mi`;
  }

  return `${Math.round(distanceMiles)} mi`;
}

export function formatCoordinateForUrl(value: number) {
  return Number(value.toFixed(6)).toString();
}

export function hasSearchCoordinates(search: {
  nearLat?: number | null;
  nearLng?: number | null;
}) {
  return hasValidCoordinates({
    lat: search.nearLat,
    lng: search.nearLng,
  });
}

export function hasValidCoordinates(
  coordinates: Coordinates,
): coordinates is { lat: number; lng: number } {
  return isValidLatitude(coordinates.lat) && isValidLongitude(coordinates.lng);
}

function isValidLatitude(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
