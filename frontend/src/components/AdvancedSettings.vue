<template>
  <div class="advanced-settings">
    <div class="settings-header">
      <h3>Advanced Settings</h3>
    </div>
    
    <div class="settings-tabs">
      <div class="tab-buttons">
        <button 
          :class="['tab-btn', { active: currentTab === 'replace' }]"
          @click="currentTab = 'replace'"
        >
          Replace
        </button>
        <button 
          :class="['tab-btn', { active: currentTab === 'keyboard' }]"
          @click="currentTab = 'keyboard'"
        >
          Keyboard
        </button>
      </div>
      
      <div class="tab-content">
        <ReplaceTab 
          v-show="currentTab === 'replace'"
          :replace-rules="replaceRules"
          @rules-changed="handleRulesChanged"
        />
        <KeyboardTab 
          v-show="currentTab === 'keyboard'"
          @layout-changed="handleLayoutChanged"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReplaceTab from './ReplaceTab.vue'
import KeyboardTab from './KeyboardTab.vue'

export interface ReplaceRule {
  id: string
  enabled: boolean
  from: string
  to: string
}

const props = defineProps<{
  replaceRules: ReplaceRule[]
}>()

const emit = defineEmits<{
  rulesChanged: [rules: ReplaceRule[]]
  layoutChanged: [layout: string]
}>()

const currentTab = ref('replace')

const handleRulesChanged = (rules: ReplaceRule[]) => {
  emit('rulesChanged', rules)
}

const handleLayoutChanged = (layout: string) => {
  emit('layoutChanged', layout)
}
</script>

<style scoped lang="scss">
.advanced-settings {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-top: 20px;
  overflow: hidden;
}

.settings-header {
  background: #f8f9fa;
  padding: 12px 20px;
  border-bottom: 1px solid #dee2e6;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #495057;
  }
}

.settings-tabs {
  .tab-buttons {
    display: flex;
    border-bottom: 1px solid #dee2e6;
    background: #f8f9fa;
  }
  
  .tab-btn {
    padding: 12px 20px;
    border: none;
    background: transparent;
    color: #6c757d;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    
    &:hover:not(.active) {
      color: #495057;
      background: #e9ecef;
    }
    
    &.active {
      color: #007bff;
      border-bottom-color: #007bff;
      background: white;
    }
  }
  
  .tab-content {
    padding: 20px;
  }
}
</style>