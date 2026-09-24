"use client";

import { useActionState } from "react";
import {
  cancelReservationAction,
  createReviewAction,
  type DashboardActionState,
} from "@/app/dashboard/actions";
import { useToastOnActionState } from "@/components/ui/toast";
import type { Reservation } from "@/lib/listings";

const initialState: DashboardActionState = {
  ok: false,
  message: "",
};

export function CancelReservationForm({ reservationId }: { reservationId: string }) {
  const [state, formAction, isPending] = useActionState(
    cancelReservationAction,
    initialState,
  );

  useToastOnActionState(state, {
    errorTitle: "Trip was not cancelled",
    successTitle: "Trip cancelled",
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="reservationId" value={reservationId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-4 text-sm font-extrabold hover:border-[#ff385c] hover:text-[#df2348] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Cancelling" : "Cancel trip"}
      </button>
    </form>
  );
}

export function ReservationReviewForm({
  listingId,
  reservation,
}: {
  listingId: string;
  reservation: Reservation;
}) {
  const [state, formAction, isPending] = useActionState(createReviewAction, initialState);

  useToastOnActionState(state, {
    errorTitle: "Review was not submitted",
    successTitle: "Review submitted",
  });

  return (
    <form action={formAction} className="mt-5 rounded-2xl border border-[#eadfd6] bg-[#fbfaf8] p-4">
      <div>
        <p className="font-extrabold">Share your stay</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#5f5148]">
          Reviews are available after a completed reservation. You can submit one review per stay.
        </p>
      </div>
      <input type="hidden" name="reservationId" value={reservation.id} />
      <input type="hidden" name="listingId" value={listingId} />
      <div className="mt-4 grid gap-4 sm:grid-cols-[130px_minmax(0,1fr)]">
        <label className="text-sm font-extrabold">
          Rating
          <select
            name="rating"
            defaultValue="5"
            className="mt-2 h-11 w-full rounded-xl border border-[#d7c8bd] bg-white px-3 font-semibold"
            required
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-extrabold">
          Review
          <textarea
            name="body"
            minLength={20}
            maxLength={1200}
            required
            placeholder="What should future guests know?"
            className="mt-2 min-h-11 w-full rounded-xl border border-[#d7c8bd] bg-white px-3 py-2 font-semibold outline-none focus:border-[#ff385c]"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Submitting" : "Submit review"}
      </button>
    </form>
  );
}
