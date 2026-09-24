import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Home, ReceiptText, Users } from "lucide-react";
import { StayWiseHeader } from "@/components/staywise-header";
import { getCurrentUserProfile, getHostReservationById } from "@/lib/listing-data";
import { formatMoney, formatStayDate } from "@/lib/reservation-utils";
import { noIndexRobots } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Host Reservation",
  description: "Review a host-owned StayWise reservation, guest context, dates, and booking total.",
  robots: noIndexRobots,
};

export default async function HostReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getCurrentUserProfile();

  if (!user || profile?.role !== "host") {
    redirect(`/auth?mode=signin&role=host&next=${encodeURIComponent(`/host/reservations/${id}`)}`);
  }

  const reservation = await getHostReservationById(user.id, id);

  if (!reservation) {
    notFound();
  }

  const listing = reservation.listing;

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <StayWiseHeader
        actions={
          <Link
            href="/host"
            className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold hover:border-[#ff385c]"
          >
            Host workspace
          </Link>
        }
      />

      <section className="border-b border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto max-w-[1100px] px-5 py-8 lg:px-8">
          <Link
            href="/host"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#5f5148] hover:text-[#df2348]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to host workspace
          </Link>
          <p className="mt-6 text-sm font-extrabold text-[#ff385c]">Reservation details</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Host reservation</h1>
          <p className="mt-3 break-all font-mono text-xs font-semibold text-[#786a60]">{reservation.id}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-[28px] border border-[#eadfd6] bg-white shadow-sm">
            {listing ? (
              <div className="relative aspect-[16/7] bg-[#e8dfd6]">
                <Image
                  src={listing.imageUrl}
                  alt={listing.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 65vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold text-[#315d3b]">Verified guest account</p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                    {listing?.title ?? "Listing unavailable"}
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-[#5f5148]">
                    Host-owned reservation access · guest identity stays private in this view
                  </p>
                </div>
                <span className="rounded-full bg-[#e7f2e4] px-3 py-1 text-sm font-extrabold capitalize text-[#315d3b]">
                  {reservation.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <ReservationFact
                  icon={CalendarDays}
                  label="Dates"
                  value={`${formatStayDate(reservation.startDate)} - ${formatStayDate(reservation.endDate)}`}
                />
                <ReservationFact
                  icon={Users}
                  label="Guests"
                  value={`${reservation.guests} ${reservation.guests === 1 ? "guest" : "guests"}`}
                />
                <ReservationFact
                  icon={ReceiptText}
                  label="Reservation total"
                  value={formatMoney(reservation.totalAmount)}
                />
                <ReservationFact
                  icon={Home}
                  label="Nightly rate"
                  value={`${formatMoney(reservation.nightlyRate)} / night`}
                />
              </div>
            </div>
          </section>

          <aside className="self-start rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-6 shadow-sm lg:sticky lg:top-8">
            <p className="text-sm font-extrabold text-[#ff385c]">Host record</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Booking timeline</h2>
            <div className="mt-5 space-y-4">
              <TimelineItem label="Created" value={formatCreatedDate(reservation.createdAt)} />
              <TimelineItem label="Status" value={reservation.status.replace("_", " ")} />
              <TimelineItem label="Ownership" value="Verified host listing" />
            </div>
            {listing ? (
              <Link
                href={`/listings/${listing.id}`}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
              >
                Open listing
              </Link>
            ) : null}
          </aside>
        </div>

        <div className="mt-6 rounded-[22px] border border-[#eadfd6] bg-[#edf6f8] p-5 text-sm font-semibold leading-6 text-[#23515a]">
          <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
          Payment and status mutations remain disabled in the current MVP. The reservation data
          shown here is read from the host-owned booking feed.
        </div>
      </section>
    </main>
  );
}

function ReservationFact({
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
      <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">{label}</p>
      <p className="mt-1 text-sm font-extrabold capitalize">{value}</p>
    </div>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#eadfd6] pb-4 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-[#5f5148]">{label}</span>
      <span className="text-right text-sm font-extrabold capitalize">{value}</span>
    </div>
  );
}

function formatCreatedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
