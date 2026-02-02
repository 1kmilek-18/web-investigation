import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** POST /api/jobs/stop — 実行中ジョブの停止要求 (REQ-JOB-002, SDD 9.8) */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token !== secret) {
    return NextResponse.json(
      { error: "Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  const running = await prisma.jobRun.findFirst({
    where: { status: "running" },
    select: { id: true },
  });

  if (!running) {
    return NextResponse.json(
      { error: "No running job found" },
      { status: 404 }
    );
  }

  await prisma.jobRun.update({
    where: { id: running.id },
    data: { status: "stopping" },
  });

  return NextResponse.json({
    status: "stopping",
    jobRunId: running.id,
  });
}
