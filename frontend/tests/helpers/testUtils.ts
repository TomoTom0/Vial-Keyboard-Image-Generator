/**
 * テスト共通ヘルパー関数
 */

import { createPinia, setActivePinia } from 'pinia'

/**
 * Piniaストア用のセットアップ
 */
export function setupPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * モックCanvas Context 2D
 * PhysicalButton.draw() のテストで使用
 */
export class MockCanvasContext {
  public commands: Array<{ method: string; args: any[] }> = []

  fillRect(...args: any[]) {
    this.commands.push({ method: 'fillRect', args })
  }

  fillText(...args: any[]) {
    this.commands.push({ method: 'fillText', args })
  }

  strokeRect(...args: any[]) {
    this.commands.push({ method: 'strokeRect', args })
  }

  strokeText(...args: any[]) {
    this.commands.push({ method: 'strokeText', args })
  }

  save() {
    this.commands.push({ method: 'save', args: [] })
  }

  restore() {
    this.commands.push({ method: 'restore', args: [] })
  }

  translate(...args: any[]) {
    this.commands.push({ method: 'translate', args })
  }

  scale(...args: any[]) {
    this.commands.push({ method: 'scale', args })
  }

  // パス描画メソッド
  beginPath() {
    this.commands.push({ method: 'beginPath', args: [] })
  }

  closePath() {
    this.commands.push({ method: 'closePath', args: [] })
  }

  moveTo(...args: any[]) {
    this.commands.push({ method: 'moveTo', args })
  }

  lineTo(...args: any[]) {
    this.commands.push({ method: 'lineTo', args })
  }

  fill() {
    this.commands.push({ method: 'fill', args: [] })
  }

  stroke() {
    this.commands.push({ method: 'stroke', args: [] })
  }

  measureText(text: string) {
    // 簡易的な幅計算（実際のCanvasとは異なる）
    return { width: text.length * 10 }
  }

  clearCommands() {
    this.commands = []
  }

  getCommandsByMethod(method: string) {
    return this.commands.filter((cmd) => cmd.method === method)
  }

  // プロパティ
  fillStyle: string = '#000000'
  strokeStyle: string = '#000000'
  font: string = '16px sans-serif'
  textAlign: string = 'left'
  textBaseline: string = 'alphabetic'
  lineWidth: number = 1
  globalAlpha: number = 1
}
