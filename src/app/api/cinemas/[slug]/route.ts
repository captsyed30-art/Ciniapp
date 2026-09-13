import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const client = await pool.connect();

  try {
    const cinemaRes = await client.query(
      `SELECT c.id, c.name, c.slug, c.address, c.city, c.state, c.postal_code as "postalCode",
              c.phone, c.amenities
       FROM cinemas c
       WHERE c.slug = $1`,
      [slug]
    );

    if (cinemaRes.rows.length === 0) {
      return NextResponse.json({ error: "Cinema not found" }, { status: 404 });
    }

    const cinema = cinemaRes.rows[0];

    // Fetch movies and showtimes currently playing at this cinema
    const scheduleRes = await client.query(
      `SELECT s.id, s.start_time as "startTime", s.end_time as "endTime", s.price_cents as "priceCents", s.format,
              m.id as "movieId", m.title as "movieTitle", m.slug as "movieSlug", m.poster_url as "moviePoster",
              m.duration_mins as "durationMins", m.rating as "movieRating",
              a.id as "auditoriumId", a.name as "auditoriumName", a.screen_type as "screenType"
       FROM showtimes s
       JOIN auditoriums a ON a.id = s.auditorium_id
       JOIN movies m ON m.id = s.movie_id
       WHERE a.cinema_id = $1 AND s.is_active = true AND s.start_time >= NOW() - interval '30 minutes'
       ORDER BY m.title ASC, s.start_time ASC`,
      [cinema.id]
    );

    return NextResponse.json({
      cinema,
      schedule: scheduleRes.rows,
    });
  } catch (error: any) {
    console.error("Fetch cinema detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cinema details" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
