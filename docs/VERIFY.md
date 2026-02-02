# 動作確認手順

## 1. 前提

- **Supabase**: MCP（project_ref: `gicedvrnftsrmfrvwkmm`）で接続済み。init マイグレーション適用済み（`Source`, `Article`, `Settings`, `JobRun`, `Metric` が存在）
- **アプリ**: 開発サーバーは `npm run dev` で起動

## 2. MCP と同じ Supabase をアプリで使う

MCP で接続している Supabase プロジェクトは、Next.js アプリからも **同じ DB** として使えます。

1. [Supabase Dashboard](https://supabase.com/dashboard) で **MCP と同じプロジェクト**（ref: `gicedvrnftsrmfrvwkmm`）を開く
2. **Settings** → **Database**
3. **Connection string** の **URI** をコピー（パスワードは「Reset database password」で確認 or 既知の値に置換）
4. `.env` の `DATABASE_URL` をその URI に設定
5. 開発サーバーを再起動: `npm run dev`

これで MCP の `apply_migration` / `execute_sql` で触っている DB と、アプリの `/api/sources` 等が同じデータを参照します。

### MCP だけですぐ確認する場合

DB の読み書きは、Cursor から **Supabase MCP の `execute_sql`** でそのまま確認できます（DATABASE_URL 不要）。

例: ソース一覧を取得

```sql
SELECT id, url, type, "createdAt" FROM "Source" ORDER BY "createdAt" DESC;
```

例: ソース追加（MCP 経由）

```sql
INSERT INTO "Source" (id, url, type, "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'https://example.com/feed', 'list', now(), now())
RETURNING id, url, type;
```

API（curl）で確認する場合は、上記のとおり `.env` に `DATABASE_URL` を設定してください。

## 3. 確認手順

### 3.1 ヘルスチェック（DB 不要）

```bash
curl -s http://localhost:3000/api/health
```

期待: `{"ok":true,"timestamp":"..."}`

### 3.2 ソース一覧（空）

```bash
curl -s http://localhost:3000/api/sources
```

期待: `{"sources":[]}`

### 3.3 ソース追加

```bash
curl -s -X POST http://localhost:3000/api/sources \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/feed","type":"list"}'
```

期待: 201 + 作成されたソースの JSON（`id`, `url`, `type`, ...）

### 3.4 ソース一覧（1件）

```bash
curl -s http://localhost:3000/api/sources
```

期待: `{"sources":[{...}]}`（1件）

### 3.5 ソース更新・削除

作成時に返った `id` を使って:

```bash
# 更新
curl -s -X PUT http://localhost:3000/api/sources/<id> \
  -H "Content-Type: application/json" \
  -d '{"type":"single"}'

# 削除
curl -s -X DELETE http://localhost:3000/api/sources/<id>
```

期待: 更新は 200 + 更新後 JSON、削除は 204（Body なし）

## 4. 収集ジョブ（cron / jobs）の確認

### 4.1 認証の確認（DB 不要）

`.env` に `CRON_SECRET=dev-secret-123` など任意の文字列を設定したうえで:

```bash
# 認証なし → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/cron/daily
# 期待: 401

# 誤った Bearer → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/cron/daily \
  -H "Authorization: Bearer wrong"
# 期待: 401
```

### 4.2 ジョブ実行（DB 必須）

`DATABASE_URL` を Supabase の Connection string に設定したうえで:

```bash
# 正しい Bearer で日次ジョブ実行
curl -s -X POST http://localhost:3000/api/cron/daily \
  -H "Authorization: Bearer dev-secret-123"
```

期待: 200 + `{ "status": "completed", "jobRunId": "...", "articlesCollected": N, "errors": [...] }`  
（ソースが 0 件の場合は `articlesCollected: 0`）

手動実行は同じ要領で:

```bash
curl -s -X POST http://localhost:3000/api/jobs/manual \
  -H "Authorization: Bearer dev-secret-123"
```

### 4.3 ジョブ停止

実行中ジョブがある場合のみ:

```bash
curl -s -X POST http://localhost:3000/api/jobs/stop \
  -H "Authorization: Bearer dev-secret-123"
```

期待: 200 + `{ "status": "stopping", "jobRunId": "..." }`、実行中がなければ 404

---

## 5. トラブルシュート

| 現象 | 対処 |
|------|------|
| GET /api/sources が 500 | `.env` の `DATABASE_URL` が正しいか確認。Supabase の URI で、パスワードが含まれているか。 |
| P1001 Can't reach database | WSL 等で直接接続(5432)が届かない場合、Dashboard → Connect → **Transaction** で pooler URI をコピーし `?pgbouncer=true` を付与して `DATABASE_URL` に設定。 |
| POST が 400 "url must be a valid URL" | `url` を有効な URL 文字列で送る。 |
| POST が 400 "type must be 'single' or 'list'" | `type` は `single` または `list` のみ。 |
| POST /api/cron/daily が 500（File is not defined） | `npm run dev` で polyfill プリロード済み。直接 `next dev` で起動している場合は `npm run dev` を使用。Node 20 推奨。 |
| CRON_SECRET 未設定で 500 | `.env` に `CRON_SECRET=任意の文字列` を追加。 |
