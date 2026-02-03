# SDD タスク分解 — コードレビュー対応（機能エンハンス）

**作成日**: 2026-02-03  
**参照**: docs/CODE_REVIEW.md  
**スプリント**: 5日間（1日最大6時間の生産的コーディング、バッファ含む）  
**方針**: 変更影響を考慮し P0/P1 を優先。P2/P3 は影響の小さいものから採用し、無理に全項目は反映しない。

---

## 1. 優先度とスコープ方針

| 採用 | 優先度 | 理由 |
|------|--------|------|
| ✅ 採用 | P0（4.1, 4.2） | セキュリティ必須 |
| ✅ 採用 | P1（5.1, 5.2, 4.3） | データ整合性・機能正確性・ReDoS |
| ✅ 採用 | P2 一部（6.1, 6.2 settings, 5.3） | 重複排除・zod は settings のみ・static import は影響小 |
| ⚠️ 限定 | P2（6.3） | scraper の config 型ガードのみ（cron-handler の as object は別スプリントで検討） |
| ✅ 採用 | P3 一部（5.4, 6.4, 7.3） | transporter シングルトン・リトライ統一・カバレッジ設定は工数小 |
| ❌ 今回見送り | P3（6.5 構造化ログ, 7.1 FE テスト, 7.2 API 統合テスト拡充） | 工数大または別スプリントで計画 |

---

## 2. タスク一覧

### TSK-REV-001: メールテンプレートの HTML エスケープ追加

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-001 |
| **タイトル** | メールテンプレートの XSS 対策（escapeHtml 適用） |
| **説明** | `src/lib/email-sender.ts` の `generateEmailBody()` および `sendFailureNotificationEmail()` 内で、記事タイトル・要約・URL・エラーメッセージ等を HTML エスケープしてから埋め込む。`escapeHtml()` を実装し、該当箇所に適用する。 |
| **見積時間** | 2h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §4.1（HIGH） |
| **受け入れ基準** | - `escapeHtml()` が実装され、`&<>"'` をエスケープしている<br>- `generateEmailBody` の article.title, article.summary, article.url に適用されている<br>- `sendFailureNotificationEmail` の error 各フィールドに適用されている<br>- 既存の email-sender テストが通る |

---

### TSK-REV-002: POST /api/articles に認証追加

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-002 |
| **タイトル** | POST /api/articles を CRON_SECRET で保護 |
| **説明** | `src/app/api/articles/route.ts` の POST ハンドラで、`Authorization: Bearer <CRON_SECRET>` を検証する。未認証の場合は 401 を返す。cron/daily や jobs/manual と同様のパターンに揃える。 |
| **見積時間** | 1h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §4.2（MEDIUM） |
| **受け入れ基準** | - CRON_SECRET が設定されている場合、Bearer トークンが一致しないと POST が 401 になる<br>- GET /api/articles は認証不要のまま<br>- 既存の呼び出し元（cron-handler / scraper 経由）が認証付きで呼ぶよう修正されている |

---

### TSK-REV-003: Settings シングルトンの upsert 化

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-003 |
| **タイトル** | Settings を固定 ID で upsert し 1 レコードに保つ |
| **説明** | Prisma の Settings に `id` を利用する前提で、`src/app/api/settings/route.ts` を upsert に変更。`findFirst` で最新を取る現状だと PUT のたびに新レコードが増える問題を解消する。マイグレーションで既存データのマージまたは id 付与が必要な場合は検討する。 |
| **見積時間** | 2.5h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §5.1（HIGH） |
| **受け入れ基準** | - GET/PUT settings が固定 ID（例: `singleton`）で upsert されている<br>- 既存の Settings 利用箇所（cron-handler, cost-manager）が引き続き動作する<br>- 必要なら Prisma スキーマの Settings.id を必須・デフォルト値で定義している |

---

### TSK-REV-004: 日次ジョブのタイムゾーン明示（JST）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-004 |
| **タイトル** | cron-handler の「日」の境界を JST で明示的に計算 |
| **説明** | `src/lib/cron-handler.ts` で `startOfDay` を算出している箇所を、サーバー TZ に依存せず JST で「その日の 0:00」を計算するように変更する。 |
| **見積時間** | 2h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §5.2（MEDIUM） |
| **受け入れ基準** | - 日次集計の境界が JST 0:00 で一意に決まる<br>- 既存の日次ジョブ・メトリクス集計のテストが通る |

---

### TSK-REV-005: robots.txt パースの ReDoS 対策

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-005 |
| **タイトル** | Disallow パスを正規表現に変換する際のエスケープ |
| **説明** | `src/lib/scraper.ts` で Disallow パスを `RegExp` に変換する前に、正規表現の特殊文字をエスケープし、`*` のみ `.*` に置換する。 |
| **見積時間** | 1h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §4.3（MEDIUM） |
| **受け入れ基準** | - `escapeRegExp` 相当の処理で `.+?^${}()|[\]\\` をエスケープしている<br>- 既存の scraper テストが通る |

---

### TSK-REV-006: isValidUrl の共通化

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-006 |
| **タイトル** | isValidUrl を 1 箇所に集約し API から利用 |
| **説明** | `src/lib/validation.ts`（または `utils.ts`）に `isValidUrl(s: string): boolean` を定義し、`api/articles/route.ts`・`api/sources/route.ts`・`api/sources/[id]/route.ts` からインポートして使用する。重複実装を削除する。 |
| **見積時間** | 1h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.1（MEDIUM） |
| **受け入れ基準** | - 1 ファイルにのみ `isValidUrl` が存在する<br>- 上記 3 API がその実装を参照している<br>- 挙動が変わっていない（既存テストまたは手動確認） |

---

### TSK-REV-007: Settings API の zod バリデーション導入

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-007 |
| **タイトル** | PUT /api/settings の body を zod で検証 |
| **説明** | `src/app/api/settings/route.ts` の PUT で、リクエスト body を zod スキーマで検証する。`dailySendTime`・`recipientEmail`・`emptySendBehavior`・`costLimitMonthly`・`costWarningRatio` を型安全にパースし、エラー時は 400 と flatten したメッセージを返す。 |
| **見積時間** | 2h |
| **依存関係** | なし（zod は既存依存） |
| **設計参照** | CODE_REVIEW §6.2（MEDIUM） |
| **受け入れ基準** | - 不正な body で 400 とバリデーション詳細が返る<br>- 正常系の PUT/GET が従来どおり動作する |

---

### TSK-REV-008: cron-handler の dynamic → static import

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-008 |
| **タイトル** | cron-handler 内の dynamic import を静的 import に変更 |
| **説明** | `src/lib/cron-handler.ts` の `import("@/lib/scraper")` 等をファイル先頭の通常 import に置き換える。テスト時のモックがしやすくなる。 |
| **見積時間** | 0.5h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §5.3（MEDIUM） |
| **受け入れ基準** | - scraper / summarizer / email-sender が先頭で静的 import されている<br>- 既存の cron-handler テストが通る |

---

### TSK-REV-009: scraper の config 型ガード

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-009 |
| **タイトル** | Source.config (Json) を型安全にパースする関数の追加 |
| **説明** | `src/lib/scraper.ts` で `source.config` を `as { listLinkSelector?: string }` で使っている箇所を、`parseSourceConfig(config: unknown)` のような型ガード／パーサーに置き換え、安全にプロパティを参照する。 |
| **見積時間** | 1.5h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.3（MEDIUM） |
| **受け入れ基準** | - config が unknown から安全にパースされ、listLinkSelector 等のみ使用している<br>- 既存の scraper テストが通る |

---

### TSK-REV-010: nodemailer transporter のシングルトン化

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-010 |
| **タイトル** | email-sender で createTransport を 1 回だけ実行するよう変更 |
| **説明** | `src/lib/email-sender.ts` で、Prisma と同様に `getTransporter()` でキャッシュした transporter を返すようにし、毎回 `createTransport` しないようにする。 |
| **見積時間** | 1h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §5.4（LOW） |
| **受け入れ基準** | - 同一プロセス内で transporter が再利用されている<br>- 既存のメール送信テストが通る |

---

### TSK-REV-011: リトライ回数の統一とコメント

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-011 |
| **タイトル** | summarizer / email-sender の「最大試行回数」を統一し明示 |
| **説明** | CODE_REVIEW §6.4 に従い、`MAX_RETRIES = 3` のとき「初回 + 3 回リトライ = 最大 4 回試行」か「最大 3 回試行」のどちらかに統一し、コメントで「最大 N 回試行」と明記する。必要ならループ条件を揃える。 |
| **見積時間** | 0.5h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.4（LOW） |
| **受け入れ基準** | - 両方のリトライロジックの試行回数がドキュメントと一致している<br>- 既存テストが通る |

---

### TSK-REV-012: Vitest カバレッジ設定の追加

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-012 |
| **タイトル** | vitest でカバレッジ計測を有効化 |
| **説明** | `vitest.config.mjs`（またはプロジェクトの Vitest 設定）に `coverage` を追加。provider: v8、reporter: text, html、include: `src/lib/**/*.ts` 等を設定する。 |
| **見積時間** | 0.5h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §7.3 |
| **受け入れ基準** | - `pnpm test -- --coverage`（または同等）でカバレッジが出力される<br>- 既存テストがそのまま実行できる |

---

### TSK-REV-013: レビュー対応後のテスト・ドキュメント更新

| 項目 | 内容 |
|------|------|
| **ID** | TSK-REV-013 |
| **タイトル** | 変更に伴うテスト修正と CODE_REVIEW 反映メモ |
| **説明** | TSK-REV-001〜012 の変更で壊れたテストを修正する。また、docs/CODE_REVIEW.md の「修正済み」セクションを追記するか、PROJECT_STATUS に「コードレビュー対応スプリント完了」を記録する。 |
| **見積時間** | 2h |
| **依存関係** | TSK-REV-001 〜 TSK-REV-012 |
| **設計参照** | CODE_REVIEW 全体 |
| **受け入れ基準** | - 全テストが通る<br>- 変更内容がドキュメントに反映されている |

---

## 3. スプリント配分（5 日間）

**前提**: 1 日あたり最大 6 時間の生産的コーディング、合計 30 時間。バッファは最終日に 1h 程度を想定。

| 日 | タスク | 時間 | 累計 | メモ |
|----|--------|------|------|------|
| **Day 1** | TSK-REV-001, TSK-REV-002 | 3h | 3h | P0 セキュリティ |
| | TSK-REV-003（着手） | 2h | 5h | Settings upsert |
| **Day 2** | TSK-REV-003（完了）, TSK-REV-004 | 3h | 8h | P1 設計 |
| | TSK-REV-005, TSK-REV-006 | 2h | 10h | ReDoS・共通化 |
| **Day 3** | TSK-REV-007, TSK-REV-008 | 2.5h | 12.5h | zod・static import |
| | TSK-REV-009, TSK-REV-010 | 2.5h | 15h | 型安全・transporter |
| **Day 4** | TSK-REV-011, TSK-REV-012 | 1h | 16h | リトライ・カバレッジ |
| | TSK-REV-013（テスト修正・ドキュメント） | 4h | 20h | 受け入れ・回帰 |
| **Day 5** | 統合確認・回帰テスト・バッファ | 6h | 26h | 余裕でレビュー・調整 |

**合計見積**: 約 26h（バッファ 4h を含む 30h 枠内）

---

## 4. 依存関係グラフ（概要）

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

（REV-001〜012 は互いに独立して並行可能。REV-013 はそれら完了後に実施。）

---

## 5. 受け入れ基準サマリー（スプリント完了時）

- [ ] メール本文・失敗通知に外部由来文字列がエスケープされて埋め込まれている（TSK-REV-001）
- [ ] POST /api/articles が CRON_SECRET で保護されている（TSK-REV-002）
- [ ] Settings が 1 レコードに保たれ、PUT で増えない（TSK-REV-003）
- [ ] 日次ジョブの「日」が JST で一意に決まる（TSK-REV-004）
- [ ] robots.txt 由来の正規表現が ReDoS 対策されている（TSK-REV-005）
- [ ] `isValidUrl` が 1 箇所で定義され 3 API で共有されている（TSK-REV-006）
- [ ] PUT /api/settings が zod でバリデーションされている（TSK-REV-007）
- [ ] cron-handler が scraper/summarizer/email-sender を静的 import している（TSK-REV-008）
- [ ] scraper が Source.config を型安全にパースしている（TSK-REV-009）
- [ ] email-sender が transporter をシングルトン利用している（TSK-REV-010）
- [ ] リトライ回数が統一されコメントで明示されている（TSK-REV-011）
- [ ] Vitest でカバレッジが取得できる（TSK-REV-012）
- [ ] 全テストが通り、変更がドキュメントに反映されている（TSK-REV-013）

---

## 6. 今回スコープ外（今後の検討）

- 4.4 URL の直接 HTML 出力（isValidUrl で HTTP(S) に限定する拡張は別タスク）
- 5.2 以外のタイムゾーン（表示側の JST 変換など）
- cron-handler の `errors as object` の型強化（6.3 の残り）
- 他の API ルートへの zod 一括導入
- 構造化ログ（6.5）
- フロントエンドテスト追加（7.1）
- API ルートの統合テスト拡充（7.2）

以上。
