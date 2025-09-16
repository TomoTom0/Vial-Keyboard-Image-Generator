import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getCurrentKeyboardLanguage, setCurrentKeyboardLanguage, getKeycodeForCharacter } from '../utils/keyboardConfig'
import type { ReplaceRule } from '../utils/types'

interface LanguageInfo {
  language: string
  abbreviation: string
  display_name: string
}

export const useSettingsStore = defineStore('settings', () => {
  const keyboardLanguage = ref(getCurrentKeyboardLanguage().id)
  const replaceRules = ref<ReplaceRule[]>([])
  const languageInfos = ref<LanguageInfo[]>([])
  const outputFormat = ref<'separated' | 'vertical' | 'rectangular'>('vertical')
  const showLabels = ref(true)
  const enableDarkMode = ref(true)
  const imageFormat = ref<'png' | 'svg'>('png')
  const keySize = ref(50)
  const fontSize = ref(12)
  const spacing = ref(5)
  const outputLabel = ref('')
  
  // Advanced settings
  const highlightLevel = ref<number>(30) // 10=off, 20=weak, 30=strong
  const showCombos = ref(true)
  const showHeader = ref(true)
  const enableReplacedVilDownload = ref(false)
  
  // Layer selection
  const layerSelection = ref({
    0: true,
    1: true,
    2: true,
    3: true,
    4: false,
    5: false
  })
  
  // キーボード言語を変更
  const setKeyboardLanguage = (languageId: string) => {
    keyboardLanguage.value = languageId
    setCurrentKeyboardLanguage(languageId)
    
    // 言語変更時にバリデーション状態を更新
    updateReplaceRulesValidation()
  }
  
  // 置換ルールを設定（全体更新）
  const setReplaceRules = (rules: ReplaceRule[]) => {
    replaceRules.value = rules
  }
  
  // 置換ルールを追加
  const addReplaceRule = (rule: Omit<ReplaceRule, 'id'>) => {
    const newRule: ReplaceRule = {
      ...rule,
      id: `rule_${Date.now()}`
    }
    replaceRules.value.push(newRule)
  }
  
  // 置換ルールを更新
  const updateReplaceRule = (id: string, updates: Partial<ReplaceRule>) => {
    const index = replaceRules.value.findIndex(rule => rule.id === id)
    if (index > -1) {
      replaceRules.value[index] = { ...replaceRules.value[index], ...updates }
    }
  }
  
  // 置換ルールを削除
  const removeReplaceRule = (id: string) => {
    const index = replaceRules.value.findIndex(rule => rule.id === id)
    if (index > -1) {
      replaceRules.value.splice(index, 1)
    }
  }
  
  // 出力フォーマットを変更
  const setOutputFormat = (format: 'separated' | 'vertical' | 'rectangular') => {
    outputFormat.value = format
  }
  
  // 出力フォーマットを循環切り替え
  const cycleOutputFormat = (direction: number = 1) => {
    const formats: ('separated' | 'vertical' | 'rectangular')[] = ['separated', 'vertical', 'rectangular']
    const currentIndex = formats.indexOf(outputFormat.value)
    let newIndex = (currentIndex + direction) % formats.length
    if (newIndex < 0) newIndex = formats.length - 1
    outputFormat.value = formats[newIndex]
  }

  // イメージフォーマットを変更
  const setImageFormat = (format: 'png' | 'svg') => {
    imageFormat.value = format
  }

  // イメージフォーマットを循環切り替え
  const cycleImageFormat = (direction: number = 1) => {
    const formats: ('png' | 'svg')[] = ['png', 'svg']
    const currentIndex = formats.indexOf(imageFormat.value)
    let newIndex = (currentIndex + direction) % formats.length
    if (newIndex < 0) newIndex = formats.length - 1
    imageFormat.value = formats[newIndex]
  }
  
  
  // ハイライトを切り替え
  const toggleHighlight = () => {
    highlightEnabled.value = !highlightEnabled.value
  }
  
  // 置換ルールのバリデーション（現在の言語で文字からキーコードを取得できるかチェック）
  const validateReplaceRule = (rule: ReplaceRule): 'valid' | 'invalid' | 'unknown' => {
    // 空のルールはunknown
    if (!rule.from.trim() || !rule.to.trim()) {
      return 'unknown'
    }
    
    // 現在の言語で文字からキーコードを取得できるかチェック
    const fromKeycode = getKeycodeForCharacter(rule.from.trim(), keyboardLanguage.value)
    const toKeycode = getKeycodeForCharacter(rule.to.trim(), keyboardLanguage.value)
    
    // 両方のキーコードが取得でき、ルールが有効な場合
    if (fromKeycode && toKeycode && rule.enabled) {
      return 'valid'
    }
    
    // その他は無効
    return 'invalid'
  }
  
  // 置換ルールのバリデーション詳細（無効な理由を含む）
  const validateReplaceRuleWithReason = (rule: ReplaceRule): { status: 'valid' | 'invalid' | 'unknown', reason?: string } => {
    // 空のルールはunknown
    if (!rule.from.trim() || !rule.to.trim()) {
      return { status: 'unknown' }
    }
    
    // ルールが無効になっている場合
    if (!rule.enabled) {
      return { status: 'invalid', reason: 'ルールが無効になっています' }
    }
    
    // 現在の言語で文字からキーコードを取得できるかチェック
    const fromKeycode = getKeycodeForCharacter(rule.from.trim(), keyboardLanguage.value)
    const toKeycode = getKeycodeForCharacter(rule.to.trim(), keyboardLanguage.value)
    
    // From文字が無効
    if (!fromKeycode && !toKeycode) {
      return { status: 'invalid', reason: `"${rule.from}" と "${rule.to}" が現在の言語 (${getLanguageName(keyboardLanguage.value)}) で認識されません` }
    } else if (!fromKeycode) {
      return { status: 'invalid', reason: `"${rule.from}" が現在の言語 (${getLanguageName(keyboardLanguage.value)}) で認識されません` }
    } else if (!toKeycode) {
      return { status: 'invalid', reason: `"${rule.to}" が現在の言語 (${getLanguageName(keyboardLanguage.value)}) で認識されません` }
    }
    
    // 両方のキーコードが取得できる場合
    return { status: 'valid' }
  }
  
  // 言語名を取得
  const getLanguageName = (languageId: string): string => {
    switch (languageId) {
      case 'japanese': return 'Japanese'
      case 'english': return 'English'
      default: return languageId
    }
  }
  
  // TSVファイルから言語情報を読み込み
  const loadLanguageInfos = async () => {
    try {
      const response = await fetch('/data/languages.tsv')
      if (!response.ok) {
        throw new Error(`Failed to load languages.tsv: ${response.status}`)
      }
      const text = await response.text()
      const lines = text.trim().split('\n')
      const headers = lines[0].split('\t')
      
      languageInfos.value = lines.slice(1).map(line => {
        const values = line.split('\t')
        return {
          language: values[0] || '',
          abbreviation: values[1] || '',
          display_name: values[2] || ''
        }
      })
    } catch (error) {
      console.error('Failed to load language infos:', error)
      // フォールバック
      languageInfos.value = [
        { language: 'japanese', abbreviation: 'JA', display_name: 'Japanese' },
        { language: 'english', abbreviation: 'EN', display_name: 'English' }
      ]
    }
  }
  
  // 現在の言語の略称を取得
  const currentLanguageAbbreviation = computed(() => {
    const info = languageInfos.value.find(info => info.language === keyboardLanguage.value)
    return info?.abbreviation || 'JA'
  })
  
  // 単一フィールドのバリデーション（FromまたはTo個別用）
  const validateSingleField = (text: string): 'valid' | 'invalid' | 'none' => {
    if (!text.trim()) {
      return 'none'
    }
    
    // 現在の言語で文字からキーコードを取得できるかチェック
    const keycode = getKeycodeForCharacter(text.trim(), keyboardLanguage.value)
    
    return keycode ? 'valid' : 'invalid'
  }
  
  // 全ての置換ルールのバリデーション状態を更新
  const updateReplaceRulesValidation = () => {
    replaceRules.value = replaceRules.value.map(rule => ({
      ...rule,
      validationStatus: validateReplaceRule(rule)
    }))
  }
  
  // Display columns計算（Select用：全レイヤー数ベース）
  const selectDisplayColumns = computed(() => {
    if (outputFormat.value === 'vertical') {
      return 1
    } else if (outputFormat.value === 'rectangular') {
      return 3  // 6レイヤーを3列表示 (L0,L1,L2 / L3,L4,L5)
    } else { // separated
      return 3  // 6レイヤーを3列表示
    }
  })

  // Display columns計算（Preview用：選択レイヤー数ベース）
  const previewDisplayColumns = computed(() => {
    const selectedCount = Object.values(layerSelection.value).filter(Boolean).length
    
    if (outputFormat.value === 'vertical') {
      return 1
    } else if (selectedCount >= 5) {
      return 3  // 5-6レイヤー
    } else if (selectedCount >= 2) {
      return 2  // 2-4レイヤー
    } else {
      return 1  // 1レイヤー
    }
  })
  
  // outputFormat変更時に画像を再生成
  watch(() => outputFormat.value, async (newFormat, oldFormat) => {
    if (oldFormat !== undefined) { // 初期化時は実行しない
      const { useImagesStore } = await import('./images')
      const imagesStore = useImagesStore()
      await imagesStore.generatePreviewImages()
    }
  })

  // imageFormat変更時に画像を再生成
  watch(() => imageFormat.value, async (newFormat, oldFormat) => {
    if (oldFormat !== undefined) { // 初期化時は実行しない
      const { useImagesStore } = await import('./images')
      const imagesStore = useImagesStore()
      await imagesStore.generatePreviewImages()
    }
  })

  // 後方互換性のためのcomputed（highlightEnabledをhighlightLevelから導出）
  const highlightEnabled = computed(() => highlightLevel.value > 10)

  return {
    keyboardLanguage,
    replaceRules,
    outputFormat,
    showLabels,
    enableDarkMode,
    imageFormat,
    keySize,
    fontSize,
    spacing,
    outputLabel,
    highlightLevel,
    highlightEnabled,
    showCombos,
    showHeader,
    enableReplacedVilDownload,
    layerSelection,
    languageInfos,
    currentLanguageAbbreviation,
    loadLanguageInfos,
    setKeyboardLanguage,
    setReplaceRules,
    addReplaceRule,
    updateReplaceRule,
    removeReplaceRule,
    setOutputFormat,
    cycleOutputFormat,
    setImageFormat,
    cycleImageFormat,
    toggleHighlight,
    validateReplaceRule,
    validateReplaceRuleWithReason,
    validateSingleField,
    updateReplaceRulesValidation,
    selectDisplayColumns,
    previewDisplayColumns
  }
}, {
  persist: true
})