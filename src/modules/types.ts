// 型定義モジュール

// Vial設定の型定義
export interface VialConfig {
    version: number;
    uid: number;
    layout: (string | number)[][][];
    tap_dance: string[][];
}

// キーの位置とサイズ
export interface KeyPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

// キーのラベル情報
export interface KeyLabel {
    mainText: string;
    subText?: string;
    subTexts?: string[]; // 複数のサブテキスト対応
    isSpecial: boolean;
}

// カラーパレット
export const COLORS = {
    background: '#1c1c20',
    keyNormal: '#343a46',
    keySpecial: '#2d3446',
    keyEmpty: '#282a30',
    borderNormal: '#444c5c',
    borderSpecial: '#41497e',
    borderEmpty: '#32353d',
    textNormal: '#f0f6fc',
    textSpecial: '#9cdcfe',
    textSub: '#9ca3af'
} as const;