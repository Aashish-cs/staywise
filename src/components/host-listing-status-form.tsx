"use client";

import { useActionState } from "react";
import {
  archiveHostListingAction,
  toggleHostListingAction,
  type HostListingStatusActionState,
} from "@/app/host/actions";
import { useToastOnActionState } from "@/components/ui/toast";

const initialState: HostListingStatusActionState = {
  ok: false,
  message: "",
};

export function HostListingStatusForm({
  isActive,
  listingId,
}: {
  isActive: boolean;
  listingId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    toggleHostListingAction,
    initialState,
  );

  useToastOnActionState(state, {
    errorTitle: "Listing status unchanged",
    successTitle: isActive ? "Listing unpublished" : "Listing published",
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-[#eadfd6] px-4 py-2 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Updating" : isActive ? "Unpublish" : "Publish"}
      </button>
    </form>
  );
}

export function HostListingArchiveForm({
  isActive,
  listingId,
}: {
  isActive: boolean;
  listingId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    archiveHostListingAction,
    initialState,
  );

  useToastOnActionState(state, {
    errorTitle: "Listing was not archived",
    successTitle: "Listing archived",
  });

  return (
    <section className="mt-6 rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#bd1740]">Archive listing</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
            Hide this stay without deleting records.
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148]">
            Archiving removes the listing from guest search and booking, while keeping
            photos, reservation history, and ownership available to the host account.
          </p>
        </div>
        <form action={formAction} className="shrink-0">
          <input type="hidden" name="listingId" value={listingId} />
          <button
            type="submit"
            disabled={isPending || !isActive}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#bd1740] bg-white px-5 text-sm font-extrabold text-[#bd1740] hover:bg-[#fff3f5] disabled:cursor-not-allowed disabled:border-[#d8ccc2] disabled:text-[#8b7d74]"
          >
            {isPending ? "Archiving" : isActive ? "Archive listing" : "Already hidden"}
          </button>
        </form>
      </div>
    </section>
  );
}
