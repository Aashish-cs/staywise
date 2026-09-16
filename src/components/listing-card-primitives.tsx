"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { Heart } from "lucide-react";
import { fallbackListingImage, type Listing } from "@/lib/listings";
import { formatDistanceMiles } from "@/lib/location-distance";

type ListingCardMediaProps = {
  ariaLabel?: string;
  children?: ReactNode;
  frameClassName?: string;
  href?: string;
  imageClassName?: string;
  listing: Pick<Listing, "imageAlt" | "imageUrl" | "title">;
  priority?: boolean;
  sizes: string;
};

type ListingSaveButtonProps = {
  className?: string;
  iconClassName?: string;
  listingTitle: string;
  onClick: () => void;
  saved: boolean;
  showLabel?: boolean;
};

type ListingLocationLineProps = {
  className?: string;
  distanceMiles?: number | null;
  listing: Pick<Listing, "city" | "neighborhood" | "state">;
};

type ListingFactsProps = {
  className?: string;
  listing: Pick<
    Listing,
    "bathrooms" | "bedrooms" | "capacity" | "propertyType"
  >;
};

const defaultFrameClassName = "relative aspect-[4/3] overflow-hidden bg-[#e8dfd6]";

export function ListingCardMedia({
  ariaLabel,
  children,
  frameClassName,
  href,
  imageClassName,
  listing,
  priority = false,
  sizes,
}: ListingCardMediaProps) {
  const className = clsx(defaultFrameClassName, frameClassName);
  const imageSource = listing.imageUrl?.trim() || fallbackListingImage;
  const [failedImageSource, setFailedImageSource] = useState<string | null>(null);
  const imageSrc =
    failedImageSource === imageSource ? fallbackListingImage : imageSource;

  const content = (
    <>
      <Image
        src={imageSrc}
        alt={listing.imageAlt || `${listing.title} stay`}
        fill
        onError={() => {
          if (imageSrc !== fallbackListingImage) {
            setFailedImageSource(imageSource);
          }
        }}
        priority={priority}
        sizes={sizes}
        className={clsx("object-cover", imageClassName)}
      />
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel ?? `View ${listing.title}`} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function ListingSaveButton({
  className,
  iconClassName,
  listingTitle,
  onClick,
  saved,
  showLabel = false,
}: ListingSaveButtonProps) {
  return (
    <button
      type="button"
      aria-label={`${saved ? "Remove saved" : "Save"} ${listingTitle}`}
      aria-pressed={saved}
      className={className}
      onClick={onClick}
    >
      <Heart
        className={clsx(iconClassName, saved && "fill-[#ff385c] text-[#ff385c]")}
        aria-hidden="true"
      />
      {showLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}

export function ListingLocationLine({
  className,
  distanceMiles = null,
  listing,
}: ListingLocationLineProps) {
  return (
    <p className={clsx("text-sm font-semibold text-[#786a60]", className)}>
      {listing.neighborhood}, {listing.city}
      {listing.state ? `, ${listing.state}` : ""}
      {distanceMiles !== null ? ` · ${formatDistanceMiles(distanceMiles)} away` : ""}
    </p>
  );
}

export function ListingFacts({ className, listing }: ListingFactsProps) {
  const facts = [
    listing.propertyType,
    formatListingQuantity(listing.bedrooms, "bed"),
    formatListingQuantity(listing.bathrooms, "bath"),
    formatListingQuantity(listing.capacity, "guest"),
  ];

  return (
    <p className={clsx("text-xs font-extrabold text-[#5f5148]", className)}>
      {facts.join(" · ")}
    </p>
  );
}

function formatListingQuantity(value: number, singular: string) {
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(/\.0$/, "");

  return `${formatted} ${singular}${value === 1 ? "" : "s"}`;
}
