import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fallbackListingImage,
  type Listing,
  type PropertyType,
  type Reservation,
  type ReservationStatus,
  type TripPurpose,
} from "@/lib/listings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ListingImageRow = {
  image_url: string;
  alt_text: string;
  sort_order: number;
};

type ListingAmenityRow = {
  amenity: string;
};

type ListingRow = {
  id: string;
  host_id: string | null;
  title: string;
  description: string;
  city: string;
  state: string;
  country: string;
  neighborhood: string | null;
  property_type: string;
  price_per_night: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number | string;
  latitude: number | string | null;
  longitude: number | string | null;
  is_active: boolean;
  created_at?: string;
  listing_images?: ListingImageRow[] | null;
  listing_amenities?: ListingAmenityRow[] | null;
};

type ReservationRow = {
  id: string;
  start_date: string;
  end_date: string;
  guests: number;
  nightly_rate: number;
  total_amount: number;
  status: ReservationStatus;
  created_at: string;
  listing?: ListingRow | ListingRow[] | null;
};

const listingSelect = `
  id,
  host_id,
  title,
  description,
  city,
  state,
  country,
  neighborhood,
  property_type,
  price_per_night,
  capacity,
  bedrooms,
  bathrooms,
  latitude,
  longitude,
  is_active,
  created_at,
  listing_images (
    image_url,
    alt_text,
    sort_order
  ),
  listing_amenities (
    amenity
  )
`;

export async function getPublicListings() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("listings")
    .select(listingSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("Unable to load listings", error);
    return [];
  }

  return ((data ?? []) as ListingRow[]).map(mapListingRow);
}

export async function getListingById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("listings")
    .select(listingSelect)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapListingRow(data as ListingRow);
}

export async function getGuestReservations(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
        id,
        start_date,
        end_date,
        guests,
        nightly_rate,
        total_amount,
        status,
        created_at,
        listing:listings (
          ${listingSelect}
        )
      `,
    )
    .eq("guest_id", userId)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Unable to load guest reservations", error);
    return [];
  }

  return ((data ?? []) as unknown as ReservationRow[]).map(mapReservationRow);
}

export async function getFavoriteListingIds(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("guest_id", userId);

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => row.listing_id as string);
}

export async function getHostListings(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("listings")
    .select(listingSelect)
    .eq("host_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load host listings", error);
    return [];
  }

  return ((data ?? []) as ListingRow[]).map(mapListingRow);
}

export async function getHostReservations(userId: string) {
  const hostListings = await getHostListings(userId);
  const listingIds = hostListings.map((listing) => listing.id);

  if (listingIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
        id,
        start_date,
        end_date,
        guests,
        nightly_rate,
        total_amount,
        status,
        created_at,
        listing:listings (
          ${listingSelect}
        )
      `,
    )
    .in("listing_id", listingIds)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Unable to load host reservations", error);
    return [];
  }

  return ((data ?? []) as unknown as ReservationRow[]).map(mapReservationRow);
}

export async function getCurrentUserProfile() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { user: null, profile: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function fetchListingForReservation(
  supabase: SupabaseClient,
  listingId: string,
) {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, price_per_night, capacity, is_active")
    .eq("id", listingId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as {
    id: string;
    title: string;
    price_per_night: number;
    capacity: number;
    is_active: boolean;
  };
}

function mapReservationRow(row: ReservationRow): Reservation {
  const listing = Array.isArray(row.listing) ? row.listing[0] : row.listing;

  return {
    id: row.id,
    listing: listing ? mapListingRow(listing) : null,
    startDate: row.start_date,
    endDate: row.end_date,
    guests: row.guests,
    nightlyRate: row.nightly_rate,
    totalAmount: row.total_amount,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapListingRow(row: ListingRow): Listing {
  const images = [...(row.listing_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const image = images[0];
  const amenities = (row.listing_amenities ?? [])
    .map((item) => item.amenity)
    .filter(Boolean)
    .sort();
  const ratingSeed = seededNumber(row.id, 17);
  const reviewSeed = seededNumber(row.id, 113);

  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    city: row.city,
    state: row.state,
    country: row.country,
    neighborhood: row.neighborhood ?? "Central",
    imageUrl: image?.image_url ?? fallbackListingImage,
    imageAlt: image?.alt_text ?? row.title,
    pricePerNight: row.price_per_night,
    rating: Number((4.72 + ratingSeed / 1000).toFixed(2)),
    reviewCount: 44 + reviewSeed,
    capacity: row.capacity,
    bedrooms: row.bedrooms,
    bathrooms: Number(row.bathrooms),
    propertyType: normalizePropertyType(row.property_type),
    coordinates: {
      lat: Number(row.latitude ?? 0),
      lng: Number(row.longitude ?? 0),
    },
    host: {
      name: row.host_id ? "Verified StayWise host" : "StayWise market host",
      isSuperhost: ratingSeed > 140,
      responseTime: ratingSeed > 140 ? "18 min" : "42 min",
    },
    amenities,
    traits: inferTraits(row, amenities),
    bestFor: inferBestFor(row, amenities),
    availableMonths: ["Sep", "Oct", "Nov", "Dec"],
    description: row.description,
  };
}

function normalizePropertyType(value: string): PropertyType {
  const normalized = value.toLowerCase();

  if (normalized.includes("cabin")) return "Cabin";
  if (normalized.includes("loft")) return "Loft";
  if (normalized.includes("town")) return "Townhome";
  if (normalized.includes("villa")) return "Villa";
  if (normalized.includes("house") || normalized.includes("home")) return "House";

  return "Apartment";
}

function inferBestFor(row: ListingRow, amenities: string[]): TripPurpose[] {
  const bestFor = new Set<TripPurpose>();
  const has = (amenity: string) => amenities.includes(amenity);
  const propertyType = normalizePropertyType(row.property_type);

  if (has("Fast Wi-Fi") || has("Workspace")) {
    bestFor.add("remote-work");
    bestFor.add("business");
  }

  if (row.capacity >= 5 || row.bedrooms >= 3) {
    bestFor.add("family");
    bestFor.add("group");
  }

  if (propertyType === "Cabin" || has("Parking") || has("Pet friendly")) {
    bestFor.add("outdoor");
  }

  if (row.capacity <= 3) {
    bestFor.add("solo");
    bestFor.add("romantic");
  }

  return Array.from(bestFor).slice(0, 4);
}

function inferTraits(row: ListingRow, amenities: string[]) {
  const traits = [
    `${row.neighborhood ?? "central"} neighborhood`,
    `${row.city} base`,
    normalizePropertyType(row.property_type).toLowerCase(),
  ];

  if (amenities.includes("Workspace")) traits.push("work-ready");
  if (amenities.includes("Pool")) traits.push("pool access");
  if (amenities.includes("Parking")) traits.push("easy parking");
  if (amenities.includes("Self check-in")) traits.push("self check-in");

  return traits.slice(0, 5);
}

function seededNumber(value: string, max: number) {
  const total = value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return total % max;
}
