#!/usr/bin/env node
/**
 * Phase 2 要約機能の動作確認スクリプト
 * 
 * 使用方法:
 *   node scripts/verify-summarization.mjs
 * 
 * 前提条件:
 *   - 開発サーバーが起動していること (npm run dev)
 *   - .env に ANTHROPIC_API_KEY と CRON_SECRET が設定されていること
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// .env を読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

async function main() {
  console.log("=== Phase 2 要約機能 動作確認 ===\n");

  // 環境変数の確認
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ エラー: ANTHROPIC_API_KEY が設定されていません");
    process.exit(1);
  }

  if (!CRON_SECRET) {
    console.error("❌ エラー: CRON_SECRET が設定されていません");
    process.exit(1);
  }

  console.log("✅ 環境変数の確認完了\n");

  // 開発サーバーが起動しているか確認（複数回リトライ）
  let serverReady = false;
  const maxRetries = 5;
  const retryDelay = 2000; // 2秒
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔍 開発サーバーの確認を再試行中... (${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        console.log(`🔍 開発サーバーに接続中: ${API_BASE}/api/health`);
      }
      
      // タイムアウト付きでfetchを実行
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const healthRes = await fetch(`${API_BASE}/api/health`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (healthRes.ok) {
        const healthData = await healthRes.json().catch(() => ({}));
        console.log("✅ 開発サーバーが起動中");
        console.log(`   レスポンス: ${JSON.stringify(healthData)}\n`);
        serverReady = true;
        break;
      } else if (healthRes.status === 404) {
        // 404の場合は、サーバーは起動しているがAPIルートがまだ認識されていない
        if (attempt < maxRetries) {
          console.log(`   APIルートがまだ認識されていません (404)。待機中...`);
          continue;
        } else {
          console.warn("⚠️  APIエンドポイントが見つかりませんでした (404)");
          console.warn("   開発サーバーは起動していますが、APIルートが認識されていない可能性があります");
          console.warn("   確認事項:");
          console.warn("   1. 開発サーバーが完全に起動しているか確認（'Ready' と表示されるまで待つ）");
          console.warn("   2. ビルドエラーがないか確認（開発サーバーのターミナルを確認）");
          console.warn("   3. 数秒待ってから再実行してください");
          console.warn("   続行を試みます...\n");
          // 404でも続行を許可（サーバーは起動している）
          serverReady = true;
          break;
        }
      } else {
        const errorText = await healthRes.text();
        console.error(`⚠️  ヘルスチェックが失敗しました: HTTP ${healthRes.status}`);
        console.error(`   レスポンス: ${errorText.substring(0, 200)}`);
        if (attempt < maxRetries) {
          continue;
        } else {
          throw new Error(`Health check failed with status ${healthRes.status}`);
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        if (attempt < maxRetries) {
          console.log(`   接続タイムアウト。再試行します...`);
          continue;
        } else {
          console.error("⚠️  開発サーバーへの接続がタイムアウトしました");
          console.error("   開発サーバーが起動するまで待ってから再実行してください\n");
          process.exit(1);
        }
      } else if (error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch failed") || error.code === "ECONNREFUSED") {
        if (attempt < maxRetries) {
          console.log(`   接続できませんでした。再試行します...`);
          continue;
        } else {
          console.error("⚠️  開発サーバーに接続できませんでした");
          console.error(`   エラー: ${error.message || error}`);
          console.error(`   確認事項:`);
          console.error(`   1. 開発サーバーが起動しているか確認 (npm run dev)`);
          console.error(`   2. ポート3000で起動しているか確認`);
          console.error(`   3. ファイアウォールやプロキシの設定を確認\n`);
          process.exit(1);
        }
      } else {
        if (attempt < maxRetries) {
          console.log(`   エラーが発生しました。再試行します...`);
          continue;
        } else {
          console.error("⚠️  開発サーバーの確認中にエラーが発生しました");
          console.error(`   エラー: ${error.message || error}`);
          console.error(`   続行を試みます...\n`);
          // エラーでも続行を試みる（サーバーは起動している可能性がある）
          serverReady = true;
          break;
        }
      }
    }
  }
  
  if (!serverReady) {
    console.error("❌ 開発サーバーに接続できませんでした");
    console.error("   開発サーバーを起動してから再実行してください: npm run dev\n");
    process.exit(1);
  }

  // テスト用の記事を作成（summary=null）
  console.log("📝 テスト用の記事を作成中...");
  const testArticle = {
    url: `https://example.com/test-article-${Date.now()}`,
    title: "テスト記事: 生産技術とデジタル化の未来",
    rawContent: `生産技術の分野では、デジタル化が急速に進んでいます。IoT、AI、ロボティクスなどの技術を活用することで、製造プロセスの効率化や品質向上が実現されています。

特に、デジタルツイン技術により、物理的な製造ラインを仮想空間で再現し、シミュレーションを通じて最適化を行うことが可能になりました。また、データドリブンな意思決定により、従来の経験則に頼らない、より科学的なアプローチが可能になっています。

さらに、5Gやエッジコンピューティングの普及により、リアルタイムでのデータ処理と制御が可能になり、製造現場の柔軟性と応答性が大幅に向上しています。これらの技術を組み合わせることで、スマートファクトリーの実現が現実のものとなってきています。`,
    summary: null,
    collectedAt: new Date().toISOString(),
  };

  const createRes = await fetch(`${API_BASE}/api/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testArticle),
  });

  if (!createRes.ok) {
    const error = await createRes.text();
    console.error("❌ 記事の作成に失敗しました");
    console.error(`レスポンス: ${error}\n`);
    process.exit(1);
  }

  const createdArticle = await createRes.json();
  const articleId = createdArticle.id;
  console.log(`✅ 記事を作成しました (ID: ${articleId})\n`);

  // 手動ジョブを実行
  console.log("🚀 手動ジョブを実行中（要約処理を含む）...");
  const jobRes = await fetch(`${API_BASE}/api/jobs/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRON_SECRET}`,
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
  console.log("⏳ 要約処理の完了を待機中（15秒）...");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // 記事の要約を確認
  console.log("📄 記事の要約を確認中...");
  const articleRes = await fetch(`${API_BASE}/api/articles/${articleId}`);

  if (!articleRes.ok) {
    const error = await articleRes.text();
    console.error("❌ 記事の取得に失敗しました");
    console.error(`レスポンス: ${error}\n`);
    process.exit(1);
  }

  const articleDetail = await articleRes.json();

  if (articleDetail.summary && articleDetail.summary !== null) {
    console.log("✅ 要約が生成されました！\n");
    console.log("要約内容:");
    console.log("─".repeat(80));
    console.log(articleDetail.summary);
    console.log("─".repeat(80));
    console.log("");
  } else {
    console.log("⚠️  要約がまだ生成されていないか、エラーが発生した可能性があります");
    console.log("記事詳細:");
    console.log(JSON.stringify(articleDetail, null, 2));
    console.log("");
  }

  // メトリクスの確認（JobRunから）
  if (jobResult.jobRunId) {
    console.log("📊 ジョブ実行結果:");
    console.log(`  - 収集記事数: ${jobResult.articlesCollected || 0}`);
    console.log(`  - 要約記事数: ${jobResult.articlesSummarized || "未取得"}`);
    if (jobResult.errors && jobResult.errors.length > 0) {
      console.log(`  - エラー数: ${jobResult.errors.length}`);
      console.log("  エラー詳細:");
      jobResult.errors.forEach((err, i) => {
        console.log(`    ${i + 1}. ${JSON.stringify(err)}`);
      });
    }
    console.log("");
  }

  console.log("=== 動作確認完了 ===");
}

main().catch((error) => {
  console.error("❌ エラーが発生しました:", error);
  process.exit(1);
});
