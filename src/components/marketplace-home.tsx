"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe2, Search } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { MarketplaceListingRails } from "@/components/marketplace-listing-rails";
import { MarketplacePlaceRails } from "@/components/marketplace-place-rails";
import {
  StayWiseAccountMenu,
  StayWiseHeader,
  StayWisePrimaryNav,
} from "@/components/staywise-header";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { GuestSelector, type GuestSelection } from "@/components/guest-selector";
import type { Listing } from "@/lib/listings";
import type { ListingDataState } from "@/lib/listing-data";
import type { NearbyPlaceSection } from "@/lib/nearby-places";
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
  discoverySections: NearbyPlaceSection[];
  initialFavoriteIds: string[];
  initialListings: Listing[];
  isSignedIn: boolean;
};

type RankedListing = ReturnType<typeof rankListings>[number];

const homeTabSearchInput = {
  propertyTypes: ["House", "Townhome", "Villa"],
} satisfies Partial<SearchInput>;
const listingCardsPerSection = 12;
const maxCityListingSections = 12;

export function MarketplaceHome({
  accountRole,
  dataState,
  discoverySections,
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

  const rankedListings = useMemo(
    () =>
      rankListings(broadMarketplaceSearchInput, initialListings, {
        favoriteListingIds: initialFavoriteIds,
      }),
    [initialFavoriteIds, initialListings],
  );
  const sections = useMemo(
    () => buildListingSections(rankedListings, makeSearchHref),
    [rankedListings],
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
      <MarketplacePlaceRails sections={discoverySections} />

      <StayWiseFooter />
    </main>
  );
}

function buildListingSections(
  listings: RankedListing[],
  getHref: (input: Partial<SearchInput>) => string,
) {
  const listingsByCity = new Map<string, RankedListing[]>();

  for (const listing of listings) {
    const cityListings = listingsByCity.get(listing.city) ?? [];
    cityListings.push(listing);
    listingsByCity.set(listing.city, cityListings);
  }

  const citySections = Array.from(listingsByCity.entries())
    .sort(
      ([firstCity, firstListings], [secondCity, secondListings]) =>
        secondListings.length - firstListings.length ||
        firstCity.localeCompare(secondCity),
    )
    .filter(([, cityListings]) => cityListings.length >= 2)
    .slice(0, maxCityListingSections)
    .map(([city, cityListings], index) => ({
      href: getHref({ destination: city }),
      listings: cityListings.slice(0, listingCardsPerSection),
      title:
        index % 2 === 0
          ? `Popular homes in ${city}`
          : `Places to stay in ${city}`,
    }));
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
  const guestFavorites = [...listings].sort(
    (first, second) =>
      (second.ratingAverage ?? 0) - (first.ratingAverage ?? 0) ||
      second.matchScore - first.matchScore,
  );
  const homes = listings.filter((listing) =>
    ["House", "Townhome", "Villa"].includes(listing.propertyType),
  );
  const apartments = listings.filter((listing) =>
    ["Apartment", "Loft"].includes(listing.propertyType),
  );
  const cabins = listings.filter((listing) => listing.propertyType === "Cabin");
  const kitchenReady = listings.filter((listing) => listing.amenities.includes("Kitchen"));
  const petFriendly = listings.filter((listing) =>
    listing.amenities.includes("Pet friendly"),
  );
  const broadDiscoverySections = [
    {
      href: getHref({}),
      listings: rotateListings(listings, 2),
      title: "Trending StayWise picks",
    },
    {
      href: getHref({}),
      listings: rotateListings(listings, 4),
      title: "Weekend-ready stays",
    },
    {
      href: getHref({}),
      listings: rotateListings(guestFavorites, 1),
      title: "Highly rated guest stays",
    },
    {
      href: getHref({}),
      listings: rotateListings(valuePicks, 3),
      title: "Budget-friendly getaways",
    },
    {
      href: getHref({}),
      listings: rotateListings(groupReady.length > 0 ? groupReady : listings, 2),
      title: "Roomy stays for groups",
    },
    {
      href: getHref({}),
      listings: rotateListings(workReady.length > 0 ? workReady : listings, 5),
      title: "Laptop-friendly homes",
    },
    {
      href: getHref(homeTabSearchInput),
      listings: rotateListings(homes.length > 0 ? homes : listings, 1),
      title: "Homes with space to settle in",
    },
    {
      href: getHref({}),
      listings: rotateListings(listings, 6),
      title: "More stays to explore",
    },
  ];

  return [
    {
      href: getHref({}),
      listings: rotateListings(listings, 0),
      title: "Available this weekend",
    },
    ...citySections,
    {
      href: getHref({}),
      listings: rotateListings(guestFavorites, 0),
      title: "Guest favorite stays",
    },
    {
      href: getHref(workReadySearchPreset),
      listings: rotateListings(workReady, 0),
      title: "Popular homes for remote work",
    },
    {
      href: getHref(familySearchPreset),
      listings: rotateListings(groupReady, 0),
      title: "Homes with room for everyone",
    },
    {
      href: getHref(valueSearchPreset),
      listings: rotateListings(valuePicks, 0),
      title: "Great value stays",
    },
    ...broadDiscoverySections,
    {
      href: getHref(homeTabSearchInput),
      listings: rotateListings(homes, 0),
      title: "Entire homes to settle into",
    },
    {
      href: getHref({ propertyTypes: ["Apartment", "Loft"] }),
      listings: rotateListings(apartments, 0),
      title: "Apartments near the action",
    },
    {
      href: getHref({ propertyTypes: ["Cabin"] }),
      listings: rotateListings(cabins, 0),
      title: "Cabins and quiet getaways",
    },
    {
      href: getHref({ amenities: ["Kitchen"] }),
      listings: rotateListings(kitchenReady, 0),
      title: "Stays with kitchens",
    },
    {
      href: getHref({ amenities: ["Pet friendly"] }),
      listings: rotateListings(petFriendly, 0),
      title: "Pet-friendly picks",
    },
  ].filter((section) => section.listings.length > 0);
}

function rotateListings(
  listings: RankedListing[],
  offset: number,
  limit = listingCardsPerSection,
) {
  if (listings.length === 0) {
    return [];
  }

  const count = Math.min(limit, listings.length);

  return Array.from(
    { length: count },
    (_, index) => listings[(offset + index) % listings.length],
  );
}

function makeSearchHref(input: Partial<SearchInput>) {
  const query = buildSearchQueryString({
    ...homeSearchInput,
    ...input,
  });

  return `/search${query ? `?${query}` : ""}`;
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
