"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardActionState = {
  ok: boolean;
  message: string;
};

const cancelSchema = z.object({
  reservationId: z.string().uuid(),
});

const reviewSchema = z.object({
  reservationId: z.string().uuid(),
  listingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(20).max(1200),
});

export async function cancelReservationAction(
  _state: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  void _state;
  const parsed = cancelSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "This reservation could not be cancelled.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured for trips yet.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sign in before cancelling a reservation.",
    };
  }

  const { error } = await supabase.rpc("cancel_reservation", {
    reservation_id: parsed.data.reservationId,
  });

  if (error) {
    console.error("Unable to cancel reservation", error);
    return {
      ok: false,
      message: "Reservation could not be cancelled. Try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/host");
  revalidatePath("/search");
  revalidatePath(`/reservations/${parsed.data.reservationId}`);

  return {
    ok: true,
    message: "Trip cancelled and moved to your cancelled reservations.",
  };
}

export async function createReviewAction(
  _state: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  void _state;
  const parsed = reviewSchema.safeParse({
    reservationId: formData.get("reservationId"),
    listingId: formData.get("listingId"),
    rating: formData.get("rating"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Add a rating and at least 20 characters before submitting a review.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured for reviews yet.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sign in before reviewing a stay.",
    };
  }

  const { error } = await supabase.from("reviews").insert({
    reservation_id: parsed.data.reservationId,
    listing_id: parsed.data.listingId,
    guest_id: user.id,
    rating: parsed.data.rating,
    body: parsed.data.body,
  });

  if (error) {
    console.error("Unable to create review", error);
    return {
      ok: false,
      message: "Review could not be submitted. You may have already reviewed this stay.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/listings/${parsed.data.listingId}`);
  revalidatePath(`/reservations/${parsed.data.reservationId}`);

  return {
    ok: true,
    message: "Review submitted. It now contributes to the listing rating.",
  };
}
