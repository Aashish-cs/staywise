"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { Heart } from "lucide-react";
import type { Listing } from "@/lib/listings";

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
  const content = (
    <>
      <Image
        src={listing.imageUrl}
        alt={listing.imageAlt}
        fill
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
      {showLabel && "Save"}
    </button>
  );
}
