"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import clsx from "clsx";

export type GuestSelection = {
  adults: number;
  childGuests: number;
  infants: number;
  pets: number;
};

type GuestSelectorProps = GuestSelection & {
  maxGuests?: number;
  label?: string;
  compact?: boolean;
  onChange: (selection: GuestSelection) => void;
};

export function GuestSelector({
  adults,
  childGuests,
  infants,
  pets,
  maxGuests = 16,
  label = "Guests",
  compact = false,
  onChange,
}: GuestSelectorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const selectedAdults = clamp(adults, 1, maxGuests);
  const selection: GuestSelection = {
    adults: selectedAdults,
    childGuests: clamp(childGuests, 0, maxGuests - selectedAdults),
    infants: clamp(infants, 0, 5),
    pets: clamp(pets, 0, 5),
  };

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (isOpen && !rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isOpen && event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const totalGuests = selection.adults + selection.childGuests;

  function adjust(field: keyof GuestSelection, amount: number) {
    const minimum = field === "adults" ? 1 : 0;
    const maximum =
      field === "infants" || field === "pets"
        ? 5
        : field === "adults"
          ? maxGuests - selection.childGuests
          : maxGuests - selection.adults;
    const nextValue = clamp(selection[field] + amount, minimum, maximum);

    if (nextValue === selection[field]) {
      return;
    }

    const next = { ...selection, [field]: nextValue };
    if (next.adults + next.childGuests > maxGuests) {
      return;
    }
    onChange(next);
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      {label && (
        <span className={clsx("field-label", compact && "mb-0 px-5 pt-4")}>
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={isOpen ? dialogId : undefined}
        aria-haspopup="dialog"
        className={clsx(
          "flex w-full items-center gap-3 text-left transition",
          compact
            ? clsx(
                "min-h-[3.25rem] px-5 hover:bg-[#fff8f9]",
                label ? "pb-4 pt-2" : "py-4",
              )
            : "min-h-[3.25rem] rounded-2xl border border-[#eadfd6] bg-white px-3 hover:border-[#ff385c]",
        )}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Users className="h-4 w-4 shrink-0 text-[#786a60]" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-extrabold">
            {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
          </span>
          <span className="block truncate text-xs font-semibold text-[#786a60]">
            {selection.infants + selection.pets > 0
              ? `${selection.infants + selection.pets} extras`
              : `${maxGuests} max`}
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="false"
          aria-label="Choose guests"
          className="absolute right-0 top-full z-50 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-3xl border border-[#eadfd6] bg-white p-4 shadow-[0_20px_60px_rgba(32,26,24,0.18)]"
        >
          <p className="text-sm font-extrabold text-[#ff385c]">Who is coming?</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#786a60]">
            Adults and children count toward this stay&apos;s guest limit.
          </p>
          <div className="mt-4 divide-y divide-[#f0e7df]">
            <GuestRow
              title="Adults"
              body="Ages 13 or above"
              value={selection.adults}
              minimum={1}
              onDecrease={() => adjust("adults", -1)}
              onIncrease={() => adjust("adults", 1)}
            />
            <GuestRow
              title="Children"
              body="Ages 2-12"
              value={selection.childGuests}
              minimum={0}
              onDecrease={() => adjust("childGuests", -1)}
              onIncrease={() => adjust("childGuests", 1)}
            />
            <GuestRow
              title="Infants"
              body="Under 2"
              value={selection.infants}
              minimum={0}
              onDecrease={() => adjust("infants", -1)}
              onIncrease={() => adjust("infants", 1)}
            />
            <GuestRow
              title="Pets"
              body="Bringing a service animal?"
              value={selection.pets}
              minimum={0}
              onDecrease={() => adjust("pets", -1)}
              onIncrease={() => adjust("pets", 1)}
            />
          </div>
          <p
            className="mt-4 border-t border-[#eadfd6] pt-3 text-xs font-semibold text-[#786a60]"
            aria-live="polite"
          >
            {totalGuests} {totalGuests === 1 ? "guest" : "guests"} ·{" "}
            {selection.infants} infants · {selection.pets} pets
          </p>
        </div>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function GuestRow({
  title,
  body,
  value,
  minimum,
  onDecrease,
  onIncrease,
}: {
  title: string;
  body: string;
  value: number;
  minimum: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <span>
        <span className="block text-sm font-extrabold">{title}</span>
        <span className="mt-1 block text-xs font-semibold text-[#786a60]">{body}</span>
      </span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${title}`}
          title={`Decrease ${title}`}
          disabled={value <= minimum}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cbc1] disabled:cursor-not-allowed disabled:opacity-35"
          onClick={onDecrease}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="w-5 text-center text-sm font-extrabold">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${title}`}
          title={`Increase ${title}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cbc1] hover:border-[#ff385c]"
          onClick={onIncrease}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}
