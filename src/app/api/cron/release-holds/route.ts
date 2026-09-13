import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredSeatHolds } from "@/lib/booking-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleRelease(req);
}

export async function POST(req: NextRequest) {
  return handleRelease(req);
}

async function handleRelease(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const querySecret = req.nextUrl.searchParams.get("secret");

    // Protect endpoint if CRON_SECRET is configured
    if (cronSecret) {
      const isBearerValid = authHeader === `Bearer ${cronSecret}`;
      const isQueryValid = querySecret === cronSecret;

      if (!isBearerValid && !isQueryValid) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid CRON_SECRET token" },
          { status: 401 }
        );
      }
    }

    const result = await releaseExpiredSeatHolds();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("Release expired holds cron error:", error);
    return NextResponse.json(
      { error: "Failed to release expired seat holds" },
      { status: 500 }
    );
  }
}
