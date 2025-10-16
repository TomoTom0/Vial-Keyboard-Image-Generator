import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import type { ReplaceRule } from '@/utils/types'

// keyboardConfigのモック
vi.mock('@/utils/keyboardConfig', () => ({
  getCurrentKeyboardLanguage: vi.fn(() => ({ id: 'japanese', name: '日本語', code: 'jp' })),
  setCurrentKeyboardLanguage: vi.fn(),
  getKeycodeForCharacter: vi.fn((char: string, lang: string) => {
    // 簡易的なマッピング
    const mapping: {[key: string]: {[char: string]: string}} = {
      'japanese': { 'A': 'KC_A', '+': 'KC_SCLN', ':': 'KC_QUOT', '1': 'KC_1' },
      'american': { 'A': 'KC_A', ';': 'KC_SCLN', "'": 'KC_QUOT', '1': 'KC_1' }
    }
    return mapping[lang]?.[char] || null
  })
}))

describe('useSettingsStore', () => {
  beforeEach(() => {
    // 新しいPiniaインスタンスを作成してアクティブに設定
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初期化', () => {
    it('デフォルト値で初期化される', () => {
      const store = useSettingsStore()

      expect(store.keyboardLanguage).toBe('japanese')
      expect(store.replaceRules).toEqual([])
      expect(store.outputFormat).toBe('vertical')
      expect(store.showLabels).toBe(true)
      expect(store.enableDarkMode).toBe(true)
      expect(store.imageFormat).toBe('png')
      expect(store.highlightLevel).toBe(30)
    })
  })

  describe('setKeyboardLanguage', () => {
    it('言語を変更できる', () => {
      const store = useSettingsStore()

      store.setKeyboardLanguage('american')

      expect(store.keyboardLanguage).toBe('american')
    })
  })

  describe('置換ルール管理', () => {
    it('addReplaceRuleでルールを追加できる', () => {
      const store = useSettingsStore()

      store.addReplaceRule({
        from: 'A',
        to: '1',
        enabled: true
      })

      expect(store.replaceRules).toHaveLength(1)
      expect(store.replaceRules[0].from).toBe('A')
      expect(store.replaceRules[0].to).toBe('1')
      expect(store.replaceRules[0].enabled).toBe(true)
      expect(store.replaceRules[0].id).toBeDefined()
    })

    it('updateReplaceRuleでルールを更新できる', () => {
      const store = useSettingsStore()

      store.addReplaceRule({
        from: 'A',
        to: '1',
        enabled: true
      })

      const ruleId = store.replaceRules[0].id

      store.updateReplaceRule(ruleId, {
        from: 'B',
        to: '2'
      })

      expect(store.replaceRules[0].from).toBe('B')
      expect(store.replaceRules[0].to).toBe('2')
      expect(store.replaceRules[0].enabled).toBe(true) // enabledは変更されない
    })

    it('removeReplaceRuleでルールを削除できる', () => {
      const store = useSettingsStore()

      store.addReplaceRule({
        from: 'A',
        to: '1',
        enabled: true
      })

      const ruleId = store.replaceRules[0].id

      store.removeReplaceRule(ruleId)

      expect(store.replaceRules).toHaveLength(0)
    })

    it('setReplaceRulesで全ルールを一括設定できる', () => {
      const store = useSettingsStore()

      const rules: ReplaceRule[] = [
        { id: '1', from: 'A', to: '1', enabled: true },
        { id: '2', from: 'B', to: '2', enabled: false }
      ]

      store.setReplaceRules(rules)

      expect(store.replaceRules).toHaveLength(2)
      expect(store.replaceRules[0].id).toBe('1')
      expect(store.replaceRules[1].id).toBe('2')
    })
  })

  describe('出力フォーマット管理', () => {
    it('setOutputFormatでフォーマットを変更できる', () => {
      const store = useSettingsStore()

      store.setOutputFormat('separated')

      expect(store.outputFormat).toBe('separated')
    })

    it('cycleOutputFormatでフォーマットを循環できる', () => {
      const store = useSettingsStore()

      // 初期値: vertical
      expect(store.outputFormat).toBe('vertical')

      // +1: rectangular
      store.cycleOutputFormat(1)
      expect(store.outputFormat).toBe('rectangular')

      // +1: separated
      store.cycleOutputFormat(1)
      expect(store.outputFormat).toBe('separated')

      // +1: vertical (循環)
      store.cycleOutputFormat(1)
      expect(store.outputFormat).toBe('vertical')
    })

    it('cycleOutputFormatで逆方向に循環できる', () => {
      const store = useSettingsStore()

      // 初期値: vertical
      expect(store.outputFormat).toBe('vertical')

      // -1: separated
      store.cycleOutputFormat(-1)
      expect(store.outputFormat).toBe('separated')

      // -1: rectangular
      store.cycleOutputFormat(-1)
      expect(store.outputFormat).toBe('rectangular')
    })
  })

  describe('イメージフォーマット管理', () => {
    it('setImageFormatでフォーマットを変更できる', () => {
      const store = useSettingsStore()

      store.setImageFormat('svg')

      expect(store.imageFormat).toBe('svg')
    })

    it('cycleImageFormatでフォーマットを循環できる', () => {
      const store = useSettingsStore()

      // 初期値: png
      expect(store.imageFormat).toBe('png')

      // +1: svg
      store.cycleImageFormat(1)
      expect(store.imageFormat).toBe('svg')

      // +1: png (循環)
      store.cycleImageFormat(1)
      expect(store.imageFormat).toBe('png')
    })
  })

  describe('バリデーション', () => {
    it('validateReplaceRuleで有効なルールを検証できる', () => {
      const store = useSettingsStore()

      const validRule: ReplaceRule = {
        id: '1',
        from: 'A',
        to: '1',
        enabled: true
      }

      const result = store.validateReplaceRule(validRule)

      expect(result).toBe('valid')
    })

    it('validateReplaceRuleで無効なルールを検証できる', () => {
      const store = useSettingsStore()

      // 無効化されたルール
      const disabledRule: ReplaceRule = {
        id: '1',
        from: 'A',
        to: '1',
        enabled: false
      }

      const result = store.validateReplaceRule(disabledRule)

      expect(result).toBe('invalid')
    })

    it('validateReplaceRuleで空のルールをunknownと判定する', () => {
      const store = useSettingsStore()

      const emptyRule: ReplaceRule = {
        id: '1',
        from: '',
        to: '',
        enabled: true
      }

      const result = store.validateReplaceRule(emptyRule)

      expect(result).toBe('unknown')
    })

    it('validateReplaceRuleWithReasonで詳細な理由を取得できる', () => {
      const store = useSettingsStore()

      const validRule: ReplaceRule = {
        id: '1',
        from: 'A',
        to: '1',
        enabled: true
      }

      const result = store.validateReplaceRuleWithReason(validRule)

      expect(result.status).toBe('valid')
      expect(result.reason).toBeUndefined()
    })

    it('validateSingleFieldで単一フィールドを検証できる', () => {
      const store = useSettingsStore()

      // 有効な文字
      expect(store.validateSingleField('A')).toBe('valid')

      // 無効な文字
      expect(store.validateSingleField('§')).toBe('invalid')

      // 空文字列
      expect(store.validateSingleField('')).toBe('none')
    })
  })

  describe('computed プロパティ', () => {
    it('highlightEnabledがhighlightLevelから導出される', () => {
      const store = useSettingsStore()

      // highlightLevel=30 → true
      store.highlightLevel = 30
      expect(store.highlightEnabled).toBe(true)

      // highlightLevel=10 → false
      store.highlightLevel = 10
      expect(store.highlightEnabled).toBe(false)

      // highlightLevel=20 → true
      store.highlightLevel = 20
      expect(store.highlightEnabled).toBe(true)
    })

    it('selectDisplayColumnsが正しく計算される', () => {
      const store = useSettingsStore()

      // vertical → 1列
      store.setOutputFormat('vertical')
      expect(store.selectDisplayColumns).toBe(1)

      // rectangular → 3列
      store.setOutputFormat('rectangular')
      expect(store.selectDisplayColumns).toBe(3)

      // separated → 3列
      store.setOutputFormat('separated')
      expect(store.selectDisplayColumns).toBe(3)
    })

    it('previewDisplayColumnsが選択レイヤー数に応じて計算される', () => {
      const store = useSettingsStore()

      // vertical: 常に1列
      store.setOutputFormat('vertical')
      expect(store.previewDisplayColumns).toBe(1)

      // separated: 2レイヤー選択
      store.setOutputFormat('separated')
      store.layerSelection = { 0: true, 1: true, 2: false, 3: false, 4: false, 5: false }
      expect(store.previewDisplayColumns).toBe(2)

      // 5レイヤー選択 → 3列
      store.layerSelection = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: false }
      expect(store.previewDisplayColumns).toBe(3)

      // 1レイヤー選択 → 1列
      store.layerSelection = { 0: true, 1: false, 2: false, 3: false, 4: false, 5: false }
      expect(store.previewDisplayColumns).toBe(1)
    })
  })

  describe('loadLanguageInfos', () => {
    it('言語情報をロードできる（フェッチ成功時）', async () => {
      const store = useSettingsStore()

      // グローバルfetchをモック
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('language\tabbreviation\tdisplay_name\njapanese\tJA\tJapanese\namerican\tEN\tEnglish')
        } as Response)
      )

      await store.loadLanguageInfos()

      expect(store.languageInfos).toHaveLength(2)
      expect(store.languageInfos[0].language).toBe('japanese')
      expect(store.languageInfos[0].abbreviation).toBe('JA')
      expect(store.languageInfos[1].language).toBe('american')
    })

    it('言語情報のロード失敗時にフォールバックする', async () => {
      const store = useSettingsStore()

      // フェッチ失敗をモック
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      await store.loadLanguageInfos()

      // フォールバックの言語情報が設定される
      expect(store.languageInfos).toHaveLength(2)
      expect(store.languageInfos[0].language).toBe('japanese')
      expect(store.languageInfos[1].language).toBe('english')
    })
  })
})
