#!/bin/bash
# Node 20 以上への切り替えスクリプト（cheerio の "File is not defined" 対策）
set -e

echo "=== Node バージョン確認 ==="
CURRENT=$(node -v 2>/dev/null || echo "none")
echo "現在: $CURRENT"

MAJOR=$(echo "$CURRENT" | sed 's/^v\([0-9]*\).*/\1/')
if [ "$MAJOR" -ge 20 ] 2>/dev/null; then
  echo "✓ Node 20 以上です。追加作業は不要です。"
  exit 0
fi

echo ""
echo "=== nvm で Node 20 をインストール ==="
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  echo "✓ Node $(node -v) に切り替えました。"
  echo ""
  echo "このターミナルでは有効です。永続化するにはプロジェクトで:"
  echo "  nvm use"
  echo "または .nvmrc があるので cd し直すか、新しいターミナルを開いてください。"
else
  echo "nvm が未インストールです。以下のいずれかを実行してください:"
  echo ""
  echo "1. nvm をインストールして Node 20 を使う:"
  echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
  echo "   ターミナルを再起動後: nvm install 20 && nvm use 20"
  echo ""
  echo "2. NodeSource から直接インストール (Ubuntu/Debian):"
  echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "   sudo apt-get install -y nodejs"
  echo ""
  echo "3. https://nodejs.org/ から Node 20 LTS をダウンロード"
  exit 1
fi
