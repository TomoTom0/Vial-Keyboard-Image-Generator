<template>
  <div class="file-history">
    <div v-if="vialStore.vialFiles.length === 0" class="empty-state">
      No recent files
    </div>
    <div v-else class="file-list">
      <button
        v-for="file in displayedFiles"
        :key="file.id"
        :class="['file-item', { 'selected': isSelected(file) }]"
        @click="selectFile(file)"
      >
        <div class="file-content">
          <div class="file-name">{{ file.name }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useVialStore } from '../stores/vial'
// 他のストアのimportは削除（VialStoreで自動判断）
import type { VialData } from '../stores/vial'

const vialStore = useVialStore()

const displayedFiles = computed(() => {
  return vialStore.vialFiles.slice(0, 6)
})

const isSelected = (file: VialData): boolean => {
  return vialStore.selectedVialId === file.id
}

const selectFile = (file: VialData) => {
  // 既に選択されているファイルをクリックした場合は選択解除
  if (vialStore.selectedVialId === file.id) {
    vialStore.selectVial('sample')
  } else {
    vialStore.selectVial(file.id)
  }
}

const downloadFile = (file: VialData) => {
  vialStore.downloadConfig(file.id) // Store経由で自動判断（特定ファイル指定）
}

const deleteFile = (file: VialData) => {
  vialStore.removeVialData(file.id)
}
</script>

<style scoped lang="scss">
.file-history {
  display: contents;
}


.empty-state {
  text-align: center;
  padding: 16px;
  color: #9ca3af;
  font-size: 13px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafbfc;
}

.file-list {
  display: contents;
}

.file-item {
  width: 100%;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 50px;
  position: relative;
  z-index: 1;
  outline: none;
  margin-bottom: 4px;
}

.file-item:focus {
  outline: none;
}

.file-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.file-item:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.file-item.selected {
  background: #eff6ff !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.file-name {
  font-size: 12px;
  font-weight: 500;
  word-break: break-word;
  color: #111827;
  line-height: 1.3;
  flex: 1;
  text-align: left;
}

.file-item.selected .file-name {
  color: #1d4ed8;
}

.file-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: center;
  pointer-events: auto;
  z-index: 10;
  position: relative;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  color: #000000;
  pointer-events: auto;
  z-index: 11;
  position: relative;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

.download-btn {
  color: #16a34a;
}

.delete-btn {
  color: #ef4444;
}

.action-btn:hover {
  background: rgba(107, 114, 128, 0.1);
  border-color: rgba(107, 114, 128, 0.2);
}

.download-btn:hover {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.file-item.selected .action-btn {
  color: #3730a3;
}

@media (max-width: 768px) {
  .file-item {
    padding: 8px 10px;
  }
  
  .file-name {
    font-size: 12px;
  }
  
  .file-time {
    font-size: 10px;
  }
}
</style>