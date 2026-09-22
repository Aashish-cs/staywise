"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Images, X } from "lucide-react";
import { fallbackListingImage, type Listing } from "@/lib/listings";

type GalleryImage = Listing["images"][number];

export function ListingPhotoGallery({ listing }: { listing: Listing }) {
  const galleryImages = listing.images.length
    ? listing.images
    : [{ alt: listing.imageAlt, url: listing.imageUrl }];
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];

  function openGallery(index: number) {
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
            priority
            className="aspect-[16/9] min-h-[300px]"
            onClick={() => openGallery(0)}
          />
        ) : (
          <>
            <GalleryTile
              image={galleryImages[0]}
              priority
              className="aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[440px]"
              onClick={() => openGallery(0)}
            />
            {galleryImages.slice(1, 5).map((image, index) => (
              <GalleryTile
                key={`${image.url}-${image.alt}`}
                image={image}
                className="hidden min-h-[216px] md:block"
                onClick={() => openGallery(index + 1)}
              />
            ))}
          </>
        )}

        <button
          type="button"
          className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-full border border-[#d8cbc1] bg-white/95 px-4 text-sm font-extrabold shadow-sm backdrop-blur transition hover:border-[#ff385c] hover:text-[#df2348]"
          onClick={() => openGallery(0)}
        >
          <Images className="h-4 w-4" aria-hidden="true" />
          Show all photos
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${listing.title} photo gallery`}
          className="fixed inset-0 z-50 bg-[#201a18]/90 p-4 text-white"
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="flex items-center justify-between gap-4 pb-4">
              <div>
                <p className="text-sm font-extrabold text-white/70">
                  {activeIndex + 1} of {galleryImages.length}
                </p>
                <h2 className="mt-1 text-lg font-extrabold">{listing.title}</h2>
              </div>
              <button
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
  onClick,
  priority,
}: {
  className: string;
  image: GalleryImage;
  onClick: () => void;
  priority?: boolean;
}) {
  return (
    <button
      type="button"
      className={`group relative block w-full bg-[#e8dfd6] ${className}`}
      onClick={onClick}
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
