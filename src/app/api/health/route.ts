import { NextResponse } from "next/server";

/** GET /api/health — DB を使わない死活確認用 */
export async function GET() {
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
