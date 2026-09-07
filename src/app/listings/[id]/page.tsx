import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CheckCircle2,
  Home,
  MapPin,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { ReservationPanel } from "@/components/reservation-panel";
import { getCurrentUserProfile, getListingById } from "@/lib/listing-data";
import { featuredAmenities, type TripPurpose } from "@/lib/listings";
import { rankListings } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/listings/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return {
      title: "Listing",
    };
  }

  return {
    title: listing.title,
    description: `${listing.neighborhood}, ${listing.city}. ${listing.description}`,
    openGraph: {
      title: `${listing.title} | StayWise`,
      description: `${listing.neighborhood}, ${listing.city}. ${listing.description}`,
      images: [
        {
          url: listing.imageUrl,
          alt: listing.imageAlt,
        },
      ],
    },
  };
}

export default async function ListingPage({
  params,
  searchParams,
}: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  const initialGuests = parseNumberParam(query.guests, 2);
  const tripPurpose = parseTripPurpose(query.purpose);
  const maxNightlyBudget = parseNumberParam(query.budget, listing.pricePerNight + 75);
  const fit = rankListings(
    {
      destination: listing.city,
      guests: initialGuests,
      maxNightlyBudget,
      tripPurpose,
      amenities: listing.amenities.filter((amenity) =>
        featuredAmenities.includes(amenity as (typeof featuredAmenities)[number]),
      ),
      month: firstParam(query.month) ?? "Sep",
    },
    [listing],
  )[0];
  const { user } = await getCurrentUserProfile();

  return (
    <main className="min-h-screen bg-[#f7f3ee] text-[#201a18]">
      <header className="border-b border-[#eadfd6] bg-[#fffaf5]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-semibold">StayWise</span>
          </Link>
          <Link
            href={user ? "/dashboard" : "/auth"}
            className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-semibold"
          >
            {user ? "Trips" : "Sign in"}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f5148] hover:text-[#df2348]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to search
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-[#5f5148]">
              <MapPin className="h-4 w-4 text-[#ff385c]" aria-hidden="true" />
              {listing.neighborhood}, {listing.city}, {listing.state}
            </p>
            <h1 className="mt-2 max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {listing.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm">
            <Star className="h-4 w-4 fill-[#201a18]" aria-hidden="true" />
            {listing.rating.toFixed(2)} · {listing.reviewCount} reviews
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-[#eadfd6] bg-[#e8dfd6]">
          <div className="relative aspect-[16/9] min-h-[280px]">
            <Image
              src={listing.imageUrl}
              alt={listing.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 1180px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-7">
            <section className="rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-4">
                <Fact icon={Home} label="Type" value={listing.propertyType} />
                <Fact icon={Users} label="Guests" value={`${listing.capacity}`} />
                <Fact icon={BedDouble} label="Bedrooms" value={`${listing.bedrooms}`} />
                <Fact icon={Bath} label="Baths" value={`${listing.bathrooms}`} />
              </div>
            </section>

            <section className="rounded-[24px] border border-[#eadfd6] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#ff385c]">Hosted on StayWise</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {listing.host.name}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5f5148]">
                {listing.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {listing.traits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-semibold text-[#5f5148]"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#eadfd6] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">What this place offers</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {listing.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 text-sm font-semibold">
                    <CheckCircle2 className="h-5 w-5 text-[#315d3b]" aria-hidden="true" />
                    {amenity}
                  </div>
                ))}
              </div>
            </section>

            {fit && (
              <section className="rounded-[24px] border border-[#eadfd6] bg-[#201a18] p-6 text-white shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#ffb84d]">StayWise AI fit</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      {fit.matchScore}% match for this trip
                    </h2>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                    Explainable score
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {fit.matchReasons.map((reason) => (
                    <div key={reason} className="rounded-2xl bg-white/10 p-4">
                      <Sparkles className="h-4 w-4 text-[#ffb84d]" aria-hidden="true" />
                      <p className="mt-3 text-sm font-semibold leading-6">{reason}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <ReservationPanel
            listing={listing}
            isSignedIn={Boolean(user)}
            initialGuests={initialGuests}
          />
        </div>
      </section>
    </main>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f3ee] p-4">
      <Icon className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
      <p className="mt-3 text-xs font-semibold uppercase text-[#786a60]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function parseNumberParam(value: string | string[] | undefined, fallback: number) {
  const numeric = Number(firstParam(value));

  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseTripPurpose(value: string | string[] | undefined): TripPurpose {
  const rawValue = firstParam(value);
  const allowed: TripPurpose[] = [
    "business",
    "family",
    "remote-work",
    "romantic",
    "solo",
    "group",
    "outdoor",
  ];

  return allowed.includes(rawValue as TripPurpose)
    ? (rawValue as TripPurpose)
    : "remote-work";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
