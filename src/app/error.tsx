"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { RouteStatePanel } from "@/components/route-state";
import { StayWiseHeader } from "@/components/staywise-header";
import { Button } from "@/components/ui/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          actionSlot={
            <Button onClick={reset} type="button" variant="secondary">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          }
          actions={[
            { href: "/search", label: "Search stays", variant: "primary" },
            { href: "/", label: "Go home", variant: "outline" },
          ]}
          body="Something interrupted this StayWise page. Your account and booking data are still protected, so try loading it again or continue from search."
          eyebrow="Page interrupted"
          icon={TriangleAlert}
          title="We hit an unexpected issue."
        >
          {error.digest ? (
            <p className="rounded-2xl bg-white p-4 text-xs font-semibold text-[#786a60] shadow-sm">
              Support reference: {error.digest}
            </p>
          ) : null}
        </RouteStatePanel>
      </section>
    </main>
  );
}
