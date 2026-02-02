# 開発サーバーのログ確認方法

**作成日:** 2026-02-02

---

## 🔍 重要なログの確認場所

### ターミナル1（開発サーバー）のログを確認

**開発サーバーを起動したターミナル**に、以下のようなログが表示されているはずです。

---

## 📋 確認すべきログ

### 1. 要約処理の開始ログ

```
[runDailyJob] Checking cost limits...
[runDailyJob] Cost check result: allowed=true, ...
[runDailyJob] Searching for articles with summary=null...
[runDailyJob] Found 3 articles to summarize
[runDailyJob] Starting summarization for 3 articles...
[summarizeArticles] Starting summarization for 3 articles (max 5 concurrent)
```

### 2. 各記事の要約試行ログ

**正常系:**
```
[summarizeSingleArticle] Attempting to summarize article cml4rispm0004wdyuzp4xwn06 (attempt 1/4)
[summarizeArticles] Successfully summarized article cml4rispm0004wdyuzp4xwn06 (...)
```

**異常系（エラーが発生した場合）:**
```
[summarizeSingleArticle] Attempting to summarize article cml4rispm0004wdyuzp4xwn06 (attempt 1/4)
[summarizeSingleArticle] Attempt 1/4 failed for article cml4rispm0004wdyuzp4xwn06: {
  message: "エラーメッセージ",
  name: "Error"
}
```

### 3. エラーの詳細ログ

```
[summarizeSingleArticle] Failed to summarize article ... after 4 attempts: {
  error: "エラーメッセージ",
  errorName: "Error",
  articleId: "...",
  ...
}
```

---

## 🚨 よくあるエラーパターン

### パターン1: APIキーエラー

**ログ例:**
```
[summarizeSingleArticle] ANTHROPIC_API_KEY is not set
```
または
```
Attempt 1/4 failed: { message: "API key not found", name: "Error" }
```

**原因:** `.env` ファイルに `ANTHROPIC_API_KEY` が設定されていない、または読み込まれていない

**対処:**
```bash
# .env ファイルを確認
cat .env | grep ANTHROPIC_API_KEY

# 設定されていない場合は追加
echo "ANTHROPIC_API_KEY=your-api-key" >> .env

# 開発サーバーを再起動（Ctrl+Cで停止してから再起動）
npm run dev
```

---

### パターン2: 認証エラー（401）

**ログ例:**
```
Attempt 1/4 failed: { message: "401 Unauthorized", name: "APIError" }
```

**原因:** APIキーが無効または間違っている

**対処:**
1. AnthropicのダッシュボードでAPIキーを確認
2. 新しいAPIキーを生成
3. `.env` ファイルを更新
4. 開発サーバーを再起動

---

### パターン3: レート制限エラー（429）

**ログ例:**
```
Attempt 1/4 failed: { message: "429 Too Many Requests", name: "APIError" }
```

**原因:** APIのレート制限に達している

**対処:**
- しばらく待ってから再実行
- Anthropicの利用制限を確認

---

### パターン4: ネットワークエラー

**ログ例:**
```
Attempt 1/4 failed: { message: "ECONNREFUSED", name: "Error" }
```
または
```
Attempt 1/4 failed: { message: "ETIMEDOUT", name: "Error" }
```

**原因:** ネットワーク接続の問題

**対処:**
- インターネット接続を確認
- プロキシ設定を確認

---

### パターン5: Prismaエラー（DB接続エラー）

**ログ例:**
```
PrismaClientInitializationError: Can't reach database server
```

**原因:** データベースに接続できない

**対処:**
```bash
# DATABASE_URLを確認
cat .env | grep DATABASE_URL

# Prisma Studioで接続確認
npm run db:studio
```

---

## 📝 ログのコピー方法

### 方法1: ターミナルから直接コピー

1. 開発サーバーを起動したターミナルを開く
2. ログを選択してコピー（マウスでドラッグ）
3. ここに貼り付け

### 方法2: ログをファイルに保存

```bash
# 開発サーバーを起動してログをファイルに保存
npm run dev 2>&1 | tee dev-server.log
```

別のターミナルでジョブを実行後、ログファイルを確認:

```bash
# 要約関連のログだけを抽出
grep -E "\[(summarize|runDailyJob)\]" dev-server.log

# エラーログだけを抽出
grep -i error dev-server.log
```

---

## 🎯 次のステップ

1. **開発サーバーのターミナル（ターミナル1）を開く**
2. **以下のログを探す:**
   - `[summarizeSingleArticle]` で始まるログ
   - `[summarizeArticles]` で始まるログ
   - `Error` や `Failed` が含まれるログ
3. **エラーメッセージをコピーして共有**

エラーメッセージが分かれば、原因を特定して修正できます。

---

**最終更新:** 2026-02-02
