import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Home,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { StayWiseHeader } from "@/components/staywise-header";
import { getCurrentUserProfile, getReservationById } from "@/lib/listing-data";
import type { ReservationStatus } from "@/lib/listings";
import {
  calculateReservationTotal,
  countNights,
  formatMoney,
  formatStayDate,
} from "@/lib/reservation-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservation Confirmation",
  description:
    "Review your StayWise reservation details, dates, guests, status, and trusted booking total.",
};

const reservationIdSchema = z.string().uuid();

type ReservationConfirmationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservationConfirmationPage({
  params,
}: ReservationConfirmationPageProps) {
  const { id } = await params;

  if (!reservationIdSchema.safeParse(id).success) {
    notFound();
  }

  const { user } = await getCurrentUserProfile();
  const path = `/reservations/${id}`;

  if (!user) {
    redirect(`/auth?mode=signin&next=${encodeURIComponent(path)}`);
  }

  const reservation = await getReservationById(id);

  if (!reservation) {
    notFound();
  }

  const listing = reservation.listing;
  const status = getStatusPresentation(reservation.status);
  const nights = Math.max(0, countNights(reservation.startDate, reservation.endDate));
  const totals = calculateReservationTotal(reservation.nightlyRate, nights);
  const StatusIcon = status.icon;

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <ConfirmationHeader />

      <section className="border-b border-[#eadfd6] bg-[#fbfaf8]">
        <div className="mx-auto max-w-[1536px] px-5 py-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#5f5148] hover:text-[#df2348]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to trips
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div>
              <p className="text-sm font-extrabold text-[#ff385c]">
                Reservation confirmation
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                {status.heading}
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#5f5148]">
                {status.body}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {listing && (
                  <Link
                    href={`/listings/${listing.id}?checkIn=${reservation.startDate}&checkOut=${reservation.endDate}&guests=${reservation.guests}`}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
                  >
                    View stay
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold hover:border-[#ff385c]"
                >
                  My trips
                </Link>
                <Link
                  href="/search"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold hover:border-[#ff385c]"
                >
                  Find another stay
                </Link>
              </div>
            </div>

            <aside className="rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                    Status
                  </p>
                  <p className="mt-1 text-2xl font-extrabold capitalize">
                    {reservation.status.replace("_", " ")}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-extrabold ${status.badgeClassName}`}
                >
                  <StatusIcon className="h-4 w-4" aria-hidden="true" />
                  {status.label}
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-[#f7f3ee] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                  Reservation ID
                </p>
                <p className="mt-2 break-all font-mono text-sm font-semibold text-[#201a18]">
                  {reservation.id}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1536px] gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-[28px] border border-[#eadfd6] bg-white shadow-sm">
            <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-[280px] bg-[#e8dfd6]">
                {listing ? (
                  <Image
                    src={listing.imageUrl}
                    alt={listing.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#201a18] text-white">
                    <Sparkles className="h-12 w-12" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8">
                <p className="text-sm font-extrabold text-[#ff385c]">Stay</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                  {listing?.title ?? "Listing unavailable"}
                </h2>
                <p className="mt-3 flex items-center gap-2 text-sm font-extrabold text-[#5f5148]">
                  <MapPin className="h-4 w-4 text-[#ff385c]" aria-hidden="true" />
                  {listing
                    ? `${listing.neighborhood}, ${listing.city}, ${listing.state}`
                    : "StayWise reservation"}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <ConfirmationFact
                    icon={CalendarDays}
                    label="Dates"
                    value={`${formatStayDate(reservation.startDate)} to ${formatStayDate(
                      reservation.endDate,
                    )}`}
                  />
                  <ConfirmationFact
                    icon={Users}
                    label="Guests"
                    value={`${reservation.guests} guests`}
                  />
                  <ConfirmationFact
                    icon={Home}
                    label="Nights"
                    value={`${nights} ${nights === 1 ? "night" : "nights"}`}
                  />
                  <ConfirmationFact
                    icon={ReceiptText}
                    label="Total"
                    value={formatMoney(reservation.totalAmount)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#ff385c]">What is protected</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                  Trusted reservation checks
                </h2>
              </div>
              <span className="rounded-full bg-[#e7f2e4] px-3 py-1 text-sm font-extrabold text-[#315d3b]">
                Server verified
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <TrustItem text="Dates are checked against confirmed reservations and host blocks." />
              <TrustItem text="The final total uses the server-side nightly price." />
              <TrustItem text="Only authorized accounts can view this reservation." />
            </div>
          </section>
        </div>

        <aside className="self-start rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-[0_18px_55px_rgba(32,26,24,0.12)] lg:sticky lg:top-24">
          <h2 className="text-2xl font-extrabold tracking-tight">Price details</h2>
          <div className="mt-5 space-y-3 text-sm">
            <PriceRow
              label={`${formatMoney(reservation.nightlyRate)} x ${nights} ${
                nights === 1 ? "night" : "nights"
              }`}
              value={formatMoney(totals.stayTotal)}
            />
            <PriceRow
              label="Cleaning fee"
              value={formatMoney(totals.cleaningFee)}
            />
            <PriceRow
              label="StayWise service fee"
              value={formatMoney(totals.serviceFee)}
            />
            <PriceRow
              label="Estimated taxes"
              value={formatMoney(totals.tax)}
            />
            <div className="border-t border-[#eadfd6] pt-3">
              <PriceRow label="Total" value={formatMoney(reservation.totalAmount)} strong />
            </div>
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-[#eadfd6] bg-[#fbfaf8] p-4 text-sm font-semibold text-[#5f5148]">
            <p className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#315d3b]" />
              No card is charged in the MVP.
            </p>
            <p className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#315d3b]" />
              Your dashboard keeps the live trip status.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ConfirmationHeader() {
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
            href="/dashboard"
            className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold shadow-sm hover:border-[#ff385c]"
          >
            My trips
          </Link>
        </>
      }
    />
  );
}

function ConfirmationFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#eadfd6] bg-[#fbfaf8] p-4">
      <Icon className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
      <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-[#201a18]">{value}</p>
    </div>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] bg-white p-4 text-sm font-semibold leading-6 text-[#5f5148]">
      <CheckCircle2 className="mb-3 h-5 w-5 text-[#315d3b]" aria-hidden="true" />
      {text}
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-extrabold" : "text-[#5f5148]"}>{label}</span>
      <span className={strong ? "font-extrabold" : "font-semibold"}>{value}</span>
    </div>
  );
}

function getStatusPresentation(status: ReservationStatus) {
  if (status === "confirmed") {
    return {
      badgeClassName: "bg-[#e7f2e4] text-[#315d3b]",
      body: "Your stay is confirmed and saved in your trip dashboard. Keep this page for the reservation ID and booking summary.",
      heading: "Your StayWise reservation is confirmed.",
      icon: CheckCircle2,
      label: "Confirmed",
    };
  }

  if (status === "cancelled") {
    return {
      badgeClassName: "bg-[#fff3f5] text-[#bd1740]",
      body: "This reservation was cancelled. The trip remains in your dashboard history for tracking.",
      heading: "This reservation is cancelled.",
      icon: ShieldCheck,
      label: "Cancelled",
    };
  }

  if (status === "completed") {
    return {
      badgeClassName: "bg-[#edf6f8] text-[#23515a]",
      body: "This stay is complete. Reviews will be enabled in a later StayWise phase for eligible reservations.",
      heading: "This StayWise trip is complete.",
      icon: CheckCircle2,
      label: "Completed",
    };
  }

  return {
    badgeClassName: "bg-[#fff7e6] text-[#7a4a00]",
    body: "StayWise is tracking this reservation while its status is being finalized.",
    heading: "Your reservation is being prepared.",
    icon: ShieldCheck,
    label: status.replace("_", " "),
  };
}
