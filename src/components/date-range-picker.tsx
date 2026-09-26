"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import {
  countNights,
  formatStayDate,
  getTodayIso,
} from "@/lib/reservation-utils";

type DateField = "checkIn" | "checkOut";

type DateRangePickerProps = {
  availabilityStatus?: "idle" | "loading" | "ready" | "error";
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  onVisibleRangeChange?: (startDate: string, endDate: string) => void;
  maxNights?: number;
  namePrefix?: string;
  label?: string;
  compact?: boolean;
  showHint?: boolean;
  unavailableDates?: string[];
};

export function DateRangePicker({
  availabilityStatus = "idle",
  checkIn,
  checkOut,
  onChange,
  onVisibleRangeChange,
  maxNights = 30,
  namePrefix,
  label = "Stay dates",
  compact = false,
  showHint = true,
  unavailableDates = [],
}: DateRangePickerProps) {
  const minimumDate = getTodayIso();
  const pickerRef = useRef<HTMLDivElement>(null);
  const checkInButtonRef = useRef<HTMLButtonElement>(null);
  const checkOutButtonRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<DateField>("checkIn");
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(parseDate(checkIn) ?? parseDate(minimumDate) ?? new Date()),
  );

  useEffect(() => {
    function restoreTriggerFocus() {
      const trigger =
        activeField === "checkIn" ? checkInButtonRef.current : checkOutButtonRef.current;
      trigger?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      if (isOpen && !pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isOpen && event.key === "Escape") {
        setIsOpen(false);
        restoreTriggerFocus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeField, isOpen]);

  const monthCells = useMemo(() => getMonthCells(viewMonth), [viewMonth]);
  const unavailableDateSet = useMemo(
    () => new Set(unavailableDates),
    [unavailableDates],
  );
  const visibleRange = useMemo(
    () => ({
      endDate: toIsoDate(addDays(monthCells[monthCells.length - 1], 1)),
      startDate: toIsoDate(monthCells[0]),
    }),
    [monthCells],
  );
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(viewMonth);

  useEffect(() => {
    if (!isOpen || !onVisibleRangeChange) {
      return;
    }

    onVisibleRangeChange(visibleRange.startDate, visibleRange.endDate);
  }, [isOpen, onVisibleRangeChange, visibleRange.endDate, visibleRange.startDate]);

  function openField(field: DateField) {
    setActiveField(field);
    setIsOpen(true);
    const selectedDate = field === "checkIn" ? checkIn : checkOut;
    const parsed = parseDate(selectedDate);
    if (parsed) {
      setViewMonth(startOfMonth(parsed));
    }
  }

  function selectDate(isoDate: string) {
    if (
      isDisabledDate(
        isoDate,
        activeField,
        checkIn,
        maxNights,
        minimumDate,
        unavailableDateSet,
      )
    ) {
      return;
    }

    if (activeField === "checkIn" || !checkIn || checkOut) {
      onChange(isoDate, "");
      setActiveField("checkOut");
      return;
    }

    if (isoDate <= checkIn) {
      onChange(isoDate, "");
      setActiveField("checkOut");
      return;
    }

    onChange(checkIn, isoDate);
    setIsOpen(false);
  }

  const dateHint = checkIn && checkOut
    ? `${formatStayDate(checkIn)} to ${formatStayDate(checkOut)}`
    : checkIn
      ? `${formatStayDate(checkIn)} · choose check-out`
      : "Add dates";

  return (
    <div ref={pickerRef} className={clsx("relative", compact ? "min-w-0" : "w-full")}>
      {label && <span className="field-label">{label}</span>}
      <div className={clsx("grid gap-2", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <button
          ref={checkInButtonRef}
          type="button"
          aria-expanded={isOpen && activeField === "checkIn"}
          aria-controls={isOpen ? dialogId : undefined}
          aria-haspopup="dialog"
          className={clsx(
            "flex min-h-[3.25rem] min-w-0 items-center gap-2 rounded-2xl border bg-white px-3 text-left transition hover:border-[#ff385c]",
            isOpen && activeField === "checkIn" ? "border-[#ff385c] shadow-[0_0_0_4px_rgba(255,56,92,0.12)]" : "border-[#eadfd6]",
          )}
          onClick={() => openField("checkIn")}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[#786a60]" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[0.68rem] font-extrabold uppercase text-[#786a60]">Check in</span>
            <span className="block truncate text-sm font-extrabold text-[#201a18]">
              {checkIn ? formatStayDate(checkIn) : "Add date"}
            </span>
          </span>
        </button>
        <button
          ref={checkOutButtonRef}
          type="button"
          aria-expanded={isOpen && activeField === "checkOut"}
          aria-controls={isOpen ? dialogId : undefined}
          aria-haspopup="dialog"
          className={clsx(
            "flex min-h-[3.25rem] min-w-0 items-center gap-2 rounded-2xl border bg-white px-3 text-left transition hover:border-[#ff385c]",
            isOpen && activeField === "checkOut" ? "border-[#ff385c] shadow-[0_0_0_4px_rgba(255,56,92,0.12)]" : "border-[#eadfd6]",
          )}
          onClick={() => openField("checkOut")}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[#786a60]" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[0.68rem] font-extrabold uppercase text-[#786a60]">Check out</span>
            <span className="block truncate text-sm font-extrabold text-[#201a18]">
              {checkOut ? formatStayDate(checkOut) : "Add date"}
            </span>
          </span>
        </button>
      </div>

      {showHint && (
        <p className="mt-2 text-xs font-semibold text-[#786a60]" aria-live="polite">
          {dateHint}
        </p>
      )}

      {namePrefix && (
        <>
          <input type="hidden" name={`${namePrefix}CheckIn`} value={checkIn} required />
          <input type="hidden" name={`${namePrefix}CheckOut`} value={checkOut} required />
        </>
      )}

      {isOpen && (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="false"
          aria-label="Choose stay dates"
          className="absolute left-0 top-full z-50 mt-2 w-full min-w-0 rounded-3xl border border-[#eadfd6] bg-white p-4 shadow-[0_20px_60px_rgba(32,26,24,0.18)] sm:min-w-[360px]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-[#ff385c]">
                {activeField === "checkIn" ? "Choose check-in" : "Choose check-out"}
              </p>
              <p className="mt-1 text-lg font-extrabold tracking-tight">{monthLabel}</p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Previous month"
                disabled={isSameMonth(viewMonth, startOfMonth(parseDate(minimumDate) ?? new Date()))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfd6] hover:border-[#ff385c] disabled:cursor-not-allowed disabled:opacity-35"
                onClick={() => setViewMonth((month) => addMonths(month, -1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfd6] hover:border-[#ff385c]"
                onClick={() => setViewMonth((month) => addMonths(month, 1))}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 text-center text-[0.68rem] font-extrabold uppercase text-[#786a60]">
            {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1" role="grid" aria-label={monthLabel}>
            {monthCells.map((date) => {
              const isoDate = toIsoDate(date);
              const disabled = isDisabledDate(
                isoDate,
                activeField,
                checkIn,
                maxNights,
                minimumDate,
                unavailableDateSet,
              );
              const isSelected = isoDate === checkIn || isoDate === checkOut;
              const isInRange = Boolean(checkIn && checkOut && isoDate > checkIn && isoDate < checkOut);
              const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
              const isUnavailableNight = unavailableDateSet.has(isoDate);

              return (
                <button
                  key={isoDate}
                  type="button"
                  aria-label={formatStayDate(isoDate)}
                  disabled={disabled}
                  className={clsx(
                    "flex aspect-square items-center justify-center rounded-full text-sm font-extrabold transition",
                    !isCurrentMonth && "text-[#b9ada4]",
                    disabled && "cursor-not-allowed opacity-30",
                    isUnavailableNight && "line-through decoration-2",
                    !disabled && !isSelected && "hover:bg-[#fff3f5] hover:text-[#bd1740]",
                    isInRange && !isSelected && "rounded-none bg-[#fff3f5] text-[#bd1740]",
                    isSelected && "bg-[#201a18] text-white hover:bg-black",
                  )}
                  onClick={() => selectDate(isoDate)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <p className="mt-4 border-t border-[#eadfd6] pt-3 text-xs font-semibold leading-5 text-[#786a60]">
            {availabilityStatus === "loading"
              ? "Checking booked and host-blocked dates."
              : availabilityStatus === "error"
                ? "Calendar availability could not load; final availability is still checked before booking."
                : activeField === "checkIn"
                  ? "Past, booked, and host-blocked nights are unavailable."
                  : `Choose a stay up to ${maxNights} nights. Ranges cannot cross booked nights.`}
          </p>
        </div>
      )}
    </div>
  );
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isDisabledDate(
  isoDate: string,
  activeField: DateField,
  checkIn: string,
  maxNights: number,
  minimumDate: string,
  unavailableDateSet: Set<string>,
) {
  if (isoDate < minimumDate) {
    return true;
  }

  if (activeField === "checkIn" && unavailableDateSet.has(isoDate)) {
    return true;
  }

  if (activeField === "checkOut" && checkIn) {
    if (isoDate <= checkIn) {
      return true;
    }

    return (
      countNights(checkIn, isoDate) > maxNights ||
      rangeContainsUnavailableNight(checkIn, isoDate, unavailableDateSet)
    );
  }

  return false;
}

function rangeContainsUnavailableNight(
  startDate: string,
  endDate: string,
  unavailableDateSet: Set<string>,
) {
  for (const unavailableDate of unavailableDateSet) {
    if (unavailableDate >= startDate && unavailableDate < endDate) {
      return true;
    }
  }

  return false;
}

function getMonthCells(month: Date) {
  const firstDay = startOfMonth(month);
  const start = addDays(firstDay, -firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function toIsoDate(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value, index) => (index === 0 ? String(value).padStart(4, "0") : String(value).padStart(2, "0")))
    .join("-");
}

function isSameMonth(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
}
