// VILファイル変換ユーティリティ
import { getCharacterFromKeycode, getKeycodeForCharacter } from './keyboardConfig'

export interface KeyOverride {
  trigger: string | number
  replacement: string | number
  layers: number
  trigger_mods: number
  negative_mod_mask: number
  suppressed_mods: number
  options: number
}

interface VialSettings {
  [key: string]: number
}

export interface ComboInfo {
  keys: (string | number)[]
  result: string | number
  [key: string]: unknown
}

interface TapDanceInfo extends Array<string | number> {
  0: string | number  // tap
  1: string | number  // hold
  2: string | number  // double tap
  3: string | number  // tap hold
  4: number           // tapping term
}

interface VialConfig {
  version: number
  uid: number
  layout: (string | number)[][][]  // [layer][row][key]
  encoder_layout: (string | number)[][][]
  layout_options: number
  macro: string[][]
  vial_protocol: number
  via_protocol: number
  tap_dance: TapDanceInfo[]
  combo: (string | number)[][]
  key_override: KeyOverride[]
  alt_repeat_key: unknown[]
  settings: VialSettings
}

/**
 * キーコードを指定された言語に変換する
 */
export function convertKeycode(keycode: string | number, fromLanguage: string, toLanguage: string): string | number {
  // 数値（-1など）はそのまま返す
  if (typeof keycode === 'number') {
    return keycode
  }

  // 空文字列や特殊な値はそのまま返す
  if (!keycode || typeof keycode !== 'string') {
    return keycode
  }

  console.log(`🔄 Converting keycode: ${keycode} from ${fromLanguage} to ${toLanguage}`)

  // 元の言語で文字を取得
  const character = getCharacterFromKeycode(keycode, fromLanguage)
  
  if (!character) {
    console.log(`⚠️ No character found for keycode: ${keycode} in ${fromLanguage}`)
    return keycode // 変換できない場合は元のキーコードを返す
  }

  console.log(`🔍 Character found: "${character}"`)

  // ターゲット言語でキーコードを逆引き
  const newKeycode = getKeycodeForCharacter(character, toLanguage)
  
  if (!newKeycode) {
    console.log(`⚠️ No keycode found for character: "${character}" in ${toLanguage}`)
    return keycode // 変換できない場合は元のキーコードを返す
  }

  console.log(`✅ Converted to: ${newKeycode}`)
  return newKeycode
}

/**
 * VILファイルの全キーコードを変換する
 */
export function convertVialConfig(config: VialConfig, fromLanguage: string, toLanguage: string): VialConfig {
  console.log(`🚀 Starting VIL conversion: ${fromLanguage} → ${toLanguage}`)
  console.log('🔍 Input config:', config)
  console.log('🔍 Layout structure:', config.layout)
  
  // ディープコピーを作成
  const convertedConfig: VialConfig = JSON.parse(JSON.stringify(config))
  
  let totalConverted = 0
  
  // レイアウトの各キーコードを変換
  convertedConfig.layout = config.layout.map((layer, layerIndex) => {
    console.log(`🔄 Converting layer ${layerIndex}`)
    return layer.map((keycode, keyIndex) => {
      const converted = convertKeycode(keycode, fromLanguage, toLanguage)
      if (converted !== keycode) {
        console.log(`  Key[${keyIndex}]: ${keycode} → ${converted}`)
        totalConverted++
      }
      return converted
    })
  })
  
  console.log(`✅ Total converted keys: ${totalConverted}`)
  
  // コンボの変換（存在する場合）
  if (convertedConfig.combos) {
    convertedConfig.combos = convertedConfig.combos.map((combo: ComboInfo) => {
      if (combo.keycode) {
        const converted = convertKeycode(combo.keycode, fromLanguage, toLanguage)
        if (converted !== combo.keycode) {
          console.log(`🔄 Combo keycode: ${combo.keycode} → ${converted}`)
        }
        return { ...combo, keycode: converted }
      }
      return combo
    })
  }

  // タップダンスの変換（存在する場合）
  if (convertedConfig.tap_dance) {
    convertedConfig.tap_dance = convertedConfig.tap_dance.map((td: TapDanceInfo) => {
      if (td.keycodes) {
        td.keycodes = td.keycodes.map((keycode: string | number) => {
          const converted = convertKeycode(keycode, fromLanguage, toLanguage)
          if (converted !== keycode) {
            console.log(`🔄 TapDance keycode: ${keycode} → ${converted}`)
          }
          return converted
        })
      }
      return td
    })
  }

  console.log(`✅ VIL conversion completed`)
  return convertedConfig
}

/**
 * ファイルをダウンロードさせる
 */
export function downloadVilFile(config: VialConfig, originalFilename: string, targetLanguage: string) {
  // JSON文字列に変換（整形あり）
  const jsonString = JSON.stringify(config, null, 2)
  
  // ファイル名を生成
  const baseName = originalFilename.replace(/\.vil$/, '')
  const newFilename = `${baseName}_${targetLanguage}.vil`
  
  // Blobを作成
  const blob = new Blob([jsonString], { type: 'application/json' })
  
  // ダウンロードリンクを作成
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = newFilename
  
  // ダウンロードを実行
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // URLオブジェクトを解放
  URL.revokeObjectURL(url)
  
  console.log(`📥 Downloaded: ${newFilename}`)
}