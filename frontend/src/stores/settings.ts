import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentKeyboardLanguage, setCurrentKeyboardLanguage } from '../utils/keyboardConfig'
import type { ReplaceRule } from '../utils/types'

export const useSettingsStore = defineStore('settings', () => {
  const keyboardLanguage = ref(getCurrentKeyboardLanguage().id)
  const replaceRules = ref<ReplaceRule[]>([])
  const outputFormat = ref<'separated' | 'vertical' | 'horizontal'>('separated')
  const showLabels = ref(true)
  const enableDarkMode = ref(false)
  const keySize = ref(50)
  const fontSize = ref(12)
  const spacing = ref(5)
  
  // Advanced settings
  const highlightEnabled = ref(false)
  const showCombos = ref(true)
  const showHeader = ref(true)
  
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
  const setOutputFormat = (format: 'separated' | 'vertical' | 'horizontal') => {
    outputFormat.value = format
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
  
  
  return {
    keyboardLanguage,
    replaceRules,
    outputFormat,
    showLabels,
    enableDarkMode,
    keySize,
    fontSize,
    spacing,
    highlightEnabled,
    showCombos,
    showHeader,
    layerSelection,
    setKeyboardLanguage,
    setReplaceRules,
    addReplaceRule,
    updateReplaceRule,
    removeReplaceRule,
    setOutputFormat,
    toggleLabels,
    toggleDarkMode,
    setKeySize,
    setFontSize,
    setSpacing
  }
}, {
  persist: true
})