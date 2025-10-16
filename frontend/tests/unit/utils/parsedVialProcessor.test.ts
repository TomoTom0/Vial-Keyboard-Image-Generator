import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ParsedVialProcessor } from '@/utils/parsedVialProcessor'
import type { VialConfig, KeyPosition } from '@/utils/types'

// keyboardConfig.generatedとkeyboardConfigのモック
vi.mock('@/utils/keyboardConfig.generated', () => ({
  KEYBOARD_LAYOUTS: {
    corne_v4: {
      positions: [
        // 行0: 3キー
        [
          { x: 0, y: 0, width: 60, height: 60, rotation: 0 },
          { x: 70, y: 0, width: 60, height: 60, rotation: 0 },
          { x: 140, y: 0, width: 60, height: 60, rotation: 0 }
        ],
        // 行1: 2キー
        [
          { x: 0, y: 70, width: 60, height: 60, rotation: 0 },
          { x: 70, y: 70, width: 60, height: 60, rotation: 0 }
        ]
      ]
    }
  }
}))

vi.mock('@/utils/keyboardConfig', () => ({
  getCurrentStructure: () => ({ id: 'corne_v4', name: 'Corne v4' })
}))

vi.mock('@/utils/vialDataProcessor', () => ({
  VialDataProcessor: {
    setConfig: vi.fn(),
    getTapDances: vi.fn(() => []),
    getCombos: vi.fn(() => []),
    createPhysicalButton: vi.fn((keycode) => ({
      rawKeyCode: keycode,
      main: { keyCode: keycode, keyText: keycode.replace('KC_', ''), isSpecial: false },
      sub: undefined
    }))
  }
}))

describe('ParsedVialProcessor', () => {
  const mockConfig: VialConfig = {
    name: 'Test Keyboard',
    layout: [
      // レイヤー0
      {
        0: ['KC_A', 'KC_B', 'KC_C'],
        1: ['KC_D', 'KC_E']
      } as any,
      // レイヤー1
      {
        0: ['KC_1', 'KC_2', 'KC_3'],
        1: ['KC_4', 'KC_5']
      } as any
    ]
  }

  describe('parseVialConfig', () => {
    it('VialConfigからParsedVialを生成できる', () => {
      const result = ParsedVialProcessor.parseVialConfig(mockConfig, 'Test Keyboard')

      expect(result.original).toBe(mockConfig)
      expect(result.keyboardName).toBe('Test Keyboard')
      expect(result.layers).toHaveLength(2) // 2レイヤー
      expect(result.metadata).toBeDefined()
      expect(result.metadata?.generatedAt).toBeInstanceOf(Date)
    })

    it('レイヤー情報が正しく解析される', () => {
      const result = ParsedVialProcessor.parseVialConfig(mockConfig)

      // レイヤー0
      expect(result.layers[0].layerIndex).toBe(0)
      expect(result.layers[0].name).toBe('Layer 0')
      expect(result.layers[0].enabled).toBe(true)
      
      // レイヤー1
      expect(result.layers[1].layerIndex).toBe(1)
      expect(result.layers[1].name).toBe('Layer 1')
    })

    it('ボタン数が正しく解析される', () => {
      const result = ParsedVialProcessor.parseVialConfig(mockConfig)

      // レイヤー0: 行0に3個、行1に2個 = 合計5個
      expect(result.layers[0].buttons).toHaveLength(5)
      
      // レイヤー1: 行0に3個、行1に2個 = 合計5個
      expect(result.layers[1].buttons).toHaveLength(5)
    })

    it('空のレイアウトを処理できる', () => {
      const emptyConfig: VialConfig = {
        name: 'Empty',
        layout: []
      }

      const result = ParsedVialProcessor.parseVialConfig(emptyConfig)

      expect(result.layers).toHaveLength(0)
    })
  })

  describe('calculateDrawPosition', () => {
    it('配置座標から描画座標を計算する', () => {
      const layoutPosition: KeyPosition = {
        x: 10,
        y: 20,
        width: 60,
        height: 60,
        rotation: 0
      }

      // privateメソッドなので、ParsedVialを通してテスト
      const result = ParsedVialProcessor.parseVialConfig(mockConfig)
      const firstButton = result.layers[0].buttons[0]

      // 描画位置が設定されている
      expect(firstButton.drawPosition).toBeDefined()
      expect(firstButton.drawPosition.x).toBeGreaterThanOrEqual(0)
      expect(firstButton.drawPosition.y).toBeGreaterThanOrEqual(0)
      expect(firstButton.drawPosition.width).toBe(60)
      expect(firstButton.drawPosition.height).toBe(60)
    })

    it('rotation が設定されている', () => {
      const result = ParsedVialProcessor.parseVialConfig(mockConfig)
      const firstButton = result.layers[0].buttons[0]

      expect(firstButton.drawPosition.rotation).toBeDefined()
      expect(firstButton.drawPosition.rotation).toBe(0)
    })
  })

  describe('getLayerButtons', () => {
    it('指定レイヤーのボタンを取得できる', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const buttons = ParsedVialProcessor.getLayerButtons(parsedVial, 0)

      expect(buttons).toHaveLength(5)
      expect(buttons[0].button.rawKeyCode).toBe('KC_A')
    })

    it('存在しないレイヤーで空配列を返す', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const buttons = ParsedVialProcessor.getLayerButtons(parsedVial, 99)

      expect(buttons).toHaveLength(0)
    })
  })

  describe('getButtonAt', () => {
    it('指定位置のボタンを取得できる', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const button = ParsedVialProcessor.getButtonAt(parsedVial, 0, 0, 0)

      expect(button).not.toBeNull()
      expect(button?.button.rawKeyCode).toBe('KC_A')
      expect(button?.rowIndex).toBe(0)
      expect(button?.colIndex).toBe(0)
    })

    it('行1列1のボタンを取得できる', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const button = ParsedVialProcessor.getButtonAt(parsedVial, 0, 1, 1)

      expect(button).not.toBeNull()
      expect(button?.button.rawKeyCode).toBe('KC_E')
      expect(button?.rowIndex).toBe(1)
      expect(button?.colIndex).toBe(1)
    })

    it('存在しない位置でnullを返す', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const button = ParsedVialProcessor.getButtonAt(parsedVial, 0, 99, 99)

      expect(button).toBeNull()
    })

    it('存在しないレイヤーでnullを返す', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const button = ParsedVialProcessor.getButtonAt(parsedVial, 99, 0, 0)

      expect(button).toBeNull()
    })
  })

  describe('calculateCanvasSize', () => {
    it('キャンバスサイズを計算できる', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const size = ParsedVialProcessor.calculateCanvasSize(parsedVial)

      // ボタン位置からサイズが計算されている
      expect(size.width).toBeGreaterThan(0)
      expect(size.height).toBeGreaterThan(0)
      
      // マージン(40px)が含まれている
      expect(size.width).toBeGreaterThan(140 + 60) // 最右端のボタン + マージン
      expect(size.height).toBeGreaterThan(70 + 60) // 最下端のボタン + マージン
    })

    it('空のParsedVialでマージンのみのサイズを返す', () => {
      const emptyConfig: VialConfig = {
        name: 'Empty',
        layout: []
      }
      const parsedVial = ParsedVialProcessor.parseVialConfig(emptyConfig)
      const size = ParsedVialProcessor.calculateCanvasSize(parsedVial)

      // ボタンがない場合はマージンのみ
      expect(size.width).toBe(40)
      expect(size.height).toBe(40)
    })
  })

  describe('ボタン位置情報', () => {
    it('各ボタンに layoutPosition が設定されている', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const button = parsedVial.layers[0].buttons[0]

      expect(button.layoutPosition).toBeDefined()
      expect(button.layoutPosition.x).toBe(0)
      expect(button.layoutPosition.y).toBe(0)
      expect(button.layoutPosition.width).toBe(60)
      expect(button.layoutPosition.height).toBe(60)
    })

    it('各ボタンに drawPosition が設定されている', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      const button = parsedVial.layers[0].buttons[0]

      expect(button.drawPosition).toBeDefined()
      expect(button.drawPosition.x).toBe(0)
      expect(button.drawPosition.y).toBe(0)
      expect(button.drawPosition.width).toBe(60)
      expect(button.drawPosition.height).toBe(60)
    })

    it('行・列インデックスが正しく設定されている', () => {
      const parsedVial = ParsedVialProcessor.parseVialConfig(mockConfig)
      
      // 行0列0
      const button00 = parsedVial.layers[0].buttons[0]
      expect(button00.rowIndex).toBe(0)
      expect(button00.colIndex).toBe(0)
      
      // 行1列1
      const button11 = parsedVial.layers[0].buttons.find(
        b => b.rowIndex === 1 && b.colIndex === 1
      )
      expect(button11).toBeDefined()
      expect(button11?.rowIndex).toBe(1)
      expect(button11?.colIndex).toBe(1)
    })
  })
})
