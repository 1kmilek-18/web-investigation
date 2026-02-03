# タスク計画 — コードレビュー対応（機能エンハンス）

**作成日**: 2026-02-03  
**更新日**: 2026-02-03  
**参照**: docs/CODE_REVIEW.md, docs/REQUIREMENTS.md §2.10, docs/REQUIREMENTS_REVIEW_CODE_REVIEW.md, docs/REQUIREMENTS_REVIEW_REV014_022.md  
**スプリント**: 5日間（1日最大6時間、バッファ含む）

---

## タスクカテゴリと一覧

| カテゴリ | タスクID | 概要 |
|----------|----------|------|
| **Setup** | TSK-REV-012 | Vitest カバレッジ設定 |
| **Core** | TSK-REV-001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011 | セキュリティ・設計・保守性の実装 |
| **Integration** | TSK-REV-002（呼び出し元修正）, TSK-REV-003（利用箇所確認） | API と消費側の接続 |
| **Testing** | TSK-REV-013 | テスト修正・回帰確認 |
| **Documentation** | TSK-REV-013 | ドキュメント更新 |

---

## タスク詳細（TSK-XXX-NNN 形式）

### Setup

---

#### TSK-REV-012: Vitest カバレッジ設定の追加

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-012 |
| **Title** | Add Vitest coverage configuration |
| **Description** | vitest.config.mjs（またはプロジェクトの Vitest 設定）に coverage を追加する。provider: v8、reporter: text, html、include: src/lib/**/*.ts 等を設定し、既存テスト実行を壊さない。 |
| **Estimated Hours** | 0.5h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §7.3 |
| **Acceptance Criteria** | (1) `pnpm test -- --coverage`（または同等）でカバレッジが出力される。(2) 既存テストがそのまま実行できる。 |

---

### Core

---

#### TSK-REV-001: メールテンプレートの HTML エスケープ追加

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-001 |
| **Title** | Apply HTML escaping to email templates (XSS mitigation) |
| **Description** | src/lib/email-sender.ts に escapeHtml() を実装し、generateEmailBody() および sendFailureNotificationEmail() 内で、記事タイトル・要約・URL・エラーメッセージ等をエスケープしてから HTML に埋め込む。 |
| **Estimated Hours** | 2h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §4.1（HIGH） |
| **Acceptance Criteria** | (1) escapeHtml() が &<>"' をエスケープしている。(2) generateEmailBody の article.title, article.summary, article.url に適用されている。(3) sendFailureNotificationEmail の error 各フィールドに適用されている。(4) 既存の email-sender テストが通る。 |

---

#### TSK-REV-002: POST /api/articles に認証追加

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-002 |
| **Title** | Protect POST /api/articles with CRON_SECRET |
| **Description** | src/app/api/articles/route.ts の POST で Authorization: Bearer &lt;CRON_SECRET&gt; を検証する。未認証時は 401。cron/daily・jobs/manual と同じパターンに揃える。呼び出し元（cron-handler / scraper 経由）を認証付きで呼ぶよう修正する。 |
| **Estimated Hours** | 1h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §4.2（MEDIUM） |
| **Acceptance Criteria** | (1) CRON_SECRET 設定時、Bearer が一致しないと POST が 401 になる。(2) GET /api/articles は認証不要のまま。(3) 既存の呼び出し元が認証付きで POST するよう修正されている。 |

---

#### TSK-REV-003: Settings シングルトンの upsert 化

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-003 |
| **Title** | Enforce Settings singleton via upsert with fixed ID |
| **Description** | Prisma の Settings を固定 ID（例: singleton）で upsert するよう src/app/api/settings/route.ts を変更する。findFirst + create によるレコード増加を防ぐ。必要なら Prisma スキーマの id を必須・デフォルトで定義し、既存データのマイグレーションを検討する。 |
| **Estimated Hours** | 2.5h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §5.1（HIGH） |
| **Acceptance Criteria** | (1) GET/PUT が固定 ID で upsert されている。(2) cron-handler, cost-manager が従来どおり動作する。(3) Prisma スキーマの Settings.id が要件と一致している。 |

---

#### TSK-REV-004: 日次ジョブのタイムゾーン明示（JST）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-004 |
| **Title** | Define daily boundary in JST for cron-handler |
| **Description** | src/lib/cron-handler.ts で startOfDay を算出している箇所を、サーバー TZ に依存せず JST 0:00 で「その日」の境界を計算するように変更する。 |
| **Estimated Hours** | 2h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §5.2（MEDIUM） |
| **Acceptance Criteria** | (1) 日次集計の境界が JST 0:00 で一意に決まる。(2) 既存の日次ジョブ・メトリクス集計のテストが通る。 |

---

#### TSK-REV-005: robots.txt パースの ReDoS 対策

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-005 |
| **Title** | Escape regex metacharacters when parsing robots.txt Disallow |
| **Description** | src/lib/scraper.ts で Disallow パスを RegExp に変換する前に、正規表現の特殊文字をエスケープし、* のみ .* に置換する。 |
| **Estimated Hours** | 1h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §4.3（MEDIUM） |
| **Acceptance Criteria** | (1) escapeRegExp 相当で .+?^${}()|[\]\\ をエスケープしている。(2) 既存の scraper テストが通る。 |

---

#### TSK-REV-006: isValidUrl の共通化

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-006 |
| **Title** | Centralize isValidUrl in shared module and use from APIs |
| **Description** | src/lib/validation.ts（または utils.ts）に isValidUrl(s: string): boolean を定義し、api/articles/route.ts・api/sources/route.ts・api/sources/[id]/route.ts からインポートして使用する。重複実装を削除する。 |
| **Estimated Hours** | 1h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.1（MEDIUM） |
| **Acceptance Criteria** | (1) isValidUrl が 1 ファイルにのみ存在する。(2) 上記 3 API がその実装を参照している。(3) 挙動が従来と変わらない（既存テストまたは手動確認）。 |

---

#### TSK-REV-007: Settings API の zod バリデーション導入

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-007 |
| **Title** | Validate PUT /api/settings body with zod schema |
| **Description** | src/app/api/settings/route.ts の PUT でリクエスト body を zod スキーマで検証する。dailySendTime・recipientEmail・emptySendBehavior・costLimitMonthly・costWarningRatio を型安全にパースし、不正時は 400 と flatten したメッセージを返す。 |
| **Estimated Hours** | 2h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.2（MEDIUM） |
| **Acceptance Criteria** | (1) 不正な body で 400 とバリデーション詳細が返る。(2) 正常系の PUT/GET が従来どおり動作する。 |

---

#### TSK-REV-008: cron-handler の dynamic → static import

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-008 |
| **Title** | Replace dynamic imports with static imports in cron-handler |
| **Description** | src/lib/cron-handler.ts の import("@/lib/scraper") 等をファイル先頭の通常 import に置き換える。 |
| **Estimated Hours** | 0.5h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §5.3（MEDIUM） |
| **Acceptance Criteria** | (1) scraper / summarizer / email-sender が先頭で静的 import されている。(2) 既存の cron-handler テストが通る。 |

---

#### TSK-REV-009: scraper の config 型ガード

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-009 |
| **Title** | Add type-safe parser for Source.config (Json) in scraper |
| **Description** | src/lib/scraper.ts で source.config を as でキャストしている箇所を、parseSourceConfig(config: unknown) のような型ガード／パーサーに置き換え、安全に listLinkSelector 等を参照する。 |
| **Estimated Hours** | 1.5h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.3（MEDIUM） |
| **Acceptance Criteria** | (1) config が unknown から安全にパースされ、listLinkSelector 等のみ使用している。(2) 既存の scraper テストが通る。 |

---

#### TSK-REV-010: nodemailer transporter のシングルトン化

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-010 |
| **Title** | Reuse single nodemailer transporter instance per process |
| **Description** | src/lib/email-sender.ts で getTransporter() によりキャッシュした transporter を返すようにし、毎回 createTransport しないようにする。 |
| **Estimated Hours** | 1h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §5.4（LOW） |
| **Acceptance Criteria** | (1) 同一プロセス内で transporter が再利用されている。(2) 既存のメール送信テストが通る。 |

---

#### TSK-REV-011: リトライ回数の統一とコメント

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-011 |
| **Title** | Unify retry semantics and document max attempts |
| **Description** | summarizer と email-sender の「最大試行回数」の解釈を統一し、コメントで「最大 N 回試行」と明記する。必要ならループ条件を揃える。 |
| **Estimated Hours** | 0.5h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.4（LOW） |
| **Acceptance Criteria** | (1) 両方のリトライロジックの試行回数がドキュメントと一致している。(2) 既存テストが通る。 |

---

### Integration

（TSK-REV-002 の呼び出し元修正は Core の TSK-REV-002 に含めた。TSK-REV-003 の利用箇所確認も TSK-REV-003 の受け入れ基準に含めた。独立した Integration タスクは設けず、以下で結合・回帰を実施する。）

---

### Testing / Documentation

---

#### TSK-REV-013: レビュー対応後のテスト・ドキュメント更新

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-013 |
| **Title** | Fix broken tests and update documentation after enhancements |
| **Description** | TSK-REV-001〜012 の変更で壊れたテストを修正する。全テストが通ることを確認する。docs/CODE_REVIEW.md に「修正済み」セクションを追記するか、PROJECT_STATUS にコードレビュー対応スプリント完了を記録する。 |
| **Estimated Hours** | 2h |
| **Dependencies** | TSK-REV-001 〜 TSK-REV-012 |
| **Design Reference** | CODE_REVIEW 全体、憲法 7. Quality Gates |
| **Acceptance Criteria** | (1) 全テストが通る。(2) 変更内容がドキュメントに反映されている。 |

---

## スプリント配分（5日間・1日6時間）

| 日 | タスク | カテゴリ | 時間 | 累計 | メモ |
|----|--------|----------|------|------|------|
| **Day 1** | TSK-REV-001, TSK-REV-002 | Core | 3h | 3h | P0 セキュリティ |
| | TSK-REV-003（着手） | Core | 2h | 5h | Settings upsert |
| **Day 2** | TSK-REV-003（完了）, TSK-REV-004 | Core | 3h | 8h | P1 設計 |
| | TSK-REV-005, TSK-REV-006 | Core | 2h | 10h | ReDoS・共通化 |
| **Day 3** | TSK-REV-007, TSK-REV-008 | Core | 2.5h | 12.5h | zod・static import |
| | TSK-REV-009, TSK-REV-010 | Core | 2.5h | 15h | 型安全・transporter |
| **Day 4** | TSK-REV-011, TSK-REV-012 | Core, Setup | 1h | 16h | リトライ・カバレッジ |
| | TSK-REV-013 | Testing, Documentation | 4h | 20h | テスト修正・ドキュメント |
| **Day 5** | 統合確認・回帰テスト・バッファ | — | 6h | 26h | レビュー・調整 |

**合計見積**: 約 26h（30h 枠のうち 4h バッファ）

---

## 依存関係（概要）

```
TSK-REV-001 ─┐
TSK-REV-002 ─┤
TSK-REV-003 ─┤
TSK-REV-004 ─┤
TSK-REV-005 ─┼──► TSK-REV-013
TSK-REV-006 ─┤
TSK-REV-007 ─┤
TSK-REV-008 ─┤
TSK-REV-009 ─┤
TSK-REV-010 ─┤
TSK-REV-011 ─┤
TSK-REV-012 ─┘
```

REV-001〜012 は互いに独立。REV-013 はそれら完了後に実施。

---

## スプリント完了時の受け入れサマリー

- [ ] TSK-REV-001: メール XSS 対策済み
- [ ] TSK-REV-002: POST /api/articles 認証済み
- [ ] TSK-REV-003: Settings シングルトン保証
- [ ] TSK-REV-004: 日次境界が JST で一意
- [ ] TSK-REV-005: robots.txt ReDoS 対策済み
- [ ] TSK-REV-006: isValidUrl 共通化済み
- [ ] TSK-REV-007: PUT /api/settings が zod で検証
- [ ] TSK-REV-008: cron-handler が static import
- [ ] TSK-REV-009: scraper の config が型安全
- [ ] TSK-REV-010: transporter シングルトン利用
- [ ] TSK-REV-011: リトライ回数統一・コメントあり
- [ ] TSK-REV-012: Vitest カバレッジ取得可能
- [ ] TSK-REV-013: 全テスト通過・ドキュメント反映

---

## コードレビュー未対応分（TSK-REV-014～022）

CODE_REVIEW.md §6–7 で検出された未対応項目を REQ-REV-014～022 として要件化し、本タスクに分解した。詳細は docs/TASKS.md §コードレビュー未対応分 および docs/REQUIREMENTS.md §2.10 を参照。

### タスクカテゴリと一覧（未対応分）

| カテゴリ | タスクID | 概要 |
|----------|----------|------|
| **Setup** | TSK-REV-014, TSK-REV-015 | ビルド環境・Node/File、@next/swc バージョン一致 |
| **Core** | TSK-REV-016, TSK-REV-017, TSK-REV-019 | JobRun errors 型安全、transporter リセット、未使用 import 削除 |
| **Testing** | TSK-REV-018, TSK-REV-021, TSK-REV-022 | デッドモック削除、フロントエンドテスト、API 統合テスト |
| **Core（運用）** | TSK-REV-020 | 構造化ログ |

### タスク詳細（未対応分）

#### TSK-REV-014: ビルド環境・File/Blob（P0）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-014 |
| **Title** | Resolve "File is not defined" build failure (Node 20+ or instrumentation) |
| **Description** | Node.js 18 等で `next build` が失敗する問題を解消する。Node.js 20+ への昇格、または `src/instrumentation.ts` で File/Blob の polyfill を適用する。採用方針に応じて package.json の engines や README を更新する。 |
| **Estimated Hours** | 3～4h（Node 20+ なら 1～2h） |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.1, REQ-REV-014 |
| **Acceptance Criteria** | (1) 対象ランタイムで `next build` が成功する。(2) API ルートがビルド時にエラーにならない。(3) 採用方針をドキュメントに記載する。 |

#### TSK-REV-015: Next.js / @next/swc バージョン一致（P2）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-015 |
| **Title** | Align Next.js and @next/swc versions |
| **Description** | package.json / lockfile で Next.js と @next/swc のバージョンを整合させ、ビルド時のバージョン不一致警告を解消する。 |
| **Estimated Hours** | 0.5～1h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.2, REQ-REV-015 |
| **Acceptance Criteria** | (1) `next build` で @next/swc のバージョン不一致警告が出ない。(2) package.json / lockfile でバージョンが整合している。 |

#### TSK-REV-016: JobRun errors の型安全な永続化（P2）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-016 |
| **Title** | Replace "as object" with type-safe JobRun errors persistence |
| **Description** | cron-handler 内で JobRun.errors に書き込む 5 箇所の `as object` を、Prisma.InputJsonValue または toJsonErrors 等のヘルパーで型安全に変換する。 |
| **Estimated Hours** | 1～1.5h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.3, REQ-REV-016 |
| **Acceptance Criteria** | (1) 未チェックの `as object` を使用していない。(2) 型安全な変換をしている。(3) 既存の cron-handler テストが通る。 |

#### TSK-REV-017: シングルトン／キャッシュのテスト用リセット（P3）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-017 |
| **Title** | Expose test-only reset for transporter cache |
| **Description** | email-sender に _resetTransporter() 等のテスト用リセット関数をエクスポートする。 |
| **Estimated Hours** | 0.5h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.4, REQ-REV-017 |
| **Acceptance Criteria** | (1) リセット関数がエクスポートされている。(2) 既存の email-sender テストが通る。 |

#### TSK-REV-018: デッドモックの削除（P3）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-018 |
| **Title** | Remove dead mock (findFirst) from cron-handler test |
| **Description** | cron-handler.test.ts から未使用の findFirst モックを削除する。 |
| **Estimated Hours** | 0.25h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.5, REQ-REV-018 |
| **Acceptance Criteria** | (1) 未使用モックが削除されている。(2) 全テストがパスする。 |

#### TSK-REV-019: 未使用 import の削除（P3）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-019 |
| **Title** | Remove unused EmptySendBehavior import from email-sender |
| **Description** | email-sender.ts から未使用の EmptySendBehavior の import を削除する。 |
| **Estimated Hours** | 0.25h |
| **Dependencies** | なし |
| **Design Reference** | CODE_REVIEW §6.6, REQ-REV-019 |
| **Acceptance Criteria** | (1) 未使用 import が削除されている。(2) ビルド・テストが通る。 |

#### TSK-REV-020～022（P3・別スプリント推奨）

- **TSK-REV-020**: 構造化ログ（3～4h）。Phase 5 でまとめて実施する方針も可。
- **TSK-REV-021**: フロントエンドテスト（6h+）。Phase 4 完了後にスコープ定義を推奨。
- **TSK-REV-022**: API ルート統合テスト（3～4h）。

詳細は docs/TASKS.md §コードレビュー未対応分 を参照。

### スプリント配分（未対応分・P0+P2+軽微）

| 日 | タスク | カテゴリ | 時間 | 累計 |
|----|--------|----------|------|------|
| **Day 1** | TSK-REV-014 | Setup | 3～4h | 4h |
| **Day 1 または 2** | TSK-REV-015, TSK-REV-016 | Setup, Core | 2h | 6h |
| **Day 2** | TSK-REV-017, TSK-REV-018, TSK-REV-019 | Core, Testing | 1h | 7h |

**合計見積（P0+P2+軽微）**: 約 7h。TSK-REV-020～022 は工数に応じて別スプリントで計画。

### 依存関係（未対応分）

```
TSK-REV-014 ─┬─ 独立（P0 即時）
TSK-REV-015 ─┤
TSK-REV-016 ─┤
TSK-REV-017 ─┼─ 互いに独立
TSK-REV-018 ─┤
TSK-REV-019 ─┘
TSK-REV-020～022 ─ 別スプリント
```

### スプリント完了時の受け入れサマリー（未対応分）

- [ ] TSK-REV-014: 本番ビルドが成功する
- [ ] TSK-REV-015: @next/swc バージョン一致
- [ ] TSK-REV-016: JobRun errors が型安全に永続化される
- [ ] TSK-REV-017: transporter テスト用リセットが利用可能
- [ ] TSK-REV-018: デッドモック削除済み
- [ ] TSK-REV-019: 未使用 import 削除済み
