const dayInMilliseconds = 24 * 60 * 60 * 1000;

export function getTodayIso() {
  return toIsoDate(new Date());
}

export function getFutureIso(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return toIsoDate(date);
}

export function countNights(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / dayInMilliseconds);
}

export function formatStayDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseIsoDate(date) ?? new Date(date));
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateReservationTotal(nightlyRate: number, nights: number) {
  const stayTotal = nightlyRate * nights;
  const serviceFee = Math.round(stayTotal * 0.12);

  return {
    stayTotal,
    serviceFee,
    total: stayTotal + serviceFee,
  };
}

function toIsoDate(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);

  return copy.toISOString().slice(0, 10);
}

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}
