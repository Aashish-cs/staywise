"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavoriteAction } from "@/app/favorites/actions";
import { showStayWiseToast } from "@/components/ui/toast";

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
      showStayWiseToast({
        description: "Create or sign in to a guest account before saving stays.",
        title: "Sign in required",
        tone: "info",
      });
      router.push(signInHref);
      return;
    }

    if (accountRole !== "guest") {
      const message = "Use a guest account to save stays.";
      setNotice(message);
      showStayWiseToast({
        description: message,
        title: "Saved stays are guest-only",
        tone: "error",
      });
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
            showStayWiseToast({
              description: result.message,
              title: intent === "save" ? "Stay saved" : "Saved stay removed",
              tone: "success",
            });
            return;
          }

          setSavedState(listingId, wasSaved);
          const message = result?.message ?? "This saved stay change did not finish.";
          setNotice(message);
          showStayWiseToast({
            description: message,
            title: "Saved stay did not update",
            tone: "error",
          });
        })
        .catch(() => {
          setSavedState(listingId, wasSaved);
          const message = "This saved stay change did not finish.";
          setNotice(message);
          showStayWiseToast({
            description: message,
            title: "Saved stay did not update",
            tone: "error",
          });
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
