import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { convertVialConfig, getReplacedVialConfig, downloadVilFile } from '../utils/vilConverter'
import { useSettingsStore } from './settings'
import type { VialConfig, ParsedVial } from '../utils/types'

export interface VialData {
  id: string
  name: string
  config: VialConfig
  content: string
  timestamp: number
}

export const useVialStore = defineStore('vial', () => {
  const vialFiles = ref<VialData[]>([])
  const selectedVialId = ref<string>('')
  
  
  // レガシーデータの変換処理
  const migrateData = () => {
    vialFiles.value = vialFiles.value.filter(file => {
      if (!file.content) {
        return false
      }
      return true
    })

    if (selectedVialId.value && !vialFiles.value.find(v => v.id === selectedVialId.value)) {
      selectedVialId.value = ''
    }

    // 選択されていない場合は常にsampleを選択
    if (!selectedVialId.value) {
      selectedVialId.value = 'sample'
    }
  }
  
  // 現在選択されているVILデータ
  const currentVial = computed(() => {
    return vialFiles.value.find(v => v.id === selectedVialId.value)
  })

  // 選択されているファイル名
  const selectedFileName = computed(() => {
    if (!selectedVialId.value || selectedVialId.value === 'sample') {
      return 'sample'
    }
    const selectedFile = vialFiles.value.find(f => f.id === selectedVialId.value)
    return selectedFile?.name || 'sample'
  })

  // キーボード構造に応じたサンプルファイルパスを取得
  const getSampleFilePath = (keyboardStructure: string): string => {
    return `/data/sample_${keyboardStructure}.vil`
  }

  // サンプルファイルを読み込む
  const loadSampleFile = async (keyboardStructure: string): Promise<VialConfig | null> => {
    try {
      const filePath = getSampleFilePath(keyboardStructure)
      const response = await fetch(filePath)
      if (!response.ok) {
        console.warn(`Sample file not found: ${filePath}`)
        return null
      }
      const config = await response.json()
      return config
    } catch (error) {
      console.error(`Failed to load sample file for ${keyboardStructure}:`, error)
      return null
    }
  }

  // VILデータを追加
  const addVialData = (name: string, config: VialConfig, content: string) => {
    const id = uuidv4()
    
    const vialData: VialData = {
      id,
      name,
      config,
      content,
      timestamp: Date.now(), // unixtime (number)
    }
    
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
    vialFiles.value = vialFiles.value.filter(v => v.id !== id)

    // 削除されたファイルが選択されている場合、空にする
    if (selectedVialId.value === id) {
      selectedVialId.value = ''
    }
  }

  // VILファイルを選択
  const selectVial = (id: string) => {
    selectedVialId.value = id
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

  /**
   * 現在のConfigを取得（Replace Rules適用状況を自動判断）
   */
  const getCurrentConfig = (fileId?: string): VialConfig | null => {
    const targetFile = fileId ? vialFiles.value.find(f => f.id === fileId) : currentVial.value
    if (!targetFile) return null

    const settingsStore = useSettingsStore()
    
    // Replace Rules適用が有効な場合
    if (settingsStore.enableReplacedVilDownload) {
      return getReplacedVialConfig(
        targetFile.config,
        settingsStore.replaceRules,
        settingsStore.keyboardLanguage
      )
    }
    
    // 通常のconfig
    return targetFile.config
  }

  /**
   * ファイルをダウンロード（Replace Rules適用状況を自動判断）
   */
  const downloadConfig = (fileId?: string) => {
    const targetFile = fileId ? vialFiles.value.find(f => f.id === fileId) : currentVial.value
    if (!targetFile) return

    const settingsStore = useSettingsStore()
    const config = getCurrentConfig(fileId)
    if (!config) return

    // Replace Rules適用が有効な場合はファイル名に_replacedを付加
    let filename = targetFile.name
    if (settingsStore.enableReplacedVilDownload) {
      const baseName = targetFile.name.replace(/\.vil$/, '')
      filename = `${baseName}_replaced.vil`
    }

    downloadVilFile(config, filename)
  }

  return {
    vialFiles,
    selectedVialId,
    currentVial,
    selectedFileName,
    addVialData,
    removeVialData,
    selectVial,
    convertLanguage,
    migrateData,
    getCurrentConfig,
    downloadConfig,
    loadSampleFile
  }
}, {
  persist: {
    key: 'vial-store',
    storage: localStorage
  }
})