"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HostListingActionState = {
  listingId?: string;
  ok: boolean;
  message: string;
};

export type HostOnboardingActionState = {
  ok: boolean;
  message: string;
};

export type HostEditListingActionState = {
  listingId?: string;
  ok: boolean;
  message: string;
};

export async function activateHostAccountAction(
  _state: HostOnboardingActionState,
  _formData: FormData,
): Promise<HostOnboardingActionState> {
  void _state;
  void _formData;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured for host onboarding yet.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sign in before starting host onboarding.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "host" })
    .eq("id", user.id);

  if (error) {
    console.error("Unable to activate host account", error);
    return {
      ok: false,
      message: "We could not activate hosting for this account. Try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/host");
  redirect("/host");
}

const hostListingIdSchema = z.object({
  listingId: z.string().uuid(),
});

export async function toggleHostListingAction(formData: FormData) {
  const parsed = hostListingIdSchema.safeParse({
    listingId: formData.get("listingId"),
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

  const { data: listing } = await supabase
    .from("listings")
    .select("is_active")
    .eq("id", parsed.data.listingId)
    .eq("host_id", user.id)
    .maybeSingle();

  if (!listing) {
    return;
  }

  const { error } = await supabase
    .from("listings")
    .update({ is_active: !listing.is_active })
    .eq("id", parsed.data.listingId)
    .eq("host_id", user.id);

  if (error) {
    console.error("Unable to update host listing status", error);
    return;
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/host");
  revalidatePath(`/listings/${parsed.data.listingId}`);
}

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
  imageUrls: z.string().trim().min(10),
  amenities: z.string().trim().min(3),
});

const editListingSchema = listingSchema
  .omit({ imageUrls: true, amenities: true })
  .extend({
    listingId: z.string().uuid(),
  });

export async function updateHostListingAction(
  _state: HostEditListingActionState,
  formData: FormData,
): Promise<HostEditListingActionState> {
  void _state;
  const parsed = editListingSchema.safeParse({
    listingId: formData.get("listingId"),
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
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the listing details and try again.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured for listing edits yet.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sign in as a host before editing a listing.",
    };
  }

  const values = parsed.data;
  const { error } = await supabase
    .from("listings")
    .update({
      title: values.title,
      description: values.description,
      city: values.city,
      state: values.state,
      neighborhood: values.neighborhood,
      property_type: values.propertyType,
      price_per_night: values.pricePerNight,
      capacity: values.capacity,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      updated_at: new Date().toISOString(),
    })
    .eq("id", values.listingId)
    .eq("host_id", user.id);

  if (error) {
    console.error("Unable to update host listing", error);
    return {
      ok: false,
      message: "The listing could not be updated. Try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/host");
  revalidatePath(`/host/listings/${values.listingId}/edit`);
  revalidatePath(`/listings/${values.listingId}`);

  return {
    listingId: values.listingId,
    ok: true,
    message: "Listing details updated.",
  };
}

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
    imageUrls: formData.get("imageUrls"),
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
  const imageUrls = parseImageUrls(values.imageUrls);
  const amenities = values.amenities
    .split(",")
    .map((amenity) => amenity.trim())
    .filter(Boolean);

  if (imageUrls.length === 0) {
    return {
      ok: false,
      message: "Add at least one valid image URL.",
    };
  }

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

  const { error: imageError } = await supabase.from("listing_images").insert(
    imageUrls.map((imageUrl, index) => ({
      listing_id: listingId,
      image_url: imageUrl,
      alt_text: `${values.title} photo ${index + 1}`,
      sort_order: index,
    })),
  );

  if (imageError) {
    await supabase.from("listings").delete().eq("id", listingId);

    return {
      ok: false,
      message: imageError.message,
    };
  }

  if (amenities.length > 0) {
    const { error: amenityError } = await supabase.from("listing_amenities").insert(
      amenities.map((amenity) => ({
        listing_id: listingId,
        amenity,
      })),
    );

    if (amenityError) {
      await supabase.from("listings").delete().eq("id", listingId);

      return {
        ok: false,
        message: amenityError.message,
      };
    }
  }

  revalidatePath("/");
  revalidatePath("/host");
  revalidatePath(`/listings/${listingId}`);

  return {
    listingId,
    ok: true,
    message: "Listing published. It is now searchable on StayWise.",
  };
}

function parseImageUrls(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => {
      try {
        const url = new URL(item);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    })
    .slice(0, 6);
}
