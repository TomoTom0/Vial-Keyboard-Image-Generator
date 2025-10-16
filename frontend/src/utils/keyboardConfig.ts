// キーボード設定と配列データの管理
// 注意: キーマッピングデータは自動生成されたkeyboardConfig.generated.tsから読み込まれます

import {
  KEYBOARD_LANGUAGES,
  KEYBOARD_MAPPINGS,
  getCurrentKeyboardLanguage as getGeneratedCurrentKeyboardLanguage,
  setCurrentKeyboardLanguage as setGeneratedCurrentKeyboardLanguage,
  getKeyMapping as getGeneratedKeyMapping,
  getShiftMapping as getGeneratedShiftMapping,
  type KeyboardLanguage
} from './keyboardConfig.generated';
import { parseModifier, getModifierDisplayText } from './modifierParser';

export type { KeyboardLanguage };

export interface KeyboardStructure {
  id: string;
  name: string;
  displayName: string;
}

// 利用可能なキーボード言語（生成されたデータを使用）
export const keyboardLanguages: KeyboardLanguage[] = Object.values(KEYBOARD_LANGUAGES);

// 利用可能なキーボード構造
export const keyboardStructures: KeyboardStructure[] = [
  {
    id: 'corne_v4',
    name: 'corne_v4',
    displayName: 'Corne v4'
  },
  {
    id: 'cheapiano_v2',
    name: 'cheapiano_v2',
    displayName: 'Cheapiano v2'
  }
];

// 現在の言語設定を取得
export function getCurrentKeyboardLanguage(): KeyboardLanguage {
  const savedLanguageId = typeof window !== 'undefined' ? 
    localStorage.getItem('vial-keyboard-language') || 'japanese' : 'japanese';
  
  return KEYBOARD_LANGUAGES[savedLanguageId] || KEYBOARD_LANGUAGES.japanese;
}

// 言語設定を保存
export function setCurrentKeyboardLanguage(languageId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vial-keyboard-language', languageId);
  }
  setGeneratedCurrentKeyboardLanguage(languageId);
}

export function getCurrentStructure(): KeyboardStructure {
  // 現在はCorne v4固定
  return keyboardStructures.find(structure => structure.id === 'corne_v4') || keyboardStructures[0];
}

// 設定に基づいてキーマッピングを取得（generated関数を直接エクスポート）
export { getKeyMapping } from './keyboardConfig.generated';

// getSpecialKeys関数は廃止 - keyMappingに統一

// キーコードから表示文字を取得する共通関数
export function getCharacterFromKeycode(keycode: string, languageId: string): string | null {
  const keyMapping = getGeneratedKeyMapping(languageId);
  const shiftMapping = getGeneratedShiftMapping(languageId);

  // モディファイアパターンの処理（全モディファイア対応）
  const modifierInfo = parseModifier(keycode);
  if (modifierInfo) {
    return getModifierDisplayText(
      modifierInfo,
      shiftMapping,
      (innerKeycode) => getCharacterFromKeycode(innerKeycode, languageId) || innerKeycode
    );
  }

  // KC_プレフィックス付きの場合 - 直接keyMappingから検索
  if (keycode.startsWith('KC_')) {
    return keyMapping[keycode] || null;
  }

  // KC_プレフィックスがない場合は追加して検索
  const kcKeycode = `KC_${keycode}`;
  return keyMapping[kcKeycode] || null;
}

// キーコード変換比較：あるキーコードが2つの言語で同じ結果になるかチェック
export function compareKeycodeResult(keycode: string, languageId1: string, languageId2: string): boolean {
  const result1 = getCharacterFromKeycode(keycode, languageId1);
  const result2 = getCharacterFromKeycode(keycode, languageId2);
  return result1 === result2;
}

// 文字からキーコード逆引き：特定の文字を入力するのに必要なキーコードを取得
// 注意: L/Rの区別は逆変換時には判断できないため、常にL（左）を使用する
export function getKeycodeForCharacter(character: string, languageId: string): string | null {
  const keyMapping = getGeneratedKeyMapping(languageId);
  const shiftMapping = getGeneratedShiftMapping(languageId);

  // KC_付きキーマッピングから逆引き
  for (const [keycode, mappedChar] of Object.entries(keyMapping)) {
    if (mappedChar === character) {
      return keycode; // 既にKC_付きなのでそのまま返す
    }
  }

  // Shiftキー組み合わせから逆引き（常にLSFTを使用）
  for (const [keycode, shiftChar] of Object.entries(shiftMapping)) {
    if (shiftChar === character) {
      return `LSFT(${keycode})`;
    }
  }

  return null; // 見つからなかった場合
}

// 言語間キーコード変換：ある言語でのキーコードを別の言語で同じ文字を出力するキーコードに変換
export function getEquivalentKeycode(
  sourceLanguage: string,
  targetLanguage: string, 
  sourceKeycode: string
): string | null {
  // 元の言語でそのキーコードが出力する文字を取得
  const character = getCharacterFromKeycode(sourceKeycode, sourceLanguage);
  
  if (!character) {
    return null; // 元のキーコードが無効または文字が取得できない
  }
  
  // その文字を目標言語で出力するためのキーコードを取得
  const equivalentKeycode = getKeycodeForCharacter(character, targetLanguage);
  
  return equivalentKeycode;
}

// 複数のキーコードを一括変換
export function convertKeycodeList(
  sourceLanguage: string,
  targetLanguage: string,
  keycodes: string[]
): Array<{ original: string; converted: string | null; character: string | null }> {
  return keycodes.map(keycode => {
    const character = getCharacterFromKeycode(keycode, sourceLanguage);
    const converted = character ? getKeycodeForCharacter(character, targetLanguage) : null;
    
    return {
      original: keycode,
      converted,
      character
    };
  });
}