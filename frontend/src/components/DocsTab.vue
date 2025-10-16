<template>
  <div class="docs-tab">
    <!-- 左サイドバー: ドキュメントナビゲーション -->
    <div class="docs-sidebar">
      <h3 class="docs-sidebar-title">📖 ドキュメント</h3>
      <nav class="docs-nav">
        <ul class="doc-tree">
          <li
            v-for="node in docsStore.docTree"
            :key="node.path"
            class="doc-tree-item"
          >
            <template v-if="!node.isDirectory">
              <button
                class="doc-link"
                :class="{ active: docsStore.currentDocPath === node.path }"
                @click="loadDoc(node.path)"
              >
                {{ node.name }}
              </button>
            </template>
            <template v-else>
              <div class="doc-folder">
                <span class="folder-icon">📂</span>
                <span class="folder-name">{{ node.name }}</span>
              </div>
              <ul v-if="node.children" class="doc-subtree">
                <li
                  v-for="child in node.children"
                  :key="child.path"
                  class="doc-tree-item"
                >
                  <button
                    class="doc-link"
                    :class="{ active: docsStore.currentDocPath === child.path }"
                    @click="loadDoc(child.path)"
                  >
                    {{ child.name }}
                  </button>
                </li>
              </ul>
            </template>
          </li>
        </ul>
      </nav>
    </div>

    <!-- 中央: Markdownコンテンツ表示 -->
    <div class="docs-content">
      <!-- パンくずリスト -->
      <nav class="breadcrumbs" v-if="docsStore.breadcrumbs.length > 0">
        <span
          v-for="(crumb, index) in docsStore.breadcrumbs"
          :key="crumb.path"
          class="breadcrumb"
        >
          <button
            v-if="index < docsStore.breadcrumbs.length - 1"
            class="breadcrumb-link"
            @click="loadDoc(crumb.path)"
          >
            {{ crumb.name }}
          </button>
          <span v-else class="breadcrumb-current">{{ crumb.name }}</span>
          <span v-if="index < docsStore.breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
        </span>
      </nav>

      <!-- ローディング表示 -->
      <div v-if="docsStore.isLoading" class="loading">
        <div class="spinner"></div>
        <p>ドキュメントを読み込んでいます...</p>
      </div>

      <!-- エラー表示 -->
      <div v-else-if="docsStore.error" class="error">
        <p>❌ {{ docsStore.error }}</p>
      </div>

      <!-- Markdownコンテンツ -->
      <div v-else class="markdown-wrapper">
        <MarkdownPreview
          :source="docsStore.docContent"
          class="markdown-content"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDocsStore } from '../stores/docs'
import MarkdownPreview from '@uivjs/vue-markdown-preview'

const docsStore = useDocsStore()

const loadDoc = (path: string) => {
  docsStore.loadDocument(path)
}

onMounted(() => {
  docsStore.initialize()
})
</script>

<style scoped lang="scss">
.docs-tab {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.docs-sidebar {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid #e9ecef;
  padding: 15px;
  overflow-y: auto;
  background: #f8f9fa;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;

    &:hover {
      background: #555;
    }
  }
}

.docs-sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #343a40;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.docs-nav {
  margin: 0;
  padding: 0;
}

.doc-tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.doc-tree-item {
  margin-bottom: 4px;
}

.doc-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  font-size: 12px;
  color: #495057;
  background: none;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e9ecef;
    color: #212529;
  }

  &.active {
    background: #007bff;
    color: white;
    font-weight: 500;
  }
}

.doc-folder {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #343a40;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.folder-icon {
  font-size: 14px;
}

.folder-name {
  flex: 1;
}

.doc-subtree {
  list-style: none;
  margin: 0 0 8px 0;
  padding-left: 20px;
}

.docs-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;

    &:hover {
      background: #555;
    }
  }
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb-link {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 2px;
  transition: all 0.2s;

  &:hover {
    background: #e7f3ff;
    text-decoration: underline;
  }
}

.breadcrumb-current {
  color: #6c757d;
  font-weight: 500;
}

.breadcrumb-separator {
  color: #adb5bd;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  padding: 20px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
}

.markdown-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.markdown-content {
  font-size: 14px;
  line-height: 1.7;
  color: #24292e;

  :deep(h1) {
    font-size: 24px;
    font-weight: 600;
    margin: 24px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eaecef;
  }

  :deep(h2) {
    font-size: 20px;
    font-weight: 600;
    margin: 20px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eaecef;
  }

  :deep(h3) {
    font-size: 16px;
    font-weight: 600;
    margin: 16px 0 8px;
  }

  :deep(h4) {
    font-size: 14px;
    font-weight: 600;
    margin: 12px 0 6px;
  }

  :deep(p) {
    margin: 8px 0;
  }

  :deep(a) {
    color: #0366d6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(code) {
    background: #f6f8fa;
    border-radius: 3px;
    padding: 2px 6px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 85%;
  }

  :deep(pre) {
    background: #f6f8fa;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    margin: 12px 0;

    code {
      background: none;
      padding: 0;
    }
  }

  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin: 8px 0;
  }

  :deep(li) {
    margin: 4px 0;
  }

  :deep(blockquote) {
    border-left: 4px solid #dfe2e5;
    padding: 8px 16px;
    margin: 12px 0;
    color: #6a737d;
    background: #f6f8fa;
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
  }

  :deep(th), :deep(td) {
    border: 1px solid #dfe2e5;
    padding: 8px 12px;
  }

  :deep(th) {
    background: #f6f8fa;
    font-weight: 600;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}
</style>
