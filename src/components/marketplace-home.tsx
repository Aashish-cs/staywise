"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe2, Search } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { MarketplaceListingRails } from "@/components/marketplace-listing-rails";
import {
  StayWiseAccountMenu,
  StayWiseHeader,
  StayWisePrimaryNav,
} from "@/components/staywise-header";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { GuestSelector, type GuestSelection } from "@/components/guest-selector";
import type { Listing } from "@/lib/listings";
import type { ListingDataState } from "@/lib/listing-data";
import { rankListings, searchSchema, type SearchInput } from "@/lib/recommendations";
import { maximumReservationNights } from "@/lib/reservation-utils";
import {
  broadMarketplaceSearchInput,
  familySearchPreset,
  homeSearchInput,
  valueSearchPreset,
  workReadySearchPreset,
} from "@/lib/search-presets";
import { buildSearchQueryString } from "@/lib/search-url";

type MarketplaceHomeProps = {
  accountRole: "guest" | "host" | null;
  dataState: ListingDataState;
  initialFavoriteIds: string[];
  initialListings: Listing[];
  isSignedIn: boolean;
};

type RankedListing = ReturnType<typeof rankListings>[number];

const homeTabSearchInput = {
  propertyTypes: ["House", "Townhome", "Villa"],
} satisfies Partial<SearchInput>;

export function MarketplaceHome({
  accountRole,
  dataState,
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

  const topCity = useMemo(() => getTopCity(initialListings), [initialListings]);
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
  const homesHref = useMemo(() => makeSearchHref(homeTabSearchInput), []);
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
  const dataUnavailable = dataState.status !== "ready";

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
        nav={<StayWisePrimaryNav activeTab="all" homesHref={homesHref} />}
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
              isSignedIn={isSignedIn}
            />
          </>
        }
      />

      <section className="border-b border-[#ebe3dd] bg-white shadow-[0_10px_35px_rgba(32,26,24,0.06)]">
        <div className="mx-auto max-w-[1536px] px-5 py-4 lg:px-8">
          <form
            className="mx-auto grid max-w-5xl overflow-visible rounded-[2rem] border border-[#e6ddd5] bg-white text-left shadow-[0_12px_45px_rgba(32,26,24,0.14)] md:grid-cols-[minmax(0,1.35fr)_minmax(0,1.75fr)_150px_76px] md:rounded-full"
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
                placeholder="Search any city worldwide"
                className="mt-1 w-full bg-transparent text-sm font-semibold text-[#5f5148] outline-none placeholder:text-[#8b7d74]"
              />
            </label>

            <div className="border-t border-[#efe8e2] px-3 py-3 transition focus-within:bg-[#fff8f9] md:border-r md:border-t-0">
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                compact
                label=""
                maxNights={maximumReservationNights}
                showHint={false}
                onChange={(nextCheckIn, nextCheckOut) => {
                  setCheckIn(nextCheckIn);
                  setCheckOut(nextCheckOut);
                }}
              />
            </div>

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

          {(notice || dataUnavailable) && (
            <p
              className="mx-auto mt-3 max-w-5xl rounded-2xl bg-[#fff3f5] p-3 text-sm font-semibold text-[#bd1740]"
            >
              {notice ??
                dataState.message ??
                "Live marketplace data is not available right now."}
            </p>
          )}
        </div>
      </section>

      <MarketplaceListingRails
        onToggleSaved={toggleSaved}
        savedIds={savedIds}
        sections={sections}
      />

      <StayWiseFooter />
    </main>
  );
}

function buildListingSections(
  listings: RankedListing[],
  topCity: string | null,
  getHref: (input: Partial<SearchInput>) => string,
) {
  const cityListings = topCity
    ? listings.filter((listing) => listing.city === topCity)
    : listings;
  const weekendPicks =
    cityListings.length >= 6
      ? cityListings
      : [
          ...cityListings,
          ...listings.filter((listing) => listing.city !== topCity),
        ];
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
      href: getHref(topCity && cityListings.length >= 6 ? { destination: topCity } : {}),
      listings: weekendPicks.slice(0, 8),
      title:
        topCity && cityListings.length >= 6
          ? `Available in ${topCity} this weekend`
          : "Available this weekend",
    },
    {
      href: getHref(workReadySearchPreset),
      listings: workReady.slice(0, 8),
      title: "Popular homes for remote work",
    },
    {
      href: getHref(familySearchPreset),
      listings: groupReady.slice(0, 8),
      title: "Homes with room for everyone",
    },
    {
      href: getHref(valueSearchPreset),
      listings: valuePicks.slice(0, 8),
      title: "Great value stays",
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

function StayWiseFooter() {
  const inspirationLinks = [
    ["Dallas", "Monthly stays"],
    ["Cleveland", "Vacation homes"],
    ["Barcelona", "Apartment stays"],
    ["Portland", "Cottage stays"],
    ["Galveston", "Beach homes"],
    ["Kauai", "Condo stays"],
    ["Minneapolis", "Home rentals"],
    ["Raleigh", "Apartment stays"],
    ["Amsterdam", "Cabin stays"],
    ["Philadelphia", "House stays"],
    ["Charlotte", "Vacation homes"],
    ["Tokyo", "House stays"],
  ];
  const footerColumns = [
    {
      links: [
        ["Search stays", "/search"],
        ["Saved stays", "/favorites"],
        ["Your trips", "/dashboard"],
        ["Profile settings", "/profile"],
      ],
      title: "Support",
    },
    {
      links: [
        ["Become a host", "/host"],
        ["Host dashboard", "/host"],
        ["Start hosting", "/host/onboarding"],
        ["Host reservations", "/host"],
      ],
      title: "Hosting",
    },
    {
      links: [
        ["Smart search", "/search"],
        ["Explore stays", "/search"],
        ["Create account", "/auth?mode=signup"],
        ["Sign in", "/auth?mode=signin"],
      ],
      title: "StayWise",
    },
  ];

  return (
    <footer className="border-t border-[#ded6d0] bg-[#f7f7f7]">
      <section className="mx-auto max-w-[1536px] px-5 py-10 lg:px-8">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Inspiration for future getaways
        </h2>
        <div className="mt-6 flex gap-7 overflow-x-auto border-b border-[#ded6d0] text-sm font-extrabold text-[#6f655e]">
          {[
            ["Popular", "/search"],
            ["Home stays", makeSearchHref(homeTabSearchInput)],
            ["Remote work", makeSearchHref(workReadySearchPreset)],
            ["Family trips", makeSearchHref(familySearchPreset)],
            ["Budget friendly", makeSearchHref(valueSearchPreset)],
          ].map(([label, href], index) => (
            <Link
              key={label}
              href={href}
              className={`min-w-fit border-b-2 pb-3 ${
                index === 0
                  ? "border-[#201a18] text-[#201a18]"
                  : "border-transparent hover:border-[#b8aea6] hover:text-[#201a18]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-6">
          {inspirationLinks.map(([city, label]) => (
            <Link
              key={`${city}-${label}`}
              href={makeSearchHref({ destination: city })}
              className="group"
            >
              <span className="block text-sm font-extrabold group-hover:underline">
                {city}
              </span>
              <span className="mt-1 block text-sm font-semibold text-[#6f655e]">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1536px] gap-8 border-t border-[#ded6d0] px-5 py-10 text-sm lg:grid-cols-3 lg:px-8">
        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="font-extrabold">{column.title}</h3>
            <div className="mt-4 grid gap-3">
              {column.links.map(([label, href]) => (
                <Link
                  key={`${column.title}-${label}`}
                  href={href}
                  className="font-semibold text-[#3f3834] hover:underline"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="mx-auto flex max-w-[1536px] flex-col gap-4 border-t border-[#ded6d0] px-5 py-5 text-sm font-semibold text-[#3f3834] md:flex-row md:items-center md:justify-between lg:px-8">
        <p>© 2026 StayWise, Inc. · Smart Stays, Better Days.</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            English (US)
          </span>
          <span>$ USD</span>
          <Link href="/search" className="hover:underline">
            Search
          </Link>
          <Link href="/host" className="hover:underline">
            Host
          </Link>
        </div>
      </div>
    </footer>
  );
}
