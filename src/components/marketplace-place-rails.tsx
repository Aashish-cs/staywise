"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/primitives";
import type { NearbyPlace, NearbyPlaceSection } from "@/lib/nearby-places";

type MarketplacePlaceRailsProps = {
  sections: NearbyPlaceSection[];
};

export function MarketplacePlaceRails({ sections }: MarketplacePlaceRailsProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="space-y-14 pb-12">
      {sections.map((section, sectionIndex) => (
        <PlaceRail
          key={section.title}
          section={section}
          sectionIndex={sectionIndex}
        />
      ))}
    </section>
  );
}

function PlaceRail({
  section,
  sectionIndex,
}: {
  section: NearbyPlaceSection;
  sectionIndex: number;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollRail(direction: "next" | "previous") {
    railRef.current?.scrollBy({
      behavior: "smooth",
      left:
        direction === "next"
          ? railRef.current.clientWidth * 0.82
          : -railRef.current.clientWidth * 0.82,
    });
  }

  return (
    <section className="mx-auto max-w-[1760px] px-5 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href={section.href} className="group inline-flex items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">
            {section.title}
          </h2>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f1f1] text-[#201a18] transition group-hover:bg-[#201a18] group-hover:text-white">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label={`Show previous ${section.title.toLowerCase()}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ded6d0] bg-white text-[#201a18] transition hover:bg-[#f7f3ee]"
            onClick={() => scrollRail("previous")}
            title="Show previous stays"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Show more ${section.title.toLowerCase()}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ded6d0] bg-white text-[#201a18] transition hover:bg-[#f7f3ee]"
            onClick={() => scrollRail("next")}
            title="Show more stays"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="scrollbar-hide grid snap-x auto-cols-[78vw] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-[250px] sm:gap-5 lg:auto-cols-[224px] xl:auto-cols-[228px] 2xl:auto-cols-[232px]"
      >
        {section.places.map((place, index) => (
          <PlaceCard
            key={`${section.title}-${place.id}`}
            destination={section.destination}
            place={place}
            priority={sectionIndex === 0 && index < 2}
          />
        ))}
      </div>
    </section>
  );
}

function PlaceCard({
  destination,
  place,
  priority,
}: {
  destination: string;
  place: NearbyPlace;
  priority: boolean;
}) {
  const href = makeExternalStayHref(place, destination);

  return (
    <article className="group min-w-0">
      <Link
        href={href}
        aria-label={`Reserve ${place.name}`}
        className="relative block overflow-hidden rounded-[18px] bg-[#e8dfd6] shadow-sm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={place.imageUrl}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <Badge tone="neutral" className="absolute left-3 top-3 bg-white/95 shadow-sm">
          {place.typeLabel}
        </Badge>
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">
          <Heart className="h-7 w-7 fill-black/25 stroke-[2.5]" aria-hidden="true" />
        </span>
      </Link>

      <Link href={href} className="mt-3 block">
        <h3 className="line-clamp-1 text-base font-extrabold leading-6">
          {formatPlaceTitle(place, destination)}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-[#6f655e]">
          {formatPlaceMeta(place)}
        </p>
      </Link>
    </article>
  );
}

function formatPlaceTitle(place: NearbyPlace, destination: string) {
  if (place.kind === "hotel" || place.kind === "motel" || place.kind === "hostel") {
    return place.name;
  }

  return `${place.typeLabel} in ${destination}`;
}

function formatPlaceMeta(place: NearbyPlace) {
  if (place.priceLabel) {
    return `${place.priceLabel} provider total`;
  }

  if (place.distanceMiles === null) {
    return "Inside searched area";
  }

  return `${place.actionLabel} · ${place.distanceMiles.toFixed(1)} mi away`;
}

function makeExternalStayHref(place: NearbyPlace, destination: string) {
  const params = new URLSearchParams({
    actionUrl: place.actionUrl,
    destination,
    id: place.id,
    imageUrl: place.imageUrl,
    kind: place.kind,
    lat: String(place.lat),
    lng: String(place.lng),
    mapUrl: place.mapUrl,
    name: place.name,
    source: place.source,
    typeLabel: place.typeLabel,
  });

  if (place.address) params.set("address", place.address);
  if (place.description) params.set("description", place.description);
  if (place.priceLabel) params.set("providerPrice", place.priceLabel);

  return `/external-stays?${params.toString()}`;
}
