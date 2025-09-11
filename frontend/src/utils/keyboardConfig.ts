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

// 日本語配列のキーマッピング
const japaneseKeyMapping = {
  // アルファベット
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
  'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S',
  'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
  // 数字
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
  // 特殊キー
  'ENTER': 'Enter', 'ESC': 'Esc', 'ESCAPE': 'Esc', 'BSPACE': 'Bksp', 'TAB': 'Tab', 'SPACE': 'Space',
  // 記号 - JIS配列対応
  'MINUS': '-', 'EQUAL': '^', 'BSLASH': '\\', 
  'AT': '@', 'LBRACKET': '@', 'RBRACKET': '[',
  'SCOLON': ';', 'QUOTE': ':', 'GRAVE': '`', 
  'COMMA': ',', 'DOT': '.', 'SLASH': '/',
  // 日本語配列特殊キー
  'NONUS_HASH': ']',     // KC_NONUS_HASH → ] (大カッコ閉じる)
  'RO': '\\',            // RO (日本語配列の\キー)
  'INT1': '_',           // 日本語配列のアンダーバー位置
  'INT3': '\\',          // 日本語配列のバックスラッシュ
  'CAPSLOCK': 'Caps', 'PSCREEN': 'PrtScr',
  // 修飾キー
  'LCTRL': 'LCtrl', 'LSHIFT': 'LShift', 'LALT': 'LAlt', 'LGUI': 'LGui',
  'RCTRL': 'RCtrl', 'RSHIFT': 'RShift', 'RALT': 'RAlt', 'RGUI': 'RGui',
  // ファンクションキー
  'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
  'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
  // 矢印キー
  'UP': '↑', 'DOWN': '↓', 'LEFT': '←', 'RIGHT': '→',
  // ナビゲーションキー
  'HOME': 'Home', 'END': 'End', 'PGUP': 'PgUp', 'PGDN': 'PgDn',
  'INSERT': 'Ins', 'DELETE': 'Del',
  // テンキー
  'KP_0': '0', 'KP_1': '1', 'KP_2': '2', 'KP_3': '3', 'KP_4': '4',
  'KP_5': '5', 'KP_6': '6', 'KP_7': '7', 'KP_8': '8', 'KP_9': '9',
  'KP_DOT': '.', 'KP_SLASH': '/', 'KP_ASTERISK': '*', 'KP_MINUS': '-',
  'KP_PLUS': '+', 'KP_EQUAL': '=', 'KP_ENTER': 'Enter', 'KP_COMMA': ',',
  // 日本語キー
  'MHEN': 'MHEN', 'HENK': 'HENK', 'KANA': 'KANA',
  // 透過キー
  'TRNS': '▽'
};

// 日本語配列のShiftキー組み合わせマッピング
const japaneseShiftMapping = {
  // 数字キー - JIS配列での実際の出力
  '1': '!', '2': '"', '3': '#', '4': '$', '5': '%',
  '6': '&', '7': "'", '8': '(', '9': ')', '0': '0',
  // 記号キー
  'MINUS': '=', 'EQUAL': '~', 'LBRACKET': '`', 'RBRACKET': '{',
  'BSLASH': '|', 'SCOLON': '+', 'QUOTE': '*', 'COMMA': '<',
  'DOT': '>', 'SLASH': '?', 'GRAVE': '~', 'NONUS_HASH': '}',
  'RO': '_', 'JYEN': '|'
};

// 英字配列のキーマッピング
const englishKeyMapping = {
  // アルファベット
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
  'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S',
  'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
  // 数字
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
  // 特殊キー
  'ENTER': 'Enter', 'ESC': 'Esc', 'ESCAPE': 'Esc', 'BSPACE': 'Bksp', 'TAB': 'Tab', 'SPACE': 'Space',
  // 記号 - US配列対応
  'MINUS': '-', 'EQUAL': '=', 'BSLASH': '\\',
  'LBRACKET': '[', 'RBRACKET': ']',
  'SCOLON': ';', 'QUOTE': "'", 'GRAVE': '`',
  'COMMA': ',', 'DOT': '.', 'SLASH': '/',
  // US配列特殊キー
  'NONUS_HASH': '#',     // KC_NONUS_HASH → # (US配列)
  'RO': 'RO',            // ROキー (英字配列では特殊処理なし)
  'INT1': 'INT1',        // 英字配列では特殊処理なし
  'INT3': 'INT3',        // 英字配列では特殊処理なし
  'CAPSLOCK': 'Caps', 'PSCREEN': 'PrtScr',
  // 修飾キー
  'LCTRL': 'LCtrl', 'LSHIFT': 'LShift', 'LALT': 'LAlt', 'LGUI': 'LGui',
  'RCTRL': 'RCtrl', 'RSHIFT': 'RShift', 'RALT': 'RAlt', 'RGUI': 'RGui',
  // ファンクションキー
  'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
  'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
  // 矢印キー
  'UP': '↑', 'DOWN': '↓', 'LEFT': '←', 'RIGHT': '→',
  // ナビゲーションキー
  'HOME': 'Home', 'END': 'End', 'PGUP': 'PgUp', 'PGDN': 'PgDn',
  'INSERT': 'Ins', 'DELETE': 'Del',
  // テンキー
  'KP_0': '0', 'KP_1': '1', 'KP_2': '2', 'KP_3': '3', 'KP_4': '4',
  'KP_5': '5', 'KP_6': '6', 'KP_7': '7', 'KP_8': '8', 'KP_9': '9',
  'KP_DOT': '.', 'KP_SLASH': '/', 'KP_ASTERISK': '*', 'KP_MINUS': '-',
  'KP_PLUS': '+', 'KP_EQUAL': '=', 'KP_ENTER': 'Enter', 'KP_COMMA': ',',
  // 日本語キー（英字配列では使用されない）
  'MHEN': 'MHEN', 'HENK': 'HENK', 'KANA': 'KANA',
  // 透過キー
  'TRNS': '▽'
};

// 英字配列のShiftキー組み合わせマッピング
const englishShiftMapping = {
  // 数字キー - US配列での実際の出力
  '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
  '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
  // 記号キー
  'MINUS': '_', 'EQUAL': '+', 'LBRACKET': '{', 'RBRACKET': '}',
  'BSLASH': '|', 'SCOLON': ':', 'QUOTE': '"', 'COMMA': '<',
  'DOT': '>', 'SLASH': '?', 'GRAVE': '~', 'NONUS_HASH': '~',
  'RO': '_'
};

// 日本語配列の特殊キー処理
const japaneseSpecialKeys = {
  'KC_NONUS_HASH': ']',
  'KC_RO': '\\',
  'KC_JYEN': '\\',
  'NONUS_HASH': ']',
  'RO': '\\',
  'JYEN': '\\'
};

// 英字配列の特殊キー処理
const englishSpecialKeys = {
  'KC_NONUS_HASH': '#',
  'KC_RO': 'RO', 
  'KC_JYEN': 'JYEN',
  'NONUS_HASH': '#',
  'RO': 'RO',
  'JYEN': 'JYEN'
};

console.log('🚨 englishSpecialKeys defined:', englishSpecialKeys);

// 利用可能なキーボード言語
export const keyboardLanguages: KeyboardLanguage[] = [
  {
    id: 'japanese',
    name: 'Japanese',
    keyMapping: japaneseKeyMapping,
    specialKeys: japaneseSpecialKeys,
    shiftMapping: japaneseShiftMapping
  },
  {
    id: 'english',
    name: 'English',
    keyMapping: englishKeyMapping,
    specialKeys: englishSpecialKeys,
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
  
  console.log(`🔍 getCurrentKeyboardLanguage: savedLanguageId="${savedLanguageId}"`);
  console.log(`🔍 Available keyboardLanguages:`, keyboardLanguages.map(l => l.id));
  
  const language = keyboardLanguages.find(lang => lang.id === savedLanguageId) || keyboardLanguages[0];
  console.log(`🔍 getCurrentKeyboardLanguage: returning language="${language.id}"`);
  console.log(`🔍 Language specialKeys:`, language.specialKeys);
  console.log(`🔍 KC_NONUS_HASH in specialKeys:`, language.specialKeys['KC_NONUS_HASH']);
  
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

// 設定に基づいて特殊キー処理を取得
export function getSpecialKeys(languageId: string = 'japanese'): { [key: string]: string } {
  const language = keyboardLanguages.find(l => l.id === languageId);
  return language ? language.specialKeys : japaneseSpecialKeys;
}