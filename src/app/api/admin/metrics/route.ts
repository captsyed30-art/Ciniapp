import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    // 1. Revenue & Bookings
    const revRes = await client.query(`
      SELECT
        COUNT(*) as "totalBookings",
        COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN total_cents ELSE 0 END), 0) as "totalRevenueCents",
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as "confirmedBookings",
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as "cancelledBookings",
        COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as "expiredBookings"
      FROM bookings
    `);

    // 2. Total Tickets Sold
    const ticketsRes = await client.query(`SELECT COUNT(*) as "totalTickets" FROM tickets`);

    // 3. Active Movies & Cinemas
    const countsRes = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM movies WHERE is_active = true) as "activeMovies",
        (SELECT COUNT(*) FROM cinemas) as "totalCinemas",
        (SELECT COUNT(*) FROM showtimes WHERE is_active = true AND start_time >= NOW()) as "upcomingShowtimes"
    `);

    // 4. Seat Occupancy Rate
    const occupancyRes = await client.query(`
      SELECT
        COUNT(*) as "totalShowtimeSeats",
        COUNT(CASE WHEN status = 'BOOKED' THEN 1 END) as "bookedSeats",
        COUNT(CASE WHEN status = 'HELD' THEN 1 END) as "heldSeats"
      FROM showtime_seats
    `);

    // 5. Recent Bookings
    const recentBookingsRes = await client.query(`
      SELECT b.id, b.reference_code as "referenceCode", b.status, b.total_cents as "totalCents", b.created_at as "createdAt",
             u.name as "userName", u.email as "userEmail",
             m.title as "movieTitle",
             c.name as "cinemaName"
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN showtimes s ON s.id = b.showtime_id
      JOIN movies m ON m.id = s.movie_id
      JOIN auditoriums a ON a.id = s.auditorium_id
      JOIN cinemas c ON c.id = a.cinema_id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      metrics: {
        ...revRes.rows[0],
        totalTickets: ticketsRes.rows[0].totalTickets,
        ...countsRes.rows[0],
        ...occupancyRes.rows[0],
      },
      recentBookings: recentBookingsRes.rows,
    });
  } catch (error: any) {
    console.error("Admin metrics error:", error);
    return NextResponse.json({ error: "Failed to fetch admin metrics" }, { status: 500 });
  } finally {
    client.release();
  }
}
