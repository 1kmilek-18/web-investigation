import { NextRequest, NextResponse } from "next/server";
import { hasRunningJob, runDailyJob } from "@/lib/cron-handler";

/** POST /api/cron/daily — 日次ジョブトリガー (REQ-SCH-002, REQ-SCH-003, REQ-SCH-004, SDD 9.1) */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[POST /api/cron/daily] CRON_SECRET is not set");
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

  const running = await hasRunningJob();
  if (running) {
    return NextResponse.json(
      { status: "skipped", reason: "Job already running" },
      { status: 409 }
    );
  }

  try {
    const result = await runDailyJob();

    if (result.status === "completed") {
      return NextResponse.json({
        status: "completed",
        jobRunId: result.jobRunId,
        articlesCollected: result.articlesCollected,
        errors: result.errors,
      });
    }
    if (result.status === "stopped") {
      return NextResponse.json({
        status: "stopped",
        jobRunId: result.jobRunId,
      });
    }
    return NextResponse.json(
      {
        status: "failed",
        jobRunId: result.jobRunId,
        error: result.error,
      },
      { status: 500 }
    );
  } catch (e) {
    console.error("[POST /api/cron/daily]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
