import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

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
      SELECT m.*,
             COALESCE(
               json_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name, 'slug', g.slug))
               FILTER (WHERE g.id IS NOT NULL), '[]'
             ) as genres
      FROM movies m
      LEFT JOIN movie_genres mg ON mg.movie_id = m.id
      LEFT JOIN genres g ON g.id = mg.genre_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `);
    return NextResponse.json({ movies: res.rows });
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
    const {
      title,
      synopsis,
      posterUrl,
      backdropUrl,
      trailerUrl,
      durationMins,
      releaseDate,
      rating,
      language,
      director,
      cast,
      genreIds,
    } = body;

    if (!title || !synopsis || !posterUrl || !durationMins || !rating) {
      return NextResponse.json(
        { error: "Missing required movie fields" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertRes = await client.query(
        `INSERT INTO movies (title, slug, synopsis, poster_url, backdrop_url, trailer_url, duration_mins, release_date, rating, language, director, cast, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
         RETURNING id`,
        [
          title,
          slug,
          synopsis,
          posterUrl,
          backdropUrl || posterUrl,
          trailerUrl || null,
          Number(durationMins),
          new Date(releaseDate || new Date()),
          rating,
          language || "English",
          director || null,
          cast || null,
        ]
      );

      const movieId = insertRes.rows[0].id;

      if (Array.isArray(genreIds) && genreIds.length > 0) {
        for (const gId of genreIds) {
          await client.query(
            `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [movieId, gId]
          );
        }
      }

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload, created_at)
         VALUES ($1, 'CREATE_MOVIE', 'MOVIE', $2, $3, NOW())`,
        [adminUser.id, movieId, JSON.stringify({ title, slug })]
      );

      await client.query("COMMIT");

      return NextResponse.json({ success: true, movieId, slug }, { status: 201 });
    } catch (err: any) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Create movie error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create movie" },
      { status: 500 }
    );
  }
}
