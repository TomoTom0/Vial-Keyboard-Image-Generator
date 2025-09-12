<template>
  <div class="color-mode-selector">
    <div class="mode-buttons">
      <button
        :class="['mode-btn', { 'active': currentTheme === 'light' }]"
        @click="selectTheme('light')"
      >
        ☀️
      </button>
      
      <button
        :class="['mode-btn', { 'active': currentTheme === 'dark' }]"
        @click="selectTheme('dark')"
      >
        🌙
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentTheme: 'light' | 'dark'
}>()

const emit = defineEmits<{
  themeChanged: [theme: 'light' | 'dark']
}>()

const selectTheme = (theme: 'light' | 'dark') => {
  if (theme !== props.currentTheme) {
    emit('themeChanged', theme)
  }
}
</script>

<style scoped lang="scss">
.color-mode-selector {
  /* Container styles handled by parent */
}

.mode-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.mode-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
}

.mode-btn {
  background: white;
  color: #333;
}

.mode-btn:hover {
  border-color: #bbb;
  background: #f5f5f5;
}

.mode-btn.active {
  border-color: #007bff;
  border-width: 2px;
  background: rgba(0, 123, 255, 0.1);
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.3);
}

/* Dark mode button styling */
.mode-btn:nth-child(2) {
  background: #2d3748;
  color: white;
}

.mode-btn:nth-child(2).active {
  background: #1a202c;
  border-color: #007bff;
  border-width: 2px;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
}

/* Active state - only show border highlight without background changes */

</style>