import { NextResponse } from "next/server";
import { z } from "zod";
import { checkListingAvailability } from "@/lib/listing-data";

export const dynamic = "force-dynamic";

type AvailabilityRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const availabilityQuerySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request, { params }: AvailabilityRouteContext) {
  const { id } = await params;
  const url = new URL(request.url);
  const parsed = availabilityQuerySchema.safeParse({
    checkIn: url.searchParams.get("checkIn"),
    checkOut: url.searchParams.get("checkOut"),
  });

  if (!z.string().uuid().safeParse(id).success || !parsed.success) {
    return NextResponse.json(
      {
        available: null,
        message: "Choose valid dates to check availability.",
        status: "unknown",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await checkListingAvailability(id, parsed.data.checkIn, parsed.data.checkOut),
  );
}
