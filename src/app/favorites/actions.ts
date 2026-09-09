"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const favoriteSchema = z.object({
  listingId: z.string().uuid(),
  intent: z.enum(["save", "remove"]),
});

export async function toggleFavoriteAction(formData: FormData) {
  const parsed = favoriteSchema.safeParse({
    listingId: formData.get("listingId"),
    intent: formData.get("intent"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "This listing could not be saved.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured for saved stays yet.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sign in as a guest before saving stays.",
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
      message: "Use a guest account to save stays.",
    };
  }

  if (parsed.data.intent === "save") {
    const { error } = await supabase.from("favorites").upsert({
      guest_id: user.id,
      listing_id: parsed.data.listingId,
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }
  } else {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("guest_id", user.id)
      .eq("listing_id", parsed.data.listingId);

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  revalidatePath(`/listings/${parsed.data.listingId}`);

  return {
    ok: true,
    message:
      parsed.data.intent === "save"
        ? "Saved to your trips."
        : "Removed from saved stays.",
  };
}
