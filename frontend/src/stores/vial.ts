import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { convertVialConfig } from '../utils/vilConverter'
import type { VialConfig, ParsedVial } from '../utils/types'

export interface VialData {
  id: string
  name: string
  config: VialConfig
  content: string
  timestamp: number
  parsedVial?: ParsedVial  // 新しいParsedVial構造体
}

export const useVialStore = defineStore('vial', () => {
  const vialFiles = ref<VialData[]>([])
  const selectedVialId = ref<string>('')
  
  console.log('🔍 VialStore: Manual localStorage check:', localStorage.getItem('vial-store'))
  
  // レガシーデータの変換処理
  const migrateData = () => {
    vialFiles.value = vialFiles.value.filter(file => {
      if (!file.content) {
        console.log('🔄 Removing legacy data without content:', file.name)
        return false
      }
      return true
    })
    
    // ParsedVialは画像作成時に必要に応じて計算する（事前計算はしない）
    
    if (selectedVialId.value && !vialFiles.value.find(v => v.id === selectedVialId.value)) {
      console.log('🔄 Resetting invalid selectedVialId')
      selectedVialId.value = ''
    }
  }
  
  // 現在選択されているVILデータ
  const currentVial = computed(() => {
    return vialFiles.value.find(v => v.id === selectedVialId.value)
  })

  // 現在のParsedVial
  const currentParsedVial = computed(() => {
    return currentVial.value?.parsedVial
  })

  // 選択されているファイル名
  const selectedFileName = computed(() => {
    console.log('🔍 selectedFileName computed:', {
      selectedVialId: selectedVialId.value,
      vialFilesLength: vialFiles.value.length,
      vialFiles: vialFiles.value.map(f => ({ id: f.id, name: f.name }))
    })
    
    if (!selectedVialId.value || selectedVialId.value === 'sample') {
      console.log('📝 selectedFileName returning "sample" (no selection or sample)')
      return 'sample'
    }
    const selectedFile = vialFiles.value.find(f => f.id === selectedVialId.value)
    const result = selectedFile?.name || 'sample'
    console.log('📝 selectedFileName result:', result, 'from selectedFile:', selectedFile)
    return result
  })

  // VILデータを追加
  const addVialData = (name: string, config: VialConfig, content: string) => {
    const id = uuidv4()
    console.log('📁 addVialData: Generated UUID:', id)
    console.log('📁 addVialData: content length:', content.length)
    
    // アップロード時はVialConfigのみ保存（ParsedVialは必要時に生成）
    const vialData: VialData = {
      id,
      name,
      config,
      content,
      timestamp: Date.now(), // unixtime (number)
      // parsedVial: undefined  // 必要時に生成
    }
    console.log('📁 addVialData: Created vialData with content:', !!vialData.content)
    console.log('📁 addVialData: Full vialData:', vialData)
    
    // 同名ファイルがあれば削除
    const existingIndex = vialFiles.value.findIndex(v => v.name === name)
    if (existingIndex > -1) {
      vialFiles.value.splice(existingIndex, 1)
    }
    
    vialFiles.value.unshift(vialData)
    selectedVialId.value = id
    return id
  }

  // VILデータを削除
  const removeVialData = (id: string) => {
    console.log('🗑️ removeVialData called with:', id)
    
    vialFiles.value = vialFiles.value.filter(v => v.id !== id)
    console.log('🗑️ Removed from array, new length:', vialFiles.value.length)
    
    // 削除されたファイルが選択されている場合、空にする
    if (selectedVialId.value === id) {
      selectedVialId.value = ''
      console.log('🗑️ Reset selectedVialId to empty')
    }
  }

  // VILファイルを選択
  const selectVial = (id: string) => {
    console.log('🎯 VialStore: selectVial called with:', id)
    selectedVialId.value = id
    console.log('✅ VialStore: selectedVialId updated to:', selectedVialId.value)
    // ParsedVialは画像作成時に必要に応じて計算する
  }

  // 言語変換を実行
  const convertLanguage = async (fromLanguage: string, toLanguage: string) => {
    const vial = currentVial.value
    if (!vial) {
      throw new Error('変換対象のVILファイルが選択されていません')
    }

    // 変換実行
    const convertedConfig = convertVialConfig(vial.config, fromLanguage, toLanguage)
    
    // 変換されたVILをJSONに変換
    const jsonContent = JSON.stringify(convertedConfig, null, 2)
    
    // ファイル名を生成
    const baseName = vial.name.replace(/\.vil$/, '')
    const newFileName = `${baseName}_${toLanguage}.vil`
    
    // recent filesに追加
    addVialData(newFileName, convertedConfig, jsonContent)
    
    // レイアウト言語を変換後の言語に変更
    const { useSettingsStore } = await import('./settings')
    const settingsStore = useSettingsStore()
    settingsStore.setKeyboardLanguage(toLanguage)
    
    // UIストアを使用してプレビュータブに移動
    const { useUiStore } = await import('./ui')
    const uiStore = useUiStore()
    uiStore.setActiveTab('preview')
    
    return `変換完了: ${fromLanguage} → ${toLanguage}`
  }


  return {
    vialFiles,
    selectedVialId,
    currentVial,
    currentParsedVial,
    selectedFileName,
    addVialData,
    removeVialData,
    selectVial,
    convertLanguage,
    migrateData
  }
}, {
  persist: {
    key: 'vial-store',
    storage: localStorage
  }
})