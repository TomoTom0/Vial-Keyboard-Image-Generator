import { describe, it, expect } from 'vitest'

describe('テスト環境の動作確認', () => {
  it('基本的なアサーションが動作する', () => {
    expect(1 + 1).toBe(2)
  })

  it('配列のテストが動作する', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('オブジェクトのテストが動作する', () => {
    const obj = { name: 'test', value: 42 }
    expect(obj).toEqual({ name: 'test', value: 42 })
  })
})
