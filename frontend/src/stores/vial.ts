import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { convertVialConfig, downloadVilFile, type VialConfig } from '../utils/vilConverter'

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
    
    if (selectedVialId.value && !vialFiles.value.find(v => v.id === selectedVialId.value)) {
      console.log('🔄 Resetting invalid selectedVialId')
      selectedVialId.value = ''
    }
  }
  
  // 現在選択されているVILデータ
  const currentVial = computed(() => {
    return vialFiles.value.find(v => v.id === selectedVialId.value)
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
    const vialData: VialData = {
      id,
      name,
      config,
      content,
      timestamp: Date.now() // unixtime (number)
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
  }

  // 言語変換を実行
  const convertLanguage = async (fromLanguage: string, toLanguage: string) => {
    const vial = currentVial.value
    if (!vial) {
      throw new Error('変換対象のVILファイルが選択されていません')
    }

    // 変換実行
    const convertedConfig = convertVialConfig(vial.config, fromLanguage, toLanguage)
    
    // ダウンロード
    downloadVilFile(convertedConfig, vial.name, toLanguage)
    
    return `変換完了: ${fromLanguage} → ${toLanguage}`
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
    migrateData
  }
}, {
  persist: {
    key: 'vial-store',
    storage: localStorage,
    afterRestore: (ctx) => {
      console.log('✅ VialStore: Data restored, running migration')
      ctx.store.migrateData()
    }
  }
})