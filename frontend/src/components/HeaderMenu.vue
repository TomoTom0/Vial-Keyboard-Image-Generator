<template>
  <div class="header-menu">
    <button class="menu-btn" @click="toggleMenu" title="メニュー">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="5" r="1.5"/>
        <circle cx="12" cy="12" r="1.5"/>
        <circle cx="12" cy="19" r="1.5"/>
      </svg>
    </button>

    <div v-if="isOpen" class="menu-dropdown" @click.stop>
      <button class="menu-item" @click="openDocs">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span>ドキュメント</span>
      </button>
    </div>
  </div>

  <!-- メニュー外クリックで閉じるための背景 -->
  <div v-if="isOpen" class="menu-overlay" @click="closeMenu"></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const openDocs = () => {
  // 新しいタブで/#/docsを開く
  window.open('/#/docs', '_blank')
  closeMenu()
}
</script>

<style scoped lang="scss">
.header-menu {
  position: relative;
}

.menu-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 1001;
  overflow: hidden;
}

.menu-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: white;
  color: #212529;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  text-align: left;

  &:hover {
    background: #f8f9fa;
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  span {
    flex: 1;
  }
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: transparent;
}
</style>
