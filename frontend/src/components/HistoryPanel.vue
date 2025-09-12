<template>
  <div class="history-panel">
    <div class="panel-header">
      <h3>📋 生成履歴</h3>
      <div class="header-actions">
        <button 
          @click="refreshHistory" 
          class="refresh-button"
          :disabled="isLoading"
        >
          🔄 更新
        </button>
        <button 
          @click="clearAllHistory" 
          class="clear-button"
          :disabled="history.length === 0"
        >
          🗑️ クリア
        </button>
      </div>
    </div>

    <!-- 統計情報 -->
    <div v-if="stats" class="stats-section">
      <div class="stat-item">
        <span class="stat-label">総生成数:</span>
        <span class="stat-value">{{ stats.totalGenerations }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">総画像数:</span>
        <span class="stat-value">{{ stats.totalImages }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">キャッシュ使用:</span>
        <span class="stat-value">{{ stats.cacheHitRate }}%</span>
      </div>
    </div>

    <!-- 履歴リスト -->
    <div class="history-content">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>履歴を読み込み中...</p>
      </div>

      <div v-else-if="history.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>まだ生成履歴がありません</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="entry in history"
          :key="entry.id"
          class="history-item"
          :class="{ 'cached': entry.cached }"
          @click="selectHistoryEntry(entry)"
        >
          <div class="history-main">
            <div class="history-info">
              <h4 class="history-filename">{{ entry.filename }}</h4>
              <div class="history-meta">
                <span class="history-timestamp">{{ formatDateTime(entry.timestamp) }}</span>
                <span v-if="entry.cached" class="cached-badge">📦 キャッシュ</span>
              </div>
            </div>
            <div class="history-settings">
              <div class="setting-tags">
                <span class="tag theme-tag" :class="entry.options.theme">
                  {{ entry.options.theme === 'dark' ? '🌙' : '☀️' }}
                </span>
                <span class="tag format-tag">
                  {{ getFormatIcon(entry.options.format) }}
                </span>
                <span v-if="entry.options.showComboInfo" class="tag combo-tag">
                  🎯
                </span>
              </div>
              <div class="layer-info">
                <span class="layer-range">
                  L{{ entry.options.layerRange?.start || 0 }}-{{ entry.options.layerRange?.end || 3 }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="history-actions">
            <button 
              @click.stop="regenerateFromHistory(entry)"
              class="action-btn regenerate-btn"
              title="再生成"
            >
              🔄
            </button>
            <button 
              @click.stop="duplicateSettings(entry)"
              class="action-btn duplicate-btn"
              title="設定を複製"
            >
              📋
            </button>
            <button 
              @click.stop="removeHistoryEntry(entry.id)"
              class="action-btn remove-btn"
              title="履歴から削除"
            >
              ❌
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ページネーション -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="currentPage > 1 && (currentPage--)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        ← 前
      </button>
      <span class="page-info">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button 
        @click="currentPage < totalPages && (currentPage++)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        次 →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface HistoryEntry {
  id: string
  filename: string
  timestamp: Date
  cached: boolean
  options: {
    theme: 'dark' | 'light'
    format: 'vertical' | 'horizontal' | 'individual'
    layerRange?: { start: number; end: number }
    showComboInfo?: boolean
  }
}

const emit = defineEmits<{
  regenerate: [entry: HistoryEntry]
  settingsSelected: [options: HistoryEntry['options']]
}>()

const history = ref<HistoryEntry[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

// ページネーション
const totalPages = computed(() => Math.ceil(history.value.length / itemsPerPage))
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return history.value.slice(start, end)
})

// 統計情報
const stats = computed(() => {
  if (history.value.length === 0) return null

  const totalGenerations = history.value.length
  const totalImages = history.value.reduce((sum, entry) => {
    // 形式に基づいて推定画像数を計算
    const layerCount = (entry.options.layerRange?.end || 3) - (entry.options.layerRange?.start || 0) + 1
    let imageCount = 0
    
    if (entry.options.format === 'individual') {
      imageCount = layerCount
    } else if (entry.options.format === 'vertical' || entry.options.format === 'horizontal') {
      imageCount = layerCount + 1 // レイヤー + 結合画像
    }
    
    return sum + imageCount
  }, 0)
  
  const cachedEntries = history.value.filter(entry => entry.cached).length
  const cacheHitRate = totalGenerations > 0 
    ? Math.round((cachedEntries / totalGenerations) * 100) 
    : 0

  return {
    totalGenerations,
    totalImages,
    cacheHitRate
  }
})

// 履歴を読み込み
const loadHistory = async () => {
  isLoading.value = true
  try {
    // ローカルストレージから履歴を読み込み
    const saved = localStorage.getItem('vial-generation-history')
    if (saved) {
      const parsed = JSON.parse(saved)
      history.value = parsed.map((entry: {timestamp: string, settings: object, images: object[]}) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })).sort((a: HistoryEntry, b: HistoryEntry) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )
    }
  } catch (error) {
    console.error('Failed to load history:', error)
    history.value = []
  } finally {
    isLoading.value = false
  }
}

// 履歴を保存
const saveHistory = () => {
  try {
    localStorage.setItem('vial-generation-history', JSON.stringify(history.value))
  } catch (error) {
    console.error('Failed to save history:', error)
  }
}

// 履歴エントリを追加
const addHistoryEntry = (entry: Omit<HistoryEntry, 'id'>) => {
  const newEntry: HistoryEntry = {
    ...entry,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // 重複チェック（同じファイル名・設定・時間が近い場合は追加しない）
  const isDuplicate = history.value.some(existing => {
    const timeDiff = Math.abs(existing.timestamp.getTime() - newEntry.timestamp.getTime())
    return existing.filename === newEntry.filename &&
           JSON.stringify(existing.options) === JSON.stringify(newEntry.options) &&
           timeDiff < 5000 // 5秒以内
  })

  if (!isDuplicate) {
    history.value.unshift(newEntry)
    
    // 最大100件まで保持
    if (history.value.length > 100) {
      history.value = history.value.slice(0, 100)
    }
    
    saveHistory()
  }
}

// 履歴を更新
const refreshHistory = async () => {
  await loadHistory()
}

// 全履歴をクリア
const clearAllHistory = () => {
  if (confirm('全ての生成履歴を削除しますか？')) {
    history.value = []
    saveHistory()
  }
}

// 履歴エントリを選択
const selectHistoryEntry = (entry: HistoryEntry) => {
  console.log('Selected history entry:', entry)
}

// 履歴から再生成
const regenerateFromHistory = (entry: HistoryEntry) => {
  emit('regenerate', entry)
}

// 設定を複製
const duplicateSettings = (entry: HistoryEntry) => {
  emit('settingsSelected', entry.options)
}

// 履歴エントリを削除
const removeHistoryEntry = (entryId: string) => {
  history.value = history.value.filter(entry => entry.id !== entryId)
  saveHistory()
}

// フォーマットアイコンを取得
const getFormatIcon = (format: string): string => {
  switch (format) {
    case 'vertical': return '📱'
    case 'horizontal': return '💻'
    case 'individual': return '🔢'
    default: return '📄'
  }
}

// 日時フォーマット
const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 外部から履歴を追加するためのメソッドを公開
defineExpose({
  addHistoryEntry
})

onMounted(() => {
  loadHistory()
})

// ページ変更時にスクロールをトップに
watch(currentPage, () => {
  const historyContent = document.querySelector('.history-content')
  if (historyContent) {
    historyContent.scrollTop = 0
  }
})
</script>

<style scoped lang="scss">
.history-panel {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 1.1rem;
  color: #2d3748;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-button,
.clear-button {
  background: none;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.refresh-button:hover {
  background: #edf2f7;
}

.clear-button:hover:not(:disabled) {
  background: #fed7d7;
  border-color: #fc8181;
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-section {
  padding: 1rem 1.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.8rem;
}

.stat-label {
  color: #718096;
  margin-bottom: 0.25rem;
}

.stat-value {
  color: #2d3748;
  font-weight: 600;
}

.history-content {
  max-height: 400px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  padding: 2rem;
  text-align: center;
  color: #718096;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.history-list {
  padding: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.history-item:hover {
  background: #f7fafc;
  border-color: #e2e8f0;
}

.history-item.cached {
  background: #ebf8ff;
  border-color: #bee3f8;
}

.history-main {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.history-info {
  flex: 1;
}

.history-filename {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.25rem 0;
  word-break: break-all;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-timestamp {
  font-size: 0.75rem;
  color: #718096;
}

.cached-badge {
  font-size: 0.7rem;
  background: #4299e1;
  color: white;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
}

.history-settings {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.setting-tags {
  display: flex;
  gap: 0.25rem;
}

.tag {
  font-size: 0.7rem;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-weight: 500;
}

.theme-tag.dark {
  background: #4a5568;
  color: white;
}

.theme-tag.light {
  background: #fed7d7;
  color: #c53030;
}

.format-tag {
  background: #e2e8f0;
  color: #4a5568;
}

.combo-tag {
  background: #c6f6d5;
  color: #22543d;
}

.layer-info {
  font-size: 0.7rem;
  color: #718096;
}

.history-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.regenerate-btn:hover {
  background: #ebf8ff;
}

.duplicate-btn:hover {
  background: #f0fff4;
}

.remove-btn:hover {
  background: #fed7d7;
}

.pagination {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-btn {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #3182ce;
}

.page-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.8rem;
  color: #718096;
}

@media (max-width: 480px) {
  .history-panel {
    max-width: none;
  }
  
  .history-main {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .history-settings {
    align-items: flex-start;
  }
  
  .stats-section {
    justify-content: center;
  }
}
</style>