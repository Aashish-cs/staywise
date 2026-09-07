"use client";

import { useMemo, useState, useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { createReservationAction, type ReservationActionState } from "@/app/listings/[id]/actions";
import type { Listing } from "@/lib/listings";
import {
  calculateReservationTotal,
  countNights,
  formatMoney,
  getFutureIso,
} from "@/lib/reservation-utils";

const initialState: ReservationActionState = {
  ok: false,
  message: "",
};

export function ReservationPanel({
  listing,
  isSignedIn,
  initialGuests,
}: {
  listing: Listing;
  isSignedIn: boolean;
  initialGuests: number;
}) {
  const [checkIn, setCheckIn] = useState(getFutureIso(7));
  const [checkOut, setCheckOut] = useState(getFutureIso(10));
  const [guests, setGuests] = useState(
    Math.min(Math.max(initialGuests, 1), listing.capacity),
  );
  const [state, formAction, isPending] = useActionState(
    createReservationAction,
    initialState,
  );
  const nights = Math.max(0, countNights(checkIn, checkOut));
  const totals = useMemo(
    () => calculateReservationTotal(listing.pricePerNight, nights),
    [listing.pricePerNight, nights],
  );

  return (
    <aside className="self-start rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(listing.pricePerNight)}
            <span className="text-sm font-semibold text-[#5f5148]"> night</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-[#5f5148]">
            No payment collected in senior project MVP
          </p>
        </div>
        <span className="rounded-full bg-[#fff3f5] px-3 py-1 text-sm font-semibold text-[#bd1740]">
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
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
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
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="field-input"
                required
              />
            </span>
          </label>
        </div>

        <label className="block">
          <span className="field-label">Guests</span>
          <span className="field-shell">
            <Users className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
            <input
              type="number"
              name="guests"
              min="1"
              max={listing.capacity}
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
              className="field-input"
              required
            />
          </span>
        </label>

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
            disabled={isPending || nights < 1}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df2348] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Reserving" : "Reserve this stay"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <Link
            href="/auth"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df2348]"
          >
            Sign in to reserve
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}

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
