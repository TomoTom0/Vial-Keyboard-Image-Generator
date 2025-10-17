<template>
  <div class="settings-section">
    <div class="settings-header">
      <h3 class="section-title">Settings</h3>
    </div>
    <div class="settings-content">
      <!-- Layout設定 -->
      <div class="settings-group">
        <h4 class="settings-group-title">Layout</h4>
        <KeyboardTab :selected-file="vialStore.selectedVialId" />
      </div>

      <!-- Replace設定 -->
      <div class="settings-group">
        <h4 class="settings-group-title">Replace Rules</h4>
        <ReplaceTab />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KeyboardTab from './KeyboardTab.vue'
import ReplaceTab from './ReplaceTab.vue'
import { useVialStore } from '../stores/vial'

const vialStore = useVialStore()
</script>

<style scoped lang="scss">
.settings-section {
  margin-bottom: 0;
}

.settings-header {
  background: #f8f9fa;
  margin: -20px -20px 15px -20px;
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #007bff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-content {
  padding: 0;
  max-width: 170px;
  box-sizing: border-box;
  overflow: hidden;
}

.settings-group {
  margin-bottom: 15px;
  padding: 0;
  box-sizing: border-box;
  max-width: 170px;
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
}

.settings-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  padding: 6px 0 3px 0;
  border-bottom: 1px solid #e9ecef;
}
</style>
