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
    // 1. Fetch movie
    const movieRes = await client.query(
      `SELECT m.id, m.title, m.slug, m.synopsis, m.poster_url as "posterUrl",
              m.backdrop_url as "backdropUrl", m.trailer_url as "trailerUrl",
              m.duration_mins as "durationMins", m.release_date as "releaseDate",
              m.rating, m.language, m.director, m.cast, m.is_active as "isActive",
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name, 'slug', g.slug))
                FILTER (WHERE g.id IS NOT NULL), '[]'
              ) as genres
       FROM movies m
       LEFT JOIN movie_genres mg ON mg.movie_id = m.id
       LEFT JOIN genres g ON g.id = mg.genre_id
       WHERE m.slug = $1
       GROUP BY m.id`,
      [slug]
    );

    if (movieRes.rows.length === 0) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const movie = movieRes.rows[0];

    // 2. Fetch upcoming showtimes
    const showtimesRes = await client.query(
      `SELECT s.id, s.start_time as "startTime", s.end_time as "endTime",
              s.price_cents as "priceCents", s.format,
              a.id as "auditoriumId", a.name as "auditoriumName", a.screen_type as "screenType",
              c.id as "cinemaId", c.name as "cinemaName", c.slug as "cinemaSlug",
              c.address as "cinemaAddress", c.city as "cinemaCity"
       FROM showtimes s
       JOIN auditoriums a ON a.id = s.auditorium_id
       JOIN cinemas c ON c.id = a.cinema_id
       WHERE s.movie_id = $1 AND s.is_active = true AND s.start_time >= NOW() - interval '30 minutes'
       ORDER BY c.name ASC, s.start_time ASC`,
      [movie.id]
    );

    return NextResponse.json({
      movie,
      showtimes: showtimesRes.rows,
    });
  } catch (error: any) {
    console.error("Fetch movie detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie details" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
