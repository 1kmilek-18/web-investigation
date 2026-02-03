# 要件・タスク 総点検レポート

**点検日**: 2026-02-03  
**対象**: 要件（REQ-xxx）・タスク（TSK-xxx）の一貫性、参照関係、重複・欠落

---

## 1. 総合サマリー

| 観点 | 状態 | 備考 |
|------|------|------|
| **要件IDの一貫性** | ✅ 問題なし | REQUIREMENTS.md 内で REQ-xxx の重複・欠番なし |
| **タスクIDの一貫性** | ✅ 問題なし | TASKS.md 内で TSK-xxx の重複・欠番なし |
| **ドキュメント間のバージョン表記** | ⚠️ 不整合あり | 下記「2. 参照・バージョン不整合」で修正済み |
| **要件とタスクの対応** | △ 要整理 | REQ→TSK の対応は TASKS 各タスクの「設計参照」で言及。REQ-REV は別ドキュメントで管理 |
| **削除済みファイルの参照** | ✅ なし | REMAINING_TASKS.md 削除後、他ファイルに参照なし |
| **REQ-UI の番号飛び** | ⚠️ 仕様 | REQ-UI-012 が 2.6 節にあり、2.7 で UI-008～011。意図的な分類のため番号順は不連続 |

---

## 2. 要件（REQ）の整理

### 2.1 要件の SoT（Single Source of Truth）

| 種別 | SoT ドキュメント | ID プレフィックス | 備考 |
|------|------------------|-------------------|------|
| **本番要件** | docs/REQUIREMENTS.md（v1.4） | REQ-SCR, REQ-SUM, REQ-EML, REQ-SCH, REQ-UI, REQ-SET, REQ-EXT, REQ-JOB, REQ-NFR, REQ-SEC, REQ-MET, REQ-COT | 製品の機能・非機能要件 |
| **コードレビュー対応要件** | docs/REQUIREMENTS_REVIEW_CODE_REVIEW.md | REQ-REV-001 ～ 013 | エンハンス要件（CODE_REVIEW 対応） |

本番要件とコードレビュー対応要件は **別系列** として扱い、REQUIREMENTS.md に「コードレビュー対応要件は REQUIREMENTS_REVIEW_CODE_REVIEW.md を参照」と明記することを推奨。

### 2.2 REQUIREMENTS.md 内の REQ-ID 一覧（重複・欠番チェック）

| プレフィックス | 範囲 | 件数 | 備考 |
|----------------|------|------|------|
| REQ-SCR | 001～010 | 10 | 収集 |
| REQ-SUM | 001～004 | 4 | 要約 |
| REQ-EML | 001～006 | 6 | 配信 |
| REQ-SCH | 001～004 | 4 | スケジュール |
| REQ-UI | 001～012（008～011 は別節） | 12 | UI。012 は 2.6、008～011 は 2.7 で定義 |
| REQ-SET | 001～004 | 4 | Settings API |
| REQ-EXT | 001～002 | 2 | 拡張性 |
| REQ-JOB | 001～002 | 2 | ジョブ制御 |
| REQ-NFR | 001～006 | 6 | 非機能（006 はコスト確認） |
| REQ-SEC | 001～006 | 6 | セキュリティ |
| REQ-MET | 001～002 | 2 | メトリクス |
| REQ-COT | 001～003 | 3 | コスト管理 |

**重複**: なし。**欠番**: 意図的な番号付け（UI の節ごと）のみ。

---

## 3. タスク（TSK）の整理

### 3.1 タスクの SoT

| SoT ドキュメント | 内容 |
|------------------|------|
| **docs/TASKS.md** | 全タスクの一括管理。Phase 2/2.5/3/4/5 + コードレビュー対応（TSK-REV-001～013）。残タスク・スプリント・優先度。 |
| docs/TASK_PLAN_CODE_REVIEW.md | コードレビュー対応タスクの詳細・受け入れ基準・日別配分。 |

### 3.2 TASKS.md 内の TSK-ID 一覧

| プレフィックス | 範囲 | 件数 | フェーズ |
|----------------|------|------|----------|
| TSK-SUM | 001～009 | 9 | Phase 2 要約 |
| TSK-SET | 001～002 | 2 | Phase 2.5 Settings |
| TSK-EML | 001～007 | 7 | Phase 3 配信 |
| TSK-UI | 001～009 | 9 | Phase 4 Web UI |
| TSK-MET | 001～002 | 2 | Phase 5 運用強化 |
| TSK-REV | 001～013 | 13 | コードレビュー対応 |

**重複・欠番**: なし。

### 3.3 タスクと要件の対応関係

- **Phase 2～5**: 各タスクの「設計参照」に REQ-xxx または SDD 節が記載されている。
- **TSK-REV-xxx**: 設計参照は CODE_REVIEW §x.x。要件は REQ-REV-xxx（REQUIREMENTS_REVIEW_CODE_REVIEW.md）で定義。

---

## 4. 参照・バージョン不整合（修正推奨）

以下の不整合を **2026-02-03 に修正済み** とする。

| ファイル | 箇所 | 修正前 | 修正後 |
|----------|------|--------|--------|
| docs/SDD.md | 冒頭「参照」 | REQUIREMENTS.md v1.3 | v1.4 |
| docs/SDD.md | 末尾参照一覧 | REQUIREMENTS.md v1.2 | v1.4 |
| docs/PROJECT_STATUS.md | 参照ドキュメント表 | REQUIREMENTS.md v1.2 | v1.4 |
| docs/REQUIREMENTS_REVIEW.md | レビューバージョン | 1.3 | 1.4（要件定義書 v1.4 を対象） |
| docs/NEXT_TASKS.md | 参照・参照一覧 | REQUIREMENTS.md v1.2 | v1.4 |
| docs/REQUIREMENTS.md | — | — | 「関連ドキュメント」セクション追加（TASKS, REQ-REV, 監査の参照） |
| docs/TASKS.md | 参照ドキュメント | — | REQUIREMENTS.md（v1.4）、REQUIREMENTS_AND_TASKS_AUDIT.md を追加 |

今後、REQUIREMENTS を参照する場合は **v1.4** に統一すること。

---

## 5. ドキュメント役割一覧（要件・タスク関連）

| ドキュメント | 役割 | 主な ID |
|-------------|------|---------|
| **docs/REQUIREMENTS.md** | 本番要件の SoT | REQ-SCR, SUM, EML, SCH, UI, SET, EXT, JOB, NFR, SEC, MET, COT |
| **docs/REQUIREMENTS_REVIEW.md** | 本番要件のレビュー結果（EARS・憲法条項） | — |
| **docs/REQUIREMENTS_REVIEW_CODE_REVIEW.md** | コードレビュー対応の要件・レビュー | REQ-REV-001～013 |
| **docs/TASKS.md** | タスク一括管理・残タスク・スプリント・優先度 | TSK-SUM, SET, EML, UI, MET, REV |
| **docs/TASK_PLAN_CODE_REVIEW.md** | コードレビュー対応タスクの詳細・受け入れ基準 | TSK-REV-001～013 |
| **docs/SDD_TASK_DECOMPOSITION_CODE_REVIEW.md** | コードレビュー対応のタスク分解・スコープ方針 | TSK-REV-xxx |
| **docs/CODE_REVIEW.md** | コードレビュー指摘・改善優先度 | §4.1 等 |
| **docs/PROJECT_STATUS.md** | フェーズ別進捗・完了状況 | — |
| **docs/SDD.md** | 設計・REQ とのトレーサビリティ | REQ-xxx ↔ コンポーネント |

---

## 6. 推奨アクション（実施済み or 今後の運用）

1. **バージョン表記の統一**: REQUIREMENTS.md を参照する場合は **v1.4** に統一（上記のとおり修正）。
2. **要件 SoT の明示**: REQUIREMENTS.md の末尾に「関連ドキュメント」を追加し、タスクは TASKS.md、コードレビュー対応要件は REQUIREMENTS_REVIEW_CODE_REVIEW.md と記載。
3. **TASKS.md の参照ドキュメント**: 既に「参照ドキュメント」セクションで REQUIREMENTS に触れていないため、必要なら「本番要件: docs/REQUIREMENTS.md」を 1 行追加可能。
4. **REQ-UI 番号**: REQ-UI-012 が 008～011 より前の節にあるのは仕様（2.6 配信設定と 2.7 記事の分類）。変更不要。
5. **今後の追加**: 新規 REQ は REQUIREMENTS.md に追記。新規タスクは TASKS.md に追記。コードレビュー系は REQ-REV / TSK-REV のまま別ドキュメントで管理。

---

**本レポートの更新**: 要件・タスクの構成を変更した場合に再点検し、本ファイルを更新すること。
