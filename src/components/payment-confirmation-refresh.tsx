"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentConfirmationRefresh() {
  const router = useRouter();
  const [isWaiting, setIsWaiting] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 2000);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setIsWaiting(false);
    }, 30000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="mt-5 rounded-2xl bg-[#fff3f5] p-4 text-sm">
      <p role="status">
        {isWaiting
          ? "Verifying your payment with Stripe…"
          : "Payment confirmation is taking longer than usual. Check the latest status before trying checkout again."}
      </p>
      {!isWaiting && (
        <button
          type="button"
          className="mt-2 font-bold underline"
          onClick={() => router.refresh()}
        >
          Refresh payment status
        </button>
      )}
    </div>
  );
}
