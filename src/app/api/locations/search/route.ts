import { NextResponse } from "next/server";
import { z } from "zod";
import { searchLocations } from "@/lib/location-service";

export const dynamic = "force-dynamic";

const locationSearchSchema = z.object({
  query: z.string().trim().min(2).max(120),
});
const locationCacheHeaders = {
  "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = locationSearchSchema.safeParse({
    query: url.searchParams.get("query"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Enter at least two characters for a place search.",
        locations: [],
      },
      { status: 400 },
    );
  }

  try {
    const locations = await searchLocations(parsed.data.query);

    return NextResponse.json(
      {
        attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
        locations,
      },
      {
        headers: locationCacheHeaders,
      },
    );
  } catch (error) {
    console.error("Location search failed", error);

    return NextResponse.json(
      {
        error: "Location search is temporarily unavailable.",
        locations: [],
      },
      { status: 503 },
    );
  }
}
