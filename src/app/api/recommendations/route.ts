import { NextResponse } from "next/server";
import { rankListings, searchSchema } from "@/lib/recommendations";

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

  return NextResponse.json({
    listings: rankListings(parsed.data),
  });
}
