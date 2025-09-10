// キーボード描画に関する共通定数
export const KEYBOARD_CONSTANTS = {
  // キーサイズ
  keyWidth: 78,
  keyHeight: 60,
  keyGap: 4,
  
  // レイアウト
  margin: 20,
  
  // 計算値
  get unitX() { return this.keyWidth + this.keyGap },
  get unitY() { return this.keyHeight + this.keyGap }
} as const

// 型エクスポート（必要に応じて）
export type KeyboardConstants = typeof KEYBOARD_CONSTANTS