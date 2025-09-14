import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  title?: string
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
  
  // Debounced処理用
  let generateTimeout: NodeJS.Timeout | null = null
  
  // Debounced画像生成（imagesStoreとの連携）
  const debouncedGeneratePreview = () => {
    console.log('🔄 Setting changed, regenerating in 100ms...')
    if (generateTimeout) {
      clearTimeout(generateTimeout)
    }
    generateTimeout = setTimeout(async () => {
      // imagesStoreを動的にインポート（循環依存回避）
      const { useImagesStore } = await import('./images')
      const { useVialStore } = await import('./vial')
      const imagesStore = useImagesStore()
      const vialStore = useVialStore()
      
      await imagesStore.generatePreviewImages()
    }, 100)
  }
  
  // URL hash関連の処理
  const getInitialTabFromHash = (): 'select' | 'preview' | 'output' => {
    if (typeof window === 'undefined') return 'preview'
    const hash = window.location.hash
    if (hash.startsWith('#/')) {
      const path = hash.substring(2)
      if (path === 'select' || path === 'preview' || path === 'output') {
        return path
      }
    }
    return 'preview'
  }
  
  const updateHash = (tab: 'select' | 'preview' | 'output') => {
    if (typeof window !== 'undefined') {
      window.location.hash = `#/${tab}`
    }
  }
  
  const handleHashChange = () => {
    if (typeof window === 'undefined') return
    const newTab = getInitialTabFromHash()
    if (newTab !== activeTab.value) {
      activeTab.value = newTab
    }
  }
  
  const initializeHashSync = () => {
    if (typeof window === 'undefined') return
    
    // 初期タブを設定
    const initialTab = getInitialTabFromHash()
    activeTab.value = initialTab
    
    // タブ変更時にハッシュを更新
    watch(() => activeTab.value, (newTab) => {
      updateHash(newTab)
    })
    
    // ハッシュ変更を監視
    window.addEventListener('hashchange', handleHashChange)
  }
  
  const cleanupHashSync = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }
  
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
  
  // アクティブタブを設定
  const setActiveTab = (tab: 'select' | 'preview' | 'output') => {
    activeTab.value = tab
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
    setActiveTab,
    toggleSidebarCollapsed,
    debouncedGeneratePreview,
    initializeHashSync,
    cleanupHashSync,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})