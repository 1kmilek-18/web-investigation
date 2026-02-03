/**
 * Email Sender Service (REQ-EML-001〜006)
 * SDD 4.4: Gmail SMTP送信、リトライロジック、0件時設定対応、失敗通知
 * TSK-REV-020: 構造化ログ利用
 */

import nodemailer from "nodemailer";
import type { Article } from "@prisma/client";
import { logger } from "@/lib/logger";

/** 最大試行回数（合計3回）。REQ-EML-005, CODE_REVIEW §6.4: summarizer と統一 */
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // REQ-EML-005: 指数バックオフ（1s, 2s, 4s）

/** キャッシュ済み transporter（シングルトン、CODE_REVIEW §5.4） */
let cachedTransporter: nodemailer.Transporter | null = null;

/**
 * テスト用: キャッシュ済み transporter をリセット（REQ-REV-017, TSK-REV-017）
 * 本番では未使用。テスト間の状態クリア用。
 */
export function _resetTransporter(): void {
  cachedTransporter = null;
}

/**
 * Gmail SMTP transporterを取得（シングルトン、遅延初期化）
 */
function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  return cachedTransporter;
}

/**
 * HTMLエスケープ（XSS対策、CODE_REVIEW §4.1）
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 遅延処理（指数バックオフ用）
 */
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * メール送信をリトライ付きで実行
 * @param mailOptions メールオプション
 * @returns 送信成功時true、失敗時false
 */
async function sendEmailWithRetry(
  mailOptions: nodemailer.SendMailOptions
): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    const errorMsg = "GMAIL_USER or GMAIL_APP_PASSWORD is not configured";
    logger.error("GMAIL_USER or GMAIL_APP_PASSWORD is not configured");
    return { success: false, error: errorMsg };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info("Attempting to send email", { attempt, maxRetries: MAX_RETRIES });
      await transporter.sendMail(mailOptions);
      logger.info("Email sent successfully");
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Send email attempt failed", { attempt, maxRetries: MAX_RETRIES, error: errorMessage });

      if (attempt < MAX_RETRIES) {
        const delayMs = RETRY_DELAYS[attempt - 1];
        logger.info("Retrying after delay", { delayMs });
        await delay(delayMs);
      } else {
        // 最終リトライ失敗
        return { success: false, error: errorMessage };
      }
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

/**
 * 記事一覧のメール本文を生成（REQ-EML-003）
 * @param articles 送信する記事一覧
 * @returns HTML形式のメール本文
 */
function generateEmailBody(articles: Article[]): string {
  const articlesHtml = articles
    .map(
      (article) => `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
      <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 18px; color: #333;">
        ${escapeHtml(article.title || "タイトルなし")}
      </h2>
      <p style="margin: 8px 0; color: #666; line-height: 1.6;">
        ${escapeHtml(article.summary || "要約なし")}
      </p>
      <p style="margin: 8px 0;">
        <a href="${escapeHtml(article.url)}" style="color: #1976d2; text-decoration: none;">
          ${escapeHtml(article.url)}
        </a>
      </p>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
  </style>
</head>
<body>
  <h1 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 8px;">
    生産技術×デジタル 技術情報まとめ
  </h1>
  <p style="color: #666; margin-bottom: 24px;">
    本日収集された記事（${articles.length}件）
  </p>
  ${articlesHtml}
  <hr style="margin-top: 32px; border: none; border-top: 1px solid #e0e0e0;">
  <p style="color: #999; font-size: 12px; margin-top: 16px;">
    Web Investigation システムより自動配信
  </p>
</body>
</html>
  `.trim();
}

/**
 * 記事配信メールを送信（REQ-EML-001, REQ-EML-002, REQ-EML-003）
 * @param recipientEmail 受信者メールアドレス
 * @param articles 送信する記事一覧
 * @returns 送信成功時true、失敗時falseとエラーメッセージ
 */
export async function sendArticlesEmail(
  recipientEmail: string,
  articles: Article[]
): Promise<{ success: boolean; error?: string }> {
  if (articles.length === 0) {
    return { success: false, error: "No articles to send" };
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: `生産技術×デジタル 技術情報まとめ（${articles.length}件）`,
    html: generateEmailBody(articles),
  };

  return await sendEmailWithRetry(mailOptions);
}

/**
 * 0件時通知メールを送信（REQ-EML-004）
 * @param recipientEmail 受信者メールアドレス
 * @returns 送信成功時true、失敗時falseとエラーメッセージ
 */
export async function sendEmptyNotificationEmail(
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: "生産技術×デジタル 技術情報まとめ（本日は新規記事なし）",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
  </style>
</head>
<body>
  <h1 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 8px;">
    生産技術×デジタル 技術情報まとめ
  </h1>
  <p style="color: #666; margin-top: 24px;">
    本日は新規記事が収集されませんでした。
  </p>
  <hr style="margin-top: 32px; border: none; border-top: 1px solid #e0e0e0;">
  <p style="color: #999; font-size: 12px; margin-top: 16px;">
    Web Investigation システムより自動配信
  </p>
</body>
</html>
    `.trim(),
  };

  return await sendEmailWithRetry(mailOptions);
}

/**
 * 失敗通知メールを送信（REQ-EML-006）
 * @param recipientEmail 受信者メールアドレス
 * @param errors エラー情報の配列
 * @returns 送信成功時true、失敗時falseとエラーメッセージ
 */
export async function sendFailureNotificationEmail(
  recipientEmail: string,
  errors: Array<{
    sourceUrl?: string;
    articleUrl?: string;
    type: string;
    message: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  const errorsHtml = errors
    .map(
      (error) => `
    <div style="margin-bottom: 16px; padding: 12px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #856404;">
        エラータイプ: ${escapeHtml(error.type)}
      </p>
      ${error.sourceUrl ? `<p style="margin: 4px 0; color: #666;">ソースURL: <a href="${escapeHtml(error.sourceUrl)}">${escapeHtml(error.sourceUrl)}</a></p>` : ""}
      ${error.articleUrl ? `<p style="margin: 4px 0; color: #666;">記事URL: <a href="${escapeHtml(error.articleUrl)}">${escapeHtml(error.articleUrl)}</a></p>` : ""}
      <p style="margin: 4px 0 0 0; color: #856404;">
        ${escapeHtml(error.message)}
      </p>
    </div>
  `
    )
    .join("");

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: `Web Investigation ジョブ実行エラー通知（${errors.length}件）`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
  </style>
</head>
<body>
  <h1 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px;">
    Web Investigation ジョブ実行エラー通知
  </h1>
  <p style="color: #666; margin-top: 24px;">
    本日のジョブ実行中に ${errors.length} 件のエラーが発生しました。
  </p>
  ${errorsHtml}
  <hr style="margin-top: 32px; border: none; border-top: 1px solid #e0e0e0;">
  <p style="color: #999; font-size: 12px; margin-top: 16px;">
    Web Investigation システムより自動配信
  </p>
</body>
</html>
    `.trim(),
  };

  return await sendEmailWithRetry(mailOptions);
}
