"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import {
  updateHostListingAction,
  type HostEditListingActionState,
} from "@/app/host/actions";
import type { Listing } from "@/lib/listings";

const initialState: HostEditListingActionState = {
  ok: false,
  message: "",
};

export function HostEditListingForm({ listing }: { listing: Listing }) {
  const [state, formAction, isPending] = useActionState(
    updateHostListingAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm md:p-8"
    >
      <input type="hidden" name="listingId" value={listing.id} />
      <div className="flex flex-col gap-3 border-b border-[#eadfd6] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#ff385c]">Edit listing</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{listing.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">
            Changes are checked on the server and apply only to this host-owned listing.
          </p>
        </div>
        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#eadfd6] bg-white px-4 text-sm font-extrabold hover:border-[#ff385c]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          View stay
        </Link>
      </div>

      <div className="mt-6 grid gap-5">
        <Field
          defaultValue={listing.title}
          label="Title"
          name="title"
          placeholder="A clear guest-facing title"
        />
        <label className="block">
          <span className="field-label">Description</span>
          <textarea
            name="description"
            defaultValue={listing.description}
            rows={7}
            required
            className="field-textarea"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <Field defaultValue={listing.city} label="City" name="city" placeholder="Dallas" />
          <Field
            defaultValue={listing.state}
            label="State"
            name="state"
            maxLength={2}
            placeholder="TX"
          />
          <Field
            defaultValue={listing.neighborhood}
            label="Neighborhood"
            name="neighborhood"
            placeholder="Deep Ellum"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Field
            defaultValue={listing.propertyType}
            label="Property type"
            name="propertyType"
            placeholder="Apartment"
          />
          <Field
            defaultValue={`${listing.pricePerNight}`}
            label="Nightly price"
            name="pricePerNight"
            placeholder="185"
            type="number"
          />
          <Field
            defaultValue={`${listing.capacity}`}
            label="Guests"
            name="capacity"
            placeholder="4"
            type="number"
          />
          <Field
            defaultValue={`${listing.bedrooms}`}
            label="Bedrooms"
            name="bedrooms"
            placeholder="2"
            type="number"
          />
        </div>
        <div className="max-w-[220px]">
          <Field
            defaultValue={`${listing.bathrooms}`}
            label="Bathrooms"
            name="bathrooms"
            placeholder="1.5"
            step="0.5"
            type="number"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-[#edf6f8] p-4 text-sm font-semibold leading-6 text-[#23515a]">
        Save core listing details here. Photo order, primary-photo selection, and removal are managed in the photo tools below.
      </div>

      {state.message ? (
        <div
          className={`mt-5 rounded-2xl p-4 text-sm font-extrabold ${
            state.ok ? "bg-[#e7f2e4] text-[#315d3b]" : "bg-[#fff3f5] text-[#bd1740]"
          }`}
        >
          {state.ok ? <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" /> : null}
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#eadfd6] pt-6">
        <Link
          href="/host"
          className="inline-flex h-11 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold hover:border-[#ff385c]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Saving" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  defaultValue,
  label,
  maxLength,
  name,
  placeholder,
  step,
  type = "text",
}: {
  defaultValue: string;
  label: string;
  maxLength?: number;
  name: string;
  placeholder: string;
  step?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <span className="field-shell">
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          maxLength={maxLength}
          step={step}
          required
          className="field-input"
        />
      </span>
    </label>
  );
}
