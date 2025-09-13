#!/usr/bin/env node
// スタイル設定ファイル生成スクリプト

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 出力ディレクトリの作成
const outputDir = 'src/utils';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// フォント設定を読み込み
const fontsYaml = fs.readFileSync('data/styles/fonts.yaml', 'utf8');
const fontConfig = yaml.load(fontsYaml);

// 色設定を読み込み
const colorsYaml = fs.readFileSync('data/styles/colors.yaml', 'utf8');
const colorConfig = yaml.load(colorsYaml);

// TypeScript設定ファイルを生成
const styleConfigTs = `// このファイルは自動生成されます。直接編集しないでください。
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
export const STYLE_CONFIG: StyleConfig = ${JSON.stringify(fontConfig, null, 2)};

export const COLOR_CONFIG: ColorConfig = ${JSON.stringify(colorConfig, null, 2)};

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
`;

// ファイルに書き出し
fs.writeFileSync(path.join(outputDir, 'styleConfig.generated.ts'), styleConfigTs);

console.log('✅ Style configuration generated successfully:');
console.log(`   - ${outputDir}/styleConfig.generated.ts`);
console.log('');
console.log('📝 Font settings:');
console.log(`   - Font Family: ${fontConfig.fontFamily}`);
console.log(`   - Main Sizes: ${Object.values(fontConfig.fontSizes.main).join(', ')}`);
console.log('');
console.log('🎨 Color themes: dark, light');