#!/bin/bash

# Cloudflare Pages自動デプロイスクリプト
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment process..."

# 環境変数読み込み
if [ -f ".env" ]; then
    echo "📁 Loading environment variables from .env"
    set -a
    source .env
    set +a
else
    echo "❌ .env file not found!"
    exit 1
fi

# 必要な環境変数チェック
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN is not set in .env"
    exit 1
fi

if [ -z "$CLOUDFLARE_PAGES_PROJECT_NAME" ]; then
    echo "❌ CLOUDFLARE_PAGES_PROJECT_NAME is not set in .env"
    exit 1
fi

# frontendディレクトリに移動
cd frontend

echo "🔧 Building project..."
npm run build

echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name "$CLOUDFLARE_PAGES_PROJECT_NAME" --commit-dirty

echo "✅ Deployment completed successfully!"
echo "🌐 Your site should be available at: https://$CLOUDFLARE_PAGES_PROJECT_NAME.pages.dev"