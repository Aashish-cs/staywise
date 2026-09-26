"use client";

import { useState } from "react";
import { ArrowRight, CreditCard } from "lucide-react";

export function PaymentCheckoutButton({
  className = "",
  reservationId,
}: {
  className?: string;
  reservationId: string;
}) {
  const [error, setError] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  async function openCheckout() {
    setError("");
    setIsOpening(true);

    try {
      const response = await fetch("/api/payments/checkout", {
        body: JSON.stringify({ reservationId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { checkoutUrl?: string; error?: string }
        | null;

      if (!response.ok || !payload?.checkoutUrl) {
        setError(payload?.error ?? "Payment checkout could not be opened.");
        return;
      }

      window.location.assign(payload.checkoutUrl);
    } catch {
      setError("Payment checkout could not be opened. Check your connection and try again.");
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openCheckout}
        disabled={isOpening}
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#df2348] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <CreditCard className="h-4 w-4" aria-hidden="true" />
        {isOpening ? "Opening checkout" : "Pay now"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
      {error && (
        <p role="alert" className="rounded-2xl bg-[#fff3f5] p-3 text-sm font-bold text-[#bd1740]">
          {error}
        </p>
      )}
    </div>
  );
}
