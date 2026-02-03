# 要件レビュー — コードレビュー対応（機能エンハンス）

**レビュー日**: 2026-02-03  
**対象**: docs/SDD_TASK_DECOMPOSITION_CODE_REVIEW.md（タスク分解を要件として評価）  
**参照**: docs/CODE_REVIEW.md, docs/REQUIREMENTS.md v1.4, 9憲法条項

---

# Part 1: 9憲法条項に基づく要件レビュー

## 1. サマリー評価

| 観点 | 評価 | コメント |
|------|------|----------|
| **Specification First** | △ | タスク中心で「要求」が CODE_REVIEW に暗黙のまま。REQ-REV-xxx として明文化されていない。 |
| **Design Before Code** | ○ | CODE_REVIEW が設計指針として参照され、タスクに設計参照が紐づいている。 |
| **Single Source of Truth** | △ | 要求の SoT が REQUIREMENTS.md と CODE_REVIEW に分散。エンハンス要件の SoT が未定義。 |
| **Traceability** | △ | TSK→CODE_REVIEW はあるが、REQ→TSK→実装の一貫したトレースが未整備。 |
| **Incremental Progress** | ○ | タスクが独立しており、P0→P1→P2→P3 の小さい単位で提供可能。 |
| **Decision Documentation** | △ | スコープイン/アウトの理由は記載あるが、ADR としては未記録。 |
| **Quality Gates** | ○ | 各タスクに受け入れ基準があり、スプリント完了時のチェックリストがある。 |
| **User-Centric** | △ | セキュリティ・保守性が中心で、ユーザー価値（信頼性・一貫動作）の明示が弱い。 |
| **Continuous Learning** | ○ | 見送り項目を「今後の検討」として記録しており、振り返りに使える。 |

**総合**: タスクレベルでは受け入れ基準が明確で実装しやすいが、要件としての形式（EARS・トレーサビリティ・非機能の明示）が不足している。以下で要件を詳細化し、レビュー指摘を整理する。

---

## 2. 強み

- **優先度の明示**: P0/P1/P2/P3 と採用・見送りがはっきりしており、スコープが読みやすい。
- **受け入れ基準**: 全タスクに「何を満たせば完了か」が書かれており、テスト可能性が高い。
- **依存関係**: タスク間の依存が少なく、並行実装しやすい。
- **設計参照**: 各タスクが CODE_REVIEW の該当節に紐づいており、設計との対応が取れている。
- **スプリント配分**: 5 日・26h の見積と日別配分があり、計画が具体化されている。

---

## 3. 指摘事項（重要度別）

### 3.1 High（要対応）

| ID | 指摘 | 該当憲法 | 推奨対応 |
|----|------|----------|----------|
| RV-H1 | エンハンスの「要求」が EARS や REQ-ID で明文化されていない。 | 1. Specification First, 4. Traceability | REQ-REV-xxx を定義し、REQUIREMENTS.md または本ドキュメント Part 2 に記載する。 |
| RV-H2 | 既存要件とのトレースがない（例: REQ-SEC-006 と XSS 対策、REQ-SET-004 と Settings 単一レコード）。 | 4. Traceability | 既存 REQ-xxx との対応表を追加する。 |
| RV-H3 | 非機能要件がタスク説明に埋もれている（例: セキュリティ・パフォーマンス・保守性）。 | 1. Specification First | セキュリティ／データ整合性／保守性を NFR として REQ-REV-NFR-xxx で明示する。 |

### 3.2 Medium（推奨対応）

| ID | 指摘 | 該当憲法 | 推奨対応 |
|----|------|----------|----------|
| RV-M1 | ユーザー価値が各エンハンスに書かれていない。 | 8. User-Centric | 各 REQ-REV に「ユーザー/システム価値」を 1 行で追記する。 |
| RV-M2 | バリデーションエラー時のレスポンス形式（400 body 構造）が要件として固定されていない。 | 2. Design Before Code | REQ-REV-007 で「400 + バリデーション詳細の形式」を明記する。 |
| RV-M3 | CRON_SECRET 未設定時の挙動（POST /api/articles を許可するか拒否するか）が未定義。 | 5. Incremental Progress | REQ-REV-002 で「CRON_SECRET 未設定時は POST を許可するか 401 とするか」を決めて記載する。 |
| RV-M4 | Settings の固定 ID 値（例: `singleton`）が要件・設計で一意に決まっていない。 | 2. Design Before Code | REQ-REV-003 で固定 ID の仕様を記載する。 |

### 3.3 Low（あればよい）

| ID | 指摘 | 該当憲法 | 推奨対応 |
|----|------|----------|----------|
| RV-L1 | リトライ「最大 N 回試行」の N が既存要件（REQ-SUM-003, REQ-EML-005）と一致するかが明示されていない。 | 4. Traceability | REQ-REV-011 で「既存 REQ の 3 回リトライと一致すること」を受け入れ基準に含める。 |
| RV-L2 | スコープ外項目を「将来要件」として REQ-BACKLOG のように管理すると追跡しやすい。 | 9. Continuous Learning | 見送り項目に REQ-BACKLOG-xxx を振り、優先度と理由を短く書く。 |

---

## 4. 推奨アクション

1. **REQ-REV-xxx の作成**: Part 2 の詳細要件を正式な「エンハンス要件」として採用し、REQUIREMENTS.md にセクション追加するか、本ドキュメントを要件 SoT の一部として参照する。
2. **既存 REQ との対応表**: REQ-SEC-006, REQ-SET-004, REQ-SCH-003 等と REQ-REV の対応を 1 表にまとめる。
3. **ADR の作成**: 「コードレビュー対応スコープの採用・見送り」を ADR として記録する（スコープイン/アウトの理由・日付）。
4. **CRON_SECRET 未設定時の仕様決定**: 運用方針に合わせて「未設定時は POST 許可」か「未設定時は 401」のいずれかを要件に明記する。
5. **Settings 固定 ID**: 値（例: `singleton`）と Prisma スキーマのデフォルトを要件・設計で一致させる。

---

## 5. 不足している要件の提案

| 提案ID | 内容 | 種別 |
|--------|------|------|
| RV-MISS-1 | メール本文に挿入する文字列は、HTML として解釈されないようエスケープすること。対象: 記事タイトル・要約・URL・エラーメッセージ。 | 機能（セキュリティ） |
| RV-MISS-2 | POST /api/articles は、CRON_SECRET が設定されている場合は Bearer トークンによる認証を必須とすること。 | 機能（セキュリティ） |
| RV-MISS-3 | Settings は常に 1 レコードで表現され、PUT によってレコード数が増加しないこと。 | 機能（データ整合性） |
| RV-MISS-4 | 日次ジョブの「日」の境界は JST 0:00 で一意に定義すること。 | 機能（正確性） |
| RV-MISS-5 | robots.txt の Disallow を正規表現に変換する際、ReDoS を招かないよう特殊文字をエスケープすること。 | 非機能（セキュリティ） |
| RV-MISS-6 | URL 検証関数は 1 箇所で定義し、複数 API で共有すること。 | 非機能（保守性） |
| RV-MISS-7 | PUT /api/settings のリクエスト body は zod スキーマで検証し、不正時は 400 と検証詳細を返すこと。 | 機能（品質） |
| RV-MISS-8 | リトライを行うコンポーネント間で「最大試行回数」の意味を統一し、ドキュメントと一致させること。 | 非機能（一貫性） |
| RV-MISS-9 | 単体テストのカバレッジを Vitest で計測可能にすること。 | 非機能（品質） |

これらは Part 2 の REQ-REV-xxx に反映している。

---

# Part 2: 機能エンハンスの詳細要件（REQ-REV-xxx）

以下は、コードレビュー対応を「要件」として整理したものである。EARS 形式を意識し、受け入れ基準・既存要件・タスクとのトレースを付与する。

---

## 2.1 セキュリティエンハンス

### REQ-REV-001: メールテンプレートの XSS 対策

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-001 |
| **パターン** | Ubiquitous |
| **要求** | The system shall escape HTML special characters (`&`, `<`, `>`, `"`, `'`) in all user- or external-data-derived strings before embedding them into email HTML templates (article title, summary, URL, and failure notification fields such as error type, source URL, article URL, message). |
| **ユーザー/システム価値** | メールクライアントでの XSS や意図しない HTML 解釈を防ぎ、配信の信頼性を保つ。 |
| **既存要件との対応** | REQ-SEC-006（サニタイズ）、REQ-EML-003（メールにタイトル・要約・URLを含む）の強化。 |
| **設計参照** | CODE_REVIEW §4.1 |
| **タスク** | TSK-REV-001 |
| **受け入れ基準** | (1) `escapeHtml()` が `&<>"'` をエスケープしている。(2) `generateEmailBody` で article.title, article.summary, article.url に適用されている。(3) `sendFailureNotificationEmail` で error 各フィールドに適用されている。(4) 既存の email-sender テストが通る。 |

---

### REQ-REV-002: POST /api/articles の認証

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-002 |
| **パターン** | Event-Driven |
| **要求** | When a client sends POST /api/articles, the system shall require Authorization: Bearer &lt;CRON_SECRET&gt; if CRON_SECRET is set; otherwise the system may allow or deny POST according to project policy (recommend: deny with 401 when secret is not set to avoid open insertion). |
| **ユーザー/システム価値** | 不正な記事の挿入を防ぎ、cron/jobs と認証ポリシーを揃える。 |
| **既存要件との対応** | REQ-SCH-003（cron の共有シークレット）の拡張。 |
| **設計参照** | CODE_REVIEW §4.2 |
| **タスク** | TSK-REV-002 |
| **受け入れ基準** | (1) CRON_SECRET 設定時、Bearer が一致しないと POST は 401 を返す。(2) GET /api/articles は認証不要のまま。(3) 呼び出し元（cron-handler / scraper 経由）が認証付きで POST するよう修正されている。(4) CRON_SECRET 未設定時の挙動が要件で定義され実装と一致している。 |

---

### REQ-REV-003: robots.txt パースの ReDoS 対策

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-003 |
| **パターン** | Ubiquitous |
| **要求** | When converting robots.txt Disallow paths to regular expressions, the system shall escape regex metacharacters so that malicious paths cannot cause ReDoS; only the wildcard `*` shall be interpreted as `.*`. |
| **ユーザー/システム価値** | 悪意ある robots.txt による DoS を防ぐ。 |
| **既存要件との対応** | REQ-SEC-005（robots.txt 尊重）の安全な実装。 |
| **設計参照** | CODE_REVIEW §4.3 |
| **タスク** | TSK-REV-005 |
| **受け入れ基準** | (1) `escapeRegExp` 相当で `.+?^${}()|[\]\\` をエスケープしている。(2) 既存の scraper テストが通る。 |

---

## 2.2 データ整合性・設計エンハンス

### REQ-REV-004: Settings シングルトン保証

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-004 |
| **パターン** | Ubiquitous |
| **要求** | The system shall represent application settings as exactly one record in the Settings table (singleton). PUT /api/settings shall update that single record (e.g. via upsert with a fixed id such as `singleton`) and shall not create additional records. |
| **ユーザー/システム価値** | 設定の一意性を保ち、取得ロジックの不安定さをなくす。 |
| **既存要件との対応** | REQ-SET-004（単一レコード管理）の実装保証。 |
| **設計参照** | CODE_REVIEW §5.1 |
| **タスク** | TSK-REV-003 |
| **受け入れ基準** | (1) GET/PUT が固定 ID で upsert している。(2) cron-handler, cost-manager が従来どおり動作する。(3) Prisma スキーマで Settings.id の扱いが要件と一致している。 |

---

### REQ-REV-005: 日次ジョブのタイムゾーン定義（JST）

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-005 |
| **パターン** | Ubiquitous |
| **要求** | The system shall define the boundary of "one day" for daily job and metrics aggregation as JST 00:00:00, independent of server timezone. |
| **ユーザー/システム価値** | 日本向けサービスとして日次集計の解釈を一意にし、デプロイ環境に依存しない。 |
| **既存要件との対応** | REQ-SCH-001（日次実行）、REQ-MET-xxx の集計基準。 |
| **設計参照** | CODE_REVIEW §5.2 |
| **タスク** | TSK-REV-004 |
| **受け入れ基準** | (1) 日次集計の境界が JST 0:00 で一意に決まる。(2) 既存の日次ジョブ・メトリクス集計のテストが通る。 |

---

## 2.3 保守性・一貫性エンハンス

### REQ-REV-006: URL 検証の共通化

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-006 |
| **パターン** | Ubiquitous |
| **要求** | The system shall define URL validation (e.g. isValidUrl) in a single shared module and use it from all API routes that accept or output URLs (e.g. /api/articles, /api/sources, /api/sources/[id]). |
| **ユーザー/システム価値** | 重複排除と挙動の一貫性、将来の HTTP(S) 限定などの拡張を一箇所で行いやすくする。 |
| **設計参照** | CODE_REVIEW §6.1 |
| **タスク** | TSK-REV-006 |
| **受け入れ基準** | (1) isValidUrl が 1 ファイルにのみ存在する。(2) 上記 3 API がその実装を参照している。(3) 挙動が従来と変わらない（既存テストまたは手動確認）。 |

---

### REQ-REV-007: Settings API のスキーマバリデーション

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-007 |
| **パターン** | Event-Driven |
| **要求** | When the client sends PUT /api/settings, the system shall validate the request body with a declarative schema (e.g. zod). Invalid payloads shall result in HTTP 400 with a structured validation error response (e.g. flattened field-level errors). Valid fields shall be dailySendTime (HH:mm), recipientEmail (email), emptySendBehavior (enum), costLimitMonthly (positive number or null), costWarningRatio (0–1). |
| **ユーザー/システム価値** | 型安全な設定更新と、フロントからのエラー表示のしやすさ。 |
| **既存要件との対応** | REQ-SET-002, REQ-SET-003 の実装方式の具体化。 |
| **設計参照** | CODE_REVIEW §6.2 |
| **タスク** | TSK-REV-007 |
| **受け入れ基準** | (1) 不正な body で 400 とバリデーション詳細が返る。(2) 正常系の PUT/GET が従来どおり動作する。(3) 400 レスポンスの形式が設計で定義されている。 |

---

### REQ-REV-008: 日次ジョブの静的 import

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-008 |
| **パターン** | Ubiquitous |
| **要求** | The daily job orchestrator shall import scraper, summarizer, and email-sender modules via static (top-level) imports rather than dynamic imports, so that tests can mock dependencies in a standard way. |
| **ユーザー/システム価値** | テスタビリティの向上と挙動の予測しやすさ。 |
| **設計参照** | CODE_REVIEW §5.3 |
| **タスク** | TSK-REV-008 |
| **受け入れ基準** | (1) scraper / summarizer / email-sender がファイル先頭で静的 import されている。(2) 既存の cron-handler テストが通る。 |

---

### REQ-REV-009: Source.config の型安全な利用

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-009 |
| **パターン** | Ubiquitous |
| **要求** | The system shall parse and validate Source.config (JSON) before use (e.g. listLinkSelector, articleUrlPattern) via a typed parser or type guard, and shall not rely on unchecked type assertions. |
| **ユーザー/システム価値** | ランタイムの不整合や誤ったプロパティ参照を防ぐ。 |
| **既存要件との対応** | REQ-EXT-002（ソースごとのオプション設定）の安全な実装。 |
| **設計参照** | CODE_REVIEW §6.3 |
| **タスク** | TSK-REV-009 |
| **受け入れ基準** | (1) config が unknown から安全にパースされ、listLinkSelector 等のみ使用している。(2) 既存の scraper テストが通る。 |

---

### REQ-REV-010: メール transporter の再利用

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-010 |
| **パターン** | Ubiquitous |
| **要求** | The system shall reuse a single nodemailer transporter instance per process (e.g. cached behind getTransporter()) instead of creating a new transporter for each send. |
| **ユーザー/システム価値** | 接続の再利用による軽いパフォーマンス・リソース改善。 |
| **設計参照** | CODE_REVIEW §5.4 |
| **タスク** | TSK-REV-010 |
| **受け入れ基準** | (1) 同一プロセス内で transporter が再利用されている。(2) 既存のメール送信テストが通る。 |

---

### REQ-REV-011: リトライ回数の統一

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-011 |
| **パターン** | Ubiquitous |
| **要求** | All components that perform retries (e.g. summarizer, email-sender) shall use a consistent interpretation of "max N retries" (e.g. total attempts = 1 + N or total attempts = N), documented in code and aligned with REQ-SUM-003 and REQ-EML-005. |
| **ユーザー/システム価値** | 運用時の期待と実装の一致、障害調査のしやすさ。 |
| **既存要件との対応** | REQ-SUM-003（要約リトライ 3 回）、REQ-EML-005（メールリトライ 3 回）。 |
| **設計参照** | CODE_REVIEW §6.4 |
| **タスク** | TSK-REV-011 |
| **受け入れ基準** | (1) 両方のリトライロジックの試行回数がドキュメントと一致している。(2) 既存テストが通る。(3) 既存要件の「3 回リトライ」と矛盾しない。 |

---

### REQ-REV-012: 単体テストカバレッジの計測

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-012 |
| **パターン** | Ubiquitous |
| **要求** | The system shall support generating unit test coverage reports (e.g. Vitest with provider v8, text and html reporters) for at least the lib layer (e.g. src/lib/**/*.ts), without breaking existing test runs. |
| **ユーザー/システム価値** | 品質の可視化とリグレッション防止のしやすさ。 |
| **設計参照** | CODE_REVIEW §7.3 |
| **タスク** | TSK-REV-012 |
| **受け入れ基準** | (1) `pnpm test -- --coverage`（または同等）でカバレッジが出力される。(2) 既存テストがそのまま実行できる。 |

---

### REQ-REV-013: エンハンス後の検証とドキュメント

| 項目 | 内容 |
|------|------|
| **ID** | REQ-REV-013 |
| **パターン** | Event-Driven |
| **要求** | When the code review enhancement tasks (TSK-REV-001 through TSK-REV-012) are completed, the system shall have all affected tests passing and the completion state documented (e.g. in PROJECT_STATUS or a "修正済み" section in CODE_REVIEW). |
| **ユーザー/システム価値** | 品質ゲートの通過と変更の追跡可能性。 |
| **設計参照** | 憲法 7. Quality Gates, CODE_REVIEW 全体 |
| **タスク** | TSK-REV-013 |
| **受け入れ基準** | (1) 全テストが通る。(2) 変更内容がドキュメントに反映されている。 |

---

## 2.4 トレーサビリティ一覧

| REQ-REV | 既存 REQ | CODE_REVIEW | TSK-REV |
|---------|----------|-------------|---------|
| REQ-REV-001 | REQ-SEC-006, REQ-EML-003 | §4.1 | TSK-REV-001 |
| REQ-REV-002 | REQ-SCH-003 | §4.2 | TSK-REV-002 |
| REQ-REV-003 | REQ-SEC-005 | §4.3 | TSK-REV-005 |
| REQ-REV-004 | REQ-SET-004 | §5.1 | TSK-REV-003 |
| REQ-REV-005 | REQ-SCH-001, REQ-MET | §5.2 | TSK-REV-004 |
| REQ-REV-006 | — | §6.1 | TSK-REV-006 |
| REQ-REV-007 | REQ-SET-002, REQ-SET-003 | §6.2 | TSK-REV-007 |
| REQ-REV-008 | — | §5.3 | TSK-REV-008 |
| REQ-REV-009 | REQ-EXT-002 | §6.3 | TSK-REV-009 |
| REQ-REV-010 | — | §5.4 | TSK-REV-010 |
| REQ-REV-011 | REQ-SUM-003, REQ-EML-005 | §6.4 | TSK-REV-011 |
| REQ-REV-012 | — | §7.3 | TSK-REV-012 |
| REQ-REV-013 | — | 全体 | TSK-REV-013 |

---

## 2.5 今回スコープ外（バックログ）

| 識別子 | 内容 | 理由 |
|--------|------|------|
| BACKLOG-REV-1 | 4.4 URL の直接 HTML 出力（HTTP(S) 限定の検証強化） | 工数・影響のため別タスクで検討 |
| BACKLOG-REV-2 | 表示側の JST 変換（UI タイムゾーン） | 5.2 は日次境界のみ対象のため |
| ~~BACKLOG-REV-3~~ | ~~cron-handler の errors 型強化~~ | **→ REQ-REV-016**（REQUIREMENTS.md §2.10）に昇格 |
| BACKLOG-REV-4 | 他 API への zod 一括導入 | settings のみ今回実施 |
| ~~BACKLOG-REV-5~~ | ~~構造化ログ（6.5）~~ | **→ REQ-REV-020**（REQUIREMENTS.md §2.10）に昇格 |
| ~~BACKLOG-REV-6~~ | ~~フロントエンドテスト追加（7.1）~~ | **→ REQ-REV-021**（REQUIREMENTS.md §2.10）に昇格 |
| ~~BACKLOG-REV-7~~ | ~~API ルート統合テスト拡充（7.2）~~ | **→ REQ-REV-022**（REQUIREMENTS.md §2.10）に昇格 |

---

## 2.6 未対応・新規検出分（REQ-REV-014～022）

コードレビューで**新たに検出された未対応項目**（CODE_REVIEW.md §6–7）は、**REQUIREMENTS.md §2.10** に EARS 形式で要件化し、影響度・対応可能性を付与している。

| REQ-REV | 内容 | 優先度 | 参照 |
|---------|------|--------|------|
| REQ-REV-014 | ビルド環境・File/Blob（Node 20+ または instrumentation） | P0 | CODE_REVIEW §6.1 |
| REQ-REV-015 | Next.js / @next/swc バージョン一致 | P2 | §6.2 |
| REQ-REV-016 | JobRun errors の型安全な永続化（as object 解消） | P2 | §6.3 |
| REQ-REV-017 | シングルトン／キャッシュのテスト用リセット | P3 | §6.4 |
| REQ-REV-018 | デッドモックの削除 | P3 | §6.5 |
| REQ-REV-019 | 未使用 import の削除 | P3 | §6.6 |
| REQ-REV-020 | 構造化ログ | P3 | §7（旧6.5） |
| REQ-REV-021 | フロントエンドテスト | P3 | §7.1 |
| REQ-REV-022 | API ルート統合テスト | P3 | §7.2 |

詳細な要求文・受け入れ基準・影響度・対応可能性は **docs/REQUIREMENTS.md §2.10** を参照すること。

---

以上。Part 1 を要件レビュー、Part 2 を機能エンハンスの詳細要件（REQ-REV-001～013 対応済み、REQ-REV-014～022 未対応）として利用できる。
