#!/usr/bin/env node
/**
 * Claude API接続確認スクリプト
 * 
 * 使用方法:
 *   node scripts/check-claude-api.mjs
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Anthropic from "@anthropic-ai/sdk";

// .env を読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

async function main() {
  console.log("=== Claude API 接続確認 ===\n");

  // 環境変数の確認
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error("❌ エラー: ANTHROPIC_API_KEY が設定されていません");
    console.error("\n.env ファイルに以下を追加してください:");
    console.error('ANTHROPIC_API_KEY="sk-ant-api03-..."');
    process.exit(1);
  }

  console.log("✅ ANTHROPIC_API_KEY が設定されています");
  console.log(`   キーの長さ: ${apiKey.length} 文字`);
  console.log(`   キーのプレフィックス: ${apiKey.substring(0, 15)}...\n`);

  // Claude APIクライアントの初期化
  console.log("🔍 Claude APIクライアントを初期化中...");
  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  // 簡単なテストリクエストを送信
  console.log("📤 テストリクエストを送信中...");
  
  try {
    const testPrompt = "こんにちは。これは接続テストです。'OK'とだけ返答してください。";
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: testPrompt,
        },
      ],
    });

    const content = response.content[0];
    
    if (content.type === "text") {
      console.log("✅ Claude APIへの接続が成功しました！\n");
      console.log("📥 レスポンス:");
      console.log(`   内容: ${content.text}`);
      console.log(`   入力トークン数: ${response.usage.input_tokens}`);
      console.log(`   出力トークン数: ${response.usage.output_tokens}`);
      console.log(`   モデル: claude-sonnet-4-5-20250929\n`);
      
      console.log("=== 接続確認完了 ===");
      console.log("✅ Claude APIは正常に動作しています");
    } else {
      console.error("❌ 予期しないレスポンス形式です");
      console.error(`   レスポンスタイプ: ${content.type}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Claude APIへの接続に失敗しました\n");
    
    if (error instanceof Error) {
      console.error("エラー詳細:");
      console.error(`   エラー名: ${error.name}`);
      console.error(`   エラーメッセージ: ${error.message}`);
      
      // よくあるエラーの対処法を表示
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        console.error("\n💡 対処法:");
        console.error("   - APIキーが無効または間違っている可能性があります");
        console.error("   - Anthropic Console (https://console.anthropic.com/) でAPIキーを確認してください");
        console.error("   - 新しいAPIキーを生成して .env ファイルを更新してください");
      } else if (error.message.includes("429") || error.message.includes("rate limit")) {
        console.error("\n💡 対処法:");
        console.error("   - APIのレート制限に達している可能性があります");
        console.error("   - しばらく待ってから再試行してください");
      } else if (error.message.includes("ECONNREFUSED") || error.message.includes("network")) {
        console.error("\n💡 対処法:");
        console.error("   - ネットワーク接続を確認してください");
        console.error("   - ファイアウォールやプロキシの設定を確認してください");
      } else {
        console.error("\n💡 対処法:");
        console.error("   - エラーメッセージを確認してください");
        console.error("   - Anthropicのステータスページを確認してください");
      }
      
      if (error.stack) {
        console.error("\nスタックトレース:");
        console.error(error.stack);
      }
    } else {
      console.error("予期しないエラー:", error);
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});
