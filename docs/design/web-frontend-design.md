# Web Frontend設計書

## 概要
Vialキーボード画像生成機能をWebフロントエンドから利用できるシステムを構築する。

## 要件

### 基本機能
1. **ファイルアップロード**
   - .vilファイルのドラッグ&ドロップ対応
   - ファイル選択ダイアログ
   - ファイルサイズ・形式バリデーション

2. **画像生成設定**
   - テーマ選択（ダークモード/ライトモード）
   - 出力形式選択（縦並び/横並び/個別レイヤー）
   - レイヤー範囲指定（0-3の範囲で選択可能）

3. **画像表示・ダウンロード**
   - 生成された画像のプレビュー表示
   - 個別画像のダウンロード
   - ZIP一括ダウンロード

4. **キャッシュ機能**
   - アップロードファイルの履歴保存（ローカルストレージ）
   - 生成済み画像のキャッシュ
   - 設定の保存・復元

### 技術構成

#### Frontend
- **フレームワーク**: Vue.js 3 (Composition API)
- **UI Framework**: Vuetify 3 または Tailwind CSS
- **ビルドツール**: Vite
- **デプロイ**: 静的サイトホスティング（Netlify/Vercel）

#### Backend
- **Runtime**: Node.js
- **API Framework**: Express.js
- **画像処理**: 既存のTypeScriptモジュール
- **ファイルストレージ**: ローカルファイルシステム + Redis（キャッシュ）

#### API設計
```
POST /api/generate
  - multipart/form-data形式で.vilファイルを受信
  - 生成オプションをJSONで受信
  - 画像URLリストを返却

GET /api/download/:imageId
  - 指定された画像をダウンロード

GET /api/history
  - ユーザーの生成履歴を取得

DELETE /api/cache/:fileId
  - キャッシュファイルの削除
```

### UI/UX設計

#### メイン画面レイアウト
1. **ヘッダー**
   - アプリタイトル
   - テーマ切り替えボタン

2. **アップロード セクション**
   - ドラッグ&ドロップエリア
   - ファイル選択ボタン
   - アップロード済みファイル一覧

3. **設定 セクション**
   - テーマ選択（ダーク/ライト）
   - 出力形式選択
   - レイヤー範囲設定
   - 生成ボタン

4. **結果表示 セクション**
   - 生成進捗表示
   - 画像プレビューグリッド
   - ダウンロードボタン群

5. **履歴 セクション**
   - 過去の生成結果
   - 再生成ボタン

### ファイル構成
```
frontend/
├── src/
│   ├── components/
│   │   ├── FileUpload.vue
│   │   ├── GenerateSettings.vue
│   │   ├── ImagePreview.vue
│   │   ├── HistoryPanel.vue
│   │   └── ProgressIndicator.vue
│   ├── composables/
│   │   ├── useFileUpload.ts
│   │   ├── useImageGeneration.ts
│   │   └── useCache.ts
│   ├── stores/
│   │   ├── app.ts
│   │   └── history.ts
│   └── App.vue
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── api.ts
│   │   ├── services/
│   │   │   ├── imageGenerator.ts
│   │   │   └── cacheManager.ts
│   │   └── server.ts
│   └── uploads/
└── shared/
    └── types.ts
```

### キャッシュ戦略

#### フロントエンド キャッシュ
- **LocalStorage**: ユーザー設定、ファイル履歴
- **SessionStorage**: 一時的な生成状態
- **IndexedDB**: 大容量ファイル、画像キャッシュ

#### バックエンド キャッシュ
- **Redis**: 生成済み画像の一時保存（24時間TTL）
- **File System**: アップロードファイルの保存（7日間保持）

### セキュリティ考慮事項
- ファイルサイズ制限（最大10MB）
- アップロード形式制限（.vilのみ）
- Rate Limiting（1ユーザー 10リクエスト/分）
- XSS防止（入力値のサニタイズ）
- CSRF対策（CSRFトークン）

### パフォーマンス最適化
- 画像の遅延読み込み
- WebPフォーマット対応
- 画像の圧縮・リサイズ
- CDN利用（静的アセット）
- API結果のキャッシュ

### 将来拡張案
- 複数ファイル同時処理
- カスタムカラーテーマ
- 共有機能（URL生成）
- エクスポート形式追加（SVG, PDF）
- ユーザーアカウント機能