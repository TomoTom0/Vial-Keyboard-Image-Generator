# Chepiano v2 実装テストガイド

## 🎯 実装完了項目

### ✅ 完了した作業

1. **レイアウトファイル**: `frontend/data/layouts/chepiano_v2.tsv` (31キー)
2. **キーボード構造定義**: `keyboardStructures`配列にChepiano v2追加
3. **UI選択機能**: Sidebar > Settings > Layout でキーボード切り替え可能
4. **動的レンダリング**: `parsedVialProcessor.ts`で現在選択されている構造を使用
5. **設定永続化**: localStorage にキーボード選択状態を保存
6. **自動生成**: スクリプトで必要な設定ファイルを自動生成

### 📊 キー構成比較

| キーボード | 合計キー数 | 左手 | 右手 | 特徴 |
|-----------|-----------|------|------|------|
| Corne v4  | 45       | 22.5 | 22.5 | フル分割キーボード |
| Chepiano v2 | 39     | 18   | 21   | コンパクト分割 + 右側中央追加キー |

## 🧪 テスト手順

### 1. 開発サーバー起動
```bash
cd frontend
npm run dev
# http://localhost:5173 で確認
```

### 2. UI操作テスト

1. **Sidebarナビゲーション**:
   - 左側の歯車アイコン（Settings）をクリック

2. **キーボード構造選択**:
   - "Layout" セクションで左右矢印ボタンをクリック
   - "Corne v4" ↔ "Chepiano v2" 切り替え確認

3. **言語選択**:
   - 同じセクションで "Japanese" ↔ "English" 切り替え確認

4. **画像生成テスト**:
   - サンプルファイルで両方のキーボード構造の画像を確認
   - 実際の.vilファイルをアップロードして生成テスト

### 3. 期待される動作

- ✅ キーボード選択がスムーズに切り替わる
- ✅ 選択状態がブラウザ再読み込み後も保持される  
- ✅ Chepiano v2選択時に31キーのレイアウトで画像生成
- ✅ 座標位置が正しく表示される（コンパクトな配置）

### 4. トラブルシューティング

**キーボード選択が表示されない場合**:
- ブラウザの開発者ツールでコンソールエラーを確認
- `npm run generate-mappings` でマッピングファイル再生成

**画像が正しく生成されない場合**:
- localStorage をクリアして初期状態で再テスト
- ネットワークタブで必要なファイルが読み込まれているか確認

## 📂 実装ファイル

### 作成・更新されたファイル

1. **`frontend/data/layouts/chepiano_v2.tsv`** - キー配置定義
2. **`frontend/src/utils/keyboardConfig.ts`** - 構造定義とUI関数
3. **`frontend/src/components/KeyboardTab.vue`** - UI選択コンポーネント  
4. **`frontend/src/utils/parsedVialProcessor.ts`** - 動的構造取得
5. **`frontend/src/utils/keyboardConfig.generated.ts`** - 自動生成設定

### 座標範囲

- **X座標**: 20.0 ～ 885.0 (コンパクトな横幅)
- **Y座標**: 20.0 ～ 212.0 (4行構造)
- **キーサイズ**: 78×60px (標準), 117×60px (ワイドキー)

## 🚀 今後の拡張

この実装パターンで他のキーボード追加も可能:
1. TSVファイル作成（キー座標定義）
2. keyboardStructures配列に追加
3. generate-mappingsスクリプト実行
4. 自動でUI選択肢に反映