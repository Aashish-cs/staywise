import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
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
import { cancelReservationAction } from "@/app/dashboard/actions";
import { StayWiseHeader } from "@/components/staywise-header";
import {
  getCurrentUserProfile,
  getFavoriteListingIds,
  getGuestReservations,
  getPublicListings,
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
  ).slice(0, 3);
  const today = getTodayIso();
  const upcomingReservations = reservations.filter(
    (reservation) => reservation.status === "confirmed" && reservation.endDate >= today,
  );
  const nextTrip = upcomingReservations[0];
  const savedListings = publicListings.filter((listing) => favoriteIds.includes(listing.id));
  const completedReservations = reservations.filter(
    (reservation) => reservation.status === "completed",
  );
  const cancelledReservations = reservations.filter(
    (reservation) => reservation.status === "cancelled",
  );
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
                done={cancelledReservations.length + completedReservations.length > 0}
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
                      <div className="relative aspect-[4/3] bg-[#e8dfd6]">
                        <Image
                          src={listing.imageUrl}
                          alt={listing.imageAlt}
                          fill
                          priority={index === 0}
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold">{listing.title}</h3>
                          <span className="rounded-full bg-[#fff3f5] px-2 py-1 text-xs font-semibold text-[#bd1740]">
                            {listing.matchScore}%
                          </span>
                        </div>
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
                href="/search"
              >
                Find more
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
                      <div className="relative aspect-[4/3] bg-[#e8dfd6]">
                        <Image
                          src={listing.imageUrl}
                          alt={listing.imageAlt}
                          fill
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="line-clamp-2 text-sm font-extrabold">
                            {listing.title}
                          </h3>
                          <span className="shrink-0 rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148]">
                            {listing.capacity} guests
                          </span>
                        </div>
                        <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#5f5148]">
                          <MapPin className="h-4 w-4 text-[#ff385c]" aria-hidden="true" />
                          {listing.city}, {listing.state}
                        </p>
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

          <section className="rounded-[24px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Reservation history</h2>
            <div className="mt-4 divide-y divide-[#eadfd6]">
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <ReservationRow key={reservation.id} reservation={reservation} />
                ))
              ) : (
                <EmptyState text="No reservations yet. Choose a stay and reserve it to test the full flow." />
              )}
            </div>
          </section>
      </section>
    </main>
  );
}

function ReservationRow({ reservation }: { reservation: Reservation }) {
  const listing = reservation.listing;

  return (
    <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <Home className="h-5 w-5 shrink-0 text-[#ff385c]" aria-hidden="true" />
        <div>
          <p className="font-semibold">{listing?.title ?? "Listing unavailable"}</p>
          <p className="text-sm text-[#5f5148]">
            {formatStayDate(reservation.startDate)} to {formatStayDate(reservation.endDate)} ·{" "}
            {reservation.guests} guests · {formatMoney(reservation.totalAmount)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 md:justify-end">
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold capitalize text-[#5f5148]">
          {reservation.status}
        </span>
        {reservation.status === "confirmed" && (
          <form action={cancelReservationAction}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <button
              type="submit"
              className="rounded-full border border-[#eadfd6] bg-white px-3 py-1 text-sm font-semibold hover:border-[#ff385c] hover:text-[#df2348]"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
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
