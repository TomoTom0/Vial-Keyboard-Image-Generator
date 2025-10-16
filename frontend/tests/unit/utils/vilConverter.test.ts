import { describe, it, expect, vi } from 'vitest'
import { 
  convertKeycode, 
  convertVialConfig,
  convertVialConfigWithReplaceRules
} from '@/utils/vilConverter'
import type { VialConfig, ReplaceRule } from '@/utils/types'

// keyboardConfigモジュールのモック
vi.mock('@/utils/keyboardConfig', () => ({
  getCharacterFromKeycode: (keycode: string, language: string) => {
    // 簡易的なマッピング
    const mapping: {[key: string]: {[lang: string]: string}} = {
      'KC_A': { 'us': 'A', 'jp': 'A' },
      'KC_SCLN': { 'us': ';', 'jp': '+' }, // セミコロンは日本語配列で+
      'KC_QUOT': { 'us': "'", 'jp': ':' }, // クォートは日本語配列で:
      'KC_1': { 'us': '1', 'jp': '1' },
      'KC_LBRC': { 'us': '[', 'jp': '@' },
    }
    return mapping[keycode]?.[language]
  },
  getKeycodeForCharacter: (char: string, language: string) => {
    // 簡易的な逆マッピング
    const mapping: {[lang: string]: {[char: string]: string}} = {
      'us': { 'A': 'KC_A', ';': 'KC_SCLN', "'": 'KC_QUOT', '1': 'KC_1', '[': 'KC_LBRC' },
      'jp': { 'A': 'KC_A', '+': 'KC_SCLN', ':': 'KC_QUOT', '1': 'KC_1', '@': 'KC_LBRC' },
    }
    return mapping[language]?.[char]
  }
}))

describe('vilConverter', () => {
  describe('convertKeycode', () => {
    it('英字配列 → 日本語配列に変換できる', () => {
      const result = convertKeycode('KC_SCLN', 'us', 'jp')
      // KC_SCLN: us=;, jp=+ → KC_SCLNのまま（文字は変わるが、物理キーコードは同じ）
      expect(result).toBe('KC_SCLN')
    })

    it('日本語配列 → 英字配列に変換できる', () => {
      const result = convertKeycode('KC_LBRC', 'jp', 'us')
      // KC_LBRC: jp=@, us=[ → KC_LBRCのまま
      expect(result).toBe('KC_LBRC')
    })

    it('数値（-1など）はそのまま返す', () => {
      const result = convertKeycode(-1, 'us', 'jp')
      expect(result).toBe(-1)
    })

    it('空文字列はそのまま返す', () => {
      const result = convertKeycode('', 'us', 'jp')
      expect(result).toBe('')
    })

    it('変換できないキーコードは元のまま返す', () => {
      const result = convertKeycode('KC_UNKNOWN', 'us', 'jp')
      expect(result).toBe('KC_UNKNOWN')
    })
  })

  describe('convertVialConfig', () => {
    it('VialConfig全体を言語変換できる', () => {
      const mockConfig: VialConfig = {
        name: 'Test Keyboard',
        layout: [
          [
            ['KC_A', 'KC_SCLN', 'KC_1'],
            ['KC_LBRC', 'KC_QUOT']
          ]
        ]
      }

      const result = convertVialConfig(mockConfig, 'us', 'jp')

      // 構造が保持されている
      expect(result.layout).toHaveLength(1)
      expect(result.layout[0][0]).toHaveLength(3)
      expect(result.layout[0][1]).toHaveLength(2)

      // 元のconfigは変更されていない（ディープコピー確認）
      expect(mockConfig.layout[0][0][0]).toBe('KC_A')
    })

    it('数値（-1）を含むレイアウトを正しく処理できる', () => {
      const mockConfig: VialConfig = {
        name: 'Test Keyboard',
        layout: [
          [
            ['KC_A', -1, 'KC_1'] as any
          ]
        ]
      }

      const result = convertVialConfig(mockConfig, 'us', 'jp')

      expect(result.layout[0][0][1]).toBe(-1) // -1はそのまま
    })
  })

  describe('convertVialConfigWithReplaceRules', () => {
    it('ReplaceRulesを適用できる', () => {
      const mockConfig: VialConfig = {
        name: 'Test Keyboard',
        layout: [
          [
            ['KC_A', 'KC_SCLN', 'KC_1']
          ]
        ],
        version: 1,
        uid: 12345,
        layout_options: 0,
        encoder_layout: [],
        macro: [],
        vial_protocol: 1,
        via_protocol: 1,
        tap_dance: [],
        combo: [],
        key_override: [],
        alt_repeat_key: [],
        settings: {}
      }

      const replaceRules: ReplaceRule[] = [
        { id: '1', from: 'A', to: '1', enabled: true }
      ]

      const result = convertVialConfigWithReplaceRules(mockConfig, replaceRules, 'us')

      // 'A'が'1'に置き換えられる（KC_A → KC_1）
      expect(result.layout[0][0][0]).toBe('KC_1')
    })

    it('無効なReplaceRulesは適用されない', () => {
      const mockConfig: VialConfig = {
        name: 'Test Keyboard',
        layout: [
          [
            ['KC_A']
          ]
        ],
        version: 1,
        uid: 12345,
        layout_options: 0,
        encoder_layout: [],
        macro: [],
        vial_protocol: 1,
        via_protocol: 1,
        tap_dance: [],
        combo: [],
        key_override: [],
        alt_repeat_key: [],
        settings: {}
      }

      const replaceRules: ReplaceRule[] = [
        { id: '1', from: 'A', to: 'X', enabled: false } // 無効
      ]

      const result = convertVialConfigWithReplaceRules(mockConfig, replaceRules, 'us')

      // 'A'は変換されない
      expect(result.layout[0][0][0]).toBe('KC_A')
    })

    it('変換後に構造を検証する', () => {
      const mockConfig: VialConfig = {
        name: 'Test Keyboard',
        layout: [
          [
            ['KC_A', 'KC_1']
          ]
        ],
        version: 1,
        uid: 12345,
        layout_options: 0,
        encoder_layout: [],
        macro: [],
        vial_protocol: 1,
        via_protocol: 1,
        tap_dance: [],
        combo: [],
        key_override: [],
        alt_repeat_key: [],
        settings: {}
      }

      const replaceRules: ReplaceRule[] = [
        { id: '1', from: 'A', to: '1', enabled: true }
      ]

      // 検証エラーが発生しないことを確認
      expect(() => {
        convertVialConfigWithReplaceRules(mockConfig, replaceRules, 'us')
      }).not.toThrow()
    })

    it('Tap Danceの変換を行う', () => {
      const mockConfig: VialConfig = {
        name: 'Test Keyboard',
        layout: [
          [
            ['TD(0)']
          ]
        ],
        tap_dance: [
          ['KC_A', 'KC_SCLN', 'KC_NO', 'KC_NO', 200] as any
        ],
        version: 1,
        uid: 12345,
        layout_options: 0,
        encoder_layout: [],
        macro: [],
        vial_protocol: 1,
        via_protocol: 1,
        combo: [],
        key_override: [],
        alt_repeat_key: [],
        settings: {}
      }

      const replaceRules: ReplaceRule[] = [
        { id: '1', from: 'A', to: '1', enabled: true }
      ]

      const result = convertVialConfigWithReplaceRules(mockConfig, replaceRules, 'us')

      // TapDanceの最初の要素（tap）がKC_A → KC_1に変換される
      expect(result.tap_dance![0][0]).toBe('KC_1')
      // タイミング値（200）は数値のまま
      expect(result.tap_dance![0][4]).toBe(200)
    })
  })
})
