#!/bin/bash
# Phase 2 要約機能の動作確認スクリプト

set -e

echo "=== Phase 2 要約機能 動作確認 ==="
echo ""

# 環境変数の確認
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ エラー: ANTHROPIC_API_KEY が設定されていません"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "❌ エラー: CRON_SECRET が設定されていません"
  exit 1
fi

echo "✅ 環境変数の確認完了"
echo ""

# 開発サーバーが起動しているか確認
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "⚠️  開発サーバーが起動していないようです"
  echo "   npm run dev でサーバーを起動してください"
  exit 1
fi

echo "✅ 開発サーバーが起動中"
echo ""

# テスト用の記事を作成（summary=null）
echo "📝 テスト用の記事を作成中..."
ARTICLE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/test-article-'$(date +%s)'",
    "title": "テスト記事: 生産技術とデジタル化の未来",
    "rawContent": "生産技術の分野では、デジタル化が急速に進んでいます。IoT、AI、ロボティクスなどの技術を活用することで、製造プロセスの効率化や品質向上が実現されています。特に、デジタルツイン技術により、物理的な製造ラインを仮想空間で再現し、シミュレーションを通じて最適化を行うことが可能になりました。また、データドリブンな意思決定により、従来の経験則に頼らない、より科学的なアプローチが可能になっています。",
    "summary": null,
    "collectedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }')

ARTICLE_ID=$(echo $ARTICLE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$ARTICLE_ID" ]; then
  echo "❌ 記事の作成に失敗しました"
  echo "レスポンス: $ARTICLE_RESPONSE"
  exit 1
fi

echo "✅ 記事を作成しました (ID: $ARTICLE_ID)"
echo ""

# 手動ジョブを実行
echo "🚀 手動ジョブを実行中（要約処理を含む）..."
JOB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/jobs/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET")

echo "ジョブ実行結果:"
echo "$JOB_RESPONSE" | jq '.' 2>/dev/null || echo "$JOB_RESPONSE"
echo ""

# 少し待機（要約処理が完了するまで）
echo "⏳ 要約処理の完了を待機中（10秒）..."
sleep 10

# 記事の要約を確認
echo "📄 記事の要約を確認中..."
ARTICLE_DETAIL=$(curl -s http://localhost:3000/api/articles/$ARTICLE_ID)

SUMMARY=$(echo $ARTICLE_DETAIL | grep -o '"summary":"[^"]*' | cut -d'"' -f4)

if [ -n "$SUMMARY" ] && [ "$SUMMARY" != "null" ]; then
  echo "✅ 要約が生成されました！"
  echo ""
  echo "要約内容:"
  echo "$SUMMARY" | fold -w 80
  echo ""
else
  echo "⚠️  要約がまだ生成されていないか、エラーが発生した可能性があります"
  echo "記事詳細:"
  echo "$ARTICLE_DETAIL" | jq '.' 2>/dev/null || echo "$ARTICLE_DETAIL"
  echo ""
fi

# メトリクスを確認
echo "📊 メトリクスを確認中..."
echo "（メトリクスAPIはPhase 5で実装予定のため、DBを直接確認してください）"
echo ""

echo "=== 動作確認完了 ==="
