<template>
  <div class="tab-navigation">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab-btn', { 'active': currentTab === tab.id }]"
      @click="selectTab(tab.id)"
    >
      <div class="tab-icon">{{ tab.icon }}</div>
      <div class="tab-label">{{ tab.label }}</div>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  id: 'select' | 'preview' | 'output'
  label: string
  icon: string
}

const props = defineProps<{
  currentTab: 'select' | 'preview' | 'output'
}>()

const emit = defineEmits<{
  tabChanged: [tab: 'select' | 'preview' | 'output']
}>()

const tabs: Tab[] = [
  {
    id: 'select',
    label: 'Select',
    icon: '☑️'
  },
  {
    id: 'preview',
    label: 'Preview',
    icon: '👁️'
  },
  {
    id: 'output',
    label: 'Output',
    icon: '📁'
  }
]

const selectTab = (tabId: 'select' | 'preview' | 'output') => {
  if (tabId !== props.currentTab) {
    emit('tabChanged', tabId)
  }
}
</script>

<style scoped lang="scss">
.tab-navigation {
  display: flex;
  gap: 0.25rem;
  background: #f8f9fa;
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
}

.tab-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.tab-btn.active {
  background: white;
  color: #0d6efd;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.tab-icon {
  font-size: 1rem;
  line-height: 1;
}

.tab-label {
  line-height: 1;
}

@media (max-width: 768px) {
  .tab-btn {
    padding: 0.5rem 0.75rem;
  }
  
  .tab-label {
    display: none;
  }
}
</style>