"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  BriefcaseBusiness,
  CalendarDays,
  Car,
  Heart,
  Home,
  Map,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trees,
  UserRound,
  Users,
  Wifi,
} from "lucide-react";
import { toggleFavoriteAction } from "@/app/favorites/actions";
import {
  featuredAmenities,
  popularDestinations,
  stayMonths,
  type Listing,
  tripPurposeLabels,
  type TripPurpose,
} from "@/lib/listings";
import { rankListings, type SearchInput } from "@/lib/recommendations";

const purposeIcons: Record<TripPurpose, typeof BriefcaseBusiness> = {
  business: BriefcaseBusiness,
  family: Users,
  "remote-work": Wifi,
  romantic: Heart,
  solo: UserRound,
  group: Home,
  outdoor: Trees,
};

const defaultSearch: SearchInput = {
  destination: "",
  guests: 2,
  maxNightlyBudget: 250,
  tripPurpose: "remote-work",
  amenities: ["Fast Wi-Fi", "Workspace"],
  month: "Sep",
};

export function SearchExperience({
  accountRole,
  initialFavoriteIds,
  initialListings,
  isSignedIn,
}: {
  accountRole: "guest" | "host" | null;
  initialFavoriteIds: string[];
  initialListings: Listing[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState<SearchInput>(defaultSearch);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(initialFavoriteIds);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const rankedListings = useMemo(
    () => rankListings(search, initialListings),
    [initialListings, search],
  );
  const selectedListing =
    rankedListings.find((listing) => listing.id === selectedId) ?? rankedListings[0];
  const destinations = useMemo(() => {
    const dbDestinations = initialListings.map((listing) => listing.city);
    return Array.from(new Set([...popularDestinations, ...dbDestinations]));
  }, [initialListings]);
  const listingDetailQuery = new URLSearchParams({
    guests: String(search.guests),
    budget: String(search.maxNightlyBudget),
    month: search.month,
    purpose: search.tripPurpose,
  }).toString();
  const averageNightlyRate =
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

  function updateSearch<K extends keyof SearchInput>(key: K, value: SearchInput[K]) {
    setSearch((current) => ({ ...current, [key]: value }));
  }

  function toggleAmenity(amenity: string) {
    setSearch((current) => {
      const amenities = current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity];

      return { ...current, amenities };
    });
  }

  function toggleSaved(id: string) {
    if (!isSignedIn) {
      router.push("/auth?mode=signin");
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

  function focusSearch() {
    document.getElementById("search")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function focusResults() {
    setSelectedId(rankedListings[0]?.id ?? null);
    document.getElementById("results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] text-[#201a18]">
      <header className="sticky top-0 z-20 border-b border-[#eadfd6] bg-[#fffaf5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="StayWise home"
            onClick={() => setIsAccountMenuOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] text-white shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-semibold tracking-tight">StayWise</span>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-[#eadfd6] bg-white px-2 py-2 shadow-sm lg:flex">
            <a className="nav-pill" href="#search">
              Stays
            </a>
            <Link className="nav-pill" href="/dashboard">
              Trips
            </Link>
            <Link className="nav-pill" href="/host">
              Host
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-white md:block"
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
                <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-[#eadfd6] bg-white py-2 text-sm font-semibold shadow-lg">
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
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[410px_1fr]">
          <aside id="search" className="self-start rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#ff385c]">AI-ranked stays</p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
                  Find the stay that fits the trip.
                </h1>
              </div>
              <span className="rounded-full bg-[#e7f2e4] px-3 py-1 text-sm font-semibold text-[#315d3b]">
                Beta
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="field-label">Destination</span>
                <span className="field-shell">
                  <MapPin className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                  <input
                    value={search.destination}
                    onChange={(event) => updateSearch("destination", event.target.value)}
                    placeholder="Try Dallas or Chicago"
                    className="field-input"
                  />
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {destinations.map((destination) => (
                  <button
                    type="button"
                    key={destination}
                    className="rounded-full border border-[#eadfd6] bg-white px-3 py-2 text-sm font-medium hover:border-[#ff385c]"
                    onClick={() => updateSearch("destination", destination)}
                  >
                    {destination}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="field-label">Month</span>
                  <span className="field-shell">
                    <CalendarDays className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                    <select
                      value={search.month}
                      onChange={(event) => updateSearch("month", event.target.value)}
                      className="field-input"
                    >
                      {stayMonths.map((month) => (
                        <option key={month}>{month}</option>
                      ))}
                    </select>
                  </span>
                </label>

                <label className="block">
                  <span className="field-label">Guests</span>
                  <span className="field-shell">
                    <Users className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={search.guests}
                      onChange={(event) =>
                        updateSearch("guests", Number(event.target.value))
                      }
                      className="field-input"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="field-label">Budget</span>
                  <span className="field-shell">
                    <span className="text-sm font-semibold text-[#786a60]">$</span>
                    <input
                      type="number"
                      min="50"
                      max="1200"
                      value={search.maxNightlyBudget}
                      onChange={(event) =>
                        updateSearch("maxNightlyBudget", Number(event.target.value))
                      }
                      className="field-input"
                    />
                  </span>
                </label>
              </div>

              <div>
                <span className="field-label">Trip style</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(Object.keys(tripPurposeLabels) as TripPurpose[]).map((purpose) => {
                    const Icon = purposeIcons[purpose];
                    const active = search.tripPurpose === purpose;

                    return (
                      <button
                        type="button"
                        key={purpose}
                        aria-pressed={active}
                        className={clsx("choice-button", active && "choice-button-active")}
                        onClick={() => updateSearch("tripPurpose", purpose)}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{tripPurposeLabels[purpose]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="field-label">Amenities</span>
                <div className="flex flex-wrap gap-2">
                  {featuredAmenities.map((amenity) => {
                    const active = search.amenities.includes(amenity);

                    return (
                      <button
                        type="button"
                        key={amenity}
                        aria-pressed={active}
                        className={clsx("amenity-chip", active && "amenity-chip-active")}
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={focusResults}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df2348]"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search StayWise
              </button>

              {notice && (
                <p className="rounded-2xl bg-[#fff3f5] p-3 text-sm font-semibold text-[#bd1740]">
                  {notice}
                </p>
              )}
            </div>
          </aside>

          <section id="results" className="min-w-0 scroll-mt-24">
            <div className="flex flex-col gap-4 border-b border-[#eadfd6] pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#786a60]">
                  {rankedListings.length} matches for {search.month}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Recommended stays
                </h2>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button type="button" className="toolbar-button" onClick={focusSearch}>
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filters
                </button>
                <button
                  type="button"
                  aria-pressed={showMapPanel}
                  className={clsx(
                    "toolbar-button",
                    showMapPanel && "border-[#ff385c] text-[#df2348]",
                  )}
                  onClick={() => setShowMapPanel((current) => !current)}
                >
                  <Map className="h-4 w-4" aria-hidden="true" />
                  Map view
                </button>
              </div>
            </div>

            {rankedListings.length > 0 ? (
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-5 md:grid-cols-2">
                  {rankedListings.map((listing) => (
                    <article
                      key={listing.id}
                      className={clsx(
                        "group overflow-hidden rounded-[22px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                        selectedListing?.id === listing.id
                          ? "border-[#ff385c]"
                          : "border-[#eadfd6]",
                      )}
                    >
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => setSelectedId(listing.id)}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#e8dfd6]">
                          <Image
                            src={listing.imageUrl}
                            alt={listing.imageAlt}
                            fill
                            sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold shadow-sm">
                            {listing.matchScore}% match
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="line-clamp-2 text-base font-semibold">
                                {listing.title}
                              </h3>
                              <p className="mt-1 text-sm text-[#786a60]">
                                {listing.neighborhood}, {listing.city}
                              </p>
                            </div>
                            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                              <Star className="h-4 w-4 fill-[#201a18]" aria-hidden="true" />
                              {listing.rating.toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#5f5148]">
                            <span>{listing.propertyType}</span>
                            <span>{listing.bedrooms} bed</span>
                            <span>{listing.capacity} guests</span>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="text-sm">
                              <span className="font-semibold">${listing.pricePerNight}</span>{" "}
                              night
                            </p>
                            <p className="text-xs font-semibold text-[#315d3b]">
                              {listing.matchReasons[0]}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center justify-between border-t border-[#f0e7df] px-4 py-3">
                        <button
                          type="button"
                          className="flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-[#fff3f5]"
                          onClick={() => toggleSaved(listing.id)}
                          aria-pressed={savedIds.includes(listing.id)}
                        >
                          <Heart
                            className={clsx(
                              "h-4 w-4",
                              savedIds.includes(listing.id) &&
                                "fill-[#ff385c] text-[#ff385c]",
                            )}
                            aria-hidden="true"
                          />
                          Save
                        </button>
                        <Link
                          href={`/listings/${listing.id}?${listingDetailQuery}`}
                          className="rounded-full bg-[#201a18] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                        >
                          Reserve
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {selectedListing && (
                  <aside className="self-start rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm xl:sticky xl:top-24">
                    {showMapPanel ? (
                      <ListingMapPanel listing={selectedListing} />
                    ) : (
                      <ListingFitPanel listing={selectedListing} />
                    )}
                  </aside>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#d7c8bd] bg-white p-8 text-center">
                <p className="text-lg font-semibold">No stays match this trip yet.</p>
                <p className="mt-2 text-sm text-[#786a60]">
                  Try a different city, a wider budget, or seed active listings in
                  Supabase.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="border-y border-[#eadfd6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-3 lg:px-8">
          <ProductSignal
            icon={Sparkles}
            title="Explainable ranking"
            body="Each stay is scored against the current trip, with reasons and tradeoffs visible before booking."
          />
          <ProductSignal
            icon={ShieldCheck}
            title="Verified account flow"
            body="The project is wired for Supabase email confirmation, password reset, protected routes, and role-based access."
          />
          <ProductSignal
            icon={Car}
            title="Host-ready foundation"
            body="Hosts can manage listings, pricing, availability, and reservations through the same product architecture."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[24px] bg-[#201a18] p-6 text-white">
            <p className="text-sm font-semibold text-[#ffb84d]">Guest journey</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Search, compare, save, reserve.
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Create trip", "Rank stays", "Save favorites", "Confirm booking"].map(
                (item, index) => (
                  <div key={item} className="rounded-2xl bg-white/10 p-4">
                    <span className="text-sm font-semibold text-[#ffb84d]">
                      0{index + 1}
                    </span>
                    <p className="mt-2 font-semibold">{item}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#eadfd6] bg-[#fffaf5] p-6">
            <p className="text-sm font-semibold text-[#315d3b]">Host console</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Listings stay connected to demand.
            </h2>
            <div className="mt-5 space-y-3">
              <HostRow
                label="Active listings"
                value={`${initialListings.length}`}
                trend="Loaded from Supabase"
              />
              <HostRow
                label="Search cities"
                value={`${destinations.length}`}
                trend="Filtered live by trip"
              />
              <HostRow
                label="Average nightly"
                value={averageNightlyRate ? `$${averageNightlyRate}` : "$0"}
                trend="Computed from listings"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f3ee] p-3">
      <p className="text-xs font-semibold uppercase text-[#786a60]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ListingFitPanel({ listing }: { listing: ReturnType<typeof rankListings>[number] }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ff385c]">StayWise fit</p>
          <h3 className="mt-1 text-xl font-semibold">{listing.title}</h3>
        </div>
        <span className="rounded-full bg-[#fff3f5] px-3 py-1 text-sm font-semibold text-[#bd1740]">
          {listing.matchScore}%
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#5f5148]">{listing.description}</p>

      <div className="mt-5 space-y-3">
        {listing.matchReasons.map((reason) => (
          <div key={reason} className="flex gap-3">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-[#ff385c]"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">{reason}</p>
          </div>
        ))}
      </div>

      {listing.tradeoffs.length > 0 && (
        <div className="mt-5 rounded-2xl bg-[#f7f3ee] p-4">
          <p className="text-sm font-semibold">Tradeoffs</p>
          <ul className="mt-2 space-y-2 text-sm text-[#5f5148]">
            {listing.tradeoffs.map((tradeoff) => (
              <li key={tradeoff}>{tradeoff}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Host" value={listing.host.name} />
        <Metric label="Response" value={listing.host.responseTime} />
        <Metric label="Beds" value={`${listing.bedrooms}`} />
        <Metric label="Baths" value={`${listing.bathrooms}`} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {listing.amenities.slice(0, 5).map((amenity) => (
          <span
            key={amenity}
            className="rounded-full bg-[#edf6f8] px-3 py-1 text-xs font-semibold text-[#23515a]"
          >
            {amenity}
          </span>
        ))}
      </div>
    </>
  );
}

function ListingMapPanel({ listing }: { listing: ReturnType<typeof rankListings>[number] }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ff385c]">Location view</p>
          <h3 className="mt-1 text-xl font-semibold">
            {listing.neighborhood}, {listing.city}
          </h3>
        </div>
        <MapPin className="h-5 w-5 shrink-0 text-[#ff385c]" aria-hidden="true" />
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-[#eadfd6] bg-[#edf6f8]">
        <div className="relative h-64">
          <div className="absolute inset-x-0 top-1/3 h-3 bg-white/80" />
          <div className="absolute inset-y-0 left-1/4 w-3 bg-white/80" />
          <div className="absolute inset-y-0 right-1/4 w-3 bg-white/80" />
          <div className="absolute inset-x-0 bottom-1/4 h-3 bg-white/80" />
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff385c] p-3 text-white shadow-lg">
            <Home className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#5f5148] shadow-sm">
            Approximate area
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Metric label="City" value={listing.city} />
        <Metric label="State" value={listing.state} />
        <Metric label="Latitude" value={listing.coordinates.lat.toFixed(3)} />
        <Metric label="Longitude" value={listing.coordinates.lng.toFixed(3)} />
      </div>

      <Link
        href={`/listings/${listing.id}`}
        className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#201a18] px-4 text-sm font-semibold text-white hover:bg-black"
      >
        Open listing
      </Link>
    </>
  );
}

function ProductSignal({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff3f5] text-[#ff385c]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#5f5148]">{body}</p>
      </div>
    </div>
  );
}

function HostRow({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs font-semibold text-[#315d3b]">{trend}</p>
      </div>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}
