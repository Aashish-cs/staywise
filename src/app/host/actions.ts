"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { featuredAmenities, propertyTypes } from "@/lib/listings";
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

export type HostListingStatusActionState = {
  ok: boolean;
  message: string;
};

export type HostImageActionState = {
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

export async function toggleHostListingAction(
  _state: HostListingStatusActionState,
  formData: FormData,
): Promise<HostListingStatusActionState> {
  void _state;
  const parsed = hostListingIdSchema.safeParse({
    listingId: formData.get("listingId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "This listing status could not be changed.",
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
      message: "Sign in as a host before changing listing status.",
    };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("is_active")
    .eq("id", parsed.data.listingId)
    .eq("host_id", user.id)
    .maybeSingle();

  if (!listing) {
    return {
      ok: false,
      message: "This listing was not found for your host account.",
    };
  }

  const nextIsActive = !listing.is_active;
  const { error } = await supabase
    .from("listings")
    .update({ is_active: nextIsActive })
    .eq("id", parsed.data.listingId)
    .eq("host_id", user.id);

  if (error) {
    console.error("Unable to update host listing status", error);
    return {
      ok: false,
      message: "Listing status could not be updated. Try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/host");
  revalidatePath(`/listings/${parsed.data.listingId}`);

  return {
    ok: true,
    message: nextIsActive
      ? "Listing published and visible in search."
      : "Listing unpublished and hidden from search.",
  };
}

const featuredAmenitySet = new Set<string>(featuredAmenities);

const listingSchema = z.object({
  title: z.string().trim().min(8).max(90),
  description: z.string().trim().min(24).max(1200),
  city: z.string().trim().min(2).max(80),
  state: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/)
    .transform((value) => value.toUpperCase()),
  neighborhood: z.string().trim().min(2).max(80),
  propertyType: z.enum(propertyTypes),
  pricePerNight: z.coerce.number().int().min(50).max(1200),
  capacity: z.coerce.number().int().min(1).max(16),
  bedrooms: z.coerce.number().int().min(0).max(12),
  bathrooms: z.coerce.number().min(0.5).max(12),
  imageUrls: z.string().trim().optional().default("").transform(parseImageUrls),
  amenities: z.string().trim().transform(parseAmenities).pipe(
    z.array(z.enum(featuredAmenities)).min(1).max(featuredAmenities.length),
  ),
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

const hostListingImageActionSchema = z.object({
  listingId: z.string().uuid(),
  imageId: z.string().uuid(),
});

export async function deleteHostListingImageAction(
  _state: HostImageActionState,
  formData: FormData,
): Promise<HostImageActionState> {
  void _state;
  const parsed = hostListingImageActionSchema.safeParse({
    listingId: formData.get("listingId"),
    imageId: formData.get("imageId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "This photo action could not be completed.",
    };
  }

  const context = await getOwnedListingImageContext(parsed.data.listingId, parsed.data.imageId);

  if (!context || context.images.length <= 1) {
    return {
      ok: false,
      message: "Keep at least one photo on each listing.",
    };
  }

  const { error } = await context.supabase
    .from("listing_images")
    .delete()
    .eq("id", parsed.data.imageId)
    .eq("listing_id", parsed.data.listingId);

  if (error) {
    console.error("Unable to delete host listing image", error);
    return {
      ok: false,
      message: "Photo could not be removed. Try again.",
    };
  }

  const storagePath = extractListingStoragePath(context.image.image_url);

  if (storagePath) {
    await context.supabase.storage.from("listing-images").remove([storagePath]);
  }

  await normalizeListingImageOrder(context.supabase, parsed.data.listingId, context.images);
  revalidateHostImagePaths(parsed.data.listingId);

  return {
    ok: true,
    message: "Photo removed from the listing.",
  };
}

export async function setPrimaryHostListingImageAction(
  _state: HostImageActionState,
  formData: FormData,
): Promise<HostImageActionState> {
  void _state;
  const parsed = hostListingImageActionSchema.safeParse({
    listingId: formData.get("listingId"),
    imageId: formData.get("imageId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "This photo action could not be completed.",
    };
  }

  const context = await getOwnedListingImageContext(parsed.data.listingId, parsed.data.imageId);

  if (!context) {
    return {
      ok: false,
      message: "This photo was not found for your host account.",
    };
  }

  const orderedImages = [
    context.image,
    ...context.images.filter((image) => image.id !== context.image.id),
  ];
  await normalizeListingImageOrder(context.supabase, parsed.data.listingId, orderedImages);
  revalidateHostImagePaths(parsed.data.listingId);

  return {
    ok: true,
    message: "Primary photo updated.",
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
    imageUrls: formData.get("imageUrls") ?? "",
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
  const imageUrls = values.imageUrls;
  const imageFiles = formData
    .getAll("imageFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const amenities = values.amenities;

  if (imageUrls.length + imageFiles.length === 0) {
    return {
      ok: false,
      message: "Add at least one image file or valid image URL.",
    };
  }

  if (imageUrls.length + imageFiles.length > 6) {
    return {
      ok: false,
      message: "Add no more than six listing images.",
    };
  }

  const invalidFile = imageFiles.find(
    (file) => !isSupportedImage(file) || file.size > 8 * 1024 * 1024,
  );

  if (invalidFile) {
    return {
      ok: false,
      message: "Images must be JPEG, PNG, WebP, or HEIC files under 8 MB.",
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

  const uploadedImages = await uploadListingImages(
    supabase,
    user.id,
    listingId,
    values.title,
    imageFiles,
  );

  if (!uploadedImages.ok) {
    await supabase.from("listings").delete().eq("id", listingId);

    return {
      ok: false,
      message: uploadedImages.message,
    };
  }

  const { error: imageError } = await supabase.from("listing_images").insert(
    [
      ...imageUrls.map((imageUrl, index) => ({
        listing_id: listingId,
        image_url: imageUrl,
        alt_text: `${values.title} photo ${index + 1}`,
        sort_order: index,
      })),
      ...uploadedImages.images.map((image, index) => ({
        listing_id: listingId,
        image_url: image.url,
        alt_text: `${values.title} uploaded photo ${imageUrls.length + index + 1}`,
        sort_order: imageUrls.length + index,
      })),
    ],
  );

  if (imageError) {
    await removeUploadedListingImages(supabase, uploadedImages.paths);
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
      await removeUploadedListingImages(supabase, uploadedImages.paths);
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
        return url.protocol === "https:";
      } catch {
        return false;
      }
    })
    .slice(0, 6);
}

function parseAmenities(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((amenity) => amenity.trim())
        .filter((amenity) => featuredAmenitySet.has(amenity)),
    ),
  );
}

function isSupportedImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type);
}

async function uploadListingImages(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  listingId: string,
  title: string,
  files: File[],
) {
  if (!supabase || files.length === 0) {
    return { images: [], message: "", ok: true as const, paths: [] };
  }

  const uploaded: { path: string; url: string }[] = [];

  for (const [index, file] of files.entries()) {
    const path = `${userId}/${listingId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      await removeUploadedListingImages(supabase, uploaded.map((item) => item.path));
      return {
        images: [],
        message: `Photo ${index + 1} could not be uploaded. Apply the Storage migration and try again.`,
        ok: false as const,
        paths: [],
      };
    }

    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    uploaded.push({ path, url: data.publicUrl });
  }

  return {
    images: uploaded.map(({ url }) => ({ title, url })),
    message: "",
    ok: true as const,
    paths: uploaded.map(({ path }) => path),
  };
}

async function removeUploadedListingImages(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  paths: string[],
) {
  if (!supabase || paths.length === 0) {
    return;
  }

  await supabase.storage.from("listing-images").remove(paths);
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").slice(-80) || "photo";
}

async function getOwnedListingImageContext(listingId: string, imageId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("host_id", user.id)
    .maybeSingle();

  if (!listing) {
    return null;
  }

  const { data: imageRows, error } = await supabase
    .from("listing_images")
    .select("id, image_url, alt_text, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });

  if (error) {
    return null;
  }

  const images = (imageRows ?? []).map((image) => ({
    id: image.id as string,
    image_url: image.image_url as string,
    alt_text: image.alt_text as string,
    sort_order: Number(image.sort_order),
  }));
  const image = images.find((item) => item.id === imageId);

  return image ? { image, images, supabase } : null;
}

async function normalizeListingImageOrder(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  listingId: string,
  images: Array<{ id: string }>,
) {
  await Promise.all(
    images.map((image, index) =>
      supabase
        .from("listing_images")
        .update({ sort_order: index })
        .eq("id", image.id)
        .eq("listing_id", listingId),
    ),
  );
}

function extractListingStoragePath(value: string) {
  const marker = "/storage/v1/object/public/listing-images/";
  const markerIndex = value.indexOf(marker);

  return markerIndex === -1
    ? null
    : decodeURIComponent(value.slice(markerIndex + marker.length));
}

function revalidateHostImagePaths(listingId: string) {
  revalidatePath("/host");
  revalidatePath(`/host/listings/${listingId}/edit`);
  revalidatePath(`/listings/${listingId}`);
}
