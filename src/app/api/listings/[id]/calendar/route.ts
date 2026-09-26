import { NextResponse } from "next/server";
import { z } from "zod";
import { getListingUnavailableDates } from "@/lib/listing-data";
import { countNights, isValidIsoDate } from "@/lib/reservation-utils";

export const dynamic = "force-dynamic";

type CalendarRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const calendarQuerySchema = z.object({
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request, { params }: CalendarRouteContext) {
  const { id } = await params;
  const url = new URL(request.url);
  const parsed = calendarQuerySchema.safeParse({
    end: url.searchParams.get("end"),
    start: url.searchParams.get("start"),
  });

  if (!z.string().uuid().safeParse(id).success || !parsed.success) {
    return NextResponse.json(
      { message: "Choose a valid calendar range.", unavailableDates: [] },
      { status: 400 },
    );
  }

  if (
    !isValidIsoDate(parsed.data.start) ||
    !isValidIsoDate(parsed.data.end) ||
    parsed.data.end <= parsed.data.start ||
    countNights(parsed.data.start, parsed.data.end) > 90
  ) {
    return NextResponse.json(
      { message: "Choose a valid calendar range.", unavailableDates: [] },
      { status: 400 },
    );
  }

  const unavailableDates = await getListingUnavailableDates(
    id,
    parsed.data.start,
    parsed.data.end,
  );

  return NextResponse.json({ unavailableDates });
}
