import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Hotel,
  LockKeyhole,
  Mail,
  MapPin,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import {
  StayWiseAccountMenu,
  StayWiseHeader,
  StayWisePrimaryNav,
} from "@/components/staywise-header";
import { Surface } from "@/components/ui/primitives";
import { getCurrentUserProfile } from "@/lib/listing-data";
import {
  addDaysToIso,
  calculateReservationTotal,
  countNights,
  formatMoney,
  formatMoneyFromCents,
  formatStayDate,
  getFutureIso,
  isValidIsoDate,
} from "@/lib/reservation-utils";
import { firstParam, type RawSearchParams } from "@/lib/search-url";
import { noIndexRobots } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stay Reservation",
  description:
    "Review a hotel or guest stay discovered by StayWise and complete a test-mode reservation checkout.",
  robots: noIndexRobots,
};

type ExternalStayPageProps = {
  searchParams: Promise<RawSearchParams>;
};

type ExternalStay = {
  actionUrl: string | null;
  address: string | null;
  checkIn: string;
  checkOut: string;
  description: string | null;
  destination: string;
  guests: number;
  id: string;
  imageUrl: string;
  kind: string;
  lat: string | null;
  lng: string | null;
  mapUrl: string | null;
  name: string;
  providerPrice: string | null;
  source: "amadeus" | "openstreetmap";
  typeLabel: string;
};

const fallbackImageUrl =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";
const externalStayQueryKeys = new Set([
  "actionUrl",
  "address",
  "checkIn",
  "checkOut",
  "description",
  "destination",
  "guests",
  "id",
  "imageUrl",
  "kind",
  "lat",
  "lng",
  "mapUrl",
  "name",
  "providerPrice",
  "source",
  "typeLabel",
]);

export default async function ExternalStayPage({
  searchParams,
}: ExternalStayPageProps) {
  const query = await searchParams;
  const stay = parseExternalStay(query);

  if (!stay) {
    redirect("/search");
  }

  const { user, profile } = await getCurrentUserProfile();
  const isSignedIn = Boolean(user);
  const accountRole =
    profile?.role === "host" ? "host" : profile?.role === "guest" ? "guest" : null;
  const accountHref = isSignedIn
    ? accountRole === "host"
      ? "/host"
      : "/dashboard"
    : "/auth?mode=signin";
  const accountLabel = isSignedIn
    ? accountRole === "host"
      ? "Host"
      : "Trips"
    : "Sign in";
  const currentPath = buildExternalStayPath(query, false);
  const reservedFields = buildExternalStayFields(query, true);
  const signInHref = `/auth?mode=signin&next=${encodeURIComponent(currentPath)}`;
  const isReserved = firstParam(query.reserved) === "true" && isSignedIn;
  const nights = Math.max(1, countNights(stay.checkIn, stay.checkOut));
  const nightlyRate = estimateNightlyRate(stay);
  const totals = calculateReservationTotal(nightlyRate, nights);

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <StayWiseHeader
        brandClassName="shrink-0"
        nav={
          <StayWisePrimaryNav
            activeTab="homes"
            homesHref="/search?propertyTypes=House&propertyTypes=Townhome&propertyTypes=Villa"
          />
        }
        actions={
          <>
            <Link
              className="hidden whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] md:block"
              href="/host"
            >
              Become a host
            </Link>
            <StayWiseAccountMenu
              accountHref={accountHref}
              accountLabel={accountLabel}
              accountLinkClassName="font-extrabold"
              accountLinkVisibilityClassName="hidden md:block"
              isSignedIn={isSignedIn}
            />
          </>
        }
      />

      <section className="border-b border-[#eadfd6] bg-[#fbfaf8]">
        <div className="mx-auto max-w-[1536px] px-5 py-6 lg:px-8">
          <Link
            href={stay.destination ? `/search?destination=${encodeURIComponent(stay.destination)}` : "/search"}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#5f5148] hover:text-[#df2348]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to search
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div>
              <p className="text-sm font-extrabold text-[#ff385c]">
                Secure checkout
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                Reserve {stay.name}
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#5f5148]">
                Review your trip, enter payment details, and send a StayWise
                reservation request. Payment is test mode right now, so no real
                card is charged.
              </p>
            </div>

            <ReservationCard
              currentPath={currentPath}
              isReserved={isReserved}
              isSignedIn={isSignedIn}
              guestEmail={user?.email ?? ""}
              nights={nights}
              reservedFields={reservedFields}
              signInHref={signInHref}
              stay={stay}
              totals={totals}
              nightlyRate={nightlyRate}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1536px] gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="space-y-8">
          <Surface className="overflow-hidden p-0">
            <div className="grid md:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[320px] bg-[#e8dfd6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stay.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8">
                <p className="text-sm font-extrabold text-[#ff385c]">
                  {stay.typeLabel}
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                  {stay.name}
                </h2>
                {stay.address && (
                  <p className="mt-3 flex gap-2 text-sm font-extrabold leading-6 text-[#5f5148]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ff385c]" aria-hidden="true" />
                    {stay.address}
                  </p>
                )}
                {stay.description && (
                  <p className="mt-4 text-sm font-semibold leading-6 text-[#5f5148]">
                    {stay.description}
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <FactCard
                    icon={CalendarDays}
                    label="Dates"
                    value={`${formatStayDate(stay.checkIn)} to ${formatStayDate(stay.checkOut)}`}
                  />
                  <FactCard
                    icon={Users}
                    label="Guests"
                    value={`${stay.guests} ${stay.guests === 1 ? "guest" : "guests"}`}
                  />
                  <FactCard
                    icon={Hotel}
                    label="Stay type"
                    value={stay.typeLabel}
                  />
                  <FactCard
                    icon={ReceiptText}
                    label="Estimate"
                    value={formatMoneyFromCents(totals.totalCents)}
                  />
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="p-6">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Good to know
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5f5148]">
              StayWise found this place from live hotel and map data. Final room
              inventory can still vary by hotel source, and this checkout is
              currently running in test mode with no real payment capture.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {stay.mapUrl && (
                <a
                  href={stay.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-4 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348]"
                >
                  Open map
                </a>
              )}
              {stay.actionUrl && (
                <a
                  href={stay.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#201a18] px-4 text-sm font-extrabold text-white hover:bg-black"
                >
                  View source
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </Surface>
        </div>

        <Surface className="self-start p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-extrabold tracking-tight">Booking confidence</h2>
          <div className="mt-5 space-y-4 text-sm font-semibold leading-6 text-[#5f5148]">
            <TrustLine
              icon={ShieldCheck}
              text="Live source links stay visible so guests can verify the place."
            />
            <TrustLine
              icon={Hotel}
              text="Reserve creates a booking request first; it does not automatically book the hotel."
            />
            <TrustLine
              icon={CreditCard}
              text="Payment fields are test mode only right now, so no real card is charged."
            />
          </div>
        </Surface>
      </section>
    </main>
  );
}

function ReservationCard({
  currentPath,
  guestEmail,
  isReserved,
  isSignedIn,
  nights,
  nightlyRate,
  reservedFields,
  signInHref,
  stay,
  totals,
}: {
  currentPath: string;
  guestEmail: string;
  isReserved: boolean;
  isSignedIn: boolean;
  nights: number;
  nightlyRate: number;
  reservedFields: Array<[string, string]>;
  signInHref: string;
  stay: ExternalStay;
  totals: ReturnType<typeof calculateReservationTotal>;
}) {
  return (
    <aside className="rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-[0_18px_55px_rgba(32,26,24,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(nightlyRate)}
            <span className="text-sm font-semibold text-[#5f5148]"> night</span>
          </p>
          {stay.providerPrice && (
            <p className="mt-1 text-xs font-semibold text-[#786a60]">
              Source rate shown: {stay.providerPrice}
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3f5] px-3 py-1 text-sm font-semibold text-[#bd1740]">
          <Hotel className="h-4 w-4" aria-hidden="true" />
          {stay.typeLabel}
        </span>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-[#f7f3ee] p-4 text-sm">
        <PriceRow
          label={`${formatMoney(nightlyRate)} x ${nights} nights`}
          value={formatMoneyFromCents(totals.stayTotalCents)}
        />
        <PriceRow
          label="Cleaning fee"
          value={formatMoneyFromCents(totals.cleaningFeeCents)}
        />
        <PriceRow
          label="StayWise service fee"
          value={formatMoneyFromCents(totals.serviceFeeCents)}
        />
        <PriceRow
          label="Estimated taxes"
          value={formatMoneyFromCents(totals.taxCents)}
        />
        <div className="border-t border-[#eadfd6] pt-3">
          <PriceRow
            label="Total"
            value={formatMoneyFromCents(totals.totalCents)}
            strong
          />
        </div>
      </div>

      {isReserved ? (
        <div className="mt-5 rounded-2xl bg-[#e7f2e4] p-4 text-sm font-semibold leading-6 text-[#315d3b]">
          <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
          Reservation request received. Payment details were accepted in test
          mode, and no real card was charged.
        </div>
      ) : isSignedIn ? (
        <form action="/external-stays" method="get" className="mt-5 space-y-4">
          {reservedFields.map(([name, value], index) => (
            <input
              key={`${name}-${index}`}
              type="hidden"
              name={name}
              value={value}
            />
          ))}

          <div className="rounded-2xl border border-[#eadfd6] p-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[#ff385c]" aria-hidden="true" />
              <h3 className="text-sm font-extrabold">Guest details</h3>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                  Full name
                </span>
                <input
                  required
                  autoComplete="name"
                  placeholder="Name on reservation"
                  className="mt-2 h-11 w-full rounded-xl border border-[#eadfd6] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#ff385c] focus:ring-2 focus:ring-[#ffe1e7]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                  Email
                </span>
                <span className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-[#eadfd6] bg-white px-3 transition focus-within:border-[#ff385c] focus-within:ring-2 focus-within:ring-[#ffe1e7]">
                  <Mail className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    defaultValue={guestEmail}
                    placeholder="you@example.com"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                  />
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eadfd6] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#ff385c]" aria-hidden="true" />
                <h3 className="text-sm font-extrabold">Payment method</h3>
              </div>
              <span className="rounded-full bg-[#e7f2e4] px-2.5 py-1 text-xs font-extrabold text-[#315d3b]">
                Test mode
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                  Card number
                </span>
                <span className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-[#eadfd6] bg-white px-3 transition focus-within:border-[#ff385c] focus-within:ring-2 focus-within:ring-[#ffe1e7]">
                  <CreditCard className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                  />
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                    Expiration
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    className="mt-2 h-11 w-full rounded-xl border border-[#eadfd6] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#ff385c] focus:ring-2 focus:ring-[#ffe1e7]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                    CVC
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    className="mt-2 h-11 w-full rounded-xl border border-[#eadfd6] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#ff385c] focus:ring-2 focus:ring-[#ffe1e7]"
                  />
                </label>
              </div>
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                    Country/region
                  </span>
                  <select
                    required
                    autoComplete="billing country"
                    defaultValue="US"
                    className="mt-2 h-11 w-full rounded-xl border border-[#eadfd6] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#ff385c] focus:ring-2 focus:ring-[#ffe1e7]"
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="FR">France</option>
                    <option value="CY">Cyprus</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
                    ZIP
                  </span>
                  <input
                    required
                    inputMode="text"
                    autoComplete="postal-code"
                    placeholder="75201"
                    className="mt-2 h-11 w-full rounded-xl border border-[#eadfd6] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#ff385c] focus:ring-2 focus:ring-[#ffe1e7]"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-extrabold text-white shadow-sm hover:bg-[#df2348]"
          >
            Reserve now
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="text-center text-xs font-semibold leading-5 text-[#786a60]">
            Test checkout only. Card details are not stored, and no real payment
            is made.
          </p>
        </form>
      ) : (
        <Link
          href={signInHref}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-extrabold text-white shadow-sm hover:bg-[#df2348]"
        >
          Sign in to reserve
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      {!isReserved && (
        <Link
          href={currentPath}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-[#eadfd6] bg-white px-4 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348]"
        >
          Review details
        </Link>
      )}
    </aside>
  );
}

function FactCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f3ee] p-4">
      <Icon className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
      <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold">{value}</p>
    </div>
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
    <p className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#315d3b]" aria-hidden="true" />
      {text}
    </p>
  );
}

function PriceRow({
  label,
  strong,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold" : "text-[#5f5148]"}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function parseExternalStay(query: RawSearchParams): ExternalStay | null {
  const name = firstParam(query.name)?.trim();

  if (!name) {
    return null;
  }

  const checkIn = resolveCheckIn(firstParam(query.checkIn));
  const checkOut = resolveCheckOut(checkIn, firstParam(query.checkOut));
  const guests = clampInteger(firstParam(query.guests), 1, 16, 2);
  const source = firstParam(query.source) === "amadeus" ? "amadeus" : "openstreetmap";
  const imageUrl = sanitizeExternalUrl(firstParam(query.imageUrl)) ?? fallbackImageUrl;

  return {
    actionUrl: sanitizeExternalUrl(firstParam(query.actionUrl)),
    address: optionalText(firstParam(query.address)),
    checkIn,
    checkOut,
    description: optionalText(firstParam(query.description)),
    destination: optionalText(firstParam(query.destination)) ?? "",
    guests,
    id: optionalText(firstParam(query.id)) ?? "external-stay",
    imageUrl,
    kind: optionalText(firstParam(query.kind)) ?? "hotel",
    lat: optionalCoordinate(firstParam(query.lat)),
    lng: optionalCoordinate(firstParam(query.lng)),
    mapUrl: sanitizeExternalUrl(firstParam(query.mapUrl)),
    name,
    providerPrice: optionalText(firstParam(query.providerPrice)),
    source,
    typeLabel: optionalText(firstParam(query.typeLabel)) ?? "Hotel",
  };
}

function buildExternalStayPath(query: RawSearchParams, reserved: boolean) {
  const params = new URLSearchParams(buildExternalStayFields(query, reserved));

  return `/external-stays?${params.toString()}`;
}

function buildExternalStayFields(query: RawSearchParams, reserved: boolean) {
  const fields: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(query)) {
    if (key === "reserved" || !externalStayQueryKeys.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        fields.push([key, item]);
      }
      continue;
    }

    if (value) {
      fields.push([key, value]);
    }
  }

  if (reserved) {
    fields.push(["reserved", "true"]);
  }

  return fields;
}

function resolveCheckIn(value: string | undefined) {
  return isValidIsoDate(value) ? value : getFutureIso(7);
}

function resolveCheckOut(checkIn: string, value: string | undefined) {
  return isValidIsoDate(value) && countNights(checkIn, value) > 0
    ? value
    : addDaysToIso(checkIn, 3);
}

function estimateNightlyRate(stay: ExternalStay) {
  const seed = hashString(`${stay.id}:${stay.name}:${stay.destination}`);

  return 145 + (Math.abs(seed) % 180);
}

function sanitizeExternalUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function optionalCoordinate(value: string | undefined) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? String(numeric) : null;
}

function clampInteger(
  value: string | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  const numeric = Number(value);

  if (!Number.isInteger(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
