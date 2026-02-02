# Web Investigation 要求定義書

**バージョン:** 1.5  
**作成日:** 2026-02-02  
**更新日:** 2026-02-03  
**レビュー:** docs/REQUIREMENTS_REVIEW.md (2026-02-02)  
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

**受け入れ基準:**
- ソースの追加・編集・削除がAPIまたはUIで永続化される
- ソース一覧に追加・編集・削除アクションが含まれる
- 削除したソースは次回収集ジョブに含まれない

### 2.6 Web UI - 配信設定

**ユーザー価値:** 送信時刻・宛先・0件時の動作を設定でき、運用に合わせて配信を制御できる。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-UI-005 | Ubiquitous | The system shall allow configuring the daily send time. |
| REQ-UI-006 | Ubiquitous | The system shall allow configuring the recipient email address. |
| REQ-UI-007 | Ubiquitous | The system shall allow configuring whether to send email when no new articles exist (skip or send notification). |
| REQ-UI-012 | Optional | Where Gmail credentials are used, the system shall store them securely (env vars or secrets). |

**受け入れ基準:**
- 送信時刻（HH:mm形式）・宛先メールアドレス・0件時動作が設定・保存できる
- Gmail認証情報は環境変数またはシークレットに格納され、DBやコードに平文で保存されない

### 2.6.1 Settings API

**ユーザー価値:** 配信設定をAPIで取得・更新でき、Web UIや外部ツールから一貫して設定を管理できる。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SET-001 | Ubiquitous | The system shall provide a GET /api/settings endpoint that returns the current settings (dailySendTime, recipientEmail, emptySendBehavior, costLimitMonthly, costWarningRatio). |
| REQ-SET-002 | Event-Driven | When the user updates settings via PUT /api/settings, the system shall validate and persist the new values. |
| REQ-SET-003 | Ubiquitous | The system shall validate dailySendTime as "HH:mm" format (24-hour), recipientEmail as valid email format, emptySendBehavior as enum value (skip or sendNotification), costLimitMonthly as positive number or null, and costWarningRatio as number between 0 and 1. |
| REQ-SET-004 | Ubiquitous | The system shall manage settings as a single record (singleton pattern) in the Settings table. |

**受け入れ基準:**
- GET /api/settings で現在の設定が取得できる
- PUT /api/settings で dailySendTime, recipientEmail, emptySendBehavior, costLimitMonthly, costWarningRatio が検証され永続化される
- dailySendTime は "HH:mm"、recipientEmail はメール形式、emptySendBehavior は skip または sendNotification、costLimitMonthly は正の数または null、costWarningRatio は 0〜1 であること
- 設定は1レコード（シングルトン）として管理される

### 2.7 Web UI - 過去記事の閲覧・検索

**ユーザー価値:** 過去の記事を一覧・検索・詳細で確認でき、必要な情報を素早く参照できる。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-UI-008 | Ubiquitous | The system shall display a list of past articles with title, summary, collected date, and source. |
| REQ-UI-009 | Event-Driven | When the user searches by keyword, the system shall filter articles by title or summary. |
| REQ-UI-010 | Event-Driven | When the user filters by date range, the system shall show only articles in that range. |
| REQ-UI-011 | Event-Driven | When the user clicks an article, the system shall show full content and link to original URL. |

**受け入れ基準:**
- 記事一覧にタイトル・要約・収集日・ソースが表示される
- キーワード検索でタイトル・要約でフィルタされる
- 日付範囲フィルタで該当期間の記事のみ表示される
- 記事クリックで本文と元URLが表示される

### 2.8 情報ソースの拡張性

**ユーザー価値:** コードを変更せずにソースを追加・削除でき、運用中に収集対象を柔軟に変更できる。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-EXT-001 | Ubiquitous | The system shall support adding and removing sources without code changes. |
| REQ-EXT-002 | Ubiquitous | The system shall allow per-source optional settings (e.g. CSS selector for content extraction). |

**受け入れ基準:**
- ソースの追加・削除がコード変更なしで可能である（APIまたはUI経由）
- ソースごとにオプション設定（例: コンテンツ抽出用セレクタ）が指定可能である

### 2.9 ジョブ制御

**ユーザー価値:** 手動実行やジョブ停止で、スケジュールに依存せずに収集・配信を制御できる。

| ID | パターン | 要求 |
|----|----------|------|
| REQ-JOB-001 | Event-Driven | When the user triggers a manual run via Web UI or API, the system shall start the daily job as if triggered by the scheduler. |
| REQ-JOB-002 | Event-Driven | When the user requests to stop a running job, the system shall gracefully stop after the current phase completes and shall not proceed to the next phase. |

**受け入れ基準:**
- 手動実行API（POST /api/jobs/manual）で日次ジョブと同等の処理が開始される
- 停止API（POST /api/jobs/stop）呼び出し後、現在のフェーズ完了後にジョブが終了し、次のフェーズ（例: 要約→配信）には進まない
- 停止要求後はジョブ状態が stopped または stopping で記録される

---

## 3. 非機能要件

### 3.1 パフォーマンス

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-001 | Ubiquitous | The system shall handle approximately 5 minutes worth of reading material per day (roughly 5–20 articles depending on length). |
| REQ-NFR-002 | Event-Driven | When loading the article list, the system shall respond within 3 seconds. |

**受け入れ基準:**
- **REQ-NFR-001:** 1日あたりの収集・要約・配信対象がおおむね5〜20記事の範囲で設計・動作する（1記事あたり約15〜60秒の読書量を想定）。負荷テストでは20記事程度で日次ジョブが完了することを確認する。
- **REQ-NFR-002:** 記事一覧API（GET /api/articles）が100件以下のデータで3秒以内に応答する。測定条件: 同一ネットワーク内からのリクエスト、クエリパラメータ（keyword, dateFrom, dateTo）を含む通常検索。ネットワーク遅延を除いたサーバー処理時間が3秒以内である。全文検索インデックス（tsvector）または簡易検索（contains）を使用して実現する。

### 3.2 スケーラビリティ

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-003 | Ubiquitous | The system shall be designed for single-user use (no multi-tenancy required). |

**受け入れ基準:**
- 利用者・配信先が1名である前提で設計されている（マルチテナント・認証・権限分離は不要）
- 設定（送信先・送信時刻等）は単一レコード（シングルトン）で管理される

### 3.3 セキュリティ（推奨）

| ID | パターン | 要求 |
|----|----------|------|
| REQ-SEC-001 | Ubiquitous | The system shall store Gmail credentials in environment variables or a secure secrets manager, never in code or DB. |
| REQ-SEC-002 | Ubiquitous | The system shall use HTTPS for the Web UI in production. |
| REQ-SEC-003 | Optional | Where the Web UI is exposed beyond localhost, the system shall implement basic authentication or OAuth. |
| REQ-SEC-004 | Ubiquitous | The system shall apply rate limiting to scraping to avoid overloading target sites. |
| REQ-SEC-005 | Ubiquitous | The system shall respect robots.txt of target sites where applicable. |
| REQ-SEC-006 | Ubiquitous | The system shall sanitize scraped HTML before storage and display to prevent XSS. |

**受け入れ基準:**
- Gmail認証情報は環境変数またはシークレットに格納され、コード・DBに平文で保存されない
- 本番環境ではWeb UIがHTTPSで提供される
- スクレイピングはオリジン間で1200ms以上の間隔を空ける（レート制限）
- 対象サイトのrobots.txtを確認し、Disallowの場合はスキップする
- 保存・表示前にHTMLをサニタイズし、スクリプト・iframe等が除去される

### 3.4 可用性・運用

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-004 | Ubiquitous | The system shall log errors and important events for troubleshooting. |
| REQ-NFR-005 | Unwanted Behavior | If the database is unavailable, then the system shall fail gracefully and log the error. |

**受け入れ基準:**
- **REQ-NFR-004:** エラーおよび重要イベント（ジョブ開始/終了、ソース失敗、要約失敗、配信失敗等）がログに記録される。ログレベル（error, warn, info）が区別可能である。
- **REQ-NFR-005:** DB接続不可時は、該当リクエストに対して 503 Service Unavailable または適切なエラーレスポンスを返し、エラー内容をログに記録する。部分的な処理結果で応答せず、安全に失敗する（fail gracefully）。再試行は呼び出し側（スケジューラ等）に委ねる。

### 3.5 メトリクス

| ID | パターン | 要求 |
|----|----------|------|
| REQ-MET-001 | Ubiquitous | The system shall persist operational metrics (e.g. per-run: articles collected, summarization success/failure counts, delivery status) in the application database. |
| REQ-MET-002 | Ubiquitous | The system shall allow recording and querying of these metrics (e.g. via internal APIs or admin) so that future improvement and analysis can be performed. |

**受け入れ基準:**
- ジョブ実行ごとに収集件数・要約成功/失敗件数・配信状態等がDB（Metric テーブル等）に記録される
- メトリクスを記録・参照する手段（内部APIまたは管理画面）が用意され、改善・分析に利用できる

### 3.6 コスト確認（推奨）

| ID | パターン | 要求 |
|----|----------|------|
| REQ-NFR-006 | Optional | The system shall document or provide a way to confirm usage and cost for Supabase and Claude API (e.g. links to provider dashboards, or storing usage in DB for reference). |

**受け入れ基準:**
- Supabase・Claude APIの利用量・コストを確認する方法がドキュメントまたはダッシュボードリンクで明示されている
- 必要に応じて利用量をDBに記録し参照可能にしている

### 3.7 コスト管理

| ID | パターン | 要求 |
|----|----------|------|
| REQ-COT-001 | Ubiquitous | The system shall record Claude API usage (tokens, cost in USD) per job run in the metrics table. |
| REQ-COT-002 | State-Driven | When the monthly cost (calculated from metrics table) reaches the user-configured costLimitMonthly, the system shall skip summarization for all remaining articles in that job run and subsequent job runs until the next month begins. |
| REQ-COT-003 | Event-Driven | When the monthly cost reaches a warning threshold (costLimitMonthly × costWarningRatio, default 80%), the system shall send a notification email to the configured recipient before proceeding with summarization. |

**受け入れ基準:**
- ジョブ実行ごとにClaude APIのトークン数・コスト（USD）がメトリクステーブルに記録される
- 月次累計コストが costLimitMonthly に達した場合、当該ジョブの残り要約および以降のジョブで要約をスキップする（月初日でリセット）
- 月次累計が costLimitMonthly × costWarningRatio（デフォルト0.8）に達した場合、要約実行前に警告メールを送信する

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
