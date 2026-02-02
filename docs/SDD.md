# Web Investigation 設計ドキュメント（C4 モデル）

**バージョン:** 1.1  
**作成日:** 2026-02-02  
**更新日:** 2026-02-02  
**参照:** docs/REQUIREMENTS.md v1.3  
**設計ID:** DES-WEB-ml4mktfi

---

## 1. Overview

### 1.1 Purpose

生産技術×デジタル関連の技術情報を Web スクレイピングで収集し、LLM で要約してメールで配信するシステムのソフトウェア設計を定義する。

### 1.2 Scope

- **対象システム:** Web Investigation
- **設計範囲:** 全コンテナ・コンポーネント・データフロー
- **技術スタック:** Next.js (App Router), TypeScript, Tailwind, Shadcn/UI, Prisma, PostgreSQL (Supabase), Gmail, Claude API

### 1.3 Requirements Traceability

本設計は `docs/REQUIREMENTS.md` の全要件をカバーする。詳細は [Section 7. トレーサビリティマトリクス](#7-トレーサビリティマトリクス) を参照。

---

## 2. Context Diagram (Level 1)

システム境界と外部アクター・外部システム。

```
                                    ┌─────────────────────────────────────────────┐
                                    │          Web Investigation System            │
                                    │                                             │
  ┌─────────────┐                  │  ┌───────────────────────────────────────┐  │
  │   User      │ ◄─── HTTPS ─────►│  │     Web Investigation Application     │  │
  │ (単一利用者)  │                  │  │     (Next.js Web App)                 │  │
  └─────────────┘                  │  └───────────────┬───────────────────────┘  │
         │                         │                  │                           │
         │                         │                  │                           │
  ┌──────┴──────┐                  │                  │                           │
  │  External   │  POST /api/cron  │                  │                           │
  │  Scheduler  │ ◄─── HTTPS ─────►│  (crontab,       │                           │
  │             │  Bearer token    │   Vercel Cron)   │                           │
  └─────────────┘                  │                  │                           │
                                    │                  │                           │
                                    │  ┌───────────────┴───────────────────────┐  │
                                    │  │              Data Store               │  │
                                    │  │  (Supabase PostgreSQL)                │  │
                                    │  └───────────────────────────────────────┘  │
                                    └───────────────┬─────────────────────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    │                               │                               │
                    ▼                               ▼                               ▼
           ┌───────────────┐              ┌───────────────┐              ┌───────────────┐
           │ Web Sources   │              │  Claude API   │              │   Gmail       │
           │ (MONOist,     │              │  (Anthropic)  │              │   (SMTP/API)  │
           │  Qiita, etc.) │              │               │              │               │
           └───────────────┘              └───────────────┘              └───────────────┘
```

### 2.1 External Actors

| Actor | 説明 | インタラクション |
|-------|------|------------------|
| **User** | 単一利用者（開発者本人） | Web UI でソース設定・配信設定・記事閲覧・検索 |
| **External Scheduler** | 外部スケジューラ（crontab, Vercel Cron） | POST /api/cron/daily で日次ジョブをトリガー |

### 2.2 External Systems

| System | 説明 | プロトコル | 関連要件 |
|--------|------|------------|----------|
| **Web Sources** | 記事収集元（MONOist, Qiita, note, 日経xTECH 等） | HTTP/HTTPS スクレイピング | REQ-SCR-001, REQ-SEC-004, REQ-SEC-005 |
| **Claude API** | LLM 要約サービス | REST API | REQ-SUM-001 |
| **Gmail** | メール送信 | SMTP または Gmail API | REQ-EML-002 |
| **Supabase (PostgreSQL)** | データ永続化 | Prisma / SQL | 全データ要件 |

---

## 3. Container Diagram (Level 2)

アプリケーションとデータストアの構成。

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        Web Investigation Application                                 │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                    Web UI Container (Next.js Frontend)                            ││
│  │  - ソース設定画面 (REQ-UI-001〜004)                                                ││
│  │  - 配信設定画面 (REQ-UI-005〜007)                                                  ││
│  │  - 記事一覧・検索・詳細 (REQ-UI-008〜011)                                          ││
│  └───────────────────────────────┬─────────────────────────────────────────────────┘│
│                                  │ API calls                                         │
│  ┌───────────────────────────────┴─────────────────────────────────────────────────┐│
│  │                    API Routes Container (Next.js API)                             ││
│  │  /api/sources     - CRUD (REQ-UI-001〜004, REQ-EXT-001)                          ││
│  │  /api/articles    - 一覧・検索・詳細 (REQ-UI-008〜011)                            ││
│  │  /api/settings    - 配信設定 (REQ-UI-005〜007)                                    ││
│  │  /api/cron/daily  - 日次ジョブ (REQ-SCH-002〜004)                                 ││
│  │  /api/jobs        - ジョブ手動実行・停止 (REQ-JOB-001, REQ-JOB-002)               ││
│  │  /api/metrics     - メトリクス参照 (REQ-MET-002)                                  ││
│  └───────────────────────────────┬─────────────────────────────────────────────────┘│
│                                  │ Prisma Client                                     │
└──────────────────────────────────┼──────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                     Database Container (Supabase PostgreSQL)                           │
│  - sources, articles, settings, job_runs, metrics                                     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Container Summary

| Container | 技術 | 責務 |
|-----------|------|------|
| **Web UI** | Next.js (React), Tailwind, Shadcn/UI, lucide-react | ユーザーインタラクション、設定・閲覧・検索 |
| **API Routes** | Next.js API Routes, Prisma | ビジネスロジック、外部連携オーケストレーション |
| **Database** | Supabase (PostgreSQL) | 永続化、ソース・記事・設定・メトリクス |

---

## 4. Component Diagram (Level 3)

### 4.1 API Routes Container - 内部構成

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         API Routes Container                                      │
│                                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Source      │  │ Article     │  │ Settings    │  │ Cron Handler            │ │
│  │ Controller  │  │ Controller  │  │ Controller  │  │ (Daily Job Orchestrator)│ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                │                      │               │
│         └────────────────┴────────────────┴──────────────────────┘               │
│                                    │                                              │
│         ┌──────────────────────────┼──────────────────────────┐                  │
│         │                          │                          │                  │
│         ▼                          ▼                          ▼                  │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────────────────┐  │
│  │ Scraper     │          │ Summarizer  │          │ Email Sender            │  │
│  │ Service     │          │ Service     │          │ Service                 │  │
│  │ - 並列制限   │          │ - Claude    │          │ - Gmail SMTP/API        │  │
│  │ - 重複排除   │          │ - リトライ   │          │ - 0件時対応             │  │
│  └─────────────┘          └─────────────┘          └─────────────────────────┘  │
│         │                          │                          │                  │
│         ▼                          ▼                          ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                        Prisma / DB Access Layer                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Cron Handler - 日次ジョブ コンポーネント詳細

**処理フロー（リスト形式）**

```
Cron Handler (POST /api/cron/daily)
│
├─ 1. CRON_SECRET 検証 (REQ-SCH-003)
├─ 2. ロック取得 / 重複実行チェック (REQ-SCH-004)
├─ 3. JobRun レコード作成 (REQ-MET-001)
├─ 4. Scraper Service 呼び出し
│     └─ ソース一覧取得 → 並列収集 (max 3) (REQ-SCR-009, REQ-SCR-010)
├─ 5. Summarizer Service 呼び出し (新規・更新記事)
│     └─ 5-a. コスト管理チェック
│           └─ Settings の costLimitMonthly を確認
│           └─ 当月のコスト累計が上限に達している場合は要約をスキップ
│           └─ 警告メールを送信（REQ-COT-003）
│     └─ 並列/バッチ要約 (REQ-SUM-004)
├─ 6. Email Sender 呼び出し
│     └─ 0件時設定に応じて送信 or スキップ (REQ-EML-004)
├─ 7. 失敗時: 通知メール送信 (REQ-EML-006)
└─ 8. JobRun 更新、ロック解放
```

**シーケンス図（正常系・異常系）**

```
  Scheduler    CronHandler    DB/Lock    Scraper      Summarizer    Email
       │            │            │           │             │           │
       │ POST       │            │           │             │           │
       │───────────►│            │           │             │           │
       │            │ CRON_SECRET検証         │             │           │
       │            │────────────────────────►│ ロック取得   │           │
       │            │◄────────────────────────│ (running)   │           │
       │            │ JobRun作成 │           │             │           │
       │            │───────────►│           │             │           │
       │            │ ソース一覧取得          │             │           │
       │            │───────────►│           │             │           │
       │            │◄───────────│           │             │           │
       │            │ 並列収集(max 3ソース)   │             │           │
       │            │────────────────────────►│             │           │
       │            │   ┌───────────────────┐ │             │           │
       │            │   │ Source A ────► Article取得       │           │
       │            │   │ Source B ────► Article取得 (並列)│           │
       │            │   │ Source C ────► Article取得       │           │
       │            │   └───────────────────┘ │             │           │
       │            │◄────────────────────────│ 結果+errors  │           │
       │            │ 新規/更新記事を要約      │             │           │
       │            │─────────────────────────────────────►│           │
       │            │   (並列/バッチ、失敗時は3回リトライ)   │           │
       │            │◄─────────────────────────────────────│           │
       │            │ 0件時設定に応じてメール送信           │           │
       │            │─────────────────────────────────────────────────►│
       │            │◄─────────────────────────────────────────────────│
       │            │ JobRun更新、ロック解放   │             │           │
       │            │───────────►│           │             │           │
       │  200 OK    │            │           │             │           │
       │◄───────────│            │           │             │           │
```

**部分失敗時（3ソース中1つ失敗）**

```
  Source A: 成功 ──► 記事保存
  Source B: 失敗 ──► ログ記録、errors に追加、継続 (REQ-SCR-004)
  Source C: 成功 ──► 記事保存
  → 収集フェーズ完了後、成功した記事のみ要約・メール送信
  → ジョブ完了時に errors に1件以上あれば通知メール送信 (REQ-EML-006)
```

**リトライロジック（Summarizer）**

```
  記事N 要約リクエスト ──► 失敗
    └─ リトライ 1 (指数バックオフ) ──► 失敗
    └─ リトライ 2 ──► 失敗
    └─ リトライ 3 ──► 失敗
    └─ summarization-failed でマーク、errors に記録 (REQ-SUM-003)
```

**ロック取得・解放のタイミング**

```
  ロック取得: CRON_SECRET 検証直後、JobRun 作成前に status=running で先行チェック
  ロック解放: 全フェーズ（収集・要約・メール）完了後、または例外発生時の finally
  重複時: ロック取得失敗 → 409 返却、ジョブは実行しない (REQ-SCH-004)
```

**ジョブ停止処理（REQ-JOB-002）**

```
停止リクエスト受信 (POST /api/jobs/stop)
│
├─ 実行中の JobRun を検索
├─ JobRun の status を 'stopping' に更新
├─ 進行中フェーズの完了を待つ（graceful shutdown）
│   └─ 現在のスクレイピング/要約タスクは完了まで待機
│   └─ 次のフェーズには進まない
├─ status を 'stopped' に更新
└─ 応答を返却
```

**停止時のトランザクション処理:**
- 収集済み記事は DB に保存（ロールバックしない）
- 要約済み記事も保持
- ロック（status=running）は解放
- 停止理由を JobRun.errors に記録

### 4.3 Scraper Service - 収集ロジック詳細

| 責務 | 関連要件 |
|------|----------|
| ソース種別の判定（single / list） | REQ-SCR-007 |
| 一覧ページから記事URL抽出 | REQ-SCR-007 |
| 記事本文取得（CSS selector 対応） | REQ-EXT-002 |
| URL 単位の重複排除（同一URLは1記事） | REQ-SCR-008 |
| 並列制限: ソース最大3、ソース内は直列（将来2並列拡張可） | REQ-SCR-010 |
| ソース失敗時の継続・ログ | REQ-SCR-004 |
| robots.txt 尊重・レート制限 | REQ-SEC-004, REQ-SEC-005 |
| HTML サニタイズ | REQ-SEC-006 |

---

## 5. Data Model

### 5.1 ER 概要

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Source    │──────►│   Article   │       │  JobRun     │
│             │ 1   n │             │       │             │
│ id          │       │ id          │       │ id          │
│ url         │       │ url (unique)│       │ startedAt   │
│ type        │       │ title       │       │ finishedAt  │
│ selector?   │       │ rawContent  │       │ status      │
│ config?     │       │ summary?    │       │ articlesCol │
└─────────────┘       │ sourceId    │       │ articlesSum │
                      │ collectedAt │       │ errors?     │
                      └─────────────┘       └─────────────┘
                                │
                                │
                      ┌─────────┴─────────┐
                      │     Settings      │
                      │ dailySendTime     │
                      │ recipientEmail    │
                      │ emptySendBehavior │
                      └───────────────────┘
```

### 5.2 主要テーブル

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| **sources** | 収集ソース設定 | url, type (single|list), selector, config |
| **articles** | 記事 | url (unique), title, rawContent, summary, sourceId, collectedAt |
| **settings** | 配信設定 | dailySendTime, recipientEmail, emptySendBehavior |
| **job_runs** | ジョブ実行履歴 | startedAt, finishedAt, status, articlesCollected, errors |
| **metrics** | メトリクス（必須） | runId, metricType (api_tokens_used, api_cost_usd, articles_collected, articles_summarized), value, recordedAt |

### 5.3 Prisma Schema

以下は実装に用いる完全な Prisma スキーマ。PostgreSQL の `Text` 型、`cuid()` をデフォルト ID、REQ-NFR-002 対応のインデックスを含む。

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Source {
  id        String    @id @default(cuid())
  url       String    @unique
  type      SourceType
  selector  String?   @db.Text
  config    Json?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  articles  Article[]

  @@index([type])
}

enum SourceType {
  single  // 単一記事 URL
  list    // 一覧ページ URL
}

model Article {
  id          String    @id @default(cuid())
  url         String    @unique
  title       String?
  rawContent  String    @db.Text
  summary     String?   @db.Text
  sourceId    String?
  collectedAt DateTime
  updatedAt   DateTime  @updatedAt
  source      Source?   @relation(fields: [sourceId], references: [id], onDelete: SetNull)

  @@index([collectedAt])
  @@index([sourceId])
}

model Settings {
  id                 String   @id @default(cuid())
  dailySendTime      String   // e.g. "09:00"
  recipientEmail     String
  emptySendBehavior  EmptySendBehavior
  costLimitMonthly   Float?   // 月次コスト上限（USD）
  costWarningRatio   Float    @default(0.8)  // 警告閾値（0.8 = 80%）
  updatedAt          DateTime @updatedAt
}

enum EmptySendBehavior {
  skip           // 0件時はメール送らない
  sendNotification // 0件時は案内メールを送る
}

model JobRun {
  id                  String     @id @default(cuid())
  startedAt           DateTime   @default(now())
  finishedAt          DateTime?
  status              JobRunStatus
  articlesCollected   Int        @default(0)
  articlesSummarized  Int        @default(0)
  errors              Json?      // [{ sourceUrl?, articleUrl?, type, message }]
  metrics             Metric[]

  @@index([status])
  @@index([startedAt])
}

enum JobRunStatus {
  running
  stopping   // 停止処理中
  completed
  stopped    // 手動停止完了
  failed
}

model Metric {
  id         String   @id @default(cuid())
  runId      String?
  metricType String
  value      Float
  recordedAt DateTime @default(now())
  run        JobRun?  @relation(fields: [runId], references: [id], onDelete: SetNull)

  @@index([runId])
  @@index([metricType])
  @@index([recordedAt])
}
```

### 5.4 全文検索インデックス（REQ-UI-009, REQ-NFR-002）

PostgreSQL の `tsvector` + GIN インデックスを使用。以下のマイグレーションを初期セットアップ時に実行：

```sql
-- 全文検索用の tsvector カラムを追加
ALTER TABLE "Article"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B')
) STORED;

-- GIN インデックスを作成
CREATE INDEX article_search_idx ON "Article" USING GIN (search_vector);
```

**検索クエリ例（Prisma Raw SQL）:**

```typescript
const articles = await prisma.$queryRaw`
  SELECT * FROM "Article"
  WHERE search_vector @@ plainto_tsquery('english', ${keyword})
  ORDER BY "collectedAt" DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

**代替案（初期実装の簡易版）:**
パフォーマンス要件が緩い場合、Prisma の `contains` を使用可能：

```typescript
await prisma.article.findMany({
  where: {
    OR: [
      { title: { contains: keyword, mode: 'insensitive' } },
      { summary: { contains: keyword, mode: 'insensitive' } }
    ]
  }
});
```

---

## 6. Architecture Decision Records (ADR)

### ADR-001: Next.js App Router + src 構成

| 項目 | 内容 |
|------|------|
| **Status** | Accepted |
| **Date** | 2026-02-02 |
| **Context** | Web スクレイピング・要約・メール配信アプリの基盤構成 |
| **Decision** | Next.js (App Router), TypeScript, Tailwind, Shadcn/UI, Prisma, PostgreSQL |
| **Consequences** | フルスタック単一リポジトリ、API Routes でバックエンド集約 |

### ADR-002: 日次ジョブの HTTP API トリガー

| 項目 | 内容 |
|------|------|
| **Status** | Accepted |
| **Context** | 自前サーバー・Vercel 両対応のスケジューリング |
| **Decision** | POST /api/cron/daily を外部スケジューラから呼び出す。CRON_SECRET で保護 |
| **Consequences** | デプロイ先に依存しない。crontab, Vercel Cron で同一 API を呼べる |

### ADR-003: 同一 URL は1記事として扱う

| 項目 | 内容 |
|------|------|
| **Status** | Accepted |
| **Context** | 複数ソースから同一記事が参照される場合（REQ-SCR-008） |
| **Decision** | articles.url にユニーク制約。本文変更時のみ要約再生成 |
| **Consequences** | メール・一覧で重複表示なし。sourceId は「最初に発見したソース」を記録 |

### ADR-004: 並列スクレイピング制限

| 項目 | 内容 |
|------|------|
| **Status** | Accepted |
| **Context** | 対象サイトへの負荷軽減（REQ-SCR-010, REQ-SEC-004） |
| **Decision** | ソース単位で最大3並列。**ソース内は直列実行**。将来パフォーマンス不足が判明した場合のみ、ソース内を最大2並列に拡張可能とする。 |
| **Consequences** | 実装ライブラリは `p-limit`（シンプル・軽量）または `p-queue`（より細かい制御）から選択。ソース間の並列は p-limit(3)、ソース内は直列のため Promise チェーンまたは for ループで十分。スループットとマナー調整のバランスを取る。 |

### ADR-005: ジョブ重複実行防止

| 項目 | 内容 |
|------|------|
| **Status** | Accepted |
| **Context** | 日次ジョブの重複起動防止（REQ-SCH-004） |
| **Decision** | job_runs の status=running チェック、または DB ロック（advisory lock） |
| **Consequences** | 2重起動時は 409 または 200 + メッセージでスキップ応答 |

### ADR-006: PostgreSQL 全文検索（tsvector + GIN）

| 項目 | 内容 |
|------|------|
| **Status** | Accepted |
| **Date** | 2026-02-02 |
| **Context** | 記事のキーワード検索で3秒以内の応答が必要（REQ-NFR-002） |
| **Decision** | PostgreSQL の `tsvector` + GIN インデックスを採用。GENERATED ALWAYS カラムで自動更新。 |
| **Consequences** | 高速な全文検索が可能。日本語対応が必要な場合は将来的に `pg_bigm` 拡張を検討。初期実装では `contains` による部分一致も許容。 |

---

## 7. トレーサビリティマトリクス

### 7.1 機能要件 → コンポーネント

| 要件ID | カテゴリ | 対応コンポーネント / 設計要素 |
|--------|----------|-------------------------------|
| REQ-SCR-001 | 収集 | Scraper Service |
| REQ-SCR-002 | 収集 | Cron Handler → Scraper Service |
| REQ-SCR-003 | 収集 | Source Controller + Cron Handler |
| REQ-SCR-004 | 収集 | Scraper Service（ログ・継続） |
| REQ-SCR-005 | 収集 | Article モデル、Scraper Service |
| REQ-SCR-006 | 収集 | Scraper Service、Article 更新ロジック |
| REQ-SCR-007 | 収集 | Scraper Service（single/list 判定） |
| REQ-SCR-008 | 収集 | Article.url ユニーク、Scraper 重複排除 |
| REQ-SCR-009 | 収集 | Scraper Service（並列処理） |
| REQ-SCR-010 | 収集 | Scraper Service（並列制限） |
| REQ-SUM-001 | 要約 | Summarizer Service |
| REQ-SUM-002 | 要約 | Article.summary、Summarizer Service |
| REQ-SUM-003 | 要約 | Summarizer Service（リトライ3回） |
| REQ-SUM-004 | 要約 | Summarizer Service（並列/バッチ） |
| REQ-EML-001 | 配信 | Cron Handler → Email Sender |
| REQ-EML-002 | 配信 | Email Sender（Gmail） |
| REQ-EML-003 | 配信 | Email Sender（本文フォーマット） |
| REQ-EML-004 | 配信 | Settings.emptySendBehavior、Email Sender |
| REQ-EML-005 | 配信 | Email Sender（ログ・リトライ） |
| REQ-EML-006 | 配信 | Cron Handler（失敗時通知メール） |
| REQ-SCH-001 | スケジュール | External Scheduler + Cron Handler |
| REQ-SCH-002 | スケジュール | POST /api/cron/daily |
| REQ-SCH-003 | スケジュール | Cron Handler（CRON_SECRET 検証） |
| REQ-SCH-004 | スケジュール | Cron Handler（ロック/重複チェック） |
| REQ-UI-001〜004 | Web UI | Source Controller、Web UI ソース画面 |
| REQ-UI-005〜007, 012 | Web UI | Settings Controller、Web UI 配信画面 |
| REQ-UI-008〜011 | Web UI | Article Controller、Web UI 記事一覧・検索・詳細 |
| REQ-EXT-001 | 拡張 | Source CRUD、DB 永続化 |
| REQ-EXT-002 | 拡張 | Source.selector, Source.config |
| REQ-COT-001 | コスト | Metrics テーブル、Summarizer Service |
| REQ-COT-002 | コスト | Settings.costLimitMonthly、Cron Handler |
| REQ-COT-003 | コスト | Cron Handler（警告メール送信） |
| REQ-JOB-001 | ジョブ制御 | POST /api/jobs/manual、Cron Handler |
| REQ-JOB-002 | ジョブ制御 | POST /api/jobs/stop、JobRun.status (stopping/stopped) |

### 7.2 非機能要件 → 設計要素

| 要件ID | 対応設計 |
|--------|----------|
| REQ-NFR-001 | 5〜20記事/日想定、現設計で対応 |
| REQ-NFR-002 | 記事一覧 API のインデックス、ページネーション |
| REQ-NFR-003 | 単一ユーザー想定、マルチテナント不要 |
| REQ-NFR-004 | ログ出力（Winston/Pino 等）、エラーハンドリング |
| REQ-NFR-005 | Prisma エラーハンドリング、DB 障害時のフォールバック |
| REQ-NFR-006 | ドキュメント、メトリクス参照 |
| REQ-SEC-001 | 環境変数（GMAIL_*, CRON_SECRET） |
| REQ-SEC-002 | 本番 HTTPS（Vercel/自前サーバー） |
| REQ-SEC-003 | 任意: Basic Auth / OAuth |
| REQ-SEC-004 | Scraper レート制限、並列制限 |
| REQ-SEC-005 | Scraper: robots.txt チェック |
| REQ-SEC-006 | HTML サニタイズ（DOMPurify 等） |
| REQ-MET-001 | job_runs、metrics テーブル |
| REQ-MET-002 | /api/metrics、管理画面 |

---

## 8. Non-Functional Considerations

### 8.1 Performance

- 記事一覧: インデックス（collectedAt, title, summary 全文検索）、3秒以内応答（REQ-NFR-002）
- 要約: 並列/バッチ処理でスループット向上

### 8.2 Security

- 認証情報は環境変数（REQ-SEC-001）
- 本番 HTTPS（REQ-SEC-002）
- HTML サニタイズで XSS 防止（REQ-SEC-006）
- cron エンドポイントは CRON_SECRET で保護

### 8.3 Scalability

- 単一ユーザー想定（REQ-NFR-003）。マルチテナントは不要。
- Vercel 移行時も同一 API で動作可能。

### 8.4 Observability

- ログ: エラー・重要イベント（REQ-NFR-004）
- メトリクス: job_runs, metrics テーブル（REQ-MET-001, REQ-MET-002）

---

## 9. API Specifications

### 9.1 POST /api/cron/daily

| 項目 | 内容 |
|------|------|
| **用途** | 日次ジョブのトリガー（REQ-SCH-002） |
| **認証** | `Authorization: Bearer ${CRON_SECRET}` をヘッダに付与 |
| **リクエスト** | `POST`、Body 不要 |
| **レスポンス** | 200: ジョブ開始 or 完了、409: 既に実行中でスキップ、401: 認証失敗、500: サーバーエラー |

```
200 OK     { "status": "started" } または { "status": "completed", "articlesCollected": N, ... }
409 Conflict { "status": "skipped", "reason": "Job already running" }
401 Unauthorized { "error": "Invalid or missing CRON_SECRET" }
500 Internal Server Error { "error": "..." }
```

### 9.2 /api/sources（CRUD）

| メソッド | パス | 説明 | リクエスト | レスポンス |
|----------|------|------|------------|------------|
| GET | /api/sources | 一覧取得 | - | 200: `{ sources: [...] }` |
| POST | /api/sources | 追加 | `{ url, type, selector?, config? }` | 201: 作成された Source、400: バリデーションエラー |
| PUT | /api/sources/[id] | 更新 | `{ url?, type?, selector?, config? }` | 200: 更新後、404: 未検出 |
| DELETE | /api/sources/[id] | 削除 | - | 204: 削除完了、404: 未検出 |

### 9.3 GET /api/articles

| 項目 | 内容 |
|------|------|
| **用途** | 記事一覧・検索・フィルタ（REQ-UI-008〜010） |
| **クエリパラメータ** | `page` (default: 1), `limit` (default: 20), `keyword`, `dateFrom`, `dateTo` |
| **レスポンス** | 200: `{ articles: [...], total, page, limit }` |

| パラメータ | 型 | 説明 |
|------------|-----|------|
| page | number | ページ番号 |
| limit | number | 1ページあたり件数（最大 100） |
| keyword | string | タイトル・要約に対する部分一致検索 |
| dateFrom | ISO8601 | 収集日時の開始 |
| dateTo | ISO8601 | 収集日時の終了 |

### 9.4 GET /api/articles/[id]

| 項目 | 内容 |
|------|------|
| **用途** | 記事詳細（REQ-UI-011） |
| **レスポンス** | 200: 記事オブジェクト（full content, URL 含む）、404: 未検出 |

### 9.5 GET / PUT /api/settings

| メソッド | 説明 | リクエスト | レスポンス |
|----------|------|------------|------------|
| GET | 設定取得 | - | 200: `{ dailySendTime, recipientEmail, emptySendBehavior, costLimitMonthly?, costWarningRatio? }` |
| PUT | 設定更新 | `{ dailySendTime?, recipientEmail?, emptySendBehavior?, costLimitMonthly?, costWarningRatio? }` | 200: 更新後、400: バリデーションエラー |

### 9.6 GET /api/metrics

| 項目 | 内容 |
|------|------|
| **用途** | メトリクス参照（REQ-MET-002） |
| **クエリパラメータ** | `runId`, `metricType`, `limit` (default: 100) |
| **レスポンス** | 200: `{ metrics: [{ runId, metricType, value, recordedAt }] }` |

### 9.7 POST /api/jobs/manual

| 項目 | 内容 |
|------|------|
| **用途** | 日次ジョブの手動実行（REQ-JOB-001） |
| **認証** | 任意（Basic Auth / セッション） |
| **リクエスト** | `POST`、Body 不要 |
| **レスポンス** | 200: ジョブ開始、409: 既に実行中、500: エラー |

```
200 OK { "status": "started", "jobRunId": "..." }
409 Conflict { "status": "skipped", "reason": "Job already running" }
```

### 9.8 POST /api/jobs/stop

| 項目 | 内容 |
|------|------|
| **用途** | 実行中ジョブの停止（REQ-JOB-002） |
| **認証** | 任意（Basic Auth / セッション） |
| **リクエスト** | `POST`、Body 不要 |
| **レスポンス** | 200: 停止処理開始、404: 実行中ジョブなし、500: エラー |

```
200 OK { "status": "stopping", "jobRunId": "..." }
404 Not Found { "error": "No running job found" }
```

---

## 10. 参照

- `docs/REQUIREMENTS.md` — 要求定義書 v1.2
- `docs/NEXT_TASKS.md` — 次のタスク整理
- `STRUCTURE.md` — ディレクトリ構成
