# Web Investigation 要求定義書

**バージョン:** 1.5  
**作成日:** 2026-02-02  
**更新日:** 2026-02-03  
**レビュー:** docs/REQUIREMENTS_REVIEW.md (2026-02-02), docs/CODE_REVIEW.md §6–7 (2026-02-03)  
**対象:** 生産技術×デジタル 技術情報 収集・要約・メール配信システム

---

## 1. 概要

### 1.1 目的

生産技術×デジタル関連の技術情報を Web スクレイピングで収集し、LLM で要約してメールで配信する。情報ソースは運用しながら絞り込んでいく。

### 1.2 スコープ

- **利用者:** 単一ユーザー（開発者本人）
- **配信先:** 同上（複数記事を1通のメールにまとめて配信）
- **情報ソース:** 運用しながら決定（事前に固定しない）
- **データベース:** Supabase（PostgreSQL）
- **メール送信:** Gmail 専用アカウント
- **LLM:** Claude（Anthropic）
- **デプロイ:** 自前サーバー（当初）、将来的に Vercel も検討
- **想定ソース例:** MONOist, Qiita, note, X (Twitter), 日経xTECH

---

## 2. 機能要件（EARS形式）

### ユーザー価値
本システムは、生産技術×デジタル関連の技術情報を自動収集・要約・配信することで、ユーザーが最新情報を効率的に把握できるようにする。手動での情報収集時間を削減し、重要な情報の見逃しを防ぐ。

### 2.1 収集（Scraping）

**ユーザー価値:** 複数のWebサイトから技術情報を自動的に収集し、手動での情報収集時間を削減する。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SCR-001 | Ubiquitous | The system shall collect articles from user-configured web sources via scraping only. |
| REQ-SCR-002 | Event-Driven | When the scheduled job runs, the system shall scrape each configured source and store or update articles. |
| REQ-SCR-003 | Event-Driven | When a new source is added via Web UI, the system shall include it in the next scheduled scrape. |
| REQ-SCR-004 | Unwanted Behavior | If a source is unreachable or returns an error, then the system shall log the failure and continue with other sources. |
| REQ-SCR-005 | Ubiquitous | The system shall store each article with URL, title, raw content, and collected-at timestamp. |
| REQ-SCR-006 | Ubiquitous | The system shall fetch articles by URL each time; if the same URL already exists and raw content has changed, the system shall update the record and mark the summary for regeneration (summary is set to null when content changes). |
| REQ-SCR-007 | Ubiquitous | The system shall support two source types: (a) single-article URL, and (b) list-page URL from which multiple article URLs are extracted. |
| REQ-SCR-008 | Ubiquitous | When the same article URL appears from multiple sources, the system shall treat it as one article and include it once in the output (e.g. email). |
| REQ-SCR-009 | Ubiquitous | The system may process multiple sources in parallel during collection, subject to concurrent-scraping limits. |
| REQ-SCR-010 | Ubiquitous | The system shall limit concurrent scraping to at most 3 sources at a time; within a source, the system shall fetch list and article pages sequentially or with at most 2 concurrent requests per source to avoid overloading target sites. |

**受け入れ基準:**
- 同時に実行されるスクレイピングタスクが最大3つであることをログで確認できる
- ソース内のリクエストが直列または最大2並列であることをログで確認できる
- 対象サイトへのリクエスト間隔が1200ms以上であることをログで確認できる

### 2.2 要約（LLM）

**ユーザー価値:** 長文の技術記事を短い要約に変換し、素早く内容を把握できるようにする。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SUM-001 | Event-Driven | When a new article is collected or when an existing article's raw content has changed (summary is null), the system shall generate a summary using Claude (Anthropic). |
| REQ-SUM-002 | Ubiquitous | The system shall store the summary with the article record. |
| REQ-SUM-003 | Unwanted Behavior | If LLM summarization fails after retrying up to 3 times with exponential backoff (1s, 2s, 4s), then the system shall leave the summary field as null and record the failure in the job run errors. |
| REQ-SUM-004 | Ubiquitous | Where feasible, the system shall process summarization for multiple articles in parallel or in configurable batches to improve throughput. |

**受け入れ基準:**
- 新規記事または本文変更記事（summary=null）に対して要約が生成される
- 要約失敗時は3回までリトライし、指数バックオフ（1s, 2s, 4s）で実行される
- 要約失敗後はsummaryがnullのまま、JobRun.errorsにエラーが記録される
- 複数記事の要約が並列またはバッチで処理される（実装で決定）

### 2.3 配信（Email）

**ユーザー価値:** 収集・要約された記事を1通のメールで配信し、毎日の情報更新を確実に受け取れるようにする。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-EML-001 | Event-Driven | When the daily scheduled job completes, the system shall send one email containing all articles that were collected and successfully summarized during that job run (articles collected on the same day). |
| REQ-EML-002 | Ubiquitous | The system shall send emails via a dedicated Gmail account (SMTP or Gmail API). |
| REQ-EML-003 | Ubiquitous | The system shall include article title, summary, and URL in each email entry. |
| REQ-EML-004 | State-Driven | When the daily job completes and no new articles were collected during that job run, the system shall either skip sending an email or send a "no new articles" notification, according to the emptySendBehavior setting. |
| REQ-EML-005 | Unwanted Behavior | If email delivery fails, then the system shall log the error and retry up to 3 times with exponential backoff (1s, 2s, 4s) before recording the failure in job run errors. |
| REQ-EML-006 | Event-Driven | When the daily job completes with one or more failures (source unreachable, summarization failed, email delivery failed), the system shall send a notification email to the configured recipient containing the failure details (e.g. source URL, article URL, error type, error message). |

**受け入れ基準:**
- ジョブ実行時に新規記事が収集・要約された場合、1通のメールにすべての記事が含まれる
- メールには各記事のタイトル、要約、URLが含まれる
- 0件時はemptySendBehavior設定に応じてスキップまたは通知メールが送信される
- メール送信失敗時は最大3回までリトライし、失敗時はJobRun.errorsに記録される
- ジョブ実行時に1件以上の失敗がある場合、失敗通知メールが送信される

### 2.4 スケジュール

**ユーザー価値:** 日次で自動的に情報を収集・配信し、手動操作を不要にする。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SCH-001 | Ubiquitous | The system shall run collection and distribution daily at a configurable time. |
| REQ-SCH-002 | Ubiquitous | The system shall expose an HTTP API endpoint (e.g. POST /api/cron/daily) that triggers the daily job, so it can be invoked by external schedulers (crontab, systemd timer, cron-job.org, or Vercel Cron). |
| REQ-SCH-003 | Ubiquitous | The system shall protect the cron endpoint with a shared secret (e.g. CRON_SECRET) passed in the request header. |
| REQ-SCH-004 | Unwanted Behavior | When the daily job is triggered while a previous run is still in progress, the system shall not start a second run (e.g. by using a lock or checking run status) and shall log or respond that the request was skipped. |

**受け入れ基準:**
- POST /api/cron/daily が実行中ジョブがある状態で呼ばれた場合、409 Conflictが返される
- レスポンスに "Job already running" のメッセージが含まれる
- 新しいジョブは開始されない

### 2.5 Web UI - 収集ソース設定

**ユーザー価値:** Web UIでソースを簡単に追加・編集・削除でき、コード変更なしで収集対象を変更できる。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-UI-001 | Event-Driven | When the user adds a source, the system shall persist URL and optional selector/config. |
| REQ-UI-002 | Event-Driven | When the user edits a source, the system shall update the stored configuration. |
| REQ-UI-003 | Event-Driven | When the user deletes a source, the system shall remove it from future scrapes. |
| REQ-UI-004 | Ubiquitous | The system shall display the list of configured sources with add/edit/delete actions. |

### 2.6 Web UI - 配信設定

| ID | パターン | 要求 |
|----|----------|------|
| REQ-UI-005 | Ubiquitous | The system shall allow configuring the daily send time. |
| REQ-UI-006 | Ubiquitous | The system shall allow configuring the recipient email address. |
| REQ-UI-007 | Ubiquitous | The system shall allow configuring whether to send email when no new articles exist (skip or send notification). |
| REQ-UI-012 | Optional | Where Gmail credentials are used, the system shall store them securely (env vars or secrets). |

### 2.6.1 Settings API

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SET-001 | Ubiquitous | The system shall provide a GET /api/settings endpoint that returns the current settings (dailySendTime, recipientEmail, emptySendBehavior, costLimitMonthly, costWarningRatio). |
| REQ-SET-002 | Event-Driven | When the user updates settings via PUT /api/settings, the system shall validate and persist the new values. |
| REQ-SET-003 | Ubiquitous | The system shall validate dailySendTime as "HH:mm" format (24-hour), recipientEmail as valid email format, emptySendBehavior as enum value (skip or sendNotification), costLimitMonthly as positive number or null, and costWarningRatio as number between 0 and 1. |
| REQ-SET-004 | Ubiquitous | The system shall manage settings as a single record (singleton pattern) in the Settings table. |

### 2.7 Web UI - 過去記事の閲覧・検索

| ID | パターン | 要求 |
|----|----------|------|
| REQ-UI-008 | Ubiquitous | The system shall display a list of past articles with title, summary, collected date, and source. |
| REQ-UI-009 | Event-Driven | When the user searches by keyword, the system shall filter articles by title or summary. |
| REQ-UI-010 | Event-Driven | When the user filters by date range, the system shall show only articles in that range. |
| REQ-UI-011 | Event-Driven | When the user clicks an article, the system shall show full content and link to original URL. |

### 2.8 情報ソースの拡張性

| ID | パターン | 要求 |
|----|----------|------|
| REQ-EXT-001 | Ubiquitous | The system shall support adding and removing sources without code changes. |
| REQ-EXT-002 | Ubiquitous | The system shall allow per-source optional settings (e.g. CSS selector for content extraction). |

### 2.9 ジョブ制御

| ID | パターン | 要求 |
|----|----------|------|
| REQ-JOB-001 | Event-Driven | When the user triggers a manual run via Web UI or API, the system shall start the daily job as if triggered by the scheduler. |
| REQ-JOB-002 | Event-Driven | When the user requests to stop a running job, the system shall gracefully stop after the current phase completes and shall not proceed to the next phase. |

### 2.10 コードレビュー対応要件（未対応・新規検出）

**出典:** docs/CODE_REVIEW.md §6–7（2026-02-03）。REQ-REV-001～013 は対応済み。以下は未対応項目を EARS 形式で要件化し、**影響度**と**対応可能性**で評価したもの。

**影響度:** 高＝本番デプロイ／品質に直結、中＝保守性・安定性、低＝軽微な品質改善  
**対応可能性:** 高＝工数小・リスク低、中＝要検証、低＝工数大または環境依存

| ID | パターン | 優先度 | 要求 | 影響度 | 対応可能性 |
|----|----------|--------|------|--------|------------|
| REQ-REV-014 | Ubiquitous | P0 | The system shall build and deploy successfully in the target runtime (e.g. Node.js 20+ where `File`/`Blob` are defined, or with instrumentation/polyfill so that Next.js page-data collection does not fail with "File is not defined"). | 高（デプロイ不可） | 高（Node 20+ 推奨）／中（instrumentation） |
| REQ-REV-015 | Ubiquitous | P2 | The system shall use a consistent version of Next.js and @next/swc (and related tooling) so that build and dev do not report version mismatch. | 中（ビルド安定性） | 高 |
| REQ-REV-016 | Ubiquitous | P2 | When persisting JobRun errors (JSON column), the system shall use a type-safe representation (e.g. Prisma.InputJsonValue or a dedicated helper) and shall not rely on unchecked `as object` casts. | 中（型安全性） | 高 |
| REQ-REV-017 | Ubiquitous | P3 | Where a singleton or module-level cache is used (e.g. nodemailer transporter), the system shall expose a test-only reset mechanism so that tests do not suffer from cross-test state. | 低（テスタビリティ） | 高 |
| REQ-REV-018 | Ubiquitous | P3 | The system shall not retain dead mock definitions (e.g. findFirst when only findUnique is used); test fixtures shall match actual usage. | 低（コード品質） | 高 |
| REQ-REV-019 | Ubiquitous | P3 | The system shall not retain unused imports (e.g. EmptySendBehavior when not referenced in the file). | 低（コード品質） | 高 |
| REQ-REV-020 | Ubiquitous | P3 | The system shall use structured or designated logging (e.g. log levels, structured fields) for errors and important events instead of raw console.log/console.error where operational analysis is needed. | 中（運用性） | 中 |
| REQ-REV-021 | Ubiquitous | P3 | The system shall include front-end tests (e.g. @testing-library/react) for critical UI flows where the dependency is already present. | 中（品質） | 低（工数大） |
| REQ-REV-022 | Ubiquitous | P3 | The system shall include integration tests for API routes covering validation edge cases (e.g. invalid body, missing auth). | 中（品質） | 中 |

#### REQ-REV-014: ビルド環境・File/Blob（P0）

| 項目 | 内容 |
|------|------|
| **根拠** | Node.js 18 等で `File` 未定義のため `next build` のページデータ収集が失敗し、本番デプロイが不可になる。 |
| **受け入れ基準** | (1) 対象ランタイムで `next build` が成功する。(2) `/api/cron/daily` 等の API ルートがビルド時にエラーにならない。(3) Node.js 20+ への昇格、または instrumentation 等の polyfill で対応した場合はその旨をドキュメントに記載する。 |

#### REQ-REV-015: Next.js / @next/swc バージョン一致（P2）

| 項目 | 内容 |
|------|------|
| **根拠** | バージョン不一致はビルドの不安定さや予期しない動作の原因となる。 |
| **受け入れ基準** | (1) `next build` 実行時に @next/swc のバージョン不一致警告が出ない。(2) package.json / lockfile で Next.js と @next/swc のバージョンが整合している。 |

#### REQ-REV-016: JobRun errors の型安全な永続化（P2）

| 項目 | 内容 |
|------|------|
| **根拠** | `as object` キャストの残存は型安全性を損ない、将来のリファクタでバグの温床になりうる。 |
| **既存参照** | REQUIREMENTS_REVIEW_CODE_REVIEW.md の BACKLOG-REV-3 を本要件に昇格。 |
| **受け入れ基準** | (1) cron-handler 内で JobRun.errors に書き込む箇所で未チェックの `as object` を使用していない。(2) Prisma.InputJsonValue または専用ヘルパーで型安全に変換している。(3) 既存の cron-handler テストが通る。 |

#### REQ-REV-017: シングルトン／キャッシュのテスト用リセット（P3）

| 項目 | 内容 |
|------|------|
| **根拠** | モジュールスコープのキャッシュがテスト間で残ると、環境変数変更等のテストが不安定になる。 |
| **受け入れ基準** | (1) テスト用のリセット関数（例: _resetTransporter）がエクスポートされている、または同等の手段でテスト間の状態をクリアできる。(2) 既存の email-sender テストが通る。 |

#### REQ-REV-018: デッドモックの削除（P3）

| 項目 | 内容 |
|------|------|
| **根拠** | 使用されていないモック定義は混乱とメンテコストを増やす。 |
| **受け入れ基準** | (1) cron-handler テスト内で findFirst 等の未使用モックが削除されている。(2) 全テストがパスする。 |

#### REQ-REV-019: 未使用 import の削除（P3）

| 項目 | 内容 |
|------|------|
| **根拠** | 未使用 import はノイズとなり、静的解析やバンドルに不要な依存を残す。 |
| **受け入れ基準** | (1) email-sender 等、指摘されたファイルから未使用 import（例: EmptySendBehavior）が削除されている。(2) ビルド・テストが通る。 |

#### REQ-REV-020: 構造化ログ（P3）

| 項目 | 内容 |
|------|------|
| **根拠** | 本番運用時のログ解析・監視をしやすくする。 |
| **既存参照** | REQUIREMENTS_REVIEW_CODE_REVIEW.md の BACKLOG-REV-5。 |
| **受け入れ基準** | (1) 重要なエラー・イベントが構造化ログ（レベル・メッセージ・コンテキスト）で出力される。(2) 既存の REQ-NFR-004 と矛盾しない。 |

#### REQ-REV-021: フロントエンドテスト（P3）

| 項目 | 内容 |
|------|------|
| **根拠** | クリティカルな UI フローのリグレッション防止。 |
| **既存参照** | REQUIREMENTS_REVIEW_CODE_REVIEW.md の BACKLOG-REV-6。 |
| **受け入れ基準** | (1) 主要画面またはクリティカルフローに @testing-library/react 等によるテストが存在する。(2) 既存テストが通る。 |

#### REQ-REV-022: API ルート統合テスト（P3）

| 項目 | 内容 |
|------|------|
| **根拠** | バリデーション・認証のエッジケースを自動検証する。 |
| **既存参照** | REQUIREMENTS_REVIEW_CODE_REVIEW.md の BACKLOG-REV-7。 |
| **受け入れ基準** | (1) 少なくとも settings 等の API で不正 body・認証欠如等の統合テストが存在する。(2) 既存テストが通る。 |

#### 優先度・実施順序の目安

| 優先度 | 要件 | 実施推奨 |
|--------|------|----------|
| P0 | REQ-REV-014 | 即時（デプロイ可能にするため） |
| P2 | REQ-REV-015, REQ-REV-016 | 次のスプリント |
| P3 | REQ-REV-017～019 | 軽微なためまとめて実施可 |
| P3 | REQ-REV-020～022 | 工数に応じて計画に組み込む |

---

## 3. 非機能要件

### 3.1 パフォーマンス

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-001 | Ubiquitous | The system shall handle approximately 5 minutes worth of reading material per day (roughly 5–20 articles depending on length). |
| REQ-NFR-002 | Event-Driven | When loading the article list, the system shall respond within 3 seconds. |

**受け入れ基準:**
- 記事一覧API（GET /api/articles）が100件以下のデータで3秒以内に応答する
- ネットワーク遅延を除いたサーバー処理時間が3秒以内である
- 全文検索インデックス（tsvector）または簡易検索（contains）を使用して実現する

### 3.2 スケーラビリティ

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-003 | Ubiquitous | The system shall be designed for single-user use (no multi-tenancy required). |

### 3.3 セキュリティ（推奨）

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SEC-001 | Ubiquitous | The system shall store Gmail credentials in environment variables or a secure secrets manager, never in code or DB. |
| REQ-SEC-002 | Ubiquitous | The system shall use HTTPS for the Web UI in production. |
| REQ-SEC-003 | Optional | Where the Web UI is exposed beyond localhost, the system shall implement basic authentication or OAuth. |
| REQ-SEC-004 | Ubiquitous | The system shall apply rate limiting to scraping to avoid overloading target sites. |
| REQ-SEC-005 | Ubiquitous | The system shall respect robots.txt of target sites where applicable. |
| REQ-SEC-006 | Ubiquitous | The system shall sanitize scraped HTML before storage and display to prevent XSS. |

### 3.4 可用性・運用

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-004 | Ubiquitous | The system shall log errors and important events for troubleshooting. |
| REQ-NFR-005 | Unwanted Behavior | If the database is unavailable, then the system shall fail gracefully and log the error. |

### 3.5 メトリクス

| ID | パターン | 要求 |
|----|----------|------|
| REQ-MET-001 | Ubiquitous | The system shall persist operational metrics (e.g. per-run: articles collected, summarization success/failure counts, delivery status) in the application database. |
| REQ-MET-002 | Ubiquitous | The system shall allow recording and querying of these metrics (e.g. via internal APIs or admin) so that future improvement and analysis can be performed. |

### 3.6 コスト確認（推奨）

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-006 | Optional | The system shall document or provide a way to confirm usage and cost for Supabase and Claude API (e.g. links to provider dashboards, or storing usage in DB for reference). |

### 3.7 コスト管理

| ID | パターン | 要求 |
|----|----------|------|
| REQ-COT-001 | Ubiquitous | The system shall record Claude API usage (tokens, cost in USD) per job run in the metrics table. |
| REQ-COT-002 | State-Driven | When the monthly cost (calculated from metrics table) reaches the user-configured costLimitMonthly, the system shall skip summarization for all remaining articles in that job run and subsequent job runs until the next month begins. |
| REQ-COT-003 | Event-Driven | When the monthly cost reaches a warning threshold (costLimitMonthly × costWarningRatio, default 80%), the system shall send a notification email to the configured recipient before proceeding with summarization. |

---

## 4. 制約・前提

| 項目 | 内容 |
|------|------|
| 利用者数 | 1名 |
| 外部連携 | なし（メール送信除く） |
| データベース | Supabase（PostgreSQL） |
| メール | Gmail 専用アカウント |
| 収集方式 | スクレイピングのみ（現時点） |
| 要約 | Claude（Anthropic）。本文変更時のみ要約を再生成（summary を null に設定して次回ジョブで再要約） |
| 配信形式 | 複数記事を1通のメールに含める |
| デプロイ | 自前サーバー（当初）、将来 Vercel も検討 |
| ジョブ実行 | HTTP API 経由でトリガー（crontab / Vercel Cron 等） |
| 重複記事 | 同一 URL は1回のみ表示；本文変更時は要約を再生成 |
| Settings API | Phase 2.5 で実装必須（Phase 3 配信機能で使用） |
| ソース単位 | 単一記事 URL と一覧ページ URL の両方対応 |
| 0件時 | 設定で「送らない」または「案内メール送る」を選択可能 |
| 想定ソース例 | MONOist, Qiita, note, X (Twitter), 日経xTECH |
| ジョブ重複 | 日次ジョブの重複実行は行わない（ロックまたは実行中チェック） |
| 収集・要約 | 可能な範囲で並列・バッチ処理を実施 |
| 同時スクレイピング | ソース単位で最大3並列、ソース内は直列または最大2並列まで |
| 失敗通知 | 日次ジョブで失敗があった場合、失敗内容をメールで通知 |
| メトリクス | 自前DBに記録し、記録・参照可能にして今後の改善に利用 |

---

## 5. 用語集

| 用語 | 定義 |
|------|------|
| 記事 | スクレイピングで取得した1件の技術情報（URL、タイトル、本文、要約） |
| ソース | 記事を収集する Web サイトまたはページの URL |
| 収集 | スクレイピングによる記事取得 |
| 要約 | LLM により生成された記事の短い要約文 |
| 配信 | メールによる要約付き記事リストの送信 |

---

## 6. トレーサビリティ

本要求は C4 モデルに基づく設計ドキュメント（SDD）への入力として使用する。各 REQ-* はコンテナ・コンポーネント設計にマッピング可能である。

---

## 7. 実装フェーズ

段階的な開発のため、以下のフェーズを想定する。

| フェーズ | 内容 | 主な成果物 |
|----------|------|------------|
| **Phase 1: 基盤・収集** | DBスキーマ、ソース設定の永続化、スクレイピング、記事保存。同時スクレイピング制限・重複実行防止の骨組み。 | 記事・ソースのCRUD、収集API、cronエンドポイント（スキップのみ） |
| **Phase 2: 要約** | Claude連携、要約生成・保存。可能な範囲で並列・バッチ処理。 | 要約済み記事、要約失敗状態の扱い |
| **Phase 3: 配信** | 日次ジョブの完全化、メール送信、0件時設定。失敗時は通知メール送信。 | 1通まとめメール、失敗通知メール |
| **Phase 4: Web UI** | ソース設定、配信設定、過去記事の閲覧・検索。 | 設定画面、記事一覧・検索・詳細 |
| **Phase 5: 運用強化** | メトリクスの記録・参照、コスト確認の明文化（ドキュメントまたは簡易ダッシュボード）。 | メトリクステーブル・参照手段、Supabase/Claude利用量の確認方法 |

---

## 関連ドキュメント

本要求定義書（REQ-xxx）は製品の機能・非機能要件の **Single Source of Truth** とする。

| ドキュメント | 役割 |
|-------------|------|
| **docs/TASKS.md** | タスク一括管理（TSK-SUM, SET, EML, UI, MET, REV）。残タスク・スプリント・優先度。 |
| **docs/SDD.md** | 設計・REQ とのトレーサビリティ。 |
| **docs/CODE_REVIEW.md** | コードレビュー指摘・対応状況。§6–7 の未対応項目が REQ-REV-014～022 に反映。 |
| **docs/REQUIREMENTS_REVIEW.md** | 本要件のレビュー結果（EARS・憲法条項）。 |
| **docs/REQUIREMENTS_REVIEW_CODE_REVIEW.md** | コードレビュー対応の要件（REQ-REV-001～013 対応済み、REQ-REV-014～022 未対応）。 |
| **docs/REQUIREMENTS_REVIEW_REV014_022.md** | §2.10（REQ-REV-014～022）の要件レビュー・今後の方針。 |
| **docs/REQUIREMENTS_AND_TASKS_AUDIT.md** | 要件・タスクの総点検レポート。 |

---

## 付録 A. 補足・検討事項

### X (Twitter) について

X (Twitter) は利用規約上、一般的なスクレイピングが制限されている場合がある。収集対象に含める場合は、X API の利用を検討すること。初版では MONOist, Qiita, note, 日経xTECH 等の Web 記事を優先し、X は後続フェーズで対応することを推奨する。

### ジョブ実行のお勧め構成

- **自前サーバー:** `crontab` または `systemd timer` から `curl -X POST -H "Authorization: Bearer ${CRON_SECRET}" https://your-app/api/cron/daily` を日次実行
- **Vercel:** `vercel.json` に cron 設定を追加し、同一 API エンドポイントを呼び出す（将来対応時）

### コスト確認（Supabase・Claude API）

- **Supabase:** [Dashboard](https://supabase.com/dashboard) の Usage / Billing でストレージ・APIリクエスト等を確認可能。無料枠内で収まる想定であっても、月次で利用量を確認することを推奨する。
- **Claude API (Anthropic):** 利用量・請求は Anthropic のコンソールで確認。入力/出力トークン数に応じた課金のため、日次要約の記事数が増えた場合は利用量の把握を推奨する。
- 運用時にメトリクス（REQ-MET-*）と合わせて、月次コスト感をドキュメントや簡易一覧で残すと改善しやすい。
