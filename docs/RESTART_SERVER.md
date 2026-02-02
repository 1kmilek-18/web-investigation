# 開発サーバーの再起動手順

**作成日:** 2026-02-02

---

## 🔄 開発サーバーの再起動方法

### ステップ1: 現在の開発サーバーを停止

**開発サーバーを起動したターミナル（ターミナル1）で:**

1. `Ctrl+C` を押して開発サーバーを停止
2. 「Terminated」またはプロンプトが表示されるまで待つ

### ステップ2: 開発サーバーを再起動

同じターミナルで:

```bash
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

**重要:** 「Ready」と表示されるまで待ってください。

---

## ✅ 再起動後の確認

### 1. ヘルスチェックエンドポイントを確認

別のターミナルで:

```bash
curl http://localhost:3000/api/health
```

**正常な場合:**
```json
{"ok":true,"timestamp":"2026-02-02T06:10:00.000Z"}
```

**エラーの場合:**
```
Internal Server Error
```

### 2. 動作確認スクリプトを実行

```bash
node scripts/verify-summarization.mjs
```

---

## 🚨 500エラーが続く場合

### 原因1: Prismaの接続エラー

**確認方法:**
開発サーバーのターミナルに以下のようなエラーが表示される:

```
PrismaClientInitializationError: Can't reach database server
```

**対処:**
```bash
# DATABASE_URLを確認
cat .env | grep DATABASE_URL

# Prisma Studioで接続確認
npm run db:studio
```

### 原因2: 環境変数が読み込まれていない

**確認方法:**
開発サーバー起動時の出力を確認:

```
- Environments: .env
```

この行が表示されていれば、`.env` ファイルが読み込まれています。

**対処:**
1. `.env` ファイルがプロジェクトルートにあるか確認
   ```bash
   ls -la .env
   ```

2. ファイル名が正確か確認（`.env` で、`.env.example` ではない）

3. 開発サーバーを再起動

---

## 📋 チェックリスト

再起動前に以下を確認:

- [ ] `.env` ファイルに `ANTHROPIC_API_KEY` が設定されている
- [ ] `.env` ファイルに `CRON_SECRET` が設定されている
- [ ] `.env` ファイルに `DATABASE_URL` が設定されている
- [ ] 開発サーバーが完全に停止している（`Ctrl+C` で停止）
- [ ] 開発サーバーを再起動した（`npm run dev`）
- [ ] 「Ready」と表示されるまで待った

---

**最終更新:** 2026-02-02
