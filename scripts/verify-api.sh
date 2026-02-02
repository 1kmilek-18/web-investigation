#!/bin/bash
# 動作確認用スクリプト（npm run dev 起動後に実行）
# 使用例: CRON_SECRET=dev-secret-123 ./scripts/verify-api.sh

set -e
BASE="${BASE_URL:-http://localhost:3000}"
SECRET="${CRON_SECRET:-}"

echo "=== 1. GET /api/health ==="
curl -s "$BASE/api/health" | head -1
echo ""

echo "=== 2. POST /api/cron/daily（認証なし → 401）==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/cron/daily")
echo "HTTP $code (期待: 401)"
[ "$code" = "401" ] || exit 1

echo "=== 3. POST /api/cron/daily（誤った Bearer → 401）==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/cron/daily" -H "Authorization: Bearer wrong")
echo "HTTP $code (期待: 401)"
[ "$code" = "401" ] || exit 1

if [ -n "$SECRET" ]; then
  echo "=== 4. POST /api/cron/daily（正しい Bearer）==="
  res=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/cron/daily" -H "Authorization: Bearer $SECRET")
  body=$(echo "$res" | head -n -1)
  code=$(echo "$res" | tail -1)
  echo "HTTP $code"
  echo "$body" | head -3
  if [ "$code" = "200" ]; then
    echo "→ ジョブ完了（DATABASE_URL が有効な場合）"
  elif [ "$code" = "500" ]; then
    echo "→ DB 未接続または Node 18 で cheerio/undici エラーの可能性。DATABASE_URL と Node 20 を推奨。"
  fi
else
  echo "=== 4. スキップ（CRON_SECRET 未設定時はジョブ実行テストをスキップ）==="
fi

echo ""
echo "以上で動作確認完了。"
