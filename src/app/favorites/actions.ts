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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "guest") {
    return;
  }

  if (parsed.data.intent === "save") {
    await supabase.from("favorites").upsert({
      guest_id: user.id,
      listing_id: parsed.data.listingId,
    });
  } else {
    await supabase
      .from("favorites")
      .delete()
      .eq("guest_id", user.id)
      .eq("listing_id", parsed.data.listingId);
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
}
