<template>
  <div class="file-history">
    <div class="section-title">Recent Files</div>
    <div v-if="recentFiles.length === 0" class="empty-state">
      No recent files
    </div>
    <div v-else class="file-list">
      <button
        v-for="file in recentFiles"
        :key="file.id"
        :class="['file-item', { 'selected': isSelected(file) }]"
        @click="selectFile(file)"
      >
        <div class="file-name">{{ file.name }}</div>
        <div class="file-time">{{ formatTime(file.timestamp) }}</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RecentFile {
  id: string
  name: string
  timestamp: Date
  file?: File
}

const props = defineProps<{
  recentFiles: RecentFile[]
  selectedFile: File | null
}>()

const emit = defineEmits<{
  fileSelected: [file: RecentFile]
}>()

const isSelected = (file: RecentFile): boolean => {
  return props.selectedFile?.name === file.name
}

const selectFile = (file: RecentFile) => {
  emit('fileSelected', file)
}

const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return timestamp.toLocaleDateString()
}
</script>

<style scoped>
.file-history {
  width: 100%;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
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
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-item {
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-item:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.file-item.selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  word-break: break-all;
  color: #111827;
  line-height: 1.3;
}

.file-item.selected .file-name {
  color: #1d4ed8;
}

.file-time {
  font-size: 11px;
  color: #6b7280;
  font-weight: 400;
}

.file-item.selected .file-time {
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