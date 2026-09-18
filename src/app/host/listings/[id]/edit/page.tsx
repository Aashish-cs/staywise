import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HostEditListingForm } from "@/components/host-edit-listing-form";
import { StayWiseHeader } from "@/components/staywise-header";
import { getCurrentUserProfile, getHostListings } from "@/lib/listing-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Listing",
};

export default async function EditHostListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getCurrentUserProfile();

  if (!user || profile?.role !== "host") {
    redirect(`/auth?mode=signin&role=host&next=${encodeURIComponent(`/host/listings/${id}/edit`)}`);
  }

  const listing = (await getHostListings(user.id)).find((item) => item.id === id);

  if (!listing) {
    notFound();
  }

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
        <div className="mx-auto max-w-[1100px] px-5 py-8 lg:px-8">
          <p className="text-sm font-extrabold text-[#ff385c]">Listing management</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">
            Keep your guest-facing details accurate as the space changes.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[1100px] px-5 py-8 lg:px-8">
        <HostEditListingForm listing={listing} />
      </section>
    </main>
  );
}
