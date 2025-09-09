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

<style scoped>
.color-mode-selector {
  /* Container styles handled by parent */
}

.mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.mode-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
  margin: 0 2px;
}

.mode-btn:hover {
  border-color: #bbb;
  background: #f5f5f5;
}

.mode-btn.active {
  border-color: #007bff;
  background: #e7f3ff;
}

</style>