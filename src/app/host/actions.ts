"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HostListingActionState = {
  ok: boolean;
  message: string;
};

const listingSchema = z.object({
  title: z.string().trim().min(8),
  description: z.string().trim().min(24),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2).max(2).transform((value) => value.toUpperCase()),
  neighborhood: z.string().trim().min(2),
  propertyType: z.string().trim().min(3),
  pricePerNight: z.coerce.number().int().min(50).max(1200),
  capacity: z.coerce.number().int().min(1).max(16),
  bedrooms: z.coerce.number().int().min(0).max(12),
  bathrooms: z.coerce.number().min(0.5).max(12),
  imageUrl: z.string().url(),
  amenities: z.string().trim().min(3),
});

export async function createHostListingAction(
  _state: HostListingActionState,
  formData: FormData,
): Promise<HostListingActionState> {
  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    city: formData.get("city"),
    state: formData.get("state"),
    neighborhood: formData.get("neighborhood"),
    propertyType: formData.get("propertyType"),
    pricePerNight: formData.get("pricePerNight"),
    capacity: formData.get("capacity"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    imageUrl: formData.get("imageUrl"),
    amenities: formData.get("amenities"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please complete every listing field with realistic values.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured for host listings yet.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sign in as a host before creating a listing.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "host") {
    return {
      ok: false,
      message: "Only host accounts can publish listings.",
    };
  }

  const values = parsed.data;
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      host_id: user.id,
      title: values.title,
      description: values.description,
      city: values.city,
      state: values.state,
      country: "United States",
      neighborhood: values.neighborhood,
      property_type: values.propertyType,
      price_per_night: values.pricePerNight,
      capacity: values.capacity,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !listing) {
    return {
      ok: false,
      message: error?.message ?? "Listing could not be created.",
    };
  }

  const listingId = listing.id as string;
  const amenities = values.amenities
    .split(",")
    .map((amenity) => amenity.trim())
    .filter(Boolean);

  await supabase.from("listing_images").insert({
    listing_id: listingId,
    image_url: values.imageUrl,
    alt_text: values.title,
    sort_order: 0,
  });

  if (amenities.length > 0) {
    await supabase.from("listing_amenities").insert(
      amenities.map((amenity) => ({
        listing_id: listingId,
        amenity,
      })),
    );
  }

  revalidatePath("/");
  revalidatePath("/host");

  return {
    ok: true,
    message: "Listing published. It is now searchable on StayWise.",
  };
}
