"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  DollarSign,
  Home,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  createHostListingAction,
  type HostListingActionState,
} from "@/app/host/actions";
import { useToastOnActionState } from "@/components/ui/toast";

const initialState: HostListingActionState = {
  ok: false,
  message: "",
};

type ListingDraft = {
  amenities: string;
  bathrooms: string;
  bedrooms: string;
  capacity: string;
  city: string;
  description: string;
  imageUrls: string;
  neighborhood: string;
  pricePerNight: string;
  propertyType: string;
  state: string;
  title: string;
};

const initialDraft: ListingDraft = {
  amenities: "Fast Wi-Fi, Workspace, Kitchen, Parking, Self check-in",
  bathrooms: "",
  bedrooms: "",
  capacity: "",
  city: "",
  description: "",
  imageUrls: "",
  neighborhood: "",
  pricePerNight: "",
  propertyType: "Apartment",
  state: "",
  title: "",
};

export function HostListingForm() {
  const [state, formAction, isPending] = useActionState(
    createHostListingAction,
    initialState,
  );
  const [draft, setDraft] = useState<ListingDraft>(initialDraft);
  const [step, setStep] = useState(0);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const imageUrls = useMemo(() => parseDraftUrls(draft.imageUrls), [draft.imageUrls]);
  const amenities = useMemo(
    () =>
      draft.amenities
        .split(",")
        .map((amenity) => amenity.trim())
        .filter(Boolean),
    [draft.amenities],
  );
  const qualityItems = useMemo(
    () => buildQualityItems(draft, imageUrls.length + selectedImageFiles.length, amenities),
    [amenities, draft, imageUrls.length, selectedImageFiles.length],
  );
  const completedQualityItems = qualityItems.filter((item) => item.done).length;
  const qualityScore = Math.round((completedQualityItems / qualityItems.length) * 100);

  function updateDraft<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    const savedDraft = window.localStorage.getItem("staywise-host-listing-draft");

    if (!savedDraft) {
      return;
    }

    try {
      // Hydrate the browser-only draft after SSR so the initial HTML stays stable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft({ ...initialDraft, ...(JSON.parse(savedDraft) as Partial<ListingDraft>) });
    } catch {
      window.localStorage.removeItem("staywise-host-listing-draft");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("staywise-host-listing-draft", JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    if (state.ok) {
      window.localStorage.removeItem("staywise-host-listing-draft");
    }
  }, [state.ok]);

  useToastOnActionState(state, {
    errorTitle: "Listing was not published",
    successTitle: "Listing published",
  });

  const stepReady = [
    draft.title.trim().length >= 8 && draft.description.trim().length >= 24,
    Boolean(draft.city.trim() && draft.state.trim() && draft.neighborhood.trim()),
    Number(draft.pricePerNight) >= 50 &&
      Number(draft.capacity) >= 1 &&
      Number(draft.bedrooms) >= 0 &&
      Number(draft.bathrooms) >= 0.5,
    imageUrls.length + selectedImageFiles.length >= 1 && amenities.length >= 1,
    qualityScore >= 70,
  ];

  const steps = ["Basics", "Location", "Pricing", "Amenities", "Review"];

  return (
    <form
      action={formAction}
      className="rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#ff385c]">New listing</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">
            Publish a StayWise stay
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148]">
            Add the basics, location, pricing, amenities, and photos. The preview and
            quality checklist update while you work.
          </p>
        </div>
        <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-[#5f5148] shadow-sm">
          <BadgeCheck className="h-4 w-4 text-[#315d3b]" aria-hidden="true" />
          Host only
        </span>
      </div>

      <ol className="mt-6 grid grid-cols-5 gap-2" aria-label="Listing creation steps">
        {steps.map((label, index) => {
          const isCurrent = index === step;
          const isCompleted = index < step;
          const isLocked = index > step;
          const stateLabel = isCurrent
            ? "current step"
            : isCompleted
              ? "completed step"
              : "locked step";

          return (
            <li key={label}>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setStep(index)}
                className={`w-full border-t-4 pt-2 text-left text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
                  isCurrent
                    ? "border-[#ff385c] text-[#201a18]"
                    : isCompleted
                      ? "border-[#315d3b] text-[#315d3b]"
                      : "border-[#eadfd6] text-[#786a60]"
                }`}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${label}, ${stateLabel}`}
              >
                <span className="mr-1">{index + 1}.</span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className={step === 0 ? "" : "hidden"}>
            <FormSection
            icon={Home}
            kicker="Step 1"
            title="Basics"
            body="Name the stay clearly so guests understand the place before opening the listing."
            >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                name="title"
                label="Title"
                placeholder="Dallas skyline apartment with workspace"
                value={draft.title}
                onChange={(value) => updateDraft("title", value)}
              />
              <TextField
                name="propertyType"
                label="Type"
                placeholder="Apartment"
                value={draft.propertyType}
                onChange={(value) => updateDraft("propertyType", value)}
              />
            </div>
            <TextareaField
              name="description"
              label="Description"
              placeholder="Describe the stay, neighborhood, workspace, parking, and guest experience."
              rows={5}
              value={draft.description}
              onChange={(value) => updateDraft("description", value)}
            />
            </FormSection>
          </div>

          <div className={step === 1 ? "" : "hidden"}>
            <FormSection
            icon={MapPin}
            kicker="Step 2"
            title="Location"
            body="Keep the location specific enough for search and recommendations."
            >
            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                name="city"
                label="City"
                placeholder="Dallas"
                value={draft.city}
                onChange={(value) => updateDraft("city", value)}
              />
              <TextField
                name="state"
                label="State"
                placeholder="TX"
                maxLength={2}
                value={draft.state}
                onChange={(value) => updateDraft("state", value.toUpperCase())}
              />
              <TextField
                name="neighborhood"
                label="Neighborhood"
                placeholder="Deep Ellum"
                value={draft.neighborhood}
                onChange={(value) => updateDraft("neighborhood", value)}
              />
            </div>
            </FormSection>
          </div>

          <div className={step === 2 ? "" : "hidden"}>
            <FormSection
            icon={DollarSign}
            kicker="Step 3"
            title="Pricing and capacity"
            body="These values are used by search ranking, reservation totals, and guest filters."
            >
            <div className="grid gap-4 md:grid-cols-4">
              <TextField
                name="pricePerNight"
                label="Nightly price"
                placeholder="185"
                type="number"
                value={draft.pricePerNight}
                onChange={(value) => updateDraft("pricePerNight", value)}
              />
              <TextField
                name="capacity"
                label="Guests"
                placeholder="4"
                type="number"
                value={draft.capacity}
                onChange={(value) => updateDraft("capacity", value)}
              />
              <TextField
                name="bedrooms"
                label="Bedrooms"
                placeholder="2"
                type="number"
                value={draft.bedrooms}
                onChange={(value) => updateDraft("bedrooms", value)}
              />
              <TextField
                name="bathrooms"
                label="Bathrooms"
                placeholder="1.5"
                step="0.5"
                type="number"
                value={draft.bathrooms}
                onChange={(value) => updateDraft("bathrooms", value)}
              />
            </div>
            </FormSection>
          </div>

          <div className={step === 3 ? "" : "hidden"}>
            <FormSection
            icon={Sparkles}
            kicker="Step 4"
            title="Amenities and photos"
            body="Use comma-separated amenities and put each image URL on its own line."
            >
            <TextareaField
              name="amenities"
              label="Amenities"
              placeholder="Fast Wi-Fi, Workspace, Kitchen, Parking, Self check-in"
              rows={3}
              value={draft.amenities}
              onChange={(value) => updateDraft("amenities", value)}
            />
            <TextareaField
              name="imageUrls"
              label="Image URLs"
              placeholder={`https://images.unsplash.com/photo-...\nhttps://images.unsplash.com/photo-...`}
              rows={4}
              required={false}
              value={draft.imageUrls}
              onChange={(value) => updateDraft("imageUrls", value)}
            />
            <label className="block">
              <span className="field-label">Upload photos</span>
              <input
                type="file"
                name="imageFiles"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                onChange={(event) => setSelectedImageFiles(Array.from(event.target.files ?? []))}
                className="block w-full rounded-2xl border border-dashed border-[#d7c8bd] bg-[#fbfaf8] px-4 py-4 text-sm font-semibold text-[#5f5148] file:mr-4 file:rounded-full file:border-0 file:bg-[#201a18] file:px-4 file:py-2 file:font-extrabold file:text-white"
              />
              <span className="mt-2 block text-xs font-semibold text-[#786a60]">
                Up to six JPEG, PNG, WebP, or HEIC files. Each file must be under 8 MB.
                {selectedImageFiles.length > 0
                  ? ` ${selectedImageFiles.length} file${selectedImageFiles.length === 1 ? "" : "s"} selected.`
                  : ""}
              </span>
            </label>
            </FormSection>
          </div>

          <div className={step === 4 ? "" : "hidden"}>
            <FormSection
              icon={CheckCircle2}
              kicker="Step 5"
              title="Review and publish"
              body="Check the guest-facing preview and quality checklist before publishing."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Title", draft.title || "Missing"],
                  ["Location", `${draft.neighborhood || "Missing"}, ${draft.city || ""} ${draft.state || ""}`],
                  ["Price", draft.pricePerNight ? `$${draft.pricePerNight} per night` : "Missing"],
                  ["Photos", `${imageUrls.length} ready`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7f3ee] p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#786a60]">{label}</p>
                    <p className="mt-2 text-sm font-extrabold">{value}</p>
                  </div>
                ))}
              </div>
              <p className="rounded-2xl bg-[#edf6f8] p-4 text-sm font-semibold leading-6 text-[#23515a]">
                Publishing creates a real active listing owned by this host account. Guests will
                see it in search only after the server validates every field.
              </p>
            </FormSection>
          </div>
        </div>

        <aside className="self-start xl:sticky xl:top-24">
          <ListingPreview draft={draft} imageUrls={imageUrls} amenities={amenities} />
          <QualityChecklist items={qualityItems} score={qualityScore} />
        </aside>
      </div>

      {state.message && (
        <div
          role={state.ok ? "status" : "alert"}
          className={`mt-5 rounded-[22px] p-4 text-sm font-extrabold ${
            state.ok ? "bg-[#e7f2e4] text-[#315d3b]" : "bg-[#fff3f5] text-[#bd1740]"
          }`}
        >
          {state.ok && <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />}
          {state.message}
          {state.ok && state.listingId && (
            <Link
              href={`/listings/${state.listingId}`}
              className="ml-3 inline-flex underline decoration-2 underline-offset-4"
            >
              Open listing
            </Link>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-[#eadfd6] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[#786a60]">
          Step {step + 1} of {steps.length} · Quality score: {" "}
          <span className="font-extrabold text-[#201a18]">{qualityScore}%</span>
        </p>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold hover:border-[#ff385c]"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={!stepReady[step]}
              aria-describedby={!stepReady[step] ? "host-step-status" : undefined}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#201a18] px-6 text-sm font-extrabold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <Plus className="h-4 w-4 rotate-45" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending || !stepReady[step]}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ff385c] px-6 text-sm font-extrabold text-white hover:bg-[#df2348] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Publishing" : "Publish listing"}
            </button>
          )}
        </div>
      </div>
      <p id="host-step-status" className="sr-only" aria-live="polite">
        {stepReady[step]
          ? "This step is complete."
          : "Finish the required fields before continuing."}
      </p>
    </form>
  );
}

function FormSection({
  body,
  children,
  icon: Icon,
  kicker,
  title,
}: {
  body: string;
  children: React.ReactNode;
  icon: typeof Home;
  kicker: string;
  title: string;
}) {
  return (
    <section className="rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff3f5] text-[#ff385c]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase text-[#ff385c]">{kicker}</p>
          <h3 className="mt-1 text-xl font-extrabold tracking-tight">{title}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">{body}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function ListingPreview({
  amenities,
  draft,
  imageUrls,
}: {
  amenities: string[];
  draft: ListingDraft;
  imageUrls: string[];
}) {
  const previewImage = imageUrls[0];
  const title = draft.title.trim() || "Listing title preview";
  const city = draft.city.trim() || "City";
  const state = draft.state.trim() || "ST";
  const price = Number(draft.pricePerNight);

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#eadfd6] bg-white shadow-sm">
      <div
        className="relative aspect-[4/3] bg-[#e8dfd6] bg-cover bg-center"
        style={previewImage ? { backgroundImage: `url("${previewImage.replaceAll('"', "%22")}")` } : undefined}
      >
        {!previewImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#786a60]">
            <Camera className="h-9 w-9" aria-hidden="true" />
            <p className="mt-3 text-sm font-extrabold">Image preview</p>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold shadow-sm">
          Draft preview
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-sm font-extrabold">{title}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#786a60]">
              <MapPin className="h-4 w-4 text-[#ff385c]" aria-hidden="true" />
              {city}, {state}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-extrabold">
            <CheckCircle2 className="h-4 w-4 text-[#315d3b]" aria-hidden="true" />
            New
          </span>
        </div>
        <p className="mt-3 text-sm">
          <span className="font-extrabold">
            {price ? `$${price}` : "$0"}
          </span>{" "}
          night · {draft.capacity || "0"} guests
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148]"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function QualityChecklist({
  items,
  score,
}: {
  items: { done: boolean; label: string }[];
  score: number;
}) {
  return (
    <section className="mt-4 rounded-[24px] border border-[#eadfd6] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-[#ff385c]">Listing quality</p>
          <h3 className="mt-1 text-2xl font-extrabold tracking-tight">{score}%</h3>
        </div>
        <div className="h-14 w-14 rounded-full border-[6px] border-[#ff385c] bg-[#fff3f5]" />
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex gap-3">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                item.done ? "bg-[#e7f2e4] text-[#315d3b]" : "bg-[#f7f3ee] text-[#9b8f87]"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <p className="text-sm font-extrabold leading-6 text-[#5f5148]">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TextField({
  label,
  maxLength,
  name,
  onChange,
  placeholder,
  step,
  type = "text",
  value,
}: {
  label: string;
  maxLength?: number;
  name: keyof ListingDraft;
  onChange: (value: string) => void;
  placeholder: string;
  step?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <span className="field-shell">
        <input
          name={name}
          type={type}
          step={step}
          maxLength={maxLength}
          className="field-input"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
      </span>
    </label>
  );
}

function TextareaField({
  label,
  name,
  onChange,
  placeholder,
  rows,
  required = true,
  value,
}: {
  label: string;
  name: keyof ListingDraft;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  rows: number;
  value: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <textarea
        name={name}
        className="field-textarea"
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function parseDraftUrls(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("https://") || item.startsWith("http://"))
    .slice(0, 6);
}

function buildQualityItems(
  draft: ListingDraft,
  imageCount: number,
  amenities: string[],
) {
  const price = Number(draft.pricePerNight);
  const capacity = Number(draft.capacity);

  return [
    {
      done: draft.title.trim().length >= 12,
      label: "Clear title with at least 12 characters",
    },
    {
      done: draft.description.trim().length >= 80,
      label: "Detailed description with neighborhood and guest experience",
    },
    {
      done: Boolean(draft.city.trim() && draft.state.trim() && draft.neighborhood.trim()),
      label: "City, state, and neighborhood are filled",
    },
    {
      done: Number.isFinite(price) && price >= 50,
      label: "Nightly price is realistic",
    },
    {
      done: Number.isFinite(capacity) && capacity >= 1,
      label: "Guest capacity is set",
    },
    {
      done: imageCount >= 1,
      label: "At least one image URL is ready",
    },
    {
      done: amenities.includes("Fast Wi-Fi") || amenities.includes("Self check-in"),
      label: "Key guest amenities are included",
    },
  ];
}
