"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchSchema, type SearchInput } from "@/lib/recommendations";
import { buildSearchQueryString } from "@/lib/search-url";

type AiSearchResponse = {
  error?: string;
  search?: Partial<SearchInput>;
  summary?: string;
};

type UseAiSearchOptions = {
  getCurrentSearch: () => SearchInput;
  onSearchApplied?: (search: SearchInput) => void;
};

export function useAiSearch({
  getCurrentSearch,
  onSearchApplied,
}: UseAiSearchOptions) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function applyAiSearch() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("Describe the stay you want first.");
      setMessage(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentSearch: getCurrentSearch(),
          prompt: trimmedPrompt,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | AiSearchResponse
        | null;

      if (!response.ok || !result?.search) {
        throw new Error(result?.error ?? "StayWise could not read that request.");
      }

      const nextSearch = searchSchema.parse(result.search);
      const query = buildSearchQueryString(nextSearch);

      onSearchApplied?.(nextSearch);
      setMessage(result.summary ?? "I updated the search from your request.");
      router.push(`/search${query ? `?${query}` : ""}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "StayWise could not read that request.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  return {
    aiError: error,
    aiMessage: message,
    aiPrompt: prompt,
    applyAiSearch,
    isAiSearching: isSearching,
    setAiPrompt: setPrompt,
  };
}
