# Cloudflare Pages デプロイ手順

## 前提条件

1. Cloudflare アカウントが必要です
2. wrangler CLI がインストールされている必要があります
3. 環境変数の設定が必要です

```bash
npm install -g wrangler
```

### 環境変数の設定

`.env`ファイルを作成し、以下の値を設定してください：

```bash
cp .env.example .env
```

`.env`ファイルの内容：
```env
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_PAGES_PROJECT_NAME=vial-keyboard-image
NODE_ENV=development
```

#### API トークンの取得方法

1. [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) にアクセス
2. "Create Token" をクリック
3. "Custom token" を選択
4. 権限設定：
   - **Account** - `Cloudflare Pages:Edit`
   - **Zone** - `Zone:Read, DNS:Edit` (カスタムドメイン使用時のみ)
   - **Zone Resources** - `Include All zones` または特定のzone
5. 生成されたトークンを`CLOUDFLARE_API_TOKEN`に設定

#### Account IDの取得方法

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にアクセス
2. 右側の "Account ID" をコピーして`CLOUDFLARE_ACCOUNT_ID`に設定

## 初回セットアップ

セットアップは不要です。`.env`ファイルの設定が完了していれば、そのままデプロイできます。

## デプロイ方法

### 推奨: ビルドとデプロイを同時実行

```bash
cd frontend
npm run deploy:prod
```

wranglerが自動的に以下を実行します：
- `.env`ファイルからAPI TOKENとAccount IDを読み込み
- `wrangler.toml`から設定を読み込み
- 初回の場合はプロジェクトを自動作成
- ビルド済みのdistフォルダをデプロイ

**注意**: API TOKENが設定されているため、`wrangler login`は不要です。

### その他の方法

```bash
# ビルド済みの場合
cd frontend
npm run deploy

# プロジェクトルートから
wrangler pages deploy frontend/dist
```

## 自動デプロイ（GitHub連携）

1. Cloudflare Dashboardにアクセス
2. Pages セクションで新しいプロジェクトを作成
3. GitHubリポジトリを接続
4. ビルド設定：
   - **Build command**: `cd frontend && npm ci && npm run generate-styles && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/`

## 設定ファイル

- `wrangler.toml`: Cloudflare Pages の設定ファイル
- `frontend/package.json`: デプロイスクリプトが追加済み

## トラブルシューティング

### ビルドエラーの場合

1. ローカルでビルドテスト：
```bash
cd frontend
npm run build
```

2. 生成ファイルの確認：
```bash
ls -la dist/
```

### デプロイエラーの場合

1. wranglerの認証状況確認：
```bash
wrangler whoami
```

2. プロジェクトの存在確認：
```bash
wrangler pages project list
```

## URL

デプロイ成功後、以下のようなURLでアクセスできます：
- `https://vial-keyboard-image.pages.dev`
- カスタムドメインを設定した場合はそのURL