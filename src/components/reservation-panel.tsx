"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Minus,
  Plus,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createReservationAction, type ReservationActionState } from "@/app/listings/[id]/actions";
import type { Listing } from "@/lib/listings";
import {
  addDaysToIso,
  calculateReservationTotal,
  countNights,
  formatMoney,
  getFutureIso,
  getTodayIso,
  isValidIsoDate,
} from "@/lib/reservation-utils";

const initialState: ReservationActionState = {
  ok: false,
  message: "",
};

type AvailabilityState = {
  key: string;
  message: string;
  status: "idle" | "checking" | "available" | "unavailable" | "unknown";
};

export function ReservationPanel({
  listing,
  isSignedIn,
  initialGuests,
  initialCheckIn,
  initialCheckOut,
  signInHref = "/auth?mode=signin",
}: {
  listing: Listing;
  isSignedIn: boolean;
  initialGuests: number;
  initialCheckIn?: string;
  initialCheckOut?: string;
  signInHref?: string;
}) {
  const resolvedCheckIn = resolveInitialCheckIn(initialCheckIn);
  const resolvedCheckOut = resolveInitialCheckOut(resolvedCheckIn, initialCheckOut);
  const [checkIn, setCheckIn] = useState(resolvedCheckIn);
  const [checkOut, setCheckOut] = useState(resolvedCheckOut);
  const [guests, setGuests] = useState(
    Math.min(Math.max(initialGuests, 1), listing.capacity),
  );
  const [availability, setAvailability] = useState<AvailabilityState>({
    key: "",
    message: "",
    status: "idle",
  });
  const [state, formAction, isPending] = useActionState(
    createReservationAction,
    initialState,
  );
  const nights = Math.max(0, countNights(checkIn, checkOut));
  const totals = useMemo(
    () => calculateReservationTotal(listing.pricePerNight, nights),
    [listing.pricePerNight, nights],
  );
  const shouldCheckSelectedDates =
    nights >= 1 && isValidIsoDate(checkIn) && isValidIsoDate(checkOut);
  const availabilityKey = `${listing.id}:${checkIn}:${checkOut}`;
  const displayedAvailability: AvailabilityState = shouldCheckSelectedDates
    ? availability.key === availabilityKey
      ? availability
      : {
          key: availabilityKey,
          message: "Checking availability",
          status: "checking",
        }
    : {
        key: "",
        message: "",
        status: "idle",
      };
  const reserveDisabled =
    isPending ||
    state.ok ||
    nights < 1 ||
    displayedAvailability.status === "checking" ||
    displayedAvailability.status === "unavailable";

  useEffect(() => {
    if (!shouldCheckSelectedDates) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const params = new URLSearchParams({
      checkIn,
      checkOut,
    });

    void fetch(`/api/listings/${listing.id}/availability?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | { message?: string; status?: AvailabilityState["status"] }
          | null;

        if (!isActive) {
          return;
        }

        if (!response.ok || !result?.status) {
          setAvailability({
            key: availabilityKey,
            message: "Availability will be confirmed when you reserve.",
            status: "unknown",
          });
          return;
        }

        setAvailability({
          key: availabilityKey,
          message: result.message ?? "Availability will be confirmed when you reserve.",
          status:
            result.status === "available" ||
            result.status === "unavailable" ||
            result.status === "unknown"
              ? result.status
              : "unknown",
        });
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        setAvailability({
          key: availabilityKey,
          message: "Availability will be confirmed when you reserve.",
          status: "unknown",
        });
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [availabilityKey, checkIn, checkOut, listing.id, shouldCheckSelectedDates]);

  return (
    <aside className="self-start rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-[0_18px_55px_rgba(32,26,24,0.14)] lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(listing.pricePerNight)}
            <span className="text-sm font-semibold text-[#5f5148]"> night</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-[#5f5148]">
            Reserve now, pay later in the MVP
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3f5] px-3 py-1 text-sm font-semibold text-[#bd1740]">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          {listing.rating.toFixed(2)}
        </span>
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="listingId" value={listing.id} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Check in</span>
            <span className="field-shell">
              <CalendarDays className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
              <input
                type="date"
                name="checkIn"
                min={getTodayIso()}
                value={checkIn}
                onChange={(event) => {
                  const nextCheckIn = event.target.value;
                  setCheckIn(nextCheckIn);

                  if (countNights(nextCheckIn, checkOut) < 1) {
                    setCheckOut(addDaysToIso(nextCheckIn, 1));
                  }
                }}
                className="field-input"
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="field-label">Check out</span>
            <span className="field-shell">
              <CalendarDays className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
              <input
                type="date"
                name="checkOut"
                min={addDaysToIso(checkIn, 1)}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="field-input"
                required
              />
            </span>
          </label>
        </div>

        <div>
          <span className="field-label">Guests</span>
          <div className="field-shell justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Users className="h-4 w-4 shrink-0 text-[#786a60]" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-extrabold">{guests} guests</span>
                <span className="block text-xs font-semibold text-[#786a60]">
                  {listing.capacity} max
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease guests"
                disabled={guests <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cbc1] text-[#201a18] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setGuests((current) => Math.max(1, current - 1))}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Increase guests"
                disabled={guests >= listing.capacity}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cbc1] text-[#201a18] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() =>
                  setGuests((current) => Math.min(listing.capacity, current + 1))
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <input type="hidden" name="guests" value={guests} />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-[#f7f3ee] p-4 text-sm">
          <PriceRow
            label={`${formatMoney(listing.pricePerNight)} x ${nights || 0} nights`}
            value={formatMoney(totals.stayTotal)}
          />
          <PriceRow label="StayWise service estimate" value={formatMoney(totals.serviceFee)} />
          <div className="border-t border-[#eadfd6] pt-3">
            <PriceRow label="Total" value={formatMoney(totals.total)} strong />
          </div>
        </div>

        {displayedAvailability.status !== "idle" && (
          <p
            className={`rounded-2xl p-3 text-sm font-semibold ${
              displayedAvailability.status === "available"
                ? "bg-[#e7f2e4] text-[#315d3b]"
                : displayedAvailability.status === "unavailable"
                  ? "bg-[#fff3f5] text-[#bd1740]"
                  : "bg-[#edf6f8] text-[#23515a]"
            }`}
          >
            {displayedAvailability.status === "available" ? (
              <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
            ) : (
              <ShieldAlert className="mr-2 inline h-4 w-4" aria-hidden="true" />
            )}
            {displayedAvailability.message}
          </p>
        )}

        {state.message && (
          <p
            className={`rounded-2xl p-3 text-sm font-semibold ${
              state.ok
                ? "bg-[#e7f2e4] text-[#315d3b]"
                : "bg-[#fff3f5] text-[#bd1740]"
            }`}
          >
            {state.ok && <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />}
            {state.message}
          </p>
        )}

        {isSignedIn ? (
          <button
            type="submit"
            disabled={reserveDisabled}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df2348] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.ok ? "Reserved" : isPending ? "Reserving" : "Reserve this stay"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <Link
            href={signInHref}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df2348]"
          >
            Sign in to reserve
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}

        <div className="space-y-3 rounded-2xl border border-[#eadfd6] bg-white p-4 text-sm">
          <TrustLine
            icon={ShieldCheck}
            text="Verified account required before booking."
          />
          <TrustLine
            icon={CalendarDays}
            text="Dates are checked against existing reservations."
          />
          <TrustLine
            icon={ReceiptText}
            text="Server calculates the final reservation total."
          />
        </div>

        {state.ok && (
          <Link
            href="/dashboard"
            className="flex h-11 w-full items-center justify-center rounded-full border border-[#eadfd6] text-sm font-semibold hover:border-[#ff385c] hover:text-[#df2348]"
          >
            View my trips
          </Link>
        )}
      </form>
    </aside>
  );
}

function TrustLine({
  icon: Icon,
  text,
}: {
  icon: typeof ShieldCheck;
  text: string;
}) {
  return (
    <p className="flex gap-3 font-semibold leading-6 text-[#5f5148]">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#315d3b]" aria-hidden="true" />
      {text}
    </p>
  );
}

function resolveInitialCheckIn(value: string | undefined) {
  return isValidIsoDate(value) ? value : getFutureIso(7);
}

function resolveInitialCheckOut(checkIn: string, value: string | undefined) {
  if (isValidIsoDate(value) && countNights(checkIn, value) > 0) {
    return value;
  }

  const fallback = getFutureIso(10);

  return countNights(checkIn, fallback) > 0 ? fallback : addDaysToIso(checkIn, 3);
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
      <span className={strong ? "font-semibold" : "text-[#5f5148]"}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
