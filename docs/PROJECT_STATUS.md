# Web Investigation プロジェクト最新状況

**更新日:** 2026-02-02  
**バージョン:** 1.0  
**参照:** docs/REQUIREMENTS.md v1.3, docs/SDD.md v1.1, docs/NEXT_TASKS.md

---

## 📊 プロジェクト概要

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | Web Investigation |
| **目的** | 生産技術×デジタル関連の技術情報をWebスクレイピングで収集し、LLMで要約してメールで配信するシステム |
| **技術スタック** | Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/UI, Prisma, PostgreSQL (Supabase), Claude API, Gmail |
| **開発フェーズ** | Phase 1完了、Phase 2以降未着手 |
| **最終コミット** | a8d171a - docs: 要求定義書 v1.2 |

---

## ✅ Phase 1: 基盤・収集（完了）

### 実装済み機能

| 機能 | 実装状況 | ファイル |
|------|----------|----------|
| **Prisma Schema** | ✅ 完了 | `prisma/schema.prisma` |
| **Source CRUD API** | ✅ 完了 | `src/app/api/sources/route.ts`, `src/app/api/sources/[id]/route.ts` |
| **Article CRUD API** | ✅ 完了 | `src/app/api/articles/route.ts`, `src/app/api/articles/[id]/route.ts` |
| **Scraper Service** | ✅ 完了 | `src/lib/scraper.ts` |
| **Cron Handler** | ✅ 完了 | `src/lib/cron-handler.ts` |
| **Cron API** | ✅ 完了 | `src/app/api/cron/daily/route.ts` |
| **Job Control API** | ✅ 完了 | `src/app/api/jobs/manual/route.ts`, `src/app/api/jobs/stop/route.ts` |
| **Health Check API** | ✅ 完了 | `src/app/api/health/route.ts` |

### 実装済みAPIエンドポイント

| エンドポイント | メソッド | 説明 | 認証 |
|----------------|----------|------|------|
| `/api/health` | GET | ヘルスチェック | なし |
| `/api/sources` | GET | ソース一覧取得 | なし |
| `/api/sources` | POST | ソース追加 | なし |
| `/api/sources/[id]` | GET | ソース1件取得 | なし |
| `/api/sources/[id]` | PUT | ソース更新 | なし |
| `/api/sources/[id]` | DELETE | ソース削除 | なし |
| `/api/articles` | GET | 記事一覧・検索 | なし |
| `/api/articles` | POST | 記事作成（内部用） | なし |
| `/api/articles/[id]` | GET | 記事1件取得 | なし |
| `/api/articles/[id]` | PUT | 記事更新（内部用） | なし |
| `/api/articles/[id]` | DELETE | 記事削除（内部用） | なし |
| `/api/cron/daily` | POST | 日次ジョブトリガー | Bearer Token (CRON_SECRET) |
| `/api/jobs/manual` | POST | 手動ジョブ実行 | Bearer Token (CRON_SECRET) |
| `/api/jobs/stop` | POST | ジョブ停止 | Bearer Token (CRON_SECRET) |

### 実装済み要件

| カテゴリ | 要件数 | 実装済み | 進捗率 |
|----------|--------|----------|--------|
| 収集（REQ-SCR-*） | 10 | 10 | 100% |
| スケジュール（REQ-SCH-*） | 4 | 4 | 100% |
| Web UI - ソース（REQ-UI-001〜004） | 4 | 4 (APIのみ) | 100% (API) |
| Web UI - 記事（REQ-UI-008〜011） | 4 | 4 (APIのみ) | 100% (API) |
| 拡張性（REQ-EXT-*） | 2 | 2 | 100% |
| ジョブ制御（REQ-JOB-*） | 2 | 2 | 100% |
| セキュリティ（REQ-SEC-004〜006） | 3 | 3 | 100% |

---

## ⏳ Phase 2: 要約（未着手）

### 未実装機能

| 機能 | 関連要件 | 優先度 |
|------|----------|--------|
| **Claude API連携** | REQ-SUM-001, REQ-SUM-002 | 🔴 高 |
| **要約リトライロジック** | REQ-SUM-003 | 🔴 高 |
| **並列/バッチ要約処理** | REQ-SUM-004 | 🟡 中 |
| **要約失敗状態の管理** | REQ-SUM-003 | 🔴 高 |

### 未実装要件

| カテゴリ | 要件数 | 実装済み | 進捗率 |
|----------|--------|----------|--------|
| 要約（REQ-SUM-*） | 4 | 0 | 0% |

---

## ⏳ Phase 2.5: Settings API（未着手・Phase 3前に必須）

### 未実装機能

| 機能 | 関連要件 | 優先度 |
|------|----------|--------|
| **Settings API (GET/PUT)** | REQ-UI-005〜007, REQ-UI-012 | 🔴 高 |

**注意:** Phase 3（配信）で Settings が必要なため、Phase 3 開始前に実装必須。

---

## ⏳ Phase 3: 配信（未着手）

### 未実装機能

| 機能 | 関連要件 | 優先度 |
|------|----------|--------|
| **Gmail送信機能** | REQ-EML-001〜003, REQ-EML-005 | 🔴 高 |
| **0件時設定対応** | REQ-EML-004 | 🔴 高 |
| **失敗通知メール** | REQ-EML-006 | 🟡 中 |

### 未実装要件

| カテゴリ | 要件数 | 実装済み | 進捗率 |
|----------|--------|----------|--------|
| 配信（REQ-EML-*） | 6 | 0 | 0% |

---

## ⏳ Phase 4: Web UI（未着手）

### 未実装機能

| 機能 | 関連要件 | 優先度 |
|------|----------|--------|
| **ソース設定画面** | REQ-UI-001〜004 | 🔴 高 |
| **配信設定画面** | REQ-UI-005〜007, REQ-UI-012 | 🔴 高 |
| **記事一覧・検索・詳細画面** | REQ-UI-008〜011 | 🔴 高 |
| **全文検索インデックス** | REQ-NFR-002, REQ-UI-009 | 🟡 中 |

### 現在のWeb UI状態

- **ランディングページ**: 実装済み（タイトル・説明のみ）
- **機能画面**: 未実装

---

## ⏳ Phase 5: 運用強化（未着手）

### 未実装機能

| 機能 | 関連要件 | 優先度 |
|------|----------|--------|
| **メトリクス記録・参照** | REQ-MET-001, REQ-MET-002 | 🟡 中 |
| **コスト確認機能** | REQ-NFR-006 | 🟢 低 |
| **コスト管理機能** | REQ-COT-001〜003 | 🟡 中 |

---

## 📈 全体進捗状況

### フェーズ別進捗

| フェーズ | 状態 | 進捗率 |
|---------|------|--------|
| **Phase 1: 基盤・収集** | ✅ 完了 | 100% |
| **Phase 2: 要約** | ⏳ 未着手 | 0% |
| **Phase 2.5: Settings API** | ⏳ 未着手 | 0% |
| **Phase 3: 配信** | ⏳ 未着手 | 0% |
| **Phase 4: Web UI** | ⏳ 未着手 | 0% |
| **Phase 5: 運用強化** | ⏳ 未着手 | 0% |

### 要件別進捗

| カテゴリ | 要件数 | 実装済み | 進捗率 |
|----------|--------|----------|--------|
| **収集** | 10 | 10 | 100% |
| **要約** | 4 | 0 | 0% |
| **配信** | 6 | 0 | 0% |
| **スケジュール** | 4 | 4 | 100% |
| **Web UI - ソース** | 4 | 4 (API) | 100% (API) |
| **Web UI - 配信** | 4 | 0 | 0% |
| **Web UI - 記事** | 4 | 4 (API) | 100% (API) |
| **拡張性** | 2 | 2 | 100% |
| **ジョブ制御** | 2 | 2 | 100% |
| **非機能要件** | 11 | 3 | 27% |
| **メトリクス** | 2 | 0 | 0% |
| **コスト管理** | 3 | 0 | 0% |
| **合計** | 60 | 29 | **48%** |

---

## 🔍 技術的詳細

### データベーススキーマ

| モデル | 状態 | 説明 |
|--------|------|------|
| **Source** | ✅ 実装済み | 収集ソース設定 |
| **Article** | ✅ 実装済み | 記事データ |
| **Settings** | ✅ スキーマ定義済み | 配信設定（API未実装） |
| **JobRun** | ✅ 実装済み | ジョブ実行履歴 |
| **Metric** | ✅ スキーマ定義済み | メトリクス（未使用） |

### 実装済みサービス

| サービス | ファイル | 説明 |
|----------|----------|------|
| **Scraper Service** | `src/lib/scraper.ts` | スクレイピングロジック（単一/一覧対応、並列制限、robots.txt、レート制限、HTMLサニタイズ） |
| **Cron Handler** | `src/lib/cron-handler.ts` | 日次ジョブ実行ロジック（Phase 1: 収集のみ） |
| **Prisma Client** | `src/lib/prisma.ts` | データベースアクセス |

### 未実装サービス

| サービス | 説明 | 優先度 |
|----------|------|--------|
| **Summarizer Service** | Claude API連携による要約生成 | 🔴 高 |
| **Email Sender Service** | Gmail送信機能 | 🔴 高 |

---

## 🚨 重要な注意事項

### 1. Settings APIの実装タイミング

- **現状**: Settings APIは未実装
- **問題**: Phase 3（配信）で Settings が必要
- **対応**: Phase 3 開始前に Settings API を実装必須（Phase 2.5として実装推奨）

### 2. データベース接続

- **Supabase**: MCP接続済み（project_ref: `eanxmobszkkkiemdvjbm`）
- **アプリ連携**: `.env` の `DATABASE_URL` を設定する必要あり
- **マイグレーション**: 未実行（`npx prisma migrate dev` が必要）

### 3. 環境変数

| 変数名 | 状態 | 説明 |
|--------|------|------|
| `DATABASE_URL` | ✅ 設定済み | Supabase接続文字列 |
| `CRON_SECRET` | ✅ 設定済み | 日次ジョブ認証用 |
| `ANTHROPIC_API_KEY` | ✅ 設定済み | Claude API認証（Phase 2用） |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ 要設定 | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ 要設定 | Supabase匿名キー |
| Gmail関連 | ⏳ 未定義 | Phase 3で必要 |

---

## 📋 次のアクション

### 即座に対応（Phase 1完了時）

1. ✅ **プロジェクト状況確認完了** - 本ドキュメント作成（2026-02-02）
2. ✅ **データベースマイグレーション** - 完了（2026-02-02）
   - 既存スキーマをベースラインとしてマーク
   - マイグレーションファイル: `prisma/migrations/20260202000000_init/migration.sql`
   - マイグレーション状態: `Database schema is up to date!`
3. ✅ **環境変数設定** - 完了（2026-02-02）
   - `DATABASE_URL`: 設定済み（Supabase接続）
   - `CRON_SECRET`: 設定済み
   - `ANTHROPIC_API_KEY`: 設定済み（Phase 2用）

### Phase 2開始前

1. **Settings API実装検討** - Phase 3で必要になるため、Phase 2と並行して実装を検討
2. ✅ **Claude API設定** - 完了（2026-02-02）

### Phase 2開始

1. **Summarizer Service実装** - Claude API連携
2. **要約リトライロジック実装** - 3回リトライ
3. **並列/バッチ要約処理実装** - スループット向上

---

## 📚 参照ドキュメント

| ドキュメント | バージョン | 説明 |
|-------------|-----------|------|
| `docs/REQUIREMENTS.md` | v1.2 | 要求定義書（EARS形式） |
| `docs/SDD.md` | v1.1 | 設計ドキュメント（C4モデル） |
| `docs/NEXT_TASKS.md` | v1.0 | 次のタスク整理 |
| `docs/DESIGN_REVIEW.md` | v1.0 | 設計書レビュー結果 |
| `docs/VERIFY.md` | v1.0 | 動作確認手順 |
| `README.md` | - | プロジェクト概要・セットアップ手順 |

---

## 🎯 プロジェクト目標

### 短期目標（Phase 2完了まで）

- ✅ Phase 1完了（収集機能）
- ⏳ Phase 2完了（要約機能）
- ⏳ Phase 2.5完了（Settings API）

### 中期目標（Phase 4完了まで）

- ⏳ Phase 3完了（メール配信）
- ⏳ Phase 4完了（Web UI）

### 長期目標（Phase 5完了まで）

- ⏳ Phase 5完了（運用強化・メトリクス・コスト管理）

---

**最終更新:** 2026-02-02  
**次回更新予定:** Phase 2完了時、または重要な変更発生時

---

## ✅ 完了した作業（2026-02-02）

1. ✅ **プロジェクト状況分析完了** - `docs/PROJECT_STATUS.md` 作成
2. ✅ **データベースマイグレーション整備**
   - 既存のデータベーススキーマをベースラインとしてマーク
   - マイグレーションファイル作成: `prisma/migrations/20260202000000_init/migration.sql`
   - マイグレーション状態: 正常（`Database schema is up to date!`）
3. ✅ **環境変数確認**
   - `DATABASE_URL`: 設定済み（Supabase接続）
   - `CRON_SECRET`: 設定済み
4. ✅ **Prisma Client生成確認** - 正常に生成済み
5. ✅ **ANTHROPIC_API_KEY設定** - 完了（2026-02-02）
   - Claude API認証キーを設定済み
   - Phase 2（要約機能）の実装準備完了
