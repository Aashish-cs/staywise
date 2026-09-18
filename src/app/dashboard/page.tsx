import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Heart,
  Home,
  MapPin,
  ReceiptText,
  Sparkles,
  Timer,
} from "lucide-react";
import {
  cancelReservationAction,
  createReviewAction,
} from "@/app/dashboard/actions";
import {
  ListingFacts,
  ListingCardMedia,
  ListingLocationLine,
} from "@/components/listing-card-primitives";
import { StayWiseHeader } from "@/components/staywise-header";
import {
  getCurrentUserProfile,
  getFavoriteListingIds,
  getGuestReservations,
  getPublicListings,
  getReviewedReservationIds,
} from "@/lib/listing-data";
import type { Reservation } from "@/lib/listings";
import {
  formatMoney,
  formatStayDate,
  getTodayIso,
} from "@/lib/reservation-utils";
import { rankListings } from "@/lib/recommendations";
import { workReadySearchPreset } from "@/lib/search-presets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guest Dashboard",
};

export default async function DashboardPage() {
  const { user } = await getCurrentUserProfile();
  const reservations = user ? await getGuestReservations(user.id) : [];
  const favoriteIds = user ? await getFavoriteListingIds(user.id) : [];
  const reviewedReservationIds = user ? await getReviewedReservationIds(user.id) : [];
  const publicListings = await getPublicListings();
  const recommendations = rankListings(
    {
      destination: reservations[0]?.listing?.city ?? "",
      guests: reservations[0]?.guests ?? 2,
      maxNightlyBudget: reservations[0]?.nightlyRate
        ? reservations[0].nightlyRate + 80
        : 260,
      ...workReadySearchPreset,
    },
    publicListings,
    {
      favoriteListingIds: favoriteIds,
      preferredCities: reservations
        .map((reservation) => reservation.listing?.city ?? "")
        .filter(Boolean),
    },
  ).slice(0, 3);
  const today = getTodayIso();
  const upcomingReservations = reservations
    .filter((reservation) => isUpcomingReservation(reservation, today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const nextTrip = upcomingReservations[0];
  const pastReservations = reservations
    .filter((reservation) => isPastReservation(reservation, today))
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
  const savedListings = publicListings.filter((listing) => favoriteIds.includes(listing.id));
  const cancelledReservations = reservations
    .filter((reservation) => reservation.status === "cancelled")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const activeTripSpend = upcomingReservations.reduce(
    (total, reservation) => total + reservation.totalAmount,
    0,
  );

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <DashboardHeader email={user?.email} />

      <section className="border-b border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto grid max-w-[1536px] gap-6 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-extrabold text-[#ff385c]">Guest workspace</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              {user ? "Your StayWise trips" : "Sign in to view trips"}
            </h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#5f5148]">
              {user
                ? "Track upcoming stays, saved places, cancellation state, and AI recommendations from one verified account."
                : "Create a verified guest account to reserve stays and keep a private trip history."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={user ? "/search" : "/auth?mode=signin"}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#ff385c] px-5 text-sm font-extrabold text-white hover:bg-[#df2348]"
              >
                {user ? "Find another stay" : "Sign in"}
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold hover:border-[#ff385c]"
              >
                Explore StayWise
              </Link>
            </div>
          </div>

          <section className="grid gap-3 sm:grid-cols-2">
            <DashboardMetric
              icon={BriefcaseBusiness}
              label="Reservations"
              value={`${reservations.length}`}
            />
            <DashboardMetric icon={Heart} label="Saved stays" value={`${favoriteIds.length}`} />
            <DashboardMetric
              icon={CalendarDays}
              label="Upcoming"
              value={`${upcomingReservations.length}`}
            />
            <DashboardMetric
              icon={ReceiptText}
              label="Active trip value"
              value={formatMoney(activeTripSpend)}
            />
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-[1536px] space-y-8 px-5 py-8 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-[28px] border border-[#eadfd6] bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[280px] bg-[#e8dfd6]">
                {nextTrip?.listing ? (
                  <Image
                    src={nextTrip.listing.imageUrl}
                    alt={nextTrip.listing.imageAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#201a18] text-white">
                    <Sparkles className="h-12 w-12" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8">
                <p className="text-sm font-extrabold text-[#315d3b]">Current trip</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                  {nextTrip?.listing?.title ?? "No upcoming stay yet"}
                </h2>
                {nextTrip ? (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <TripFact
                        icon={CalendarDays}
                        label="Dates"
                        value={`${formatStayDate(nextTrip.startDate)} - ${formatStayDate(
                          nextTrip.endDate,
                        )}`}
                      />
                      <TripFact
                        icon={Home}
                        label="Stay"
                        value={nextTrip.listing?.city ?? "StayWise"}
                      />
                      <TripFact
                        icon={Sparkles}
                        label="Status"
                        value={nextTrip.status}
                      />
                      <TripFact
                        icon={ReceiptText}
                        label="Total"
                        value={formatMoney(nextTrip.totalAmount)}
                      />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {nextTrip.listing && (
                        <Link
                          href={`/listings/${nextTrip.listing.id}`}
                          className="inline-flex h-11 items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
                        >
                          Open stay
                        </Link>
                      )}
                      <Link
                        href="/search"
                        className="inline-flex h-11 items-center justify-center rounded-full border border-[#eadfd6] px-5 text-sm font-extrabold hover:border-[#ff385c]"
                      >
                        Plan another trip
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm font-semibold leading-7 text-[#5f5148]">
                    Reserve a stay and the trip timeline, totals, and status controls will
                    appear here immediately.
                  </p>
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-[#eadfd6] bg-[#fbfaf8] p-5 shadow-sm">
            <p className="text-sm font-extrabold text-[#ff385c]">Trip readiness</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
              Production flow status
            </h2>
            <div className="mt-5 space-y-3">
              <ReadinessItem
                done={Boolean(user)}
                text={user ? "Verified account active" : "Sign in to verify account"}
              />
              <ReadinessItem
                done={upcomingReservations.length > 0}
                text={
                  upcomingReservations.length > 0
                    ? "Upcoming reservation confirmed"
                    : "Reserve a stay to test booking"
                }
              />
              <ReadinessItem
                done={favoriteIds.length > 0}
                text={
                  favoriteIds.length > 0
                    ? "Saved stays ready for comparison"
                    : "Save stays to compare later"
                }
              />
              <ReadinessItem
                done={cancelledReservations.length + pastReservations.length > 0}
                text="History tracks completed and cancelled trips"
              />
            </div>
          </aside>
        </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#ff385c]">AI recommendations</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Smart matches for your next trip
                </h2>
              </div>
              <Link className="hidden text-sm font-semibold text-[#5f5148] hover:text-[#ff385c] md:block" href="/search">
                Adjust search
              </Link>
            </div>

            {recommendations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {recommendations.map((listing, index) => (
                  <article key={listing.id} className="overflow-hidden rounded-[22px] border border-[#eadfd6] bg-white shadow-sm">
                    <Link href={`/listings/${listing.id}`}>
                      <ListingCardMedia
                        frameClassName="rounded-none"
                        listing={listing}
                        priority={index === 0}
                        sizes="(min-width: 768px) 33vw, 100vw"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="line-clamp-2 font-extrabold leading-5">
                            {listing.title}
                          </h3>
                          <span className="rounded-full bg-[#fff3f5] px-2 py-1 text-xs font-semibold text-[#bd1740]">
                            {listing.matchScore}%
                          </span>
                        </div>
                        <ListingLocationLine listing={listing} className="mt-2" />
                        <ListingFacts listing={listing} className="mt-2" />
                        <p className="mt-2 text-sm text-[#5f5148]">{listing.matchReasons[0]}</p>
                        <p className="mt-3 text-sm">
                          <span className="font-semibold">{formatMoney(listing.pricePerNight)}</span>{" "}
                          night
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="Recommendations will appear after matching stays are live." />
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#ff385c]">Saved stays</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                  Places you are comparing
                </h2>
              </div>
              <Link
                className="hidden text-sm font-extrabold text-[#5f5148] hover:text-[#ff385c] md:block"
                href="/favorites"
              >
                Open saved stays
              </Link>
            </div>

            {savedListings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {savedListings.slice(0, 4).map((listing) => (
                  <article
                    key={listing.id}
                    className="overflow-hidden rounded-[22px] border border-[#eadfd6] bg-white shadow-sm"
                  >
                    <Link href={`/listings/${listing.id}`}>
                      <ListingCardMedia
                        frameClassName="rounded-none"
                        listing={listing}
                        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="line-clamp-2 text-sm font-extrabold">
                            {listing.title}
                          </h3>
                          <span className="shrink-0 rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148]">
                            Live
                          </span>
                        </div>
                        <ListingLocationLine listing={listing} className="mt-2" />
                        <ListingFacts listing={listing} className="mt-2" />
                        <p className="mt-3 text-sm">
                          <span className="font-extrabold">
                            {formatMoney(listing.pricePerNight)}
                          </span>{" "}
                          night
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="Saved stays will appear here after you tap Save on a listing." />
            )}
          </section>

          <TripSection
            description="Trips that can still be managed from your guest account."
            emptyText="No upcoming trips yet. Choose a stay and reserve it to test the full flow."
            reservations={upcomingReservations}
            reviewedReservationIds={reviewedReservationIds}
            title="Upcoming trips"
            variant="upcoming"
          />

          <TripSection
            description="Completed stays and older confirmed reservations move here for history."
            emptyText="Past trips will appear here after a stay ends or is marked completed."
            reservations={pastReservations}
            reviewedReservationIds={reviewedReservationIds}
            title="Past trips"
            variant="past"
          />

          <TripSection
            description="Cancelled reservations stay visible so the project has a real audit trail."
            emptyText="Cancelled trips will appear here after a confirmed stay is cancelled."
            reservations={cancelledReservations}
            reviewedReservationIds={reviewedReservationIds}
            title="Cancelled trips"
            variant="cancelled"
          />
      </section>
    </main>
  );
}

function TripSection({
  description,
  emptyText,
  reservations,
  reviewedReservationIds,
  title,
  variant,
}: {
  description: string;
  emptyText: string;
  reservations: Reservation[];
  reviewedReservationIds: string[];
  title: string;
  variant: "upcoming" | "past" | "cancelled";
}) {
  return (
    <section className="rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#ff385c]">Trips</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148]">
            {description}
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-extrabold text-[#5f5148]">
          {reservations.length} {reservations.length === 1 ? "trip" : "trips"}
        </span>
      </div>

      {reservations.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {reservations.map((reservation) => (
            <TripCard
              key={reservation.id}
              reservation={reservation}
              reviewedReservationIds={reviewedReservationIds}
              variant={variant}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState text={emptyText} />
        </div>
      )}
    </section>
  );
}

function TripCard({
  reservation,
  reviewedReservationIds,
  variant,
}: {
  reservation: Reservation;
  reviewedReservationIds: string[];
  variant: "upcoming" | "past" | "cancelled";
}) {
  const listing = reservation.listing;
  const nights = Math.max(1, countReservationNights(reservation));
  const status = getReservationStatusPresentation(reservation, variant);
  const canCancel = variant === "upcoming" && reservation.status === "confirmed";
  const hasReview = reviewedReservationIds.includes(reservation.id);
  const canReview =
    variant === "past" && reservation.status === "completed" && Boolean(listing) && !hasReview;

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#eadfd6] bg-white shadow-sm">
      {listing ? (
        <Link href={`/listings/${listing.id}`} className="block">
          <ListingCardMedia
            frameClassName="rounded-none"
            listing={listing}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </Link>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-[#201a18] text-white">
          <Home className="h-10 w-10" aria-hidden="true" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight">
              {listing?.title ?? "Listing unavailable"}
            </h3>
            <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#5f5148]">
              <MapPin className="h-4 w-4 shrink-0 text-[#ff385c]" aria-hidden="true" />
              {listing
                ? `${listing.neighborhood}, ${listing.city}, ${listing.state}`
                : "StayWise reservation"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold capitalize ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <TripFact
            icon={CalendarDays}
            label="Dates"
            value={`${formatStayDate(reservation.startDate)} - ${formatStayDate(
              reservation.endDate,
            )}`}
          />
          <TripFact
            icon={Home}
            label="Stay length"
            value={`${nights} ${nights === 1 ? "night" : "nights"}`}
          />
          <TripFact icon={Sparkles} label="Guests" value={`${reservation.guests}`} />
          <TripFact icon={ReceiptText} label="Total" value={formatMoney(reservation.totalAmount)} />
        </div>

        <div className="mt-5 rounded-2xl bg-[#f7f3ee] p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
            Reservation ID
          </p>
          <p className="mt-2 break-all font-mono text-xs font-semibold text-[#201a18]">
            {reservation.id}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/reservations/${reservation.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#201a18] px-4 text-sm font-extrabold text-white hover:bg-black"
          >
            Details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          {listing && (
            <Link
              href={`/listings/${listing.id}?checkIn=${reservation.startDate}&checkOut=${reservation.endDate}&guests=${reservation.guests}`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#eadfd6] px-4 text-sm font-extrabold hover:border-[#ff385c]"
            >
              Open stay
            </Link>
          )}
          {canCancel && (
            <form action={cancelReservationAction}>
              <input type="hidden" name="reservationId" value={reservation.id} />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-4 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348]"
              >
                Cancel trip
              </button>
            </form>
          )}
        </div>

        {canReview && listing ? (
          <ReviewForm listingId={listing.id} reservation={reservation} />
        ) : null}

        {hasReview && reservation.status === "completed" ? (
          <p className="mt-4 rounded-2xl bg-[#edf6f8] p-4 text-sm font-extrabold leading-6 text-[#23515a]">
            Review submitted for this completed stay.
          </p>
        ) : null}

        {!canCancel && variant === "upcoming" && (
          <p className="mt-4 text-sm font-semibold leading-6 text-[#786a60]">
            Cancellation is only available for confirmed upcoming trips.
          </p>
        )}
        {variant === "past" && (
          <p className="mt-4 text-sm font-semibold leading-6 text-[#786a60]">
            This trip is kept for history and confirmation records.
          </p>
        )}
        {variant === "cancelled" && (
          <p className="mt-4 text-sm font-semibold leading-6 text-[#786a60]">
            This cancelled reservation remains visible for audit and project review.
          </p>
        )}
      </div>
    </article>
  );
}

function ReviewForm({
  listingId,
  reservation,
}: {
  listingId: string;
  reservation: Reservation;
}) {
  return (
    <form action={createReviewAction} className="mt-5 rounded-2xl border border-[#eadfd6] bg-[#fbfaf8] p-4">
      <div>
        <p className="font-extrabold">Share your stay</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#5f5148]">
          Reviews are available after a completed reservation. You can submit one review per stay.
        </p>
      </div>
      <input type="hidden" name="reservationId" value={reservation.id} />
      <input type="hidden" name="listingId" value={listingId} />
      <div className="mt-4 grid gap-4 sm:grid-cols-[130px_minmax(0,1fr)]">
        <label className="text-sm font-extrabold">
          Rating
          <select
            name="rating"
            defaultValue="5"
            className="mt-2 h-11 w-full rounded-xl border border-[#d7c8bd] bg-white px-3 font-semibold"
            required
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-extrabold">
          Review
          <textarea
            name="body"
            minLength={20}
            maxLength={1200}
            required
            placeholder="What should future guests know?"
            className="mt-2 min-h-11 w-full rounded-xl border border-[#d7c8bd] bg-white px-3 py-2 font-semibold outline-none focus:border-[#ff385c]"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
      >
        Submit review
      </button>
    </form>
  );
}

function getReservationStatusPresentation(
  reservation: Reservation,
  variant: "upcoming" | "past" | "cancelled",
) {
  if (variant === "cancelled") {
    return {
      className: "bg-[#fff3f5] text-[#bd1740]",
      label: "Cancelled",
    };
  }

  if (reservation.status === "completed" || variant === "past") {
    return {
      className: "bg-[#edf6f8] text-[#23515a]",
      label: reservation.status === "completed" ? "Completed" : "Past",
    };
  }

  if (reservation.status === "confirmed") {
    return {
      className: "bg-[#e7f2e4] text-[#315d3b]",
      label: "Confirmed",
    };
  }

  return {
    className: "bg-[#fff7e6] text-[#7a4a00]",
    label: reservation.status.replace("_", " "),
  };
}

function isUpcomingReservation(reservation: Reservation, today: string) {
  return (
    reservation.status !== "cancelled" &&
    reservation.status !== "completed" &&
    reservation.endDate >= today
  );
}

function isPastReservation(reservation: Reservation, today: string) {
  return (
    reservation.status === "completed" ||
    (reservation.status !== "cancelled" && reservation.endDate < today)
  );
}

function countReservationNights(reservation: Reservation) {
  const start = new Date(`${reservation.startDate}T00:00:00`);
  const end = new Date(`${reservation.endDate}T00:00:00`);
  const nights = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

  return Number.isFinite(nights) ? nights : 0;
}

function DashboardHeader({ email }: { email?: string }) {
  return (
    <StayWiseHeader
      actions={
        <>
          <Link
            href="/search"
            className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] sm:block"
          >
            Search
          </Link>
          <Link
            href="/host"
            className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] sm:block"
          >
            Host
          </Link>
          <Link
            href="/favorites"
            className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] md:block"
          >
            Saved
          </Link>
          {email ? (
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/auth?mode=signin"
              className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold"
            >
              Sign in
            </Link>
          )}
        </>
      }
    />
  );
}

function TripFact({
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
      <p className="mt-3 text-xs font-extrabold uppercase text-[#786a60]">{label}</p>
      <p className="mt-1 text-sm font-extrabold capitalize">{value}</p>
    </div>
  );
}

function ReadinessItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-[#e7f2e4] text-[#315d3b]" : "bg-[#f7f3ee] text-[#786a60]"
        }`}
      >
        {done ? (
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Timer className="h-5 w-5" aria-hidden="true" />
        )}
      </span>
      <p className="text-sm font-extrabold leading-6">{text}</p>
    </div>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#eadfd6] bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
      <p className="mt-4 text-sm font-semibold text-[#5f5148]">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#d7c8bd] bg-white p-5 text-sm font-semibold text-[#5f5148]">
      {text}
    </div>
  );
}
