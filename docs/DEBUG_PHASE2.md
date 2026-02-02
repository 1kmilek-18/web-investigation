# Phase 2 要約機能 デバッグガイド

**作成日:** 2026-02-02  
**対象:** Phase 2 要約機能のエラー調査・修正

---

## 発見された問題

### 問題1: `articlesSummarized` がレスポンスに含まれていない

**症状:**
- ジョブ実行結果に `articlesSummarized` フィールドが含まれていない
- スクリプトで「要約記事数: 未取得」と表示される

**原因:**
- `RunDailyJobResult` 型に `articlesSummarized` が含まれていなかった
- APIレスポンスにも `articlesSummarized` が含まれていなかった

**修正内容:**
- `src/lib/cron-handler.ts`: `RunDailyJobResult` 型に `articlesSummarized` を追加
- `src/app/api/jobs/manual/route.ts`: APIレスポンスに `articlesSummarized` を追加

### 問題2: ログ出力が不足している

**症状:**
- 要約処理の実行状況がログで確認できない
- エラーの原因を特定しにくい

**修正内容:**
- コスト管理チェックのログを追加
- 要約対象記事の検索結果をログ出力
- 要約処理の開始・完了・エラーをログ出力

---

## デバッグ手順

### 1. 開発サーバーのログを確認

```bash
# 開発サーバーを起動
npm run dev

# 別ターミナルでジョブを実行
node scripts/verify-summarization.mjs
```

**確認すべきログ:**
- `[runDailyJob] Checking cost limits...`
- `[runDailyJob] Cost check result: allowed=...`
- `[runDailyJob] Searching for articles with summary=null...`
- `[runDailyJob] Found X articles to summarize`
- `[runDailyJob] Starting summarization for X articles...`
- `[summarizeArticles] Starting summarization for X articles...`
- `[summarizeArticles] Successfully summarized article ...`
- `[runDailyJob] Summarization completed: X/Y articles summarized successfully`

### 2. よくあるエラーと対処法

#### エラー: "Cost limit reached"

**原因:** コスト上限に達している

**対処:**
```bash
# Settingsテーブルを確認（Prisma Studio）
npm run db:studio

# costLimitMonthly を null に設定するか、上限を上げる
```

#### エラー: "No articles to summarize"

**原因:** `summary=null` の記事が存在しない

**対処:**
```bash
# 記事の状態を確認
curl http://localhost:3000/api/articles | jq '.articles[] | {id, title, summary}'

# summary=nullの記事を作成
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/test-'$(date +%s)'",
    "title": "テスト記事",
    "rawContent": "テスト内容",
    "summary": null
  }'
```

#### エラー: Claude API呼び出し失敗

**原因:**
- `ANTHROPIC_API_KEY` が無効
- APIレート制限に達している
- ネットワークエラー

**対処:**
```bash
# APIキーを確認
echo $ANTHROPIC_API_KEY

# ログでエラー詳細を確認
# [summarizeSingleArticle] Failed to summarize article ... のログを確認
```

### 3. データベースの状態を確認

```bash
# Prisma Studioで確認
npm run db:studio
```

**確認項目:**
- `Article` テーブル: `summary` フィールドが `null` の記事があるか
- `JobRun` テーブル: 最新のジョブ実行結果を確認
  - `articlesCollected`: 収集記事数
  - `articlesSummarized`: 要約記事数
  - `errors`: エラー情報
- `Metric` テーブル: API使用量が記録されているか
  - `metricType: "api_tokens_input"`
  - `metricType: "api_tokens_output"`
  - `metricType: "api_cost_usd"`
- `Settings` テーブル: コスト設定を確認
  - `costLimitMonthly`: 月次コスト上限（nullの場合は上限なし）
  - `costWarningRatio`: 警告閾値（デフォルト0.8）

---

## 修正後の動作確認

### ステップ1: ビルド確認

```bash
npm run build
```

### ステップ2: 開発サーバー起動

```bash
npm run dev
```

### ステップ3: 動作確認スクリプト実行

```bash
node scripts/verify-summarization.mjs
```

### ステップ4: ログ確認

開発サーバーのコンソール出力で以下を確認:

1. ✅ コスト管理チェックが実行されている
2. ✅ 要約対象記事が検索されている
3. ✅ 要約処理が開始されている
4. ✅ 要約が成功している（またはエラーが記録されている）

### ステップ5: 結果確認

```bash
# 記事の要約を確認
ARTICLE_ID="<記事ID>"
curl http://localhost:3000/api/articles/$ARTICLE_ID | jq '.summary'

# ジョブ実行結果を確認
# スクリプトの出力で articlesSummarized が表示されることを確認
```

---

## トラブルシューティング

### 要約が生成されない場合

1. **ログを確認**
   - 開発サーバーのコンソール出力を確認
   - `[summarizeArticles]` で始まるログがあるか確認

2. **記事の状態を確認**
   ```bash
   curl http://localhost:3000/api/articles | jq '.articles[] | select(.summary == null)'
   ```

3. **コスト設定を確認**
   ```bash
   # Prisma Studioで Settings テーブルを確認
   npm run db:studio
   ```

4. **Claude APIキーを確認**
   ```bash
   # .env ファイルを確認
   cat .env | grep ANTHROPIC_API_KEY
   ```

### エラーが発生する場合

1. **エラーログを確認**
   - 開発サーバーのコンソール出力でエラーメッセージを確認
   - `[runDailyJob]` または `[summarizeArticles]` で始まるエラーログを確認

2. **JobRun.errors を確認**
   ```bash
   # Prisma Studioで JobRun テーブルを開く
   npm run db:studio
   # → 最新の JobRun レコードの errors フィールドを確認
   ```

3. **ネットワークエラーの場合**
   - Claude APIへの接続が可能か確認
   - ファイアウォールやプロキシの設定を確認

---

## 修正ファイル一覧

1. `src/lib/cron-handler.ts`
   - `RunDailyJobResult` 型に `articlesSummarized` を追加
   - ログ出力を追加（コスト管理、要約処理）

2. `src/app/api/jobs/manual/route.ts`
   - APIレスポンスに `articlesSummarized` を追加

---

**最終更新:** 2026-02-02
