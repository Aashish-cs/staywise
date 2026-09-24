"use client";

import Image from "next/image";
import { useActionState } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import {
  deleteHostListingImageAction,
  setPrimaryHostListingImageAction,
  type HostImageActionState,
} from "@/app/host/actions";
import { useToastOnActionState } from "@/components/ui/toast";
import type { HostListingImage } from "@/lib/listing-data";

const initialImageActionState: HostImageActionState = {
  ok: false,
  message: "",
};

export function HostImageManager({
  images,
  listingId,
}: {
  images: HostListingImage[];
  listingId: string;
}) {
  return (
    <section className="mt-6 rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-sm md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#ff385c]">Photo management</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Make the stay tangible.</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">
            The first photo is the primary image guests see in search. Keep at least one photo on a listing.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#f7f3ee] px-3 py-1 text-sm font-extrabold text-[#5f5148]">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {images.length} {images.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      {images.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <article key={image.id} className="overflow-hidden rounded-[22px] border border-[#eadfd6] bg-[#fbfaf8]">
              <div className="relative aspect-[4/3] bg-[#e8dfd6]">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold">
                    <Star className="h-3.5 w-3.5 fill-[#ffb84d] text-[#ffb84d]" aria-hidden="true" />
                    Primary
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-extrabold">{image.alt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {index !== 0 ? (
                    <PrimaryPhotoForm image={image} listingId={listingId} />
                  ) : null}
                  {images.length > 1 ? (
                    <RemovePhotoForm image={image} listingId={listingId} />
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-[#d7c8bd] bg-[#fffaf5] p-5 text-sm font-semibold text-[#5f5148]">
          No photos are attached to this listing yet.
        </p>
      )}
    </section>
  );
}

function PrimaryPhotoForm({
  image,
  listingId,
}: {
  image: HostListingImage;
  listingId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    setPrimaryHostListingImageAction,
    initialImageActionState,
  );

  useToastOnActionState(state, {
    errorTitle: "Primary photo unchanged",
    successTitle: "Primary photo updated",
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="imageId" value={image.id} />
      <button
        type="submit"
        disabled={isPending}
        aria-label={`Make ${image.alt} the primary photo`}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#eadfd6] bg-white px-3 text-xs font-extrabold hover:border-[#ff385c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Star className="h-3.5 w-3.5" aria-hidden="true" />
        {isPending ? "Updating" : "Make primary"}
      </button>
    </form>
  );
}

function RemovePhotoForm({
  image,
  listingId,
}: {
  image: HostListingImage;
  listingId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteHostListingImageAction,
    initialImageActionState,
  );

  useToastOnActionState(state, {
    errorTitle: "Photo was not removed",
    successTitle: "Photo removed",
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="imageId" value={image.id} />
      <button
        type="submit"
        disabled={isPending}
        aria-label={`Remove photo ${image.alt}`}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#eadfd6] bg-white px-3 text-xs font-extrabold text-[#bd1740] hover:border-[#bd1740] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {isPending ? "Removing" : "Remove"}
      </button>
    </form>
  );
}
