import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelBookingTransaction } from "@/lib/booking-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const isAdmin = user.role === "ADMIN";

    const result = await cancelBookingTransaction(id, user.id, isAdmin);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to cancel booking" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled and refunded successfully",
      refundedCents: result.refundedCents,
    });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Internal server error cancelling booking" },
      { status: 500 }
    );
  }
}
