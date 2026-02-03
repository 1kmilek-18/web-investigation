import { NextRequest, NextResponse } from "next/server";
import { hasRunningJob, isJobInCooldown, runDailyJob } from "@/lib/cron-handler";

/** POST /api/jobs/manual — 日次ジョブ手動実行 (REQ-JOB-001, SDD 9.7) */
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

  const running = await hasRunningJob();
  if (running) {
    return NextResponse.json(
      { status: "skipped", reason: "Job already running" },
      { status: 409 }
    );
  }

  const cooldown = await isJobInCooldown();
  if (cooldown.inCooldown) {
    return NextResponse.json(
      {
        status: "skipped",
        reason: "Job cooldown",
        remainingSeconds: cooldown.remainingSeconds,
      },
      { status: 429 }
    );
  }

  try {
    const result = await runDailyJob();

    if (result.status === "completed") {
      return NextResponse.json({
        status: "completed",
        jobRunId: result.jobRunId,
        articlesCollected: result.articlesCollected,
        articlesSummarized: result.articlesSummarized,
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
    console.error("[POST /api/jobs/manual]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
