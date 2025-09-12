<template>
  <div class="file-selector">
    <label class="selector-label">Display File:</label>
    <select 
      :value="selectedFile"
      @change="handleFileChange"
      class="file-dropdown"
    >
      <option 
        v-for="file in availableFiles"
        :key="file"
        :value="file"
      >
        {{ getDisplayName(file) }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  availableFiles: string[]
  selectedFile: string
}>()

const emit = defineEmits<{
  fileChanged: [fileName: string]
}>()

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('fileChanged', target.value)
}

const getDisplayName = (fileName: string): string => {
  if (fileName === 'sample') {
    return '📋 Sample File'
  }
  
  // Remove file extension for display
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
  return `📄 ${nameWithoutExt}`
}
</script>

<style scoped lang="scss">
.file-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.selector-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
}

.file-dropdown {
  min-width: 200px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  color: #495057;
  cursor: pointer;
}

.file-dropdown:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
}

.file-dropdown option {
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .file-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .file-dropdown {
    min-width: auto;
  }
}
</style>