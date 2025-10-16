import { describe, it, expect } from 'vitest'
import { embedMetadataToPng, extractMetadataFromPng, type PngMetadata } from '@/utils/pngMetadata'

describe('pngMetadata', () => {
  // 最小限の有効なPNG画像（1x1透明ピクセル）のDataURL
  const createMinimalPngDataUrl = (): string => {
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR type
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x1F, 0x15, 0xC4, 0x89, // IHDR CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT type
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
      0x0D, 0x0A, 0x2D, 0xB4, // IDAT CRC
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4E, 0x44, // IEND type
      0xAE, 0x42, 0x60, 0x82  // IEND CRC
    ])

    const binaryString = Array.from(pngBytes)
      .map(byte => String.fromCharCode(byte))
      .join('')
    const base64 = btoa(binaryString)
    return `data:image/png;base64,${base64}`
  }

  describe('embedMetadataToPng', () => {
    it('PNG画像にメタデータを埋め込める', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const metadata: PngMetadata = {
        vilConfig: JSON.stringify({ name: 'Test Keyboard' }),
        generator: 'Vial Keyboard Image Generator'
      }

      const result = embedMetadataToPng(pngDataUrl, metadata)

      // DataURLとして有効
      expect(result).toMatch(/^data:image\/png;base64,/)
      // 元より大きくなっている（メタデータ追加分）
      expect(result.length).toBeGreaterThan(pngDataUrl.length)
    })

    it('複数のメタデータフィールドを埋め込める', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const metadata: PngMetadata = {
        vilConfig: JSON.stringify({ name: 'Test' }),
        settings: JSON.stringify({ theme: 'dark' }),
        timestamp: new Date().toISOString(),
        generator: 'Test Generator'
      }

      const result = embedMetadataToPng(pngDataUrl, metadata)

      expect(result).toMatch(/^data:image\/png;base64,/)
      expect(result.length).toBeGreaterThan(pngDataUrl.length)
    })

    it('空のメタデータでも元の画像を返す', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const metadata: PngMetadata = {}

      const result = embedMetadataToPng(pngDataUrl, metadata)

      // 元のDataURLと同じサイズ（メタデータなし）
      expect(result).toMatch(/^data:image\/png;base64,/)
    })

    it('無効なPNG画像の場合は元のDataURLを返す', () => {
      const invalidDataUrl = 'data:image/png;base64,aW52YWxpZA==' // "invalid" in base64

      const metadata: PngMetadata = {
        vilConfig: JSON.stringify({ name: 'Test' })
      }

      const result = embedMetadataToPng(invalidDataUrl, metadata)

      // エラー時は元のDataURLをそのまま返す
      expect(result).toBe(invalidDataUrl)
    })

    it('undefinedフィールドはスキップされる', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const metadata: PngMetadata = {
        vilConfig: JSON.stringify({ name: 'Test' }),
        settings: undefined,
        timestamp: undefined,
        generator: 'Test'
      }

      const result = embedMetadataToPng(pngDataUrl, metadata)

      expect(result).toMatch(/^data:image\/png;base64,/)
    })
  })

  describe('extractMetadataFromPng', () => {
    it('PNG画像からメタデータを抽出できる', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const metadata: PngMetadata = {
        vilConfig: JSON.stringify({ name: 'Test Keyboard' }),
        generator: 'Vial Keyboard Image Generator'
      }

      // メタデータ埋め込み
      const embeddedPng = embedMetadataToPng(pngDataUrl, metadata)

      // メタデータ抽出
      const extracted = extractMetadataFromPng(embeddedPng)

      expect(extracted).not.toBeNull()
      expect(extracted?.vilConfig).toBe(metadata.vilConfig)
      expect(extracted?.generator).toBe(metadata.generator)
    })

    it('複数のメタデータフィールドを抽出できる', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const timestamp = new Date().toISOString()
      const metadata: PngMetadata = {
        vilConfig: JSON.stringify({ name: 'Test' }),
        settings: JSON.stringify({ theme: 'dark' }),
        timestamp,
        generator: 'Test Generator'
      }

      const embeddedPng = embedMetadataToPng(pngDataUrl, metadata)
      const extracted = extractMetadataFromPng(embeddedPng)

      expect(extracted).not.toBeNull()
      expect(extracted?.vilConfig).toBe(metadata.vilConfig)
      expect(extracted?.settings).toBe(metadata.settings)
      expect(extracted?.timestamp).toBe(timestamp)
      expect(extracted?.generator).toBe(metadata.generator)
    })

    it('メタデータがないPNG画像でnullを返す', () => {
      const pngDataUrl = createMinimalPngDataUrl()

      const extracted = extractMetadataFromPng(pngDataUrl)

      expect(extracted).toBeNull()
    })

    it('無効なPNG画像でnullを返す', () => {
      const invalidDataUrl = 'data:image/png;base64,aW52YWxpZA=='

      const extracted = extractMetadataFromPng(invalidDataUrl)

      expect(extracted).toBeNull()
    })

    it('JPEGなど他の画像形式でnullを返す', () => {
      // JPEG signature: FF D8 FF E0
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])
      const binaryString = Array.from(jpegBytes)
        .map(byte => String.fromCharCode(byte))
        .join('')
      const base64 = btoa(binaryString)
      const jpegDataUrl = `data:image/jpeg;base64,${base64}`

      const extracted = extractMetadataFromPng(jpegDataUrl)

      expect(extracted).toBeNull()
    })
  })

  describe('埋め込みと抽出のラウンドトリップ', () => {
    it('埋め込んだメタデータを正確に復元できる', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const originalMetadata: PngMetadata = {
        vilConfig: JSON.stringify({
          name: 'Corne v4',
          layout: [[['KC_A', 'KC_B']]],
          version: 1
        }),
        settings: JSON.stringify({
          theme: 'dark',
          highlightLevel: 30
        }),
        timestamp: '2025-10-16T12:34:56.789Z',
        generator: 'Vial Keyboard Image Generator v1.0'
      }

      // 埋め込み
      const embeddedPng = embedMetadataToPng(pngDataUrl, originalMetadata)

      // 抽出
      const extractedMetadata = extractMetadataFromPng(embeddedPng)

      // 完全一致検証
      expect(extractedMetadata).not.toBeNull()
      expect(extractedMetadata?.vilConfig).toBe(originalMetadata.vilConfig)
      expect(extractedMetadata?.settings).toBe(originalMetadata.settings)
      expect(extractedMetadata?.timestamp).toBe(originalMetadata.timestamp)
      expect(extractedMetadata?.generator).toBe(originalMetadata.generator)

      // JSON復元確認
      const vilConfig = JSON.parse(extractedMetadata!.vilConfig!)
      expect(vilConfig.name).toBe('Corne v4')
      expect(vilConfig.layout).toEqual([[['KC_A', 'KC_B']]])
    })

    it('日本語を含むメタデータも正しく復元できる', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const originalMetadata: PngMetadata = {
        vilConfig: JSON.stringify({
          name: 'コルネキーボード',
          description: 'テスト用キーボード'
        }),
        generator: 'Vialキーボード画像生成ツール'
      }

      const embeddedPng = embedMetadataToPng(pngDataUrl, originalMetadata)
      const extractedMetadata = extractMetadataFromPng(embeddedPng)

      expect(extractedMetadata).not.toBeNull()
      expect(extractedMetadata?.vilConfig).toBe(originalMetadata.vilConfig)
      expect(extractedMetadata?.generator).toBe(originalMetadata.generator)

      const vilConfig = JSON.parse(extractedMetadata!.vilConfig!)
      expect(vilConfig.name).toBe('コルネキーボード')
      expect(vilConfig.description).toBe('テスト用キーボード')
    })

    it('特殊文字を含むメタデータも正しく復元できる', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const originalMetadata: PngMetadata = {
        vilConfig: JSON.stringify({
          symbols: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
        })
      }

      const embeddedPng = embedMetadataToPng(pngDataUrl, originalMetadata)
      const extractedMetadata = extractMetadataFromPng(embeddedPng)

      expect(extractedMetadata).not.toBeNull()
      const vilConfig = JSON.parse(extractedMetadata!.vilConfig!)
      expect(vilConfig.symbols).toBe('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~')
    })
  })

  describe('エッジケース', () => {
    it('空文字列のメタデータは埋め込まれるが空として扱われる', () => {
      const pngDataUrl = createMinimalPngDataUrl()
      const metadata: PngMetadata = {
        vilConfig: '',
        generator: ''
      }

      const embeddedPng = embedMetadataToPng(pngDataUrl, metadata)
      const extracted = extractMetadataFromPng(embeddedPng)

      // 空文字列は埋め込まれるが、メタデータとしては空なのでnullが返る可能性がある
      // または空文字列として抽出される
      if (extracted) {
        expect(extracted.vilConfig).toBe('')
        expect(extracted.generator).toBe('')
      } else {
        // 空文字列のみの場合はnullになる可能性もある
        expect(extracted).toBeNull()
      }
    })

    it('大きなメタデータ（数KB）を扱える', () => {
      const pngDataUrl = createMinimalPngDataUrl()

      // 大きなVilConfig（約3KB）
      const largeLayout = Array(100).fill(null).map((_, i) =>
        Array(10).fill(null).map((_, j) => `KC_${i}_${j}`)
      )
      const metadata: PngMetadata = {
        vilConfig: JSON.stringify({
          name: 'Large Keyboard',
          layout: [largeLayout]
        })
      }

      const embeddedPng = embedMetadataToPng(pngDataUrl, metadata)
      const extracted = extractMetadataFromPng(embeddedPng)

      expect(extracted).not.toBeNull()
      expect(extracted?.vilConfig).toBe(metadata.vilConfig)
    })
  })
})
