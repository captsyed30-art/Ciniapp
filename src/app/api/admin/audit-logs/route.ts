import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { requireAdmin } from "@/lib/auth";

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
      SELECT al.id, al.action, al.entity_type as "entityType", al.entity_id as "entityId",
             al.payload, al.ip_address as "ipAddress", al.created_at as "createdAt",
             u.name as "userName", u.email as "userEmail"
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);

    return NextResponse.json({ logs: res.rows });
  } finally {
    client.release();
  }
}
