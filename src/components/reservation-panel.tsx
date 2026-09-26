"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { createReservationAction, type ReservationActionState } from "@/app/listings/[id]/actions";
import { DateRangePicker } from "@/components/date-range-picker";
import { GuestSelector, type GuestSelection } from "@/components/guest-selector";
import { useToastOnActionState } from "@/components/ui/toast";
import type { Listing } from "@/lib/listings";
import {
  addDaysToIso,
  calculateReservationTotal,
  countNights,
  formatMoney,
  formatMoneyFromCents,
  getFutureIso,
  isValidIsoDate,
  maximumReservationNights,
  validateReservationDateRange,
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

type CalendarAvailabilityState = {
  dates: string[];
  key: string;
  status: "idle" | "loading" | "ready" | "error";
};

type CalendarRange = {
  endDate: string;
  startDate: string;
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
  const [guestSelection, setGuestSelection] = useState<GuestSelection>(() => ({
    adults: Math.min(Math.max(initialGuests, 1), listing.capacity),
    childGuests: 0,
    infants: 0,
    pets: 0,
  }));
  const [availability, setAvailability] = useState<AvailabilityState>({
    key: "",
    message: "",
    status: "idle",
  });
  const [calendarRange, setCalendarRange] = useState<CalendarRange | null>(null);
  const [calendarAvailability, setCalendarAvailability] =
    useState<CalendarAvailabilityState>({
      dates: [],
      key: "",
      status: "idle",
    });
  const [state, formAction, isPending] = useActionState(
    createReservationAction,
    initialState,
  );
  const dateValidation = useMemo(
    () => validateReservationDateRange(checkIn, checkOut),
    [checkIn, checkOut],
  );
  const nights = dateValidation.ok
    ? dateValidation.nights
    : Math.max(0, countNights(checkIn, checkOut));
  const pricedNights = dateValidation.ok ? dateValidation.nights : 0;
  const totals = useMemo(
    () => calculateReservationTotal(listing.pricePerNight, pricedNights),
    [listing.pricePerNight, pricedNights],
  );
  const guests = guestSelection.adults + guestSelection.childGuests;
  const shouldCheckSelectedDates = dateValidation.ok;
  const availabilityKey = `${listing.id}:${checkIn}:${checkOut}`;
  const calendarAvailabilityKey = calendarRange
    ? `${listing.id}:${calendarRange.startDate}:${calendarRange.endDate}`
    : "";
  const calendarUnavailableDates =
    calendarAvailability.key === calendarAvailabilityKey
      ? calendarAvailability.dates
      : [];
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
    !dateValidation.ok ||
    displayedAvailability.status === "checking" ||
    displayedAvailability.status === "unavailable";
  const reserveButtonLabel = state.ok
    ? "Reserved"
    : isPending
      ? "Reserving"
      : !dateValidation.ok
        ? "Choose valid dates"
        : displayedAvailability.status === "checking"
          ? "Checking dates"
          : displayedAvailability.status === "unavailable"
            ? "Choose different dates"
            : "Reserve this stay";

  useToastOnActionState(state, {
    errorTitle: "Reservation not completed",
    successTitle: "Reservation confirmed",
  });

  const handleVisibleCalendarRangeChange = useCallback(
    (startDate: string, endDate: string) => {
      const key = `${listing.id}:${startDate}:${endDate}`;

      setCalendarRange((currentRange) =>
        currentRange?.startDate === startDate && currentRange.endDate === endDate
          ? currentRange
          : { endDate, startDate },
      );
      setCalendarAvailability((current) =>
        current.key === key && current.status === "ready"
          ? current
          : {
              dates: current.key === key ? current.dates : [],
              key,
              status: "loading",
            },
      );
    },
    [listing.id],
  );

  useEffect(() => {
    if (!calendarRange) {
      return;
    }

    const key = `${listing.id}:${calendarRange.startDate}:${calendarRange.endDate}`;
    const controller = new AbortController();

    const params = new URLSearchParams({
      end: calendarRange.endDate,
      start: calendarRange.startDate,
    });

    void fetch(`/api/listings/${listing.id}/calendar?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | { unavailableDates?: string[] }
          | null;

        if (!response.ok || !Array.isArray(result?.unavailableDates)) {
          setCalendarAvailability({
            dates: [],
            key,
            status: "error",
          });
          return;
        }

        setCalendarAvailability({
          dates: result.unavailableDates,
          key,
          status: "ready",
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCalendarAvailability({
          dates: [],
          key,
          status: "error",
        });
      });

    return () => {
      controller.abort();
    };
  }, [calendarRange, listing.id]);

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
          Live
        </span>
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="listingId" value={listing.id} />

        <DateRangePicker
          availabilityStatus={calendarAvailability.status}
          checkIn={checkIn}
          checkOut={checkOut}
          maxNights={maximumReservationNights}
          onVisibleRangeChange={handleVisibleCalendarRangeChange}
          unavailableDates={calendarUnavailableDates}
          onChange={(nextCheckIn, nextCheckOut) => {
            setCheckIn(nextCheckIn);
            setCheckOut(nextCheckOut || addDaysToIso(nextCheckIn, 1));
          }}
        />
        <input type="hidden" name="checkIn" value={checkIn} required />
        <input type="hidden" name="checkOut" value={checkOut} required />

        <GuestSelector
          adults={guestSelection.adults}
          childGuests={guestSelection.childGuests}
          infants={guestSelection.infants}
          pets={guestSelection.pets}
          maxGuests={listing.capacity}
          onChange={setGuestSelection}
        />
        <input type="hidden" name="guests" value={guests} />

        <div className="space-y-3 rounded-2xl bg-[#f7f3ee] p-4 text-sm">
          <PriceRow
            label={
              dateValidation.ok
                ? `${formatMoney(listing.pricePerNight)} x ${nights} nights`
                : "Valid dates required"
            }
            value={dateValidation.ok ? formatMoneyFromCents(totals.stayTotalCents) : "Not priced"}
          />
          <PriceRow
            label="Cleaning fee"
            value={dateValidation.ok ? formatMoneyFromCents(totals.cleaningFeeCents) : "Not priced"}
          />
          <PriceRow
            label="StayWise service fee"
            value={dateValidation.ok ? formatMoneyFromCents(totals.serviceFeeCents) : "Not priced"}
          />
          <PriceRow
            label="Estimated taxes"
            value={dateValidation.ok ? formatMoneyFromCents(totals.taxCents) : "Not priced"}
          />
          <div className="border-t border-[#eadfd6] pt-3">
            <PriceRow
              label="Total"
              value={dateValidation.ok ? formatMoneyFromCents(totals.totalCents) : "Not priced"}
              strong
            />
          </div>
        </div>

        {!dateValidation.ok && (
          <p
            role="alert"
            className="rounded-2xl bg-[#fff3f5] p-3 text-sm font-semibold text-[#bd1740]"
          >
            <ShieldAlert className="mr-2 inline h-4 w-4" aria-hidden="true" />
            {dateValidation.message}
          </p>
        )}

        {displayedAvailability.status !== "idle" && (
          <p
            role={displayedAvailability.status === "unavailable" ? "alert" : "status"}
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
            role={state.ok ? "status" : "alert"}
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
            {reserveButtonLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : reserveDisabled ? (
          <button
            type="button"
            disabled
            className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white opacity-60 shadow-sm"
          >
            {reserveButtonLabel}
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
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
            text={`Dates are checked against existing reservations. Maximum stay is ${maximumReservationNights} nights.`}
          />
          <TrustLine
            icon={ReceiptText}
            text="Server calculates the final reservation total."
          />
        </div>

        {state.ok && (
          <div className="space-y-3 rounded-2xl border border-[#eadfd6] bg-[#fbfaf8] p-4">
            {state.reservationId && (
              <p className="text-xs font-semibold leading-5 text-[#5f5148]">
                Reservation ID{" "}
                <span className="break-all font-mono text-[#201a18]">
                  {state.reservationId}
                </span>
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {state.reservationId && (
                <Link
                  href={`/reservations/${state.reservationId}`}
                  className="flex h-11 items-center justify-center rounded-full bg-[#201a18] px-4 text-sm font-semibold text-white hover:bg-black"
                >
                  View confirmation
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex h-11 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-4 text-sm font-semibold hover:border-[#ff385c] hover:text-[#df2348]"
              >
                View my trips
              </Link>
            </div>
          </div>
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
