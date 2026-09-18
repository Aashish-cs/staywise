import type { Metadata } from "next";
import Link from "next/link";
import { toggleHostListingAction } from "@/app/host/actions";
import {
  CalendarDays,
  CheckCircle2,
  Home,
  MapPin,
  Percent,
  Timer,
  WalletCards,
} from "lucide-react";
import { HostListingForm } from "@/components/host-listing-form";
import {
  ListingFacts,
  ListingCardMedia,
  ListingLocationLine,
} from "@/components/listing-card-primitives";
import { StayWiseHeader } from "@/components/staywise-header";
import {
  getCurrentUserProfile,
  getHostListings,
  getHostReservations,
} from "@/lib/listing-data";
import type { Listing, Reservation } from "@/lib/listings";
import { formatMoney, formatStayDate } from "@/lib/reservation-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Host Dashboard",
};

export default async function HostPage() {
  const { user, profile } = await getCurrentUserProfile();
  const isHost = profile?.role === "host";
  const hostListings = user && isHost ? await getHostListings(user.id) : [];
  const reservations = user && isHost ? await getHostReservations(user.id) : [];
  const projectedRevenue = reservations
    .filter((reservation) => reservation.status === "confirmed")
    .reduce((total, reservation) => total + reservation.totalAmount, 0);
  const confirmedReservations = reservations.filter(
    (reservation) => reservation.status === "confirmed",
  );
  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === "pending",
  );
  const averageNightly =
    hostListings.length > 0
      ? Math.round(
          hostListings.reduce((total, listing) => total + listing.pricePerNight, 0) /
            hostListings.length,
        )
      : 0;
  const averageReservationValue =
    reservations.length > 0
      ? Math.round(
          reservations.reduce((total, reservation) => total + reservation.totalAmount, 0) /
            reservations.length,
        )
      : 0;
  const occupancyRate = calculateHostOccupancy(hostListings.length, reservations);

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
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
              href="/dashboard"
              className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] sm:block"
            >
              Trips
            </Link>
            {user ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full bg-[#201a18] px-4 py-2 text-sm font-extrabold text-white"
                >
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/auth?mode=signin&role=host"
                className="rounded-full bg-[#201a18] px-4 py-2 text-sm font-extrabold text-white"
              >
                Host sign in
              </Link>
            )}
          </>
        }
      />

      <section className="border-b border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto flex max-w-[1536px] flex-col gap-4 px-5 py-8 md:flex-row md:items-end md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-extrabold text-[#ff385c]">Host dashboard</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Manage listings, availability, and guest demand.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#5f5148]">
              StayWise keeps host inventory, bookings, and guest-facing search quality in
              the same production flow.
            </p>
          </div>
          {isHost ? (
            <span className="inline-flex h-12 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold">
              {user?.email}
            </span>
          ) : (
            <Link
              href={user ? "/host/onboarding" : "/auth?mode=signup&role=host"}
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold hover:border-[#ff385c]"
            >
              {user ? "Start host onboarding" : "Create host account"}
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
        {!user && (
          <GateMessage
            title="Sign in as a host"
            body="Host tools are connected to verified accounts so listings and reservations stay private to the right owner."
            action="Open auth"
            href="/auth?mode=signin&role=host"
          />
        )}

        {user && !isHost && (
          <GateMessage
            title="Ready to host?"
            body="Complete the short host onboarding flow before publishing your first StayWise listing."
            action="Start onboarding"
            href="/host/onboarding"
          />
        )}

        {isHost && (
          <>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <HostMetric icon={Home} label="Active listings" value={`${hostListings.length}`} />
              <HostMetric
                icon={CalendarDays}
                label="Reservations"
                value={`${reservations.length}`}
              />
              <HostMetric
                icon={WalletCards}
                label="Projected revenue"
                value={formatMoney(projectedRevenue)}
              />
            </div>

            <section className="mt-6 grid gap-4 lg:grid-cols-6">
              <HostSignal
                icon={CheckCircle2}
                label="Confirmed stays"
                value={`${confirmedReservations.length}`}
                tone="green"
              />
              <HostSignal
                icon={Timer}
                label="Pending requests"
                value={`${pendingReservations.length}`}
                tone="gold"
              />
              <HostSignal
                icon={WalletCards}
                label="Average nightly"
                value={averageNightly ? formatMoney(averageNightly) : "$0"}
                tone="pink"
              />
              <HostSignal
                icon={MapPin}
                label="Markets"
                value={`${new Set(hostListings.map((listing) => listing.city)).size}`}
                tone="blue"
              />
              <HostSignal
                icon={Percent}
                label="90-day occupancy"
                value={`${occupancyRate}%`}
                tone="blue"
              />
              <HostSignal
                icon={WalletCards}
                label="Average booking"
                value={averageReservationValue ? formatMoney(averageReservationValue) : "$0"}
                tone="green"
              />
            </section>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section className="rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#315d3b]">Portfolio</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                      Listing management
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#e7f2e4] px-3 py-1 text-sm font-semibold text-[#315d3b]">
                    Live DB
                  </span>
                </div>

                <div className="mt-5 divide-y divide-[#eadfd6]">
                  {hostListings.length > 0 ? (
                    hostListings.map((listing) => (
                      <HostListingRow key={listing.id} listing={listing} />
                    ))
                  ) : (
                    <p className="rounded-[22px] border border-dashed border-[#d7c8bd] bg-[#fffaf5] p-5 text-sm font-semibold text-[#5f5148]">
                      No host-owned listings yet. Publish one below and it appears in
                      search immediately.
                    </p>
                  )}
                </div>
              </section>

              <aside className="self-start rounded-[24px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm xl:sticky xl:top-8">
                <p className="text-sm font-semibold text-[#ff385c]">AI host assist</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Improve match quality before publishing.
                </h2>
                <div className="mt-5 space-y-3">
                  <HostInsight title="Add workspace photos" body="Remote-work guests rank listings higher when the desk setup is visible." />
                  <HostInsight title="Show parking clearly" body="Family and outdoor trips often depend on easy parking and gear access." />
                  <HostInsight title="Keep calendar fresh" body="Recommendation quality drops when availability is stale." />
                </div>
              </aside>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <HostListingForm />
              <section className="rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#315d3b]">Reservation feed</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Guest bookings
                </h2>
                <div className="mt-5 divide-y divide-[#eadfd6]">
                  {reservations.length > 0 ? (
                    reservations.map((reservation) => (
                      <HostReservationRow
                        key={reservation.id}
                        reservation={reservation}
                      />
                    ))
                  ) : (
                    <p className="rounded-[22px] border border-dashed border-[#d7c8bd] bg-[#fffaf5] p-5 text-sm font-semibold text-[#5f5148]">
                      Reservations for your listings will show here.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function HostListingRow({ listing }: { listing: Listing }) {
  const qualityScore = getListingQualityScore(listing);

  return (
    <article className="grid gap-4 py-5 md:grid-cols-[140px_1fr_auto] md:items-center">
      <Link
        href={`/listings/${listing.id}`}
        className="block"
      >
        <ListingCardMedia
          frameClassName="rounded-2xl"
          listing={listing}
          sizes="128px"
        />
      </Link>
      <div>
        <h3 className="font-semibold">{listing.title}</h3>
        <ListingLocationLine listing={listing} className="mt-1" />
        <ListingFacts listing={listing} className="mt-3" />
        <div className="mt-3 flex flex-wrap gap-2">
          {listing.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-semibold text-[#5f5148]">
              {amenity}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold">
          <span className="rounded-full bg-[#e7f2e4] px-3 py-1 text-[#315d3b]">
            {qualityScore}% quality
          </span>
          <span className={`rounded-full px-3 py-1 ${listing.isActive ? "bg-[#edf6f8] text-[#23515a]" : "bg-[#f7f3ee] text-[#786a60]"}`}>
            {listing.isActive ? "Published" : "Unpublished"}
          </span>
          <span className="rounded-full bg-[#fff3f5] px-3 py-1 text-[#bd1740]">
            {listing.images.length} image
            {listing.images.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 md:block md:text-right">
        <p className="font-semibold">{formatMoney(listing.pricePerNight)}/night</p>
        <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5f5148] md:justify-end">
          <CheckCircle2 className="h-4 w-4 text-[#315d3b]" aria-hidden="true" />
          {listing.isActive ? "Visible in search" : "Hidden from search"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
          <Link
            href={`/listings/${listing.id}`}
            className="rounded-full border border-[#eadfd6] px-4 py-2 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348]"
          >
            View
          </Link>
          <form action={toggleHostListingAction}>
            <input type="hidden" name="listingId" value={listing.id} />
            <button
              type="submit"
              className="rounded-full border border-[#eadfd6] px-4 py-2 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348]"
            >
              {listing.isActive ? "Unpublish" : "Publish"}
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

function HostReservationRow({ reservation }: { reservation: Reservation }) {
  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{reservation.listing?.title ?? "Listing unavailable"}</p>
          <p className="mt-1 text-sm text-[#5f5148]">
            {formatStayDate(reservation.startDate)} to {formatStayDate(reservation.endDate)} ·{" "}
            {reservation.guests} guests
          </p>
        </div>
        <span className="rounded-full bg-[#f7f3ee] px-3 py-1 text-sm font-semibold capitalize text-[#5f5148]">
          {reservation.status}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#315d3b]">
        {formatMoney(reservation.totalAmount)} total
      </p>
    </div>
  );
}

function HostMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
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

function HostSignal({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof Home;
  label: string;
  tone: "blue" | "gold" | "green" | "pink";
  value: string;
}) {
  const toneClass = {
    blue: "bg-[#edf6f8] text-[#23515a]",
    gold: "bg-[#fff5dd] text-[#7a5100]",
    green: "bg-[#e7f2e4] text-[#315d3b]",
    pink: "bg-[#fff3f5] text-[#bd1740]",
  }[tone];

  return (
    <div className="flex items-center gap-4 rounded-[22px] border border-[#eadfd6] bg-white p-4 shadow-sm">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-2xl font-extrabold tracking-tight">{value}</span>
        <span className="block text-sm font-semibold text-[#5f5148]">{label}</span>
      </span>
    </div>
  );
}

function HostInsight({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5f5148]">{body}</p>
    </div>
  );
}

function GateMessage({
  title,
  body,
  action,
  href,
}: {
  title: string;
  body: string;
  action: string;
  href: string;
}) {
  return (
    <section className="mt-8 rounded-[24px] border border-[#eadfd6] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-[#ff385c]">Protected workspace</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5148]">{body}</p>
      <Link
        href={href}
        className="mt-5 inline-flex h-11 items-center rounded-full bg-[#201a18] px-5 text-sm font-semibold text-white"
      >
        {action}
      </Link>
    </section>
  );
}

function getListingQualityScore(listing: Listing) {
  let score = 48;

  if (listing.images.length > 0) score += 10;
  if (listing.description.length >= 80) score += 10;
  if (listing.amenities.includes("Fast Wi-Fi")) score += 8;
  if (listing.amenities.includes("Self check-in")) score += 8;
  if (listing.amenities.includes("Parking")) score += 6;
  if (listing.amenities.length >= 5) score += 10;

  return Math.min(99, score);
}

function calculateHostOccupancy(listingCount: number, reservations: Reservation[]) {
  if (listingCount === 0) {
    return 0;
  }

  const today = startOfDay(new Date());
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + 90);
  const bookedNights = reservations.reduce(
    (total, reservation) =>
      total +
      (reservation.status === "confirmed" || reservation.status === "completed"
        ? countNightsWithinWindow(reservation, today, windowEnd)
        : 0),
    0,
  );
  const availableNights = listingCount * 90;

  return Math.min(100, Math.round((bookedNights / availableNights) * 100));
}

function countNightsWithinWindow(
  reservation: Reservation,
  windowStart: Date,
  windowEnd: Date,
) {
  const start = new Date(`${reservation.startDate}T00:00:00`);
  const end = new Date(`${reservation.endDate}T00:00:00`);
  const clippedStart = start > windowStart ? start : windowStart;
  const clippedEnd = end < windowEnd ? end : windowEnd;

  if (clippedEnd <= clippedStart) {
    return 0;
  }

  return Math.max(
    0,
    Math.round((clippedEnd.getTime() - clippedStart.getTime()) / (24 * 60 * 60 * 1000)),
  );
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
