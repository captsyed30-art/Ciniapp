import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const genre = searchParams.get("genre") || "";
    const language = searchParams.get("language") || "";
    const cinemaId = searchParams.get("cinemaId") || "";
    const date = searchParams.get("date") || ""; // YYYY-MM-DD
    const filter = searchParams.get("filter") || "all"; // 'now_showing', 'coming_soon', 'all'

    let query = `
      SELECT DISTINCT m.id, m.title, m.slug, m.synopsis, m.poster_url as "posterUrl",
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
      LEFT JOIN showtimes s ON s.movie_id = m.id AND s.is_active = true
      LEFT JOIN auditoriums a ON a.id = s.auditorium_id
      WHERE m.is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (q) {
      query += ` AND (m.title ILIKE $${paramIndex} OR m.synopsis ILIKE $${paramIndex} OR m.cast ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (genre && genre !== "all") {
      query += ` AND g.slug = $${paramIndex}`;
      params.push(genre);
      paramIndex++;
    }

    if (language && language !== "all") {
      query += ` AND LOWER(m.language) = LOWER($${paramIndex})`;
      params.push(language);
      paramIndex++;
    }

    if (cinemaId && cinemaId !== "all") {
      query += ` AND a.cinema_id = $${paramIndex}`;
      params.push(cinemaId);
      paramIndex++;
    }

    if (date) {
      query += ` AND DATE(s.start_time) = DATE($${paramIndex})`;
      params.push(date);
      paramIndex++;
    }

    if (filter === "now_showing") {
      query += ` AND m.release_date <= NOW()`;
    } else if (filter === "coming_soon") {
      query += ` AND m.release_date > NOW()`;
    }

    query += ` GROUP BY m.id ORDER BY m.release_date DESC`;

    const client = await pool.connect();
    try {
      const res = await client.query(query, params);
      return NextResponse.json({ movies: res.rows });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Fetch movies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
