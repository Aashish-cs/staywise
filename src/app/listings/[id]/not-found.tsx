import type { Metadata } from "next";
import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { RouteStatePanel } from "@/components/route-state";
import { StayWiseHeader } from "@/components/staywise-header";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Listing not found",
  description: "This StayWise listing is no longer available.",
  robots: noIndexRobots,
};

export default function ListingNotFound() {
  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <StayWiseHeader
        actions={
          <Link
            href="/search"
            className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold shadow-sm hover:border-[#ff385c]"
          >
            Search stays
          </Link>
        }
      />
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-[960px] items-center px-5 py-14 lg:px-8">
        <RouteStatePanel
          actions={[
            { href: "/search", label: "Find another stay", variant: "primary" },
            { href: "/", label: "Back to home", variant: "outline" },
          ]}
          body="This stay is not available in the current marketplace data. It may have been unpublished by the host, removed, or opened from an old link."
          eyebrow="Stay unavailable"
          icon={SearchX}
          title="This listing is no longer available."
        >
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Home className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
            <p className="mt-3 font-extrabold">Use live search instead.</p>
            <p className="mt-2 text-sm leading-6 text-[#5f5148]">
              StayWise will show active listings from the database and keep your filters in the URL.
            </p>
          </div>
        </RouteStatePanel>
      </section>
    </main>
  );
}
