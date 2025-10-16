// VILファイル変換ユーティリティ
import { getCharacterFromKeycode, getKeycodeForCharacter } from './keyboardConfig'
import type { VialConfig, ReplaceRule, TapDanceInfo } from './types'
import { parseModifier, type ModifierInfo } from './modifierParser'

export interface ComboInfo {
  keys: (string | number)[]
  result: string | number
  [key: string]: unknown
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


  // 元の言語で文字を取得
  const character = getCharacterFromKeycode(keycode, fromLanguage)
  
  if (!character) {
    return keycode // 変換できない場合は元のキーコードを返す
  }


  // ターゲット言語でキーコードを逆引き
  const newKeycode = getKeycodeForCharacter(character, toLanguage)
  
  if (!newKeycode) {
    return keycode // 変換できない場合は元のキーコードを返す
  }

  return newKeycode
}

/**
 * VILファイルの全キーコードを変換する
 */
export function convertVialConfig(config: VialConfig, fromLanguage: string, toLanguage: string): VialConfig {
  
  // ディープコピーを作成
  const convertedConfig: VialConfig = JSON.parse(JSON.stringify(config))
  
  let totalConverted = 0
  
  // レイアウトの各キーコードを変換
  convertedConfig.layout = config.layout.map((layer, layerIndex) => {
    const convertedLayer: { [rowIndex: number]: (string | number)[] } = {}
    
    // レイヤーの各行を処理
    for (const rowIndex in layer) {
      const row = layer[rowIndex]
      if (Array.isArray(row)) {
        convertedLayer[rowIndex] = row.map((keycode, keyIndex) => {
          const converted = convertKeycode(keycode, fromLanguage, toLanguage)
          if (converted !== keycode) {
            totalConverted++
          }
          return converted
        })
      }
    }
    
    return convertedLayer
  })
  
  
  // コンボの変換（存在する場合）
  if (convertedConfig.combo) {
    convertedConfig.combo = convertedConfig.combo.map((combo: ComboInfo) => {
      if (combo.keycode) {
        const converted = convertKeycode(combo.keycode as string, fromLanguage, toLanguage)
        if (converted !== combo.keycode) {
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
          }
          return converted
        })
      }
      return td
    })
  }

  return convertedConfig
}

/**
 * 通常のVILファイルをダウンロードする
 */
export function downloadVilFile(config: VialConfig, originalFilename: string) {
  // JSON文字列に変換（整形あり）
  const jsonString = JSON.stringify(config, null, 2)
  
  // ファイル名を生成
  const filename = originalFilename.endsWith('.vil') ? originalFilename : `${originalFilename}.vil`
  
  // Blobを作成
  const blob = new Blob([jsonString], { type: 'application/json' })
  
  // ダウンロードリンクを作成
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  
  // ダウンロードを実行
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // URLオブジェクトを解放
  URL.revokeObjectURL(url)
  
}

/**
 * 言語変換されたVILファイルをダウンロードする（既存の関数）
 */
export function downloadConvertedVilFile(config: VialConfig, originalFilename: string, targetLanguage: string) {
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
  
}

/**
 * 複合キーコードの解析と再構築
 */
function parseComplexKeycode(keycode: string): { type: string; innerKeycode?: string; params?: string[]; modifierInfo?: ModifierInfo } {
  // 全モディファイアパターン（LSFT/RSFT/LCTL/RCTL/LALT/RALT/LGUI/RGUI）
  const modifierInfo = parseModifier(keycode);
  if (modifierInfo) {
    if (modifierInfo.format === 'modifier_tap') {
      return {
        type: 'modifier_tap',
        innerKeycode: modifierInfo.innerKeycode,
        modifierInfo: modifierInfo
      };
    } else {
      // Direct Modifier形式
      return {
        type: 'direct_modifier',
        innerKeycode: modifierInfo.innerKeycode,
        modifierInfo: modifierInfo
      };
    }
  }

  // LT(layer, KC_XXX) 形式
  const ltMatch = keycode.match(/^LT(\d+)\((.+)\)$/)
  if (ltMatch) {
    return { type: 'layer_tap', innerKeycode: ltMatch[2], params: [ltMatch[1]] }
  }

  // 単純なキーコード
  return { type: 'simple' }
}

function reconstructComplexKeycode(parsed: { type: string; innerKeycode?: string; params?: string[]; modifierInfo?: ModifierInfo }, newInnerKeycode: string): string {
  switch (parsed.type) {
    case 'modifier_tap':
      // モディファイアTap形式を再構築
      if (parsed.modifierInfo) {
        const { side, mod } = parsed.modifierInfo;
        return `${side}${mod}_T(${newInnerKeycode})`;
      }
      return newInnerKeycode;
    case 'direct_modifier':
      // 直接モディファイア形式を再構築
      if (parsed.modifierInfo) {
        const { side, mod } = parsed.modifierInfo;
        return `${side}${mod}(${newInnerKeycode})`;
      }
      return newInnerKeycode;
    case 'layer_tap':
      return `LT${parsed.params![0]}(${newInnerKeycode})`
    default:
      return newInnerKeycode
  }
}

/**
 * Replace Rulesを適用したキーコード変換
 */
function applyReplaceRulesToKeycode(keycode: string | number, replaceRules: ReplaceRule[], languageId: string): string | number {
  // 数値や空値はそのまま返す
  if (typeof keycode === 'number' || !keycode) {
    return keycode
  }
  
  const keycodeStr = keycode.toString()
  
  // 複合キーコードの解析
  const parsed = parseComplexKeycode(keycodeStr)
  
  if (parsed.type === 'simple') {
    // 単純なキーコードの場合、従来の処理
    const character = getCharacterFromKeycode(keycodeStr, languageId)
    if (!character) {
      return keycode
    }

    return applyReplaceRulesToCharacter(character, keycodeStr, replaceRules, languageId)
  } else if (parsed.type === 'direct_modifier') {
    // 直接モディファイア形式（全モディファイア対応）
    const character = getCharacterFromKeycode(keycodeStr, languageId)
    if (!character) {
      return keycode
    }

    return applyReplaceRulesToCharacter(character, keycodeStr, replaceRules, languageId)
  } else {
    // modifier_tap, layer_tapの場合、内部キーコードのみ置換
    if (!parsed.innerKeycode) {
      return keycode
    }

    const innerCharacter = getCharacterFromKeycode(parsed.innerKeycode, languageId)
    if (!innerCharacter) {
      return keycode
    }

    const newInnerKeycode = applyReplaceRulesToCharacter(innerCharacter, parsed.innerKeycode, replaceRules, languageId)
    if (newInnerKeycode === parsed.innerKeycode) {
      return keycode // 変更なし
    }

    const result = reconstructComplexKeycode(parsed, newInnerKeycode.toString())
    return result
  }
}

/**
 * 文字ベースの置換処理（共通ロジック）
 */
function applyReplaceRulesToCharacter(character: string, originalKeycode: string, replaceRules: ReplaceRule[], languageId: string): string | number {
  // 有効で、かつ変換前後が認識されているルールのみをフィルタ
  const validRules = replaceRules.filter(rule => {
    if (!rule.enabled || !rule.from.trim() || !rule.to.trim()) {
      return false
    }
    
    // 変換前の文字が認識されているかチェック
    const fromKeycode = getKeycodeForCharacter(rule.from.trim(), languageId)
    if (!fromKeycode) {
      return false
    }
    
    // 変換後の文字が認識されているかチェック
    const toKeycode = getKeycodeForCharacter(rule.to.trim(), languageId)
    if (!toKeycode) {
      return false
    }
    
    return true
  })
  
  for (const rule of validRules) {
    const fromText = rule.from.trim()
    const toText = rule.to.trim()
    
    if (character === fromText) {
      // 置換先の文字からキーコードを逆引き（既に検証済み）
      const newKeycode = getKeycodeForCharacter(toText, languageId)!
      return newKeycode
    }
  }
  
  return originalKeycode
}

/**
 * Replace Rulesを適用してVILファイルを変換する
 */
export function convertVialConfigWithReplaceRules(config: VialConfig, replaceRules: ReplaceRule[], languageId: string): VialConfig {
  
  // ディープコピーを作成
  const convertedConfig: VialConfig = JSON.parse(JSON.stringify(config))
  
  let totalConverted = 0
  
  // レイアウトの各キーコードに置換ルールを適用
  convertedConfig.layout = config.layout.map((layer, layerIndex) => {
    const convertedLayer: { [rowIndex: number]: (string | number)[] } = {}
    
    // レイヤーの各行を処理
    for (const rowIndex in layer) {
      const row = layer[rowIndex]
      if (Array.isArray(row)) {
        convertedLayer[rowIndex] = row.map((keycode, keyIndex) => {
          const converted = applyReplaceRulesToKeycode(keycode, replaceRules, languageId)
          if (converted !== keycode) {
            totalConverted++
          }
          return converted
        })
      }
    }
    
    return convertedLayer
  })
  
  // コンボの変換（存在する場合）
  if (convertedConfig.combo) {
    convertedConfig.combo = convertedConfig.combo.map((combo: ComboInfo) => {
      if (combo.keycode) {
        const converted = applyReplaceRulesToKeycode(combo.keycode, replaceRules, languageId)
        if (converted !== combo.keycode) {
          totalConverted++
        }
        return { ...combo, keycode: converted }
      }
      return combo
    })
  }
  
  // タップダンスの変換（存在する場合）
  if (convertedConfig.tap_dance) {
    convertedConfig.tap_dance = convertedConfig.tap_dance.map((td: any) => {
      // タップダンス配列の各要素（通常は最初の4つがキーコード）
      const convertedTd = [...td]
      for (let i = 0; i < Math.min(4, td.length); i++) {
        if (typeof td[i] === 'string' || typeof td[i] === 'number') {
          const converted = applyReplaceRulesToKeycode(td[i], replaceRules, languageId)
          if (converted !== td[i]) {
            totalConverted++
          }
          convertedTd[i] = converted
        }
      }
      return convertedTd
    })
  }
  
  
  // 変換後の基本構造検証
  const validationResult = validateConvertedConfig(config, convertedConfig)
  if (!validationResult.isValid) {
    console.error('❌ Converted config validation failed:', validationResult.errors)
    throw new Error(`VILファイル変換後の検証に失敗しました: ${validationResult.errors.join(', ')}`)
  }
  
  return convertedConfig
}

/**
 * VILファイル変換後の基本構造を検証する
 */
function validateConvertedConfig(original: VialConfig, converted: VialConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    // レイアウト構造の検証
    if (!converted.layout || !Array.isArray(converted.layout)) {
      errors.push('layout配列が存在しないか、配列でない')
    } else {
      if (converted.layout.length !== original.layout.length) {
        errors.push(`レイヤー数が変化: ${original.layout.length} → ${converted.layout.length}`)
      }
      
      for (let layerIndex = 0; layerIndex < Math.min(original.layout.length, converted.layout.length); layerIndex++) {
        const originalLayer = original.layout[layerIndex]
        const convertedLayer = converted.layout[layerIndex]
        
        const originalRowCount = Object.keys(originalLayer).length
        const convertedRowCount = Object.keys(convertedLayer).length
        
        if (originalRowCount !== convertedRowCount) {
          errors.push(`レイヤー${layerIndex}の行数が変化: ${originalRowCount} → ${convertedRowCount}`)
        }
        
        for (const rowIndex of Object.keys(originalLayer)) {
          const originalRow = originalLayer[rowIndex]
          const convertedRow = convertedLayer[rowIndex]
          
          if (!convertedRow) {
            errors.push(`レイヤー${layerIndex}の行${rowIndex}が失われた`)
            continue
          }
          
          if (!Array.isArray(originalRow) || !Array.isArray(convertedRow)) {
            continue
          }
          
          if (originalRow.length !== convertedRow.length) {
            errors.push(`レイヤー${layerIndex}行${rowIndex}のキー数が変化: ${originalRow.length} → ${convertedRow.length}`)
          }
        }
      }
    }
    
    // Tap Dance構造の検証
    if (original.tap_dance && converted.tap_dance) {
      if (converted.tap_dance.length !== original.tap_dance.length) {
        errors.push(`タップダンス数が変化: ${original.tap_dance.length} → ${converted.tap_dance.length}`)
      }
      
      for (let i = 0; i < Math.min(original.tap_dance.length, converted.tap_dance.length); i++) {
        const originalTd = original.tap_dance[i]
        const convertedTd = converted.tap_dance[i]
        
        if (!Array.isArray(originalTd) || !Array.isArray(convertedTd)) {
          errors.push(`タップダンス${i}が配列でない`)
          continue
        }
        
        if (originalTd.length !== convertedTd.length) {
          errors.push(`タップダンス${i}の要素数が変化: ${originalTd.length} → ${convertedTd.length}`)
        }
        
        // タイミング値（最後の要素）が数値のままかチェック
        const lastIndex = convertedTd.length - 1
        if (lastIndex >= 0 && typeof originalTd[lastIndex] === 'number' && typeof convertedTd[lastIndex] !== 'number') {
          errors.push(`タップダンス${i}のタイミング値が数値でなくなった`)
        }
      }
    }
    
    // Combo構造の検証
    if (original.combo && converted.combo) {
      if (converted.combo.length !== original.combo.length) {
        errors.push(`コンボ数が変化: ${original.combo.length} → ${converted.combo.length}`)
      }
    }
    
    // 基本プロパティの存在確認
    const requiredProperties = ['version', 'uid', 'layout', 'macros', 'vial']
    for (const prop of requiredProperties) {
      if (prop in original && !(prop in converted)) {
        errors.push(`必須プロパティ'${prop}'が失われた`)
      }
    }
    
  } catch (error) {
    errors.push(`検証処理中にエラー: ${error}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 置換ルールを適用したVialConfigを取得（ダウンロード用）
 */
export function getReplacedVialConfig(config: VialConfig, replaceRules: ReplaceRule[], languageId: string): VialConfig {
  return convertVialConfigWithReplaceRules(config, replaceRules, languageId)
}

/**
 * 置換結果を反映したVILファイルをダウンロード
 */
export function downloadVilFileWithReplaceRules(config: VialConfig, replaceRules: ReplaceRule[], originalFilename: string, languageId: string) {
  // 置換ルールを適用してconfigを変換
  const convertedConfig = getReplacedVialConfig(config, replaceRules, languageId)
  
  // JSON文字列に変換（整形あり）
  const jsonString = JSON.stringify(convertedConfig, null, 2)
  
  // ファイル名を生成
  const baseName = originalFilename.replace(/\.vil$/, '')
  const newFilename = `${baseName}_replaced.vil`
  
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
  
}