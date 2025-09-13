# Vial Keyboard Image Generator - Frontend

キーボード画像生成アプリのフロントエンドです。Vue 3 + TypeScript + Viteを使用しています。

## TSVベースのキーマッピング管理

キーボードマッピング情報はTSVファイルで管理され、ビルド時に自動的にTypeScriptファイルが生成されます。

### ファイル構成

```
frontend/data/keymaps/
├── common.tsv      # 英字配列（US配列）ベースの共通マッピング
├── japanese.tsv    # 日本語配列（JIS配列）の差分
└── korean.tsv      # 韓国語配列の差分（将来用）
```

### TSVファイル形式

```tsv
keycode	display	shift_display	description
KC_A	A		Alphabet A
KC_2	2	@	Number 2 (US layout)
```

### ビルドプロセス

```bash
# キーマッピングを生成
npm run generate-mappings

# ビルド（自動的にマッピング生成を含む）
npm run build

# 開発サーバー起動
npm run dev
```

### 新しい言語配列の追加

1. `data/keymaps/newlang.tsv`を作成
2. `scripts/generate-keyboard-mappings.cjs`に言語設定を追加
3. `npm run generate-mappings`を実行

### 生成されるファイル

- `src/utils/keyboardConfig.generated.ts` - 自動生成（直接編集禁止）
