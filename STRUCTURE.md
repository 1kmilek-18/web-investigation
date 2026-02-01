# ディレクトリ構成

生産技術×デジタル関連の技術情報を Web スリーピング・要約・メール配信するアプリケーションのプロジェクト構成です。

## ルート

```
web-investigation/
├── prisma/
│   └── schema.prisma      # DB スキーマ（PostgreSQL）
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/       # UI コンポーネント（lucide-react, レスポンシブ前提）
│   ├── lib/              # ユーティリティ・DB クライアント等
│   ├── hooks/            # カスタム React フック
│   └── types/            # TypeScript 型定義
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── postcss.config.mjs
```

## src/ 配下の役割

| ディレクトリ | 役割 |
|-------------|------|
| **app/** | ページ（layout.tsx, page.tsx）、ルート、API ルート。App Router のルーティングとレイアウト。 |
| **components/** | 再利用可能な UI コンポーネント。lucide-react でアイコン、Tailwind でレスポンシブ対応。 |
| **lib/** | 共通ロジック（cn, Prisma クライアント、メール送信、スクレイピング等）。 |
| **hooks/** | カスタム React フック（データ取得、フォーム、UI 状態など）。 |
| **types/** | アプリ全体で使う TypeScript の型・インターフェース。 |

## 技術スタック

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI**（`npx shadcn@latest init` で初期化）
- **Prisma** + **PostgreSQL**
- **lucide-react**（アイコン）
- **Musubix**（プロジェクト配下に devDependency でインストール）

## ルール

- コンポーネントのアイコンは **lucide-react** を使用する。
- UI は **レスポンシブ対応**を前提に設計する。
