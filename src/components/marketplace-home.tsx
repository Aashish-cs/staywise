"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Heart,
  Home,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  UserRound,
  Users,
  Wifi,
} from "lucide-react";
import { toggleFavoriteAction } from "@/app/favorites/actions";
import type { Listing } from "@/lib/listings";
import { rankListings, searchSchema, type SearchInput } from "@/lib/recommendations";
import { buildSearchQueryString } from "@/lib/search-url";

type MarketplaceHomeProps = {
  accountRole: "guest" | "host" | null;
  initialFavoriteIds: string[];
  initialListings: Listing[];
  isSignedIn: boolean;
};

type CategoryItem = {
  description: string;
  href: string;
  icon: typeof Home;
  label: string;
};

type RankedListing = ReturnType<typeof rankListings>[number];

const baseSearch: SearchInput = {
  destination: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  maxNightlyBudget: 300,
  tripPurpose: "remote-work",
  amenities: ["Fast Wi-Fi", "Workspace"],
  month: "Sep",
};

export function MarketplaceHome({
  accountRole,
  initialFavoriteIds,
  initialListings,
  isSignedIn,
}: MarketplaceHomeProps) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(initialFavoriteIds);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const topCity = useMemo(() => getTopCity(initialListings), [initialListings]);
  const cityOptions = useMemo(
    () =>
      Array.from(new Set(initialListings.map((listing) => listing.city))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [initialListings],
  );
  const rankedListings = useMemo(
    () =>
      rankListings(
        {
          ...baseSearch,
          amenities: [],
          destination: "",
          maxNightlyBudget: 1200,
          month: "",
        },
        initialListings,
      ),
    [initialListings],
  );
  const sections = useMemo(
    () => buildListingSections(rankedListings, topCity, makeSearchHref),
    [rankedListings, topCity],
  );
  const categoryItems = useMemo(() => buildCategoryItems(topCity), [topCity]);
  const averageNightly =
    initialListings.length > 0
      ? Math.round(
          initialListings.reduce(
            (total, listing) => total + listing.pricePerNight,
            0,
          ) / initialListings.length,
        )
      : 0;
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

  function getCurrentSearch(): SearchInput {
    return searchSchema.parse({
      ...baseSearch,
      checkIn,
      checkOut,
      destination,
      guests,
      month: getSupportedMonth(checkIn),
    });
  }

  function submitSearch() {
    const query = buildSearchQueryString(getCurrentSearch());
    router.push(`/search${query ? `?${query}` : ""}`);
  }

  async function applyAiSearch() {
    const prompt = aiPrompt.trim();

    if (!prompt) {
      setAiError("Describe the stay you want first.");
      setAiMessage(null);
      return;
    }

    setIsAiSearching(true);
    setAiError(null);
    setAiMessage(null);

    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentSearch: getCurrentSearch(),
          prompt,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; search?: Partial<SearchInput>; summary?: string }
        | null;

      if (!response.ok || !result?.search) {
        throw new Error(result?.error ?? "StayWise could not read that request.");
      }

      const nextSearch = searchSchema.parse(result.search);
      const query = buildSearchQueryString(nextSearch);

      setAiMessage(result.summary ?? "I updated the search from your request.");
      router.push(`/search${query ? `?${query}` : ""}`);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "StayWise could not read that request.",
      );
    } finally {
      setIsAiSearching(false);
    }
  }

  function toggleSaved(id: string) {
    if (!isSignedIn) {
      router.push(`/auth?mode=signin&next=${encodeURIComponent("/")}`);
      return;
    }

    if (accountRole !== "guest") {
      setNotice("Use a guest account to save stays.");
      return;
    }

    const wasSaved = savedIds.includes(id);
    const intent = wasSaved ? "remove" : "save";
    setSavedIds((current) =>
      intent === "remove"
        ? current.filter((savedId) => savedId !== id)
        : [...current, id],
    );
    setNotice(null);

    startTransition(() => {
      const formData = new FormData();
      formData.set("listingId", id);
      formData.set("intent", intent);
      void toggleFavoriteAction(formData)
        .then((result) => {
          if (result?.ok) {
            return;
          }

          setSavedIds((current) =>
            wasSaved
              ? Array.from(new Set([...current, id]))
              : current.filter((savedId) => savedId !== id),
          );
          setNotice(result?.message ?? "This saved stay change did not finish.");
        })
        .catch(() => {
          setSavedIds((current) =>
            wasSaved
              ? Array.from(new Set([...current, id]))
              : current.filter((savedId) => savedId !== id),
          );
          setNotice("This saved stay change did not finish.");
        });
    });
  }

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <header className="sticky top-0 z-30 border-b border-[#ebe3dd] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1536px] items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="StayWise home"
            onClick={() => setIsAccountMenuOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] text-white shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight">
                StayWise
              </span>
              <span className="hidden text-xs font-semibold text-[#786a60] sm:block">
                Smart Stays, Better Days.
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-[#ebe3dd] bg-[#fbfaf8] p-1 lg:flex">
            {categoryItems.slice(0, 4).map((item, index) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex h-11 items-center gap-2 rounded-full px-4 text-sm font-extrabold text-[#5f5148] transition hover:bg-white hover:text-[#201a18] hover:shadow-sm",
                    index === 0 && "bg-white text-[#201a18] shadow-sm",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] md:block"
              href="/host"
            >
              Host on StayWise
            </Link>
            <Link
              className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] sm:block"
              href={accountHref}
            >
              {accountLabel}
            </Link>
            <div className="relative">
              <button
                type="button"
                aria-expanded={isAccountMenuOpen}
                aria-label="Open account menu"
                className="flex h-11 items-center gap-2 rounded-full border border-[#ddd0c6] bg-white px-3 text-sm shadow-sm"
                onClick={() => setIsAccountMenuOpen((current) => !current)}
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-[#eadfd6] bg-white py-2 text-sm font-semibold shadow-xl">
                  {isSignedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-3 hover:bg-[#fff3f5]"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        My trips
                      </Link>
                      <Link
                        href="/host"
                        className="block px-4 py-3 hover:bg-[#fff3f5]"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Host dashboard
                      </Link>
                      <form action="/auth/signout" method="post">
                        <button
                          type="submit"
                          className="w-full px-4 py-3 text-left font-semibold hover:bg-[#fff3f5]"
                        >
                          Sign out
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth?mode=signin"
                        className="block px-4 py-3 hover:bg-[#fff3f5]"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/auth?mode=signup"
                        className="block px-4 py-3 hover:bg-[#fff3f5]"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[#f3ede8] lg:hidden">
          <div className="mx-auto flex max-w-[1536px] gap-2 overflow-x-auto px-5 py-3">
            {categoryItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex min-w-fit items-center gap-2 rounded-full border border-[#eadfd6] px-3 py-2 text-sm font-extrabold",
                    index === 0
                      ? "bg-[#201a18] text-white"
                      : "bg-white text-[#5f5148]",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="border-b border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto max-w-5xl px-5 py-7 text-center lg:px-8">
          <p className="text-sm font-extrabold text-[#ff385c]">
            Smart Stays, Better Days.
          </p>
          <h1 className="mx-auto mt-2 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Find a stay that actually fits the trip.
          </h1>

          <form
            className="mx-auto mt-6 grid overflow-hidden rounded-[2rem] border border-[#e6ddd5] bg-white text-left shadow-[0_18px_55px_rgba(32,26,24,0.12)] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_130px_70px]"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <label className="border-b border-[#efe8e2] px-5 py-4 md:border-b-0 md:border-r">
              <span className="block text-xs font-extrabold text-[#201a18]">Where</span>
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder={topCity ? `Search ${topCity} or any city` : "Search destinations"}
                list="staywise-destinations"
                className="mt-1 w-full bg-transparent text-sm font-semibold text-[#5f5148] outline-none placeholder:text-[#8b7d74]"
              />
              <datalist id="staywise-destinations">
                {cityOptions.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </label>

            <label className="border-b border-[#efe8e2] px-5 py-4 md:border-b-0 md:border-r">
              <span className="block text-xs font-extrabold text-[#201a18]">Check in</span>
              <input
                type="date"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-[#5f5148] outline-none"
              />
            </label>

            <label className="border-b border-[#efe8e2] px-5 py-4 md:border-b-0 md:border-r">
              <span className="block text-xs font-extrabold text-[#201a18]">Check out</span>
              <input
                type="date"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-[#5f5148] outline-none"
              />
            </label>

            <label className="border-b border-[#efe8e2] px-5 py-4 md:border-b-0 md:border-r">
              <span className="block text-xs font-extrabold text-[#201a18]">Who</span>
              <input
                type="number"
                min="1"
                max="16"
                value={guests}
                onChange={(event) => setGuests(Number(event.target.value))}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-[#5f5148] outline-none"
              />
            </label>

            <div className="flex items-center justify-center p-3">
              <button
                type="submit"
                aria-label="Search stays"
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#ff385c] text-white transition hover:bg-[#df2348] md:w-12"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </form>

          <form
            className="mx-auto mt-3 flex max-w-4xl flex-col gap-3 rounded-[1.65rem] border border-[#eadfd6] bg-white p-3 text-left shadow-sm md:flex-row md:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              void applyAiSearch();
            }}
          >
            <div className="flex flex-1 items-center gap-3 px-2">
              <Sparkles className="h-5 w-5 shrink-0 text-[#ff385c]" aria-hidden="true" />
              <input
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="Ask StayWise for a quiet Dallas stay under $250 with Wi-Fi"
                className="min-h-11 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#8b7d74]"
              />
            </div>
            <button
              type="submit"
              disabled={isAiSearching}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[#9b8f87]"
            >
              {isAiSearching ? "Reading" : "AI search"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          {(aiMessage || aiError || notice) && (
            <p
              className={clsx(
                "mx-auto mt-3 max-w-3xl rounded-2xl p-3 text-sm font-semibold",
                aiError || notice
                  ? "bg-[#fff3f5] text-[#bd1740]"
                  : "bg-[#e7f2e4] text-[#315d3b]",
              )}
            >
              {aiError ?? notice ?? aiMessage}
            </p>
          )}

          <div className="mx-auto mt-5 grid max-w-3xl gap-2 text-left sm:grid-cols-3">
            <MarketSignal
              icon={Home}
              label={`${initialListings.length} live stays`}
              value={
                averageNightly
                  ? `Average $${averageNightly}/night`
                  : "Loaded from Supabase"
              }
            />
            <MarketSignal
              icon={CalendarDays}
              label="Date-aware booking"
              value="Booked dates are blocked"
            />
            <MarketSignal
              icon={Sparkles}
              label="AI-ranked"
              value="Reasons shown before reserve"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1536px] px-5 py-5 lg:px-8">
        <div className="grid gap-3 md:grid-cols-5">
          {categoryItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  "group rounded-[22px] border p-4 transition hover:-translate-y-0.5 hover:shadow-md",
                  index === 0
                    ? "border-[#201a18] bg-[#201a18] text-white"
                    : "border-[#eadfd6] bg-white",
                )}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5",
                    index === 0 ? "text-[#ffb84d]" : "text-[#ff385c]",
                  )}
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-extrabold">{item.label}</p>
                <p
                  className={clsx(
                    "mt-1 text-xs font-semibold leading-5",
                    index === 0 ? "text-white/70" : "text-[#786a60]",
                  )}
                >
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-9 pb-12">
        {sections.map((section, sectionIndex) => (
          <ListingRail
            key={section.title}
            href={section.href}
            listings={section.listings}
            onToggleSaved={toggleSaved}
            savedIds={savedIds}
            sectionIndex={sectionIndex}
            subtitle={section.subtitle}
            title={section.title}
          />
        ))}
      </section>

      <section className="border-y border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto grid max-w-[1536px] gap-6 px-5 py-8 lg:grid-cols-[1.1fr_1fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-extrabold text-[#ff385c]">StayWise system</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
              More than pretty cards.
            </h2>
          </div>
          <ProductProof
            icon={ShieldCheck}
            title="Verified accounts"
            body="Email confirmation, password reset, and role-aware guest and host spaces are already wired."
          />
          <ProductProof
            icon={Car}
            title="Real booking logic"
            body="Reservations use Supabase validation for dates, capacity, ownership, and server-calculated totals."
          />
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1536px] flex-col gap-3 px-5 py-6 text-sm font-semibold text-[#786a60] md:flex-row md:items-center md:justify-between lg:px-8">
        <p>StayWise · Smart Stays, Better Days.</p>
        <div className="flex gap-4">
          <Link href="/search" className="hover:text-[#ff385c]">
            Search
          </Link>
          <Link href="/host" className="hover:text-[#ff385c]">
            Host
          </Link>
          <Link href={accountHref} className="hover:text-[#ff385c]">
            {accountLabel}
          </Link>
        </div>
      </footer>
    </main>
  );
}

function ListingRail({
  href,
  listings,
  onToggleSaved,
  savedIds,
  sectionIndex,
  subtitle,
  title,
}: {
  href: string;
  listings: RankedListing[];
  onToggleSaved: (id: string) => void;
  savedIds: string[];
  sectionIndex: number;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-[1536px] px-5 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#786a60]">{subtitle}</p>
        </div>
        <Link
          href={href}
          aria-label={`View all ${title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1ebe6] text-[#201a18] hover:bg-[#201a18] hover:text-white"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid auto-cols-[minmax(245px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3 [scrollbar-width:none] md:auto-cols-[minmax(260px,1fr)] lg:auto-cols-[minmax(265px,1fr)]">
        {listings.map((listing, index) => (
          <MarketplaceListingCard
            key={`${title}-${listing.id}`}
            listing={listing}
            onToggleSaved={onToggleSaved}
            priority={sectionIndex === 0 && index < 2}
            saved={savedIds.includes(listing.id)}
          />
        ))}
      </div>
    </section>
  );
}

function MarketplaceListingCard({
  listing,
  onToggleSaved,
  priority,
  saved,
}: {
  listing: RankedListing;
  onToggleSaved: (id: string) => void;
  priority: boolean;
  saved: boolean;
}) {
  const query = buildSearchQueryString({
    ...baseSearch,
    destination: listing.city,
    maxNightlyBudget: Math.max(listing.pricePerNight + 60, baseSearch.maxNightlyBudget),
  });

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-[22px] bg-[#e8dfd6]">
        <Link
          href={`/listings/${listing.id}?${query}`}
          aria-label={`View ${listing.title}`}
          className="block aspect-[4/3]"
        >
          <Image
            src={listing.imageUrl}
            alt={listing.imageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 280px, (min-width: 768px) 33vw, 82vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        {listing.rating >= 4.86 && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#201a18] shadow-sm">
            Wise pick
          </span>
        )}
        <button
          type="button"
          aria-label={`${saved ? "Remove saved" : "Save"} ${listing.title}`}
          aria-pressed={saved}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#201a18] shadow-sm backdrop-blur transition hover:scale-105"
          onClick={() => onToggleSaved(listing.id)}
        >
          <Heart
            className={clsx("h-5 w-5", saved && "fill-[#ff385c] text-[#ff385c]")}
            aria-hidden="true"
          />
        </button>
      </div>

      <Link href={`/listings/${listing.id}?${query}`} className="mt-3 block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-extrabold leading-5">
              {listing.title}
            </h3>
            <p className="mt-1 text-sm font-semibold text-[#786a60]">
              {listing.neighborhood}, {listing.city}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-extrabold">
            <Star className="h-4 w-4 fill-[#201a18]" aria-hidden="true" />
            {listing.rating.toFixed(2)}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#5f5148]">
          <span className="font-extrabold text-[#201a18]">
            ${listing.pricePerNight}
          </span>{" "}
          night · {listing.capacity} guests
        </p>
        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#315d3b]">
          {listing.matchReasons[0]}
        </p>
      </Link>
    </article>
  );
}

function MarketSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd6] bg-white p-3 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff3f5] text-[#ff385c]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-extrabold">{label}</span>
        <span className="block text-xs font-semibold text-[#786a60]">{value}</span>
      </span>
    </div>
  );
}

function ProductProof({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Home;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#ff385c] shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-extrabold">{title}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#786a60]">{body}</p>
      </div>
    </div>
  );
}

function buildCategoryItems(topCity: string | null): CategoryItem[] {
  return [
    {
      description: "Every live stay",
      href: "/search",
      icon: Home,
      label: "All stays",
    },
    {
      description: "Desk, Wi-Fi, easy check-in",
      href: makeSearchHref({
        amenities: ["Fast Wi-Fi", "Workspace"],
        tripPurpose: "remote-work",
      }),
      icon: Wifi,
      label: "Work-ready",
    },
    {
      description: "More room, kitchens, parking",
      href: makeSearchHref({
        amenities: ["Kitchen", "Parking", "Washer"],
        guests: 5,
        tripPurpose: "family",
      }),
      icon: Users,
      label: "Family trips",
    },
    {
      description: "Basecamps and easy parking",
      href: makeSearchHref({
        amenities: ["Parking", "Pet friendly"],
        tripPurpose: "outdoor",
      }),
      icon: Trees,
      label: "Outdoors",
    },
    {
      description: topCity ? `Top picks in ${topCity}` : "Top city picks",
      href: makeSearchHref({
        destination: topCity ?? "",
      }),
      icon: MapPin,
      label: "Near you",
    },
  ];
}

function buildListingSections(
  listings: RankedListing[],
  topCity: string | null,
  getHref: (input: Partial<SearchInput>) => string,
) {
  const cityListings = topCity
    ? listings.filter((listing) => listing.city === topCity)
    : listings;
  const workReady = listings.filter(
    (listing) =>
      listing.amenities.includes("Fast Wi-Fi") ||
      listing.amenities.includes("Workspace"),
  );
  const groupReady = listings.filter(
    (listing) => listing.capacity >= 5 || listing.bedrooms >= 2,
  );
  const valuePicks = [...listings].sort(
    (first, second) =>
      first.pricePerNight - second.pricePerNight ||
      second.rating - first.rating,
  );

  return [
    {
      href: getHref({ destination: topCity ?? "" }),
      listings: cityListings.slice(0, 8),
      subtitle: "Real listings from the StayWise marketplace.",
      title: topCity ? `Popular stays in ${topCity}` : "Popular stays",
    },
    {
      href: getHref({
        amenities: ["Fast Wi-Fi", "Workspace"],
        tripPurpose: "remote-work",
      }),
      listings: workReady.slice(0, 8),
      subtitle: "Fast Wi-Fi, workspace signals, and focused layouts.",
      title: "Work-ready stays",
    },
    {
      href: getHref({
        guests: 5,
        tripPurpose: "family",
      }),
      listings: groupReady.slice(0, 8),
      subtitle: "More room for families, friends, and longer weekends.",
      title: "Room for the whole trip",
    },
    {
      href: getHref({
        maxNightlyBudget: 220,
      }),
      listings: valuePicks.slice(0, 8),
      subtitle: "Lower nightly rates without losing the essentials.",
      title: "Smart value picks",
    },
  ].filter((section) => section.listings.length > 0);
}

function makeSearchHref(input: Partial<SearchInput>) {
  const query = buildSearchQueryString({
    ...baseSearch,
    ...input,
  });

  return `/search${query ? `?${query}` : ""}`;
}

function getTopCity(listings: Listing[]) {
  const counts = new Map<string, number>();

  for (const listing of listings) {
    counts.set(listing.city, (counts.get(listing.city) ?? 0) + 1);
  }

  return (
    Array.from(counts.entries()).sort(
      ([firstCity, firstCount], [secondCity, secondCount]) =>
        secondCount - firstCount || firstCity.localeCompare(secondCity),
    )[0]?.[0] ?? null
  );
}

function getSupportedMonth(checkIn: string) {
  if (!checkIn) {
    return baseSearch.month;
  }

  const month = new Date(`${checkIn}T00:00:00`).getUTCMonth();

  if (month === 8) return "Sep";
  if (month === 9) return "Oct";
  if (month === 10) return "Nov";
  if (month === 11) return "Dec";

  return baseSearch.month;
}
