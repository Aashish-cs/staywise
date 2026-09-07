import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  Heart,
  Home,
  Sparkles,
  Star,
} from "lucide-react";
import { cancelReservationAction } from "@/app/dashboard/actions";
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
      tripPurpose: "remote-work",
      amenities: ["Fast Wi-Fi", "Workspace"],
      month: "Nov",
    },
    publicListings,
  ).slice(0, 3);
  const today = getTodayIso();
  const upcomingReservations = reservations.filter(
    (reservation) => reservation.status === "confirmed" && reservation.endDate >= today,
  );

  return (
    <main className="min-h-screen bg-[#f7f3ee] text-[#201a18]">
      <DashboardHeader email={user?.email} />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="self-start rounded-[24px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm lg:sticky lg:top-8">
          <p className="text-sm font-semibold text-[#ff385c]">Guest workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {user ? "Your StayWise trips" : "Sign in to view trips"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#5f5148]">
            {user
              ? "Reservations, saved places, and AI recommendations are tied to your verified account."
              : "Create a verified guest account to reserve places and keep a private trip history."}
          </p>
          <Link
            href={user ? "/" : "/auth"}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white hover:bg-[#df2348]"
          >
            {user ? "Find another stay" : "Sign in"}
          </Link>
        </aside>

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
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
          </section>

          <section className="rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#315d3b]">Current trip</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {upcomingReservations[0]?.listing?.title ?? "No upcoming stay yet"}
                </h2>
              </div>
              {upcomingReservations[0] && (
                <span className="rounded-full bg-[#e7f2e4] px-3 py-1 text-sm font-semibold text-[#315d3b]">
                  {formatStayDate(upcomingReservations[0].startDate)}-
                  {formatStayDate(upcomingReservations[0].endDate)}
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {upcomingReservations[0] ? (
                [
                  `${upcomingReservations[0].guests} guests`,
                  `${formatMoney(upcomingReservations[0].nightlyRate)}/night`,
                  upcomingReservations[0].listing?.city ?? "StayWise",
                  upcomingReservations[0].status,
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-[#f7f3ee] p-4 text-sm font-semibold capitalize">
                    {item}
                  </div>
                ))
              ) : (
                <p className="col-span-full text-sm leading-6 text-[#5f5148]">
                  Reserve a database listing and it will appear here immediately.
                </p>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#ff385c]">AI recommendations</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Database matches for your next trip
                </h2>
              </div>
              <Link className="hidden text-sm font-semibold text-[#5f5148] hover:text-[#ff385c] md:block" href="/">
                Adjust search
              </Link>
            </div>

            {recommendations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {recommendations.map((listing) => (
                  <article key={listing.id} className="overflow-hidden rounded-[22px] border border-[#eadfd6] bg-white shadow-sm">
                    <Link href={`/listings/${listing.id}`}>
                      <div className="relative aspect-[4/3] bg-[#e8dfd6]">
                        <Image
                          src={listing.imageUrl}
                          alt={listing.imageAlt}
                          fill
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
              <EmptyState text="Seed Supabase listings to unlock recommendation cards here." />
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
        </div>
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
            <button className="rounded-full border border-[#eadfd6] bg-white px-3 py-1 text-sm font-semibold hover:border-[#ff385c] hover:text-[#df2348]">
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
    <header className="border-b border-[#eadfd6] bg-[#fffaf5]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] text-white">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-semibold">StayWise</span>
        </Link>
        {email ? (
          <form action="/auth/signout" method="post">
            <button className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-semibold">
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/auth" className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-semibold">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
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
