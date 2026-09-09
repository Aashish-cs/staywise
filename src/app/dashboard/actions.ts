"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const cancelSchema = z.object({
  reservationId: z.string().uuid(),
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
}
