export type TripPurpose =
  | "business"
  | "family"
  | "remote-work"
  | "romantic"
  | "solo"
  | "group"
  | "outdoor";

export type PropertyType =
  | "Apartment"
  | "House"
  | "Cabin"
  | "Loft"
  | "Townhome"
  | "Villa";

export type Listing = {
  id: string;
  hostId: string | null;
  title: string;
  city: string;
  state: string;
  country: string;
  neighborhood: string;
  imageUrl: string;
  imageAlt: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  coordinates: {
    lat: number;
    lng: number;
  };
  host: {
    name: string;
    isSuperhost: boolean;
    responseTime: string;
  };
  amenities: string[];
  traits: string[];
  bestFor: TripPurpose[];
  availableMonths: string[];
  description: string;
};

export type ReservationStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "cancelled"
  | "completed";

export type Reservation = {
  id: string;
  listing: Listing | null;
  startDate: string;
  endDate: string;
  guests: number;
  nightlyRate: number;
  totalAmount: number;
  status: ReservationStatus;
  createdAt: string;
};

export const tripPurposeLabels: Record<TripPurpose, string> = {
  business: "Business",
  family: "Family",
  "remote-work": "Remote work",
  romantic: "Romantic",
  solo: "Solo",
  group: "Group",
  outdoor: "Outdoor",
};

export const featuredAmenities = [
  "Fast Wi-Fi",
  "Workspace",
  "Kitchen",
  "Parking",
  "Washer",
  "Pool",
  "Pet friendly",
  "Self check-in",
] as const;

export const stayMonths = ["Sep", "Oct", "Nov", "Dec"] as const;

export const fallbackListingImage =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80";
