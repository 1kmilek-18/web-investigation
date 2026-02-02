# 次のタスク整理

**作成日:** 2026-02-02  
**更新日:** 2026-02-02  
**参照:** docs/REQUIREMENTS.md v1.5、docs/SDD.md v1.1、実装フェーズ Phase 1〜5

---

## 0. 次の段階（現在地）

| 項目 | 内容 |
|------|------|
| **現在の段階** | Phase 1: 基盤・収集 |
| **直近のアクション** | タスク 1.5（収集ジョブ API）を実装済み。Phase 1 完了。次は Phase 2（要約）または 1.6（エラーハンドリング・ログ）。 |
| **完了済み** | 要求定義書、C4 設計（SDD）、トレーサビリティ、ADR、API 仕様、Prisma スキーマ定義 |

**推奨手順（Phase 1 開始）:**
1. `npx prisma migrate dev --name init` で初期マイグレーションを作成・適用
2. （任意）SDD 5.4 の全文検索用 `tsvector` は Phase 4 の記事検索実装時でも追加可能
3. タスク 1.2 ソース CRUD API の実装に着手

---

## 1. 接続・現状チェック結果

### 1.1 musubix MCP 接続

| ツール | 結果 | 備考 |
|--------|------|------|
| `sdd_query_knowledge` | ✅ 接続OK | ナレッジグラフは空（results: 0） |
| `sdd_validate_requirements` | ✅ 接続OK | EARS 100%, 憲法準拠 100% |

- 要求定義書 `docs/REQUIREMENTS.md` の検証が完了しており、品質上問題なし。

### 1.2 Supabase MCP 接続

| ツール | 結果 | 備考 |
|--------|------|------|
| `list_tables` | ✅ 接続OK | public スキーマにテーブルなし |

### 1.3 現状サマリ

| 項目 | 状態 |
|------|------|
| Prisma schema | SDD 準拠で定義済み（Source, Article, Settings, JobRun, Metric） |
| Supabase | マイグレーション未実行（次の手順: `npx prisma migrate dev`） |
| ソース設定 CRUD | 実装済み（GET/POST /api/sources, GET/PUT/DELETE /api/sources/[id]） |
| 記事 CRUD | 実装済み（GET/POST /api/articles, GET/PUT/DELETE /api/articles/[id]） |
| スクレイピング | 実装済み（src/lib/scraper.ts: scrapeAll, scrapeSource） |
| cron エンドポイント | 実装済み（POST /api/cron/daily, /api/jobs/manual, /api/jobs/stop） |
| Web UI | ランディングのみ（タイトル・説明） |

---

## 2. 要求定義の分析サマリ

### 2.1 機能要件カテゴリ

| カテゴリ | 要求数 | 主な内容 |
|----------|--------|----------|
| 収集（REQ-SCR-*） | 10 | スクレイピング、ソース種別、並列制限、重複排除 |
| 要約（REQ-SUM-*） | 4 | Claude 連携、要約保存、リトライ、並列処理 |
| 配信（REQ-EML-*） | 6 | 日次メール、Gmail、0件時設定、失敗通知 |
| スケジュール（REQ-SCH-*） | 4 | 日次ジョブ、HTTP API、CRON_SECRET、重複実行防止 |
| Web UI - ソース（REQ-UI-001〜004） | 4 | ソース追加・編集・削除・一覧 |
| Web UI - 配信（REQ-UI-005〜007, 012） | 4 | 送信時刻、宛先、0件時、認証情報 |
| Web UI - 記事（REQ-UI-008〜011） | 4 | 一覧、検索、日付フィルタ、詳細表示 |
| 拡張性（REQ-EXT-*） | 2 | コード変更なしのソース追加、ソース別設定 |
| 非機能（REQ-NFR-*, SEC-*, MET-*） | 11 | パフォーマンス、セキュリティ、メトリクス |

### 2.2 実装フェーズと依存関係

```
Phase 1（基盤・収集） → Phase 2（要約） → [Phase 2.5: Settings API 必須] → Phase 3（配信） → Phase 4（Web UI） → Phase 5（運用強化）
```

**設計レビュー対応（DESIGN_REVIEW.md）:** Phase 3（配信）で Settings が必要なため、**Phase 3 開始前に Settings API の実装を完了すること**。Phase 2 と並行して Phase 2.5 で実装可能。

---

## 3. 次のタスク一覧（優先順）

### Phase 1: 基盤・収集 【最優先】

| # | タスク | 関連要件 | 成果物 |
|---|--------|----------|--------|
| 1.1 | **DB スキーマ設計・マイグレーション** | REQ-SCR-005, REQ-UI-001〜004 | `Article`, `Source`, `JobRun` 等の Prisma モデル |
| 1.2 | **ソース設定の CRUD API** | REQ-UI-001〜004, REQ-EXT-001 | POST/GET/PUT/DELETE `/api/sources` |
| 1.3 | **記事の CRUD API（内部用）** 【実装済み】 | REQ-SCR-005, REQ-SCR-006 | 記事の保存・更新・取得（GET/POST /api/articles, GET/PUT/DELETE /api/articles/[id]） |
| 1.4 | **スクレイピングロジック** 【実装済み】 | REQ-SCR-001〜010 | 単一/一覧対応、並列3、robots.txt・レート制限・サニタイズ |
| 1.5 | **収集ジョブ API** 【実装済み】 | REQ-SCH-002〜004, REQ-JOB-001, REQ-JOB-002 | POST /api/cron/daily, /api/jobs/manual, /api/jobs/stop |
| 1.6 | **エラーハンドリング・ログ** | REQ-SCR-004, REQ-NFR-004 | ソース失敗時の継続、ログ出力 |

### Phase 2: 要約 【Phase 1 完了後】

| # | タスク | 関連要件 | 成果物 |
|---|--------|----------|--------|
| 2.1 | Claude API 連携 | REQ-SUM-001, REQ-SUM-002 | 要約生成・保存 |
| 2.2 | リトライ・失敗状態 | REQ-SUM-003 | 要約失敗時の扱い |
| 2.3 | 並列／バッチ処理 | REQ-SUM-004 | 要約のスループット向上 |

### Phase 2.5: Settings API 【Phase 2 と並行、Phase 3 前に必須】

| # | タスク | 関連要件 | 成果物 |
|---|--------|----------|--------|
| 2.5 | Settings API 実装 | REQ-UI-005〜007, REQ-UI-012 | GET/PUT /api/settings |

**注意:** Phase 3（配信）で Settings が必要なため、Phase 3 開始前に実装必須。

### Phase 2.5: Settings API 【Phase 2 と並行、Phase 3 前に必須】

| # | タスク | 関連要件 | 成果物 |
|---|--------|----------|--------|
| 2.5 | Settings API 実装 | REQ-UI-005〜007, REQ-UI-012 | GET/PUT /api/settings |

**注意:** Phase 3（配信）で Settings が必要なため、Phase 3 開始前に実装必須。

### Phase 3: 配信 【Phase 2 完了後、Settings API 実装後】

| # | タスク | 関連要件 | 成果物 |
|---|--------|----------|--------|
| 3.1 | Gmail 送信 | REQ-EML-001〜003, REQ-EML-005 | 日次メール送信 |
| 3.2 | 0件時設定 | REQ-EML-004 | スキップ or 案内メール |
| 3.3 | 失敗通知メール | REQ-EML-006 | ジョブ失敗時の通知 |

### Phase 4: Web UI 【Phase 3 完了後】

| # | タスク | 関連要件 | 成果物 |
|---|--------|----------|--------|
| 4.1 | ソース設定画面 | REQ-UI-001〜004 | ソース一覧・追加・編集・削除 |
| 4.2 | 配信設定画面 | REQ-UI-005〜007, REQ-UI-012 | 送信時刻・宛先・0件時（Settings API 使用） |
| 4.3 | 記事一覧・検索・詳細 | REQ-UI-008〜011 | 一覧、キーワード検索、日付フィルタ、詳細 |
| 4.4 | 全文検索インデックス（任意） | REQ-NFR-002, REQ-UI-009 | SDD 5.4: tsvector + GIN、または Prisma `contains` 簡易版 |

### Phase 5: 運用強化 【Phase 4 完了後】

| # | タスク | 関連要件 | 成果物 |
|---|--------|----------|--------|
| 5.1 | メトリクステーブル | REQ-MET-001, REQ-MET-002 | 実行単位のメトリクス記録・参照（Metric モデルは Phase 1 で定義済み） |
| 5.2 | コスト確認 | REQ-NFR-006 | Supabase / Claude 利用量の確認方法 |
| 5.3 | コスト管理 | REQ-COT-001〜003 | ジョブ単位の API 利用量記録、月次上限・警告メール（SDD Cron Handler 5-a） |

---

## 4. 即着手すべきタスク（Phase 1 詳細）

### タスク 1.1: DB スキーマ設計・マイグレーション 【SDD 適用済み】

**設計（SDD 5.3 準拠）:**

- **Source**: id, url (unique), type (single|list), selector?, config?, createdAt, updatedAt
- **Article**: id, url (unique), title, rawContent, summary?, sourceId, collectedAt, updatedAt
- **Settings**: id, dailySendTime, recipientEmail, emptySendBehavior, costLimitMonthly?, costWarningRatio, updatedAt
- **JobRun**: id, startedAt, finishedAt?, status, articlesCollected, articlesSummarized, errors?, metrics
- **Metric**: id, runId?, metricType, value, recordedAt

`prisma/schema.prisma` は SDD の完全スキーマで更新済み。

**手順（残り）:**
1. `npx prisma migrate dev --name init` でマイグレーション作成・適用
2. （Phase 4 記事検索時）SDD 5.4 の全文検索用 `tsvector` マイグレーションを追加可能

### タスク 1.2: ソース設定 CRUD API 【実装済み】

- `GET /api/sources` — 一覧取得
- `POST /api/sources` — ソース追加（body: `{ url, type, selector?, config? }`）
- `GET /api/sources/[id]` — 1件取得（編集用）
- `PUT /api/sources/[id]` — 更新
- `DELETE /api/sources/[id]` — 削除

実装: `src/lib/prisma.ts`, `src/app/api/sources/route.ts`, `src/app/api/sources/[id]/route.ts`

### タスク 1.3: 記事の CRUD API 【実装済み】

- `GET /api/articles` — 一覧・検索（query: `page`, `limit`, `keyword`, `dateFrom`, `dateTo`）→ `{ articles, total, page, limit }`
- `POST /api/articles` — 記事作成（body: `{ url, rawContent, title?, summary?, sourceId?, collectedAt? }`）
- `GET /api/articles/[id]` — 1件取得（詳細）
- `PUT /api/articles/[id]` — 記事更新（内部/スクレイパー用）
- `DELETE /api/articles/[id]` — 記事削除（内部用）

実装: `src/app/api/articles/route.ts`, `src/app/api/articles/[id]/route.ts`

### タスク 1.4: スクレイピング 【実装済み】

- **src/lib/scraper.ts**: `scrapeAll(sources)`, `scrapeSource(source)`, `isAllowedByRobotsTxt(url)`
- 単一/一覧ソース (REQ-SCR-007)、並列最大3ソース (REQ-SCR-010)、ソース内は直列
- URL 重複は upsert で1記事に (REQ-SCR-008)、失敗時はログして継続 (REQ-SCR-004)
- robots.txt 尊重 (REQ-SEC-005)、オリジン間レート制限 (REQ-SEC-004)、HTML サニタイズ (REQ-SEC-006)
- 依存: cheerio, p-limit, sanitize-html

### タスク 1.5: 収集ジョブ API 【実装済み】

- **POST /api/cron/daily** — 日次トリガー。`Authorization: Bearer ${CRON_SECRET}` 必須。重複時 409。内部で `runDailyJob()` → `scrapeAll(sources)`。
- **POST /api/jobs/manual** — 手動実行（同一認証・同一ロジック）。
- **POST /api/jobs/stop** — 実行中ジョブを `stopping` に更新。ジョブ側は収集完了後に `stopped` で終了（次のフェーズには進まない）。
- **src/lib/cron-handler.ts**: `hasRunningJob()`, `runDailyJob()`。JobRun 作成 → scrapeAll → 完了/停止/失敗で更新。
- `.env`: `CRON_SECRET` を設定すること。

### タスク 1.6

- エラーハンドリング・ログ: ソース失敗時の継続は scraper で対応済み。ログ出力の統一（Winston/Pino 等）は任意。

### タスク 2.5: Settings API 実装 【Phase 2.5】

**設計（SDD 9.5 準拠）:**

- **GET /api/settings** — 設定取得 → `{ dailySendTime, recipientEmail, emptySendBehavior, costLimitMonthly?, costWarningRatio? }`
- **PUT /api/settings** — 設定更新（body: `{ dailySendTime?, recipientEmail?, emptySendBehavior?, costLimitMonthly?, costWarningRatio? }`）

**実装方針:**

- Settings モデルは Prisma schema で定義済み（Phase 1）
- 単一レコードとして管理（id は固定値または upsert で1件のみ）
- バリデーション: dailySendTime は "HH:mm" 形式、recipientEmail はメール形式、emptySendBehavior は enum、costLimitMonthly は正の数、costWarningRatio は 0〜1

**実装ファイル:**

- `src/app/api/settings/route.ts` — GET/PUT ハンドラー

**注意:** Phase 3（配信）で Settings が必要なため、Phase 3 開始前に実装必須。

---

## 5. musubix の活用（任意）

- `sdd_create_design`: Phase 1 の DB／API 設計を C4 や ADR に落とし込む
- `sdd_create_tasks`: 設計ドキュメントからタスク分解
- `sdd_update_knowledge`: 要件・設計・タスクをナレッジグラフに登録し、後続フェーズで参照

---

## 6. 参照

- `docs/REQUIREMENTS.md` — 要求定義書 v1.5
- `docs/SDD.md` — C4 設計ドキュメント（トレーサビリティ含む）
- `STRUCTURE.md` — ディレクトリ構成
- `.knowledge/graph.json` — ローカルナレッジグラフ（6 エンティティ）
