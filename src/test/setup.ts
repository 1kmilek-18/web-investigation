/**
 * Vitest セットアップファイル
 * テスト実行前の初期化処理
 */

import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// 環境変数のモック
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "test-api-key";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
