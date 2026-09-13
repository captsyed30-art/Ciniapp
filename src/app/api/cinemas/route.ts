import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT c.id, c.name, c.slug, c.address, c.city, c.state, c.postal_code as "postalCode",
             c.latitude, c.longitude, c.phone, c.amenities,
             COALESCE(
               json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name, 'screenType', a.screen_type, 'totalSeats', a.total_seats))
               FILTER (WHERE a.id IS NOT NULL), '[]'
             ) as auditoriums
      FROM cinemas c
      LEFT JOIN auditoriums a ON a.cinema_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    return NextResponse.json({ cinemas: res.rows });
  } catch (error: any) {
    console.error("Fetch cinemas error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cinemas" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
