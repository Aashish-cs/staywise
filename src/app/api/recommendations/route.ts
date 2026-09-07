import { NextResponse } from "next/server";
import { getPublicListings } from "@/lib/listing-data";
import { rankListings, searchSchema } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = searchSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid recommendation request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const listings = await getPublicListings();

  return NextResponse.json({
    listings: rankListings(parsed.data, listings),
  });
}
