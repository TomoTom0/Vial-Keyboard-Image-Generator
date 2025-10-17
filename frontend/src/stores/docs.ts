import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface DocNode {
  name: string
  path: string
  children?: DocNode[]
  isDirectory: boolean
}

export const useDocsStore = defineStore('docs', () => {
  const currentDocPath = ref<string>('index.md')
  const docContent = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ドキュメントツリー構造
  const docTree: DocNode[] = [
    {
      name: 'ホーム',
      path: 'index.md',
      isDirectory: false
    },
    {
      name: '開発者向け',
      path: 'dev',
      isDirectory: true,
      children: [
        { name: '概要', path: 'dev/README.md', isDirectory: false },
        { name: 'セットアップガイド', path: 'dev/setup.md', isDirectory: false },
        { name: 'アーキテクチャ設計', path: 'dev/architecture.md', isDirectory: false },
        { name: 'デプロイメント', path: 'dev/deployment.md', isDirectory: false }
      ]
    },
    {
      name: 'ユーザー向け',
      path: 'user',
      isDirectory: true,
      children: [
        { name: '概要', path: 'user/index.md', isDirectory: false }
      ]
    },
    {
      name: '外部貢献者向け',
      path: 'integration',
      isDirectory: true,
      children: [
        { name: '概要', path: 'integration/index.md', isDirectory: false }
      ]
    },
    {
      name: '設計ドキュメント',
      path: 'design',
      isDirectory: true,
      children: [
        { name: 'フロントエンド設計', path: 'design/frontend.md', isDirectory: false },
        { name: 'Web設計書', path: 'design/web-frontend-design.md', isDirectory: false }
      ]
    }
  ]

  // パンくずリスト生成
  const breadcrumbs = computed(() => {
    const parts = currentDocPath.value.split('/')
    const crumbs = []
    let path = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      path += (i > 0 ? '/' : '') + part

      if (part === 'index.md' || part === 'README.md') {
        crumbs.push({ name: 'ホーム', path })
      } else if (part.endsWith('.md')) {
        // ファイル名から拡張子を除去して表示
        const name = part.replace('.md', '')
        crumbs.push({ name, path })
      } else {
        // ディレクトリ名
        const dirNames: Record<string, string> = {
          'dev': '開発者向け',
          'user': 'ユーザー向け',
          'integration': '外部貢献者向け',
          'design': '設計ドキュメント'
        }
        crumbs.push({ name: dirNames[part] || part, path })
      }
    }

    return crumbs
  })

  // ドキュメント読み込み
  const loadDocument = async (path: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/docs/${path}`)
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.status}`)
      }

      const content = await response.text()
      docContent.value = content
      currentDocPath.value = path
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラー'
      console.error('Failed to load document:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 初期化
  const initialize = async () => {
    await loadDocument('index.md')
  }

  return {
    currentDocPath,
    docContent,
    isLoading,
    error,
    docTree,
    breadcrumbs,
    loadDocument,
    initialize
  }
})
