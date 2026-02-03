# Phase 1 動作確認

**統合元:** docs/VERIFY.md  
**最終更新:** 2026-02-03

---

## 前提

- Supabase マイグレーション適用済み
- `npm run dev` で開発サーバー起動済み

## 確認手順

1. **ヘルスチェック** — `curl -s http://localhost:3000/api/health` → `{"ok":true,...}`
2. **ソース一覧** — `curl -s http://localhost:3000/api/sources` → `[]` または一覧
3. **記事一覧** — `curl -s http://localhost:3000/api/articles` → 一覧

詳細は **docs/VERIFY.md** を参照。
