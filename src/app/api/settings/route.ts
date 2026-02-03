/**
 * Settings API (REQ-SET-001〜004, REQ-UI-005〜007, REQ-UI-012)
 * SDD 9.5: Settings API実装 / CODE_REVIEW §5.1, §6.2: 固定ID・zodバリデーション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmptySendBehavior } from "@prisma/client";
import { z } from "zod";
import { SETTINGS_ID } from "@/lib/constants";

/** PUT body の zod スキーマ（CODE_REVIEW §6.2） */
const putSettingsSchema = z.object({
  dailySendTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  recipientEmail: z.union([z.string().email(), z.literal("")]).optional(),
  emptySendBehavior: z.enum(["skip", "sendNotification"]).optional(),
  costLimitMonthly: z.number().positive().nullable().optional(),
  costWarningRatio: z.number().min(0).max(1).optional(),
});

// デフォルト設定値
const DEFAULT_SETTINGS = {
  dailySendTime: "09:00",
  recipientEmail: "",
  emptySendBehavior: "skip" as EmptySendBehavior,
  costLimitMonthly: null as number | null,
  costWarningRatio: 0.8,
};

function isDbConnectionError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const msg =
    "message" in e && typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : "";
  const code = "code" in e ? (e as { code: unknown }).code : "";
  return (
    msg.includes("connect") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("Connection") ||
    code === "P1001" ||
    code === "P1017"
  );
}

/**
 * GET /api/settings
 * 現在の設定を取得（固定IDで1件のみ）
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });
    }

    return NextResponse.json({
      dailySendTime: settings.dailySendTime,
      recipientEmail: settings.recipientEmail,
      emptySendBehavior: settings.emptySendBehavior,
      costLimitMonthly: settings.costLimitMonthly,
      costWarningRatio: settings.costWarningRatio,
    });
  } catch (error) {
    console.error("[GET /api/settings] Error:", error);
    const isDb = isDbConnectionError(error);
    return NextResponse.json(
      {
        error: isDb
          ? "データベースに接続できません。.env の DATABASE_URL と DB の起動を確認してください。"
          : "Failed to fetch settings",
      },
      { status: isDb ? 503 : 500 }
    );
  }
}

/**
 * PUT /api/settings
 * 設定を更新（バリデーション含む、シングルトンパターン）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = putSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const {
      dailySendTime,
      recipientEmail,
      emptySendBehavior,
      costLimitMonthly,
      costWarningRatio,
    } = parsed.data;

    // 固定IDで upsert（1レコードに保つ、CODE_REVIEW §5.1）
    const updatedSettings = await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        dailySendTime:
          dailySendTime !== undefined
            ? dailySendTime
            : DEFAULT_SETTINGS.dailySendTime,
        recipientEmail:
          recipientEmail !== undefined
            ? recipientEmail
            : DEFAULT_SETTINGS.recipientEmail,
        emptySendBehavior:
          emptySendBehavior !== undefined
            ? (emptySendBehavior as EmptySendBehavior)
            : DEFAULT_SETTINGS.emptySendBehavior,
        costLimitMonthly:
          costLimitMonthly !== undefined
            ? costLimitMonthly
            : DEFAULT_SETTINGS.costLimitMonthly,
        costWarningRatio:
          costWarningRatio !== undefined
            ? costWarningRatio
            : DEFAULT_SETTINGS.costWarningRatio,
      },
      update: {
        ...(dailySendTime !== undefined && { dailySendTime }),
        ...(recipientEmail !== undefined && { recipientEmail }),
        ...(emptySendBehavior !== undefined && {
          emptySendBehavior: emptySendBehavior as EmptySendBehavior,
        }),
        ...(costLimitMonthly !== undefined && { costLimitMonthly }),
        ...(costWarningRatio !== undefined && { costWarningRatio }),
      },
    });

    return NextResponse.json({
      dailySendTime: updatedSettings.dailySendTime,
      recipientEmail: updatedSettings.recipientEmail,
      emptySendBehavior: updatedSettings.emptySendBehavior,
      costLimitMonthly: updatedSettings.costLimitMonthly,
      costWarningRatio: updatedSettings.costWarningRatio,
    });
  } catch (error) {
    console.error("[PUT /api/settings] Error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
