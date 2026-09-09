"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CheckCircle2, Heart, Share2 } from "lucide-react";
import { toggleFavoriteAction } from "@/app/favorites/actions";

export function ListingActions({
  accountRole,
  initialSaved,
  isSignedIn,
  listingId,
  listingTitle,
  signInHref,
}: {
  accountRole: "guest" | "host" | null;
  initialSaved: boolean;
  isSignedIn: boolean;
  listingId: string;
  listingTitle: string;
  signInHref: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggleSaved() {
    if (!isSignedIn) {
      router.push(signInHref);
      return;
    }

    if (accountRole !== "guest") {
      setMessage("Use a guest account to save stays.");
      return;
    }

    const wasSaved = saved;
    const intent = wasSaved ? "remove" : "save";
    setSaved(!wasSaved);
    setMessage(null);

    startTransition(() => {
      const formData = new FormData();
      formData.set("listingId", listingId);
      formData.set("intent", intent);
      void toggleFavoriteAction(formData)
        .then((result) => {
          if (result?.ok) {
            setMessage(result.message);
            return;
          }

          setSaved(wasSaved);
          setMessage(result?.message ?? "This saved stay change did not finish.");
        })
        .catch(() => {
          setSaved(wasSaved);
          setMessage("This saved stay change did not finish.");
        });
    });
  }

  async function shareListing() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: listingTitle,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setMessage("Listing link copied.");
    } catch {
      setMessage("Copy this page URL from your browser.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={clsx(
            "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-extrabold transition hover:border-[#ff385c] hover:text-[#df2348]",
            saved
              ? "border-[#ff385c] bg-[#fff3f5] text-[#df2348]"
              : "border-[#eadfd6] bg-white text-[#201a18]",
          )}
          aria-pressed={saved}
          onClick={toggleSaved}
        >
          <Heart
            className={clsx("h-4 w-4", saved && "fill-[#ff385c]")}
            aria-hidden="true"
          />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eadfd6] bg-white px-4 text-sm font-extrabold transition hover:border-[#ff385c] hover:text-[#df2348]"
          onClick={shareListing}
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share
        </button>
      </div>

      {message && (
        <p className="inline-flex items-center gap-2 rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-extrabold text-[#5f5148]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#315d3b]" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}
