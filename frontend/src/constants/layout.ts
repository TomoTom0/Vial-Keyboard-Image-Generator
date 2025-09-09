// レイヤーの共通設定
export const LAYERS = {
  // 利用可能なレイヤー（0-5の6層）
  AVAILABLE: [0, 1, 2, 3, 4, 5] as const,
  
  // 表示順序（全レイアウトで統一）
  DISPLAY_ORDER: [0, 1, 2, 3, 4, 5] as const
}

export type LayerId = typeof LAYERS.AVAILABLE[number]