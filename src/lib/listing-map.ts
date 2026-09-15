type ListingCoordinateSource = {
  coordinates?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
};

export type MapCoordinates = {
  lat: number;
  lng: number;
};

export type MapViewport = {
  center: MapCoordinates;
  east: number;
  north: number;
  south: number;
  west: number;
  zoom: number;
};

const defaultListingCoordinates = {
  lat: 32.7767,
  lng: -96.797,
};

const approximateAreaOffset = {
  lat: 0.018,
  lng: 0.024,
};

export function getListingCoordinates(listing: ListingCoordinateSource) {
  const lat = Number.isFinite(listing.coordinates?.lat)
    ? Number(listing.coordinates?.lat)
    : defaultListingCoordinates.lat;
  const lng = Number.isFinite(listing.coordinates?.lng)
    ? Number(listing.coordinates?.lng)
    : defaultListingCoordinates.lng;

  return {
    lat: lat || defaultListingCoordinates.lat,
    lng: lng || defaultListingCoordinates.lng,
  };
}

export function getMapViewport(points: MapCoordinates[]) {
  const safePoints = points.length > 0 ? points : [defaultListingCoordinates];
  const latitudes = safePoints.map((point) => point.lat);
  const longitudes = safePoints.map((point) => point.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, approximateAreaOffset.lat);
  const lngSpan = Math.max(maxLng - minLng, approximateAreaOffset.lng);
  const latPadding = latSpan * 0.28;
  const lngPadding = lngSpan * 0.28;
  const north = clampLatitude(maxLat + latPadding);
  const south = clampLatitude(minLat - latPadding);
  const east = clampLongitude(maxLng + lngPadding);
  const west = clampLongitude(minLng - lngPadding);

  return {
    center: {
      lat: (north + south) / 2,
      lng: (east + west) / 2,
    },
    east,
    north,
    south,
    west,
    zoom: getViewportZoom(Math.max(north - south, east - west)),
  } satisfies MapViewport;
}

export function getOpenStreetMapEmbedUrl(listing: ListingCoordinateSource) {
  const { lat, lng } = getListingCoordinates(listing);
  const bbox = [
    lng - approximateAreaOffset.lng,
    lat - approximateAreaOffset.lat,
    lng + approximateAreaOffset.lng,
    lat + approximateAreaOffset.lat,
  ].join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function getOpenStreetMapUrl(listing: ListingCoordinateSource) {
  const { lat, lng } = getListingCoordinates(listing);

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
}

export function getOpenStreetMapAreaUrl(points: MapCoordinates[]) {
  const viewport = getMapViewport(points);

  return `https://www.openstreetmap.org/#map=${viewport.zoom}/${viewport.center.lat}/${viewport.center.lng}`;
}

function getViewportZoom(span: number) {
  if (span <= 0.03) return 14;
  if (span <= 0.08) return 13;
  if (span <= 0.2) return 12;
  if (span <= 0.6) return 10;

  return 8;
}

function clampLatitude(value: number) {
  return Math.max(-85, Math.min(85, value));
}

function clampLongitude(value: number) {
  return Math.max(-180, Math.min(180, value));
}
