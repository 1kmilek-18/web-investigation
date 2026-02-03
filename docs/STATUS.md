# Web Investigation 進捗状況（単一ソース）

**更新日:** 2026-02-03  
**バージョン:** 1.0  
**参照:** docs/REQUIREMENTS.md, docs/SDD.md, docs/TASKS.md

進捗・次のアクションは **このファイルのみ** を更新する。NEXT_TASKS.md は廃止し archive に移動済み。

---

## 📊 プロジェクト概要

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | Web Investigation |
| **目的** | 生産技術×デジタル関連の技術情報をWebスクレイピングで収集し、LLMで要約してメールで配信するシステム |
| **技術スタック** | Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/UI, Prisma, PostgreSQL (Supabase), Claude API, Gmail |
| **開発フェーズ** | Phase 1・2・2.5 完了、Phase 3 以降未着手 |

---

## ✅ フェーズ別進捗

| フェーズ | 状態 | 進捗率 |
|---------|------|--------|
| **Phase 1: 基盤・収集** | ✅ 完了 | 100% |
| **Phase 2: 要約** | ✅ 完了 | 100% |
| **Phase 2.5: Settings API** | ✅ 完了 | 100% |
| **Phase 3: 配信** | ⏳ 要確認（email-sender 実装あり） | — |
| **Phase 4: Web UI** | ⏳ 未着手 | 0% |
| **Phase 5: 運用強化** | ⏳ 未着手 | 0% |
| **コードレビュー対応（初回）** | ✅ 完了 | TSK-REV-001～013 |
| **コードレビュー未対応分** | ⏳ 未着手 | TSK-REV-014～022 |

---

## 📋 次のアクション（単一ソース）

1. **Phase 3 の確定** — 実装確認 or TSK-EML-001～007（0.5～2日）
2. **コードレビュー未対応分** — TSK-REV-014～022（約14h、P0即時推奨）
3. **Phase 4: Web UI** — TSK-UI-001～009（約27h）
4. **Phase 5: 運用強化** — TSK-MET-001, 002（約5h）

詳細なタスク分解・Sprint計画は **docs/TASKS.md** を参照。

---

## 📈 要件別進捗

| カテゴリ | 要件数 | 実装済み | 進捗率 |
|----------|--------|----------|--------|
| 収集（REQ-SCR-*） | 10 | 10 | 100% |
| 要約（REQ-SUM-*） | 4 | 4 | 100% |
| 配信（REQ-EML-*） | 6 | 0 | 0% |
| スケジュール・Web UI・拡張・ジョブ・セキュリティ等 | 他 | 他 | 67% 全体 |

---

## 📚 参照

- **詳細なプロジェクト状況（履歴含む）:** docs/PROJECT_STATUS.md（参照用；次アクションは本 STATUS.md 優先）
- **タスク分解・Sprint:** docs/TASKS.md
- **要求定義:** docs/REQUIREMENTS.md
- **設計:** docs/SDD.md
