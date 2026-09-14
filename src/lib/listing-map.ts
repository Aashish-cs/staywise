type ListingCoordinateSource = {
  coordinates?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
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
