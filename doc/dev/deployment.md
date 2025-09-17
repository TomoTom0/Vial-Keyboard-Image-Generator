# デプロイメントガイド

## 概要

Vial Keyboard Image GeneratorのCloudflare Pagesへのデプロイ手順とメンテナンス方法を記載します。

**注意**: Cloudflareへのデプロイは必須ではありません。ローカル開発や他のホスティングサービスでも利用可能です。

## 前提条件

### 必要なツール
- **Node.js** 18.0.0以上
- **npm** 9.0.0以上
- **Wrangler CLI** 4.36.0以上

### 環境変数

プロジェクトルートの `.env` ファイルに以下を設定：

```bash
# Cloudflare Pages 設定
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_PAGES_PROJECT_NAME=ytomo-vial-kb-to-image

# 開発環境設定
NODE_ENV=development
```

**⚠️ 重要**: `.env`ファイルはgitignoreされており、機密情報が含まれています。

## デプロイ手順

### 1. 自動デプロイ（推奨）

プロジェクトルートで以下のコマンドを実行：

```bash
./deploy.sh
```

このスクリプトは以下を自動実行します：
1. 環境変数の読み込み (`.env`)
2. フロントエンドのビルド (`npm run build`)
3. Cloudflare Pagesへのデプロイ (`wrangler pages deploy`)

### 2. 手動デプロイ

#### Step 1: ビルド

```bash
cd frontend
npm run build
```

#### Step 2: デプロイ

```bash
npx wrangler pages deploy dist --project-name ytomo-vial-kb-to-image
```

### 3. ビルドプロセス詳細

フロントエンドビルドは以下の手順で実行されます：

```bash
# 1. キーボードマッピング生成
npm run generate-mappings

# 2. スタイル設定生成
npm run generate-styles

# 3. Viteビルド
vite build
```

#### 自動生成ファイル
- `src/utils/keyboardConfig.generated.ts` - キーボード言語設定
- `src/utils/styleConfig.generated.ts` - フォント・色設定

## アクセスURL

### ローカル開発環境
```bash
cd frontend
npm run dev
# http://localhost:5173 (ポートが使用中の場合は自動的に別ポートが選択されます)
```

### Cloudflare Pages（デプロイ時）
- **URL形式**: https://[your-project-name].pages.dev
- **プレビューURL**: https://[commit-hash].[your-project-name].pages.dev

**注意**:
- 実際のURLは設定したプロジェクト名によって異なります
- 上記は一例です（各自が独自のプロジェクト名を設定する必要があります）

### 設定確認

`wrangler.toml`で以下が設定されています：

```toml
name = "ytomo-vial-kb-to-image"
compatibility_date = "2024-09-01"
pages_build_output_dir = "frontend/dist"
```

## トラブルシューティング

### よくあるエラー

#### 1. 認証エラー
```
Error: Authentication error
```

**解決方法**: API TOKENを確認
```bash
export CLOUDFLARE_API_TOKEN=your_token_here
npx wrangler auth verify
```

#### 2. ビルドエラー
```
Error: Build failed
```

**解決方法**: 依存関係を再インストール
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 3. デプロイサイズエラー
```
Error: Too many files
```

**解決方法**: 不要ファイルがdistに含まれていないか確認
```bash
cd frontend
rm -rf dist
npm run build
ls -la dist/
```

### ログ確認

#### デプロイログ
```bash
npx wrangler pages deployment list --project-name ytomo-vial-kb-to-image
```

#### 関数ログ（今後の拡張時）
```bash
npx wrangler pages deployment tail
```

## メンテナンス

### 定期作業

#### 1. 依存関係の更新
```bash
cd frontend
npm update
npm audit fix
```

#### 2. Wranglerの更新
```bash
npm install -g wrangler@latest
```

#### 3. セキュリティチェック
```bash
cd frontend
npm audit
```

### バックアップ

重要ファイルのバックアップ：
- `.env` - 環境変数設定
- `wrangler.toml` - Cloudflare設定
- `frontend/package.json` - 依存関係
- `deploy.sh` - デプロイスクリプト

## 環境別設定

### 開発環境
```bash
cd frontend
npm run dev
# http://localhost:5173
```

### プレビュー環境
```bash
cd frontend
npm run build
npm run preview
# http://localhost:4173
```

### 本番環境
- Cloudflare Pagesで自動配信
- グローバルCDN経由でアクセス
- 自動HTTPS対応

## パフォーマンス最適化

### ビルドサイズ監視
```bash
cd frontend
npm run build

# ファイルサイズ確認
du -sh dist/*
```

### Lighthouse監査
```bash
# Chrome DevToolsのLighthouseタブで実行
# または
npx lighthouse https://ytomo-vial-kb-to-image.pages.dev
```

## セキュリティ

### 機密情報管理
- API TOKENは `.env` ファイルで管理
- `.env` は gitignore に含まれている
- 本番環境では Cloudflare の環境変数機能を使用

### HTTPS
- Cloudflare Pagesで自動HTTPS対応
- 証明書の自動更新

## 監視・アラート

### サイト監視
- Cloudflare Analytics でアクセス状況確認
- Real User Monitoring (RUM) で性能監視

### エラー監視
- ブラウザのコンソールエラー監視
- Cloudflare Workers Analytics（今後の拡張時）