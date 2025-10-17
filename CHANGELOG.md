# Changelog

このプロジェクトの全ての重要な変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
このプロジェクトは [Semantic Versioning](https://semver.org/lang/ja/) に準拠しています。

## [Unreleased]

## [1.0.0] - 2025-10-17

### Added
- 初回リリース
- Vial設定ファイル(.vil)からキーボードレイアウト画像を生成する機能
- PNG/SVG両フォーマット対応
- 水平・垂直・分離の3つのレイアウトオプション
- ダーク・ライトテーマ対応
- キー置換機能（特定のキーを別のキーに置き換え表示）
- 英字配列⇔日本語配列の自動変換
- Tap Dance解釈機能（TD(n)を実際のキー動作として表示）
- 言語別表示対応（英語・日本語キーキャップ）
- レイヤー表示機能
- コンボ情報の詳細表示と解釈
- ハイライト機能（特定のキーやレイヤーの強調表示）
- サブテキスト色分け（メイン・サブキーの視覚的区別）
- メタデータ埋め込み機能（PNG画像にVial設定情報を保存）
- 画像からのVial設定復元機能
- 設定の永続化（ブラウザに自動保存）
- ファイル履歴管理
- ドラッグ&ドロップ対応
- リアルタイムプレビュー
- ズーム機能
- 一括ダウンロード機能（ZIP）
- Cloudflare Pagesデプロイ対応

### Fixed
- ファイル拡張子バグ修正（SVG画像ダウンロード時に正しい拡張子を使用）
- コード重複の解消（debouncedGeneratePreviewの統一）
- デバッグ用console.logの削除
- インデックス計算ロジックの統一
- 未使用パラメータの削除
- .gitignore設定の修正（テストファイルの追跡）

### Changed
- クロスプラットフォーム対応のためdotenv-cliを導入
- テストスイートの整備（166テスト、9テストファイル）
- TypeScript型安全性の向上
- コードの可読性とメンテナンス性の向上

### Technical Details
- Vue.js 3.5 + Composition API
- TypeScript 5.8
- Pinia状態管理
- Vite高速ビルド
- Vitest + Vue Test Utilsテスト環境
- Cloudflare Pagesホスティング

### Supported Keyboards
- Cheapiano v2（カスタムレイアウト）
- Corne v4（42キー分割キーボード）
- その他のVial対応キーボード

[Unreleased]: https://github.com/TomoTom0/Vial-Keyboard-Image-Generator/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/TomoTom0/Vial-Keyboard-Image-Generator/releases/tag/v1.0.0
