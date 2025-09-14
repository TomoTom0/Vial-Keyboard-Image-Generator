// このファイルは自動生成されます。直接編集しないでください。
// 元ファイル: data/styles/fonts.yaml, data/styles/colors.yaml

// フォント設定の型定義
export interface FontSizes {
  main: {
    single: number;
    normal: number;
    long: number;
  };
  sub: {
    normal: number;
    small: number;
    mini: number;
  };
  header: {
    title: number;
    subtitle: number;
    info: number;
  };
  combo: {
    title: number;
    content: number;
    index: number;
  };
}

export interface StyleConfig {
  fontFamily: string;
  headerFontFamily: string;
  fontSizes: FontSizes;
}

// 色設定の型定義
export interface ThemeColors {
  readonly background: string;
  readonly keyNormal: string;
  readonly keySpecial: string;
  readonly keyEmpty: string;
  readonly borderNormal: string;
  readonly borderSpecial: string;
  readonly borderEmpty: string;
  readonly textNormal: string;
  readonly textSpecial: string;
  readonly textSub: string;
  readonly headerBackground: string;
  readonly headerBorder: string;
  readonly headerText: string;
}

export interface ColorConfig {
  dark: ThemeColors;
  light: ThemeColors;
}

// 設定データ
export const STYLE_CONFIG: StyleConfig = {
  "fontFamily": "Consolas, 'Courier New', Monaco, 'Liberation Mono', monospace",
  "headerFontFamily": "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  "fontSizes": {
    "main": {
      "single": 22,
      "normal": 20,
      "long": 12
    },
    "sub": {
      "normal": 16,
      "small": 14,
      "mini": 11
    },
    "header": {
      "title": 32,
      "subtitle": 28,
      "info": 16
    },
    "combo": {
      "title": 24,
      "content": 16,
      "index": 20
    }
  }
};

export const COLOR_CONFIG: ColorConfig = {
  "dark": {
    "background": "#1c1c20",
    "keyNormal": "#343a46",
    "keySpecial": "#2d3446",
    "keyEmpty": "#282a30",
    "borderNormal": "#444c5c",
    "borderSpecial": "#41497e",
    "borderEmpty": "#32353d",
    "textNormal": "#f0f6fc",
    "textSpecial": "#9cdcfe",
    "textSub": "#e5e7eb",
    "headerBackground": "#2a2d35",
    "headerBorder": "#4a5568",
    "headerText": "#ffffff"
  },
  "light": {
    "background": "#f5f5f5",
    "keyNormal": "#ffffff",
    "keySpecial": "#e3f2fd",
    "keyEmpty": "#eeeeee",
    "borderNormal": "#d0d7de",
    "borderSpecial": "#90caf9",
    "borderEmpty": "#c6c6c6",
    "textNormal": "#212529",
    "textSpecial": "#1976d2",
    "textSub": "#343a40",
    "headerBackground": "#ffffff",
    "headerBorder": "#dee2e6",
    "headerText": "#212529"
  }
};

// 便利な関数
export function getFontConfig(): StyleConfig {
  return STYLE_CONFIG;
}

export function getThemeColors(theme: 'dark' | 'light' = 'dark'): ThemeColors {
  return COLOR_CONFIG[theme];
}

// 後方互換性のためのエイリアス
export const COLORS = COLOR_CONFIG;
export const COLORS_LEGACY = COLOR_CONFIG.dark;
