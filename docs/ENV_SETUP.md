# 環境変数設定ガイド

**作成日:** 2026-02-02  
**対象:** Phase 2 要約機能の動作確認

---

## 📁 .env ファイルの場所

```
/home/kmilek/dev-env/web-investigation/.env
```

プロジェクトのルートディレクトリに `.env` ファイルを作成または編集してください。

---

## 🔧 必要な環境変数

### Phase 2 要約機能に必要な環境変数

以下の環境変数を `.env` ファイルに設定してください:

```bash
# ============================================
# Phase 2: 要約機能に必要な環境変数
# ============================================

# Claude API (Anthropic) - 要約機能で使用
# 取得方法: https://console.anthropic.com/ → API Keys → Create Key
ANTHROPIC_API_KEY="sk-ant-api03-..."

# 日次ジョブトリガー保護用のシークレット
# 任意の文字列を設定（例: ランダムな文字列）
CRON_SECRET="your-secret-token-here"

# ============================================
# Phase 1: データベース接続（既に設定済みの可能性あり）
# ============================================

# PostgreSQL (Prisma) — Supabase接続文字列
# 取得方法: Supabase Dashboard → Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase（MCP接続先・アプリ連携用）
NEXT_PUBLIC_SUPABASE_URL="https://eanxmobszkkkiemdvjbm.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

---

## 📝 .env ファイルの編集方法

### 方法1: エディタで直接編集

```bash
# エディタで開く
code .env
# または
nano .env
# または
vim .env
```

### 方法2: コマンドラインで追加

```bash
# ANTHROPIC_API_KEYを追加（既に存在する場合は上書きされる）
echo 'ANTHROPIC_API_KEY="sk-ant-api03-..."' >> .env

# CRON_SECRETを追加
echo 'CRON_SECRET="your-secret-token-here"' >> .env
```

**注意:** `>>` を使うと既存の内容に追加されます。既に設定がある場合は、エディタで直接編集することを推奨します。

---

## ✅ 設定確認方法

### 1. 環境変数が設定されているか確認

```bash
# .env ファイルの内容を確認（パスワードは表示されないように注意）
cat .env | grep -E "(ANTHROPIC_API_KEY|CRON_SECRET|DATABASE_URL)" | sed 's/=.*/=***/'
```

### 2. 開発サーバー起動時に確認

開発サーバーを起動すると、環境変数が読み込まれているか確認できます:

```bash
npm run dev
```

出力に以下が表示されれば、`.env` ファイルが読み込まれています:

```
- Environments: .env
```

---

## 🔑 APIキーの取得方法

### ANTHROPIC_API_KEY の取得

1. **Anthropic Console にアクセス**
   - https://console.anthropic.com/ にアクセス
   - アカウントにログイン

2. **API Keys を開く**
   - 左メニューから「API Keys」を選択

3. **新しいキーを作成**
   - 「Create Key」をクリック
   - キー名を入力（例: "web-investigation-dev"）
   - 「Create Key」をクリック

4. **キーをコピー**
   - 表示されたキーをコピー（`sk-ant-api03-...` で始まる）
   - **重要:** このキーは一度しか表示されません。必ずコピーしてください

5. **.env ファイルに設定**
   ```bash
   ANTHROPIC_API_KEY="sk-ant-api03-..."
   ```

---

## 🔐 CRON_SECRET の設定

`CRON_SECRET` は、日次ジョブのAPIエンドポイントを保護するための任意の文字列です。

**推奨:** ランダムな文字列を生成

```bash
# ランダムな文字列を生成（32文字）
openssl rand -hex 32

# 出力例: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

`.env` ファイルに設定:

```bash
CRON_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

---

## 📋 完全な .env ファイルの例

```bash
# PostgreSQL (Prisma) — Supabase接続
DATABASE_URL="postgresql://postgres.eanxmobszkkkiemdvjbm:your-password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase（MCP接続先・アプリ連携用）
NEXT_PUBLIC_SUPABASE_URL="https://eanxmobszkkkiemdvjbm.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# 日次ジョブトリガー保護
CRON_SECRET="your-secret-token-here"

# Claude API (Anthropic) - Phase 2: 要約機能で使用
ANTHROPIC_API_KEY="sk-ant-api03-your-api-key-here"
```

---

## ⚠️ 重要な注意事項

1. **`.env` ファイルは Git にコミットしない**
   - `.gitignore` に含まれていることを確認
   - 機密情報が含まれているため、公開リポジトリにコミットしない

2. **環境変数の変更後は開発サーバーを再起動**
   - `.env` ファイルを変更した後は、開発サーバーを再起動してください
   - `Ctrl+C` で停止してから `npm run dev` で再起動

3. **APIキーの管理**
   - APIキーは他人と共有しない
   - 漏洩した場合は、すぐにAnthropic Consoleでキーを削除

---

## 🚨 トラブルシューティング

### エラー: "ANTHROPIC_API_KEY が設定されていません"

**原因:** `.env` ファイルに `ANTHROPIC_API_KEY` が設定されていない、または読み込まれていない

**対処:**
1. `.env` ファイルに `ANTHROPIC_API_KEY="..."` を追加
2. 開発サーバーを再起動

### エラー: "CRON_SECRET が設定されていません"

**原因:** `.env` ファイルに `CRON_SECRET` が設定されていない

**対処:**
1. `.env` ファイルに `CRON_SECRET="任意の文字列"` を追加
2. 開発サーバーを再起動

### 環境変数が読み込まれない

**確認事項:**
1. `.env` ファイルがプロジェクトルートにあるか確認
   ```bash
   ls -la .env
   ```

2. ファイル名が正確か確認（`.env` で、`.env.example` ではない）

3. 開発サーバーを再起動

---

**最終更新:** 2026-02-02
