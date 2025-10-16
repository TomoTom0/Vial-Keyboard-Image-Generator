import { describe, it, expect, beforeEach } from 'vitest'
import { VialDataProcessor } from '@/utils/vialDataProcessor'
import { PhysicalButton } from '@/utils/types'
import type { VialConfig, ReplaceRule } from '@/utils/types'

describe('VialDataProcessor', () => {
  // サンプルVialConfig
  const mockConfig: VialConfig = {
    name: 'Test Keyboard',
    layout: [
      [
        ['KC_A', 'KC_B', 'KC_C'],
        ['TD(0)', 'LT1(KC_SPACE)', 'LSFT_T(KC_TAB)']
      ]
    ],
    tap_dance: [
      ['KC_ESC', 'KC_GRAVE', 'KC_TILD', 'KC_NO'], // TD(0)
      ['KC_A', 'KC_NO'] // TD(1)
    ],
    combo: [
      ['KC_A', 'KC_B', 'KC_NO', 'KC_NO', 'KC_C'] // A+B → C
    ]
  }

  beforeEach(() => {
    // 各テスト前にクリーンな状態にリセット
    VialDataProcessor.setReplaceRules([])
    VialDataProcessor.setConfig(mockConfig)
  })

  describe('createVirtualButton', () => {
    it('通常のキーコード (KC_A) を正しく変換できる', () => {
      const vButton = VialDataProcessor.createVirtualButton('KC_A', 'us')
      expect(vButton.keyCode).toBe('KC_A')
      expect(vButton.keyText).toBe('A') // usキーボードでは大文字
      expect(vButton.isSpecial).toBe(false)
    })

    it('特殊キー TO(1) を正しく認識できる', () => {
      const vButton = VialDataProcessor.createVirtualButton('TO(1)', 'us')
      expect(vButton.keyCode).toBe('TO(1)')
      expect(vButton.keyText).toBe('TO(1)')
      expect(vButton.isSpecial).toBe(true)
    })

    it('特殊キー MO(2) を正しく認識できる', () => {
      const vButton = VialDataProcessor.createVirtualButton('MO(2)', 'us')
      expect(vButton.keyCode).toBe('MO(2)')
      expect(vButton.keyText).toBe('MO(2)')
      expect(vButton.isSpecial).toBe(true)
    })

    it('特殊キー LT1(XXX) を正しく認識できる', () => {
      const vButton = VialDataProcessor.createVirtualButton('LT1(KC_SPACE)', 'us')
      expect(vButton.keyCode).toBe('LT1(KC_SPACE)')
      expect(vButton.keyText).toBe('LT1')
      // LT1はisSpecialKeyでtrue（/^LT\d+\(/にマッチ）
      expect(vButton.isSpecial).toBeTruthy()
    })

    it('TapDanceキー TD(0) を正しく変換できる', () => {
      const vButton = VialDataProcessor.createVirtualButton('TD(0)', 'us')
      expect(vButton.keyCode).toBe('TD(0)')
      expect(vButton.keyText).toBe('TD(0)')
      expect(vButton.isSpecial).toBe(false)
    })

    it('ModifierTapキー LSFT_T(KC_A) を正しく変換できる', () => {
      const vButton = VialDataProcessor.createVirtualButton('LSFT_T(KC_A)', 'us')
      expect(vButton.keyCode).toBe('LSFT_T(KC_A)')
      expect(vButton.keyText).toBe('LSFT')
      expect(vButton.isSpecial).toBe(false)
    })

    it('Shift組み合わせキー LSFT(KC_A) で大文字を表示する', () => {
      const vButton = VialDataProcessor.createVirtualButton('LSFT(KC_A)', 'us')
      expect(vButton.keyCode).toBe('LSFT(KC_A)')
      // shiftMappingに依存するが、基本的には大文字のAが期待される
      expect(vButton.keyText).toMatch(/^[AS]/)
    })

    it('ReplaceRulesを適用できる', () => {
      const replaceRules: ReplaceRule[] = [
        { id: '1', from: 'A', to: 'α', enabled: true }
      ]
      VialDataProcessor.setReplaceRules(replaceRules)

      const vButton = VialDataProcessor.createVirtualButton('KC_A', 'us')
      expect(vButton.keyText).toBe('α')
    })

    it('無効なReplaceRulesは適用されない', () => {
      const replaceRules: ReplaceRule[] = [
        { id: '1', from: 'A', to: 'α', enabled: false }
      ]
      VialDataProcessor.setReplaceRules(replaceRules)

      const vButton = VialDataProcessor.createVirtualButton('KC_A', 'us')
      expect(vButton.keyText).toBe('A')
    })
  })

  describe('createPhysicalButton', () => {
    it('通常のキー KC_A から PhysicalButton を作成できる', () => {
      const pButton = VialDataProcessor.createPhysicalButton('KC_A')
      expect(pButton).toBeInstanceOf(PhysicalButton)
      expect(pButton.rawKeyCode).toBe('KC_A')
      expect(pButton.main.keyText).toBe('A') // usキーボードでは大文字
      expect(pButton.sub).toBeUndefined()
    })

    it('TapDanceキー TD(0) を tap/hold/double に分解できる', () => {
      const pButton = VialDataProcessor.createPhysicalButton('TD(0)')
      expect(pButton).toBeInstanceOf(PhysicalButton)
      expect(pButton.rawKeyCode).toBe('TD(0)')
      expect(pButton.main.keyCode).toBe('KC_ESC')
      expect(pButton.sub?.hold?.keyCode).toBe('KC_GRAVE')
      expect(pButton.sub?.double?.keyCode).toBe('KC_TILD')
      expect(pButton.sub?.taphold).toBeUndefined() // KC_NO なので undefined
    })

    it('TapDanceキー TD(1) で hold のみの場合を処理できる', () => {
      const pButton = VialDataProcessor.createPhysicalButton('TD(1)')
      expect(pButton).toBeInstanceOf(PhysicalButton)
      expect(pButton.main.keyCode).toBe('KC_A')
      expect(pButton.sub?.hold).toBeUndefined() // KC_NO なので undefined
      expect(pButton.sub?.double).toBeUndefined()
    })

    it('LayerTapキー LT1(KC_SPACE) を tap/hold に分解できる', () => {
      const pButton = VialDataProcessor.createPhysicalButton('LT1(KC_SPACE)')
      expect(pButton).toBeInstanceOf(PhysicalButton)
      expect(pButton.rawKeyCode).toBe('LT1(KC_SPACE)')
      expect(pButton.main.keyCode).toBe('KC_SPACE')
      expect(pButton.sub?.hold?.keyText).toBe('LT1')
    })

    it('ModifierTapキー LSFT_T(KC_TAB) を tap/hold に分解できる', () => {
      const pButton = VialDataProcessor.createPhysicalButton('LSFT_T(KC_TAB)')
      expect(pButton).toBeInstanceOf(PhysicalButton)
      expect(pButton.rawKeyCode).toBe('LSFT_T(KC_TAB)')
      expect(pButton.main.keyCode).toBe('KC_TAB')
      expect(pButton.sub?.hold?.keyCode).toBe('LSFT')
    })

    it('LCTL_T(KC_ESC) を tap/hold に分解できる', () => {
      const pButton = VialDataProcessor.createPhysicalButton('LCTL_T(KC_ESC)')
      expect(pButton).toBeInstanceOf(PhysicalButton)
      expect(pButton.main.keyCode).toBe('KC_ESC')
      expect(pButton.sub?.hold?.keyCode).toBe('LCTL')
    })
  })

  describe('getTapDances', () => {
    it('VialConfigからTapDance定義を抽出できる', () => {
      const tapDances = VialDataProcessor.getTapDances(mockConfig)
      expect(tapDances).toHaveLength(2)
      
      // TD(0)
      expect(tapDances[0].index).toBe(0)
      expect(tapDances[0].tap.keyCode).toBe('KC_ESC')
      expect(tapDances[0].hold?.keyCode).toBe('KC_GRAVE')
      expect(tapDances[0].double?.keyCode).toBe('KC_TILD')
      
      // TD(1)
      expect(tapDances[1].index).toBe(1)
      expect(tapDances[1].tap.keyCode).toBe('KC_A')
      expect(tapDances[1].hold).toBeUndefined()
    })

    it('空のTapDance配列を処理できる', () => {
      const emptyConfig: VialConfig = {
        name: 'Empty',
        layout: [],
        tap_dance: []
      }
      const tapDances = VialDataProcessor.getTapDances(emptyConfig)
      expect(tapDances).toHaveLength(0)
    })

    it('tap_danceが未定義の場合に空配列を返す', () => {
      const noTDConfig: VialConfig = {
        name: 'No TD',
        layout: []
      }
      const tapDances = VialDataProcessor.getTapDances(noTDConfig)
      expect(tapDances).toHaveLength(0)
    })
  })

  describe('getCombos', () => {
    it('VialConfigからCombo定義を抽出できる', () => {
      const combos = VialDataProcessor.getCombos(mockConfig)
      expect(combos).toHaveLength(1)
      
      const combo = combos[0]
      expect(combo.index).toBe(0)
      expect(combo.keys).toHaveLength(2) // KC_A, KC_B
      expect(combo.keys[0].keyCode).toBe('KC_A')
      expect(combo.keys[1].keyCode).toBe('KC_B')
      expect(combo.action.keyCode).toBe('KC_C')
      expect(combo.description).toContain('A')
      expect(combo.description).toContain('B')
      expect(combo.description).toContain('C')
    })

    it('空のCombo配列を処理できる', () => {
      const emptyConfig: VialConfig = {
        name: 'Empty',
        layout: [],
        combo: []
      }
      const combos = VialDataProcessor.getCombos(emptyConfig)
      expect(combos).toHaveLength(0)
    })

    it('comboが未定義の場合に空配列を返す', () => {
      const noComboConfig: VialConfig = {
        name: 'No Combo',
        layout: []
      }
      const combos = VialDataProcessor.getCombos(noComboConfig)
      expect(combos).toHaveLength(0)
    })

    it('KC_NOのみのComboはスキップされる', () => {
      const invalidComboConfig: VialConfig = {
        name: 'Invalid',
        layout: [],
        combo: [
          ['KC_NO', 'KC_NO', 'KC_NO', 'KC_NO', 'KC_A']
        ]
      }
      const combos = VialDataProcessor.getCombos(invalidComboConfig)
      expect(combos).toHaveLength(0)
    })
  })

  describe('getPhysicalButtons', () => {
    it('レイヤーの物理ボタンマップを取得できる', () => {
      const buttons = VialDataProcessor.getPhysicalButtons(mockConfig)
      expect(buttons).toHaveLength(1) // 1レイヤー
      expect(buttons[0]).toHaveLength(2) // 2行
      expect(buttons[0][0]).toHaveLength(3) // 1行目: 3キー
      expect(buttons[0][1]).toHaveLength(3) // 2行目: 3キー

      // 1行目のキー確認
      expect(buttons[0][0][0].rawKeyCode).toBe('KC_A')
      expect(buttons[0][0][1].rawKeyCode).toBe('KC_B')
      expect(buttons[0][0][2].rawKeyCode).toBe('KC_C')

      // 2行目のキー確認（特殊キー）
      expect(buttons[0][1][0].rawKeyCode).toBe('TD(0)')
      expect(buttons[0][1][1].rawKeyCode).toBe('LT1(KC_SPACE)')
      expect(buttons[0][1][2].rawKeyCode).toBe('LSFT_T(KC_TAB)')
    })

    it('空のレイアウトを処理できる', () => {
      const emptyConfig: VialConfig = {
        name: 'Empty',
        layout: []
      }
      const buttons = VialDataProcessor.getPhysicalButtons(emptyConfig)
      expect(buttons).toHaveLength(0)
    })
  })
})
