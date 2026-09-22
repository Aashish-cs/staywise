import { NextResponse } from "next/server";
import { z } from "zod";
import { reverseGeocodeLocation } from "@/lib/location-service";

export const dynamic = "force-dynamic";

const reverseLocationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
const locationCacheHeaders = {
  "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = reverseLocationSchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Use valid latitude and longitude values.",
        location: null,
      },
      { status: 400 },
    );
  }

  try {
    const location = await reverseGeocodeLocation(
      parsed.data.lat,
      parsed.data.lng,
    );

    return NextResponse.json(
      {
        attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
        location,
      },
      {
        headers: locationCacheHeaders,
      },
    );
  } catch (error) {
    console.error("Reverse location lookup failed", error);

    return NextResponse.json(
      {
        error: "Current location lookup is temporarily unavailable.",
        location: null,
      },
      { status: 503 },
    );
  }
}
