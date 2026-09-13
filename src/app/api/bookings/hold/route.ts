import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { holdSeatsTransaction } from "@/lib/booking-engine";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please log in to reserve seats" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { showtimeId, seatIds } = body;

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Showtime and seat selection are required." },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const result = await holdSeatsTransaction({
      userId: user.id,
      showtimeId,
      seatIds,
      ipAddress,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to hold seats" },
        { status: 409 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Hold seats API error:", error);
    return NextResponse.json(
      { error: "Internal server error holding seats" },
      { status: 500 }
    );
  }
}
