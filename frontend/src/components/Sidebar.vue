<template>
  <aside class="sidebar" :class="{ collapsed: uiStore.sidebarCollapsed }">
    <!-- 細長い左側領域 -->
    <div class="sidebar-narrow">
      <div class="nav-items">
        <div
          :class="['nav-item', { active: uiStore.sidebarSection === 'files' }]"
          title="Files"
          @click="switchNavSection('files')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div
          :class="['nav-item', { active: uiStore.sidebarSection === 'generate' }]"
          title="Generate"
          @click="switchNavSection('generate')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
          </svg>
        </div>
        <div
          :class="['nav-item', { active: uiStore.sidebarSection === 'settings' }]"
          title="Settings"
          @click="switchNavSection('settings')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div
          :class="['nav-item', { active: uiStore.sidebarSection === 'preferences' }]"
          title="Preferences"
          @click="switchNavSection('preferences')"
        >
          <div class="double-gear-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="gear-large">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="gear-small">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- メインサイドバーコンテンツ -->
    <div class="sidebar-main" v-show="!uiStore.sidebarCollapsed">
      <div class="sidebar-content">
        <!-- ファイル選択領域（Files選択時のみ表示） -->
        <FilesSection v-show="uiStore.sidebarSection === 'files'" />

        <!-- 画像生成・設定領域（Generate選択時のみ表示） -->
        <GenerateSection v-show="uiStore.sidebarSection === 'generate'" />

        <!-- 詳細設定領域（Settings選択時のみ表示） -->
        <SettingsSection v-show="uiStore.sidebarSection === 'settings'" />

        <!-- Preferences領域（Preferences選択時のみ表示） -->
        <div v-show="uiStore.sidebarSection === 'preferences'" class="sidebar-section preferences-section">
          <PreferencesTab />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import FilesSection from './FilesSection.vue'
import GenerateSection from './GenerateSection.vue'
import SettingsSection from './SettingsSection.vue'
import PreferencesTab from './PreferencesTab.vue'
import { useUiStore } from '../stores/ui'

const uiStore = useUiStore()

// 小画面かどうかを判定
const isSmallScreen = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
})

// Methods
const switchNavSection = (section: 'files' | 'generate' | 'settings' | 'preferences') => {
  // 現在開いているセクションと同じアイコンをクリックした場合は折りたたみを切り替え
  if (uiStore.sidebarSection === section && !uiStore.sidebarCollapsed) {
    uiStore.toggleSidebarCollapsed()
  } else {
    // 違うセクションをクリックした場合は展開してそのセクションに切り替え
    uiStore.sidebarCollapsed = false
    uiStore.sidebarSection = section
  }
}

// 小画面での初期状態設定
onMounted(() => {
  if (isSmallScreen.value) {
    uiStore.sidebarCollapsed = true
  }
})
</script>

<style scoped lang="scss">
/* サイドバー */
.sidebar {
  width: 250px;
  height: auto;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  transition: width 0.3s ease;

  &.collapsed {
    width: 40px;
  }
}

/* 細長い左側領域 */
.sidebar-narrow {
  width: 40px;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  flex-shrink: 0;
}

/* ナビゲーションアイテム */
.nav-items {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  gap: 5px;
}

.nav-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6c757d;
  position: relative;

  &:hover {
    background: #e9ecef;
    color: #495057;
  }

  &.active {
    background: #007bff;
    color: #ffffff;

    &:hover {
      background: #0056b3;
    }
  }
}

.double-gear-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;

  .gear-large {
    position: absolute;
    top: 0;
    left: 0;
  }

  .gear-small {
    position: absolute;
    bottom: 0;
    right: 0;
  }
}

/* メインサイドバーコンテンツ */
.sidebar-main {
  flex: 1;
  height: auto;
}

.sidebar-content {
  padding: 20px;
  height: auto;
}

.sidebar-section {
  margin-bottom: 30px;
}
</style>
