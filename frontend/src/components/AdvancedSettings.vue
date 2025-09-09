<template>
  <div class="advanced-settings">
    <div class="setting-group">
      <label class="setting-item">
        <input 
          type="checkbox" 
          :checked="settings.highlightComboKeys"
          @change="updateSetting('highlightComboKeys', $event.target.checked)"
        />
        <span class="setting-label">Combo Highlight</span>
      </label>
    </div>
    
    <div class="setting-group">
      <label class="setting-item">
        <input 
          type="checkbox" 
          :checked="settings.highlightSubtextKeys"
          @change="updateSetting('highlightSubtextKeys', $event.target.checked)"
        />
        <span class="setting-label">Subtext Highlight</span>
      </label>
    </div>
    
    <div class="setting-group">
      <div class="setting-label">Output Format</div>
      <select 
        :value="settings.outputFormat"
        @change="updateSetting('outputFormat', $event.target.value)"
        class="format-select"
      >
        <option value="separated">Separated</option>
        <option value="vertical">Vertical</option>
        <option value="horizontal">Horizontal</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AdvancedSettings {
  highlightComboKeys: boolean
  highlightSubtextKeys: boolean
  outputFormat: 'separated' | 'vertical' | 'horizontal'
}

const props = defineProps<{
  settings: AdvancedSettings
}>()

const emit = defineEmits<{
  settingsChanged: [settings: AdvancedSettings]
}>()

const updateSetting = (key: keyof AdvancedSettings, value: any) => {
  const newSettings = {
    ...props.settings,
    [key]: value
  }
  emit('settingsChanged', newSettings)
}
</script>

<style scoped>
.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.setting-item:hover {
  background: #f8f9fa;
}

.setting-label {
  font-size: 0.875rem;
  color: #495057;
  font-weight: 500;
}

.setting-group > .setting-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.format-select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  color: #495057;
}

.format-select:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
}

input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #0d6efd;
}
</style>