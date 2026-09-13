import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT b.id, b.reference_code as "referenceCode", b.status,
                b.subtotal_cents as "subtotalCents", b.service_fee_cents as "serviceFeeCents",
                b.tax_cents as "taxCents", b.total_cents as "totalCents",
                b.created_at as "createdAt",
                s.id as "showtimeId", s.start_time as "startTime", s.end_time as "endTime", s.format,
                m.id as "movieId", m.title as "movieTitle", m.slug as "movieSlug",
                m.poster_url as "moviePoster", m.rating as "movieRating",
                a.name as "auditoriumName",
                c.name as "cinemaName", c.address as "cinemaAddress",
                COALESCE(
                  json_agg(DISTINCT jsonb_build_object(
                    'id', bi.id,
                    'seatLabel', bi.seat_label,
                    'seatType', bi.seat_type,
                    'priceCents', bi.price_cents
                  )) FILTER (WHERE bi.id IS NOT NULL), '[]'
                ) as items,
                COALESCE(
                  json_agg(DISTINCT jsonb_build_object(
                    'id', t.id,
                    'ticketCode', t.ticket_code,
                    'qrCodeData', t.qr_code_data,
                    'seatLabel', t.seat_label,
                    'isCheckedIn', t.is_checked_in
                  )) FILTER (WHERE t.id IS NOT NULL), '[]'
                ) as tickets
         FROM bookings b
         JOIN showtimes s ON s.id = b.showtime_id
         JOIN movies m ON m.id = s.movie_id
         JOIN auditoriums a ON a.id = s.auditorium_id
         JOIN cinemas c ON c.id = a.cinema_id
         LEFT JOIN booking_items bi ON bi.booking_id = b.id
         LEFT JOIN tickets t ON t.booking_id = b.id
         WHERE b.user_id = $1
         GROUP BY b.id, s.id, m.id, a.id, c.id
         ORDER BY b.created_at DESC`,
        [user.id]
      );

      return NextResponse.json({ bookings: res.rows });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Fetch user bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
