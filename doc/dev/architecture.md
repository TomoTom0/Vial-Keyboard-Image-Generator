# アーキテクチャ設計書

## システム概要

Vial Keyboard Image GeneratorはVue.js 3 + TypeScriptで構築されたSPA（Single Page Application）です。Cloudflare Pagesでホストされ、クライアントサイドで画像生成を行います。

## 技術スタック

### フロントエンド
- **Vue.js 3.5** - UIフレームワーク（Composition API）
- **TypeScript 5.8** - 型安全な開発
- **Vite 7.1** - 高速ビルドツール
- **Pinia 3.0** - 状態管理
- **Vue Router 4.5** - ルーティング
- **Sass** - CSS拡張

### 主要ライブラリ
- **JSZip 3.10** - ZIPファイル生成
- **UUID 13.0** - ユニークID生成

### デプロイメント
- **Cloudflare Pages** - 静的サイトホスティング
- **Wrangler 4.36** - デプロイメントツール

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│  Vue.js Application                                     │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │   Components    │  │         Stores (Pinia)         │ │
│  │  - FileUpload   │  │  - vialStore                    │ │
│  │  - PreviewTab   │  │  - imagesStore                  │ │
│  │  - OutputTab    │  │  - settingsStore                │ │
│  │  - ...          │  │  - uiStore                      │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Utils & Processors                      │ │
│  │  - VialDataProcessor  - SVGRenderer                    │ │
│  │  - PngMetadata       - VilConverter                    │ │
│  │  - ParsedVialProcessor                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Pages (CDN)                    │
│  - Global Distribution                                  │
│  - Automatic HTTPS                                     │
│  - Edge Caching                                        │
└─────────────────────────────────────────────────────────┘
```

## ディレクトリ構造

```
frontend/src/
├── components/           # Vueコンポーネント
│   ├── FileUpload.vue   # ファイルアップロード
│   ├── PreviewTab.vue   # プレビュー表示
│   ├── OutputTab.vue    # 出力・ダウンロード
│   ├── SelectTab.vue    # ファイル選択
│   ├── KeyboardTab.vue  # キーボード設定
│   ├── ReplaceTab.vue   # 置換設定
│   └── ...              # その他UI部品
├── stores/              # Pinia状態管理
│   ├── vial.ts         # VILファイル管理
│   ├── images.ts       # 画像生成・キャッシュ
│   ├── settings.ts     # ユーザー設定
│   └── ui.ts           # UI状態管理
├── utils/              # コアロジック
│   ├── vialDataProcessor.ts    # VIL解析処理
│   ├── parsedVialProcessor.ts  # 解析済みVIL処理
│   ├── svgRenderer.ts         # SVG画像生成
│   ├── pngMetadata.ts         # PNGメタデータ処理
│   ├── vilConverter.ts        # VIL変換・言語変換
│   └── types.ts              # 型定義
├── constants/          # 定数・設定
│   ├── keyboard.ts     # キーボード定義
│   └── layout.ts       # レイアウト定義
├── composables/        # Vue Composables
│   ├── useFileUpload.ts
│   ├── useImageGeneration.ts
│   └── ...
└── styles/             # スタイル
    └── layout.scss
```

## データフロー

### 1. ファイルアップロード

```
User Input (VIL/PNG)
    ↓
FileUpload.vue
    ↓
vialStore.addVialData()
    ↓
VIL Config Storage
    ↓
Auto-select new file
```

### 2. 画像生成

```
User Settings Change
    ↓
settingsStore Update
    ↓
imagesStore.generatePreviewImages()
    ↓
VialDataProcessor.parse()
    ↓
ParsedVialProcessor.generate()
    ↓
Canvas/SVG Generation
    ↓
Preview Display
```

### 3. 画像ダウンロード

```
User Download Request
    ↓
OutputTab.vue
    ↓
Image Generation (if needed)
    ↓
Format Conversion (PNG/SVG)
    ↓
Metadata Embedding (PNG)
    ↓
File Download / ZIP Creation
```

## 状態管理 (Pinia Stores)

### vialStore
**役割**: VILファイルの管理
```typescript
interface VialData {
  id: string
  name: string
  config: VialConfig
  content: string
  timestamp: number
  parsedVial?: ParsedVial
}
```

**主要機能**:
- ファイル追加・削除・選択
- 言語変換
- 同名ファイル上書き
- Replace Rules適用

### imagesStore
**役割**: 画像生成とキャッシュ管理
```typescript
interface GeneratedImage {
  id: string
  layer?: number
  format?: 'separated' | 'vertical' | 'rectangular'
  dataUrl?: string
  type: 'layer' | 'header' | 'combo' | 'combined'
  canvas?: HTMLCanvasElement
}
```

**主要機能**:
- プレビュー画像生成
- 出力画像生成
- 画像キャッシュ管理
- フォーマット別生成

### settingsStore
**役割**: ユーザー設定管理
```typescript
interface Settings {
  outputFormat: 'separated' | 'vertical' | 'rectangular'
  enableDarkMode: boolean
  keyboardLanguage: 'english' | 'japanese'
  showHeader: boolean
  showCombos: boolean
  replaceRules: ReplaceRule[]
  // ... その他設定
}
```

**主要機能**:
- 設定の永続化（localStorage）
- テーマ管理
- 言語設定
- 置換ルール管理

### uiStore
**役割**: UI状態管理
```typescript
interface UiState {
  activeTab: string
  isLoading: boolean
  toasts: Toast[]
  errors: string[]
}
```

## 画像生成パイプライン

### 1. VIL解析
```
VIL File → VialDataProcessor → VialConfig
```

### 2. データ変換
```
VialConfig → ParsedVialProcessor → ParsedVial
                ↓
        Button Positions
        Layer Information
        Combo Information
        Tap Dance Information
```

### 3. 画像生成
```
ParsedVial → Canvas Generation → PNG/SVG
               ↓
         Apply Settings:
         - Theme (Dark/Light)
         - Language (EN/JP)
         - Replace Rules
         - Highlight Settings
```

### 4. 後処理
```
Generated Image → Metadata Embedding → Final Output
                   ↓
               VIL Configuration
               User Settings
               Generation Timestamp
```

## 主要アルゴリズム

### キー配置計算
```typescript
// Corne v4キーボードの物理的な配置
const positions = {
  0: { x: 0, y: 0, width: 50, height: 50 },
  1: { x: 55, y: 0, width: 50, height: 50 },
  // ... 42キー分の座標定義
}

// レイヤー情報から実際のキー配置を計算
function calculateKeyPosition(rowIndex: number, colIndex: number): Position {
  const physicalKey = positions[rowIndex][colIndex]
  return {
    x: physicalKey.x + OFFSET_X,
    y: physicalKey.y + OFFSET_Y,
    width: physicalKey.width,
    height: physicalKey.height
  }
}
```

### 言語変換
```typescript
// 英語→日本語キー変換
const keyMapping = {
  'KC_Q': 'KC_Q',      // Q → Q (変換なし)
  'KC_SCLN': 'KC_PLUS', // ; → + (変換あり)
  // ... マッピング定義
}

function convertLanguage(config: VialConfig, from: string, to: string): VialConfig {
  return processLayers(config.layers, keyMapping[from][to])
}
```

### メタデータ埋め込み
```typescript
// PNGチャンクにVIL設定を埋め込み
function embedMetadata(imageDataUrl: string, metadata: PngMetadata): string {
  const chunk = createCustomChunk('ytVl', JSON.stringify(metadata))
  return insertChunkToPng(imageDataUrl, chunk)
}
```

## パフォーマンス最適化

### 1. 画像生成の最適化
- **Canvas再利用**: 同じサイズのCanvasを再利用
- **レイヤーキャッシュ**: 変更されていないレイヤーはキャッシュ利用
- **遅延生成**: 表示されていない画像は遅延生成

### 2. メモリ管理
- **Canvas解放**: 不要なCanvasはすぐに解放
- **画像キャッシュ制限**: 最大保持数を制限
- **WeakMap使用**: 循環参照を避ける

### 3. バンドルサイズ最適化
- **動的インポート**: 大きなライブラリは必要時に読み込み
- **Tree Shaking**: 未使用コードの除去
- **Code Splitting**: ルート別分割

## セキュリティ

### 1. クライアントサイド処理
- **ファイル処理**: すべてブラウザ内で完結
- **外部通信なし**: VILファイルは外部送信されない
- **メタデータ**: 画像に埋め込まれるが暗号化なし

### 2. 入力検証
- **ファイル形式チェック**: `.vil`, `.png`のみ受け入れ
- **ファイルサイズ制限**: 10MB以下
- **JSON検証**: VIL設定の形式チェック

### 3. XSS対策
- **Vue.js標準**: テンプレートの自動エスケープ
- **DOMPurify**: 必要に応じてサニタイズ（現在未使用）

## 拡張性

### 1. 新しいキーボード対応
```typescript
// constants/keyboard.ts に追加
export const KEYBOARD_LAYOUTS = {
  corne_v4: { /* 定義 */ },
  new_keyboard: { /* 新しい定義 */ }
}
```

### 2. 新しい出力フォーマット
```typescript
// utils/に新しいレンダラー追加
export class NewFormatRenderer {
  generate(parsedVial: ParsedVial): OutputData
}
```

### 3. 新しい言語対応
```typescript
// data/keymaps/に新しい言語マッピング追加
new_language.tsv
```

## 今後の改善予定

### 1. 機能拡張
- より多くのキーボードレイアウト対応
- カスタムテーマエディタ
- アニメーション付きプレビュー

### 2. パフォーマンス
- WebWorkerを使った画像生成
- IndexedDBを使った大容量キャッシュ
- WebAssemblyを使った高速処理

### 3. ユーザビリティ
- ドラッグ&ドロップでのキー編集
- リアルタイムプレビュー強化
- 設定のインポート・エクスポート