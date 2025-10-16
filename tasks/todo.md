# TODO - Vial Keyboard Image Project

## Gemini Code Review対応 (PR #1) - 完了

### High Priority

#### 1. .gitignoreの不適切な設定を修正 ✅
- **Location**: `.gitignore:129`
- **完了**: `tests/`と`test_*.js`の設定を削除
- **結果**: `frontend/tests/`が正常に追跡される

#### 2. タイムスタンプフォーマットの検討（対応不要と判断） ✅
- **Location**: `frontend/src/stores/images.ts:649`
- **判断**: ユーザーが保存するファイルなので、OS側の調整や手動renameで対応可能。対応不要。

### Medium Priority

#### 3. デバッグ用console.logの削除 ✅
- **完了**: すべてのconsole.logを削除
  - ✅ `frontend/src/components/OutputTab.vue:227`
  - ✅ `frontend/src/components/OutputTab.vue:238`
  - ✅ `frontend/src/components/OutputTab.vue:250`
  - ✅ `frontend/src/components/GenerateSection.vue:129`
  - ✅ `frontend/src/stores/images.ts:1466`
  - ✅ `frontend/src/stores/images.ts:1545`
  - ✅ `frontend/src/stores/images.ts:553`

#### 4. クロスプラットフォーム対応: dotenv-cli導入 ✅
- **完了**: `dotenv-cli`を開発依存関係に追加
- **完了**: `deploy:prod`スクリプトを`dotenv -e ../.env --`に修正

#### 5. インデックス計算ロジックの統一 ✅
- **完了**: `cycleLanguage`と`cycleTargetLanguage`を統一パターンに修正
- **パターン**: `(currentIndex + direction + array.length) % array.length`

#### 6. コードの重複削除 ⚠️
- **Location**: `frontend/src/components/GenerateSection.vue:133`
- **状況**: Geminiの指摘を確認したが、`uiStore.debouncedGeneratePreview`は存在しないため、現状の実装を維持
- **理由**: 各コンポーネントで独自のdebounce実装が必要

#### 7. 未使用パラメータの削除 ✅
- **完了**: `cycleDarkMode`の`direction`パラメータを削除
- **完了**: テンプレート側の呼び出しも修正

### テスト結果
- **すべてのテスト**: ✅ 166 passed (166)
- **テストファイル**: ✅ 9 passed (9)

## URGENT: Missing Files - Claude Code Issues

### Overview
Claude Codeが適切にGitに保存しなかった、または削除後に復元しなかったファイル一覧

### Missing Files

#### 1. PreferencesTab.vue
- **Location**: `frontend/src/components/PreferencesTab.vue`
- **Status**: 存在しない
- **Issue**: `Sidebar.vue`でインポート・使用されているが、ファイルが存在しない
- **Error**: `Failed to resolve import "./PreferencesTab.vue"`
- **Claude's Wrong Action**: 推測で内容を作成したが、その後削除された
- **Correct Action**: 元の設定画面機能を適切に復元する

#### 2. sample.vil
- **Location**: `frontend/public/data/sample.vil`
- **Status**: 存在しない
- **Issue**: `images.ts`でサンプルファイルとして読み込まれているが、ファイルが存在しない
- **Error**: `Failed to load sample VIL file: SyntaxError: Unexpected token '<'`
- **Claude's Wrong Action**: 機能を無効化するコードを追加
- **Correct Action**: 適切なサンプルVILファイルを作成・配置する

#### 3. keyboard.svg
- **Location**: `frontend/public/keyboard.svg`
- **Status**: 存在しない
- **Issue**: `index.html`でファビコンとして指定されているが、ファイルが存在しない
- **Error**: ブラウザタブにアイコンが表示されない
- **Claude's Wrong Action**: 問題を放置
- **Correct Action**: 適切なファビコンファイルを作成・配置する

### Root Cause
2025年9月17日のプロジェクトクリーンアップで削除されたファイルが、その後適切に復元されていない。

### Required Actions
1. **PreferencesTab.vue**: 設定画面の機能要件を確認して適切に実装
2. **sample.vil**: デモ用のVILファイルを作成
3. **keyboard.svg**: ブランドに適したファビコンを作成
4. **Code cleanup**: 機能無効化コードを削除し、正常動作に戻す

### Priority
**HIGH** - これらのファイルがないと基本機能が正常に動作しない

## 完了済みタスク

- [x] Cheapiano v2キーボード構造の追加
- [x] エンコーダー対応実装（vial_row 100-109）
- [x] キーボード構造名のヘッダー表示
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

## 画像倍率システム検討

### 問題点の整理
- 現在のCSS変数による固定倍率では画面サイズに対応しきれない
- transform:scaleは視覚サイズのみ変更、レイアウトスペースは元のまま
- 大きな画像（1276px）が小画面でははみ出す

### 検討すべき実装方式

#### 方式A: CSS Container Queriesによる適応的倍率
- `@container`クエリでコンテナ幅に応じてCSS変数を動的変更
- JavaScript不要、純CSS実装
- 問題：transform:scaleのレイアウトスペース問題は残る

#### 方式B: ResizeObserverによるJavaScript制御
- ResizeObserverでコンテナサイズ監視
- `max-width`や`width`でCSSサイズ直接制御（transformは使わない）
- レイアウトスペースも正しく計算される

#### 方式C: 画像生成時サイズ制御
- Canvas生成時に目標サイズを指定
- qualityScaleパラメータを利用
- 根本的解決だが生成コストが高い

#### 方式D: CSS Grid/Flexbox + object-fit制御
- CSS GridまたはFlexboxでコンテナサイズ制限
- `object-fit: contain`でアスペクト比維持しつつサイズフィット
- シンプルで確実

### 推奨実装順序
1. **方式D（CSS制御）を試行** - 最もシンプル
2. 不十分な場合は**方式B（ResizeObserver）**を追加
3. パフォーマンス問題があれば**方式C（生成時制御）**を検討

### 具体的実装タスク
- [ ] CSS GridまたはFlexboxでコンテナサイズ制限実装
- [ ] object-fit: containによる自動フィット確認
- [ ] レスポンシブ対応（タブレット・スマホサイズ）
- [ ] 必要に応じてResizeObserverによる高度制御追加

## Webフロントエンド開発（保留中）

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
