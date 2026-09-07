"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fetchListingForReservation } from "@/lib/listing-data";
import {
  calculateReservationTotal,
  countNights,
  getTodayIso,
} from "@/lib/reservation-utils";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "guest") {
    return {
      ok: false,
      message: "Use a guest account to reserve stays. Host accounts manage listings.",
    };
  }

  const listing = await fetchListingForReservation(supabase, listingId);

  if (!listing) {
    return {
      ok: false,
      message: "This listing is no longer available.",
    };
  }

  if (guests > listing.capacity) {
    return {
      ok: false,
      message: `This stay supports up to ${listing.capacity} guests.`,
    };
  }

  const { total } = calculateReservationTotal(listing.price_per_night, nights);

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      guest_id: user.id,
      listing_id: listing.id,
      start_date: checkIn,
      end_date: checkOut,
      guests,
      nightly_rate: listing.price_per_night,
      total_amount: total,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/listings/${listingId}`);

  return {
    ok: true,
    message: "Reservation confirmed. It now appears in your trips.",
    reservationId: data.id as string,
  };
}
