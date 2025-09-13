import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCurrentKeyboardLanguage, setCurrentKeyboardLanguage, getKeycodeForCharacter } from '../utils/keyboardConfig'
import type { ReplaceRule } from '../utils/types'

export const useSettingsStore = defineStore('settings', () => {
  const keyboardLanguage = ref(getCurrentKeyboardLanguage().id)
  const replaceRules = ref<ReplaceRule[]>([])
  const outputFormat = ref<'separated' | 'vertical' | 'rectangular'>('separated')
  const showLabels = ref(true)
  const enableDarkMode = ref(false)
  const keySize = ref(50)
  const fontSize = ref(12)
  const spacing = ref(5)
  const outputLabel = ref('')
  
  // Advanced settings
  const highlightEnabled = ref(false)
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
    console.log('🔄 Setting keyboard language:', languageId)
    keyboardLanguage.value = languageId
    setCurrentKeyboardLanguage(languageId)
    console.log('✅ Keyboard language set, localStorage:', localStorage.getItem('vial-keyboard-language'))
    
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
  
  // ラベル表示を切り替え
  const toggleLabels = (show: boolean) => {
    showLabels.value = show
      }
  
  // ダークモードを切り替え
  const toggleDarkMode = (enabled: boolean) => {
    enableDarkMode.value = enabled
      }
  
  // キーサイズを変更
  const setKeySize = (size: number) => {
    keySize.value = size
      }
  
  // フォントサイズを変更
  const setFontSize = (size: number) => {
    fontSize.value = size
      }
  
  // スペーシングを変更
  const setSpacing = (space: number) => {
    spacing.value = space
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
  
  return {
    keyboardLanguage,
    replaceRules,
    outputFormat,
    showLabels,
    enableDarkMode,
    keySize,
    fontSize,
    spacing,
    outputLabel,
    highlightEnabled,
    showCombos,
    showHeader,
    enableReplacedVilDownload,
    layerSelection,
    setKeyboardLanguage,
    setReplaceRules,
    addReplaceRule,
    updateReplaceRule,
    removeReplaceRule,
    setOutputFormat,
    cycleOutputFormat,
    toggleLabels,
    toggleDarkMode,
    toggleHighlight,
    setKeySize,
    setFontSize,
    setSpacing,
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