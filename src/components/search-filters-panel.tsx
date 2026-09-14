"use client";

import clsx from "clsx";
import {
  BriefcaseBusiness,
  CalendarDays,
  Heart,
  Home,
  MapPin,
  Search,
  Sparkles,
  Trees,
  UserRound,
  Users,
  Wifi,
} from "lucide-react";
import {
  featuredAmenities,
  type PropertyType,
  tripPurposeLabels,
  type TripPurpose,
} from "@/lib/listings";
import type { LocationLookupResult } from "@/lib/location-service";
import type { SearchInput } from "@/lib/recommendations";
import { propertyTypeOptions } from "@/lib/search-presets";

type SearchInputUpdater = <K extends keyof SearchInput>(
  key: K,
  value: SearchInput[K],
) => void;

type SearchFiltersPanelProps = {
  activeFilterCount: number;
  aiError: string | null;
  aiMessage: string | null;
  aiPrompt: string;
  destinations: string[];
  isAiSearching: boolean;
  location: LocationLookupResult | null;
  notice: string | null;
  onAiPromptChange: (value: string) => void;
  onApplyAiSearch: () => void;
  onClearAdvancedFilters: () => void;
  onFocusResults: () => void;
  onToggleAmenity: (amenity: string) => void;
  onTogglePropertyType: (propertyType: PropertyType) => void;
  onUpdateSearch: SearchInputUpdater;
  search: SearchInput;
};

const purposeIcons: Record<TripPurpose, typeof BriefcaseBusiness> = {
  business: BriefcaseBusiness,
  family: Users,
  "remote-work": Wifi,
  romantic: Heart,
  solo: UserRound,
  group: Home,
  outdoor: Trees,
};

export function SearchFiltersPanel({
  activeFilterCount,
  aiError,
  aiMessage,
  aiPrompt,
  destinations,
  isAiSearching,
  location,
  notice,
  onAiPromptChange,
  onApplyAiSearch,
  onClearAdvancedFilters,
  onFocusResults,
  onToggleAmenity,
  onTogglePropertyType,
  onUpdateSearch,
  search,
}: SearchFiltersPanelProps) {
  const selectedPropertyTypeLabel =
    search.propertyTypes.length > 0
      ? search.propertyTypes.join(", ")
      : "Any property type";
  const verifiedLocation = isSameLocationQuery(search.destination, location)
    ? location
    : null;

  return (
    <aside
      id="search"
      className="self-start rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-sm lg:sticky lg:top-24"
    >
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
            onApplyAiSearch();
          }}
        >
          <label className="block">
            <span className="field-label">AI trip request</span>
            <textarea
              value={aiPrompt}
              onChange={(event) => onAiPromptChange(event.target.value)}
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
              onChange={(event) => onUpdateSearch("destination", event.target.value)}
              placeholder="Search by city or neighborhood"
              className="field-input"
            />
          </span>
        </label>

        {search.destination && (
          <div className="rounded-2xl border border-[#eadfd6] bg-[#fbfaf8] p-3 text-xs font-semibold leading-5 text-[#5f5148]">
            {verifiedLocation ? (
              <>
                <span className="block font-extrabold text-[#315d3b]">
                  Verified place: {formatVerifiedPlace(verifiedLocation)}
                </span>
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex text-[#786a60] underline decoration-2 underline-offset-4 hover:text-[#ff385c]"
                >
                  Data © OpenStreetMap contributors
                </a>
              </>
            ) : (
              "Press Search to verify this destination with OpenStreetMap."
            )}
          </div>
        )}

        {destinations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {destinations.map((destination) => (
              <button
                type="button"
                key={destination}
                className="rounded-full border border-[#eadfd6] bg-white px-3 py-2 text-sm font-medium hover:border-[#ff385c]"
                onClick={() => onUpdateSearch("destination", destination)}
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
                onChange={(event) => onUpdateSearch("checkIn", event.target.value)}
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
                onChange={(event) => onUpdateSearch("checkOut", event.target.value)}
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
                onChange={(event) => onUpdateSearch("guests", Number(event.target.value))}
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
                  onUpdateSearch("maxNightlyBudget", Number(event.target.value))
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
                onClick={onClearAdvancedFilters}
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
                    onClick={() => onTogglePropertyType(propertyType)}
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
                    onUpdateSearch("minBedrooms", Number(event.target.value))
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
                    onUpdateSearch("minBathrooms", Number(event.target.value))
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
                  onClick={() => onUpdateSearch("tripPurpose", purpose)}
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
                  onClick={() => onToggleAmenity(amenity)}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onFocusResults}
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
  );
}

function isSameLocationQuery(
  destination: string,
  location: LocationLookupResult | null,
) {
  return (
    Boolean(location) &&
    destination.trim().toLowerCase() === location?.query.trim().toLowerCase()
  );
}

function formatVerifiedPlace(location: LocationLookupResult) {
  return [location.city ?? location.name, location.region, location.country]
    .filter(Boolean)
    .join(", ");
}
