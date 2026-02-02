# Web Investigation 要求定義書

**バージョン:** 1.2  
**作成日:** 2026-02-02  
**更新日:** 2026-02-02  
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

### 2.1 収集（Scraping）

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SCR-001 | Ubiquitous | The system shall collect articles from user-configured web sources via scraping only. |
| REQ-SCR-002 | Event-Driven | When the scheduled job runs, the system shall scrape each configured source and store or update articles. |
| REQ-SCR-003 | Event-Driven | When a new source is added via Web UI, the system shall include it in the next scheduled scrape. |
| REQ-SCR-004 | Unwanted Behavior | If a source is unreachable or returns an error, then the system shall log the failure and continue with other sources. |
| REQ-SCR-005 | Ubiquitous | The system shall store each article with URL, title, raw content, and collected-at timestamp. |
| REQ-SCR-006 | Ubiquitous | The system shall fetch articles by URL each time; if the same URL already exists and raw content has changed, the system shall update the record and regenerate the summary. |
| REQ-SCR-007 | Ubiquitous | The system shall support two source types: (a) single-article URL, and (b) list-page URL from which multiple article URLs are extracted. |
| REQ-SCR-008 | Ubiquitous | When the same article URL appears from multiple sources, the system shall treat it as one article and include it once in the output (e.g. email). |
| REQ-SCR-009 | Ubiquitous | The system may process multiple sources in parallel during collection, subject to concurrent-scraping limits. |
| REQ-SCR-010 | Ubiquitous | The system shall limit concurrent scraping to at most 3 sources at a time; within a source, the system shall fetch list and article pages sequentially or with at most 2 concurrent requests per source to avoid overloading target sites. |

### 2.2 要約（LLM）

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SUM-001 | Event-Driven | When a new or updated article is collected, the system shall generate a summary using Claude (Anthropic). |
| REQ-SUM-002 | Ubiquitous | The system shall store the summary with the article record. |
| REQ-SUM-003 | Unwanted Behavior | If LLM summarization fails, then the system shall retry up to 3 times before marking the article as summarization-failed. |
| REQ-SUM-004 | Ubiquitous | Where feasible, the system shall process summarization for multiple articles in parallel or in configurable batches to improve throughput. |

### 2.3 配信（Email）

| ID | パターン | 要求 |
|----|----------|------|
| REQ-EML-001 | Event-Driven | When the daily scheduled job completes, the system shall send one email containing all newly collected and summarized articles. |
| REQ-EML-002 | Ubiquitous | The system shall send emails via a dedicated Gmail account (SMTP or Gmail API). |
| REQ-EML-003 | Ubiquitous | The system shall include article title, summary, and URL in each email entry. |
| REQ-EML-004 | State-Driven | While no new articles exist for the day, the system shall either skip sending an email or send a "no new articles" notification, according to user configuration. |
| REQ-EML-005 | Unwanted Behavior | If email delivery fails, then the system shall log the error and optionally retry. |
| REQ-EML-006 | Event-Driven | When the daily job completes with one or more failures (source unreachable, summarization failed, email delivery failed), the system shall send a notification email to the configured recipient containing the failure details (e.g. source URL, article URL, error type, error message). |

### 2.4 スケジュール

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SCH-001 | Ubiquitous | The system shall run collection and distribution daily at a configurable time. |
| REQ-SCH-002 | Ubiquitous | The system shall expose an HTTP API endpoint (e.g. POST /api/cron/daily) that triggers the daily job, so it can be invoked by external schedulers (crontab, systemd timer, cron-job.org, or Vercel Cron). |
| REQ-SCH-003 | Ubiquitous | The system shall protect the cron endpoint with a shared secret (e.g. CRON_SECRET) passed in the request header. |
| REQ-SCH-004 | Unwanted Behavior | When the daily job is triggered while a previous run is still in progress, the system shall not start a second run (e.g. by using a lock or checking run status) and shall log or respond that the request was skipped. |

### 2.5 Web UI - 収集ソース設定

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

---

## 3. 非機能要件

### 3.1 パフォーマンス

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-001 | Ubiquitous | The system shall handle approximately 5 minutes worth of reading material per day (roughly 5–20 articles depending on length). |
| REQ-NFR-002 | Event-Driven | When loading the article list, the system shall respond within 3 seconds. |

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

---

## 4. 制約・前提

| 項目 | 内容 |
|------|------|
| 利用者数 | 1名 |
| 外部連携 | なし（メール送信除く） |
| データベース | Supabase（PostgreSQL） |
| メール | Gmail 専用アカウント |
| 収集方式 | スクレイピングのみ（現時点） |
| 要約 | Claude（Anthropic） |
| 配信形式 | 複数記事を1通のメールに含める |
| デプロイ | 自前サーバー（当初）、将来 Vercel も検討 |
| ジョブ実行 | HTTP API 経由でトリガー（crontab / Vercel Cron 等） |
| 重複記事 | 同一 URL は1回のみ表示；本文変更時は要約を再生成 |
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
