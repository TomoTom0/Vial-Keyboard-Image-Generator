# TODO

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

## 現在のタスク：ソースコード分割とリファクタリング

### 型定義の分離
- [ ] interfaces/VialConfig.ts - VIL設定ファイルの型定義
- [ ] interfaces/KeyTypes.ts - キー関連の型定義
- [ ] interfaces/LayoutTypes.ts - レイアウト関連の型定義

### パーサー機能の分離
- [ ] parsers/VialParser.ts - VIL ファイル解析
- [ ] parsers/KeycodeParser.ts - キーコード変換ロジック
- [ ] parsers/TapDanceParser.ts - Tap Dance解析
- [ ] parsers/LayerTapParser.ts - Layer Tap解析

### レンダリング機能の分離
- [ ] renderers/KeyRenderer.ts - キー描画機能
- [ ] renderers/TextRenderer.ts - テキスト描画機能
- [ ] renderers/LayoutRenderer.ts - レイアウト計算・描画
- [ ] renderers/LayerNumberRenderer.ts - レイヤー番号描画

### ユーティリティ機能の分離
- [ ] utils/FileUtils.ts - ファイル操作
- [ ] utils/ColorConstants.ts - カラー定数
- [ ] utils/CoordinateMapper.ts - 座標マッピング出力

### メイン生成クラスの簡素化
- [ ] generators/KeyboardImageGenerator.ts - メインの生成ロジック
- [ ] index.ts - エントリーポイントの簡素化

### テスト環境の準備
- [ ] 各モジュールの単体テスト作成
- [ ] テストデータの準備

## 完了後の確認項目

- [ ] 機能が変更前と同一であることの確認
- [ ] 全てのレイヤーで正しく画像生成できることの確認
- [ ] エラーハンドリングが適切に動作することの確認