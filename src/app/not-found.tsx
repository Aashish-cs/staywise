import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { RouteStatePanel } from "@/components/route-state";
import { StayWiseHeader } from "@/components/staywise-header";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This StayWise page could not be found.",
  robots: noIndexRobots,
};

export default function NotFound() {
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
            { href: "/search", label: "Search stays", variant: "primary" },
            { href: "/", label: "Go home", variant: "outline" },
          ]}
          body="The page may have moved, the link may be old, or the stay may no longer be available. Start fresh with real listings and AI-ranked search."
          eyebrow="404"
          icon={Compass}
          title="This StayWise path got lost."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <Home className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
              <p className="mt-3 font-extrabold">Smart Stays, Better Days.</p>
              <p className="mt-2 text-sm leading-6 text-[#5f5148]">
                Return to the marketplace home and browse active stays.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <Search className="h-5 w-5 text-[#ff385c]" aria-hidden="true" />
              <p className="mt-3 font-extrabold">Search with intent.</p>
              <p className="mt-2 text-sm leading-6 text-[#5f5148]">
                Filter by destination, dates, guests, budget, and trip purpose.
              </p>
            </div>
          </div>
        </RouteStatePanel>
      </section>
    </main>
  );
}
