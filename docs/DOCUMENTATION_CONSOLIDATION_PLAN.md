# ドキュメント整理計画

**作成日:** 2026-02-02  
**参照:** docs/PROJECT_REVIEW.md Section 7  
**目的:** 15個のMarkdownファイルを統合し、単一の信頼できる情報源（Single Source of Truth）を確立

---

## 📊 現状分析

### 現状のドキュメント構造

```
docs/
├── CHECK_SERVER_LOGS.md          # 運用手順（ログ確認）
├── DEBUG_PHASE2.md                # デバッグ手順（Phase 2）
├── DESIGN_REVIEW.md               # 設計レビュー（アーカイブ対象）
├── ENV_SETUP.md                   # 環境設定手順
├── HOW_TO_CHECK_LOGS.md           # ログ確認手順（重複）
├── NEXT_TASKS.md                  # 次のタスク（PROJECT_STATUS.mdと重複）
├── PROJECT_STATUS.md              # プロジェクト状況（維持）
├── PROJECT_REVIEW.md              # プロジェクトレビュー（維持）
├── QUICK_START.md                 # クイックスタート
├── REQUIREMENTS.md                # 要求定義（維持）
├── REQUIREMENTS_REVIEW.md         # 要件レビュー（アーカイブ対象）
├── RESTART_SERVER.md              # サーバー再起動手順
├── SDD.md                         # 設計ドキュメント（維持）
├── TASKS.md                       # タスク分解書（維持）
├── VERIFY.md                      # 動作確認手順
└── VERIFY_PHASE2.md               # Phase 2動作確認手順
```

**問題点**:
- 情報の重複（`NEXT_TASKS.md`, `TASKS.md`, `PROJECT_STATUS.md`）
- 役割不明確（`CHECK_SERVER_LOGS.md`, `HOW_TO_CHECK_LOGS.md`）
- 更新漏れのリスク
- 新規参画者のオンボーディング困難

---

## 🎯 推奨構造

```
docs/
├── README.md                      # プロジェクト概要（エントリーポイント）- 新規作成
├── REQUIREMENTS.md               # 要求定義（EARS形式）- 維持
├── SDD.md                         # 設計書（C4モデル）- 維持
├── PROJECT_REVIEW.md             # プロジェクトレビュー - 維持
├── STATUS.md                      # 進捗状況（単一ソース）- PROJECT_STATUS.md統合
├── PHASE3_IMPLEMENTATION_PLAN.md  # Phase 3実装計画 - 新規作成
├── API.md                         # API仕様書（OpenAPI/Swagger検討）- 新規作成
└── OPERATIONS.md                 # 運用手順（統合版）- 新規作成
    ├── setup/                    # セットアップ手順
    │   ├── environment.md        # 環境変数設定
    │   └── quick-start.md        # クイックスタート
    ├── verify/                   # 動作確認手順
    │   ├── phase1.md            # Phase 1確認
    │   ├── phase2.md            # Phase 2確認
    │   └── phase3.md            # Phase 3確認（将来）
    └── troubleshooting/          # トラブルシューティング
        ├── logs.md              # ログ確認
        ├── debugging.md         # デバッグ手順
        └── server.md            # サーバー管理
└── archive/                      # 古いドキュメント移動
    ├── DESIGN_REVIEW.md
    ├── REQUIREMENTS_REVIEW.md
    ├── NEXT_TASKS.md
    └── TASKS.md（旧版）
```

---

## 📋 統合計画

### 1. STATUS.md の作成（優先度: 🔴 高）

**統合元**:
- `PROJECT_STATUS.md`
- `NEXT_TASKS.md`
- `TASKS.md`（進捗状況部分）

**内容**:
- フェーズ別進捗状況
- 要件別進捗状況
- 次のアクション
- 完了した作業履歴

**作業時間**: 2時間

---

### 2. OPERATIONS.md の作成（優先度: 🟡 中）

**統合元**:
- `ENV_SETUP.md`
- `QUICK_START.md`
- `VERIFY.md`
- `VERIFY_PHASE2.md`
- `CHECK_SERVER_LOGS.md`
- `HOW_TO_CHECK_LOGS.md`
- `DEBUG_PHASE2.md`
- `RESTART_SERVER.md`

**構造**:
```
# OPERATIONS.md

## 1. セットアップ
### 1.1 環境変数設定
### 1.2 クイックスタート

## 2. 動作確認
### 2.1 Phase 1: 基盤・収集
### 2.2 Phase 2: 要約
### 2.3 Phase 3: 配信（将来）

## 3. トラブルシューティング
### 3.1 ログ確認
### 3.2 デバッグ手順
### 3.3 サーバー管理
```

**作業時間**: 3時間

---

### 3. API.md の作成（優先度: 🟢 低）

**内容**:
- APIエンドポイント一覧
- リクエスト/レスポンス形式
- 認証方法
- エラーハンドリング

**作業時間**: 2時間

---

### 4. README.md の更新（優先度: 🔴 高）

**内容**:
- プロジェクト概要
- ドキュメント構造の説明
- クイックリンク

**作業時間**: 1時間

---

### 5. archive/ ディレクトリの作成（優先度: 🟢 低）

**移動対象**:
- `DESIGN_REVIEW.md`
- `REQUIREMENTS_REVIEW.md`
- `NEXT_TASKS.md`（STATUS.mdに統合後）

**作業時間**: 0.5時間

---

## 📅 実装スケジュール

| タスク | 優先度 | 見積時間 | 累計 |
|--------|--------|----------|------|
| STATUS.md作成 | 🔴 高 | 2時間 | 2時間 |
| OPERATIONS.md作成 | 🟡 中 | 3時間 | 5時間 |
| README.md更新 | 🔴 高 | 1時間 | 6時間 |
| API.md作成 | 🟢 低 | 2時間 | 8時間 |
| archive/作成 | 🟢 低 | 0.5時間 | 8.5時間 |
| **合計** | | **8.5時間（1-2営業日）** | |

---

## ✅ 受け入れ基準

- ✅ `STATUS.md` が単一の信頼できる情報源として機能する
- ✅ `OPERATIONS.md` にすべての運用手順が統合されている
- ✅ 古いドキュメントが `archive/` に移動されている
- ✅ `README.md` からすべてのドキュメントにアクセスできる
- ✅ ドキュメント間の重複が解消されている

---

## 📚 参照

- `docs/PROJECT_REVIEW.md` Section 7 - ドキュメント構造の改善提案
- `docs/REQUIREMENTS.md` v1.4 - 要求定義
- `docs/SDD.md` v1.1 - 設計ドキュメント

---

**最終更新:** 2026-02-03  
**実施状況:** 2026-02-03 に以下を実施。Musubix MCP でナレッジ登録済み（要件・設計・タスク・ドキュメント構造パターン）。

- ✅ docs/README.md 作成（エントリーポイント）
- ✅ docs/STATUS.md 作成（進捗・次のアクションの単一ソース）
- ✅ docs/operations/ 作成（setup / verify / troubleshooting 統合）
- ✅ docs/archive/ 作成（DESIGN_REVIEW, REQUIREMENTS_REVIEW, NEXT_TASKS を移動）
- ✅ Musubix MCP `sdd_update_knowledge` で登録: requirement (REQUIREMENTS.md), design (SDD.md), task (TASKS.md), pattern (doc-structure)
