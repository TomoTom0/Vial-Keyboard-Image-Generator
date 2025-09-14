// 自動生成されたファイル - 直接編集しないでください
// 生成日時: 2025-09-14T16:37:56.463Z

export interface KeyboardLanguage {
  id: string;
  name: string;
  keyMapping: { [key: string]: string };
  specialKeys: { [key: string]: string };
  shiftMapping: { [key: string]: string };
}

export interface KeyPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layoutRow: number;
  layoutCol: number;
  description: string;
}

export interface KeyboardLayout {
  id: string;
  name: string;
  positions: (KeyPosition | null)[][];
}

// キーボードマッピングデータ
export const KEYBOARD_MAPPINGS = {
  english: {
    keyMapping: {
    "KC_A": "A",
    "KC_B": "B",
    "KC_C": "C",
    "KC_D": "D",
    "KC_E": "E",
    "KC_F": "F",
    "KC_G": "G",
    "KC_H": "H",
    "KC_I": "I",
    "KC_J": "J",
    "KC_K": "K",
    "KC_L": "L",
    "KC_M": "M",
    "KC_N": "N",
    "KC_O": "O",
    "KC_P": "P",
    "KC_Q": "Q",
    "KC_R": "R",
    "KC_S": "S",
    "KC_T": "T",
    "KC_U": "U",
    "KC_V": "V",
    "KC_W": "W",
    "KC_X": "X",
    "KC_Y": "Y",
    "KC_Z": "Z",
    "KC_1": "1",
    "KC_2": "2",
    "KC_3": "3",
    "KC_4": "4",
    "KC_5": "5",
    "KC_6": "6",
    "KC_7": "7",
    "KC_8": "8",
    "KC_9": "9",
    "KC_0": "0",
    "KC_ENTER": "Enter",
    "KC_ESC": "Esc",
    "KC_ESCAPE": "Esc",
    "KC_BSPACE": "Bksp",
    "KC_TAB": "Tab",
    "KC_SPACE": "Space",
    "KC_MINUS": "-",
    "KC_EQUAL": "=",
    "KC_LBRACKET": "[",
    "KC_RBRACKET": "]",
    "KC_BSLASH": "\\",
    "KC_SCOLON": ";",
    "KC_QUOTE": "'",
    "KC_GRAVE": "`",
    "KC_COMMA": ",",
    "KC_DOT": ".",
    "KC_SLASH": "/",
    "KC_NONUS_HASH": "#",
    "KC_RO": "RO",
    "KC_INT1": "INT1",
    "KC_INT3": "INT3",
    "KC_CAPSLOCK": "Caps",
    "KC_PSCREEN": "PrtScr",
    "KC_LCTRL": "LCtrl",
    "KC_LSHIFT": "LShift",
    "KC_LALT": "LAlt",
    "KC_LGUI": "LGui",
    "KC_RCTRL": "RCtrl",
    "KC_RSHIFT": "RShift",
    "KC_RALT": "RAlt",
    "KC_RGUI": "RGui",
    "KC_F1": "F1",
    "KC_F2": "F2",
    "KC_F3": "F3",
    "KC_F4": "F4",
    "KC_F5": "F5",
    "KC_F6": "F6",
    "KC_F7": "F7",
    "KC_F8": "F8",
    "KC_F9": "F9",
    "KC_F10": "F10",
    "KC_F11": "F11",
    "KC_F12": "F12",
    "KC_UP": "↑",
    "KC_DOWN": "↓",
    "KC_LEFT": "←",
    "KC_RIGHT": "→",
    "KC_HOME": "Home",
    "KC_END": "End",
    "KC_PGUP": "PgUp",
    "KC_PGDN": "PgDn",
    "KC_INSERT": "Ins",
    "KC_DELETE": "Del",
    "KC_KP_0": "0",
    "KC_KP_1": "1",
    "KC_KP_2": "2",
    "KC_KP_3": "3",
    "KC_KP_4": "4",
    "KC_KP_5": "5",
    "KC_KP_6": "6",
    "KC_KP_7": "7",
    "KC_KP_8": "8",
    "KC_KP_9": "9",
    "KC_KP_DOT": ".",
    "KC_KP_SLASH": "/",
    "KC_KP_ASTERISK": "*",
    "KC_KP_MINUS": "-",
    "KC_KP_PLUS": "+",
    "KC_KP_EQUAL": "=",
    "KC_KP_ENTER": "Enter",
    "KC_KP_COMMA": ",",
    "KC_MHEN": "MHEN",
    "KC_HENK": "HENK",
    "KC_KANA": "KANA",
    "KC_LANG1": "LANG1",
    "KC_LANG2": "LANG2",
    "KC_NO": "",
    "KC_TRNS": "▽"
},
    shiftMapping: {
    "KC_1": "!",
    "KC_2": "@",
    "KC_3": "#",
    "KC_4": "$",
    "KC_5": "%",
    "KC_6": "^",
    "KC_7": "&",
    "KC_8": "*",
    "KC_9": "(",
    "KC_0": ")",
    "KC_MINUS": "_",
    "KC_EQUAL": "+",
    "KC_LBRACKET": "{",
    "KC_RBRACKET": "}",
    "KC_BSLASH": "|",
    "KC_SCOLON": ":",
    "KC_QUOTE": "\"",
    "KC_GRAVE": "~",
    "KC_COMMA": "<",
    "KC_DOT": ">",
    "KC_SLASH": "?",
    "KC_NONUS_HASH": "~",
    "KC_RO": "_"
}
  },
  japanese: {
    keyMapping: {
    "KC_A": "A",
    "KC_B": "B",
    "KC_C": "C",
    "KC_D": "D",
    "KC_E": "E",
    "KC_F": "F",
    "KC_G": "G",
    "KC_H": "H",
    "KC_I": "I",
    "KC_J": "J",
    "KC_K": "K",
    "KC_L": "L",
    "KC_M": "M",
    "KC_N": "N",
    "KC_O": "O",
    "KC_P": "P",
    "KC_Q": "Q",
    "KC_R": "R",
    "KC_S": "S",
    "KC_T": "T",
    "KC_U": "U",
    "KC_V": "V",
    "KC_W": "W",
    "KC_X": "X",
    "KC_Y": "Y",
    "KC_Z": "Z",
    "KC_1": "1",
    "KC_2": "2",
    "KC_3": "3",
    "KC_4": "4",
    "KC_5": "5",
    "KC_6": "6",
    "KC_7": "7",
    "KC_8": "8",
    "KC_9": "9",
    "KC_0": "0",
    "KC_ENTER": "Enter",
    "KC_ESC": "Esc",
    "KC_ESCAPE": "Esc",
    "KC_BSPACE": "Bksp",
    "KC_TAB": "Tab",
    "KC_SPACE": "Space",
    "KC_MINUS": "-",
    "KC_EQUAL": "^",
    "KC_LBRACKET": "@",
    "KC_RBRACKET": "[",
    "KC_BSLASH": "\\",
    "KC_SCOLON": ";",
    "KC_QUOTE": ":",
    "KC_GRAVE": "`",
    "KC_COMMA": ",",
    "KC_DOT": ".",
    "KC_SLASH": "/",
    "KC_NONUS_HASH": "]",
    "KC_RO": "\\",
    "KC_INT1": "INT1",
    "KC_INT3": "INT3",
    "KC_CAPSLOCK": "Caps",
    "KC_PSCREEN": "PrtScr",
    "KC_LCTRL": "LCtrl",
    "KC_LSHIFT": "LShift",
    "KC_LALT": "LAlt",
    "KC_LGUI": "LGui",
    "KC_RCTRL": "RCtrl",
    "KC_RSHIFT": "RShift",
    "KC_RALT": "RAlt",
    "KC_RGUI": "RGui",
    "KC_F1": "F1",
    "KC_F2": "F2",
    "KC_F3": "F3",
    "KC_F4": "F4",
    "KC_F5": "F5",
    "KC_F6": "F6",
    "KC_F7": "F7",
    "KC_F8": "F8",
    "KC_F9": "F9",
    "KC_F10": "F10",
    "KC_F11": "F11",
    "KC_F12": "F12",
    "KC_UP": "↑",
    "KC_DOWN": "↓",
    "KC_LEFT": "←",
    "KC_RIGHT": "→",
    "KC_HOME": "Home",
    "KC_END": "End",
    "KC_PGUP": "PgUp",
    "KC_PGDN": "PgDn",
    "KC_INSERT": "Ins",
    "KC_DELETE": "Del",
    "KC_KP_0": "0",
    "KC_KP_1": "1",
    "KC_KP_2": "2",
    "KC_KP_3": "3",
    "KC_KP_4": "4",
    "KC_KP_5": "5",
    "KC_KP_6": "6",
    "KC_KP_7": "7",
    "KC_KP_8": "8",
    "KC_KP_9": "9",
    "KC_KP_DOT": ".",
    "KC_KP_SLASH": "/",
    "KC_KP_ASTERISK": "*",
    "KC_KP_MINUS": "-",
    "KC_KP_PLUS": "+",
    "KC_KP_EQUAL": "=",
    "KC_KP_ENTER": "Enter",
    "KC_KP_COMMA": ",",
    "KC_MHEN": "MHEN",
    "KC_HENK": "HENK",
    "KC_KANA": "KANA",
    "KC_LANG1": "LANG1",
    "KC_LANG2": "LANG2",
    "KC_NO": "",
    "KC_TRNS": "▽",
    "KC_JYEN": "JYEN",
    "KC_AT": "@",
    "KC_ZKHK": "ZKHK",
    "KC_HANJ": "HANJ"
},
    shiftMapping: {
    "KC_1": "!",
    "KC_2": "\"",
    "KC_3": "#",
    "KC_4": "$",
    "KC_5": "%",
    "KC_6": "&",
    "KC_7": "'",
    "KC_8": "(",
    "KC_9": ")",
    "KC_0": "0",
    "KC_MINUS": "=",
    "KC_EQUAL": "~",
    "KC_LBRACKET": "`",
    "KC_RBRACKET": "{",
    "KC_BSLASH": "|",
    "KC_SCOLON": "+",
    "KC_QUOTE": "*",
    "KC_GRAVE": "~",
    "KC_COMMA": "<",
    "KC_DOT": ">",
    "KC_SLASH": "?",
    "KC_NONUS_HASH": "}",
    "KC_RO": "_",
    "KC_JYEN": "|"
}
  }
};

// 言語定義
export const KEYBOARD_LANGUAGES: { [key: string]: KeyboardLanguage } = {
  english: {
    id: 'english',
    name: 'English (US)',
    keyMapping: KEYBOARD_MAPPINGS.english.keyMapping,
    specialKeys: {},
    shiftMapping: KEYBOARD_MAPPINGS.english.shiftMapping
  },
  japanese: {
    id: 'japanese', 
    name: 'Japanese (JIS)',
    keyMapping: KEYBOARD_MAPPINGS.japanese.keyMapping,
    specialKeys: {},
    shiftMapping: KEYBOARD_MAPPINGS.japanese.shiftMapping
  }
};

// キーボードレイアウトデータ
export const KEYBOARD_LAYOUTS: { [key: string]: KeyboardLayout } = {
  corne_v4: {
    id: 'corne_v4',
    name: 'Corne v4',
    positions: [
    [
        {
            "x": 20,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 0,
            "description": "Left top row - TO(0)"
        },
        {
            "x": 102,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 1,
            "description": "Left top row - Q"
        },
        {
            "x": 184,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 2,
            "description": "Left top row - W"
        },
        {
            "x": 266,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 3,
            "description": "Left top row - E"
        },
        {
            "x": 348,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 4,
            "description": "Left top row - R"
        },
        {
            "x": 430,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 5,
            "description": "Left top row - T"
        },
        {
            "x": 512,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 6,
            "description": "Left top row - Print Screen"
        }
    ],
    [
        {
            "x": 20,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 0,
            "description": "Left home row - Caps"
        },
        {
            "x": 102,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 1,
            "description": "Left home row - A"
        },
        {
            "x": 184,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 2,
            "description": "Left home row - S"
        },
        {
            "x": 266,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 3,
            "description": "Left home row - D"
        },
        {
            "x": 348,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 4,
            "description": "Left home row - F"
        },
        {
            "x": 430,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 5,
            "description": "Left home row - G"
        },
        {
            "x": 512,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 6,
            "description": "Left home row - Tab"
        }
    ],
    [
        {
            "x": 20,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 0,
            "description": "Left bottom row - LShift"
        },
        {
            "x": 102,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 1,
            "description": "Left bottom row - Z"
        },
        {
            "x": 184,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 2,
            "description": "Left bottom row - X"
        },
        {
            "x": 266,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 3,
            "description": "Left bottom row - C"
        },
        {
            "x": 348,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 4,
            "description": "Left bottom row - V"
        },
        {
            "x": 430,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 5,
            "description": "Left bottom row - B"
        }
    ],
    [
        null,
        null,
        null,
        {
            "x": 266,
            "y": 212,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 3,
            "layoutCol": 3,
            "description": "Left thumb cluster - MHEN"
        },
        {
            "x": 348,
            "y": 212,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 3,
            "layoutCol": 4,
            "description": "Left thumb cluster - LT1 Space"
        },
        {
            "x": 430,
            "y": 212,
            "width": 117,
            "height": 60,
            "rotation": 0,
            "layoutRow": 3,
            "layoutCol": 5,
            "description": "Left thumb cluster - LCtrl (wide)"
        }
    ],
    [
        {
            "x": 1131,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 13,
            "description": "Right top row - KC_NO"
        },
        {
            "x": 1049,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 12,
            "description": "Right top row - P"
        },
        {
            "x": 967,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 11,
            "description": "Right top row - O"
        },
        {
            "x": 885,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 10,
            "description": "Right top row - I"
        },
        {
            "x": 803,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 9,
            "description": "Right top row - U"
        },
        {
            "x": 721,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 8,
            "description": "Right top row - Y"
        },
        {
            "x": 639,
            "y": 20,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 0,
            "layoutCol": 7,
            "description": "Right top row - RAlt"
        }
    ],
    [
        {
            "x": 1131,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 13,
            "description": "Right home row - TD(0)"
        },
        {
            "x": 1049,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 12,
            "description": "Right home row - Bksp"
        },
        {
            "x": 967,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 11,
            "description": "Right home row - L"
        },
        {
            "x": 885,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 10,
            "description": "Right home row - K"
        },
        {
            "x": 803,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 9,
            "description": "Right home row - J"
        },
        {
            "x": 721,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 8,
            "description": "Right home row - H"
        },
        {
            "x": 639,
            "y": 84,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 1,
            "layoutCol": 7,
            "description": "Right home row - RShift"
        }
    ],
    [
        {
            "x": 1131,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 13,
            "description": "Right bottom row - Enter"
        },
        {
            "x": 1049,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 12,
            "description": "Right bottom row - ?"
        },
        {
            "x": 967,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 11,
            "description": "Right bottom row - ;"
        },
        {
            "x": 885,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 10,
            "description": "Right bottom row - M"
        },
        {
            "x": 803,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 9,
            "description": "Right bottom row - ,"
        },
        {
            "x": 721,
            "y": 148,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 2,
            "layoutCol": 8,
            "description": "Right bottom row - N"
        }
    ],
    [
        null,
        null,
        null,
        {
            "x": 885,
            "y": 212,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 3,
            "layoutCol": 10,
            "description": "Right thumb cluster - RGui"
        },
        {
            "x": 803,
            "y": 212,
            "width": 78,
            "height": 60,
            "rotation": 0,
            "layoutRow": 3,
            "layoutCol": 9,
            "description": "Right thumb cluster - LT2 Space"
        },
        {
            "x": 686,
            "y": 212,
            "width": 117,
            "height": 60,
            "rotation": 0,
            "layoutRow": 3,
            "layoutCol": 8,
            "description": "Right thumb cluster - LT3 Tab (wide)"
        }
    ]
]
  }
};

// 現在の言語を取得する関数（後方互換性のため）
let currentLanguage = 'japanese';

export function getCurrentKeyboardLanguage(): KeyboardLanguage {
  return KEYBOARD_LANGUAGES[currentLanguage];
}

export function setCurrentKeyboardLanguage(languageId: string) {
  if (KEYBOARD_LANGUAGES[languageId]) {
    currentLanguage = languageId;
  }
}

export function getKeyMapping(languageId: string): { [key: string]: string } {
  const language = KEYBOARD_LANGUAGES[languageId];
  return language ? language.keyMapping : KEYBOARD_MAPPINGS.english.keyMapping;
}

export function getShiftMapping(languageId: string): { [key: string]: string } {
  const language = KEYBOARD_LANGUAGES[languageId];
  return language ? language.shiftMapping : KEYBOARD_MAPPINGS.english.shiftMapping;
}
