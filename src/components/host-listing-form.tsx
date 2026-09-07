"use client";

import { useActionState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import {
  createHostListingAction,
  type HostListingActionState,
} from "@/app/host/actions";

const initialState: HostListingActionState = {
  ok: false,
  message: "",
};

export function HostListingForm() {
  const [state, formAction, isPending] = useActionState(
    createHostListingAction,
    initialState,
  );

  return (
    <form action={formAction} className="rounded-[24px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ff385c]">New listing</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Publish a real StayWise stay
          </h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#5f5148]">
          Host only
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextField name="title" label="Title" placeholder="Dallas skyline apartment with workspace" />
        <TextField name="propertyType" label="Type" placeholder="Apartment" />
        <TextField name="city" label="City" placeholder="Dallas" />
        <TextField name="state" label="State" placeholder="TX" />
        <TextField name="neighborhood" label="Neighborhood" placeholder="Deep Ellum" />
        <TextField name="pricePerNight" label="Nightly price" placeholder="185" type="number" />
        <TextField name="capacity" label="Guests" placeholder="4" type="number" />
        <TextField name="bedrooms" label="Bedrooms" placeholder="2" type="number" />
        <TextField name="bathrooms" label="Bathrooms" placeholder="1.5" type="number" step="0.5" />
        <TextField
          name="imageUrl"
          label="Image URL"
          placeholder="https://images.unsplash.com/photo-..."
        />
      </div>

      <label className="mt-4 block">
        <span className="field-label">Description</span>
        <textarea
          name="description"
          className="field-textarea"
          placeholder="Describe the stay, neighborhood, workspace, parking, and guest experience."
          rows={4}
          required
        />
      </label>

      <label className="mt-4 block">
        <span className="field-label">Amenities</span>
        <textarea
          name="amenities"
          className="field-textarea"
          placeholder="Fast Wi-Fi, Workspace, Kitchen, Parking, Self check-in"
          rows={3}
          required
        />
      </label>

      {state.message && (
        <p
          className={`mt-4 rounded-2xl p-3 text-sm font-semibold ${
            state.ok ? "bg-[#e7f2e4] text-[#315d3b]" : "bg-[#fff3f5] text-[#bd1740]"
          }`}
        >
          {state.ok && <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />}
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white hover:bg-[#df2348] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Publishing" : "Publish listing"}
      </button>
    </form>
  );
}

function TextField({
  name,
  label,
  placeholder,
  type = "text",
  step,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <span className="field-shell">
        <input
          name={name}
          type={type}
          step={step}
          className="field-input"
          placeholder={placeholder}
          required
        />
      </span>
    </label>
  );
}
