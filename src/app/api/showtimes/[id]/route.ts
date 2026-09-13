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
  const currentUserId = user?.id || null;

  const client = await pool.connect();
  try {
    // 1. Fetch showtime with movie and auditorium
    const showtimeRes = await client.query(
      `SELECT s.id, s.start_time as "startTime", s.end_time as "endTime",
              s.price_cents as "priceCents", s.format, s.is_active as "isActive",
              m.id as "movieId", m.title as "movieTitle", m.slug as "movieSlug",
              m.poster_url as "moviePoster", m.backdrop_url as "movieBackdrop",
              m.duration_mins as "durationMins", m.rating as "movieRating",
              a.id as "auditoriumId", a.name as "auditoriumName", a.screen_type as "screenType",
              c.id as "cinemaId", c.name as "cinemaName", c.slug as "cinemaSlug",
              c.address as "cinemaAddress", c.city as "cinemaCity"
       FROM showtimes s
       JOIN movies m ON m.id = s.movie_id
       JOIN auditoriums a ON a.id = s.auditorium_id
       JOIN cinemas c ON c.id = a.cinema_id
       WHERE s.id = $1`,
      [id]
    );

    if (showtimeRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Showtime not found" },
        { status: 404 }
      );
    }

    const showtime = showtimeRes.rows[0];

    // 2. Fetch seats and showtime_seats matrix
    const now = new Date();
    const seatsRes = await client.query(
      `SELECT s.id as "seatId", s.row, s.number, s.seat_type as "seatType",
              s.price_multiplier_cents as "priceMultiplierCents",
              ss.id as "showtimeSeatId", ss.status, ss.held_by_user_id as "heldByUserId",
              ss.held_until as "heldUntil", ss.booking_id as "bookingId"
       FROM seats s
       JOIN showtime_seats ss ON ss.seat_id = s.id AND ss.showtime_id = $1
       WHERE s.auditorium_id = $2
       ORDER BY s.row ASC, s.number ASC`,
      [id, showtime.auditoriumId]
    );

    // Map seats with real-time expiration logic
    const seatMap = seatsRes.rows.map((seat) => {
      let effectiveStatus = seat.status;
      const isHoldExpired =
        seat.status === "HELD" &&
        seat.heldUntil &&
        new Date(seat.heldUntil) <= now;

      if (isHoldExpired) {
        effectiveStatus = "AVAILABLE";
      }

      const isMyHold =
        seat.status === "HELD" &&
        !isHoldExpired &&
        currentUserId &&
        seat.heldByUserId === currentUserId;

      const totalPriceCents =
        showtime.priceCents + (seat.priceMultiplierCents || 0);

      return {
        seatId: seat.seatId,
        showtimeSeatId: seat.showtimeSeatId,
        row: seat.row,
        number: seat.number,
        seatType: seat.seatType,
        priceMultiplierCents: seat.priceMultiplierCents,
        priceCents: totalPriceCents,
        status: effectiveStatus,
        isMyHold: !!isMyHold,
        heldUntil: isHoldExpired ? null : seat.heldUntil,
      };
    });

    return NextResponse.json({
      showtime,
      seats: seatMap,
    });
  } catch (error: any) {
    console.error("Fetch showtime error:", error);
    return NextResponse.json(
      { error: "Failed to fetch showtime and seat map" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
