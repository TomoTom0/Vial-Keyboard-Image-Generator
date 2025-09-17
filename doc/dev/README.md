# 開発者向けドキュメント

## 概要

Vial Keyboard Image Generatorの開発者向けドキュメント一覧です。

## ドキュメント一覧

### 🚀 [セットアップガイド](./setup.md)
開発環境の構築から開始までの手順
- システム要件
- 初期セットアップ
- 開発サーバー起動
- 開発ワークフロー

### 🏗️ [アーキテクチャ設計書](./architecture.md)
システム全体の設計思想と技術構成
- 技術スタック
- システム構成
- データフロー
- 状態管理
- パフォーマンス最適化

### 📦 [デプロイメントガイド](./deployment.md)
本番環境へのデプロイ手順とメンテナンス
- デプロイ手順
- 環境設定
- トラブルシューティング
- 監視・メンテナンス

## クイックスタート

### 1. 環境構築
```bash
git clone https://github.com/TomoTom0/Vial-Keyboard-Image-Generator.git
cd Vial-Keyboard-Image-Generator
cd frontend
npm install
```

### 2. 開発開始
```bash
npm run dev
# http://localhost:5173
```

### 3. ビルド・デプロイ
```bash
npm run build  # ビルド
./deploy.sh    # デプロイ（プロジェクトルートで実行）
```

## 主要技術

- **Frontend**: Vue.js 3 + TypeScript + Vite
- **State Management**: Pinia
- **Styling**: Sass
- **Deploy**: Cloudflare Pages

## プロジェクト構造

```
Vial-Keyboard-Image-Generator/
├── frontend/           # メインアプリケーション
│   ├── src/
│   │   ├── components/ # Vue コンポーネント
│   │   ├── stores/     # Pinia 状態管理
│   │   ├── utils/      # コアロジック
│   │   └── ...
│   ├── public/         # 静的ファイル
│   └── package.json
├── doc/                # ドキュメント
│   ├── dev/           # 開発者向け（このディレクトリ）
│   └── design/        # 設計ドキュメント
├── data/              # サンプルデータ
├── tasks/             # プロジェクト管理
└── README.md          # エンドユーザー向け
```

## 開発フロー

### 機能追加
1. Issue作成・確認
2. 機能ブランチ作成
3. 開発・テスト
4. プルリクエスト
5. レビュー・マージ
6. デプロイ

### コード規約
- **TypeScript**: 型安全性を重視
- **Vue Composition API**: script setup構文使用
- **Pinia**: 状態管理は store 単位で分割
- **命名**: camelCase（変数・関数）、PascalCase（コンポーネント・型）

## よくある開発タスク

### 新しいキーボードレイアウト追加

#### 1. レイアウト定義ファイル作成
`frontend/data/layouts/[keyboard_name].tsv` を作成：

```tsv
vial_row	vial_col	layout_row	layout_col	canvas_x	canvas_y	canvas_width	canvas_height	canvas_rotation	description
0	0	0	0	20.0	20.0	78	60	0.0	Left top row - Key 1
0	1	0	1	102.0	20.0	78	60	0.0	Left top row - Key 2
...
```

**各列の説明**:
- `vial_row`, `vial_col`: VIL設定ファイル内の行・列位置
- `layout_row`, `layout_col`: 画面上の論理的な行・列位置
- `canvas_x`, `canvas_y`: キャンバス上のピクセル座標
- `canvas_width`, `canvas_height`: キーのサイズ（ピクセル）
- `canvas_rotation`: キーの回転角度（通常は0.0）
- `description`: キーの説明

#### 2. 自動生成実行
```bash
cd frontend
npm run generate-mappings
```

#### 3. 確認
生成される `src/utils/keyboardConfig.generated.ts` を確認

### 新しい言語キーマップ追加

#### 1. キーマップファイル作成
`frontend/data/keymaps/[language_name].tsv` を作成：

```tsv
keycode	display	shift_display	description
KC_Q	q	Q	Letter Q
KC_W	w	W	Letter W
KC_SCLN	;	:	Semicolon/Colon
...
```

**各列の説明**:
- `keycode`: QMKキーコード
- `display`: 通常時の表示文字
- `shift_display`: Shiftキー押下時の表示文字
- `description`: キーの説明

#### 2. 共通キーマップ確認
`frontend/data/keymaps/common.tsv` に共通キーが定義されています。
言語固有の文字のみを新しいファイルに記載してください。

#### 3. 自動生成実行
```bash
cd frontend
npm run generate-mappings
```

#### 4. UI追加
言語選択UIに新しい言語を追加する場合は、該当コンポーネントを修正してください。

### 新しい出力フォーマット追加
1. `stores/images.ts` に新しい生成メソッドを追加
2. `components/OutputTab.vue` に UI を追加

## サポート

### 質問・バグ報告
- GitHub Issues を使用
- 詳細な再現手順を記載

### 開発環境のトラブル
- [セットアップガイド](./setup.md) の「よくある開発課題」を参照
- Node.js/npm のバージョン確認

### デプロイ問題
- [デプロイメントガイド](./deployment.md) の「トラブルシューティング」を参照
- Cloudflare Pages の状況確認

## ツール・拡張機能

### VS Code 推奨拡張
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- Prettier - Code formatter
- ESLint

### Chrome 拡張
- Vue.js devtools
- Lighthouse

### 便利なコマンド
```bash
# 型チェック
npx vue-tsc --noEmit

# ビルドサイズ分析
npm run build && du -sh frontend/dist/*

# 依存関係更新
npm update && npm audit
```

## リソース

### 外部リソース
- [Vue.js 公式ドキュメント](https://ja.vuejs.org/)
- [Pinia 公式ドキュメント](https://pinia.vuejs.org/)
- [Vite 公式ドキュメント](https://ja.vitejs.dev/)
- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)

### プロジェクト固有
- [設計ドキュメント](../design/)
- [タスク管理](../../tasks/)
- [変更履歴](../../CHANGELOG.md)（今後作成予定）