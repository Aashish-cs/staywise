export type TripPurpose =
  | "business"
  | "family"
  | "remote-work"
  | "romantic"
  | "solo"
  | "group"
  | "outdoor";

export type Listing = {
  id: string;
  title: string;
  city: string;
  state: string;
  country: string;
  neighborhood: string;
  imageUrl: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: "Apartment" | "House" | "Cabin" | "Loft" | "Townhome" | "Villa";
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
];

export const staywiseListings: Listing[] = [
  {
    id: "austin-terrace-loft",
    title: "Sunlit terrace loft near downtown",
    city: "Austin",
    state: "TX",
    country: "United States",
    neighborhood: "East Austin",
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
    pricePerNight: 176,
    rating: 4.94,
    reviewCount: 128,
    capacity: 3,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Loft",
    coordinates: { lat: 30.2635, lng: -97.7059 },
    host: {
      name: "Maya",
      isSuperhost: true,
      responseTime: "12 min",
    },
    amenities: ["Fast Wi-Fi", "Workspace", "Kitchen", "Self check-in", "Washer"],
    traits: ["walkable", "quiet", "creative district", "coffee nearby"],
    bestFor: ["business", "remote-work", "solo"],
    availableMonths: ["Sep", "Oct", "Nov", "Dec"],
    description:
      "A bright loft with a dedicated work nook, skyline patio, and quick access to cafes, music venues, and downtown offices.",
  },
  {
    id: "seattle-family-haven",
    title: "Craftsman home with playroom and garden",
    city: "Seattle",
    state: "WA",
    country: "United States",
    neighborhood: "Green Lake",
    imageUrl:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
    pricePerNight: 241,
    rating: 4.88,
    reviewCount: 92,
    capacity: 7,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: "House",
    coordinates: { lat: 47.6796, lng: -122.325 },
    host: {
      name: "Daniel",
      isSuperhost: true,
      responseTime: "23 min",
    },
    amenities: ["Fast Wi-Fi", "Kitchen", "Parking", "Washer", "Pet friendly"],
    traits: ["family friendly", "safe neighborhood", "yard", "near parks"],
    bestFor: ["family", "group"],
    availableMonths: ["Sep", "Oct", "Nov"],
    description:
      "A roomy family stay with a fenced garden, full kitchen, and easy walks to the lake, grocery stores, and neighborhood restaurants.",
  },
  {
    id: "denver-mountain-view",
    title: "Mountain-view townhome with gear room",
    city: "Denver",
    state: "CO",
    country: "United States",
    neighborhood: "Highland",
    imageUrl:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80",
    pricePerNight: 198,
    rating: 4.91,
    reviewCount: 74,
    capacity: 5,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: "Townhome",
    coordinates: { lat: 39.762, lng: -105.011 },
    host: {
      name: "Priya",
      isSuperhost: false,
      responseTime: "31 min",
    },
    amenities: ["Fast Wi-Fi", "Kitchen", "Parking", "Washer", "Self check-in"],
    traits: ["mountain access", "gear storage", "rooftop", "restaurants nearby"],
    bestFor: ["outdoor", "group", "remote-work"],
    availableMonths: ["Sep", "Oct", "Dec"],
    description:
      "A clean basecamp close to downtown and the foothills, with secure space for bikes, skis, and longer-stay equipment.",
  },
  {
    id: "miami-coral-villa",
    title: "Coral villa with pool and chef kitchen",
    city: "Miami",
    state: "FL",
    country: "United States",
    neighborhood: "Coconut Grove",
    imageUrl:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80",
    pricePerNight: 389,
    rating: 4.97,
    reviewCount: 151,
    capacity: 8,
    bedrooms: 4,
    bathrooms: 3,
    propertyType: "Villa",
    coordinates: { lat: 25.729, lng: -80.241 },
    host: {
      name: "Sofia",
      isSuperhost: true,
      responseTime: "9 min",
    },
    amenities: ["Fast Wi-Fi", "Kitchen", "Parking", "Washer", "Pool", "Self check-in"],
    traits: ["pool", "private patio", "group friendly", "near dining"],
    bestFor: ["group", "family", "romantic"],
    availableMonths: ["Oct", "Nov", "Dec"],
    description:
      "A polished villa for celebrations or longer group stays, with shaded outdoor dining and a quiet residential setting.",
  },
  {
    id: "chicago-design-apartment",
    title: "Design apartment steps from transit",
    city: "Chicago",
    state: "IL",
    country: "United States",
    neighborhood: "West Loop",
    imageUrl:
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=80",
    pricePerNight: 162,
    rating: 4.86,
    reviewCount: 110,
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Apartment",
    coordinates: { lat: 41.884, lng: -87.647 },
    host: {
      name: "Jules",
      isSuperhost: true,
      responseTime: "16 min",
    },
    amenities: ["Fast Wi-Fi", "Workspace", "Kitchen", "Washer", "Self check-in"],
    traits: ["transit access", "restaurants nearby", "minimal", "walkable"],
    bestFor: ["business", "remote-work", "romantic", "solo"],
    availableMonths: ["Sep", "Nov", "Dec"],
    description:
      "A calm, efficient apartment for city trips, with a true desk setup and quick transit to downtown, Fulton Market, and museums.",
  },
  {
    id: "asheville-forest-cabin",
    title: "Forest cabin with hot tub and trail access",
    city: "Asheville",
    state: "NC",
    country: "United States",
    neighborhood: "Bent Creek",
    imageUrl:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1400&q=80",
    pricePerNight: 219,
    rating: 4.93,
    reviewCount: 67,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: "Cabin",
    coordinates: { lat: 35.503, lng: -82.607 },
    host: {
      name: "Owen",
      isSuperhost: true,
      responseTime: "18 min",
    },
    amenities: ["Fast Wi-Fi", "Kitchen", "Parking", "Pet friendly", "Self check-in"],
    traits: ["secluded", "trail access", "hot tub", "quiet"],
    bestFor: ["outdoor", "romantic", "remote-work"],
    availableMonths: ["Sep", "Oct", "Nov"],
    description:
      "A warm mountain cabin with a hot tub, strong Wi-Fi, and direct access to hiking and biking trails outside Asheville.",
  },
  {
    id: "san-diego-surf-house",
    title: "Surf house with patio two blocks from beach",
    city: "San Diego",
    state: "CA",
    country: "United States",
    neighborhood: "North Park",
    imageUrl:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=80",
    pricePerNight: 233,
    rating: 4.89,
    reviewCount: 85,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: "House",
    coordinates: { lat: 32.7409, lng: -117.1297 },
    host: {
      name: "Leo",
      isSuperhost: false,
      responseTime: "44 min",
    },
    amenities: ["Fast Wi-Fi", "Kitchen", "Parking", "Washer", "Pet friendly"],
    traits: ["beach access", "patio", "group friendly", "relaxed"],
    bestFor: ["group", "family", "outdoor"],
    availableMonths: ["Oct", "Nov", "Dec"],
    description:
      "A relaxed house for surf weekends or family beach time, with an outdoor shower, patio dining, and gear storage.",
  },
  {
    id: "nyc-quiet-studio",
    title: "Quiet studio near parks and trains",
    city: "New York",
    state: "NY",
    country: "United States",
    neighborhood: "Upper West Side",
    imageUrl:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=80",
    pricePerNight: 206,
    rating: 4.82,
    reviewCount: 143,
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Apartment",
    coordinates: { lat: 40.787, lng: -73.9754 },
    host: {
      name: "Amara",
      isSuperhost: true,
      responseTime: "19 min",
    },
    amenities: ["Fast Wi-Fi", "Workspace", "Kitchen", "Self check-in"],
    traits: ["quiet", "transit access", "parks nearby", "compact"],
    bestFor: ["business", "solo", "romantic", "remote-work"],
    availableMonths: ["Sep", "Oct", "Dec"],
    description:
      "A polished studio for travelers who want a quieter New York base near Central Park, express trains, and neighborhood cafes.",
  },
];
