// キーボード設定と配列データの管理

export interface KeyboardLanguage {
  id: string;
  name: string;
  keyMapping: { [key: string]: string };
  specialKeys: { [key: string]: string };
  shiftMapping: { [key: string]: string };
}

export interface KeyboardStructure {
  id: string;
  name: string;
  displayName: string;
}

// 日本語配列のキーマッピング（すべてKC_付き）
const japaneseKeyMapping = {
  // アルファベット
  'KC_A': 'A', 'KC_B': 'B', 'KC_C': 'C', 'KC_D': 'D', 'KC_E': 'E', 'KC_F': 'F', 'KC_G': 'G', 'KC_H': 'H', 'KC_I': 'I', 'KC_J': 'J',
  'KC_K': 'K', 'KC_L': 'L', 'KC_M': 'M', 'KC_N': 'N', 'KC_O': 'O', 'KC_P': 'P', 'KC_Q': 'Q', 'KC_R': 'R', 'KC_S': 'S',
  'KC_T': 'T', 'KC_U': 'U', 'KC_V': 'V', 'KC_W': 'W', 'KC_X': 'X', 'KC_Y': 'Y', 'KC_Z': 'Z',
  // 数字
  'KC_1': '1', 'KC_2': '2', 'KC_3': '3', 'KC_4': '4', 'KC_5': '5', 'KC_6': '6', 'KC_7': '7', 'KC_8': '8', 'KC_9': '9', 'KC_0': '0',
  // 特殊キー
  'KC_ENTER': 'Enter', 'KC_ESC': 'Esc', 'KC_ESCAPE': 'Esc', 'KC_BSPACE': 'Bksp', 'KC_TAB': 'Tab', 'KC_SPACE': 'Space',
  // 記号 - JIS配列対応
  'KC_MINUS': '-', 'KC_EQUAL': '^', 'KC_BSLASH': '\\', 
  'KC_AT': '@', 'KC_LBRACKET': '@', 'KC_RBRACKET': '[',
  'KC_SCOLON': ';', 'KC_QUOTE': ':', 'KC_GRAVE': '半角/全角', 
  'KC_COMMA': ',', 'KC_DOT': '.', 'KC_SLASH': '/',
  // 日本語配列特殊キー
  'KC_NONUS_HASH': ']',     // KC_NONUS_HASH → ] (大カッコ閉じる)
  'KC_RO': '\\',            // RO (日本語配列の\キー)
  'KC_INT1': '_',           // 日本語配列のアンダーバー位置
  'KC_INT3': '\\',          // 日本語配列のバックスラッシュ
  'KC_CAPSLOCK': 'Caps', 'KC_PSCREEN': 'PrtScr',
  // 修飾キー
  'KC_LCTRL': 'LCtrl', 'KC_LSHIFT': 'LShift', 'KC_LALT': 'LAlt', 'KC_LGUI': 'LGui',
  'KC_RCTRL': 'RCtrl', 'KC_RSHIFT': 'RShift', 'KC_RALT': 'RAlt', 'KC_RGUI': 'RGui',
  // ファンクションキー
  'KC_F1': 'F1', 'KC_F2': 'F2', 'KC_F3': 'F3', 'KC_F4': 'F4', 'KC_F5': 'F5', 'KC_F6': 'F6',
  'KC_F7': 'F7', 'KC_F8': 'F8', 'KC_F9': 'F9', 'KC_F10': 'F10', 'KC_F11': 'F11', 'KC_F12': 'F12',
  // 矢印キー
  'KC_UP': '↑', 'KC_DOWN': '↓', 'KC_LEFT': '←', 'KC_RIGHT': '→',
  // ナビゲーションキー
  'KC_HOME': 'Home', 'KC_END': 'End', 'KC_PGUP': 'PgUp', 'KC_PGDN': 'PgDn',
  'KC_INSERT': 'Ins', 'KC_DELETE': 'Del',
  // テンキー
  'KC_KP_0': '0', 'KC_KP_1': '1', 'KC_KP_2': '2', 'KC_KP_3': '3', 'KC_KP_4': '4',
  'KC_KP_5': '5', 'KC_KP_6': '6', 'KC_KP_7': '7', 'KC_KP_8': '8', 'KC_KP_9': '9',
  'KC_KP_DOT': '.', 'KC_KP_SLASH': '/', 'KC_KP_ASTERISK': '*', 'KC_KP_MINUS': '-',
  'KC_KP_PLUS': '+', 'KC_KP_EQUAL': '=', 'KC_KP_ENTER': 'Enter', 'KC_KP_COMMA': ',',
  // 日本語キー
  'KC_MHEN': '無変換', 'KC_HENK': '変換', 'KC_KANA': 'カナ',
  'KC_ZKHK': '半角/全角', 'KC_HANJ': '半角/全角',
  'KC_JYEN': '¥',              // 円記号キー
  // 特殊キー
  'KC_NO': '',                 // 空きボタン
  'KC_TRNS': '▽'               // 透過キー
};

// 日本語配列のShiftキー組み合わせマッピング（一貫性のためKC_プレフィックス付き）
const japaneseShiftMapping = {
  // 数字キー - JIS配列での実際の出力
  'KC_1': '!', 'KC_2': '"', 'KC_3': '#', 'KC_4': '$', 'KC_5': '%',
  'KC_6': '&', 'KC_7': "'", 'KC_8': '(', 'KC_9': ')', 'KC_0': '0',
  // 記号キー
  'KC_MINUS': '=', 'KC_EQUAL': '~', 'KC_LBRACKET': '`', 'KC_RBRACKET': '{',
  'KC_BSLASH': '|', 'KC_SCOLON': '+', 'KC_QUOTE': '*', 'KC_COMMA': '<',
  'KC_DOT': '>', 'KC_SLASH': '?', 'KC_GRAVE': '~', 'KC_NONUS_HASH': '}',
  'KC_RO': '_', 'KC_JYEN': '|'
};

// 英字配列のキーマッピング（すべてKC_付き）
const englishKeyMapping = {
  // アルファベット
  'KC_A': 'A', 'KC_B': 'B', 'KC_C': 'C', 'KC_D': 'D', 'KC_E': 'E', 'KC_F': 'F', 'KC_G': 'G', 'KC_H': 'H', 'KC_I': 'I', 'KC_J': 'J',
  'KC_K': 'K', 'KC_L': 'L', 'KC_M': 'M', 'KC_N': 'N', 'KC_O': 'O', 'KC_P': 'P', 'KC_Q': 'Q', 'KC_R': 'R', 'KC_S': 'S',
  'KC_T': 'T', 'KC_U': 'U', 'KC_V': 'V', 'KC_W': 'W', 'KC_X': 'X', 'KC_Y': 'Y', 'KC_Z': 'Z',
  // 数字
  'KC_1': '1', 'KC_2': '2', 'KC_3': '3', 'KC_4': '4', 'KC_5': '5', 'KC_6': '6', 'KC_7': '7', 'KC_8': '8', 'KC_9': '9', 'KC_0': '0',
  // 特殊キー
  'KC_ENTER': 'Enter', 'KC_ESC': 'Esc', 'KC_ESCAPE': 'Esc', 'KC_BSPACE': 'Bksp', 'KC_TAB': 'Tab', 'KC_SPACE': 'Space',
  // 記号 - US配列対応
  'KC_MINUS': '-', 'KC_EQUAL': '=', 'KC_BSLASH': '\\',
  'KC_LBRACKET': '[', 'KC_RBRACKET': ']',
  'KC_SCOLON': ';', 'KC_QUOTE': "'", 'KC_GRAVE': '`',
  'KC_COMMA': ',', 'KC_DOT': '.', 'KC_SLASH': '/',
  // US配列特殊キー
  'KC_NONUS_HASH': '#',     // KC_NONUS_HASH → # (US配列)
  'KC_RO': 'RO',            // ROキー (英字配列では特殊処理なし)
  'KC_INT1': 'INT1',        // 英字配列では特殊処理なし
  'KC_INT3': 'INT3',        // 英字配列では特殊処理なし
  'KC_CAPSLOCK': 'Caps', 'KC_PSCREEN': 'PrtScr',
  // 修飾キー
  'KC_LCTRL': 'LCtrl', 'KC_LSHIFT': 'LShift', 'KC_LALT': 'LAlt', 'KC_LGUI': 'LGui',
  'KC_RCTRL': 'RCtrl', 'KC_RSHIFT': 'RShift', 'KC_RALT': 'RAlt', 'KC_RGUI': 'RGui',
  // ファンクションキー
  'KC_F1': 'F1', 'KC_F2': 'F2', 'KC_F3': 'F3', 'KC_F4': 'F4', 'KC_F5': 'F5', 'KC_F6': 'F6',
  'KC_F7': 'F7', 'KC_F8': 'F8', 'KC_F9': 'F9', 'KC_F10': 'F10', 'KC_F11': 'F11', 'KC_F12': 'F12',
  // 矢印キー
  'KC_UP': '↑', 'KC_DOWN': '↓', 'KC_LEFT': '←', 'KC_RIGHT': '→',
  // ナビゲーションキー
  'KC_HOME': 'Home', 'KC_END': 'End', 'KC_PGUP': 'PgUp', 'KC_PGDN': 'PgDn',
  'KC_INSERT': 'Ins', 'KC_DELETE': 'Del',
  // テンキー
  'KC_KP_0': '0', 'KC_KP_1': '1', 'KC_KP_2': '2', 'KC_KP_3': '3', 'KC_KP_4': '4',
  'KC_KP_5': '5', 'KC_KP_6': '6', 'KC_KP_7': '7', 'KC_KP_8': '8', 'KC_KP_9': '9',
  'KC_KP_DOT': '.', 'KC_KP_SLASH': '/', 'KC_KP_ASTERISK': '*', 'KC_KP_MINUS': '-',
  'KC_KP_PLUS': '+', 'KC_KP_EQUAL': '=', 'KC_KP_ENTER': 'Enter', 'KC_KP_COMMA': ',',
  // 日本語キー（英字配列では使用されない）
  'KC_MHEN': 'MHEN', 'KC_HENK': 'HENK', 'KC_KANA': 'KANA',
  // 特殊キー
  'KC_NO': '',                 // 空きボタン
  'KC_TRNS': '▽'               // 透過キー
};

// 英字配列のShiftキー組み合わせマッピング（一貫性のためKC_プレフィックス付き）
const englishShiftMapping = {
  // 数字キー - US配列での実際の出力
  'KC_1': '!', 'KC_2': '@', 'KC_3': '#', 'KC_4': '$', 'KC_5': '%',
  'KC_6': '^', 'KC_7': '&', 'KC_8': '*', 'KC_9': '(', 'KC_0': ')',
  // 記号キー
  'KC_MINUS': '_', 'KC_EQUAL': '+', 'KC_LBRACKET': '{', 'KC_RBRACKET': '}',
  'KC_BSLASH': '|', 'KC_SCOLON': ':', 'KC_QUOTE': '"', 'KC_COMMA': '<',
  'KC_DOT': '>', 'KC_SLASH': '?', 'KC_GRAVE': '~', 'KC_NONUS_HASH': '~',
  'KC_RO': '_'
};

// specialKeysは廃止 - すべてkeyMappingに統一


// 利用可能なキーボード言語
export const keyboardLanguages: KeyboardLanguage[] = [
  {
    id: 'japanese',
    name: 'Japanese',
    keyMapping: japaneseKeyMapping,
    specialKeys: {}, // 廃止
    shiftMapping: japaneseShiftMapping
  },
  {
    id: 'english',
    name: 'English',
    keyMapping: englishKeyMapping,
    specialKeys: {}, // 廃止
    shiftMapping: englishShiftMapping
  }
];

// 利用可能なキーボード構造
export const keyboardStructures: KeyboardStructure[] = [
  {
    id: 'corne_v4',
    name: 'corne_v4',
    displayName: 'Corne v4'
  }
];

// 現在の言語設定を取得
export function getCurrentKeyboardLanguage(): KeyboardLanguage {
  const savedLanguageId = typeof window !== 'undefined' ? 
    localStorage.getItem('vial-keyboard-language') || 'japanese' : 'japanese';
  
  const language = keyboardLanguages.find(lang => lang.id === savedLanguageId) || keyboardLanguages[0];
  
  return language;
}

// 言語設定を保存
export function setCurrentKeyboardLanguage(languageId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vial-keyboard-language', languageId);
  }
}

export function getCurrentStructure(): KeyboardStructure {
  // 現在はCorne v4固定
  return keyboardStructures.find(structure => structure.id === 'corne_v4') || keyboardStructures[0];
}

// 設定に基づいてキーマッピングを取得
export function getKeyMapping(languageId: string = 'japanese'): { [key: string]: string } {
  const language = keyboardLanguages.find(l => l.id === languageId);
  return language ? language.keyMapping : japaneseKeyMapping;
}

// getSpecialKeys関数は廃止 - keyMappingに統一

// キーコードから表示文字を取得する共通関数
export function getCharacterFromKeycode(keycode: string, languageId: string): string | null {
  const language = keyboardLanguages.find(l => l.id === languageId);
  if (!language) return null;

  // LSFT(KC_XXX)の処理
  if (keycode.startsWith('LSFT(KC_')) {
    const match = keycode.match(/LSFT\(KC_(.+)\)/);
    if (match) {
      return language.shiftMapping[match[1]] || null;
    }
  }

  // KC_プレフィックス付きの場合 - 直接keyMappingから検索
  if (keycode.startsWith('KC_')) {
    return language.keyMapping[keycode] || null;
  }

  // KC_プレフィックスがない場合は追加して検索
  const kcKeycode = `KC_${keycode}`;
  return language.keyMapping[kcKeycode] || null;
}

// キーコード変換比較：あるキーコードが2つの言語で同じ結果になるかチェック
export function compareKeycodeResult(keycode: string, languageId1: string, languageId2: string): boolean {
  const result1 = getCharacterFromKeycode(keycode, languageId1);
  const result2 = getCharacterFromKeycode(keycode, languageId2);
  return result1 === result2;
}

// 文字からキーコード逆引き：特定の文字を入力するのに必要なキーコードを取得
export function getKeycodeForCharacter(character: string, languageId: string): string | null {
  const language = keyboardLanguages.find(l => l.id === languageId);
  if (!language) {
    return null;
  }
  
  // KC_付きキーマッピングから逆引き
  for (const [keycode, mappedChar] of Object.entries(language.keyMapping)) {
    if (mappedChar === character) {
      return keycode; // 既にKC_付きなのでそのまま返す
    }
  }
  
  // Shiftキー組み合わせから逆引き
  for (const [keycode, shiftChar] of Object.entries(language.shiftMapping)) {
    if (shiftChar === character) {
      return `LSFT(KC_${keycode})`;
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