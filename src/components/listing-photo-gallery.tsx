"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Images, X } from "lucide-react";
import { fallbackListingImage, type Listing } from "@/lib/listings";

type GalleryImage = Listing["images"][number];

export function ListingPhotoGallery({ listing }: { listing: Listing }) {
  const galleryImages = listing.images.length
    ? listing.images
    : [{ alt: listing.imageAlt, url: listing.imageUrl }];
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => {
        lastTriggerRef.current?.focus();
      });
    };
  }, [isOpen]);

  function openGallery(index: number, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setActiveIndex(index);
    setIsOpen(true);
  }

  return (
    <>
      <div
        id="photos"
        className={clsx(
          "relative mt-6 overflow-hidden rounded-[28px] bg-[#eadfd6]",
          galleryImages.length === 1
            ? "border border-[#eadfd6]"
            : "grid gap-2 md:grid-cols-4 md:grid-rows-2",
        )}
      >
        {galleryImages.length === 1 ? (
          <GalleryTile
            image={galleryImages[0]}
            label={`Open photo 1 of ${galleryImages.length}`}
            priority
            className="aspect-[16/9] min-h-[300px]"
            onClick={(trigger) => openGallery(0, trigger)}
          />
        ) : (
          <>
            <GalleryTile
              image={galleryImages[0]}
              label={`Open photo 1 of ${galleryImages.length}`}
              priority
              className="aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[440px]"
              onClick={(trigger) => openGallery(0, trigger)}
            />
            {galleryImages.slice(1, 5).map((image, index) => (
              <GalleryTile
                key={`${image.url}-${image.alt}`}
                image={image}
                label={`Open photo ${index + 2} of ${galleryImages.length}`}
                className="hidden min-h-[216px] md:block"
                onClick={(trigger) => openGallery(index + 1, trigger)}
              />
            ))}
          </>
        )}

        <button
          type="button"
          className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-full border border-[#d8cbc1] bg-white/95 px-4 text-sm font-extrabold shadow-sm backdrop-blur transition hover:border-[#ff385c] hover:text-[#df2348]"
          onClick={(event) => openGallery(0, event.currentTarget)}
        >
          <Images className="h-4 w-4" aria-hidden="true" />
          Show all photos
        </button>
      </div>

      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-gallery-title"
          className="fixed inset-0 z-50 bg-[#201a18]/90 p-4 text-white"
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="flex items-center justify-between gap-4 pb-4">
              <div>
                <p className="text-sm font-extrabold text-white/70">
                  {activeIndex + 1} of {galleryImages.length}
                </p>
                <h2 id="photo-gallery-title" className="mt-1 text-lg font-extrabold">
                  {listing.title} photo gallery
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#201a18] hover:bg-[#fff3f5]"
                aria-label="Close photo gallery"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative min-h-[360px] overflow-hidden rounded-[24px] bg-black">
                <Image
                  src={activeImage?.url || fallbackListingImage}
                  alt={activeImage?.alt || listing.title}
                  fill
                  sizes="(min-width: 1024px) 900px, 100vw"
                  className="object-contain"
                />
              </div>

              <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 lg:max-h-full lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image.url}-${image.alt}-${index}`}
                    type="button"
                    aria-label={`Show photo ${index + 1}`}
                    aria-pressed={index === activeIndex}
                    className={clsx(
                      "relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl border transition lg:w-full",
                      index === activeIndex
                        ? "border-white"
                        : "border-white/20 opacity-75 hover:opacity-100",
                    )}
                    onClick={() => setActiveIndex(index)}
                  >
                    <Image
                      src={image.url || fallbackListingImage}
                      alt={image.alt || listing.title}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GalleryTile({
  className,
  image,
  label,
  onClick,
  priority,
}: {
  className: string;
  image: GalleryImage;
  label: string;
  onClick: (trigger: HTMLButtonElement) => void;
  priority?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`group relative block w-full bg-[#e8dfd6] ${className}`}
      onClick={(event) => onClick(event.currentTarget)}
    >
      <Image
        src={image.url || fallbackListingImage}
        alt={image.alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 720px, 100vw"
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
      />
    </button>
  );
}

function getFocusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(","),
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}
