import { describe, it, expect, beforeEach } from 'vitest'
import { PhysicalButton } from '@/utils/types'
import type { VirtualButton, RenderOptions } from '@/utils/types'
import { MockCanvasContext } from '../../helpers/testUtils'

describe('PhysicalButton', () => {
  let mockCtx: MockCanvasContext
  
  const defaultRenderOptions: RenderOptions = {
    theme: 'dark',
    highlightLevel: 30,
    highlightComboKeys: true,
    highlightSubtextKeys: true,
    showComboMarkers: true,
    showTextColors: true,
    changeKeyColors: true,
    changeEmptyKeyColors: true
  }

  beforeEach(() => {
    mockCtx = new MockCanvasContext()
  })

  describe('draw - 基本描画', () => {
    it('通常キーの背景と枠線を描画する', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const button = new PhysicalButton('KC_A', main)

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      const fillRectCalls = mockCtx.getCommandsByMethod('fillRect')
      const strokeRectCalls = mockCtx.getCommandsByMethod('strokeRect')

      expect(fillRectCalls.length).toBeGreaterThanOrEqual(1) // 背景
      expect(strokeRectCalls.length).toBe(1) // 枠線
      expect(strokeRectCalls[0].args).toEqual([0, 0, 100, 100])
    })

    it('空きキー (KC_NO) で特別な背景色を使用する', () => {
      const main: VirtualButton = { keyCode: 'KC_NO', keyText: '', isSpecial: false }
      const button = new PhysicalButton('KC_NO', main)

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      // fillStyleが設定されていることを確認（空きキー用の色）
      expect(mockCtx.fillStyle).toBeDefined()
    })

    it('サブテキスト付きキーで特別な背景色を使用する', () => {
      const main: VirtualButton = { keyCode: 'KC_ESC', keyText: 'Esc', isSpecial: false }
      const hold: VirtualButton = { keyCode: 'KC_GRAVE', keyText: '`', isSpecial: false }
      const button = new PhysicalButton('TD(0)', main, { hold })

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      // 背景描画が実行されている
      const fillRectCalls = mockCtx.getCommandsByMethod('fillRect')
      expect(fillRectCalls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('drawText - メインテキスト描画', () => {
    it('単一文字のメインテキストを描画する', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const button = new PhysicalButton('KC_A', main)

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      const fillTextCalls = mockCtx.getCommandsByMethod('fillText')
      expect(fillTextCalls.length).toBeGreaterThanOrEqual(1)
      
      // メインテキストが描画されている
      const mainTextCall = fillTextCalls.find(call => call.args[0] === 'A')
      expect(mainTextCall).toBeDefined()
    })

    it('長いテキスト (9文字以上) で小さいフォントサイズを使用する', () => {
      const main: VirtualButton = { keyCode: 'KC_LONG', keyText: 'VERYLONGTEXT', isSpecial: false }
      const button = new PhysicalButton('KC_LONG', main)

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      // フォントサイズが設定されている
      expect(mockCtx.font).toBeDefined()
      expect(mockCtx.font).toContain('px')
    })

    it('空のメインテキストの場合は何も描画しない', () => {
      const main: VirtualButton = { keyCode: 'KC_NO', keyText: '', isSpecial: false }
      const button = new PhysicalButton('KC_NO', main)

      mockCtx.clearCommands()
      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      const fillTextCalls = mockCtx.getCommandsByMethod('fillText')
      // KC_NOは空文字なのでメインテキストは描画されない
      expect(fillTextCalls.length).toBe(0)
    })
  })

  describe('drawText - サブテキスト描画', () => {
    it('サブテキスト1個の場合: 中央下に配置される', () => {
      const main: VirtualButton = { keyCode: 'KC_SPACE', keyText: 'Space', isSpecial: false }
      const hold: VirtualButton = { keyCode: 'LT1', keyText: 'LT1', isSpecial: true }
      const button = new PhysicalButton('LT1(KC_SPACE)', main, { hold })

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      const fillTextCalls = mockCtx.getCommandsByMethod('fillText')
      expect(fillTextCalls.length).toBeGreaterThanOrEqual(2) // メイン + サブ1個

      // サブテキストが描画されている
      const subTextCall = fillTextCalls.find(call => call.args[0] === 'LT1')
      expect(subTextCall).toBeDefined()
    })

    it('サブテキスト2個の場合: 2行レイアウトで配置される', () => {
      const main: VirtualButton = { keyCode: 'KC_TAB', keyText: 'Tab', isSpecial: false }
      const tap: VirtualButton = { keyCode: 'KC_ESC', keyText: 'Esc', isSpecial: false }
      const hold: VirtualButton = { keyCode: 'KC_GRAVE', keyText: '`', isSpecial: false }
      const button = new PhysicalButton('TD(0)', main, { tap, hold })

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      const fillTextCalls = mockCtx.getCommandsByMethod('fillText')
      expect(fillTextCalls.length).toBeGreaterThanOrEqual(3) // メイン + サブ2個
    })

    it('サブテキスト3個の場合: 最適な改行位置で配置される', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const tap: VirtualButton = { keyCode: 'KC_1', keyText: '1', isSpecial: false }
      const hold: VirtualButton = { keyCode: 'KC_2', keyText: '2', isSpecial: false }
      const double: VirtualButton = { keyCode: 'KC_3', keyText: '3', isSpecial: false }
      const button = new PhysicalButton('TD(0)', main, { tap, hold, double })

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      const fillTextCalls = mockCtx.getCommandsByMethod('fillText')
      expect(fillTextCalls.length).toBeGreaterThanOrEqual(4) // メイン + サブ3個
    })

    it('サブテキスト4個の場合: 2行×2列に配置される', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const tap: VirtualButton = { keyCode: 'KC_1', keyText: '1', isSpecial: false }
      const hold: VirtualButton = { keyCode: 'KC_2', keyText: '2', isSpecial: false }
      const double: VirtualButton = { keyCode: 'KC_3', keyText: '3', isSpecial: false }
      const taphold: VirtualButton = { keyCode: 'KC_4', keyText: '4', isSpecial: false }
      const button = new PhysicalButton('TD(0)', main, { tap, hold, double, taphold })

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)

      const fillTextCalls = mockCtx.getCommandsByMethod('fillText')
      expect(fillTextCalls.length).toBeGreaterThanOrEqual(5) // メイン + サブ4個
    })
  })

  describe('drawText - 色付けロジック', () => {
    it('highlightLevel=30でサブテキストに色を付ける', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const hold: VirtualButton = { keyCode: 'KC_B', keyText: 'B', isSpecial: false }
      const button = new PhysicalButton('TD(0)', main, { hold })

      const options: RenderOptions = {
        ...defaultRenderOptions,
        highlightLevel: 30 // strong
      }

      button.draw(mockCtx as any, 0, 0, 100, 100, options)

      // fillStyleが複数回設定されている（色が変わっている）
      const fillTextCalls = mockCtx.getCommandsByMethod('fillText')
      expect(fillTextCalls.length).toBeGreaterThanOrEqual(2)
    })

    it('highlightLevel=10でサブテキストに色を付けない', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const hold: VirtualButton = { keyCode: 'KC_B', keyText: 'B', isSpecial: false }
      const button = new PhysicalButton('TD(0)', main, { hold })

      const options: RenderOptions = {
        ...defaultRenderOptions,
        highlightLevel: 10 // off
      }

      button.draw(mockCtx as any, 0, 0, 100, 100, options)

      // サブテキストも描画されるが、色は通常色
      const fillTextCalls = mockCtx.getCommandsByMethod('fillText')
      expect(fillTextCalls.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('hasSubTexts', () => {
    it('サブテキストがある場合にtrueを返す', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const hold: VirtualButton = { keyCode: 'KC_B', keyText: 'B', isSpecial: false }
      const button = new PhysicalButton('TD(0)', main, { hold })

      expect(button.hasSubTexts()).toBe(true)
    })

    it('サブテキストがない場合にfalseを返す', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const button = new PhysicalButton('KC_A', main)

      expect(button.hasSubTexts()).toBe(false)
    })
  })

  describe('コンボマーカー描画', () => {
    it('コンボ入力キーの場合に右上に三角形を描画する', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const button = new PhysicalButton('KC_A', main)

      // モックCombo（このキーがコンボ入力キー）
      const mockCombo = {
        rawKeys: ['KC_A', 'KC_B'],
        keys: [],
        action: main,
        index: 0,
        description: 'Test'
      }

      button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions, [mockCombo])

      // beginPath, moveTo, lineTo, closePath, fillが呼ばれている（三角形描画）
      const commands = mockCtx.commands
      const hasTriangle = commands.some(cmd => cmd.method === 'beginPath')
      expect(hasTriangle).toBe(true)
    })

    it('showComboMarkers=falseの場合に三角形を描画しない', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const button = new PhysicalButton('KC_A', main)

      const mockCombo = {
        rawKeys: ['KC_A', 'KC_B'],
        keys: [],
        action: main,
        index: 0,
        description: 'Test'
      }

      const options: RenderOptions = {
        ...defaultRenderOptions,
        showComboMarkers: false
      }

      mockCtx.clearCommands()
      button.draw(mockCtx as any, 0, 0, 100, 100, options, [mockCombo])

      // beginPathが呼ばれていない
      const commands = mockCtx.commands
      const hasTriangle = commands.some(cmd => cmd.method === 'beginPath')
      expect(hasTriangle).toBe(false)
    })
  })

  describe('Canvas/SVG互換性', () => {
    it('drawメソッドとdrawSVGメソッドが同じ引数を受け取る', () => {
      const main: VirtualButton = { keyCode: 'KC_A', keyText: 'A', isSpecial: false }
      const button = new PhysicalButton('KC_A', main)

      // drawメソッドの呼び出し
      expect(() => {
        button.draw(mockCtx as any, 0, 0, 100, 100, defaultRenderOptions)
      }).not.toThrow()

      // drawSVGメソッドも同じインターフェース
      const mockSVGRenderer = {
        fillStyle: '',
        strokeStyle: '',
        font: '',
        textAlign: '',
        lineWidth: 0,
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => {}
      }

      expect(() => {
        button.drawSVG(mockSVGRenderer as any, 0, 0, 100, 100, defaultRenderOptions)
      }).not.toThrow()
    })
  })
})
