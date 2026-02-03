/**
 * POST /api/test-email — メール送信の動作確認（CRON_SECRET 必須）
 * Gmail設定の検証とテストメール送信
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SETTINGS_ID } from "@/lib/constants";
import { sendEmptyNotificationEmail } from "@/lib/email-sender";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET が未設定です" },
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

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const configOk = !!(gmailUser && gmailPass);

  if (!configOk) {
    return NextResponse.json({
      success: false,
      diagnostic: {
        GMAIL_USER: gmailUser ? "設定済み" : "未設定",
        GMAIL_APP_PASSWORD: gmailPass ? "設定済み" : "未設定",
      },
      error: "GMAIL_USER または GMAIL_APP_PASSWORD が未設定です。.env を確認してください。",
    });
  }

  let recipientEmail: string | null = null;
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: SETTINGS_ID },
    });
    recipientEmail = settings?.recipientEmail ?? null;
  } catch {
    // DB エラー時はボディから取得を試す
  }

  const body = await request.json().catch(() => ({}));
  const to = (body.to as string) || recipientEmail;

  if (!to) {
    return NextResponse.json({
      success: false,
      diagnostic: {
        GMAIL_USER: "設定済み",
        GMAIL_APP_PASSWORD: "設定済み",
        recipientEmail: "未設定（配信設定で受信アドレスを登録するか、body: { to: 'your@email.com' } で指定）",
      },
      error: "送信先メールアドレスがありません。",
    });
  }

  const result = await sendEmptyNotificationEmail(to);

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: `テストメールを ${to} に送信しました。受信トレイ（迷惑メールフォルダも）を確認してください。`,
    });
  }

  return NextResponse.json({
    success: false,
    diagnostic: {
      GMAIL_USER: "設定済み",
      GMAIL_APP_PASSWORD: "設定済み",
      recipient: to,
    },
    error: result.error || "送信に失敗しました",
  });
}
