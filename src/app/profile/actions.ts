"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  ok: boolean;
  message: string;
};

const profileSchema = z.object({
  fullName: z.string().trim().max(80).transform((value) => value || null),
  tripReminderEmails: z.boolean(),
  hostDigestEmails: z.boolean(),
  marketingOptIn: z.boolean(),
});

export async function updateProfileAction(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void _state;
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    tripReminderEmails: formData.get("tripReminderEmails") === "on",
    hostDigestEmails: formData.get("hostDigestEmails") === "on",
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check your profile details and try again.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured for profile settings yet.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sign in before updating your profile.",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    console.error("Unable to update StayWise profile", profileError);
    return {
      ok: false,
      message: "Your profile could not be saved. Try again.",
    };
  }

  const { error: settingsError } = await supabase.from("profile_settings").upsert(
    {
      profile_id: user.id,
      trip_reminder_emails: parsed.data.tripReminderEmails,
      host_digest_emails: parsed.data.hostDigestEmails,
      marketing_opt_in: parsed.data.marketingOptIn,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  );

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/host");
  revalidatePath("/host/onboarding");
  revalidatePath("/profile");

  if (settingsError) {
    console.warn("Profile saved, but notification settings are unavailable", settingsError);
    return {
      ok: true,
      message: "Profile saved. Notification preferences will activate after the settings migration is applied.",
    };
  }

  return {
    ok: true,
    message: "Your StayWise profile and preferences are saved.",
  };
}
