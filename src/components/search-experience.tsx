"use client";

import { useMemo, useState } from "react";
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
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trees,
  UserRound,
  Users,
  Wifi,
} from "lucide-react";
import {
  ListingCardMedia,
  ListingSaveButton,
} from "@/components/listing-card-primitives";
import { StayWiseAccountMenu, StayWiseHeader } from "@/components/staywise-header";
import { useSavedListings } from "@/hooks/use-saved-listings";
import {
  featuredAmenities,
  type Listing,
  type PropertyType,
  tripPurposeLabels,
  type TripPurpose,
} from "@/lib/listings";
import {
  getOpenStreetMapEmbedUrl,
  getOpenStreetMapUrl,
} from "@/lib/listing-map";
import {
  type RankedListing,
  rankListings,
  searchSchema,
  type SearchInput,
} from "@/lib/recommendations";
import {
  getActiveSearchFilterLabels,
  getSearchResultSummary,
  sortRankedListings,
  type SortMode,
} from "@/lib/search-results";
import {
  defaultSearchInput,
  familySearchPreset,
  outdoorSearchPreset,
  propertyTypeOptions,
  workReadySearchPreset,
} from "@/lib/search-presets";
import { buildSearchQueryString } from "@/lib/search-url";

const purposeIcons: Record<TripPurpose, typeof BriefcaseBusiness> = {
  business: BriefcaseBusiness,
  family: Users,
  "remote-work": Wifi,
  romantic: Heart,
  solo: UserRound,
  group: Home,
  outdoor: Trees,
};

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
  initialFavoriteIds,
  initialListings,
  initialSearch,
  isSignedIn,
  showProductSections = true,
}: {
  accountRole: "guest" | "host" | null;
  initialFavoriteIds: string[];
  initialListings: Listing[];
  initialSearch?: Partial<SearchInput>;
  isSignedIn: boolean;
  showProductSections?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState<SearchInput>(() =>
    searchSchema.parse({ ...defaultSearchInput, ...initialSearch }),
  );
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  const rankedListings = useMemo(
    () => rankListings(search, initialListings),
    [initialListings, search],
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
  const listingDetailQuery = buildSearchQueryString(search);
  const searchHref = `/search${listingDetailQuery ? `?${listingDetailQuery}` : ""}`;
  const { notice, savedIds, setNotice, toggleSaved } = useSavedListings({
    accountRole,
    initialSavedIds: initialFavoriteIds,
    isSignedIn,
    signInHref: `/auth?mode=signin&next=${encodeURIComponent(searchHref)}`,
  });
  const resultSummary = getSearchResultSummary(displayedListings, search);
  const activeFilterLabels = getActiveSearchFilterLabels(search);
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
  const selectedPropertyTypeLabel =
    search.propertyTypes.length > 0
      ? search.propertyTypes.join(", ")
      : "Any property type";

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
          currentSearch: search,
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

      setSearch(nextSearch);
      setSelectedId(null);
      setNotice(null);
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

  function focusSearch() {
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
          <div className="mx-auto flex max-w-[1536px] gap-2 overflow-x-auto px-5 py-3 lg:px-8">
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
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside id="search" className="self-start rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-[#ff385c]">Search stays</p>
                <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight">
                  Find the right stay.
                </h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#5f5148]">
                  Find the stay that fits the trip with live inventory and clear AI
                  match reasons.
                </p>
              </div>
              <span className="rounded-full bg-[#e7f2e4] px-3 py-1 text-sm font-semibold text-[#315d3b]">
                Beta
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <form
                className="space-y-3 rounded-3xl bg-white/75 p-3 shadow-[inset_0_0_0_1px_#eadfd6]"
                onSubmit={(event) => {
                  event.preventDefault();
                  void applyAiSearch();
                }}
              >
                <label className="block">
                  <span className="field-label">AI trip request</span>
                  <textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="Quiet Dallas stay under $250 for 2 people with Wi-Fi"
                    className="field-textarea min-h-24 resize-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isAiSearching}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#201a18] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#a79a91]"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {isAiSearching ? "Reading request" : "Search with AI"}
                </button>

                {aiMessage && (
                  <p className="rounded-2xl bg-[#e7f2e4] p-3 text-sm font-semibold text-[#315d3b]">
                    {aiMessage}
                  </p>
                )}

                {aiError && (
                  <p className="rounded-2xl bg-[#fff3f5] p-3 text-sm font-semibold text-[#bd1740]">
                    {aiError}
                  </p>
                )}
              </form>

              <label className="block">
                <span className="field-label">Destination</span>
                <span className="field-shell">
                  <MapPin className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                  <input
                    value={search.destination}
                    onChange={(event) => updateSearch("destination", event.target.value)}
                    placeholder="Search by city or neighborhood"
                    className="field-input"
                  />
                </span>
              </label>

              {destinations.length > 0 && (
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
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="field-label">Check in</span>
                  <span className="field-shell">
                    <CalendarDays className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                    <input
                      type="date"
                      value={search.checkIn}
                      onChange={(event) => updateSearch("checkIn", event.target.value)}
                      className="field-input"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="field-label">Check out</span>
                  <span className="field-shell">
                    <CalendarDays className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                    <input
                      type="date"
                      value={search.checkOut}
                      onChange={(event) => updateSearch("checkOut", event.target.value)}
                      className="field-input"
                    />
                  </span>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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

              <div className="rounded-3xl border border-[#eadfd6] bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="field-label">Advanced filters</span>
                    <p className="text-sm font-extrabold">{selectedPropertyTypeLabel}</p>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      className="rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148] hover:text-[#df2348]"
                      onClick={clearAdvancedFilters}
                    >
                      Clear {activeFilterCount}
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <span className="field-label">Property type</span>
                  <div className="grid grid-cols-2 gap-2">
                    {propertyTypeOptions.map((propertyType) => {
                      const active = search.propertyTypes.includes(propertyType);

                      return (
                        <button
                          type="button"
                          key={propertyType}
                          aria-pressed={active}
                          className={clsx("choice-button", active && "choice-button-active")}
                          onClick={() => togglePropertyType(propertyType)}
                        >
                          {propertyType}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="field-label">Bedrooms</span>
                    <span className="field-shell">
                      <Home className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={search.minBedrooms}
                        onChange={(event) =>
                          updateSearch("minBedrooms", Number(event.target.value))
                        }
                        className="field-input"
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="field-label">Bathrooms</span>
                    <span className="field-shell">
                      <Home className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                      <input
                        type="number"
                        min="0"
                        max="12"
                        step="0.5"
                        value={search.minBathrooms}
                        onChange={(event) =>
                          updateSearch("minBathrooms", Number(event.target.value))
                        }
                        className="field-input"
                      />
                    </span>
                  </label>
                </div>
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
                  {resultSummary}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Recommended stays
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148]">
                  Smart sort weighs budget, trip style, guest count, amenities, and the
                  filters in your shareable search URL.
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button type="button" className="toolbar-button" onClick={focusSearch}>
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>
                <label className="toolbar-button">
                  <span>Sort</span>
                  <select
                    aria-label="Sort results"
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                    className="bg-transparent text-sm font-extrabold outline-none"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Lowest price</option>
                    <option value="space">Most space</option>
                  </select>
                </label>
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

            {activeFilterLabels.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilterLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {displayedListings.length > 0 ? (
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-5 md:grid-cols-2">
                  {displayedListings.map((listing, index) => (
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
                        aria-label={`View details for ${listing.title}`}
                        onClick={() => setSelectedId(listing.id)}
                      >
                        <ListingCardMedia
                          imageClassName="transition duration-500 group-hover:scale-105"
                          listing={listing}
                          priority={index === 0}
                          sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                        >
                          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold shadow-sm">
                            {listing.matchScore}% match
                          </div>
                        </ListingCardMedia>

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
                            <span className="shrink-0 rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148]">
                              Live
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
                        <ListingSaveButton
                          className="flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-[#fff3f5]"
                          iconClassName="h-4 w-4"
                          listingTitle={listing.title}
                          onClick={() => toggleSaved(listing.id)}
                          saved={savedIds.includes(listing.id)}
                          showLabel
                        />
                        <Link
                          href={`/listings/${listing.id}${
                            listingDetailQuery ? `?${listingDetailQuery}` : ""
                          }`}
                          aria-label={`Reserve ${listing.title}`}
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
                      <ListingMapPanel
                        listings={displayedListings}
                        listing={selectedListing}
                        listingDetailQuery={listingDetailQuery}
                        onSelectListing={setSelectedId}
                      />
                    ) : (
                      <ListingFitPanel listing={selectedListing} />
                    )}
                  </aside>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#d7c8bd] bg-white p-8 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-[#ff385c]" aria-hidden="true" />
                <p className="mt-4 text-lg font-semibold">No stays match this trip yet.</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#786a60]">
                  StayWise can loosen the filters, widen the budget, or use AI search to
                  translate the trip into a better set of matches.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
                    onClick={clearAdvancedFilters}
                  >
                    Clear advanced filters
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#eadfd6] px-5 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348]"
                    onClick={focusSearch}
                  >
                    Try AI search
                  </button>
                </div>
              </div>
            )}
          </section>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f3ee] p-3">
      <p className="text-xs font-semibold uppercase text-[#786a60]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ListingFitPanel({ listing }: { listing: RankedListing }) {
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
        <Metric label="Status" value="Verified" />
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

function ListingMapPanel({
  listings,
  listing,
  listingDetailQuery,
  onSelectListing,
}: {
  listings: RankedListing[];
  listing: RankedListing;
  listingDetailQuery: string;
  onSelectListing: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ff385c]">Map search</p>
          <h3 className="mt-1 text-xl font-semibold">
            {listings.length} stays near {listing.city}
          </h3>
        </div>
        <MapPin className="h-5 w-5 shrink-0 text-[#ff385c]" aria-hidden="true" />
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-[#eadfd6] bg-[#edf6f8]">
        <div className="relative h-72">
          <iframe
            title={`OpenStreetMap area for ${listing.title}`}
            src={getOpenStreetMapEmbedUrl(listing)}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
          />
          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#5f5148] shadow-sm">
            Real map source
          </div>
          <Link
            href={getOpenStreetMapUrl(listing)}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#201a18] shadow-sm hover:text-[#df2348]"
          >
            Open map
          </Link>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-[#786a60]">
        Map uses the listing coordinates stored in Supabase and shows an approximate
        area, not an exact address.
      </p>

      <div className="mt-5 max-h-[310px] space-y-3 overflow-y-auto pr-1">
        {listings.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx(
              "w-full rounded-2xl border p-3 text-left transition hover:border-[#ff385c]",
              item.id === listing.id
                ? "border-[#ff385c] bg-[#fff3f5]"
                : "border-[#eadfd6] bg-white",
            )}
            onClick={() => onSelectListing(item.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="line-clamp-1 text-sm font-extrabold">{item.title}</p>
                <p className="mt-1 text-xs font-semibold text-[#786a60]">
                  {item.neighborhood}, {item.city}
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold">
                ${item.pricePerNight}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#315d3b]">
              {item.matchScore}% match · {item.matchReasons[0]}
            </p>
          </button>
        ))}
      </div>

      <Link
        href={`/listings/${listing.id}${
          listingDetailQuery ? `?${listingDetailQuery}` : ""
        }`}
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

function makeSearchHref(input: Partial<SearchInput>) {
  const query = buildSearchQueryString({
    ...defaultSearchInput,
    ...input,
  });

  return `/search${query ? `?${query}` : ""}`;
}
