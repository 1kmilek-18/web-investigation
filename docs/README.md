# Web Investigation ドキュメント

**最終更新:** 2026-02-03  
**目的:** ドキュメントのエントリーポイント。要件・設計・進捗・運用手順を一覧し、ばらばらにならないようにする。

---

## 📚 ドキュメント一覧

| カテゴリ | ドキュメント | 説明 |
|----------|--------------|------|
| **要求** | [REQUIREMENTS.md](./REQUIREMENTS.md) | 要求定義書（EARS形式） |
| **設計** | [SDD.md](./SDD.md) | 設計書（C4モデル） |
| **進捗** | [STATUS.md](./STATUS.md) | プロジェクト状況・次のアクション（単一ソース） |
| **タスク** | [TASKS.md](./TASKS.md) | タスク分解・Sprint計画 |
| **運用手順** | [operations/](./operations/) | セットアップ・動作確認・トラブルシューティング |
| **レビュー** | [PROJECT_REVIEW.md](./PROJECT_REVIEW.md) | プロジェクトレビュー |
| **計画** | [DOCUMENTATION_CONSOLIDATION_PLAN.md](./DOCUMENTATION_CONSOLIDATION_PLAN.md) | ドキュメント整理計画 |
| **アーカイブ** | [archive/](./archive/) | 過去のレビュー・重複解消済みドキュメント |

---

## 🔗 トレーサビリティ

- **要件 → 設計:** REQUIREMENTS.md の要件ID と SDD.md のトレーサビリティマトリクスで対応
- **設計 → タスク:** SDD.md のコンポーネントと TASKS.md のタスクID で対応
- **進捗:** STATUS.md が PROJECT_STATUS / NEXT_TASKS を統合した単一ソース

---

## 📁 運用手順（operations/）

| ファイル | 内容 |
|----------|------|
| [setup/environment.md](./operations/setup/environment.md) | 環境変数・セットアップ |
| [setup/quick-start.md](./operations/setup/quick-start.md) | クイックスタート |
| [verify/phase1.md](./operations/verify/phase1.md) | Phase 1 動作確認 |
| [verify/phase2.md](./operations/verify/phase2.md) | Phase 2 動作確認 |
| [troubleshooting/logs.md](./operations/troubleshooting/logs.md) | ログ確認 |
| [troubleshooting/server.md](./operations/troubleshooting/server.md) | サーバー管理・再起動 |

---

## ✅ 運用ルール（ばらばらにしないため）

1. **新規ドキュメント**は上記いずれかのカテゴリに配置し、本 README に追記する
2. **進捗・次のアクション**は STATUS.md にのみ記載（NEXT_TASKS は廃止）
3. **運用手順**は operations/ に集約（ENV_SETUP, QUICK_START, VERIFY*, CHECK_* は operations を参照）
4. **過去版・レビュー専用**は archive/ に移動し、本 README からは「アーカイブ」として参照のみ

---

## 🔌 Musubix MCP

ドキュメント構造は Musubix MCP のナレッジグラフに登録済み（要件・設計・タスク・ドキュメント構造パターン）。`sdd_query_knowledge` で「documentation structure」「requirements」「design」「tasks」を検索すると一貫した配置ルールを参照できる。

---

**参照:** DOCUMENTATION_CONSOLIDATION_PLAN.md, PROJECT_REVIEW.md Section 7
