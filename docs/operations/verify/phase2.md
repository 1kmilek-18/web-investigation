# Phase 2 動作確認

**統合元:** docs/VERIFY_PHASE2.md（存在する場合）, docs/VERIFY.md  
**最終更新:** 2026-02-03

---

## 前提

- Phase 1 確認済み
- `.env` に `ANTHROPIC_API_KEY`, `CRON_SECRET` 設定済み

## 確認手順

1. ソースを1件以上登録し、日次ジョブ（手動実行）で収集・要約が動くことを確認
2. `POST /api/jobs/manual`（Bearer CRON_SECRET）で手動実行
3. 記事に `summary` が付与されることを DB または API で確認

ログ確認は **operations/troubleshooting/logs.md** を参照。
