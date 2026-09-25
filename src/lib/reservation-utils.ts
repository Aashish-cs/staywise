import { formatCurrency, formatCurrencyFromCents } from "@/lib/currency";
import { calculateReservationPricing } from "@/lib/pricing";

const dayInMilliseconds = 24 * 60 * 60 * 1000;

export const minimumReservationNights = 1;
export const maximumReservationNights = 30;
export const maximumReservationGuests = 16;

export type ReservationDateValidation =
  | {
      ok: true;
      nights: number;
    }
  | {
      ok: false;
      message: string;
    };

export function getTodayIso() {
  return toIsoDate(new Date());
}

export function getFutureIso(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return toIsoDate(date);
}

export function addDaysToIso(value: string, days: number) {
  const date = parseIsoDate(value) ?? new Date();
  date.setDate(date.getDate() + days);

  return toIsoDate(date);
}

export function isValidIsoDate(value: string | null | undefined): value is string {
  return Boolean(value && parseIsoDate(value));
}

export function countNights(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / dayInMilliseconds);
}

export function dateRangesOverlap(
  firstStartDate: string,
  firstEndDate: string,
  secondStartDate: string,
  secondEndDate: string,
) {
  if (
    countNights(firstStartDate, firstEndDate) <= 0 ||
    countNights(secondStartDate, secondEndDate) <= 0
  ) {
    return false;
  }

  return firstStartDate < secondEndDate && secondStartDate < firstEndDate;
}

export function validateReservationDateRange(
  startDate: string,
  endDate: string,
): ReservationDateValidation {
  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
    return {
      ok: false,
      message: "Choose valid dates to check availability.",
    };
  }

  if (startDate < getTodayIso()) {
    return {
      ok: false,
      message: "Choose a check-in date in the future.",
    };
  }

  const nights = countNights(startDate, endDate);

  if (nights < minimumReservationNights) {
    return {
      ok: false,
      message: "Check-out must be after check-in.",
    };
  }

  if (nights > maximumReservationNights) {
    return {
      ok: false,
      message: `StayWise currently supports reservations up to ${maximumReservationNights} nights.`,
    };
  }

  return {
    ok: true,
    nights,
  };
}

export function formatStayDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseIsoDate(date) ?? new Date(date));
}

export function formatMoney(amount: number) {
  return formatCurrency(amount);
}

export function formatMoneyFromCents(amountCents: number) {
  return formatCurrencyFromCents(amountCents);
}

export function calculateReservationTotal(nightlyRate: number, nights: number) {
  return calculateReservationPricing({ nightlyRate, nights });
}

function toIsoDate(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);

  return copy.toISOString().slice(0, 10);
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}
