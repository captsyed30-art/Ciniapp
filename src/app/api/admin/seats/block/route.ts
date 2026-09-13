import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { showtimeSeatId, action } = body; // action: 'BLOCK' or 'UNBLOCK'

    if (!showtimeSeatId || !["BLOCK", "UNBLOCK"].includes(action)) {
      return NextResponse.json(
        { error: "showtimeSeatId and valid action (BLOCK/UNBLOCK) required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const targetStatus = action === "BLOCK" ? "BLOCKED" : "AVAILABLE";

      const res = await client.query(
        `UPDATE showtime_seats
         SET status = $1, held_by_user_id = NULL, held_until = NULL, version = version + 1, updated_at = NOW()
         WHERE id = $2 AND status != 'BOOKED'
         RETURNING id, status`,
        [targetStatus, showtimeSeatId]
      );

      if (res.rows.length === 0) {
        return NextResponse.json(
          { error: "Seat not found or cannot change booked seat" },
          { status: 400 }
        );
      }

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload, created_at)
         VALUES ($1, $2, 'SEAT', $3, $4, NOW())`,
        [
          adminUser.id,
          action === "BLOCK" ? "SEAT_BLOCKED" : "SEAT_UNBLOCKED",
          showtimeSeatId,
          JSON.stringify({ newStatus: targetStatus }),
        ]
      );

      return NextResponse.json({
        success: true,
        seat: res.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Block seat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update seat status" },
      { status: 500 }
    );
  }
}
