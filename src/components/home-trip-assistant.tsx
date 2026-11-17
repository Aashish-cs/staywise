"use client";

import { Sparkles } from "lucide-react";
import { useAiSearch } from "@/hooks/use-ai-search";
import type { SearchInput } from "@/lib/recommendations";

const exampleRequests = [
  "Dallas for 2 people under $250 with Wi-Fi and parking",
  "A family stay in Fort Worth for 4 with a kitchen",
  "A remote work stay in Austin with Wi-Fi and a workspace",
];

export function HomeTripAssistant({
  getCurrentSearch,
}: {
  getCurrentSearch: () => SearchInput;
}) {
  const { aiPrompt, setAiPrompt, applyAiSearch, isAiSearching, aiError } =
    useAiSearch({ getCurrentSearch });

  return (
    <section
      aria-labelledby="trip-assistant-title"
      className="mx-auto max-w-[1760px] px-5 py-8 lg:px-8"
    >
      <div className="rounded-3xl border border-[#eadfd6] bg-[#fff8f5] p-5 md:p-7">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#df2348]" aria-hidden="true" />
          <h2 id="trip-assistant-title" className="text-xl font-extrabold">
            Describe your ideal stay
          </h2>
        </div>
        <p className="mt-2 text-sm text-[#5f5148]">
          Tell us where you’re going, your budget, and what you need. Review
          your filters and compare matching stays.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 md:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void applyAiSearch();
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">Describe your ideal stay</span>
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              maxLength={500}
              minLength={3}
              required
              disabled={isAiSearching}
              rows={2}
              placeholder="A Dallas stay for 2 under $250 a night, with Wi-Fi and parking"
              className="field-textarea w-full resize-y bg-white"
            />
          </label>
          <button
            type="submit"
            disabled={isAiSearching}
            className="self-stretch rounded-2xl bg-[#201a18] px-6 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60 md:self-center"
          >
            {isAiSearching ? "Finding your filters…" : "Find my stay"}
          </button>
        </form>
        <div
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Example trip requests"
        >
          {exampleRequests.map((request) => (
            <button
              key={request}
              type="button"
              disabled={isAiSearching}
              onClick={() => setAiPrompt(request)}
              className="rounded-full border border-[#eadfd6] bg-white px-3 py-2 text-left text-xs font-semibold hover:border-[#df2348] disabled:opacity-60"
            >
              {request}
            </button>
          ))}
        </div>
        {isAiSearching && (
          <p role="status" className="mt-3 text-sm text-[#5f5148]">
            Reading your trip request…
          </p>
        )}
        {aiError && (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#bd1740]">
            {aiError}
          </p>
        )}
      </div>
    </section>
  );
}
