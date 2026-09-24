"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type StayWiseToast = {
  description?: string;
  durationMs?: number;
  id?: string;
  title: string;
  tone?: ToastTone;
};

type ToastItem = Required<Omit<StayWiseToast, "description">> & {
  description?: string;
};

type ActionFeedbackState = {
  ok: boolean;
  message: string;
};

const toastEventName = "staywise:toast";
const defaultDurationMs = 4600;

export function showStayWiseToast(toast: StayWiseToast) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<StayWiseToast>(toastEventName, { detail: toast }));
}

export function useToastOnActionState(
  state: ActionFeedbackState,
  {
    errorTitle,
    successTitle,
  }: {
    errorTitle: string;
    successTitle: string;
  },
) {
  useEffect(() => {
    if (!state.message) {
      return;
    }

    showStayWiseToast({
      description: state.message,
      title: state.ok ? successTitle : errorTitle,
      tone: state.ok ? "success" : "error",
    });
  }, [errorTitle, state, successTitle]);
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const activeTimers = timers.current;

    function handleToast(event: Event) {
      const detail = (event as CustomEvent<StayWiseToast>).detail;
      const id = detail.id ?? createToastId();
      const durationMs = detail.durationMs ?? defaultDurationMs;
      const toast: ToastItem = {
        durationMs,
        id,
        title: detail.title,
        tone: detail.tone ?? "info",
        ...(detail.description ? { description: detail.description } : {}),
      };

      setToasts((current) => [toast, ...current.filter((item) => item.id !== id)].slice(0, 4));

      const existingTimer = activeTimers.get(id);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
        activeTimers.delete(id);
      }, durationMs);

      activeTimers.set(id, timer);
    }

    window.addEventListener(toastEventName, handleToast);
    return () => {
      window.removeEventListener(toastEventName, handleToast);
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="StayWise notifications"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col gap-3 sm:left-auto sm:right-5 sm:w-[380px]"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === "success"
            ? CheckCircle2
            : toast.tone === "error"
              ? TriangleAlert
              : Info;

        return (
          <article
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            aria-live={toast.tone === "error" ? "assertive" : "polite"}
            className={clsx(
              "pointer-events-auto flex gap-3 rounded-[22px] border bg-white p-4 shadow-[0_18px_50px_rgba(32,26,24,0.16)]",
              toast.tone === "success" && "border-[#c9dfc3]",
              toast.tone === "error" && "border-[#f4c5d0]",
              toast.tone === "info" && "border-[#c7e4ea]",
            )}
          >
            <span
              className={clsx(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                toast.tone === "success" && "bg-[#e7f2e4] text-[#315d3b]",
                toast.tone === "error" && "bg-[#fff3f5] text-[#bd1740]",
                toast.tone === "info" && "bg-[#edf6f8] text-[#23515a]",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[#201a18]">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm font-semibold leading-6 text-[#5f5148]">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => {
                setToasts((current) => current.filter((item) => item.id !== toast.id));
                const timer = timers.current.get(toast.id);
                if (timer) {
                  window.clearTimeout(timer);
                }
                timers.current.delete(toast.id);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#786a60] hover:bg-[#f7f3ee] hover:text-[#201a18]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </article>
        );
      })}
    </div>
  );
}

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
