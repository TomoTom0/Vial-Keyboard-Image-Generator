# 🎹 Vial Keyboard Image Generator

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange)](https://ytomo-vial-kb-to-image.pages.dev)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)

**vial.rocks設定ファイルから美しいキーボードレイアウト画像を自動生成するWebアプリケーション**

🌐 **Live Demo**: [https://ytomo-vial-kb-to-image.pages.dev](https://ytomo-vial-kb-to-image.pages.dev)

## ✨ 主な機能

### 🎨 **多彩な画像生成オプション**
- **PNG画像**: 高品質なラスター画像
- **SVG画像**: スケーラブルなベクター画像
- **複数レイアウト**: 水平・垂直・分離レイアウト対応
- **ダーク・ライトテーマ**: お好みのテーマで生成
- **メタデータ埋め込み**: 画像にVial設定情報を保存

### 🔄 **高度な変換・置換機能**
- **キー置換**: 画像生成時に任意のキーを別のキーに置換
- **配列変換**: 英字配列⇔日本語配列の自動変換
- **Tap Dance解釈**: TD(n)を実際のキー動作として表示
- **言語別表示**: 英語・日本語キーキャップに対応

### 🖼️ **詳細な表示設定**
- **レイヤー表示**: 複数レイヤーの同時表示
- **コンボ情報**: キーコンボの詳細表示と解釈
- **ハイライト機能**: 特定のキーやレイヤーを強調表示
- **サブテキスト色分け**: メイン・サブキーの視覚的区別
- **カスタマイズ**: フォント、色、サイズの詳細調整

### 📊 **情報の可逆性**
- **Vil情報保持**: 生成画像からVial設定を復元可能
- **設定の永続化**: ブラウザに設定を自動保存
- **履歴管理**: 過去のファイルと設定を記録

### 📱 **使いやすいUI**
- **直感的操作**: ドラッグ&ドロップでファイル読み込み
- **レスポンシブ**: モバイル・デスクトップ対応
- **ズーム機能**: 細部まで確認可能
- **一括ダウンロード**: ZIPファイルで複数画像を取得
- **リアルタイムプレビュー**: 設定変更の即座反映

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

### デプロイメント
- **Cloudflare Pages** - 静的サイトホスティング

### 主要ライブラリ
- **JSZip** - アーカイブ機能
- **Vue Router** - ルーティング
- **UUID** - ユニークID生成

## 📋 使い方

### 1. Vialファイルをアップロード
1. [vial.rocks](https://vial.rocks)でキーボード設定を作成
2. `.vil`ファイルをエクスポート
3. アプリにドラッグ&ドロップまたはファイル選択

### 2. 高度な設定カスタマイズ
- **レイアウト**: 水平・垂直・分離レイアウトから選択
- **テーマ**: ダーク・ライトテーマを切り替え
- **言語**: 英字配列・日本語配列の表示切り替え
- **置換設定**: 特定のキーを別のキーに置き換え表示
- **ハイライト**: 重要なキーを色分けして強調
- **表示オプション**: レイヤー・コンボ・Tap Dance情報の詳細設定

### 3. プレビュー＆調整
- **リアルタイムプレビュー**: 設定変更を即座に確認
- **ズーム機能**: 細部まで詳細にチェック
- **レイヤー切り替え**: 各レイヤーを個別に確認

### 4. 画像生成・ダウンロード
- **PNG形式**: 高品質画像（メタデータ付き）
- **SVG形式**: ベクター画像（拡大縮小自在）
- **一括ダウンロード**: 全レイアウトをZIPで取得
- **設定保存**: Vil情報を画像に埋め込み（後で復元可能）

### 5. 画像からの復元
- **メタデータ読み取り**: PNG画像からVial設定を復元
- **設定の再利用**: 過去の設定を簡単に呼び出し



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
- [Cloudflare Pages](https://pages.cloudflare.com/) - 高速静的サイトホスティング

---

⭐ このプロジェクトが役に立った場合は、スターをつけていただけると嬉しいです！