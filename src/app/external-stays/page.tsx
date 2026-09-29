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
  MapPin,
  ReceiptText,
  ShieldCheck,
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
  title: "External Stay Reservation",
  description:
    "Review an external hotel or guest stay discovered by StayWise before continuing the demo booking handoff.",
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
  const reservedPath = buildExternalStayPath(query, true);
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
                External stay handoff
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                Reserve {stay.name}
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#5f5148]">
                This stay was discovered from live place data. StayWise keeps the
                source links visible and gives you a demo reservation path for the
                senior project booking flow.
              </p>
            </div>

            <ReservationCard
              currentPath={currentPath}
              isReserved={isReserved}
              isSignedIn={isSignedIn}
              nights={nights}
              reservedPath={reservedPath}
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
                    label="Source"
                    value={stay.source === "amadeus" ? "Amadeus hotel data" : "OpenStreetMap place data"}
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
              Source and availability
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5f5148]">
              External stay data can confirm that a place exists, but final room
              inventory still belongs to the hotel or provider. StayWise host
              listings use direct reservations; external hotel results use this
              transparent demo handoff until provider booking records are added.
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
                  Provider availability
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </Surface>
        </div>

        <Surface className="self-start p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-extrabold tracking-tight">Why this is here</h2>
          <div className="mt-5 space-y-4 text-sm font-semibold leading-6 text-[#5f5148]">
            <TrustLine
              icon={ShieldCheck}
              text="External results are not hardcoded StayWise inventory."
            />
            <TrustLine
              icon={Hotel}
              text="Reserve creates a project-safe booking handoff instead of claiming direct hotel ownership."
            />
            <TrustLine
              icon={CreditCard}
              text="Stripe test checkout can attach after external reservation records are added to Supabase."
            />
          </div>
        </Surface>
      </section>
    </main>
  );
}

function ReservationCard({
  currentPath,
  isReserved,
  isSignedIn,
  nights,
  nightlyRate,
  reservedPath,
  signInHref,
  stay,
  totals,
}: {
  currentPath: string;
  isReserved: boolean;
  isSignedIn: boolean;
  nights: number;
  nightlyRate: number;
  reservedPath: string;
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
              Provider showed {stay.providerPrice}; StayWise estimate is for demo checkout.
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3f5] px-3 py-1 text-sm font-semibold text-[#bd1740]">
          <Hotel className="h-4 w-4" aria-hidden="true" />
          External
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
          Demo reservation held. This is ready for the Stripe test-payment phase.
        </div>
      ) : isSignedIn ? (
        <Link
          href={reservedPath}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-extrabold text-white shadow-sm hover:bg-[#df2348]"
        >
          Reserve demo stay
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <Link
          href={signInHref}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-extrabold text-white shadow-sm hover:bg-[#df2348]"
        >
          Sign in to reserve
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      <Link
        href={currentPath}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-[#eadfd6] bg-white px-4 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348]"
      >
        Review details
      </Link>
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
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === "reserved") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  if (reserved) {
    params.set("reserved", "true");
  }

  return `/external-stays?${params.toString()}`;
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
