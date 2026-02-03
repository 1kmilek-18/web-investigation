# 環境変数・セットアップ

**統合元:** docs/ENV_SETUP.md  
**最終更新:** 2026-02-03

---

## .env の場所

プロジェクトルート: `./.env`

## 必要な環境変数

### Phase 2 要約・Phase 3 配信

```bash
# Claude API (Anthropic)
ANTHROPIC_API_KEY="sk-ant-api03-..."

# 日次ジョブ認証
CRON_SECRET="your-secret-token"

# PostgreSQL (Supabase)
DATABASE_URL="postgresql://..."

# Supabase フロント用（任意）
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Gmail（Phase 3 配信用）
GMAIL_USER="..."
GMAIL_APP_PASSWORD="..."
```

詳細は **docs/ENV_SETUP.md** を参照。
