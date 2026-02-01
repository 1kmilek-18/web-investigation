# Web Investigation

生産技術×デジタルに関連する技術情報を Web スリーピングし、要約してメールで配信するアプリケーションです。

## 技術スタック

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI**
- **Prisma** + **PostgreSQL**
- **lucide-react**（アイコン）
- **Musubix**（開発支援）

## 必要な環境

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL（ローカルまたはリモート）

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd /home/kmilek/dev-env/web-investigation
npm install
```

これで `package.json` の依存関係（Next.js, React, TypeScript, Tailwind, Prisma, lucide-react, **musubix** など）がインストールされます。

### 2. 環境変数の設定

```bash
cp .env.example .env
# .env を編集し、DATABASE_URL を実際の PostgreSQL 接続文字列に変更
```

### 3. Shadcn/UI の初期化（推奨）

```bash
npx shadcn@latest init
```

プロンプトで以下を選択するとよいです。

- Style: **Default**
- Base color: お好み（例: **Slate**）
- CSS variables: **Yes**
- Components のパス: `@/components`（デフォルト）
- utils のパス: `@/lib/utils`（既存の `src/lib/utils.ts` に合わせる場合）
- React Server Components: **Yes**
- `components.json` の書き換えを許可

既に `src/lib/utils.ts` に `cn` があるため、上書きするかそのまま使うか選べます。

### 4. Prisma のセットアップ

```bash
# クライアント生成（npm install の postinstall で実行済みの場合は省略可）
npm run db:generate

# マイグレーションなしで DB にスキーマを反映（開発用）
npm run db:push

# またはマイグレーションで管理する場合
npm run db:migrate
```

### 5. Musubix の利用（オプション）

Musubix は開発用にプロジェクト配下にインストール済みです。初期化する場合:

```bash
npx musubix init
```

公式ドキュメントに従い、Neuro-Symbolic AI コーディング支援として利用できます。

### 6. MCP 接続（Musubix / Supabase）

プロジェクトには `.cursor/mcp.json` で次の MCP サーバーが登録済みです。

| サーバー | 説明 |
|----------|------|
| **musubix** | 知識グラフ（`.knowledge/graph.json`）等の Neuro-Symbolic AI ツール |
| **supabase** | Supabase プロジェクト `https://eanxmobszkkkiemdvjbm.supabase.co` の DB 操作・設定取得 |

**有効化**: Cursor の設定（Ctrl+, / Cmd+,）→ 左の **MCP** で各サーバーを有効にする。

**Supabase 初回接続時**: ブラウザで Supabase にログインし、対象プロジェクトを含む組織へのアクセスを許可してください。

接続できない場合は、`npm install` 完了（musubix 用）と Supabase ログイン（supabase 用）を確認してください。Musubix はプロジェクトの `node_modules` 内の MCP サーバーを直接起動する設定になっています（`npx` のグローバル参照によるエラーを避けるため）。

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いて確認してください。

## 主要な npm コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint 実行 |
| `npm run db:generate` | Prisma クライアント生成 |
| `npm run db:push` | スキーマを DB に反映（開発用） |
| `npm run db:migrate` | マイグレーション作成・適用 |
| `npm run db:studio` | Prisma Studio 起動 |

## ディレクトリ構成

詳細は [STRUCTURE.md](./STRUCTURE.md) を参照してください。

- `src/app/` … App Router（ページ・レイアウト）
- `src/components/` … UI コンポーネント
- `src/lib/` … ユーティリティ・DB・外部連携
- `src/hooks/` … カスタムフック
- `src/types/` … 型定義

## ライセンス

Private
