import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { StayWiseHeader } from "@/components/staywise-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/listing-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile & Settings",
  description: "Manage your StayWise account details and notification preferences.",
};

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/auth?mode=signin&next=/profile");
  }

  const supabase = await createSupabaseServerClient();
  const { data: storedSettings } = supabase
    ? await supabase
        .from("profile_settings")
        .select("trip_reminder_emails, host_digest_emails, marketing_opt_in")
        .eq("profile_id", user.id)
        .maybeSingle()
    : { data: null };

  const role = profile?.role === "host" ? "host" : "guest";

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <StayWiseHeader
        actions={
          <>
            <Link
              href="/search"
              className="hidden rounded-full px-4 py-2 text-sm font-extrabold hover:bg-[#f7f3ee] sm:block"
            >
              Search stays
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold shadow-sm hover:border-[#ff385c]"
            >
              My trips
            </Link>
          </>
        }
      />

      <section className="border-b border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
          <p className="text-sm font-extrabold text-[#ff385c]">Account settings</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Profile & settings
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#5f5148]">
            Make your StayWise account feel like yours, then keep exploring better stays.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
        <ProfileSettingsForm
          email={user.email ?? profile?.email ?? ""}
          fullName={profile?.full_name ?? user.user_metadata?.full_name ?? ""}
          role={role}
          settings={{
            tripReminderEmails: storedSettings?.trip_reminder_emails ?? true,
            hostDigestEmails: storedSettings?.host_digest_emails ?? true,
            marketingOptIn: storedSettings?.marketing_opt_in ?? false,
          }}
        />
      </section>
    </main>
  );
}
