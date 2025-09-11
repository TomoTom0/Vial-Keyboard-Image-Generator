<template>
  <div class="keyboard-tab">
    <div class="keyboard-layout-settings">
      <div class="layout-select-group">
        <label for="keyboard-layout">Layout:</label>
        <select 
          id="keyboard-layout" 
          v-model="selectedLayout" 
          @change="handleLayoutChange"
          class="layout-dropdown"
        >
          <option value="japanese">Japanese</option>
          <option value="english">English</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedLayout = ref<string>('japanese')

const emit = defineEmits<{
  layoutChanged: [layout: string]
}>()

const handleLayoutChange = () => {
  emit('layoutChanged', selectedLayout.value)
  console.log('Keyboard layout changed to:', selectedLayout.value)
}
</script>

<style scoped lang="scss">
.keyboard-tab {
  padding: 20px 0;
}

.layout-select-group {
  display: flex;
  align-items: center;
  gap: 12px;

  label {
    font-size: 14px;
    font-weight: 500;
    color: #555;
    min-width: 50px;
  }

  .layout-dropdown {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;
    color: #333;
    cursor: pointer;
    min-width: 120px;
    
    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
    }
    
    option {
      color: #333;
      background: white;
    }
  }
}
</style>