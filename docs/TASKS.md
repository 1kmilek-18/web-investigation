# Web Investigation タスク管理・分解書

**作成日:** 2026-02-02  
**更新日:** 2026-02-03  
**参照:** docs/REQUIREMENTS.md v1.5, docs/SDD.md v1.1, docs/PROJECT_STATUS.md, docs/CODE_REVIEW.md, docs/TASK_PLAN_CODE_REVIEW.md, docs/REQUIREMENTS_REVIEW_REV014_022.md  
**Sprint期間:** 5日間（1日6時間の生産的コーディング）

---

## 📊 実装状況サマリー

| フェーズ | 状態 | 進捗率 |
|---------|------|--------|
| **Phase 1: 基盤・収集** | ✅ 完了 | 100% |
| **Phase 2: 要約** | ✅ 完了 | 100% |
| **Phase 2.5: Settings API** | ✅ 完了 | 100% |
| **Phase 3: 配信** | ⏳ 要確認（email-sender 実装あり） | — |
| **Phase 4: Web UI** | ⏳ 未着手 | 0% |
| **Phase 5: 運用強化** | ⏳ 未着手 | 0% |
| **コードレビュー対応（初回）** | ✅ 完了 | TSK-REV-001～013 完了 |
| **コードレビュー未対応分** | ⏳ 未着手 | TSK-REV-014～022 |

---

## 🗂 全体の残タスクと実行順序

タスク関連は本ファイルで一括管理する。残りは次の **4 ブロック**。

| 順序 | ブロック | タスク | 見積 | 参照 |
|------|----------|--------|------|------|
| **1** | コードレビュー対応（初回） | TSK-REV-001 ～ 013 | ✅ 完了 | 本ドキュメント §コードレビュー対応 |
| **2** | コードレビュー未対応分 | TSK-REV-014 ～ 022 | 約 14h（P0+P2+軽微は 1～2日、P3 残は別計画） | §コードレビュー未対応分 |
| **3** | Phase 3 の確定 | 実装確認 or TSK-EML-001～007 | 0.5～2日 | §Phase 3 |
| **4** | Phase 4: Web UI | TSK-UI-001 ～ 009 | 約 27h（5日） | §Phase 4 |
| **5** | Phase 5: 運用強化 | TSK-MET-001, 002 | 約 5h（1日） | §Phase 5 |

**残工数目安**: コードレビュー未対応分（P0 即時推奨）約 14h。Phase 3 を未実装とみなす場合 約 77h（14～15日）。Phase 3 実装済みなら 約 58h（10～11日）。

**参照**: コードレビュー対応の詳細・スプリント配分は `docs/TASK_PLAN_CODE_REVIEW.md` を参照。

---

## 🎯 Sprint計画

### Sprint 1: Phase 2 要約機能（5日間、30時間）

**目標:** Claude API連携による要約機能の実装

| 日 | タスク | 時間 | 累計 |
|---|--------|------|------|
| Day 1 | TSK-SUM-001, TSK-SUM-002 | 6h | 6h |
| Day 2 | TSK-SUM-003, TSK-SUM-004 | 6h | 12h |
| Day 3 | TSK-SUM-005, TSK-SUM-006 | 6h | 18h |
| Day 4 | TSK-SUM-007, TSK-SUM-008 | 6h | 24h |
| Day 5 | TSK-SUM-009, バッファ・統合テスト | 6h | 30h |

### Sprint 2: Phase 2.5 Settings API + Phase 3 配信機能（5日間、30時間）

**目標:** Settings API実装とGmail配信機能の実装

| 日 | タスク | 時間 | 累計 |
|---|--------|------|------|
| Day 1 | TSK-SET-001, TSK-SET-002 | 6h | 6h |
| Day 2 | TSK-EML-001, TSK-EML-002 | 6h | 12h |
| Day 3 | TSK-EML-003, TSK-EML-004 | 6h | 18h |
| Day 4 | TSK-EML-005, TSK-EML-006 | 6h | 24h |
| Day 5 | TSK-EML-007, バッファ・統合テスト | 6h | 30h |

### Sprint 3: Phase 4 Web UI（5日間、30時間）

**目標:** Web UIの実装（ソース設定、配信設定、記事閲覧）

| 日 | タスク | 時間 | 累計 |
|---|--------|------|------|
| Day 1 | TSK-UI-001, TSK-UI-002 | 6h | 6h |
| Day 2 | TSK-UI-003, TSK-UI-004 | 6h | 12h |
| Day 3 | TSK-UI-005, TSK-UI-006 | 6h | 18h |
| Day 4 | TSK-UI-007, TSK-UI-008 | 6h | 24h |
| Day 5 | TSK-UI-009, バッファ・統合テスト | 6h | 30h |

### Sprint コードレビュー対応（5日間、約26時間）

**目標:** セキュリティ・設計・保守性のエンハンス（CODE_REVIEW 対応）

| 日 | タスク | 時間 | 累計 |
|---|--------|------|------|
| Day 1 | TSK-REV-001, TSK-REV-002, TSK-REV-003（着手） | 5h | 5h |
| Day 2 | TSK-REV-003（完了）, TSK-REV-004, TSK-REV-005, TSK-REV-006 | 5h | 10h |
| Day 3 | TSK-REV-007, TSK-REV-008, TSK-REV-009, TSK-REV-010 | 5h | 15h |
| Day 4 | TSK-REV-011, TSK-REV-012, TSK-REV-013 | 3h | 18h |
| Day 5 | 統合・回帰・バッファ | 6h | 24h |

**詳細**: `docs/TASK_PLAN_CODE_REVIEW.md` 参照。

### Sprint コードレビュー未対応分（P0 即時 + P2/P3、約 14h）

**目標:** REQ-REV-014～022 の対応（ビルド可能化・型安全・コード品質）。REQUIREMENTS.md §2.10 参照。

| 日 | タスク | 時間 | 累計 |
|---|--------|------|------|
| Day 1 | TSK-REV-014（P0: ビルド環境） | 3～4h | 4h |
| Day 1 または 2 | TSK-REV-015, TSK-REV-016（P2） | 2h | 6h |
| Day 2 | TSK-REV-017, TSK-REV-018, TSK-REV-019（P3 軽微） | 1h | 7h |
| 別スプリント | TSK-REV-020～022（P3: ログ・テスト） | 工数に応じて計画 | — |

**受け入れ基準・詳細**: 本ドキュメント §コードレビュー未対応分、`docs/TASK_PLAN_CODE_REVIEW.md` §未対応分 参照。

---

## 📋 コードレビュー対応タスク（TSK-REV-xxx）

**参照:** docs/CODE_REVIEW.md, docs/TASK_PLAN_CODE_REVIEW.md

| ID | タイトル | 時間 | カテゴリ | 設計参照 |
|----|----------|------|----------|----------|
| TSK-REV-001 | メールテンプレートの HTML エスケープ（XSS対策） | 2h | Core | CODE_REVIEW §4.1 |
| TSK-REV-002 | POST /api/articles に CRON_SECRET 認証追加 | 1h | Core | §4.2 |
| TSK-REV-003 | Settings シングルトンの upsert 化 | 2.5h | Core | §5.1 |
| TSK-REV-004 | 日次ジョブのタイムゾーン明示（JST） | 2h | Core | §5.2 |
| TSK-REV-005 | robots.txt パースの ReDoS 対策 | 1h | Core | §4.3 |
| TSK-REV-006 | isValidUrl の共通化 | 1h | Core | §6.1 |
| TSK-REV-007 | Settings API の zod バリデーション導入 | 2h | Core | §6.2 |
| TSK-REV-008 | cron-handler の dynamic → static import | 0.5h | Core | §5.3 |
| TSK-REV-009 | scraper の Source.config 型ガード | 1.5h | Core | §6.3 |
| TSK-REV-010 | nodemailer transporter のシングルトン化 | 1h | Core | §5.4 |
| TSK-REV-011 | リトライ回数の統一とコメント | 0.5h | Core | §6.4 |
| TSK-REV-012 | Vitest カバレッジ設定の追加 | 0.5h | Setup | §7.3 |
| TSK-REV-013 | テスト修正・ドキュメント更新 | 2h | Testing/Doc | 全体 |

**受け入れ基準・詳細**: `docs/TASK_PLAN_CODE_REVIEW.md` 参照。上記一覧は TASK_PLAN および CODE_REVIEW と整合済み（2026-02-03 確認）。

---

## 📋 コードレビュー未対応分タスク（TSK-REV-014～022）

**参照:** docs/REQUIREMENTS.md §2.10, docs/CODE_REVIEW.md §6–7, docs/REQUIREMENTS_REVIEW_REV014_022.md

| ID | タイトル | 時間 | カテゴリ | 要件参照 |
|----|----------|------|----------|----------|
| TSK-REV-014 | ビルド環境・File/Blob（Node 20+ または instrumentation） | 3～4h | Setup | REQ-REV-014（P0） |
| TSK-REV-015 | Next.js / @next/swc バージョン一致 | 0.5～1h | Setup | REQ-REV-015（P2） |
| TSK-REV-016 | JobRun errors の型安全な永続化（as object 解消） | 1～1.5h | Core | REQ-REV-016（P2） |
| TSK-REV-017 | シングルトン／キャッシュのテスト用リセット | 0.5h | Core | REQ-REV-017（P3） |
| TSK-REV-018 | デッドモックの削除 | 0.25h | Testing | REQ-REV-018（P3） |
| TSK-REV-019 | 未使用 import の削除 | 0.25h | Core | REQ-REV-019（P3） |
| TSK-REV-020 | 構造化ログ導入 | 3～4h | Core | REQ-REV-020（P3） |
| TSK-REV-021 | フロントエンドテスト追加 | 6h+ | Testing | REQ-REV-021（P3） |
| TSK-REV-022 | API ルート統合テスト追加 | 3～4h | Testing | REQ-REV-022（P3） |

### TSK-REV-014: ビルド環境・File/Blob（P0）

| 項目 | 内容 |
|------|------|
| **説明** | Node.js 18 等で `File` 未定義により `next build` が失敗する問題を解消する。Node.js 20+ への昇格、または `instrumentation.ts` で polyfill を適用する。採用方針に応じて package.json の engines や README を更新する。 |
| **見積時間** | 3～4h（Node 20+ なら 1～2h、instrumentation なら 3～4h） |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.1, REQ-REV-014 |
| **受け入れ基準** | (1) 対象ランタイムで `next build` が成功する。(2) `/api/cron/daily` 等の API ルートがビルド時にエラーにならない。(3) Node 20+ または instrumentation 採用の旨をドキュメントに記載する。 |

### TSK-REV-015: Next.js / @next/swc バージョン一致（P2）

| 項目 | 内容 |
|------|------|
| **説明** | `next build` 時の @next/swc バージョン不一致警告を解消する。package.json / lockfile で Next.js と @next/swc のバージョンを整合させる。 |
| **見積時間** | 0.5～1h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.2, REQ-REV-015 |
| **受け入れ基準** | (1) `next build` 実行時に @next/swc のバージョン不一致警告が出ない。(2) package.json / lockfile で Next.js と @next/swc のバージョンが整合している。 |

### TSK-REV-016: JobRun errors の型安全な永続化（P2）

| 項目 | 内容 |
|------|------|
| **説明** | `src/lib/cron-handler.ts` 内で JobRun.errors に書き込む 5 箇所の `as object` を排除し、Prisma.InputJsonValue または専用ヘルパー（例: toJsonErrors）で型安全に変換する。 |
| **見積時間** | 1～1.5h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.3, REQ-REV-016 |
| **受け入れ基準** | (1) cron-handler 内で JobRun.errors に書き込む箇所で未チェックの `as object` を使用していない。(2) Prisma.InputJsonValue または専用ヘルパーで型安全に変換している。(3) 既存の cron-handler テストが通る。 |

### TSK-REV-017: シングルトン／キャッシュのテスト用リセット（P3）

| 項目 | 内容 |
|------|------|
| **説明** | `src/lib/email-sender.ts` の cachedTransporter をテスト間でクリアするため、テスト用のリセット関数（例: _resetTransporter）をエクスポートする。本番では未使用でよい。 |
| **見積時間** | 0.5h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.4, REQ-REV-017 |
| **受け入れ基準** | (1) テスト用のリセット関数がエクスポートされている、または同等の手段でテスト間の状態をクリアできる。(2) 既存の email-sender テストが通る。 |

### TSK-REV-018: デッドモックの削除（P3）

| 項目 | 内容 |
|------|------|
| **説明** | `src/lib/__tests__/cron-handler.test.ts` 内で使用されていない findFirst のモック定義を削除する。実際に使用されているのは findUnique。 |
| **見積時間** | 0.25h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.5, REQ-REV-018 |
| **受け入れ基準** | (1) cron-handler テスト内で findFirst 等の未使用モックが削除されている。(2) 全テストがパスする。 |

### TSK-REV-019: 未使用 import の削除（P3）

| 項目 | 内容 |
|------|------|
| **説明** | `src/lib/email-sender.ts` から未使用の EmptySendBehavior の import を削除する。 |
| **見積時間** | 0.25h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §6.6, REQ-REV-019 |
| **受け入れ基準** | (1) email-sender 等、指摘されたファイルから未使用 import（例: EmptySendBehavior）が削除されている。(2) ビルド・テストが通る。 |

### TSK-REV-020: 構造化ログ導入（P3）

| 項目 | 内容 |
|------|------|
| **説明** | console.log/console.error の代わりに構造化ログ（例: pino）を導入し、重要なエラー・イベントにレベル・メッセージ・コンテキストを付与する。REQ-NFR-004 と矛盾しない範囲で実施する。 |
| **見積時間** | 3～4h |
| **依存関係** | なし（Phase 5 でまとめて実施する方針も可） |
| **設計参照** | CODE_REVIEW §7（旧6.5）, REQ-REV-020 |
| **受け入れ基準** | (1) 重要なエラー・イベントが構造化ログ（レベル・メッセージ・コンテキスト）で出力される。(2) 既存の REQ-NFR-004 と矛盾しない。 |

### TSK-REV-021: フロントエンドテスト追加（P3）

| 項目 | 内容 |
|------|------|
| **説明** | クリティカルな UI フロー（例: ソース一覧表示、設定保存）に @testing-library/react によるテストを追加する。Phase 4 完了後にスコープを定義して実施する方針も可。 |
| **見積時間** | 6h+ |
| **依存関係** | Phase 4 Web UI の実装（スコープによる） |
| **設計参照** | CODE_REVIEW §7.1, REQ-REV-021 |
| **受け入れ基準** | (1) 主要画面またはクリティカルフローに @testing-library/react 等によるテストが存在する。(2) 既存テストが通る。 |

### TSK-REV-022: API ルート統合テスト追加（P3）

| 項目 | 内容 |
|------|------|
| **説明** | settings 等の API ルートに対し、不正 body・認証欠如等のエッジケースをカバーする統合テストを追加する。 |
| **見積時間** | 3～4h |
| **依存関係** | なし |
| **設計参照** | CODE_REVIEW §7.2, REQ-REV-022 |
| **受け入れ基準** | (1) 少なくとも settings 等の API で不正 body・認証欠如等の統合テストが存在する。(2) 既存テストが通る。 |

---

## 📋 Phase 2: 要約機能タスク

### TSK-SUM-001: Anthropic SDK セットアップ

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-001 |
| **タイトル** | Anthropic SDK セットアップと環境変数設定 |
| **説明** | `@anthropic-ai/sdk` パッケージをインストールし、環境変数 `ANTHROPIC_API_KEY` の設定を確認する。 |
| **見積時間** | 1時間 |
| **依存関係** | なし |
| **設計参照** | SDD 4.2 (Summarizer Service), REQ-SUM-001 |
| **受け入れ基準** | - `@anthropic-ai/sdk` がインストールされている<br>- `.env` に `ANTHROPIC_API_KEY` が設定されている<br>- SDKのインポートが成功する |

### TSK-SUM-002: Summarizer Service 基本実装

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-002 |
| **タイトル** | Summarizer Service 基本実装（単一記事要約） |
| **説明** | `src/lib/summarizer.ts` を作成し、Claude APIを使用して単一記事の要約を生成する機能を実装する。プロンプトは「生産技術×デジタル関連の技術記事を300字以内で要約」とする。 |
| **見積時間** | 4時間 |
| **依存関係** | TSK-SUM-001 |
| **設計参照** | SDD 4.2 (Summarizer Service), REQ-SUM-001, REQ-SUM-002 |
| **受け入れ基準** | - `summarizeArticle(articleId: string)` 関数が実装されている<br>- Claude APIを呼び出して要約を生成できる<br>- 要約結果をArticleレコードに保存できる<br>- エラーハンドリングが実装されている |

### TSK-SUM-003: リトライロジック実装

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-003 |
| **タイトル** | 要約リトライロジック（指数バックオフ） |
| **説明** | 要約失敗時に最大3回までリトライし、指数バックオフ（1s, 2s, 4s）で実行する機能を実装する。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-SUM-002 |
| **設計参照** | SDD 4.2 (リトライロジック), REQ-SUM-003 |
| **受け入れ基準** | - 要約失敗時に自動的にリトライされる<br>- リトライ間隔が指数バックオフ（1s, 2s, 4s）で実行される<br>- 3回失敗後はsummaryをnullのまま、JobRun.errorsに記録される<br>- リトライ回数がログに記録される |

### TSK-SUM-004: 並列/バッチ要約処理実装

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-004 |
| **タイトル** | 並列/バッチ要約処理実装 |
| **説明** | 複数記事の要約を並列またはバッチで処理する機能を実装する。`p-limit`を使用して最大5並列で処理する。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-SUM-002 |
| **設計参照** | SDD 4.2 (並列/バッチ処理), REQ-SUM-004 |
| **受け入れ基準** | - 複数記事の要約が並列で処理される<br>- 最大5並列の制限が機能している<br>- 並列処理の進捗がログに記録される<br>- 一部失敗時も他の記事の要約が継続される |

### TSK-SUM-005: Cron Handler 要約統合

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-005 |
| **タイトル** | Cron Handler に要約機能を統合 |
| **説明** | `src/lib/cron-handler.ts` の `runDailyJob()` 関数に要約処理を追加する。収集完了後、新規記事またはsummary=nullの記事に対して要約を実行する。 |
| **見積時間** | 4時間 |
| **依存関係** | TSK-SUM-002, TSK-SUM-004 |
| **設計参照** | SDD 4.2 (Cron Handler フロー), REQ-SUM-001 |
| **受け入れ基準** | - 収集完了後に要約処理が自動実行される<br>- summary=nullの記事のみが要約対象になる<br>- 要約成功数がJobRun.articlesSummarizedに記録される<br>- 要約失敗がJobRun.errorsに記録される |

### TSK-SUM-006: コスト管理統合（月次上限チェック）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-006 |
| **タイトル** | コスト管理統合（月次上限チェック） |
| **説明** | 要約処理前に月次コスト上限をチェックし、上限到達時は要約をスキップする機能を実装する。Metricsテーブルから当月のコスト累計を計算する。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-SUM-005 |
| **設計参照** | SDD 4.2 (Cron Handler 5-a), REQ-COT-002 |
| **受け入れ基準** | - 要約処理前に月次コスト上限をチェックする<br>- 上限到達時は要約をスキップし、ログに記録する<br>- 警告閾値（80%）到達時に通知メールを送信する（Phase 3で実装）<br>- コスト計算が正確である |

### TSK-SUM-007: API使用量メトリクス記録

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-007 |
| **タイトル** | Claude API使用量メトリクス記録 |
| **説明** | 要約処理時にClaude APIの使用量（入力トークン、出力トークン、コストUSD）をMetricsテーブルに記録する機能を実装する。 |
| **見積時間** | 2時間 |
| **依存関係** | TSK-SUM-005 |
| **設計参照** | SDD 5.3 (Metric model), REQ-COT-001, REQ-MET-001 |
| **受け入れ基準** | - 各要約処理でAPI使用量がMetricsテーブルに記録される<br>- metricTypeが "api_tokens_input", "api_tokens_output", "api_cost_usd" で記録される<br>- runIdがJobRunと紐づいている<br>- コスト計算が正確である |

### TSK-SUM-008: 要約機能のユニットテスト

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-008 |
| **タイトル** | 要約機能のユニットテスト作成 |
| **説明** | Summarizer Serviceのユニットテストを作成する。モックを使用してClaude API呼び出しをテストする。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-SUM-002, TSK-SUM-003 |
| **設計参照** | REQ-SUM-001〜004 |
| **受け入れ基準** | - 要約成功のテストケースが通過する<br>- リトライロジックのテストケースが通過する<br>- 並列処理のテストケースが通過する<br>- エラーハンドリングのテストケースが通過する |

### TSK-SUM-009: 要約機能の統合テスト

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SUM-009 |
| **タイトル** | 要約機能の統合テスト（Cron Handler統合） |
| **説明** | Cron Handlerと要約機能の統合テストを作成する。実際のジョブ実行フローをテストする。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-SUM-005, TSK-SUM-008 |
| **設計参照** | SDD 4.2 (Cron Handler フロー) |
| **受け入れ基準** | - ジョブ実行時に要約が自動実行される<br>- 要約成功数がJobRunに記録される<br>- 要約失敗がJobRun.errorsに記録される<br>- コスト管理が機能している |

---

## 📋 Phase 2.5: Settings API タスク

### TSK-SET-001: Settings API エンドポイント実装（GET）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SET-001 |
| **タイトル** | Settings API GET エンドポイント実装 |
| **説明** | `src/app/api/settings/route.ts` を作成し、GET /api/settings エンドポイントを実装する。シングルトンパターンでSettingsレコードを取得する。 |
| **見積時間** | 2時間 |
| **依存関係** | なし（Prisma Schemaは既存） |
| **設計参照** | SDD 9.5, REQ-SET-001, REQ-SET-004 |
| **受け入れ基準** | - GET /api/settings が200 OKを返す<br>- レスポンスに dailySendTime, recipientEmail, emptySendBehavior, costLimitMonthly, costWarningRatio が含まれる<br>- Settingsレコードが存在しない場合はデフォルト値を返す |

### TSK-SET-002: Settings API エンドポイント実装（PUT）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-SET-002 |
| **タイトル** | Settings API PUT エンドポイント実装（バリデーション含む） |
| **説明** | PUT /api/settings エンドポイントを実装する。バリデーション（dailySendTime: HH:mm形式、recipientEmail: メール形式、emptySendBehavior: enum、costLimitMonthly: 正の数、costWarningRatio: 0〜1）を含む。 |
| **見積時間** | 4時間 |
| **依存関係** | TSK-SET-001 |
| **設計参照** | SDD 9.5, REQ-SET-002, REQ-SET-003 |
| **受け入れ基準** | - PUT /api/settings がバリデーションを実行する<br>- バリデーションエラー時は400 Bad Requestを返す<br>- 正常時はSettingsレコードをupsertして200 OKを返す<br>- シングルトンパターンで1件のみ管理される |

---

## 📋 Phase 3: 配信機能タスク

### TSK-EML-001: Gmail送信ライブラリセットアップ

| 項目 | 内容 |
|------|------|
| **ID** | TSK-EML-001 |
| **タイトル** | Gmail送信ライブラリセットアップ（nodemailer） |
| **説明** | `nodemailer` パッケージをインストールし、Gmail SMTP設定を実装する。環境変数 `GMAIL_USER`, `GMAIL_APP_PASSWORD` を設定する。 |
| **見積時間** | 2時間 |
| **依存関係** | なし |
| **設計参照** | SDD 4.2 (Email Sender Service), REQ-EML-002 |
| **受け入れ基準** | - `nodemailer` がインストールされている<br>- `.env` に `GMAIL_USER`, `GMAIL_APP_PASSWORD` が設定されている<br>- Gmail SMTP接続が成功する |

### TSK-EML-002: Email Sender Service 基本実装

| 項目 | 内容 |
|------|------|
| **ID** | TSK-EML-002 |
| **タイトル** | Email Sender Service 基本実装（単一メール送信） |
| **説明** | `src/lib/email-sender.ts` を作成し、Gmailを使用してメールを送信する機能を実装する。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-EML-001 |
| **設計参照** | SDD 4.2 (Email Sender Service), REQ-EML-002 |
| **受け入れ基準** | - `sendEmail(to: string, subject: string, html: string)` 関数が実装されている<br>- Gmail SMTPでメール送信が成功する<br>- エラーハンドリングが実装されている |

### TSK-EML-003: 日次メール本文生成機能

| 項目 | 内容 |
|------|------|
| **ID** | TSK-EML-003 |
| **タイトル** | 日次メール本文生成機能（複数記事を含む） |
| **説明** | ジョブ実行で収集・要約された記事を1通のメールにまとめる機能を実装する。各記事にタイトル、要約、URLを含める。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-EML-002 |
| **設計参照** | SDD 4.2 (Email Sender Service), REQ-EML-001, REQ-EML-003 |
| **受け入れ基準** | - 複数記事を1通のメールにまとめられる<br>- 各記事にタイトル、要約、URLが含まれる<br>- HTML形式でメール本文が生成される<br>- 0件時は空のメール本文が生成される |

### TSK-EML-004: 0件時設定対応

| 項目 | 内容 |
|------|------|
| **ID** | TSK-EML-004 |
| **タイトル** | 0件時設定対応（emptySendBehavior） |
| **説明** | Settings.emptySendBehaviorに応じて、0件時はメール送信をスキップまたは「新規記事なし」通知メールを送信する機能を実装する。 |
| **見積時間** | 2時間 |
| **依存関係** | TSK-EML-003, TSK-SET-002 |
| **設計参照** | SDD 4.2 (Email Sender Service), REQ-EML-004 |
| **受け入れ基準** | - emptySendBehavior="skip" の場合はメール送信をスキップする<br>- emptySendBehavior="sendNotification" の場合は通知メールを送信する<br>- Settings APIから設定を取得できる |

### TSK-EML-005: メール送信リトライロジック

| 項目 | 内容 |
|------|------|
| **ID** | TSK-EML-005 |
| **タイトル** | メール送信リトライロジック（指数バックオフ） |
| **説明** | メール送信失敗時に最大3回までリトライし、指数バックオフ（1s, 2s, 4s）で実行する機能を実装する。 |
| **見積時間** | 2時間 |
| **依存関係** | TSK-EML-002 |
| **設計参照** | SDD 4.2 (Email Sender Service), REQ-EML-005 |
| **受け入れ基準** | - メール送信失敗時に自動的にリトライされる<br>- リトライ間隔が指数バックオフ（1s, 2s, 4s）で実行される<br>- 3回失敗後はJobRun.errorsに記録される<br>- リトライ回数がログに記録される |

### TSK-EML-006: 失敗通知メール機能

| 項目 | 内容 |
|------|------|
| **ID** | TSK-EML-006 |
| **タイトル** | 失敗通知メール機能（ジョブ失敗時） |
| **説明** | ジョブ実行時に1件以上の失敗（ソース到達不可、要約失敗、メール送信失敗）がある場合、失敗詳細を含む通知メールを送信する機能を実装する。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-EML-002 |
| **設計参照** | SDD 4.2 (Cron Handler フロー), REQ-EML-006 |
| **受け入れ基準** | - ジョブ実行時に失敗がある場合、通知メールが送信される<br>- 失敗詳細（sourceUrl, articleUrl, errorType, errorMessage）がメールに含まれる<br>- Settings.recipientEmailに送信される |

### TSK-EML-007: Cron Handler 配信統合

| 項目 | 内容 |
|------|------|
| **ID** | TSK-EML-007 |
| **タイトル** | Cron Handler に配信機能を統合 |
| **説明** | `src/lib/cron-handler.ts` の `runDailyJob()` 関数に配信処理を追加する。要約完了後、新規記事がある場合はメール送信を実行する。 |
| **見積時間** | 4時間 |
| **依存関係** | TSK-EML-003, TSK-EML-004, TSK-EML-005 |
| **設計参照** | SDD 4.2 (Cron Handler フロー), REQ-EML-001 |
| **受け入れ基準** | - 要約完了後に配信処理が自動実行される<br>- 新規記事がある場合はメール送信される<br>- 0件時はemptySendBehaviorに応じて処理される<br>- 失敗時は通知メールが送信される |

---

## 📋 Phase 4: Web UI タスク

### TSK-UI-001: ソース設定画面（一覧・追加）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-001 |
| **タイトル** | ソース設定画面（一覧表示・追加フォーム） |
| **説明** | `/sources` ページを作成し、ソース一覧表示と追加フォームを実装する。Shadcn/UIコンポーネントを使用する。 |
| **見積時間** | 4時間 |
| **依存関係** | なし（APIは既存） |
| **設計参照** | SDD 3.1 (Web UI Container), REQ-UI-001, REQ-UI-004 |
| **受け入れ基準** | - ソース一覧が表示される<br>- ソース追加フォームが機能する<br>- API呼び出しが成功する<br>- エラーハンドリングが実装されている |

### TSK-UI-002: ソース設定画面（編集・削除）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-002 |
| **タイトル** | ソース設定画面（編集・削除機能） |
| **説明** | ソース編集フォームと削除機能を実装する。モーダルまたはダイアログを使用する。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-UI-001 |
| **設計参照** | SDD 3.1 (Web UI Container), REQ-UI-002, REQ-UI-003 |
| **受け入れ基準** | - ソース編集フォームが機能する<br>- ソース削除が機能する<br>- 確認ダイアログが表示される<br>- API呼び出しが成功する |

### TSK-UI-003: 配信設定画面

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-003 |
| **タイトル** | 配信設定画面（Settings API使用） |
| **説明** | `/settings` ページを作成し、配信設定（dailySendTime, recipientEmail, emptySendBehavior, costLimitMonthly, costWarningRatio）を編集できる画面を実装する。 |
| **見積時間** | 4時間 |
| **依存関係** | TSK-SET-002 |
| **設計参照** | SDD 3.1 (Web UI Container), REQ-UI-005〜007 |
| **受け入れ基準** | - 設定フォームが表示される<br>- 設定値の取得・更新が機能する<br>- バリデーションが機能する<br>- API呼び出しが成功する |

### TSK-UI-004: 記事一覧画面（基本表示）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-004 |
| **タイトル** | 記事一覧画面（基本表示・ページネーション） |
| **説明** | `/articles` ページを作成し、記事一覧を表示する機能を実装する。ページネーションを含む。 |
| **見積時間** | 3時間 |
| **依存関係** | なし（APIは既存） |
| **設計参照** | SDD 3.1 (Web UI Container), REQ-UI-008 |
| **受け入れ基準** | - 記事一覧が表示される<br>- ページネーションが機能する<br>- タイトル、要約、収集日、ソースが表示される<br>- API呼び出しが成功する |

### TSK-UI-005: 記事検索機能

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-005 |
| **タイトル** | 記事検索機能（キーワード検索） |
| **説明** | 記事一覧画面にキーワード検索機能を追加する。タイトル・要約で検索する。 |
| **見積時間** | 2時間 |
| **依存関係** | TSK-UI-004 |
| **設計参照** | SDD 3.1 (Web UI Container), REQ-UI-009 |
| **受け入れ基準** | - キーワード検索が機能する<br>- タイトル・要約で検索できる<br>- 検索結果が正しく表示される<br>- API呼び出しが成功する |

### TSK-UI-006: 記事日付フィルタ機能

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-006 |
| **タイトル** | 記事日付フィルタ機能 |
| **説明** | 記事一覧画面に日付範囲フィルタ機能を追加する。dateFrom, dateToでフィルタする。 |
| **見積時間** | 2時間 |
| **依存関係** | TSK-UI-004 |
| **設計参照** | SDD 3.1 (Web UI Container), REQ-UI-010 |
| **受け入れ基準** | - 日付範囲フィルタが機能する<br>- dateFrom, dateToでフィルタできる<br>- フィルタ結果が正しく表示される<br>- API呼び出しが成功する |

### TSK-UI-007: 記事詳細画面

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-007 |
| **タイトル** | 記事詳細画面（全文表示・元URLリンク） |
| **説明** | `/articles/[id]` ページを作成し、記事の全文を表示する機能を実装する。元URLへのリンクを含む。 |
| **見積時間** | 3時間 |
| **依存関係** | なし（APIは既存） |
| **設計参照** | SDD 3.1 (Web UI Container), REQ-UI-011 |
| **受け入れ基準** | - 記事詳細が表示される<br>- 全文（rawContent）が表示される<br>- 元URLへのリンクが機能する<br>- API呼び出しが成功する |

### TSK-UI-008: ナビゲーション・レイアウト

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-008 |
| **タイトル** | ナビゲーション・レイアウト実装 |
| **説明** | 共通レイアウトとナビゲーションメニューを実装する。ソース設定、配信設定、記事一覧へのリンクを含む。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-UI-001, TSK-UI-003, TSK-UI-004 |
| **設計参照** | SDD 3.1 (Web UI Container) |
| **受け入れ基準** | - 共通レイアウトが実装されている<br>- ナビゲーションメニューが機能する<br>- 各ページへのリンクが機能する<br>- レスポンシブデザインが実装されている |

### TSK-UI-009: Web UI統合テスト

| 項目 | 内容 |
|------|------|
| **ID** | TSK-UI-009 |
| **タイトル** | Web UI統合テスト |
| **説明** | Web UIの統合テストを作成する。主要なユーザーフローをテストする。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-UI-001〜008 |
| **設計参照** | REQ-UI-001〜011 |
| **受け入れ基準** | - ソース追加・編集・削除のフローがテストできる<br>- 設定更新のフローがテストできる<br>- 記事閲覧・検索・フィルタのフローがテストできる<br>- エラーハンドリングがテストできる |

---

## 📋 Phase 5: 運用強化タスク（将来実装）

### TSK-MET-001: メトリクス参照API実装

| 項目 | 内容 |
|------|------|
| **ID** | TSK-MET-001 |
| **タイトル** | メトリクス参照API実装（GET /api/metrics） |
| **説明** | メトリクスを参照するAPIエンドポイントを実装する。runId, metricType, limitでフィルタできる。 |
| **見積時間** | 3時間 |
| **依存関係** | TSK-SUM-007 |
| **設計参照** | SDD 9.6, REQ-MET-002 |
| **受け入れ基準** | - GET /api/metrics が実装されている<br>- runId, metricType, limitでフィルタできる<br>- メトリクスが正しく返される |

### TSK-MET-002: コスト管理機能（警告メール）

| 項目 | 内容 |
|------|------|
| **ID** | TSK-MET-002 |
| **タイトル** | コスト管理機能（警告閾値到達時の通知メール） |
| **説明** | 月次コストが警告閾値（80%）に到達した場合、通知メールを送信する機能を実装する。 |
| **見積時間** | 2時間 |
| **依存関係** | TSK-SUM-006, TSK-EML-002 |
| **設計参照** | SDD 4.2 (Cron Handler 5-a), REQ-COT-003 |
| **受け入れ基準** | - 警告閾値到達時に通知メールが送信される<br>- コスト計算が正確である<br>- Settings.costWarningRatioが使用される |

---

## 📊 タスク依存関係グラフ

```
コードレビュー対応
TSK-REV-001 ～ TSK-REV-012（並行可能） → TSK-REV-013

Phase 2: 要約
TSK-SUM-001 → TSK-SUM-002 → TSK-SUM-003
                      ↓
                 TSK-SUM-004
                      ↓
                 TSK-SUM-005 → TSK-SUM-006
                      ↓           ↓
                 TSK-SUM-007   TSK-SUM-008
                      ↓           ↓
                      └─────→ TSK-SUM-009

Phase 2.5: Settings API
TSK-SET-001 → TSK-SET-002

Phase 3: 配信
TSK-EML-001 → TSK-EML-002 → TSK-EML-003 → TSK-EML-004
                      ↓           ↓
                 TSK-EML-005   TSK-EML-006
                      ↓           ↓
                      └─────→ TSK-EML-007
                              (TSK-SET-002依存)

Phase 4: Web UI
TSK-UI-001 → TSK-UI-002
TSK-SET-002 → TSK-UI-003
TSK-UI-004 → TSK-UI-005 → TSK-UI-006
TSK-UI-007
TSK-UI-001, TSK-UI-003, TSK-UI-004 → TSK-UI-008
TSK-UI-001〜008 → TSK-UI-009
```

---

## 🎯 優先度マトリクス

| 優先度 | タスク | 理由 |
|--------|--------|------|
| **P0 (Critical)** | TSK-REV-001〜003（セキュリティ・データ整合性）, TSK-SUM-001〜005, TSK-SET-001〜002, TSK-EML-001〜007 | コードレビューP0、Phase 2, 2.5, 3のコア機能 |
| **P1 (High)** | TSK-REV-004〜013, TSK-SUM-006〜009, TSK-UI-001〜009 | コードレビューP1/P2、コスト管理、Web UI |
| **P2 (Medium)** | TSK-MET-001〜002 | 運用強化（Phase 5） |

---

## 📝 注意事項

1. **Settings APIの実装タイミング**: Phase 3（配信）でSettingsが必要なため、Phase 2と並行して実装することを推奨（Phase 2.5として実装）。

2. **テスト戦略**: 各タスクでユニットテストを作成し、統合テストはSprint最終日に実施する。

3. **バッファ時間**: 各Sprintに6時間のバッファを確保し、レビュー・統合テスト・バグ修正に充てる。

4. **環境変数**: Phase 2開始前に `ANTHROPIC_API_KEY` が設定されていることを確認する。Phase 3開始前に `GMAIL_USER`, `GMAIL_APP_PASSWORD` を設定する。

---

## 📚 参照ドキュメント（タスク関連）

| ドキュメント | 用途 |
|-------------|------|
| **docs/TASKS.md**（本ファイル） | タスク一括管理・残タスク・スプリント・優先度 |
| docs/REQUIREMENTS.md（v1.4） | 本番要件 SoT（REQ-SCR, SUM, EML, UI, SET 等） |
| docs/TASK_PLAN_CODE_REVIEW.md | コードレビュー対応の詳細・受け入れ基準・日別配分 |
| docs/SDD_TASK_DECOMPOSITION_CODE_REVIEW.md | コードレビュー対応の分解・スコープ方針 |
| docs/REQUIREMENTS_REVIEW_CODE_REVIEW.md | コードレビュー対応の要件（REQ-REV-xxx） |
| docs/PROJECT_STATUS.md | フェーズ別進捗・完了済み一覧 |
| docs/CODE_REVIEW.md | レビュー指摘・改善優先度 |
| docs/REQUIREMENTS_AND_TASKS_AUDIT.md | 要件・タスク総点検レポート |

---

**最終更新:** 2026-02-03  
**次回更新予定:** Sprint完了時、またはタスク変更発生時
