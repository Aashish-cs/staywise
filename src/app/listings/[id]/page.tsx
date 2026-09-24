import type { Metadata } from "next";
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
import { ListingPhotoGallery } from "@/components/listing-photo-gallery";
import { ReservationPanel } from "@/components/reservation-panel";
import { StayWiseHeader } from "@/components/staywise-header";
import {
  getCurrentUserProfile,
  getFavoriteListingIds,
  getListingById,
  getListingReviews,
  summarizeListingReviews,
} from "@/lib/listing-data";
import {
  getOpenStreetMapEmbedUrl,
  getOpenStreetMapUrl,
} from "@/lib/listing-map";
import {
  featuredAmenities,
  type Listing,
  type ListingReview,
  type ListingReviewSummary,
  tripPurposeLabels,
} from "@/lib/listings";
import { rankListings } from "@/lib/recommendations";
import { formatMoney } from "@/lib/reservation-utils";
import {
  buildSearchQueryString,
  firstParam,
  parseSearchParams,
} from "@/lib/search-url";
import { canonicalPath, truncateMetaDescription } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/listings/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  const listingPath = canonicalPath(`/listings/${listing.id}`);
  const title = `${listing.title} in ${listing.city}`;
  const description = truncateMetaDescription(
    `${listing.neighborhood}, ${listing.city}. ${listing.description}`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: listingPath,
    },
    openGraph: {
      title: `${title} | StayWise`,
      description,
      type: "article",
      url: listingPath,
      images: [
        {
          url: listing.imageUrl,
          alt: listing.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | StayWise`,
      description,
      images: [listing.imageUrl],
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
    },
    [listing],
  )[0];
  const { user, profile } = await getCurrentUserProfile();
  const favoriteIds = user ? await getFavoriteListingIds(user.id) : [];
  const reviews = await getListingReviews(listing.id);
  const reviewSummary = summarizeListingReviews(reviews);
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
    <main className="min-h-screen bg-white pb-24 text-[#201a18] lg:pb-0">
      <StayWiseHeader
        center={
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
        }
        actions={
          <>
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
          </>
        }
      />

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
                <CheckCircle2 className="h-4 w-4 text-[#315d3b]" aria-hidden="true" />
                Live StayWise listing
              </span>
              <span className="inline-flex items-center gap-1 text-[#5f5148]">
                <MapPin className="h-4 w-4 text-[#ff385c]" aria-hidden="true" />
                {listing.neighborhood}, {listing.city}, {listing.state}
              </span>
              <ReviewSummary summary={reviewSummary} compact />
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

        <ListingPhotoGallery listing={listing} />

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
                    <CheckCircle2 className="h-5 w-5 text-[#315d3b]" aria-hidden="true" />
                    StayWise fit signals
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-[#5f5148]">
                    These are derived from listing details, amenities, availability, and verified
                    guest activity.
                  </p>
                </div>
                <span className="rounded-full bg-[#fff3f5] px-3 py-1 text-sm font-extrabold text-[#bd1740]">
                  Verified data only
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {buildListingSignals(listing).map((signal) => (
                  <ListingSignalCard key={signal.label} {...signal} />
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {buildGuestSignals(listing).map((signal) => (
                  <GuestSignal key={signal.title} {...signal} />
                ))}
              </div>
            </section>

            <ListingReviews reviews={reviews} summary={reviewSummary} />

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
                        group size, and budget. Exact date availability is checked by
                        StayWise before reservation.
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

          <div id="reserve" className="scroll-mt-24">
            <ReservationPanel
              listing={listing}
              isSignedIn={Boolean(user)}
              initialGuests={search.guests}
              initialCheckIn={search.checkIn || undefined}
              initialCheckOut={search.checkOut || undefined}
              signInHref={signInHref}
            />
          </div>
        </div>
      </section>

      <MobileReserveBar listing={listing} />

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

function ListingReviews({
  reviews,
  summary,
}: {
  reviews: ListingReview[];
  summary: ListingReviewSummary;
}) {
  return (
    <section className="border-b border-[#eadfd6] py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Guest reviews</h2>
          <p className="mt-2 text-sm font-semibold text-[#5f5148]">
            Only reviews from completed reservations appear here.
          </p>
        </div>
        <ReviewSummary summary={summary} />
      </div>

      {reviews.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[22px] border border-[#eadfd6] bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-extrabold">{review.guestName}</p>
                  <div className="mt-2 flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < review.rating
                            ? "fill-[#ffb84d] text-[#ffb84d]"
                            : "text-[#d7c8bd]"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <time
                  dateTime={review.createdAt}
                  className="shrink-0 text-xs font-extrabold text-[#786a60]"
                >
                  {formatReviewDate(review.createdAt)}
                </time>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-[#5f5148]">
                {review.body}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[22px] border border-dashed border-[#d7c8bd] bg-[#fbfaf8] p-5">
          <p className="font-extrabold">No reviews yet</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">
            This listing is new to StayWise. The first review will appear after a guest completes a stay.
          </p>
        </div>
      )}
    </section>
  );
}

function ReviewSummary({
  compact = false,
  summary,
}: {
  compact?: boolean;
  summary: ListingReviewSummary;
}) {
  if (summary.average === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f3ee] px-3 py-1 text-sm font-extrabold text-[#5f5148]">
        New · No reviews yet
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-extrabold ${compact ? "text-[#5f5148]" : "rounded-full bg-[#f7f3ee] px-3 py-1"}`}>
      <Star className="h-4 w-4 fill-[#ffb84d] text-[#ffb84d]" aria-hidden="true" />
      {summary.average.toFixed(1)} · {summary.count} {summary.count === 1 ? "review" : "reviews"}
    </span>
  );
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function MobileReserveBar({ listing }: { listing: Listing }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eadfd6] bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(32,26,24,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[1536px] items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold">
            {formatMoney(listing.pricePerNight)}
            <span className="font-semibold text-[#5f5148]"> night</span>
          </p>
          <p className="truncate text-xs font-semibold text-[#786a60]">
            {listing.neighborhood}, {listing.city}
          </p>
        </div>
        <Link
          href="#reserve"
          className="flex h-11 shrink-0 items-center justify-center rounded-full bg-[#ff385c] px-5 text-sm font-extrabold text-white shadow-sm hover:bg-[#df2348]"
        >
          Reserve
        </Link>
      </div>
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
          Verified StayWise host
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

function ListingSignalCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#eadfd6] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <Icon className="h-4 w-4 text-[#201a18]" aria-hidden="true" />
          {label}
        </span>
        <span className="text-sm font-extrabold text-[#315d3b]">{value}</span>
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
        <iframe
          title={`OpenStreetMap area for ${listing.title}`}
          src={getOpenStreetMapEmbedUrl(listing)}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
        />
        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-3 rounded-[22px] bg-white/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold">
              Approximate area near {listing.neighborhood}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#786a60]">
              OpenStreetMap is shown from the coordinates stored for this listing.
            </p>
          </div>
          <Link
            href={getOpenStreetMapUrl(listing)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#201a18] px-4 text-xs font-extrabold text-white hover:bg-black"
          >
            Open map
          </Link>
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
      body: "Host identity is connected to a verified StayWise account.",
      icon: MessageCircle,
      title: "Verified host",
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

function buildListingSignals(listing: Listing) {
  return [
    {
      icon: CheckCircle2,
      label: "Listing status",
      value: "Live",
    },
    {
      icon: Home,
      label: "Space",
      value: `${listing.bedrooms} bed · ${listing.capacity} guests`,
    },
    {
      icon: DoorOpen,
      label: "Check-in",
      value: listing.amenities.includes("Self check-in")
        ? "Self check-in"
        : "Host assisted",
    },
    {
      icon: MessageCircle,
      label: "Host",
      value: "Verified",
    },
    {
      icon: MapPin,
      label: "Location",
      value: listing.neighborhood,
    },
    {
      icon: Sparkles,
      label: "Value",
      value: `$${listing.pricePerNight}/night`,
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
