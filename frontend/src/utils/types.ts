// 型定義モジュール

// Vial設定の型定義
export interface VialConfig {
    version: number;
    uid: number;
    layout: (string | number)[][][];
    tap_dance: string[][];
    combo: string[][];
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

// Combo情報
export interface ComboInfo {
    keys: string[];         // 組み合わせキー（KC_NOを除く）
    keycodes: string[];     // 組み合わせキーのキーコード（KC_NOを除く）
    keySubTexts: (string[] | undefined)[]; // 各キーのサブテキスト
    action: string;         // 実行されるアクション
    description: string;    // 表示用の説明文
    actionSubTexts?: string[]; // アクションのサブテキスト
    index: number;          // 元のインデックス番号
}

// 描画オプション
export interface RenderOptions {
    highlightComboKeys?: boolean;      // Combo入力キーの背景色変更 (デフォルト: true)
    highlightSubtextKeys?: boolean;    // サブテキスト付きキーの背景色変更 (デフォルト: true)
    showComboMarkers?: boolean;        // Combo入力キーの右上三角形マーカー (デフォルト: true)
    showTextColors?: boolean;          // 特別な文字色 (デフォルト: true)
    backgroundColor?: string;          // キャンバス背景色 (デフォルト: COLORS.background)
    showComboInfo?: boolean;           // Combo情報を画像に含める (デフォルト: true)
    changeKeyColors?: boolean;         // キーの背景色を変更する (デフォルト: true)
    theme?: 'dark' | 'light';         // テーマモード (デフォルト: 'dark')
}

// カラーパレット
export const COLORS = {
    dark: {
        background: '#1c1c20',
        keyNormal: '#343a46',
        keySpecial: '#2d3446',
        keyEmpty: '#282a30',
        borderNormal: '#444c5c',
        borderSpecial: '#41497e',
        borderEmpty: '#32353d',
        textNormal: '#f0f6fc',
        textSpecial: '#9cdcfe',
        textSub: '#e5e7eb',  // より明るく、高コントラストに変更
        headerBackground: '#2a2d35',
        headerBorder: '#4a5568',
        headerText: '#ffffff'
    },
    light: {
        background: '#f5f5f5',
        keyNormal: '#ffffff',
        keySpecial: '#e3f2fd',
        keyEmpty: '#eeeeee',
        borderNormal: '#d0d7de',
        borderSpecial: '#90caf9',
        borderEmpty: '#c6c6c6',
        textNormal: '#212529',
        textSpecial: '#1976d2',
        textSub: '#343a40',  // より濃く、高コントラストに変更
        headerBackground: '#ffffff',
        headerBorder: '#dee2e6',
        headerText: '#212529'
    }
} as const;

// 後方互換性のために古い形式も維持
export const COLORS_LEGACY = COLORS.dark;

// テーマに基づいて色を取得するヘルパー関数
export function getThemeColors(theme: 'dark' | 'light' = 'dark') {
    return COLORS[theme];
}