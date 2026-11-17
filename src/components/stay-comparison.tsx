"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { calculateReservationPricing } from "@/lib/pricing";
import {
  rankListings,
  type RankedListing,
  type SearchInput,
} from "@/lib/recommendations";
import { validateReservationDateRange } from "@/lib/reservation-utils";

export function StayComparison({
  listings,
  search,
  listingDetailQuery,
}: {
  listings: RankedListing[];
  search: SearchInput;
  listingDetailQuery: string;
}) {
  const matches = rankListings(search, listings).slice(0, 3);
  const dates = validateReservationDateRange(search.checkIn, search.checkOut);

  if (matches.length < 2) return null;

  return (
    <details className="mt-5 rounded-3xl border border-[#eadfd6] bg-[#fff8f5] p-5">
      <summary className="cursor-pointer text-base font-extrabold">
        <Sparkles
          className="mr-2 inline h-4 w-4 text-[#df2348]"
          aria-hidden="true"
        />
        Compare your top {matches.length} matches
      </summary>
      <p className="mt-3 text-sm leading-6 text-[#5f5148]">
        Ranked for your current filters using price, amenities, space, and trip
        preferences. This comparison covers the results on this page.
      </p>
      <div
        className="mt-4 overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Stay comparison"
      >
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Top matching stays, prices, reasons, and tradeoffs
          </caption>
          <thead>
            <tr>
              <th scope="col" className="p-3 align-top">
                Your trip
              </th>
              {matches.map((listing) => (
                <th
                  scope="col"
                  key={listing.id}
                  className="min-w-44 p-3 align-top"
                >
                  <Link
                    href={`/listings/${listing.id}${listingDetailQuery ? `?${listingDetailQuery}` : ""}`}
                    className="underline decoration-[#df2348] underline-offset-4"
                  >
                    {listing.title}
                  </Link>
                  <p className="mt-1 font-normal text-[#5f5148]">
                    {listing.city} · {listing.propertyType}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[#eadfd6]">
              <th scope="row" className="p-3 align-top">
                Nightly price
              </th>
              {matches.map((listing) => (
                <td key={listing.id} className="p-3 align-top">
                  {formatCurrency(listing.pricePerNight)}
                </td>
              ))}
            </tr>
            {dates.ok && (
              <tr className="border-t border-[#eadfd6]">
                <th scope="row" className="p-3 align-top">
                  Estimated total · {dates.nights} nights
                </th>
                {matches.map((listing) => (
                  <td key={listing.id} className="p-3 align-top">
                    {formatCurrency(
                      calculateReservationPricing({
                        nightlyRate: listing.pricePerNight,
                        nights: dates.nights,
                      }).total,
                    )}
                    <p className="mt-1 text-xs text-[#5f5148]">
                      Includes StayWise fees
                    </p>
                  </td>
                ))}
              </tr>
            )}
            <tr className="border-t border-[#eadfd6]">
              <th scope="row" className="p-3 align-top">
                Space
              </th>
              {matches.map((listing) => (
                <td key={listing.id} className="p-3 align-top">
                  {listing.capacity} guests · {listing.bedrooms} bedrooms ·{" "}
                  {listing.bathrooms} baths
                </td>
              ))}
            </tr>
            <tr className="border-t border-[#eadfd6]">
              <th scope="row" className="p-3 align-top">
                Why it matches
              </th>
              {matches.map((listing) => (
                <td key={listing.id} className="p-3 align-top">
                  <ul className="list-disc space-y-2 pl-4">
                    {listing.matchReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr className="border-t border-[#eadfd6]">
              <th scope="row" className="p-3 align-top">
                Consider before booking
              </th>
              {matches.map((listing) => (
                <td key={listing.id} className="p-3 align-top">
                  {listing.tradeoffs.length > 0
                    ? listing.tradeoffs.join(". ")
                    : "Review house rules and cancellation terms."}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#5f5148]">
        {dates.ok
          ? "Final pricing and availability are checked when you reserve."
          : "Choose dates to check availability and compare estimated trip totals."}
      </p>
    </details>
  );
}
