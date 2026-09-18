import {
  featuredAmenities,
  type Listing,
  type TripPurpose,
} from "@/lib/listings";
import { searchSchema, type SearchInput } from "@/lib/recommendations";

type FeaturedAmenity = (typeof featuredAmenities)[number];

export type NaturalLanguageSearchResult = {
  detected: string[];
  search: SearchInput;
  summary: string;
};

const llmSearchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    destination: { type: "string" },
    checkIn: { type: "string" },
    checkOut: { type: "string" },
    guests: { type: "integer", minimum: 1, maximum: 16 },
    maxNightlyBudget: { type: "integer", minimum: 50, maximum: 1200 },
    tripPurpose: {
      type: "string",
      enum: ["business", "family", "remote-work", "romantic", "solo", "group", "outdoor"],
    },
    amenities: {
      type: "array",
      items: { type: "string", enum: featuredAmenities },
    },
  },
  required: [
    "destination",
    "checkIn",
    "checkOut",
    "guests",
    "maxNightlyBudget",
    "tripPurpose",
    "amenities",
  ],
} as const;

const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const amenitySignals: Array<{
  amenity: FeaturedAmenity;
  labels: string[];
  patterns: RegExp[];
}> = [
  {
    amenity: "Fast Wi-Fi",
    labels: ["Wi-Fi"],
    patterns: [/\bwi[-\s]?fi\b/i, /\binternet\b/i, /\bfast connection\b/i],
  },
  {
    amenity: "Workspace",
    labels: ["workspace"],
    patterns: [
      /\bdesk\b/i,
      /\bworkspace\b/i,
      /\bwork space\b/i,
      /\bwork from home\b/i,
      /\bremote work\b/i,
    ],
  },
  {
    amenity: "Kitchen",
    labels: ["kitchen"],
    patterns: [/\bkitchen\b/i, /\bcook(?:ing)?\b/i],
  },
  {
    amenity: "Parking",
    labels: ["parking"],
    patterns: [/\bparking\b/i, /\bgarage\b/i, /\bdriveway\b/i],
  },
  {
    amenity: "Washer",
    labels: ["washer"],
    patterns: [/\bwasher\b/i, /\blaundry\b/i, /\bwashing machine\b/i],
  },
  {
    amenity: "Pool",
    labels: ["pool"],
    patterns: [/\bpool\b/i, /\bswim(?:ming)?\b/i],
  },
  {
    amenity: "Pet friendly",
    labels: ["pet friendly"],
    patterns: [/\bpet(?:s)?\b/i, /\bdog(?:s)?\b/i, /\bcat(?:s)?\b/i],
  },
  {
    amenity: "Self check-in",
    labels: ["self check-in"],
    patterns: [
      /\bself check[-\s]?in\b/i,
      /\bkeypad\b/i,
      /\blate arrival\b/i,
      /\bprivate\b/i,
      /\bquiet\b/i,
    ],
  },
];

const purposeSignals: Array<{
  purpose: TripPurpose;
  label: string;
  patterns: RegExp[];
}> = [
  {
    purpose: "business",
    label: "business",
    patterns: [/\bbusiness\b/i, /\bconference\b/i, /\bclient\b/i, /\bwork trip\b/i],
  },
  {
    purpose: "family",
    label: "family",
    patterns: [/\bfamily\b/i, /\bkids?\b/i, /\bchildren\b/i, /\bparents?\b/i],
  },
  {
    purpose: "remote-work",
    label: "remote work",
    patterns: [
      /\bremote\b/i,
      /\bwork from home\b/i,
      /\bworkspace\b/i,
      /\bdesk\b/i,
      /\bwi[-\s]?fi\b/i,
    ],
  },
  {
    purpose: "romantic",
    label: "romantic",
    patterns: [/\bromantic\b/i, /\bcouple\b/i, /\banniversary\b/i, /\bdate\b/i],
  },
  {
    purpose: "solo",
    label: "solo",
    patterns: [/\bsolo\b/i, /\balone\b/i],
  },
  {
    purpose: "group",
    label: "group",
    patterns: [/\bgroup\b/i, /\bfriends?\b/i, /\bcrew\b/i],
  },
  {
    purpose: "outdoor",
    label: "outdoor",
    patterns: [/\boutdoor\b/i, /\bhik(?:e|ing)\b/i, /\bmountain\b/i, /\bcabin\b/i],
  },
];

export function parseNaturalLanguageSearch(
  prompt: string,
  currentSearch: Partial<SearchInput> = {},
  listings: Listing[] = [],
): NaturalLanguageSearchResult {
  const cleanPrompt = prompt.trim();
  const base = searchSchema.parse(currentSearch);
  const next: SearchInput = { ...base, amenities: [...base.amenities] };
  const detected: string[] = [];

  const destination = inferDestination(cleanPrompt, listings);
  if (destination) {
    next.destination = destination;
    next.nearLat = null;
    next.nearLng = null;
    detected.push(destination);
  }

  const dates = inferDates(cleanPrompt);
  if (dates.checkIn) {
    next.checkIn = dates.checkIn;
    detected.push(`check in ${dates.checkIn}`);
  }

  if (dates.checkOut) {
    next.checkOut = dates.checkOut;
    detected.push(`check out ${dates.checkOut}`);
  }

  const guests = inferGuests(cleanPrompt);
  if (guests) {
    next.guests = guests;
    detected.push(`${guests} ${guests === 1 ? "guest" : "guests"}`);
  }

  const budget = inferBudget(cleanPrompt);
  if (budget) {
    next.maxNightlyBudget = budget;
    detected.push(`$${budget}/night`);
  }

  const purpose = inferPurpose(cleanPrompt);
  if (purpose) {
    next.tripPurpose = purpose.purpose;
    detected.push(purpose.label);
  }

  const amenities = new Set<FeaturedAmenity>(
    next.amenities.filter(isFeaturedAmenity),
  );
  for (const signal of amenitySignals) {
    if (signal.patterns.some((pattern) => pattern.test(cleanPrompt))) {
      amenities.add(signal.amenity);
      detected.push(signal.labels[0]);
    }
  }
  next.amenities = Array.from(amenities);

  const search = searchSchema.parse(next);

  return {
    detected: Array.from(new Set(detected)),
    search,
    summary: buildSummary(detected),
  };
}

export async function parseNaturalLanguageSearchWithFallback(
  prompt: string,
  currentSearch: Partial<SearchInput> = {},
  listings: Listing[] = [],
): Promise<NaturalLanguageSearchResult> {
  const deterministic = parseNaturalLanguageSearch(prompt, currentSearch, listings);

  if (!getLlmConfig()) {
    return deterministic;
  }

  try {
    const parsed = await parseWithConfiguredLlm(prompt, currentSearch);
    return parsed ?? deterministic;
  } catch (error) {
    console.warn("Optional AI search provider failed; using deterministic parser", error);
    return deterministic;
  }
}

function getLlmConfig() {
  const apiKey = process.env.STAYWISE_AI_API_KEY ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl: (process.env.STAYWISE_AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.STAYWISE_AI_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5",
  };
}

async function parseWithConfiguredLlm(
  prompt: string,
  currentSearch: Partial<SearchInput>,
) {
  const config = getLlmConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(`${config.baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      store: false,
      instructions:
        "You interpret travel search requests for StayWise. Return only structured search filters. Never invent amenities outside the allowed enum. Do not output addresses, prices not requested by the user, availability claims, ratings, or recommendations.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                currentSearch: searchSchema.parse(currentSearch),
                request: prompt,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "staywise_search_filters",
          strict: true,
          schema: llmSearchSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`AI search provider returned ${response.status}`);
  }

  const body = (await response.json()) as { output_text?: string };
  const outputText = body.output_text?.trim();

  if (!outputText) {
    return null;
  }

  const parsedOutput = JSON.parse(outputText) as Record<string, unknown>;
  const parsedSearch = searchSchema.safeParse({
    ...searchSchema.parse(currentSearch),
    ...parsedOutput,
    nearLat: null,
    nearLng: null,
  });

  if (!parsedSearch.success) {
    return null;
  }

  const detected = getChangedSearchLabels(searchSchema.parse(currentSearch), parsedSearch.data);

  return {
    detected,
    search: parsedSearch.data,
    summary:
      detected.length > 0
        ? `I updated the search for ${formatDetected(detected)}.`
        : "I kept the current filters and searched the live listings.",
  };
}

function getChangedSearchLabels(previous: SearchInput, next: SearchInput) {
  const changed: string[] = [];

  if (next.destination && next.destination !== previous.destination) changed.push(next.destination);
  if (next.checkIn && next.checkIn !== previous.checkIn) changed.push(`check in ${next.checkIn}`);
  if (next.checkOut && next.checkOut !== previous.checkOut) changed.push(`check out ${next.checkOut}`);
  if (next.guests !== previous.guests) changed.push(`${next.guests} guests`);
  if (next.maxNightlyBudget !== previous.maxNightlyBudget) changed.push(`$${next.maxNightlyBudget}/night`);
  if (next.tripPurpose !== previous.tripPurpose) changed.push(next.tripPurpose.replace("-", " "));

  for (const amenity of next.amenities) {
    if (!previous.amenities.includes(amenity)) changed.push(amenity);
  }

  return Array.from(new Set(changed)).slice(0, 6);
}

function inferDestination(prompt: string, listings: Listing[]) {
  const normalizedPrompt = normalize(prompt);
  const candidates = new Map<string, string>();

  for (const listing of listings) {
    addDestinationCandidate(candidates, listing.city);
    addDestinationCandidate(candidates, listing.neighborhood);
    addDestinationCandidate(candidates, `${listing.neighborhood} ${listing.city}`);
  }

  return Array.from(candidates.entries())
    .sort(([first], [second]) => second.length - first.length)
    .find(([normalized]) => matchesPhrase(normalizedPrompt, normalized))?.[1];
}

function addDestinationCandidate(candidates: Map<string, string>, value: string) {
  const normalized = normalize(value);

  if (normalized.length > 1 && !candidates.has(normalized)) {
    candidates.set(normalized, value);
  }
}

function inferDates(prompt: string) {
  const matches = Array.from(prompt.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)).map(
    (match) => match[1],
  );

  if (matches.length < 2 || matches[0] >= matches[1]) {
    return { checkIn: "", checkOut: "" };
  }

  return {
    checkIn: isValidIsoDate(matches[0]) ? matches[0] : "",
    checkOut: isValidIsoDate(matches[1]) ? matches[1] : "",
  };
}

function inferGuests(prompt: string) {
  const numericMatch = prompt.match(
    /\b(?:for\s+)?(\d{1,2})\s*(?:guests?|people|persons?|travelers?|adults?|friends?|family members?)\b/i,
  );
  const wordMatch = prompt.match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:guests?|people|persons?|travelers?|adults?|friends?|family members?)\b/i,
  );
  const inferred =
    numericMatch?.[1] ?? (wordMatch?.[1] ? String(numberWords[wordMatch[1].toLowerCase()]) : "");
  const guests = Number(inferred);

  return Number.isFinite(guests) ? clamp(guests, 1, 16) : null;
}

function inferBudget(prompt: string) {
  const match =
    prompt.match(
      /\b(?:under|below|less than|up to|max(?:imum)?|budget(?: of)?|around)\s*\$?\s*(\d{2,4})\b/i,
    ) ?? prompt.match(/\$(\d{2,4})\b/);
  const budget = Number(match?.[1]);

  return Number.isFinite(budget) ? clamp(budget, 50, 1200) : null;
}

function inferPurpose(prompt: string) {
  return purposeSignals.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(prompt)),
  );
}

function buildSummary(detected: string[]) {
  const unique = Array.from(new Set(detected));

  if (unique.length === 0) {
    return "I kept the current filters and searched the live listings.";
  }

  return `I found ${formatDetected(unique)} from your request.`;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchesPhrase(text: string, phrase: string) {
  if (!phrase) {
    return false;
  }

  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text);
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function isFeaturedAmenity(value: string): value is FeaturedAmenity {
  return (featuredAmenities as readonly string[]).includes(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDetected(items: string[]) {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
