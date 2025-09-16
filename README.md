# 🎹 Vial Keyboard Image Generator

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange)](https://ytomo-vial-kb-to-image.pages.dev)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-Backend-000000?logo=rust)](https://www.rust-lang.org/)

**vial.rocks設定ファイルから美しいキーボードレイアウト画像を自動生成するWebアプリケーション**

🌐 **Live Demo**: [https://ytomo-vial-kb-to-image.pages.dev](https://ytomo-vial-kb-to-image.pages.dev)

## ✨ 主な機能

### 🎨 **多彩な画像生成オプション**
- **PNG画像**: 高品質なラスター画像
- **SVG画像**: スケーラブルなベクター画像
- **複数レイアウト**: 水平・垂直・分離レイアウト対応
- **ダーク・ライトテーマ**: お好みのテーマで生成

### 🖼️ **柔軟な表示設定**
- **レイヤー表示**: 複数レイヤーの同時表示
- **コンボ情報**: キーコンボの詳細表示
- **カスタマイズ**: フォント、色、サイズの調整
- **プレビュー**: リアルタイムプレビュー機能

### 📱 **使いやすいUI**
- **直感的操作**: ドラッグ&ドロップでファイル読み込み
- **レスポンシブ**: モバイル・デスクトップ対応
- **ズーム機能**: 細部まで確認可能
- **一括ダウンロード**: ZIPファイルで複数画像を取得

## 🚀 デモ

### レイアウト例
<table>
<tr>
<td align="center">
<img src="frontend/public/images/sample/combined_layers_horizontal_with_combos_dark.png" width="400" alt="水平レイアウト（ダークテーマ）">
<br>
<b>水平レイアウト（ダークテーマ）</b>
</td>
</tr>
</table>

### 対応するキーボード
- **Corne v4**: 42キー分割キーボード
- その他のVial対応キーボード（順次追加予定）

## 🛠️ 技術スタック

### Frontend
- **Vue.js 3.5** + **Composition API**
- **TypeScript 5.8** - 型安全性
- **Pinia** - 状態管理
- **Vite** - 高速ビルドツール
- **Sass** - スタイリング

### Backend
- **Rust** - 高性能画像処理
- **Cloudflare Pages** - デプロイメント

### 主要ライブラリ
- **JSZip** - アーカイブ機能
- **Vue Router** - ルーティング
- **UUID** - ユニークID生成

## 📋 使い方

### 1. Vialファイルをアップロード
1. [vial.rocks](https://vial.rocks)でキーボード設定を作成
2. `.vil`ファイルをエクスポート
3. アプリにドラッグ&ドロップ

### 2. 設定をカスタマイズ
- **レイアウト**: 水平・垂直・分離から選択
- **テーマ**: ダーク・ライトテーマを切り替え
- **表示オプション**: レイヤー・コンボ情報の表示設定

### 3. 画像を生成・ダウンロード
- **個別ダウンロード**: PNG・SVG形式で保存
- **一括ダウンロード**: ZIPファイルで全画像を取得

## 🏃‍♂️ ローカル開発

### 必要環境
- **Node.js** 18.0.0以上
- **Rust** 1.70.0以上 (Backendを使用する場合)

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/TomoTom0/Vial-Keyboard-Image-Generator.git
cd Vial-Keyboard-Image-Generator

# フロントエンド開発
cd frontend
npm install
npm run dev
```

### 開発サーバー起動
```bash
# フロントエンド（ポート5173）
npm run dev

# Rustバックエンド（開発中）
cargo run
```

### ビルド
```bash
# プロダクションビルド
npm run build

# プレビュー
npm run preview
```

## 📂 プロジェクト構造

```
├── frontend/          # Vue.js Webアプリケーション
│   ├── src/
│   │   ├── components/    # Vueコンポーネント
│   │   ├── stores/        # Pinia状態管理
│   │   ├── utils/         # ユーティリティ関数
│   │   └── constants/     # 定数定義
│   ├── public/            # 静的ファイル
│   └── scripts/           # ビルドスクリプト
├── backend/           # Rust画像処理（開発中）
├── data/              # サンプルVialファイル
└── output/            # 生成画像出力先
```

## 🎯 今後の予定

- [ ] 🎨 カスタムテーマエディタ
- [ ] ⌨️ より多くのキーボード対応
- [ ] 📊 使用統計の表示
- [ ] 🔄 バッチ処理機能
- [ ] 📱 PWA対応

## 🤝 コントリビューション

プルリクエストやIssueは大歓迎です！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🙏 謝辞

- [Vial](https://vial.rocks) - 素晴らしいキーボードカスタマイズツール
- [Vue.js](https://vuejs.org/) - 優秀なフロントエンドフレームワーク
- [Rust](https://www.rust-lang.org/) - 高性能システムプログラミング言語

---

⭐ このプロジェクトが役に立った場合は、スターをつけていただけると嬉しいです！