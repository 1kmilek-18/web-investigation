# 開発サーバーのログ確認方法

**作成日:** 2026-02-02  
**対象:** Phase 2 要約機能のデバッグ

---

## 方法1: ターミナルで開発サーバーを起動（推奨）

### ステップ1: 開発サーバーを起動

```bash
# プロジェクトディレクトリに移動
cd /home/kmilek/dev-env/web-investigation

# 開発サーバーを起動
npm run dev
```

**出力例:**
```
   ▲ Next.js 15.5.11
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Starting...
 ✓ Ready in 2.5s
```

### ステップ2: 別のターミナルでジョブを実行

開発サーバーを起動したターミナルはそのままにしておき、**新しいターミナルウィンドウ**を開いて以下を実行:

```bash
# プロジェクトディレクトリに移動
cd /home/kmilek/dev-env/web-investigation

# 動作確認スクリプトを実行
node scripts/verify-summarization.mjs
```

### ステップ3: 開発サーバーのログを確認

**開発サーバーを起動したターミナル**に、以下のようなログが出力されます:

**正常系のログ例:**
```
[runDailyJob] Checking cost limits...
[runDailyJob] Cost check result: allowed=true, currentCost=0.1, limit=10
[runDailyJob] Searching for articles with summary=null...
[runDailyJob] Found 1 articles to summarize
[runDailyJob] Starting summarization for 1 articles...
[summarizeArticles] Starting summarization for 1 articles (max 5 concurrent)
[summarizeSingleArticle] Attempting to summarize article cml4r7acz0002wdyut9lto1oq (attempt 1/4)
[summarizeArticles] Successfully summarized article cml4r7acz0002wdyut9lto1oq (https://example.com/test-article-1770011593124)
[summarizeArticles] Completed: 1/1 articles summarized successfully
[runDailyJob] Summarization completed: 1/1 articles summarized successfully
```

**異常系のログ例（エラーが発生した場合）:**
```
[runDailyJob] Checking cost limits...
[runDailyJob] Cost check result: allowed=true, currentCost=0.1, limit=10
[runDailyJob] Searching for articles with summary=null...
[runDailyJob] Found 1 articles to summarize
[runDailyJob] Starting summarization for 1 articles...
[summarizeArticles] Starting summarization for 1 articles (max 5 concurrent)
[summarizeSingleArticle] Attempting to summarize article cml4r7acz0002wdyut9lto1oq (attempt 1/4)
[summarizeSingleArticle] Attempt 1/4 failed for article cml4r7acz0002wdyut9lto1oq: {
  message: "API key not found",
  name: "Error",
  ...
}
[summarizeSingleArticle] Retry attempt 1/3 for article cml4r7acz0002wdyut9lto1oq after 1000ms delay
[summarizeSingleArticle] Attempt 2/4 failed for article cml4r7acz0002wdyut9lto1oq: {
  message: "API key not found",
  name: "Error",
  ...
}
...
[summarizeSingleArticle] Failed to summarize article cml4r7acz0002wdyut9lto1oq after 4 attempts: {
  error: "API key not found",
  errorName: "Error",
  articleId: "cml4r7acz0002wdyut9lto1oq",
  ...
}
[summarizeArticles] Failed to summarize article cml4r7acz0002wdyut9lto1oq (https://example.com/test-article-1770011593124): Failed to generate summary after retries
[summarizeArticles] Completed: 0/1 articles summarized successfully
[runDailyJob] Summarization completed: 0/1 articles summarized successfully
```

---

## 方法2: ログをファイルに保存

### ステップ1: 開発サーバーを起動してログをファイルに保存

```bash
# 開発サーバーを起動してログをファイルに保存
npm run dev 2>&1 | tee dev-server.log
```

### ステップ2: 別のターミナルでジョブを実行

```bash
node scripts/verify-summarization.mjs
```

### ステップ3: ログファイルを確認

```bash
# ログファイルを確認
cat dev-server.log

# または、要約関連のログだけを抽出
grep -E "\[(summarize|runDailyJob)\]" dev-server.log

# エラーログだけを抽出
grep -E "ERROR|Error|error|Failed|failed" dev-server.log
```

---

## 方法3: ブラウザの開発者ツールで確認（Next.jsの場合）

Next.jsの開発サーバーは、ブラウザのコンソールにも一部のログが出力される場合があります。

1. ブラウザで `http://localhost:3000` を開く
2. 開発者ツールを開く（F12 または 右クリック → 検証）
3. Consoleタブを開く
4. ジョブを実行してログを確認

**注意:** APIルートのログは主にサーバー側（ターミナル）に出力されます。

---

## 確認すべきログのポイント

### ✅ 正常系の確認ポイント

1. **コスト管理チェック**
   ```
   [runDailyJob] Checking cost limits...
   [runDailyJob] Cost check result: allowed=true, ...
   ```

2. **要約対象記事の検索**
   ```
   [runDailyJob] Searching for articles with summary=null...
   [runDailyJob] Found X articles to summarize
   ```

3. **要約処理の開始**
   ```
   [runDailyJob] Starting summarization for X articles...
   [summarizeArticles] Starting summarization for X articles...
   ```

4. **要約の成功**
   ```
   [summarizeSingleArticle] Attempting to summarize article ... (attempt 1/4)
   [summarizeArticles] Successfully summarized article ...
   ```

5. **要約処理の完了**
   ```
   [summarizeArticles] Completed: X/Y articles summarized successfully
   [runDailyJob] Summarization completed: X/Y articles summarized successfully
   ```

### ⚠️ 異常系の確認ポイント

1. **APIキーエラー**
   ```
   [summarizeSingleArticle] ANTHROPIC_API_KEY is not set
   ```
   または
   ```
   Attempt X/4 failed: { message: "API key not found", ... }
   ```

2. **認証エラー**
   ```
   Attempt X/4 failed: { message: "401 Unauthorized", ... }
   ```

3. **レート制限エラー**
   ```
   Attempt X/4 failed: { message: "429 Too Many Requests", ... }
   ```

4. **ネットワークエラー**
   ```
   Attempt X/4 failed: { message: "ECONNREFUSED", ... }
   ```
   または
   ```
   Attempt X/4 failed: { message: "ETIMEDOUT", ... }
   ```

5. **要約失敗**
   ```
   [summarizeSingleArticle] Failed to summarize article ... after 4 attempts
   [summarizeArticles] Failed to summarize article ...: Failed to generate summary after retries
   ```

---

## トラブルシューティング

### ログが出力されない場合

1. **開発サーバーが起動しているか確認**
   ```bash
   # 別のターミナルで確認
   curl http://localhost:3000/api/health
   ```

2. **環境変数が読み込まれているか確認**
   ```bash
   # .env ファイルが存在するか確認
   ls -la .env
   
   # 環境変数が設定されているか確認（開発サーバー起動時に表示される）
   # 出力に "Environments: .env" と表示されるはず
   ```

3. **ビルドが最新か確認**
   ```bash
   npm run build
   ```

### ログが多すぎる場合

特定のログだけを確認したい場合:

```bash
# 要約関連のログだけを抽出
npm run dev 2>&1 | grep -E "\[(summarize|runDailyJob)\]"

# エラーログだけを抽出
npm run dev 2>&1 | grep -i error
```

---

## 実践的な確認手順

### 1. 開発サーバーを起動

```bash
cd /home/kmilek/dev-env/web-investigation
npm run dev
```

**このターミナルは開いたままにしておく**

### 2. 新しいターミナルでジョブを実行

```bash
cd /home/kmilek/dev-env/web-investigation
node scripts/verify-summarization.mjs
```

### 3. 開発サーバーのターミナルでログを確認

開発サーバーを起動したターミナルに、リアルタイムでログが表示されます。

**特に確認すべきログ:**
- `[summarizeSingleArticle]` で始まるログ
- `[summarizeArticles]` で始まるログ
- `[runDailyJob]` で始まるログ
- エラーメッセージ（`Error`, `Failed`, `error` などが含まれる）

### 4. エラーが発生した場合

エラーメッセージをコピーして、以下を確認:
- エラーの種類（APIキーエラー、認証エラー、ネットワークエラーなど）
- エラーメッセージの内容
- どの段階でエラーが発生したか（リトライの何回目か）

---

**最終更新:** 2026-02-02
