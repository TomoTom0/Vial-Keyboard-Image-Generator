# TODO - Vial Keyboard Image Project

## 完了済みタスク

- [x] Vilファイルの構造分析と理解
- [x] サンプル画像からキーレイアウト情報の抽出
- [x] キーコードとラベル表示の対応関係調査
- [x] 技術要件の整理
- [x] TypeScriptプロジェクトでの実装完了
- [x] Tap Dance複数サブテキスト表示機能
- [x] Layer Tap表示機能
- [x] レイアウト調整（左右ブロック間隔、右端列位置）
- [x] レイヤー番号装飾表示機能
- [x] モジュール分割と画像結合機能の実装
- [x] ダークモード・ライトモードのテーマ対応
- [x] コンボ情報表示機能の実装
- [x] ヘッダー統一とファイル名ラベル表示
- [x] 拡張子表示対応

## 現在のタスク：Webフロントエンド開発

### Phase 1: プロジェクト基盤構築

- [ ] プロジェクト構造の初期セットアップ（frontend/backend フォルダ作成）
- [ ] Vue.js 3 + Viteでフロントエンドプロジェクト作成
- [ ] Express.jsでバックエンドAPI作成
- [ ] 既存TypeScriptモジュールをバックエンドに統合

### Phase 2: 基本機能実装
- [ ] ファイルアップロード機能の実装（ドラッグ&ドロップ対応）
- [ ] 画像生成設定UI（テーマ・形式選択）の実装
- [ ] 画像プレビュー・ダウンロード機能の実装
- [ ] API設計と実装（POST /api/generate, GET /api/download）

### Phase 3: 高度な機能
- [ ] キャッシュ機能（LocalStorage + Redis）の実装
- [ ] 履歴管理機能の実装（過去の生成結果保存）
- [ ] セキュリティ対策（ファイル形式・サイズ制限、Rate Limiting）

### Phase 4: 最終調整
- [ ] テスト・デバッグ・パフォーマンス調整
- [ ] UI/UXの改善
- [ ] ドキュメント整備

## アーキテクチャ参考

### 旧タスク（参考として保持）
<details>
<summary>ソースコード分割タスク（完了済み）</summary>

#### 型定義の分離
- [x] modules/types.ts - 型定義と色定義の統合

#### パーサー機能の分離
- [x] modules/parser.ts - VILファイル・コンボ解析

#### レンダリング機能の分離
- [x] modules/renderer.ts - キー・テキスト描画機能
- [x] modules/combo_renderer.ts - コンボ情報描画
- [x] modules/combiner.ts - 画像結合機能

#### ユーティリティ機能の分離
- [x] modules/generator.ts - メイン生成ロジック
- [x] modules/utils.ts - ファイル操作

</details>