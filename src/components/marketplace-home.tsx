"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ArrowRight,
  CalendarDays,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Trees,
  Users,
  Wifi,
} from "lucide-react";
import {
  ListingFacts,
  ListingCardMedia,
  ListingLocationLine,
  ListingSaveButton,
} from "@/components/listing-card-primitives";
import { MarketplaceListingRails } from "@/components/marketplace-listing-rails";
import { StayWiseAccountMenu, StayWiseHeader } from "@/components/staywise-header";
import { Badge, Price } from "@/components/ui/primitives";
import { useAiSearch } from "@/hooks/use-ai-search";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { GuestSelector, type GuestSelection } from "@/components/guest-selector";
import type { Listing } from "@/lib/listings";
import { rankListings, searchSchema, type SearchInput } from "@/lib/recommendations";
import {
  broadMarketplaceSearchInput,
  createListingSearchInput,
  familySearchPreset,
  homeSearchInput,
  outdoorSearchPreset,
  valueSearchPreset,
  workReadySearchPreset,
} from "@/lib/search-presets";
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
  const [guestSelection, setGuestSelection] = useState<GuestSelection>({
    adults: 2,
    childGuests: 0,
    infants: 0,
    pets: 0,
  });
  const { notice, savedIds, toggleSaved } = useSavedListings({
    accountRole,
    initialSavedIds: initialFavoriteIds,
    isSignedIn,
    signInHref: `/auth?mode=signin&next=${encodeURIComponent("/")}`,
  });
  const {
    aiError,
    aiMessage,
    aiPrompt,
    applyAiSearch,
    isAiSearching,
    setAiPrompt,
  } = useAiSearch({
    getCurrentSearch,
  });

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
      rankListings(broadMarketplaceSearchInput, initialListings, {
        favoriteListingIds: initialFavoriteIds,
      }),
    [initialFavoriteIds, initialListings],
  );
  const sections = useMemo(
    () => buildListingSections(rankedListings, topCity, makeSearchHref),
    [rankedListings, topCity],
  );
  const categoryItems = useMemo(() => buildCategoryItems(topCity), [topCity]);
  const featuredListings = rankedListings.slice(0, 3);
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
      ...homeSearchInput,
      checkIn,
      checkOut,
      destination,
      adults: guestSelection.adults,
      children: guestSelection.childGuests,
      infants: guestSelection.infants,
      pets: guestSelection.pets,
      guests: guestSelection.adults + guestSelection.childGuests,
    });
  }

  function submitSearch() {
    const query = buildSearchQueryString(getCurrentSearch());
    router.push(`/search${query ? `?${query}` : ""}`);
  }

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <StayWiseHeader
        brandClassName="shrink-0"
        innerClassName="gap-5"
        nav={
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
        }
        actions={
          <>
            <Link
              className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] md:block"
              href="/host"
            >
              Host on StayWise
            </Link>
            <StayWiseAccountMenu
              accountHref={accountHref}
              accountLabel={accountLabel}
              accountLinkClassName="font-extrabold"
              isSignedIn={isSignedIn}
            />
          </>
        }
      >

        <div className="border-t border-[#f3ede8] lg:hidden">
          <div className="scrollbar-hide mx-auto flex max-w-[1536px] gap-2 overflow-x-auto px-5 py-3">
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
      </StayWiseHeader>

      <section className="border-b border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto max-w-[1536px] px-5 py-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-extrabold text-[#ff385c]">
              Smart Stays, Better Days.
            </p>
            <h1 className="mx-auto mt-2 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Real stays, smarter matching, zero guesswork.
            </h1>
          </div>

          <form
            className="mx-auto mt-6 grid max-w-5xl overflow-hidden rounded-[2rem] border border-[#e6ddd5] bg-white text-left shadow-[0_18px_55px_rgba(32,26,24,0.12)] md:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_118px_76px] md:rounded-full"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <label className="px-5 py-4 transition focus-within:bg-[#fff8f9] md:rounded-l-full md:border-r md:border-[#efe8e2]">
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

            <label className="border-t border-[#efe8e2] px-5 py-4 transition focus-within:bg-[#fff8f9] md:border-r md:border-t-0">
              <span className="block text-xs font-extrabold text-[#201a18]">Check in</span>
              <input
                type="date"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-[#5f5148] outline-none"
              />
            </label>

            <label className="border-t border-[#efe8e2] px-5 py-4 transition focus-within:bg-[#fff8f9] md:border-r md:border-t-0">
              <span className="block text-xs font-extrabold text-[#201a18]">Check out</span>
              <input
                type="date"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-[#5f5148] outline-none"
              />
            </label>

            <div className="border-t border-[#efe8e2] transition focus-within:bg-[#fff8f9] md:border-r md:border-t-0">
              <GuestSelector
                compact
                label="Who"
                adults={guestSelection.adults}
                childGuests={guestSelection.childGuests}
                infants={guestSelection.infants}
                pets={guestSelection.pets}
                maxGuests={16}
                onChange={(selection) => {
                  setGuestSelection(selection);
                }}
              />
            </div>

            <div className="flex items-center justify-center border-t border-[#efe8e2] p-3 md:border-t-0">
              <button
                type="submit"
                aria-label="Search stays"
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#ff385c] text-white transition hover:bg-[#df2348] md:w-12"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </form>

          <CategoryDiscoveryStrip categoryItems={categoryItems} />

          <form
            className="mx-auto mt-4 flex max-w-5xl flex-col gap-3 rounded-[1.65rem] border border-[#eadfd6] bg-white p-3 text-left shadow-sm md:flex-row md:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              void applyAiSearch();
            }}
          >
            <div className="flex flex-1 items-center gap-3 px-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#201a18] text-white">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <input
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="Ask StayWise: quiet Dallas stay under $250 with Wi-Fi"
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
                "mx-auto mt-3 max-w-5xl rounded-2xl p-3 text-sm font-semibold",
                aiError || notice
                  ? "bg-[#fff3f5] text-[#bd1740]"
                  : "bg-[#e7f2e4] text-[#315d3b]",
              )}
            >
              {aiError ?? notice ?? aiMessage}
            </p>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
            {featuredListings[0] ? (
              <FeaturedStayCard
                listing={featuredListings[0]}
                onToggleSaved={toggleSaved}
                saved={savedIds.includes(featuredListings[0].id)}
              />
            ) : (
              <div className="min-h-[360px] rounded-[30px] border border-dashed border-[#d8ccc2] bg-white p-8">
                <p className="text-sm font-extrabold text-[#ff385c]">
                  Marketplace loading
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                  Add active listings to unlock the home discovery board.
                </h2>
              </div>
            )}

            <div className="grid gap-4">
              {featuredListings.slice(1, 3).map((listing) => (
                <SpotlightStayCard
                  key={listing.id}
                  listing={listing}
                  onToggleSaved={toggleSaved}
                  saved={savedIds.includes(listing.id)}
                />
              ))}

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
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
                  icon={ShieldCheck}
                  label="Verified access"
                  value="Real email accounts and saved stays"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceListingRails
        onToggleSaved={toggleSaved}
        savedIds={savedIds}
        sections={sections}
      />

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

function CategoryDiscoveryStrip({
  categoryItems,
}: {
  categoryItems: CategoryItem[];
}) {
  return (
    <div
      className="scrollbar-hide mx-auto mt-4 flex max-w-5xl gap-2 overflow-x-auto pb-1"
      role="list"
      aria-label="Stay categories"
    >
      {categoryItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "flex min-w-fit items-center gap-3 rounded-full border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
              index === 0
                ? "border-[#201a18] bg-[#201a18] text-white"
                : "border-[#eadfd6] bg-white text-[#201a18]",
            )}
            role="listitem"
          >
            <span
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full",
                index === 0 ? "bg-white/15" : "bg-[#fff3f5]",
              )}
            >
              <Icon
                className={clsx(
                  "h-4 w-4",
                  index === 0 ? "text-[#ffcf75]" : "text-[#ff385c]",
                )}
                aria-hidden="true"
              />
            </span>
            <span>
              <span className="block text-sm font-extrabold">{item.label}</span>
              <span
                className={clsx(
                  "block text-xs font-semibold",
                  index === 0 ? "text-white/70" : "text-[#786a60]",
                )}
              >
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function FeaturedStayCard({
  listing,
  onToggleSaved,
  saved,
}: {
  listing: RankedListing;
  onToggleSaved: (id: string) => void;
  saved: boolean;
}) {
  const href = buildListingHref(listing);

  return (
    <article className="group relative overflow-hidden rounded-[30px] bg-[#201a18] shadow-[0_22px_70px_rgba(32,26,24,0.22)]">
      <ListingCardMedia
        href={href}
        aria-label={`View ${listing.title}`}
        frameClassName="block aspect-[16/10] min-h-[390px] rounded-[30px] md:min-h-[500px]"
        imageClassName="transition duration-700 group-hover:scale-105"
        listing={listing}
        priority
        sizes="(min-width: 1024px) 58vw, 100vw"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral" className="bg-white/95">
              Today&apos;s smart pick
            </Badge>
            <Badge tone="neutral" className="bg-black/35 text-white backdrop-blur">
              {listing.matchScore}% match
            </Badge>
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {listing.title}
          </h2>
          <p className="mt-3 text-sm font-semibold text-white/85 md:text-base">
            {listing.neighborhood}, {listing.city} · {listing.capacity} guests ·{" "}
            <Price amount={listing.pricePerNight} tone="inverse" />
          </p>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/85">
            {listing.matchReasons[0]}
          </p>
        </div>
      </ListingCardMedia>
      <ListingSaveButton
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#201a18] shadow-sm backdrop-blur transition hover:scale-105"
        iconClassName="h-5 w-5"
        listingTitle={listing.title}
        onClick={() => onToggleSaved(listing.id)}
        saved={saved}
      />
    </article>
  );
}

function SpotlightStayCard({
  listing,
  onToggleSaved,
  saved,
}: {
  listing: RankedListing;
  onToggleSaved: (id: string) => void;
  saved: boolean;
}) {
  const href = buildListingHref(listing);

  return (
    <article className="group grid overflow-hidden rounded-[26px] border border-[#eadfd6] bg-white shadow-sm md:min-h-[168px] md:grid-cols-[180px_minmax(0,1fr)]">
      <div className="relative">
        <ListingCardMedia
          href={href}
          aria-label={`View ${listing.title}`}
          frameClassName="block aspect-[16/10] rounded-none md:aspect-auto md:h-full md:min-h-full"
          imageClassName="transition duration-500 group-hover:scale-105"
          listing={listing}
          sizes="(min-width: 1024px) 180px, 42vw"
        />
        <ListingSaveButton
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#201a18] shadow-sm backdrop-blur transition hover:scale-105"
          iconClassName="h-5 w-5"
          listingTitle={listing.title}
          onClick={() => onToggleSaved(listing.id)}
          saved={saved}
        />
      </div>
      <Link href={href} className="flex min-w-0 flex-col justify-between p-4">
        <span>
          <Badge tone="brand">
            {listing.propertyType}
          </Badge>
          <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-6">
            {listing.title}
          </h3>
          <ListingLocationLine listing={listing} className="mt-1" />
          <ListingFacts listing={listing} className="mt-3" />
        </span>
        <span className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="line-clamp-1 font-semibold text-[#315d3b]">
            {listing.matchReasons[0]}
          </span>
          <Price amount={listing.pricePerNight} />
        </span>
      </Link>
    </article>
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
      href: makeSearchHref(workReadySearchPreset),
      icon: Wifi,
      label: "Work-ready",
    },
    {
      description: "More room, kitchens, parking",
      href: makeSearchHref(familySearchPreset),
      icon: Users,
      label: "Family trips",
    },
    {
      description: "Basecamps and easy parking",
      href: makeSearchHref(outdoorSearchPreset),
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
      second.matchScore - first.matchScore,
  );

  return [
    {
      href: getHref({ destination: topCity ?? "" }),
      listings: cityListings.slice(0, 8),
      subtitle: "Real listings from the StayWise marketplace.",
      title: topCity ? `Popular stays in ${topCity}` : "Popular stays",
    },
    {
      href: getHref(workReadySearchPreset),
      listings: workReady.slice(0, 8),
      subtitle: "Fast Wi-Fi, workspace signals, and focused layouts.",
      title: "Work-ready stays",
    },
    {
      href: getHref(familySearchPreset),
      listings: groupReady.slice(0, 8),
      subtitle: "More room for families, friends, and longer weekends.",
      title: "Room for the whole trip",
    },
    {
      href: getHref(valueSearchPreset),
      listings: valuePicks.slice(0, 8),
      subtitle: "Lower nightly rates without losing the essentials.",
      title: "Smart value picks",
    },
  ].filter((section) => section.listings.length > 0);
}

function makeSearchHref(input: Partial<SearchInput>) {
  const query = buildSearchQueryString({
    ...homeSearchInput,
    ...input,
  });

  return `/search${query ? `?${query}` : ""}`;
}

function buildListingHref(listing: RankedListing) {
  const query = buildSearchQueryString({
    ...homeSearchInput,
    ...createListingSearchInput(listing),
  });

  return `/listings/${listing.id}${query ? `?${query}` : ""}`;
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
