# Phase 2 要約機能 動作確認手順

**作成日:** 2026-02-02  
**対象:** Phase 2 要約機能の動作確認

---

## 前提条件

1. **環境変数の設定**
   - `.env` ファイルに以下が設定されていること:
     - `ANTHROPIC_API_KEY`: Claude APIの認証キー
     - `CRON_SECRET`: ジョブ実行用の認証トークン
     - `DATABASE_URL`: Supabase接続文字列

2. **データベースの準備**
   - Prismaマイグレーションが適用されていること
   - `npm run db:migrate` または `npm run db:push` を実行済み

3. **開発サーバーの起動**
   - `npm run dev` で開発サーバーを起動

---

## 動作確認方法

### 方法1: 自動化スクリプトを使用（推奨）

```bash
# 開発サーバーを別ターミナルで起動
npm run dev

# 別のターミナルで動作確認スクリプトを実行
node scripts/verify-summarization.mjs
```

スクリプトは以下を自動実行します:
1. 環境変数の確認
2. 開発サーバーの起動確認
3. テスト用記事の作成（summary=null）
4. 手動ジョブの実行（要約処理を含む）
5. 要約結果の確認
6. メトリクスの確認

### 方法2: 手動でAPIを呼び出す

#### ステップ1: テスト用記事を作成

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/test-article-'$(date +%s)'",
    "title": "テスト記事: 生産技術とデジタル化",
    "rawContent": "生産技術の分野では、デジタル化が急速に進んでいます。IoT、AI、ロボティクスなどの技術を活用することで、製造プロセスの効率化や品質向上が実現されています。",
    "summary": null,
    "collectedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

レスポンスから記事IDを取得します。

#### ステップ2: 手動ジョブを実行

```bash
curl -X POST http://localhost:3000/api/jobs/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  | jq '.'
```

#### ステップ3: 要約結果を確認（15秒待機後）

```bash
# 記事IDを指定
ARTICLE_ID="<上記で取得した記事ID>"

curl http://localhost:3000/api/articles/$ARTICLE_ID | jq '.summary'
```

---

## 確認ポイント

### ✅ 正常系の確認

1. **記事の作成**
   - `POST /api/articles` が成功する
   - レスポンスに記事IDが含まれる

2. **ジョブの実行**
   - `POST /api/jobs/manual` が成功する
   - レスポンスに `jobRunId` が含まれる
   - `status: "completed"` が返される

3. **要約の生成**
   - 記事の `summary` フィールドに要約テキストが設定される
   - 要約は300字以内である
   - 要約内容が記事の内容に関連している

4. **メトリクスの記録**
   - `JobRun.articlesSummarized` が1以上になる
   - `Metric` テーブルに以下が記録される:
     - `metricType: "api_tokens_input"`
     - `metricType: "api_tokens_output"`
     - `metricType: "api_cost_usd"`

### ⚠️ 異常系の確認

1. **リトライロジック**
   - Claude APIが失敗した場合、最大3回までリトライされる
   - リトライ間隔は指数バックオフ（1s, 2s, 4s）

2. **エラーハンドリング**
   - 要約失敗時は `summary` が `null` のまま
   - `JobRun.errors` にエラーが記録される

3. **コスト管理**
   - コスト上限到達時は要約がスキップされる
   - `JobRun.errors` にコスト上限エラーが記録される

---

## トラブルシューティング

### エラー: "ANTHROPIC_API_KEY が設定されていません"

**原因:** `.env` ファイルに `ANTHROPIC_API_KEY` が設定されていない

**対処:**
```bash
# .env ファイルを確認
cat .env | grep ANTHROPIC_API_KEY

# 設定されていない場合は追加
echo "ANTHROPIC_API_KEY=your-api-key" >> .env
```

### エラー: "開発サーバーが起動していない"

**原因:** 開発サーバーが起動していない

**対処:**
```bash
# 別ターミナルで開発サーバーを起動
npm run dev
```

### エラー: "Invalid or missing CRON_SECRET"

**原因:** `CRON_SECRET` が設定されていない、または間違っている

**対処:**
```bash
# .env ファイルを確認
cat .env | grep CRON_SECRET

# 設定されていない場合は追加
echo "CRON_SECRET=your-secret-token" >> .env
```

### 要約が生成されない

**確認事項:**
1. Claude APIキーが有効か確認
2. 記事の `summary` フィールドが `null` か確認
3. ジョブ実行ログを確認（`npm run dev` のコンソール出力）
4. `JobRun.errors` にエラーが記録されていないか確認

**デバッグ方法:**
```bash
# ジョブ実行ログを確認
# npm run dev のコンソール出力を見る

# 記事の状態を確認
curl http://localhost:3000/api/articles/<ARTICLE_ID> | jq '.'

# JobRunの状態を確認（Prisma Studioを使用）
npm run db:studio
# → JobRun テーブルを開いて確認
```

---

## 期待される動作

### 正常系のフロー

```
1. 記事作成 (summary=null)
   ↓
2. 手動ジョブ実行
   ↓
3. 収集フェーズ（今回はスキップ、既存記事を使用）
   ↓
4. コスト管理チェック
   ↓
5. 要約フェーズ
   - summary=nullの記事を検索
   - Claude APIで要約生成
   - 記事のsummaryフィールドを更新
   - メトリクスを記録
   ↓
6. ジョブ完了
   - JobRun.status = "completed"
   - JobRun.articlesSummarized = 1
```

### ログ出力例

```
[summarizeArticles] Starting summarization for 1 articles (max 5 concurrent)
[summarizeArticles] Successfully summarized article <id> (https://example.com/...)
[summarizeArticles] Completed: 1/1 articles summarized successfully
```

---

## 次のステップ

動作確認が完了したら、以下に進みます:

- **Phase 2.5**: Settings API実装
- **Phase 3**: メール配信機能実装

---

**最終更新:** 2026-02-02
