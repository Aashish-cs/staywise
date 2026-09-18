"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const cancelSchema = z.object({
  reservationId: z.string().uuid(),
});

const reviewSchema = z.object({
  reservationId: z.string().uuid(),
  listingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(20).max(1200),
});

export async function cancelReservationAction(formData: FormData) {
  const parsed = cancelSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.rpc("cancel_reservation", {
    reservation_id: parsed.data.reservationId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/host");
  revalidatePath("/search");
  revalidatePath(`/reservations/${parsed.data.reservationId}`);
}

export async function createReviewAction(formData: FormData) {
  const parsed = reviewSchema.safeParse({
    reservationId: formData.get("reservationId"),
    listingId: formData.get("listingId"),
    rating: formData.get("rating"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
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
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/listings/${parsed.data.listingId}`);
  revalidatePath(`/reservations/${parsed.data.reservationId}`);
}
