import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentKeyboardLanguage,
  setCurrentKeyboardLanguage,
  getCurrentStructure,
  setCurrentKeyboardStructure,
  getCharacterFromKeycode,
  compareKeycodeResult,
  getKeycodeForCharacter,
  getEquivalentKeycode,
  convertKeycodeList,
  keyboardLanguages,
  keyboardStructures
} from '@/utils/keyboardConfig'

// keyboardConfig.generatedのモック
vi.mock('@/utils/keyboardConfig.generated', () => ({
  KEYBOARD_LANGUAGES: {
    japanese: { id: 'japanese', name: '日本語', code: 'jp' },
    american: { id: 'american', name: 'US', code: 'us' }
  },
  getCurrentKeyboardLanguage: vi.fn(() => ({ id: 'japanese', name: '日本語', code: 'jp' })),
  setCurrentKeyboardLanguage: vi.fn(),
  getKeyMapping: vi.fn((languageId: string) => {
    const mappings: {[lang: string]: {[key: string]: string}} = {
      'japanese': {
        'KC_A': 'A',
        'KC_SCLN': '+',
        'KC_QUOT': ':',
        'KC_LBRC': '@',
        'KC_RBRC': '[',
        'KC_BSLS': ']',
        'KC_1': '1',
        'KC_2': '2'
      },
      'american': {
        'KC_A': 'A',
        'KC_SCLN': ';',
        'KC_QUOT': "'",
        'KC_LBRC': '[',
        'KC_RBRC': ']',
        'KC_BSLS': '\\',
        'KC_1': '1',
        'KC_2': '2'
      }
    }
    return mappings[languageId] || {}
  }),
  getShiftMapping: vi.fn((languageId: string) => {
    const shiftMappings: {[lang: string]: {[key: string]: string}} = {
      'japanese': {
        'KC_1': '!',
        'KC_2': '"',
        'KC_SCLN': '*'
      },
      'american': {
        'KC_1': '!',
        'KC_2': '@',
        'KC_SCLN': ':'
      }
    }
    return shiftMappings[languageId] || {}
  })
}))

describe('keyboardConfig', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    // localStorageモック
    localStorageMock = {}

    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      key: vi.fn(),
      length: 0
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentKeyboardLanguage', () => {
    it('localStorageから言語設定を取得する', () => {
      localStorageMock['vial-keyboard-language'] = 'american'

      const language = getCurrentKeyboardLanguage()

      expect(language).toBeDefined()
      expect(localStorage.getItem).toHaveBeenCalledWith('vial-keyboard-language')
    })

    it('保存された設定がない場合はデフォルトで日本語を返す', () => {
      const language = getCurrentKeyboardLanguage()

      // デフォルトは日本語
      expect(language).toBeDefined()
      expect(language.id).toBe('japanese')
    })

    it('無効な言語IDの場合は日本語にフォールバックする', () => {
      localStorageMock['vial-keyboard-language'] = 'invalid_language'

      const language = getCurrentKeyboardLanguage()

      expect(language.id).toBe('japanese')
    })
  })

  describe('setCurrentKeyboardLanguage', () => {
    it('言語設定をlocalStorageに保存する', () => {
      setCurrentKeyboardLanguage('american')

      expect(localStorage.setItem).toHaveBeenCalledWith('vial-keyboard-language', 'american')
    })
  })

  describe('getCurrentStructure', () => {
    it('localStorageからキーボード構造設定を取得する', () => {
      localStorageMock['vial-keyboard-structure'] = 'cheapiano_v2'

      const structure = getCurrentStructure()

      expect(structure).toBeDefined()
      expect(structure.id).toBe('cheapiano_v2')
      expect(localStorage.getItem).toHaveBeenCalledWith('vial-keyboard-structure')
    })

    it('保存された設定がない場合はデフォルトでcorne_v4を返す', () => {
      const structure = getCurrentStructure()

      expect(structure.id).toBe('corne_v4')
    })

    it('無効な構造IDの場合は最初の構造にフォールバックする', () => {
      localStorageMock['vial-keyboard-structure'] = 'invalid_structure'

      const structure = getCurrentStructure()

      expect(structure).toBeDefined()
      expect(structure.id).toBe('corne_v4')
    })
  })

  describe('setCurrentKeyboardStructure', () => {
    it('キーボード構造設定をlocalStorageに保存する', () => {
      setCurrentKeyboardStructure('cheapiano_v2')

      expect(localStorage.setItem).toHaveBeenCalledWith('vial-keyboard-structure', 'cheapiano_v2')
    })
  })

  describe('getCharacterFromKeycode', () => {
    it('KC_プレフィックス付きキーコードから文字を取得する', () => {
      const char = getCharacterFromKeycode('KC_A', 'japanese')

      expect(char).toBe('A')
    })

    it('KC_プレフィックスなしキーコードから文字を取得する', () => {
      const char = getCharacterFromKeycode('A', 'japanese')

      expect(char).toBe('A')
    })

    it('日本語配列で記号キーの文字を取得する', () => {
      const char = getCharacterFromKeycode('KC_SCLN', 'japanese')

      expect(char).toBe('+')
    })

    it('US配列で記号キーの文字を取得する', () => {
      const char = getCharacterFromKeycode('KC_SCLN', 'american')

      expect(char).toBe(';')
    })

    it('LSFT組み合わせキーのShift文字を取得する', () => {
      const char = getCharacterFromKeycode('LSFT(KC_1)', 'japanese')

      expect(char).toBe('!')
    })

    it('LSFT組み合わせキーで言語ごとに異なる文字を取得する', () => {
      const charJP = getCharacterFromKeycode('LSFT(KC_2)', 'japanese')
      const charUS = getCharacterFromKeycode('LSFT(KC_2)', 'american')

      expect(charJP).toBe('"')
      expect(charUS).toBe('@')
    })

    it('存在しないキーコードでnullを返す', () => {
      const char = getCharacterFromKeycode('KC_UNKNOWN', 'japanese')

      expect(char).toBeNull()
    })
  })

  describe('compareKeycodeResult', () => {
    it('言語間で同じ文字を出力するキーコードを比較する', () => {
      // KC_Aは両言語で'A'
      const result = compareKeycodeResult('KC_A', 'japanese', 'american')

      expect(result).toBe(true)
    })

    it('言語間で異なる文字を出力するキーコードを比較する', () => {
      // KC_SCLNは日本語で'+', USで';'
      const result = compareKeycodeResult('KC_SCLN', 'japanese', 'american')

      expect(result).toBe(false)
    })

    it('両方でnullの場合もtrueを返す', () => {
      const result = compareKeycodeResult('KC_UNKNOWN', 'japanese', 'american')

      expect(result).toBe(true)
    })
  })

  describe('getKeycodeForCharacter', () => {
    it('文字からキーコードを逆引きする', () => {
      const keycode = getKeycodeForCharacter('A', 'japanese')

      expect(keycode).toBe('KC_A')
    })

    it('日本語配列で記号から対応するキーコードを逆引きする', () => {
      const keycode = getKeycodeForCharacter('+', 'japanese')

      expect(keycode).toBe('KC_SCLN')
    })

    it('US配列で記号から対応するキーコードを逆引きする', () => {
      const keycode = getKeycodeForCharacter(';', 'american')

      expect(keycode).toBe('KC_SCLN')
    })

    it('Shift組み合わせが必要な文字の逆引き', () => {
      const keycode = getKeycodeForCharacter('!', 'japanese')

      expect(keycode).toBe('LSFT(KC_1)')
    })

    it('言語によって異なるShift文字の逆引き', () => {
      const keycodeJP = getKeycodeForCharacter('"', 'japanese')
      const keycodeUS = getKeycodeForCharacter('@', 'american')

      expect(keycodeJP).toBe('LSFT(KC_2)')
      expect(keycodeUS).toBe('LSFT(KC_2)')
    })

    it('存在しない文字でnullを返す', () => {
      const keycode = getKeycodeForCharacter('§', 'japanese')

      expect(keycode).toBeNull()
    })
  })

  describe('getEquivalentKeycode', () => {
    it('言語間で等価なキーコードを取得する', () => {
      // 日本語のKC_SCLN(+) → USで+を出力するキーコード
      const equivalent = getEquivalentKeycode('japanese', 'american', 'KC_SCLN')

      // US配列では+はSHIFT+=(存在しない場合はnull)
      expect(equivalent).toBeDefined()
    })

    it('同じ文字を出力するキーコードは同じになる', () => {
      // KC_AはどちらもA
      const equivalent = getEquivalentKeycode('japanese', 'american', 'KC_A')

      expect(equivalent).toBe('KC_A')
    })

    it('存在しないキーコードでnullを返す', () => {
      const equivalent = getEquivalentKeycode('japanese', 'american', 'KC_UNKNOWN')

      expect(equivalent).toBeNull()
    })

    it('変換先言語に存在しない文字でnullを返す', () => {
      // モックには存在しないが、実際には存在しない文字をシミュレート
      const equivalent = getEquivalentKeycode('japanese', 'american', 'KC_NONEXISTENT')

      expect(equivalent).toBeNull()
    })
  })

  describe('convertKeycodeList', () => {
    it('複数のキーコードを一括変換する', () => {
      const keycodes = ['KC_A', 'KC_SCLN', 'KC_1']
      const result = convertKeycodeList('japanese', 'american', keycodes)

      expect(result).toHaveLength(3)

      // KC_A → KC_A (Aは両方同じ)
      expect(result[0].original).toBe('KC_A')
      expect(result[0].character).toBe('A')
      expect(result[0].converted).toBe('KC_A')

      // KC_SCLN → ? (+ → USで+を出力するキー)
      expect(result[1].original).toBe('KC_SCLN')
      expect(result[1].character).toBe('+')

      // KC_1 → KC_1 (1は両方同じ)
      expect(result[2].original).toBe('KC_1')
      expect(result[2].character).toBe('1')
      expect(result[2].converted).toBe('KC_1')
    })

    it('変換できないキーコードを含む場合もnullで返す', () => {
      const keycodes = ['KC_A', 'KC_UNKNOWN']
      const result = convertKeycodeList('japanese', 'american', keycodes)

      expect(result).toHaveLength(2)
      expect(result[0].converted).toBe('KC_A')
      expect(result[1].converted).toBeNull()
      expect(result[1].character).toBeNull()
    })
  })

  describe('keyboardLanguages & keyboardStructures', () => {
    it('keyboardLanguagesが定義されている', () => {
      expect(keyboardLanguages).toBeDefined()
      expect(Array.isArray(keyboardLanguages)).toBe(true)
      expect(keyboardLanguages.length).toBeGreaterThan(0)
    })

    it('keyboardStructuresが定義されている', () => {
      expect(keyboardStructures).toBeDefined()
      expect(Array.isArray(keyboardStructures)).toBe(true)
      expect(keyboardStructures.length).toBeGreaterThan(0)

      // Corne v4が含まれている
      const corneV4 = keyboardStructures.find(s => s.id === 'corne_v4')
      expect(corneV4).toBeDefined()
      expect(corneV4?.name).toBe('corne_v4')
      expect(corneV4?.displayName).toBe('Corne v4')
    })
  })
})
