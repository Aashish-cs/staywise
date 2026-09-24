"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Car,
  Home,
  Map,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trees,
  Users,
  Wifi,
} from "lucide-react";
import { SearchFiltersPanel } from "@/components/search-filters-panel";
import {
  SearchResultsSection,
} from "@/components/search-results-section";
import { StayWiseAccountMenu, StayWiseHeader } from "@/components/staywise-header";
import { Badge, Button } from "@/components/ui/primitives";
import { useAiSearch } from "@/hooks/use-ai-search";
import { useSavedListings } from "@/hooks/use-saved-listings";
import {
  type Listing,
  type PropertyType,
} from "@/lib/listings";
import type { ListingDataState } from "@/lib/listing-data";
import type { LocationLookupResult } from "@/lib/location-service";
import {
  rankListings,
  searchSchema,
  type SearchInput,
} from "@/lib/recommendations";
import {
  getActiveSearchFilterLabels,
  getSearchResultSummary,
  hasSearchDateRange,
  sortRankedListings,
  type SortMode,
} from "@/lib/search-results";
import {
  defaultSearchInput,
  familySearchPreset,
  outdoorSearchPreset,
  workReadySearchPreset,
} from "@/lib/search-presets";
import {
  buildSearchPageQueryString,
  buildSearchQueryString,
} from "@/lib/search-url";

const searchCategoryLinks = [
  {
    href: "/search",
    icon: Home,
    label: "All stays",
  },
  {
    href: makeSearchHref(workReadySearchPreset),
    icon: Wifi,
    label: "Work-ready",
  },
  {
    href: makeSearchHref(familySearchPreset),
    icon: Users,
    label: "Family trips",
  },
  {
    href: makeSearchHref(outdoorSearchPreset),
    icon: Trees,
    label: "Outdoors",
  },
];

export function SearchExperience({
  accountRole,
  dataState,
  initialFavoriteIds,
  initialListings,
  initialLocation,
  initialSearch,
  isSignedIn,
  pagination,
  showProductSections = true,
}: {
  accountRole: "guest" | "host" | null;
  dataState: ListingDataState;
  initialFavoriteIds: string[];
  initialListings: Listing[];
  initialLocation?: LocationLookupResult | null;
  initialSearch?: Partial<SearchInput>;
  isSignedIn: boolean;
  pagination?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextHref: string;
    page: number;
    previousHref: string;
    totalCount: number;
  };
  showProductSections?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState<SearchInput>(() =>
    searchSchema.parse({ ...defaultSearchInput, ...initialSearch }),
  );
  const [resolvedLocation, setResolvedLocation] =
    useState<LocationLookupResult | null>(initialLocation ?? null);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const rankedListings = useMemo(
    () => rankListings(deferredSearch, initialListings),
    [deferredSearch, initialListings],
  );
  const displayedListings = useMemo(
    () => sortRankedListings(rankedListings, sortMode),
    [rankedListings, sortMode],
  );
  const selectedListing =
    displayedListings.find((listing) => listing.id === selectedId) ??
    displayedListings[0];
  const destinations = useMemo(() => {
    const dbDestinations = initialListings.map((listing) => listing.city);
    return Array.from(new Set(dbDestinations)).sort((first, second) =>
      first.localeCompare(second),
    );
  }, [initialListings]);
  const listingDetailQuery = pagination
    ? buildSearchPageQueryString(search, pagination.page)
    : buildSearchQueryString(search);
  const searchHref = `/search${listingDetailQuery ? `?${listingDetailQuery}` : ""}`;
  const { notice, savedIds, setNotice, toggleSaved } = useSavedListings({
    accountRole,
    initialSavedIds: initialFavoriteIds,
    isSignedIn,
    signInHref: `/auth?mode=signin&next=${encodeURIComponent(searchHref)}`,
  });
  const {
    aiError,
    aiMessage,
    aiPrompt,
    applyAiSearch,
    isAiSearching,
    setAiPrompt,
  } = useAiSearch({
    getCurrentSearch: () => search,
    onSearchApplied(nextSearch) {
      setSearch(nextSearch);
      setResolvedLocation(null);
      setSelectedId(null);
      setNotice(null);
    },
  });
  const resultSummary = getSearchResultSummary(displayedListings, deferredSearch);
  const activeFilterLabels = getActiveSearchFilterLabels(search);
  const availabilityFilterApplied = hasSearchDateRange(deferredSearch);
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
  const activeFilterCount =
    search.amenities.length +
    search.propertyTypes.length +
    (search.minBedrooms > 0 ? 1 : 0) +
    (search.minBathrooms > 0 ? 1 : 0) +
    (search.maxNightlyBudget !== defaultSearchInput.maxNightlyBudget ? 1 : 0);

  function updateSearch<K extends keyof SearchInput>(key: K, value: SearchInput[K]) {
    setSearch((current) => ({ ...current, [key]: value }));
  }

  function updateDestination(destination: string) {
    setResolvedLocation(null);
    setSearch((current) => ({
      ...current,
      destination,
      nearLat: null,
      nearLng: null,
    }));
  }

  function useCurrentLocation({
    destination,
    location,
    nearLat,
    nearLng,
  }: {
    destination: string;
    location: LocationLookupResult | null;
    nearLat: number;
    nearLng: number;
  }) {
    setResolvedLocation(location);
    setSelectedId(null);
    setNotice(null);
    setSearch((current) => ({
      ...current,
      destination,
      nearLat,
      nearLng,
    }));
  }

  function toggleAmenity(amenity: string) {
    setSearch((current) => {
      const amenities = current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity];

      return { ...current, amenities };
    });
  }

  function togglePropertyType(propertyType: PropertyType) {
    setSearch((current) => {
      const propertyTypes = current.propertyTypes.includes(propertyType)
        ? current.propertyTypes.filter((item) => item !== propertyType)
        : [...current.propertyTypes, propertyType];

      return { ...current, propertyTypes };
    });
  }

  function clearAdvancedFilters() {
    setSearch((current) => ({
      ...current,
      amenities: [],
      maxNightlyBudget: defaultSearchInput.maxNightlyBudget,
      minBathrooms: 0,
      minBedrooms: 0,
      propertyTypes: [],
    }));
  }

  function focusSearch() {
    setShowMobileFilters(true);
    document.getElementById("search")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function focusResults() {
    const query = buildSearchQueryString(search);
    setSelectedId(displayedListings[0]?.id ?? null);
    router.push(`/search${query ? `?${query}` : ""}`);
    document.getElementById("results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <StayWiseHeader
        className="z-20"
        nav={
          <nav className="hidden items-center gap-2 rounded-full border border-[#eadfd6] bg-[#fbfaf8] px-2 py-2 shadow-sm lg:flex">
            <Link className="nav-pill" href="/search">
              Stays
            </Link>
            <Link
              className="nav-pill"
              href={isSignedIn ? "/dashboard" : "/auth?mode=signin"}
            >
              Trips
            </Link>
            <Link className="nav-pill" href="/host">
              Host
            </Link>
          </nav>
        }
        actions={
          <StayWiseAccountMenu
            accountHref={accountHref}
            accountLabel={accountLabel}
            accountLinkClassName="hover:bg-white"
            accountLinkVisibilityClassName="hidden md:block"
            isSignedIn={isSignedIn}
            menuClassName="z-30 shadow-lg"
          />
        }
      >

        <div className="border-t border-[#f3ede8]">
          <div className="scrollbar-hide mx-auto flex max-w-[1536px] gap-2 overflow-x-auto px-5 py-3 lg:px-8">
            {searchCategoryLinks.map((item, index) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm font-extrabold transition hover:border-[#ff385c] hover:text-[#df2348]",
                    index === 0
                      ? "border-[#201a18] bg-[#201a18] text-white hover:text-white"
                      : "border-[#eadfd6] bg-white text-[#5f5148]",
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

      <section className="mx-auto max-w-[1536px] px-5 py-6 lg:px-8">
        <MobileSearchSummary
          activeFilterCount={activeFilterCount}
          activeFilterLabels={activeFilterLabels}
          onToggleFilters={() => setShowMobileFilters((current) => !current)}
          onToggleMap={() => setShowMapPanel((current) => !current)}
          resultSummary={resultSummary}
          showMobileFilters={showMobileFilters}
          showMapPanel={showMapPanel}
        />

        <div className="mt-4 grid gap-6 lg:mt-0 lg:grid-cols-[360px_1fr]">
          <div
            id="mobile-search-filters"
            className={clsx("lg:block", showMobileFilters ? "block" : "hidden")}
          >
            <SearchFiltersPanel
              activeFilterCount={activeFilterCount}
              aiError={aiError}
              aiMessage={aiMessage}
              aiPrompt={aiPrompt}
              destinations={destinations}
              isAiSearching={isAiSearching}
              location={resolvedLocation}
              notice={notice}
              onAiPromptChange={setAiPrompt}
              onApplyAiSearch={() => {
                void applyAiSearch();
              }}
              onClearAdvancedFilters={clearAdvancedFilters}
              onDestinationChange={updateDestination}
              onFocusResults={focusResults}
              onToggleAmenity={toggleAmenity}
              onTogglePropertyType={togglePropertyType}
              onUpdateSearch={updateSearch}
              onUseCurrentLocation={useCurrentLocation}
              search={search}
            />
          </div>

          <SearchResultsSection
            activeFilterCount={activeFilterCount}
            activeFilterLabels={activeFilterLabels}
            dataState={dataState}
            displayedListings={displayedListings}
            availabilityFilterApplied={availabilityFilterApplied}
            listingDetailQuery={listingDetailQuery}
            onClearAdvancedFilters={clearAdvancedFilters}
            onFocusSearch={focusSearch}
            onSelectListing={setSelectedId}
            onSortModeChange={setSortMode}
            onToggleMapPanel={() => setShowMapPanel((current) => !current)}
            onToggleSaved={toggleSaved}
            pagination={pagination}
            resultSummary={resultSummary}
            savedIds={savedIds}
            search={deferredSearch}
            selectedListing={selectedListing}
            showMapPanel={showMapPanel}
            sortMode={sortMode}
          />
        </div>
      </section>

      {showProductSections && (
        <>
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
                body="Email confirmation, password reset, protected routes, and role-based access keep each account separated."
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
                    trend="Live inventory"
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
        </>
      )}
    </main>
  );
}

function MobileSearchSummary({
  activeFilterCount,
  activeFilterLabels,
  onToggleFilters,
  onToggleMap,
  resultSummary,
  showMobileFilters,
  showMapPanel,
}: {
  activeFilterCount: number;
  activeFilterLabels: string[];
  onToggleFilters: () => void;
  onToggleMap: () => void;
  resultSummary: string;
  showMobileFilters: boolean;
  showMapPanel: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-[#eadfd6] bg-white p-4 shadow-sm lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[#ff385c]">Search results</p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight">
            {resultSummary}
          </h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            aria-controls="mobile-search-filters"
            aria-expanded={showMobileFilters}
            size="sm"
            variant="outline"
            onClick={onToggleFilters}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={showMapPanel ? "secondary" : "outline"}
            onClick={onToggleMap}
          >
            <Map className="h-4 w-4" aria-hidden="true" />
            {showMapPanel ? "List" : "Map"}
          </Button>
        </div>
      </div>

      {activeFilterLabels.length > 0 && (
        <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
          {activeFilterLabels.slice(0, 8).map((label) => (
            <Badge key={label} tone="neutral" className="shrink-0">
              {label}
            </Badge>
          ))}
        </div>
      )}
    </div>
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

function makeSearchHref(input: Partial<SearchInput>) {
  const query = buildSearchQueryString({
    ...defaultSearchInput,
    ...input,
  });

  return `/search${query ? `?${query}` : ""}`;
}
