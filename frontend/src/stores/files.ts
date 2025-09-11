import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface RecentFile {
  id: string
  name: string
  timestamp: Date
  content: string
  type: string
}

export const useFilesStore = defineStore('files', () => {
  const recentFiles = ref<RecentFile[]>([])
  const selectedFile = ref<string>('sample')
  const selectedDisplayFile = ref<string>('sample')

  // ファイルを追加
  const addRecentFile = (file: RecentFile) => {
    const existingIndex = recentFiles.value.findIndex(f => f.name === file.name)
    if (existingIndex > -1) {
      recentFiles.value.splice(existingIndex, 1)
    }
    recentFiles.value.unshift(file)
    saveRecentFiles()
  }

  // ファイルを削除
  const removeRecentFile = (fileId: string) => {
    const index = recentFiles.value.findIndex(f => f.id === fileId)
    if (index > -1) {
      const removedFile = recentFiles.value[index]
      recentFiles.value.splice(index, 1)
      saveRecentFiles()
      
      // 削除されたファイルが現在選択されている場合、サンプルに戻す
      if (selectedFile.value === removedFile.name) {
        selectedFile.value = 'sample'
        selectedDisplayFile.value = 'sample'
      }
    }
  }

  // ファイルを選択
  const selectFile = (fileName: string) => {
    selectedFile.value = fileName
    selectedDisplayFile.value = fileName
  }

  // LocalStorageに保存
  const saveRecentFiles = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vial-recent-files', JSON.stringify(recentFiles.value))
    }
  }

  // LocalStorageから読み込み
  const loadRecentFiles = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vial-recent-files')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          recentFiles.value = parsed.map((file: {name: string, timestamp: string}) => ({
            ...file,
            timestamp: new Date(file.timestamp)
          }))
        } catch (error) {
          console.error('Failed to load recent files:', error)
        }
      }
    }
  }

  return {
    recentFiles,
    selectedFile,
    selectedDisplayFile,
    addRecentFile,
    removeRecentFile,
    selectFile,
    saveRecentFiles,
    loadRecentFiles
  }
})