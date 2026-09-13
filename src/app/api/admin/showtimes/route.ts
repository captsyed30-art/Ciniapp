import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT s.id, s.start_time as "startTime", s.end_time as "endTime", s.price_cents as "priceCents", s.format, s.is_active as "isActive",
             m.title as "movieTitle", m.duration_mins as "durationMins",
             a.name as "auditoriumName", a.screen_type as "screenType",
             c.name as "cinemaName"
      FROM showtimes s
      JOIN movies m ON m.id = s.movie_id
      JOIN auditoriums a ON a.id = s.auditorium_id
      JOIN cinemas c ON c.id = a.cinema_id
      ORDER BY s.start_time DESC
    `);
    return NextResponse.json({ showtimes: res.rows });
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { movieId, auditoriumId, startTime, priceCents, format } = body;

    if (!movieId || !auditoriumId || !startTime || !priceCents) {
      return NextResponse.json(
        { error: "Movie, auditorium, start time, and base price are required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // 1. Fetch movie duration
      const movieRes = await client.query(
        `SELECT duration_mins, title FROM movies WHERE id = $1`,
        [movieId]
      );
      if (movieRes.rows.length === 0) {
        return NextResponse.json({ error: "Movie not found" }, { status: 404 });
      }

      const durationMins = movieRes.rows[0].duration_mins || 120;
      const start = new Date(startTime);
      const end = new Date(start.getTime() + (durationMins + 20) * 60 * 1000); // +20 min cleaning interval

      // 2. Check for scheduling overlap in the same auditorium
      const overlapRes = await client.query(
        `SELECT s.id, m.title, s.start_time, s.end_time
         FROM showtimes s
         JOIN movies m ON m.id = s.movie_id
         WHERE s.auditorium_id = $1 AND s.is_active = true
           AND (s.start_time < $3 AND s.end_time > $2)`,
        [auditoriumId, start, end]
      );

      if (overlapRes.rows.length > 0) {
        const conflict = overlapRes.rows[0];
        return NextResponse.json(
          {
            error: `Schedule clash: "${conflict.title}" is already scheduled in this auditorium from ${new Date(
              conflict.start_time
            ).toLocaleTimeString()} to ${new Date(
              conflict.end_time
            ).toLocaleTimeString()}`,
          },
          { status: 409 }
        );
      }

      await client.query("BEGIN");

      // 3. Create showtime
      const stRes = await client.query(
        `INSERT INTO showtimes (movie_id, auditorium_id, start_time, end_time, price_cents, format, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id`,
        [movieId, auditoriumId, start, end, Number(priceCents), format || "2D"]
      );

      const showtimeId = stRes.rows[0].id;

      // 4. Provision showtime_seats for all seats in this auditorium
      const seatsRes = await client.query(
        `SELECT id FROM seats WHERE auditorium_id = $1`,
        [auditoriumId]
      );

      for (const seat of seatsRes.rows) {
        await client.query(
          `INSERT INTO showtime_seats (showtime_id, seat_id, status)
           VALUES ($1, $2, 'AVAILABLE')`,
          [showtimeId, seat.id]
        );
      }

      // 5. Audit Log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload, created_at)
         VALUES ($1, 'CREATE_SHOWTIME', 'SHOWTIME', $2, $3, NOW())`,
        [
          adminUser.id,
          showtimeId,
          JSON.stringify({
            movieId,
            auditoriumId,
            startTime: start,
            seatCount: seatsRes.rows.length,
          }),
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          showtimeId,
          seatsProvisioned: seatsRes.rows.length,
        },
        { status: 201 }
      );
    } catch (err: any) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Create showtime error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule showtime" },
      { status: 500 }
    );
  }
}
