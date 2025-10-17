/**
 * モディファイアキーコード解析ユーティリティ
 *
 * QMKのモディファイアキーコードを解析し、表示テキストを生成する共通関数群
 *
 * 対応するパターン:
 * - Modifier Tap形式: (L|R)(SFT|CTL|ALT|GUI)_T(KC_XXX)
 * - Direct Modifier形式: (L|R)(SFT|CTL|ALT|GUI)(KC_XXX)
 */

/**
 * モディファイアの種類
 */
export type ModifierType = 'SFT' | 'CTL' | 'ALT' | 'GUI';

/**
 * モディファイアの左右
 */
export type ModifierSide = 'L' | 'R';

/**
 * モディファイア形式の種類
 */
export type ModifierFormat = 'modifier_tap' | 'direct_modifier';

/**
 * モディファイア解析結果
 */
export interface ModifierInfo {
  /** モディファイア形式 */
  format: ModifierFormat;
  /** 左右 */
  side: ModifierSide;
  /** モディファイアの種類 */
  mod: ModifierType;
  /** 内部キーコード */
  innerKeycode: string;
}

/**
 * キーコードがモディファイアパターンかどうかを判定し、解析する
 *
 * @param keycode - 解析対象のキーコード
 * @returns 解析結果。モディファイアパターンでない場合は null
 *
 * @example
 * parseModifier('LSFT_T(KC_A)') // { format: 'modifier_tap', side: 'L', mod: 'SFT', innerKeycode: 'KC_A' }
 * parseModifier('RSFT(KC_A)')   // { format: 'direct_modifier', side: 'R', mod: 'SFT', innerKeycode: 'KC_A' }
 * parseModifier('KC_A')         // null
 */
export function parseModifier(keycode: string): ModifierInfo | null {
  // Modifier Tap形式: (L|R)(SFT|CTL|ALT|GUI)_T(KC_XXX)
  const modTapMatch = keycode.match(/^([LR])(SFT|CTL|ALT|GUI)_T\((.+)\)$/);
  if (modTapMatch) {
    return {
      format: 'modifier_tap',
      side: modTapMatch[1] as ModifierSide,
      mod: modTapMatch[2] as ModifierType,
      innerKeycode: modTapMatch[3],
    };
  }

  // Direct Modifier形式: (L|R)(SFT|CTL|ALT|GUI)(KC_XXX)
  const directModMatch = keycode.match(/^([LR])(SFT|CTL|ALT|GUI)\((.+)\)$/);
  if (directModMatch) {
    return {
      format: 'direct_modifier',
      side: directModMatch[1] as ModifierSide,
      mod: directModMatch[2] as ModifierType,
      innerKeycode: directModMatch[3],
    };
  }

  return null;
}

/**
 * モディファイア情報から表示テキストを生成する
 *
 * @param info - モディファイア解析結果
 * @param shiftMapping - Shiftマッピング定義（KC_A: '!' など）
 * @param getCharFromKeycode - キーコードから文字を取得する関数（再帰処理用）
 * @returns 表示テキスト
 *
 * @example
 * const info = { format: 'direct_modifier', side: 'L', mod: 'SFT', innerKeycode: 'KC_A' };
 * getModifierDisplayText(info, { 'KC_A': '!' }, (kc) => 'a') // '!'
 */
export function getModifierDisplayText(
  info: ModifierInfo,
  shiftMapping: Record<string, string>,
  getCharFromKeycode: (keycode: string) => string
): string {
  const { mod, innerKeycode } = info;

  // SFT の場合は shiftMapping を使用
  if (mod === 'SFT') {
    if (shiftMapping[innerKeycode]) {
      return shiftMapping[innerKeycode];
    }
  }

  // その他のモディファイア（CTL/ALT/GUI）の場合は内部キーコードを再帰的に解析
  return getCharFromKeycode(innerKeycode);
}

/**
 * 文字からモディファイアキーコードを生成する
 *
 * 注意: L/R の区別は逆変換時には判断できないため、常に L（左）を使用する
 *
 * @param baseKeycode - ベースキーコード（例: 'KC_A'）
 * @param mod - モディファイアの種類
 * @param format - モディファイア形式
 * @param side - 左右（省略時は 'L'）
 * @returns モディファイアキーコード
 *
 * @example
 * buildModifierKeycode('KC_A', 'SFT', 'direct_modifier') // 'LSFT(KC_A)'
 * buildModifierKeycode('KC_A', 'SFT', 'modifier_tap', 'R') // 'RSFT_T(KC_A)'
 */
export function buildModifierKeycode(
  baseKeycode: string,
  mod: ModifierType,
  format: ModifierFormat,
  side: ModifierSide = 'L'
): string {
  if (format === 'modifier_tap') {
    return `${side}${mod}_T(${baseKeycode})`;
  } else {
    return `${side}${mod}(${baseKeycode})`;
  }
}

/**
 * モディファイア名の表示用テキストを取得
 *
 * @param mod - モディファイアの種類
 * @param side - 左右
 * @returns 表示用テキスト（例: 'LShift', 'RCtrl'）
 */
export function getModifierName(mod: ModifierType, side: ModifierSide): string {
  const modNames: Record<ModifierType, string> = {
    SFT: 'Shift',
    CTL: 'Ctrl',
    ALT: 'Alt',
    GUI: 'GUI',
  };
  return `${side}${modNames[mod]}`;
}
