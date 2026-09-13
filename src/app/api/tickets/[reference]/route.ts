import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  const { reference } = params;
  const client = await pool.connect();

  try {
    const bookingRes = await client.query(
      `SELECT b.id, b.reference_code as "referenceCode", b.status, b.total_cents as "totalCents",
              b.created_at as "createdAt",
              u.name as "userName", u.email as "userEmail",
              s.id as "showtimeId", s.start_time as "startTime", s.end_time as "endTime", s.format,
              m.title as "movieTitle", m.poster_url as "moviePoster", m.backdrop_url as "movieBackdrop",
              m.rating as "movieRating", m.duration_mins as "durationMins",
              a.name as "auditoriumName", a.screen_type as "screenType",
              c.name as "cinemaName", c.address as "cinemaAddress", c.city as "cinemaCity"
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id
       JOIN auditoriums a ON a.id = s.auditorium_id
       JOIN cinemas c ON c.id = a.cinema_id
       WHERE UPPER(b.reference_code) = UPPER($1)`,
      [reference]
    );

    if (bookingRes.rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const booking = bookingRes.rows[0];

    // Fetch tickets
    const ticketsRes = await client.query(
      `SELECT t.id, t.ticket_code as "ticketCode", t.qr_code_data as "qrCodeData",
              t.seat_label as "seatLabel", t.is_checked_in as "isCheckedIn",
              bi.seat_type as "seatType", bi.price_cents as "priceCents"
       FROM tickets t
       JOIN booking_items bi ON bi.showtime_seat_id = t.showtime_seat_id AND bi.booking_id = t.booking_id
       WHERE t.booking_id = $1
       ORDER BY t.seat_label ASC`,
      [booking.id]
    );

    return NextResponse.json({
      booking,
      tickets: ticketsRes.rows,
    });
  } catch (error: any) {
    console.error("Fetch ticket error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
