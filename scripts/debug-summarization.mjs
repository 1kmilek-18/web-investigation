#!/usr/bin/env node
/**
 * 要約機能のデバッグスクリプト
 * 
 * 使用方法:
 *   node scripts/debug-summarization.mjs <ARTICLE_ID>
 * 
 * 前提条件:
 *   - 開発サーバーが起動していること (npm run dev)
 *   - .env に ANTHROPIC_API_KEY が設定されていること
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// .env を読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";
const ARTICLE_ID = process.argv[2];

async function main() {
  console.log("=== 要約機能 デバッグ ===\n");

  if (!ARTICLE_ID) {
    console.error("❌ エラー: 記事IDを指定してください");
    console.error("使用方法: node scripts/debug-summarization.mjs <ARTICLE_ID>");
    process.exit(1);
  }

  // 環境変数の確認
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ エラー: ANTHROPIC_API_KEY が設定されていません");
    process.exit(1);
  }

  console.log(`✅ 環境変数の確認完了`);
  console.log(`📝 記事ID: ${ARTICLE_ID}\n`);

  // 記事の詳細を取得
  console.log("📄 記事の詳細を取得中...");
  const articleRes = await fetch(`${API_BASE}/api/articles/${ARTICLE_ID}`);

  if (!articleRes.ok) {
    const error = await articleRes.text();
    console.error("❌ 記事の取得に失敗しました");
    console.error(`レスポンス: ${error}\n`);
    process.exit(1);
  }

  const article = await articleRes.json();
  console.log("記事情報:");
  console.log(`  - ID: ${article.id}`);
  console.log(`  - URL: ${article.url}`);
  console.log(`  - タイトル: ${article.title}`);
  console.log(`  - 要約: ${article.summary || "(null)"}`);
  console.log(`  - 本文の長さ: ${article.rawContent?.length || 0} 文字`);
  console.log("");

  // 要約がnullの場合、手動で要約を試行
  if (article.summary === null) {
    console.log("⚠️  要約がnullです。手動ジョブを実行して要約を生成します...\n");
    
    if (!process.env.CRON_SECRET) {
      console.error("❌ エラー: CRON_SECRET が設定されていません");
      process.exit(1);
    }

    const jobRes = await fetch(`${API_BASE}/api/jobs/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    if (!jobRes.ok) {
      const error = await jobRes.text();
      console.error("❌ ジョブの実行に失敗しました");
      console.error(`レスポンス: ${error}\n`);
      process.exit(1);
    }

    const jobResult = await jobRes.json();
    console.log("ジョブ実行結果:");
    console.log(JSON.stringify(jobResult, null, 2));
    console.log("");

    // 要約処理の完了を待機
    console.log("⏳ 要約処理の完了を待機中（20秒）...");
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // 再度記事を取得して要約を確認
    console.log("📄 記事の要約を再確認中...");
    const articleRes2 = await fetch(`${API_BASE}/api/articles/${ARTICLE_ID}`);
    if (articleRes2.ok) {
      const article2 = await articleRes2.json();
      if (article2.summary && article2.summary !== null) {
        console.log("✅ 要約が生成されました！");
        console.log("要約内容:");
        console.log("─".repeat(80));
        console.log(article2.summary);
        console.log("─".repeat(80));
      } else {
        console.log("⚠️  要約がまだ生成されていません");
        console.log("開発サーバーのログを確認してください:");
        console.log("  - [summarizeSingleArticle] で始まるログ");
        console.log("  - [summarizeArticles] で始まるログ");
        console.log("  - エラーメッセージ");
      }
    }
  } else {
    console.log("✅ 要約は既に生成されています");
    console.log("要約内容:");
    console.log("─".repeat(80));
    console.log(article.summary);
    console.log("─".repeat(80));
  }

  console.log("\n=== デバッグ完了 ===");
}

main().catch((error) => {
  console.error("❌ エラーが発生しました:", error);
  process.exit(1);
});
