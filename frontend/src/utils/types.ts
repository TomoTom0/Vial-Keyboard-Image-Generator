// 型定義モジュール

// KeyOverride設定の型定義
export interface KeyOverride {
    trigger: string | number;
    replacement: string | number;
    layers: number;
    trigger_mods: number;
    negative_mod_mask: number;
    suppressed_mods: number;
    options: number;
}

// VialSettings設定の型定義
export interface VialSettings {
    [key: string]: number;
}

// TapDance設定の型定義 - [tap, hold, double_tap, tap_hold, tapping_term] - jq分析により最初の4つは文字列、最後は数値
export interface TapDanceInfo {
    readonly 0: string;  // tap keycode
    readonly 1: string;  // hold keycode
    readonly 2: string;  // double tap keycode (通常KC_NO)
    readonly 3: string;  // tap hold keycode (通常KC_NO)
    readonly 4: number;  // tapping term (ミリ秒)
    readonly length: 5;
}

// Combo設定の型定義 - [key1, key2, key3, key4, result] - jq分析により全て文字列の5要素配列
export interface ComboEntry extends Array<string> {
    0: string;  // first key
    1: string;  // second key  
    2: string;  // third key (KC_NO if unused)
    3: string;  // fourth key (KC_NO if unused)
    4: string;  // result keycode
}

// Encoder設定の型定義 - [clockwise, counter_clockwise]
export interface EncoderEntry extends Array<string> {
    0: string;  // clockwise rotation (文字列)
    1: string;  // counter-clockwise rotation (文字列)
}

// レイヤー構造の型定義
export type KeyCode = string | -1;  // キーコードは文字列または-1（無効位置）

export interface KeymapLayer {
    [rowIndex: number]: KeyCode[];  // 各行のキー配列
}

// Vial設定の型定義（完全版）
export interface VialConfig {
    version: number;
    uid: number;
    layout: KeymapLayer[];                     // レイヤー配列（-1は無効位置のみ）
    encoder_layout: string[][][];              // [layer][encoder][direction] 文字列のみ
    layout_options: number;
    macro: string[][];                         // [macro_index][step] 文字列のみ
    vial_protocol: number;
    via_protocol: number;
    tap_dance: TapDanceInfo[];                 // [tap_dance_index] 最後の要素のみ数値（タイミング）
    combo: string[][];                         // [combo_index] 文字列のみ
    key_override: KeyOverride[];               // [override_index]
    alt_repeat_key: unknown[];                 // alternate repeat key settings
    settings: VialSettings;                    // numbered settings
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

// テキスト置換ルール
export interface ReplaceRule {
    id: string;
    enabled: boolean;
    from: string;
    to: string;
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
        textSub: '#e5e7eb',
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
        textSub: '#343a40',
        headerBackground: '#ffffff',
        headerBorder: '#dee2e6',
        headerText: '#212529'
    }
} as const;

// 後方互換性のために古い形式も維持
export const COLORS_LEGACY = COLORS.dark;

// カラーパレットの型定義
export type ThemeColors = typeof COLORS.dark;

// テーマに基づいて色を取得するヘルパー関数
export function getThemeColors(theme: 'dark' | 'light' = 'dark'): ThemeColors {
    return COLORS[theme];
}