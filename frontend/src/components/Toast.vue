<template>
  <Transition name="toast">
    <div v-if="visible" :class="['toast', `toast-${type}`]">
      <div class="toast-content">
        <div class="toast-icon">
          <span v-if="type === 'success'">✅</span>
          <span v-else-if="type === 'error'">❌</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-message">
          <div class="toast-title">{{ title }}</div>
          <div v-if="message" class="toast-text">{{ message }}</div>
        </div>
      </div>
      <button class="toast-close" @click="close">×</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  type?: 'success' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(false)

const close = () => {
  visible.value = false
  setTimeout(() => emit('close'), 300)
}

onMounted(() => {
  visible.value = true
  if (props.duration > 0) {
    setTimeout(close, props.duration)
  }
})
</script>

<style scoped lang="scss">
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #007bff;
  max-width: 400px;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;

  &.toast-success {
    border-left-color: #28a745;
  }

  &.toast-error {
    border-left-color: #dc3545;
  }

  &.toast-info {
    border-left-color: #007bff;
  }
}

.toast-content {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.toast-icon {
  font-size: 20px;
  line-height: 1;
}

.toast-message {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.toast-text {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  white-space: pre-line;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  
  &:hover {
    color: #666;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>