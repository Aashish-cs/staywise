"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavoriteAction } from "@/app/favorites/actions";

type AccountRole = "guest" | "host" | null;

type UseSavedListingsOptions = {
  accountRole: AccountRole;
  initialSavedIds: string[];
  isSignedIn: boolean;
  showSuccessMessage?: boolean;
  signInHref: string;
};

export function useSavedListings({
  accountRole,
  initialSavedIds,
  isSignedIn,
  showSuccessMessage = false,
  signInHref,
}: UseSavedListingsOptions) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState(initialSavedIds);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function isSaved(listingId: string) {
    return savedIds.includes(listingId);
  }

  function toggleSaved(listingId: string) {
    if (!isSignedIn) {
      router.push(signInHref);
      return;
    }

    if (accountRole !== "guest") {
      setNotice("Use a guest account to save stays.");
      return;
    }

    const wasSaved = savedIds.includes(listingId);
    const intent = wasSaved ? "remove" : "save";

    setSavedState(listingId, !wasSaved);
    setNotice(null);

    startTransition(() => {
      const formData = new FormData();
      formData.set("listingId", listingId);
      formData.set("intent", intent);

      void toggleFavoriteAction(formData)
        .then((result) => {
          if (result?.ok) {
            if (showSuccessMessage) {
              setNotice(result.message);
            }
            return;
          }

          setSavedState(listingId, wasSaved);
          setNotice(result?.message ?? "This saved stay change did not finish.");
        })
        .catch(() => {
          setSavedState(listingId, wasSaved);
          setNotice("This saved stay change did not finish.");
        });
    });
  }

  function setSavedState(listingId: string, shouldSave: boolean) {
    setSavedIds((current) =>
      shouldSave
        ? Array.from(new Set([...current, listingId]))
        : current.filter((savedId) => savedId !== listingId),
    );
  }

  return {
    isSaved,
    notice,
    savedIds,
    setNotice,
    toggleSaved,
  };
}
