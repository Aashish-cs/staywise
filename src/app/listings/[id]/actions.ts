"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { countNights, getTodayIso } from "@/lib/reservation-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReservationActionState = {
  ok: boolean;
  message: string;
  reservationId?: string;
};

const reservationSchema = z.object({
  listingId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.coerce.number().int().min(1).max(16),
});

export async function createReservationAction(
  _state: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  const parsed = reservationSchema.safeParse({
    listingId: formData.get("listingId"),
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
    guests: formData.get("guests"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the dates and guest count, then try again.",
    };
  }

  const { listingId, checkIn, checkOut, guests } = parsed.data;
  const nights = countNights(checkIn, checkOut);

  if (checkIn < getTodayIso()) {
    return {
      ok: false,
      message: "Choose a check-in date in the future.",
    };
  }

  if (nights < 1) {
    return {
      ok: false,
      message: "Check-out must be after check-in.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured for reservations yet.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sign in before reserving this stay.",
    };
  }

  const { data, error } = await supabase.rpc("create_reservation", {
    requested_end_date: checkOut,
    requested_guests: guests,
    requested_listing_id: listingId,
    requested_start_date: checkIn,
  });

  if (error) {
    return {
      ok: false,
      message: getReservationErrorMessage(error.message),
    };
  }

  const reservationId = typeof data === "string" ? data : null;

  if (!reservationId) {
    return {
      ok: false,
      message: "Reservation could not be completed. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/listings/${listingId}`);

  return {
    ok: true,
    message: "Reservation confirmed. It now appears in your trips.",
    reservationId,
  };
}

function getReservationErrorMessage(errorMessage: string) {
  if (errorMessage.includes("guest_required")) {
    return "Use a guest account to reserve stays. Host accounts manage listings.";
  }

  if (errorMessage.includes("check_in_in_past")) {
    return "Choose a check-in date in the future.";
  }

  if (errorMessage.includes("invalid_date_range")) {
    return "Check-out must be after check-in.";
  }

  if (errorMessage.includes("invalid_guest_count")) {
    return "Choose at least one guest.";
  }

  if (errorMessage.includes("listing_unavailable")) {
    return "This listing is no longer available.";
  }

  if (errorMessage.includes("host_cannot_book_own_listing")) {
    return "Hosts cannot reserve their own listing.";
  }

  if (errorMessage.includes("guest_capacity_exceeded")) {
    return "This stay does not support that many guests.";
  }

  if (
    errorMessage.includes("reservation_conflict") ||
    errorMessage.includes("reservations_no_active_overlap")
  ) {
    return "Those dates were just booked. Choose different dates.";
  }

  if (errorMessage.includes("create_reservation")) {
    return "Reservation service is not ready yet. Run the latest Supabase migration.";
  }

  return "Reservation could not be completed. Please try again.";
}
