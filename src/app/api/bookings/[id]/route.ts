import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const bookingRes = await client.query(
      `SELECT b.*,
              s.start_time as "startTime", s.end_time as "endTime", s.format, s.price_cents as "basePriceCents",
              m.id as "movieId", m.title as "movieTitle", m.poster_url as "moviePoster", m.backdrop_url as "movieBackdrop",
              m.rating as "movieRating", m.duration_mins as "durationMins",
              a.id as "auditoriumId", a.name as "auditoriumName", a.screen_type as "screenType",
              c.id as "cinemaId", c.name as "cinemaName", c.address as "cinemaAddress", c.city as "cinemaCity"
       FROM bookings b
       JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id
       JOIN auditoriums a ON a.id = s.auditorium_id
       JOIN cinemas c ON c.id = a.cinema_id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingRes.rows[0];

    // Check ownership unless admin
    if (booking.user_id !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch items
    const itemsRes = await client.query(
      `SELECT id, seat_id as "seatId", seat_label as "seatLabel", seat_type as "seatType", price_cents as "priceCents"
       FROM booking_items
       WHERE booking_id = $1
       ORDER BY seat_label ASC`,
      [id]
    );

    // Fetch tickets if confirmed
    let tickets: any[] = [];
    if (booking.status === "CONFIRMED") {
      const ticketsRes = await client.query(
        `SELECT id, ticket_code as "ticketCode", qr_code_data as "qrCodeData", seat_label as "seatLabel", is_checked_in as "isCheckedIn", created_at as "createdAt"
         FROM tickets
         WHERE booking_id = $1`,
        [id]
      );
      tickets = ticketsRes.rows;
    }

    return NextResponse.json({
      booking: {
        ...booking,
        items: itemsRes.rows,
        tickets,
      },
    });
  } catch (error: any) {
    console.error("Fetch booking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
