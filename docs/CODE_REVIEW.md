# Web Investigation - コードレビュー

**初回レビュー日**: 2026-02-03
**再レビュー日**: 2026-02-03
**対象**: プロジェクト全体（src/, prisma/, API routes, UI pages）
**バージョン**: 0.1.0

---

## 1. プロジェクト概要

Next.js 15 (App Router) + Prisma + PostgreSQL による「生産技術×デジタル」記事の自動収集・AI要約・メール配信アプリケーション。

| レイヤー | ファイル数 | 状態 |
|----------|-----------|------|
| DB Schema | 5モデル (Source, Article, Settings, JobRun, Metric) | 完成 |
| Core Services | 7ファイル (scraper, summarizer, email-sender, cost-manager, prisma, validation, constants) | 完成 |
| API Routes | 9エンドポイント | 完成 |
| UI Pages | 4ページ (home, articles, sources, settings) | 完成 |
| Components | 11 (Shadcn/UI + Nav) | 完成 |
| Tests | 4テストファイル (バックエンドのみ) | 部分的 |

---

## 2. アーキテクチャ構成

```
src/
├── app/
│   ├── api/
│   │   ├── articles/route.ts      # GET(一覧/検索), POST(作成, CRON_SECRET認証)
│   │   ├── cron/daily/route.ts    # POST(日次ジョブ, CRON_SECRET認証)
│   │   ├── health/route.ts        # GET(ヘルスチェック)
│   │   ├── jobs/manual/route.ts   # POST(手動ジョブ実行)
│   │   ├── jobs/stop/route.ts     # POST(ジョブ停止)
│   │   ├── settings/route.ts      # GET/PUT(設定CRUD, zodバリデーション)
│   │   ├── sources/route.ts       # GET(一覧), POST(作成)
│   │   ├── sources/[id]/route.ts  # GET/PUT/DELETE(個別ソース)
│   │   └── test-email/route.ts    # POST(テストメール送信)
│   ├── articles/page.tsx          # 記事一覧ページ
│   ├── sources/page.tsx           # ソース管理ページ
│   ├── settings/page.tsx          # 設定ページ
│   ├── layout.tsx                 # ルートレイアウト
│   └── page.tsx                   # ホームページ
├── components/
│   ├── layout/nav.tsx             # ナビゲーションバー
│   └── ui/                        # Shadcn/UIコンポーネント群
├── lib/
│   ├── scraper.ts                 # Webスクレイピング（robots.txt, rate limit, sanitize）
│   ├── summarizer.ts              # Claude API要約（リトライ, 並列, メトリクス）
│   ├── email-sender.ts            # Gmail SMTP送信（リトライ, HTMLエスケープ, シングルトンtransporter）
│   ├── cron-handler.ts            # 日次ジョブオーケストレーター（JST対応, クールダウン）
│   ├── cost-manager.ts            # 月次コスト管理
│   ├── prisma.ts                  # Prismaクライアント(シングルトン)
│   ├── constants.ts               # 共通定数（SETTINGS_ID）
│   ├── validation.ts              # 共通バリデーション（isValidUrl）
│   ├── utils.ts                   # Tailwind用ユーティリティ(cn)
│   └── __tests__/                 # テストファイル
├── hooks/                         # カスタムReactフック（空）
└── types/                         # TypeScript型定義（空）
```

---

## 3. 良い点（維持すべき設計）

### 3.1 責務分離の明確さ

各サービスが単一責務で分離されており、`cron-handler.ts` がオーケストレーターとして以下のフローを制御:

```
scrapeAll() → コスト確認 → summarizeArticles() → メール送信 → 失敗通知
```

各フェーズ間で停止シグナルを確認するガード処理も入っている。

### 3.2 堅牢なリトライ戦略

全サービスで統一された指数バックオフ（1s → 2s → 4s、合計3回試行）:
- `summarizer.ts`: Claude API呼び出し
- `email-sender.ts`: SMTP送信

リトライカウントも `for (let attempt = 1; attempt <= MAX_RETRIES; attempt++)` で統一済み。

### 3.3 運用機能の充実

- **コスト管理**: 月次上限、警告閾値（デフォルト80%）、上限超過時は要約スキップ
- **ジョブ制御**: 停止シグナル対応、staleジョブ自動クリーンアップ（10分）、クールダウン（3分）
- **TEST_MODE**: ソース数2、記事数5、タイムアウト短縮で開発テスト向け
- **空メール重複防止**: エラー発生時は空メール通知をスキップし、失敗通知のみ送信

### 3.4 データベース設計

- 適切なインデックス設定 (`collectedAt`, `sourceId`, `status`, `startedAt`, `metricType`, `recordedAt`)
- `onDelete: SetNull` でソース削除時の記事orphan化を防止
- Metricテーブルで粒度の高いAPI使用量トラッキング
- Settings シングルトン: 固定ID (`SETTINGS_ID = "singleton"`) + `upsert` で1レコードに保証

### 3.5 スクレイピングの安全性

- robots.txt チェック（ReDoS対策済み）
- レート制限 (1200ms/origin)
- User-Agent 明示
- HTMLサニタイズ (sanitize-html)

### 3.6 セキュリティ対策

- 全APIエンドポイントで適切な認証（CRON_SECRET）
- メールテンプレートでHTMLエスケープ適用済み
- zodによる入力バリデーション（Settings API）
- `source.config` の型ガード（`parseSourceConfig`）

---

## 4. 初回レビュー指摘事項の対応状況

TSK-REV-001 ～ TSK-REV-013 として対応済み。

| # | 指摘事項 | 優先度 | 対応 | 検証結果 |
|---|----------|--------|------|----------|
| 4.1 | メールテンプレートのXSS | P0 | 対応済 | `escapeHtml()` を `email-sender.ts` L35-42 に追加。`generateEmailBody()` と `sendFailureNotificationEmail()` の全出力箇所で使用を確認 |
| 4.2 | POST /api/articles 認証なし | P0 | 対応済 | `articles/route.ts` L64-79 に Bearer token 認証を追加。CRON_SECRET 未設定時は 401 を返す |
| 4.3 | robots.txt ReDoS | P1 | 対応済 | `scraper.ts` L76 で正規表現特殊文字をエスケープ後に `*` のみ `.*` に変換 |
| 5.1 | Settings シングルトン | P1 | 対応済 | `constants.ts` に `SETTINGS_ID = "singleton"` を定義。settings/route.ts で `upsert`、cost-manager.ts / cron-handler.ts で `findUnique({ where: { id: SETTINGS_ID } })` に統一 |
| 5.2 | タイムゾーン問題 | P1 | 対応済 | `cron-handler.ts` L266-273 で JST (+9h) を明示的に計算し、UTC ↔ JST 変換を実施 |
| 5.3 | dynamic import 多用 | P2 | 対応済 | `cron-handler.ts` L11-17 で scraper / summarizer / email-sender を static import に変更 |
| 5.4 | transporter 毎回再生成 | P3 | 対応済 | `email-sender.ts` L14 で `cachedTransporter` シングルトン化 |
| 6.1 | isValidUrl 重複 | P2 | 対応済 | `validation.ts` に共通化。articles/route.ts, sources/route.ts, sources/[id]/route.ts の3箇所で import を確認 |
| 6.2 | zod 未活用 | P2 | 対応済 | `settings/route.ts` L13-19 で zod スキーマ定義、`safeParse` + `flatten()` によるバリデーション |
| 6.3 | 型安全性の弱さ | P2 | 対応済 | `scraper.ts` L88-99 に `parseSourceConfig()` 型ガードを追加。`source.config as { ... }` キャストを排除 |
| 6.4 | リトライカウント不一致 | P3 | 対応済 | summarizer / email-sender 共に `for (let attempt = 1; attempt <= MAX_RETRIES; attempt++)` で統一（合計3回試行） |
| 7.3 | テストカバレッジ未設定 | P3 | 対応済 | `vitest.config.mjs` L12-17 に v8 provider + text/html reporter 設定を追加 |

**追加改善**（レビュー指摘外）:
- `isJobInCooldown()` 機能追加（`cron-handler.ts` L28-38）: 直近ジョブ完了から3分間は新規ジョブを開始しない
- 空メール / 失敗通知の重複送信防止ロジック（`cron-handler.ts` L293-297）

---

## 5. テスト結果

```
Test Files  4 passed (4)
Tests       31 passed (31)
Duration    4.46s
```

| テストファイル | テスト数 | 状態 |
|---------------|---------|------|
| `summarizer.test.ts` | 7 | 全パス |
| `email-sender.test.ts` | 8 | 全パス |
| `cron-handler.test.ts` | 6 | 全パス |
| `api/settings/route.test.ts` | 10 | 全パス |

テストコードもリトライ回数統一に合わせて修正済み（`mockCreate` の呼び出し回数アサーションを4→3に変更）。

---

## 6. 新たに検出された問題

**対応状況（2026-02-03）:** 6.1, 6.3, 6.4, 6.5, 6.6 を対応済み。6.2（@next/swc 警告）はビルド成功のため残存許容。REQ-REV-014～019 として REQUIREMENTS.md §2.10 に定義。

### 6.1 [HIGH] ビルドエラー: Node.js 18 + cheerio の `File is not defined` — **対応済**

**現象**:
```
[ReferenceError: File is not defined]
> Build error occurred
[Error: Failed to collect page data for /api/cron/daily]
```

**原因**: Node.js 18.19.1 環境で `File` グローバルが未定義。polyfill (`scripts/polyfill-node18.cjs`) は `node -r` でメインプロセスに適用されるが、`next build` がページデータ収集時に spawn するワーカープロセスには引き継がれない。

**影響**: 本番ビルドが失敗し、デプロイ不可。

**対応内容**: `src/instrumentation.ts` を追加。`register()` 内で `globalThis.File`/`Blob` が未定義のときのみ `node:buffer` から polyfill。Next.js 15 では instrumentation はデフォルトで有効なため `next.config.ts` の experimental は不要。package.json の `engines.node` は `>=20` のまま（本番は Node 20+ 推奨）。

**修正案（優先度順）**:

1. **Node.js 20+ へアップグレード**（推奨）: `File` / `Blob` がネイティブでサポートされる
2. **`instrumentation.ts` でポリフィル適用**: Next.js の instrumentation hook を使いワーカーにも適用

```typescript
// src/instrumentation.ts
export async function register() {
  if (typeof globalThis.File === "undefined") {
    const { File, Blob } = await import("buffer");
    globalThis.File = File;
    globalThis.Blob = Blob;
  }
}
```

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["cheerio"],
  experimental: {
    instrumentationHook: true,
  },
};
```

### 6.2 [MEDIUM] `@next/swc` バージョン不一致

**現象**:
```
Mismatching @next/swc version, detected: 15.5.7 while Next.js is on 15.5.11
```

**修正案**: `package-lock.json` を削除して `npm install` を再実行、または `npm update @next/swc` で揃える。

### 6.3 [MEDIUM] `cron-handler.ts` の `as object` キャスト残存 — **対応済**

**ファイル**: `src/lib/cron-handler.ts` L121, L157, L246, L370, L389

`scraper.ts` の `source.config` は `parseSourceConfig` で対応されたが、JobRun の `errors` JSON カラムへの書き込みで `as object` キャストが5箇所残っている。

```typescript
// 現状（5箇所）
errors: allErrors as object
errors: finalErrors as object
errors: [{ type: "job_failed", message: errorMessage }] as object
```

**修正案**: エラー配列の型を `Prisma.InputJsonValue` に揃える。

```typescript
import type { Prisma } from "@prisma/client";

// エラー配列をPrisma互換の型に変換するヘルパー
function toJsonErrors(errors: Array<Record<string, unknown>>): Prisma.InputJsonValue {
  return errors as Prisma.InputJsonValue;
}

// 使用
errors: toJsonErrors(allErrors)
```

### 6.4 [LOW] transporter シングルトンのテスト副作用リスク — **対応済**

**ファイル**: `src/lib/email-sender.ts` L14

`cachedTransporter` はモジュールスコープ変数。テスト間でキャッシュが残り、環境変数変更テスト（`GMAIL_USER = ""` のテスト）で意図通りに `null` が返らない可能性がある。現在は `vi.resetModules()` で回避しているが、キャッシュのリセット手段（`resetTransporter()` 関数等）がないため、将来のテスト追加時に落とし穴になりうる。

**修正案**: テスト用のリセット関数をエクスポート。

```typescript
/** @internal テスト用: キャッシュ済みtransporterをリセット */
export function _resetTransporter(): void {
  cachedTransporter = null;
}
```

### 6.5 [LOW] cron-handler テストの dead mock 定義 — **対応済**

**ファイル**: `src/lib/__tests__/cron-handler.test.ts` L29

```typescript
settings: {
  findFirst: vi.fn(),    // ← 本体は findUnique に移行済み。dead code
  findUnique: vi.fn(),   // ← こちらが実際に使われている
},
```

`findFirst` のモック定義は不要。削除しても全テストがパスする。

### 6.6 [LOW] `EmptySendBehavior` の未使用 import — **対応済**

**ファイル**: `src/lib/email-sender.ts` L7

```typescript
import type { Article, EmptySendBehavior } from "@prisma/client";
//                      ^^^^^^^^^^^^^^^^^^^ ファイル内で未使用
```

---

## 7. 未対応の課題（前回レビューから継続）

**対応状況（2026-02-03）:** 6.5, 7.1, 7.2 を対応済み。REQ-REV-020～022 として REQUIREMENTS.md §2.10 に定義。

| # | 課題 | 優先度 | 備考 |
|---|------|--------|------|
| ~~6.5~~ | ~~console.log/error の直接使用~~ | P3 | **対応済** 構造化ログ（src/lib/logger.ts）を導入し、cron-handler / email-sender / summarizer / scraper で利用 |
| ~~7.1~~ | ~~フロントエンドテストの欠如~~ | P3 | **対応済** src/app/page.test.tsx でホームページの表示・リンクを happy-dom でテスト |
| ~~7.2~~ | ~~APIルート統合テストの欠如~~ | P3 | **対応済** settings 既存に加え、src/app/api/sources/__tests__/route.test.ts で POST バリデーション（不正 URL・type・欠如）をテスト |

---

## 8. 改善優先度マトリクス（更新版）

| 優先度 | 項目 | 影響範囲 | 工数 | 状態 |
|--------|------|----------|------|------|
| ~~**P0**~~ | ~~メールテンプレートのHTMLエスケープ (旧4.1)~~ | ~~セキュリティ~~ | ~~小~~ | **対応済** |
| ~~**P0**~~ | ~~POST /api/articles の認証追加 (旧4.2)~~ | ~~セキュリティ~~ | ~~小~~ | **対応済** |
| **P0** | Node.js 18 ビルドエラー (新6.1) | デプロイ不可 | 中 | **未対応** |
| ~~**P1**~~ | ~~Settingsシングルトンの修正 (旧5.1)~~ | ~~データ整合性~~ | ~~小~~ | **対応済** |
| ~~**P1**~~ | ~~タイムゾーン明示化 (旧5.2)~~ | ~~機能正確性~~ | ~~中~~ | **対応済** |
| ~~**P1**~~ | ~~robots.txt ReDoS対策 (旧4.3)~~ | ~~セキュリティ~~ | ~~小~~ | **対応済** |
| **P2** | `@next/swc` バージョン不一致 (新6.2) | ビルド安定性 | 小 | **未対応** |
| **P2** | `as object` キャスト残存 (新6.3) | 型安全性 | 小 | **未対応** |
| ~~**P2**~~ | ~~zodバリデーション導入 (旧6.2)~~ | ~~保守性~~ | ~~中~~ | **対応済** |
| ~~**P2**~~ | ~~isValidUrl 重複排除 (旧6.1)~~ | ~~保守性~~ | ~~小~~ | **対応済** |
| ~~**P2**~~ | ~~dynamic import → static import (旧5.3)~~ | ~~テスタビリティ~~ | ~~小~~ | **対応済** |
| ~~**P2**~~ | ~~型安全性の強化 (旧6.3)~~ | ~~保守性~~ | ~~中~~ | **対応済** |
| **P3** | 構造化ログ導入 (旧6.5) | 運用性 | 中 | **未対応** |
| **P3** | フロントエンドテスト追加 (旧7.1) | 品質 | 大 | **未対応** |
| **P3** | APIルート統合テスト (旧7.2) | 品質 | 中 | **未対応** |
| **P3** | transporter テスト副作用 (新6.4) | テスタビリティ | 小 | **未対応** |
| **P3** | dead mock / 未使用import (新6.5, 6.6) | コード品質 | 小 | **未対応** |
| ~~**P3**~~ | ~~transporter シングルトン化 (旧5.4)~~ | ~~パフォーマンス~~ | ~~小~~ | **対応済** |
| ~~**P3**~~ | ~~リトライカウント統一 (旧6.4)~~ | ~~一貫性~~ | ~~小~~ | **対応済** |
| ~~**P3**~~ | ~~テストカバレッジ計測 (旧7.3)~~ | ~~品質~~ | ~~小~~ | **対応済** |

---

## 9. 対象ファイル一覧（未対応分）

**要件対応:** 本節の未対応項目は **docs/REQUIREMENTS.md §2.10** に EARS 形式で REQ-REV-014～022 として定義されている。影響度・対応可能性・受け入れ基準は同節を参照。

```
# P0: ビルド修正（REQ-REV-014）
src/instrumentation.ts              # 新規: File/Blob polyfill
next.config.ts                      # instrumentationHook 有効化
（または Node.js 20+ へアップグレード）

# P2: 型安全性（REQ-REV-016）
src/lib/cron-handler.ts             # as object キャスト排除（5箇所）

# P2: 依存関係（REQ-REV-015）
package-lock.json                   # @next/swc バージョン統一

# P3: テスト・コード品質（REQ-REV-017～019）
src/lib/email-sender.ts             # _resetTransporter() 追加, 未使用import削除
src/lib/__tests__/cron-handler.test.ts  # dead mock (findFirst) 削除
```

---

## 10. 総合評価

### 対応前 → 対応後の変化

| 観点 | 対応前 | 対応後 |
|------|--------|--------|
| セキュリティ (P0) | XSS脆弱性あり、API認証なし | HTMLエスケープ済み、全API認証済み |
| データ整合性 (P1) | Settings重複リスク | 固定ID + upsert で1レコード保証 |
| 機能正確性 (P1) | TZ依存でメール対象日がずれる | JST明示で正確な日付範囲 |
| 型安全性 (P2) | 直接キャスト多用 | 型ガード・zod導入 |
| コード品質 (P2) | 重複コード、dynamic import | 共通モジュール化、static import |
| テスト (P3) | カバレッジ未計測 | v8カバレッジ設定済み |

### 残存リスク

1. **ビルド不可（P0）**: Node.js 18 環境で `next build` が失敗する。本番デプロイの障壁。Node.js 20+ アップグレードまたは instrumentation hook で対応が必要
2. **軽微な型安全性（P2）**: `as object` キャスト5箇所が残存。機能には影響なし
3. **テスト不足（P3）**: フロントエンド・APIルートのテストが未実装。バックエンドは31テスト全パス
