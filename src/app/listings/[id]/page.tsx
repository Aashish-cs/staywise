import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BedDouble,
  BriefcaseBusiness,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  Home,
  MapPin,
  MessageCircle,
  PawPrint,
  Sparkles,
  Star,
  Utensils,
  WashingMachine,
  Waves,
  Wifi,
} from "lucide-react";
import { ListingActions } from "@/components/listing-actions";
import { ReservationPanel } from "@/components/reservation-panel";
import {
  getCurrentUserProfile,
  getFavoriteListingIds,
  getListingById,
} from "@/lib/listing-data";
import {
  featuredAmenities,
  type Listing,
  tripPurposeLabels,
} from "@/lib/listings";
import { rankListings } from "@/lib/recommendations";
import {
  buildSearchQueryString,
  firstParam,
  parseSearchParams,
} from "@/lib/search-url";

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

  const search = parseSearchParams(query);
  const hasBudgetQuery = Boolean(
    firstParam(query.budget) ?? firstParam(query.maxNightlyBudget),
  );
  const maxNightlyBudget = hasBudgetQuery
    ? search.maxNightlyBudget
    : listing.pricePerNight + 75;
  const backToSearchQuery = buildSearchQueryString({
    ...search,
    destination: search.destination || listing.city,
    maxNightlyBudget,
  });
  const backToSearchHref = `/search${backToSearchQuery ? `?${backToSearchQuery}` : ""}`;
  const currentListingPath = `/listings/${listing.id}${
    backToSearchQuery ? `?${backToSearchQuery}` : ""
  }`;
  const signInHref = `/auth?mode=signin&next=${encodeURIComponent(currentListingPath)}`;
  const fit = rankListings(
    {
      destination: listing.city,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      guests: search.guests,
      maxNightlyBudget,
      tripPurpose: search.tripPurpose,
      amenities: listing.amenities.filter((amenity) =>
        featuredAmenities.includes(amenity as (typeof featuredAmenities)[number]),
      ),
      month: search.month,
    },
    [listing],
  )[0];
  const { user, profile } = await getCurrentUserProfile();
  const favoriteIds = user ? await getFavoriteListingIds(user.id) : [];
  const accountRole =
    profile?.role === "host" ? "host" : profile?.role === "guest" ? "guest" : null;
  const accountHref = user
    ? accountRole === "host"
      ? "/host"
      : "/dashboard"
    : "/auth?mode=signin";
  const accountLabel = user
    ? accountRole === "host"
      ? "Host"
      : "Trips"
    : "Sign in";
  const searchSummary = [
    listing.city,
    search.checkIn && search.checkOut
      ? `${formatShortDate(search.checkIn)} - ${formatShortDate(search.checkOut)}`
      : "Add dates",
    `${search.guests} ${search.guests === 1 ? "guest" : "guests"}`,
  ];

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <header className="sticky top-0 z-30 border-b border-[#ebe3dd] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1536px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="StayWise home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] text-white shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight">
                StayWise
              </span>
              <span className="hidden text-xs font-semibold text-[#786a60] sm:block">
                Smart Stays, Better Days.
              </span>
            </span>
          </Link>

          <Link
            href={backToSearchHref}
            className="hidden min-w-0 max-w-xl flex-1 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold shadow-sm transition hover:shadow-md lg:flex"
          >
            {searchSummary.map((item, index) => (
              <span key={`${item}-${index}`} className="flex min-w-0 items-center">
                <span className="truncate">{item}</span>
                {index < searchSummary.length - 1 && (
                  <span className="mx-3 h-5 w-px bg-[#eadfd6]" />
                )}
              </span>
            ))}
            <span className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff385c] text-white">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/host"
              className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] md:block"
            >
              Host on StayWise
            </Link>
            <Link
              href={accountHref}
              className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold shadow-sm hover:border-[#ff385c]"
            >
              {accountLabel}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1536px] px-5 py-6 lg:px-8">
        <Link
          href={backToSearchHref}
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#5f5148] hover:text-[#df2348]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to stays
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="max-w-5xl text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              {listing.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-extrabold">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-[#201a18]" aria-hidden="true" />
                {listing.rating.toFixed(2)}
              </span>
              <span>{listing.reviewCount} review signals</span>
              <span className="inline-flex items-center gap-1 text-[#5f5148]">
                <MapPin className="h-4 w-4 text-[#ff385c]" aria-hidden="true" />
                {listing.neighborhood}, {listing.city}, {listing.state}
              </span>
            </div>
          </div>

          <ListingActions
            accountRole={accountRole}
            initialSaved={favoriteIds.includes(listing.id)}
            isSignedIn={Boolean(user)}
            listingId={listing.id}
            listingTitle={listing.title}
            signInHref={signInHref}
          />
        </div>

        <PhotoGallery listing={listing} />

        <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0">
            <section className="border-b border-[#eadfd6] pb-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    {listing.propertyType} in {listing.city}, {listing.state}
                  </h2>
                  <p className="mt-2 text-base font-semibold text-[#5f5148]">
                    {listing.capacity} guests · {listing.bedrooms} bedrooms ·{" "}
                    {listing.bathrooms} baths
                  </p>
                </div>
                <HostBadge listing={listing} />
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {buildQuickHighlights(listing).map((highlight) => (
                  <HighlightCard key={highlight.title} {...highlight} />
                ))}
              </div>
            </section>

            <section className="border-b border-[#eadfd6] py-8">
              <h2 className="text-2xl font-extrabold tracking-tight">About this stay</h2>
              <p className="mt-4 max-w-4xl text-base leading-8 text-[#5f5148]">
                {listing.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {listing.traits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full bg-[#f7f3ee] px-3 py-1 text-sm font-extrabold text-[#5f5148]"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </section>

            <section className="border-b border-[#eadfd6] py-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
                    <Star className="h-5 w-5 fill-[#201a18]" aria-hidden="true" />
                    {listing.rating.toFixed(2)} · {listing.reviewCount} review signals
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-[#5f5148]">
                    StayWise summarizes quality signals without inventing guest quotes.
                  </p>
                </div>
                <span className="rounded-full bg-[#fff3f5] px-3 py-1 text-sm font-extrabold text-[#bd1740]">
                  Guest confidence
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {buildRatingSignals(listing).map((signal) => (
                  <RatingSignalCard key={signal.label} {...signal} />
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {buildGuestSignals(listing).map((signal) => (
                  <GuestSignal key={signal.title} {...signal} />
                ))}
              </div>
            </section>

            <section className="border-b border-[#eadfd6] py-8">
              <h2 className="text-2xl font-extrabold tracking-tight">
                What this place offers
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {listing.amenities.map((amenity) => (
                  <AmenityItem key={amenity} amenity={amenity} />
                ))}
              </div>
            </section>

            {fit && (
              <section className="border-b border-[#eadfd6] py-8">
                <div className="overflow-hidden rounded-[28px] bg-[#201a18] text-white">
                  <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="p-6 md:p-8">
                      <p className="text-sm font-extrabold text-[#ffb84d]">
                        StayWise AI fit
                      </p>
                      <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                        {fit.matchScore}% match for this trip
                      </h2>
                      <p className="mt-4 text-sm font-semibold leading-7 text-white/70">
                        The score is built from the current search, listing amenities,
                        group size, budget, and availability month.
                      </p>
                    </div>
                    <div className="grid gap-3 bg-white/5 p-4 md:p-6">
                      {fit.matchReasons.map((reason) => (
                        <div key={reason} className="rounded-2xl bg-white/10 p-4">
                          <Sparkles className="h-4 w-4 text-[#ffb84d]" aria-hidden="true" />
                          <p className="mt-3 text-sm font-extrabold leading-6">
                            {reason}
                          </p>
                        </div>
                      ))}
                      {fit.tradeoffs.map((tradeoff) => (
                        <div key={tradeoff} className="rounded-2xl bg-white/10 p-4">
                          <CheckCircle2
                            className="h-4 w-4 text-[#ffb84d]"
                            aria-hidden="true"
                          />
                          <p className="mt-3 text-sm font-semibold leading-6 text-white/80">
                            {tradeoff}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="border-b border-[#eadfd6] py-8">
              <h2 className="text-2xl font-extrabold tracking-tight">Where you will be</h2>
              <p className="mt-2 text-sm font-semibold text-[#5f5148]">
                {listing.neighborhood}, {listing.city}, {listing.state}, {listing.country}
              </p>
              <StayMap listing={listing} />
            </section>

            <section className="py-8">
              <h2 className="text-2xl font-extrabold tracking-tight">Good to know</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <InfoColumn
                  title="House rules"
                  items={[
                    `${listing.capacity} guest maximum`,
                    "Respect quiet hours",
                    listing.amenities.includes("Pet friendly")
                      ? "Pets allowed"
                      : "Ask host before bringing pets",
                  ]}
                />
                <InfoColumn
                  title="Safety"
                  items={[
                    "Verified guest account required",
                    "Reservation conflicts checked on the server",
                    "Host details stay protected",
                  ]}
                />
                <InfoColumn
                  title="Booking"
                  items={[
                    "No payment collected in MVP",
                    "Trip appears in dashboard after reserve",
                    "Dates stay blocked once confirmed",
                  ]}
                />
              </div>
            </section>
          </div>

          <ReservationPanel
            listing={listing}
            isSignedIn={Boolean(user)}
            initialGuests={search.guests}
            initialCheckIn={search.checkIn || undefined}
            initialCheckOut={search.checkOut || undefined}
            signInHref={signInHref}
          />
        </div>
      </section>

      <footer className="border-t border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto flex max-w-[1536px] flex-col gap-3 px-5 py-6 text-sm font-semibold text-[#786a60] md:flex-row md:items-center md:justify-between lg:px-8">
          <p>StayWise · Smart Stays, Better Days.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/search" className="hover:text-[#ff385c]">
              Search
            </Link>
            <Link href="/host" className="hover:text-[#ff385c]">
              Host
            </Link>
            <Link href={accountHref} className="hover:text-[#ff385c]">
              {accountLabel}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PhotoGallery({ listing }: { listing: Listing }) {
  const galleryImages = listing.images.length
    ? listing.images
    : [{ alt: listing.imageAlt, url: listing.imageUrl }];

  if (galleryImages.length === 1) {
    return (
      <div
        id="photos"
        className="mt-6 overflow-hidden rounded-[28px] border border-[#eadfd6] bg-[#e8dfd6]"
      >
        <div className="relative aspect-[16/9] min-h-[300px]">
          <Image
            src={galleryImages[0].url}
            alt={galleryImages[0].alt}
            fill
            priority
            sizes="(min-width: 1024px) 1440px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      id="photos"
      className="mt-6 grid gap-2 overflow-hidden rounded-[28px] bg-[#eadfd6] md:grid-cols-4 md:grid-rows-2"
    >
      <ImageTile
        image={galleryImages[0]}
        priority
        className="aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[440px]"
      />
      {galleryImages.slice(1, 5).map((image) => (
        <ImageTile
          key={`${image.url}-${image.alt}`}
          image={image}
          className="hidden min-h-[216px] md:block"
        />
      ))}
    </div>
  );
}

function ImageTile({
  className,
  image,
  priority,
}: {
  className: string;
  image: Listing["images"][number];
  priority?: boolean;
}) {
  return (
    <div className={`relative bg-[#e8dfd6] ${className}`}>
      <Image
        src={image.url}
        alt={image.alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 720px, 100vw"
        className="object-cover transition duration-500 hover:scale-[1.03]"
      />
    </div>
  );
}

function HostBadge({ listing }: { listing: Listing }) {
  return (
    <div className="flex min-w-[240px] items-center gap-4 rounded-[22px] border border-[#eadfd6] bg-[#fbfaf8] p-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#201a18] text-lg font-extrabold text-white">
        {listing.host.name.slice(0, 1)}
      </span>
      <span>
        <span className="block text-sm font-extrabold">{listing.host.name}</span>
        <span className="mt-1 block text-xs font-semibold text-[#786a60]">
          {listing.host.isSuperhost ? "Top StayWise host" : "Verified StayWise host"}
        </span>
      </span>
    </div>
  );
}

function HighlightCard({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex gap-4 rounded-[22px] border border-[#eadfd6] bg-white p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff3f5] text-[#ff385c]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block font-extrabold">{title}</span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-[#5f5148]">
          {body}
        </span>
      </span>
    </div>
  );
}

function AmenityItem({ amenity }: { amenity: string }) {
  const Icon = amenityIcons[amenity] ?? CheckCircle2;

  return (
    <div className="flex min-h-16 items-center gap-4 rounded-[18px] border border-[#eadfd6] bg-white p-4 text-sm font-extrabold">
      <Icon className="h-5 w-5 shrink-0 text-[#201a18]" aria-hidden="true" />
      {amenity}
    </div>
  );
}

function RatingSignalCard({
  icon: Icon,
  label,
  score,
}: {
  icon: LucideIcon;
  label: string;
  score: number;
}) {
  const percent = Math.min(100, Math.round((score / 5) * 100));

  return (
    <div className="rounded-[18px] border border-[#eadfd6] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <Icon className="h-4 w-4 text-[#201a18]" aria-hidden="true" />
          {label}
        </span>
        <span className="text-sm font-extrabold">{score.toFixed(1)}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f1ebe6]">
        <div
          className="h-full rounded-full bg-[#201a18]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function GuestSignal({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="rounded-[22px] bg-[#fbfaf8] p-5">
      <Icon className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
      <h3 className="mt-4 font-extrabold">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">{body}</p>
    </div>
  );
}

function StayMap({ listing }: { listing: Listing }) {
  return (
    <div className="mt-5 overflow-hidden rounded-[28px] border border-[#eadfd6] bg-[#edf6f8]">
      <div className="relative h-80">
        <div className="absolute inset-x-0 top-20 h-3 bg-white/80" />
        <div className="absolute inset-x-0 bottom-24 h-3 bg-white/80" />
        <div className="absolute inset-y-0 left-1/4 w-3 bg-white/80" />
        <div className="absolute inset-y-0 right-1/3 w-3 bg-white/80" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff385c] p-4 text-white shadow-xl">
          <Home className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-3 rounded-[22px] bg-white/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold">
              Approximate area near {listing.neighborhood}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#786a60]">
              Exact coordinates stay private until booking confirmation.
            </p>
          </div>
          <p className="text-xs font-extrabold text-[#5f5148]">
            {listing.coordinates.lat.toFixed(3)}, {listing.coordinates.lng.toFixed(3)}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoColumn({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h3 className="font-extrabold">{title}</h3>
      <ul className="mt-3 space-y-3 text-sm font-semibold leading-6 text-[#5f5148]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-[#315d3b]"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildQuickHighlights(listing: Listing) {
  const highlights: {
    body: string;
    icon: LucideIcon;
    title: string;
  }[] = [
    {
      body: `${listing.propertyType} with room for ${listing.capacity} guests and ${listing.bedrooms} bedrooms.`,
      icon: BedDouble,
      title: "Room details",
    },
    {
      body: `Host usually responds in ${listing.host.responseTime}.`,
      icon: MessageCircle,
      title: "Host response",
    },
    {
      body: "Selected dates are checked against confirmed reservations before booking.",
      icon: CalendarDays,
      title: "Date-aware booking",
    },
    {
      body: listing.bestFor.length
        ? `Strong fit for ${listing.bestFor
            .map((purpose) => tripPurposeLabels[purpose].toLowerCase())
            .join(", ")} trips.`
        : "Balanced stay for flexible trips.",
      icon: Sparkles,
      title: "Smart match",
    },
  ];

  if (listing.amenities.includes("Self check-in")) {
    highlights.unshift({
      body: "Arrive on your schedule with self check-in support.",
      icon: DoorOpen,
      title: "Self check-in",
    });
  }

  if (listing.amenities.includes("Fast Wi-Fi")) {
    highlights.unshift({
      body: "Fast Wi-Fi is available for calls, streaming, and remote work.",
      icon: Wifi,
      title: "Fast Wi-Fi",
    });
  }

  return highlights.slice(0, 4);
}

function buildRatingSignals(listing: Listing) {
  return [
    {
      icon: CheckCircle2,
      label: "Cleanliness",
      score: signalScore(listing.rating, 0.06),
    },
    {
      icon: Home,
      label: "Accuracy",
      score: signalScore(listing.rating, -0.01),
    },
    {
      icon: DoorOpen,
      label: "Check-in",
      score: listing.amenities.includes("Self check-in")
        ? signalScore(listing.rating, 0.08)
        : signalScore(listing.rating, -0.03),
    },
    {
      icon: MessageCircle,
      label: "Communication",
      score: listing.host.isSuperhost
        ? signalScore(listing.rating, 0.07)
        : signalScore(listing.rating, 0),
    },
    {
      icon: MapPin,
      label: "Location",
      score: signalScore(listing.rating, 0.02),
    },
    {
      icon: Sparkles,
      label: "Value",
      score: signalScore(listing.rating, listing.pricePerNight <= 220 ? 0.09 : -0.04),
    },
  ];
}

function buildGuestSignals(listing: Listing) {
  const signals = [
    {
      body: listing.amenities.includes("Fast Wi-Fi")
        ? "Fast Wi-Fi and workspace signals make this a stronger pick for remote work."
        : "This stay works best for guests who are not prioritizing a desk setup.",
      icon: Wifi,
      title: "Work fit",
    },
    {
      body:
        listing.capacity >= 5
          ? "Capacity and bedroom count support families or groups traveling together."
          : "The layout is better suited for couples, solo travelers, or short work trips.",
      icon: BedDouble,
      title: "Space fit",
    },
    {
      body: `${listing.neighborhood} gives guests a ${listing.propertyType.toLowerCase()} base in ${listing.city}.`,
      icon: MapPin,
      title: "Neighborhood fit",
    },
  ];

  if (listing.amenities.includes("Parking")) {
    signals[2] = {
      body: "Parking support makes arrivals easier for road trips and weekend stays.",
      icon: Car,
      title: "Arrival fit",
    };
  }

  return signals;
}

function signalScore(base: number, offset: number) {
  return Math.min(5, Math.max(4.1, Number((base + offset).toFixed(1))));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

const amenityIcons: Record<string, LucideIcon> = {
  "Fast Wi-Fi": Wifi,
  Kitchen: Utensils,
  Parking: Car,
  "Pet friendly": PawPrint,
  Pool: Waves,
  "Self check-in": DoorOpen,
  Washer: WashingMachine,
  Workspace: BriefcaseBusiness,
};
