import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { confirmCheckoutTransaction } from "@/lib/booking-engine";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, idempotencyKey, cardBrand, last4 } = body;

    if (!bookingId || !idempotencyKey) {
      return NextResponse.json(
        { error: "Booking ID and idempotency key are required" },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const result = await confirmCheckoutTransaction({
      bookingId,
      userId: user.id,
      idempotencyKey,
      paymentMethod: {
        cardBrand: cardBrand || "Visa",
        last4: last4 || "4242",
      },
      ipAddress,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Payment and confirmation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Checkout confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error during checkout" },
      { status: 500 }
    );
  }
}
