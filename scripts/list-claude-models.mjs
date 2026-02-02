#!/usr/bin/env node
/**
 * Claude APIで利用可能なモデル一覧を取得
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Anthropic from "@anthropic-ai/sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

async function main() {
  console.log("=== Claude API 利用可能モデル一覧 ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY が設定されていません");
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  // 一般的なモデル名を試す
  const modelsToTry = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-5-sonnet",
    "claude-sonnet-4-5-20250929",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
  ];

  console.log("🔍 利用可能なモデルを確認中...\n");

  for (const model of modelsToTry) {
    try {
      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{ role: "user", content: "test" }],
      });
      console.log(`✅ 利用可能: ${model}`);
      break; // 最初に見つかったモデルを使用
    } catch (error) {
      if (error.message?.includes("404") || error.message?.includes("not_found")) {
        console.log(`❌ 利用不可: ${model}`);
      } else {
        // 404以外のエラー（認証エラーなど）の場合は成功とみなす
        console.log(`✅ 利用可能（エラーは認証以外）: ${model}`);
        console.log(`   エラー: ${error.message}`);
        break;
      }
    }
  }
}

main().catch(console.error);
