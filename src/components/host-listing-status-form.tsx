"use client";

import { useActionState } from "react";
import {
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
