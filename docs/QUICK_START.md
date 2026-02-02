# Phase 2 要約機能 クイックスタート

**作成日:** 2026-02-02

---

## 🚀 動作確認の手順（3ステップ）

### ステップ1: 開発サーバーを起動

**ターミナル1**で以下を実行:

```bash
cd /home/kmilek/dev-env/web-investigation
npm run dev
```

**成功すると以下のように表示されます:**
```
   ▲ Next.js 15.5.11
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Starting...
 ✓ Ready in 2.5s
```

**このターミナルは開いたままにしておいてください**（ログがここに表示されます）

---

### ステップ2: 動作確認スクリプトを実行

**新しいターミナル（ターミナル2）**を開いて以下を実行:

```bash
cd /home/kmilek/dev-env/web-investigation
node scripts/verify-summarization.mjs
```

---

### ステップ3: ログを確認

**ターミナル1（開発サーバー）**に以下のようなログが表示されます:

#### ✅ 正常系の場合

```
[runDailyJob] Checking cost limits...
[runDailyJob] Cost check result: allowed=true, currentCost=0.1, limit=10
[runDailyJob] Searching for articles with summary=null...
[runDailyJob] Found 1 articles to summarize
[runDailyJob] Starting summarization for 1 articles...
[summarizeArticles] Starting summarization for 1 articles (max 5 concurrent)
[summarizeSingleArticle] Attempting to summarize article ... (attempt 1/4)
[summarizeArticles] Successfully summarized article ...
[summarizeArticles] Completed: 1/1 articles summarized successfully
[runDailyJob] Summarization completed: 1/1 articles summarized successfully
```

#### ⚠️ エラーが発生した場合

```
[summarizeSingleArticle] Attempt 1/4 failed for article ...: {
  message: "エラーメッセージ",
  name: "Error"
}
```

**エラーメッセージをコピーして、原因を特定します**

---

## 🔍 よくあるエラーと対処法

### エラー: "開発サーバーが起動していないようです"

**原因:** 開発サーバーが起動していない

**対処:**
1. **ターミナル1**で `npm run dev` を実行
2. 「Ready in X.Xs」と表示されるまで待つ
3. **ターミナル2**で再度 `node scripts/verify-summarization.mjs` を実行

---

### エラー: "ANTHROPIC_API_KEY が設定されていません"

**原因:** `.env` ファイルにAPIキーが設定されていない

**対処:**
```bash
# .env ファイルを確認
cat .env | grep ANTHROPIC_API_KEY

# 設定されていない場合は追加
echo "ANTHROPIC_API_KEY=your-api-key-here" >> .env

# 開発サーバーを再起動（Ctrl+Cで停止してから再起動）
npm run dev
```

---

### エラー: "API key not found" または "401 Unauthorized"

**原因:** APIキーが無効または間違っている

**対処:**
1. AnthropicのダッシュボードでAPIキーを確認
2. 新しいAPIキーを生成
3. `.env` ファイルを更新
4. 開発サーバーを再起動

---

### エラー: "Failed to generate summary after retries"

**原因:** Claude APIの呼び出しが4回連続で失敗

**対処:**
1. **ターミナル1（開発サーバー）**のログを確認
2. エラーメッセージの内容を確認
3. 上記のエラー対処法を参照

---

## 📋 チェックリスト

動作確認前に以下を確認:

- [ ] `.env` ファイルに `ANTHROPIC_API_KEY` が設定されている
- [ ] `.env` ファイルに `CRON_SECRET` が設定されている
- [ ] `.env` ファイルに `DATABASE_URL` が設定されている
- [ ] 開発サーバーが起動している（`npm run dev`）
- [ ] 開発サーバーが「Ready」状態になっている

---

## 🎯 成功の確認

動作確認が成功すると:

1. **ターミナル2（スクリプト）**に以下が表示される:
   ```
   ✅ 要約が生成されました！
   要約内容:
   ────────────────────────────────────────────────────────────────
   [要約テキスト]
   ────────────────────────────────────────────────────────────────
   ```

2. **ターミナル1（開発サーバー）**に以下が表示される:
   ```
   [summarizeArticles] Successfully summarized article ...
   [summarizeArticles] Completed: 1/1 articles summarized successfully
   ```

3. **ジョブ実行結果**に以下が含まれる:
   ```json
   {
     "articlesSummarized": 1,
     "articlesCollected": 0
   }
   ```

---

## 💡 ヒント

- **2つのターミナルを使う**: 1つは開発サーバー用、もう1つはスクリプト実行用
- **ログは開発サーバーのターミナルで確認**: エラーはここに表示されます
- **エラーが出たらログを確認**: エラーメッセージから原因を特定できます

---

**最終更新:** 2026-02-02
