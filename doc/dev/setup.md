# 開発環境セットアップガイド

## 概要

Vial Keyboard Image Generatorの開発環境構築手順を記載します。

## システム要件

### 必要なソフトウェア
- **Node.js** 18.0.0以上
- **npm** 9.0.0以上
- **Git** 2.30.0以上

### 推奨開発環境
- **Visual Studio Code** + Vue/TypeScript拡張機能
- **Chrome/Firefox** （デバッグ用）

## 初期セットアップ

### 1. リポジトリクローン

```bash
git clone https://github.com/TomoTom0/Vial-Keyboard-Image-Generator.git
cd Vial-Keyboard-Image-Generator
```

### 2. 依存関係インストール

```bash
cd frontend
npm install
```

### 3. 環境変数設定

プロジェクトルートに `.env` ファイルを作成：

```bash
cp .env.example .env
```

`.env` ファイルを編集：
```bash
# Cloudflare Pages 設定（デプロイ時のみ必要）
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_PAGES_PROJECT_NAME=ytomo-vial-kb-to-image

# 開発環境設定
NODE_ENV=development
```

## 開発サーバー起動

### フロントエンド開発サーバー

```bash
cd frontend
npm run dev
```

アクセス: http://localhost:5173

### ホットリロード

Viteの機能により、ファイル変更時に自動リロードされます。

## プロジェクト構造

```
frontend/
├── src/
│   ├── components/      # Vueコンポーネント
│   │   ├── FileUpload.vue
│   │   ├── PreviewTab.vue
│   │   ├── OutputTab.vue
│   │   └── ...
│   ├── stores/          # Pinia状態管理
│   │   ├── vial.ts      # VILファイル管理
│   │   ├── images.ts    # 画像生成管理
│   │   ├── settings.ts  # 設定管理
│   │   └── ui.ts        # UI状態管理
│   ├── utils/           # ユーティリティ関数
│   │   ├── vialDataProcessor.ts
│   │   ├── svgRenderer.ts
│   │   ├── pngMetadata.ts
│   │   └── *.generated.ts # 自動生成ファイル
│   ├── constants/       # 定数定義
│   ├── composables/     # Vue Composables
│   └── styles/          # スタイルファイル
├── public/              # 静的ファイル
├── scripts/             # ビルドスクリプト
└── data/                # 設定データファイル
```

## 開発ワークフロー

### 1. 機能開発

```bash
# 新機能ブランチ作成
git checkout -b feature/new-feature

# 開発サーバー起動
cd frontend
npm run dev

# コード編集...
# ブラウザで動作確認
```

### 2. ビルドテスト

```bash
cd frontend
npm run build
npm run preview
```

### 3. コミット

```bash
git add .
git commit -m "feat: 新機能の説明"
git push origin feature/new-feature
```

## 自動生成ファイル

### キーボードマッピング

```bash
cd frontend
npm run generate-mappings
```

生成されるファイル: `src/utils/keyboardConfig.generated.ts`

### スタイル設定

```bash
cd frontend
npm run generate-styles
```

生成されるファイル: `src/utils/styleConfig.generated.ts`

## デバッグ

### Vue DevTools

1. Chrome拡張機能「Vue.js devtools」をインストール
2. 開発サーバーでアプリを開く
3. F12 → Vue タブでデバッグ

### Console Logging

開発時のデバッグ用：
```typescript
console.log('🎯 Debug:', data)
console.warn('⚠️ Warning:', error)
console.error('❌ Error:', error)
```

**注意**: 本番ビルド前にconsole.logは削除してください。

### Pinia State Inspector

Vue DevToolsのPiniaタブで状態管理を監視できます：
- vialStore: VILファイル管理
- imagesStore: 画像生成状態
- settingsStore: ユーザー設定
- uiStore: UI状態

## コード品質

### TypeScript型チェック

```bash
cd frontend
npx vue-tsc --noEmit
```

### フォーマット（手動）

```bash
cd frontend
# Prettierがある場合
npx prettier --write src/
```

## よくある開発課題

### 1. 型エラー

**問題**: TypeScriptの型エラー
```
Property 'foo' does not exist on type 'Bar'
```

**解決**:
- `src/utils/types.ts` で型定義を確認
- Vue Props の型定義を確認

### 2. State Management

**問題**: 状態が更新されない

**解決**:
```typescript
// ❌ 直接代入
store.data = newData

// ✅ リアクティブな更新
store.data.value = newData
```

### 3. Canvas描画エラー

**問題**: 画像生成が失敗する

**解決**:
- ブラウザのコンソールでエラー確認
- `stores/images.ts` の生成ロジック確認
- VILファイルの形式確認

### 4. ファイルアップロードエラー

**問題**: VILファイルが読み込めない

**解決**:
- ファイル形式が`.vil`または`.png`(メタデータ付き)か確認
- `components/FileUpload.vue` のvalidation確認
- JSON形式が正しいか確認

## パフォーマンス最適化

### 1. バンドルサイズ分析

```bash
cd frontend
npm run build
npx vite-bundle-analyzer dist
```

### 2. 大きなライブラリの確認

- JSZip (97KB) - ZIPファイル生成用
- Vue Router - ルーティング用
- Pinia - 状態管理用

### 3. 遅延ローディング

大きなコンポーネントは動的インポート：
```typescript
const HeavyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
```

## テスト

### 手動テスト項目

1. **ファイルアップロード**
   - VILファイルのアップロード
   - PNG(メタデータ付き)のアップロード
   - エラーハンドリング

2. **画像生成**
   - PNG生成（各レイアウト）
   - SVG生成（各レイアウト）
   - 一括ダウンロード

3. **設定機能**
   - テーマ切り替え
   - 言語切り替え
   - 置換設定
   - ハイライト設定

4. **レスポンシブ**
   - モバイル表示
   - タブレット表示
   - デスクトップ表示

## Tips

### VS Code設定

`.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "vue.server.hybridMode": true,
  "editor.formatOnSave": true
}
```

### 便利なコマンド

```bash
# 依存関係のセキュリティチェック
npm audit

# 古い依存関係の確認
npm outdated

# キャッシュクリア
npm run build && rm -rf frontend/dist
```