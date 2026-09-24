import type { Metadata } from "next";
import Link from "next/link";
import { HostOnboardingPanel } from "@/components/host-onboarding-panel";
import { StayWiseHeader } from "@/components/staywise-header";
import { getCurrentUserProfile } from "@/lib/listing-data";
import { noIndexRobots } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Become a Host",
  description:
    "Activate StayWise host tools before creating real listings and managing reservations.",
  robots: noIndexRobots,
};

export default async function HostOnboardingPage() {
  const { user, profile } = await getCurrentUserProfile();

  return (
    <main className="min-h-screen bg-white text-[#201a18]">
      <StayWiseHeader
        actions={
          <Link
            href="/host"
            className="rounded-full border border-[#eadfd6] bg-white px-4 py-2 text-sm font-extrabold hover:border-[#ff385c]"
          >
            Host workspace
          </Link>
        }
      />

      <section className="border-b border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
          <p className="text-sm font-extrabold text-[#ff385c]">Become a host</p>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148]">
            A short setup before listing creation keeps the hosting workflow intentional and
            connected to a verified account.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
        {user ? (
          profile?.role === "host" ? (
            <section className="rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-8 shadow-sm">
              <p className="text-sm font-extrabold text-[#315d3b]">Host tools active</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Your host workspace is ready.
              </h1>
              <Link
                href="/host"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
              >
                Open host workspace
              </Link>
            </section>
          ) : (
            <HostOnboardingPanel email={user.email} fullName={profile?.full_name} />
          )
        ) : (
          <section className="rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-8 shadow-sm">
            <p className="text-sm font-extrabold text-[#ff385c]">Verified account required</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Sign in before becoming a host.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148]">
              Hosting is connected to a verified account so listing ownership and reservations
              remain private to the right person.
            </p>
            <Link
              href="/auth?mode=signin&role=host&next=%2Fhost%2Fonboarding"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black"
            >
              Sign in to continue
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
