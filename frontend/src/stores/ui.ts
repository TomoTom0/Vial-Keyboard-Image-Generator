import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timeout?: number
}

export const useUiStore = defineStore('ui', () => {
  const isGenerating = ref(false)
  const isGenerated = ref(false)
  const activeTab = ref('preview')
  const controlPanelTab = ref<'layout' | 'upload' | 'format'>('upload')
  const sidebarSection = ref<'files' | 'generate' | 'settings'>('files')
  const sidebarCollapsed = ref(false)
  const toasts = ref<ToastMessage[]>([])
  const error = ref<string | null>(null)
  
  // サイドバーの折りたたみ状態を切り替え
  const toggleSidebarCollapsed = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  // トーストを追加
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    toasts.value.push(newToast)
    
    // 自動削除
    const timeout = toast.timeout || 5000
    setTimeout(() => {
      removeToast(newToast.id)
    }, timeout)
    
    return newToast.id
  }
  
  // トーストを削除
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  // 全トーストをクリア
  const clearToasts = () => {
    toasts.value = []
  }
  
  // 成功トーストを表示
  const showSuccess = (message: string, timeout?: number) => {
    return addToast({ type: 'success', message, timeout })
  }
  
  // エラートーストを表示
  const showError = (message: string, timeout?: number) => {
    return addToast({ type: 'error', message, timeout })
  }
  
  // 警告トーストを表示
  const showWarning = (message: string, timeout?: number) => {
    return addToast({ type: 'warning', message, timeout })
  }
  
  // 情報トーストを表示
  const showInfo = (message: string, timeout?: number) => {
    return addToast({ type: 'info', message, timeout })
  }
  
  return {
    isGenerating,
    isGenerated,
    activeTab,
    controlPanelTab,
    sidebarSection,
    sidebarCollapsed,
    toasts,
    error,
    toggleSidebarCollapsed,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})