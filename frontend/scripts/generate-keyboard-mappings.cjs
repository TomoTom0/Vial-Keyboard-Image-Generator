#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// TSVファイルのパースを行う関数
function parseTSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split('\t');
  
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

// キーマッピングとシフトマッピングを生成する関数
function generateMappings(data) {
  const keyMapping = {};
  const shiftMapping = {};
  
  data.forEach(row => {
    if (row.keycode && row.display !== undefined) {
      keyMapping[row.keycode] = row.display;
    }
    if (row.keycode && row.shift_display) {
      shiftMapping[row.keycode] = row.shift_display;
    }
  });
  
  return { keyMapping, shiftMapping };
}

// レイアウト情報を生成する関数
function generateLayouts(layoutsData) {
  const layouts = {};
  
  for (const [layoutName, data] of Object.entries(layoutsData)) {
    const positions = [];
    
    data.forEach(row => {
      const vialRow = parseInt(row.vial_row);
      const vialCol = parseInt(row.vial_col);
      
      // 配列を必要に応じて拡張
      while (positions.length <= vialRow) {
        positions.push([]);
      }
      while (positions[vialRow].length <= vialCol) {
        positions[vialRow].push(null);
      }
      
      // ポジション情報を設定
      positions[vialRow][vialCol] = {
        x: parseFloat(row.canvas_x),
        y: parseFloat(row.canvas_y),
        width: parseInt(row.canvas_width),
        height: parseInt(row.canvas_height),
        rotation: parseFloat(row.canvas_rotation),
        layoutRow: parseInt(row.layout_row),
        layoutCol: parseInt(row.layout_col),
        description: row.description
      };
    });
    
    layouts[layoutName] = positions;
  }
  
  return layouts;
}

// メイン処理
function main() {
  const keymapsDir = path.join(__dirname, '../data/keymaps');
  const layoutsDir = path.join(__dirname, '../data/layouts');
  const outputDir = path.join(__dirname, '../src/utils');
  
  // common.tsvを読み込み
  const commonTsvPath = path.join(keymapsDir, 'common.tsv');
  const commonContent = fs.readFileSync(commonTsvPath, 'utf-8');
  const commonData = parseTSV(commonContent);
  
  // 言語別のマッピングを生成
  const languages = {};
  
  // 英語配列（common.tsvのみ使用）
  const englishMappings = generateMappings(commonData);
  languages.english = englishMappings;
  
  // 日本語配列（common.tsv + japanese.tsv）
  const japaneseTsvPath = path.join(keymapsDir, 'japanese.tsv');
  if (fs.existsSync(japaneseTsvPath)) {
    const japaneseContent = fs.readFileSync(japaneseTsvPath, 'utf-8');
    const japaneseData = parseTSV(japaneseContent);
    
    // commonデータをコピー
    const combinedData = [...commonData];
    
    // japaneseデータで上書き・追加
    japaneseData.forEach(japaneseRow => {
      const existingIndex = combinedData.findIndex(row => row.keycode === japaneseRow.keycode);
      if (existingIndex !== -1) {
        // 既存のキーを上書き
        combinedData[existingIndex] = { ...combinedData[existingIndex], ...japaneseRow };
      } else {
        // 新しいキーを追加
        combinedData.push(japaneseRow);
      }
    });
    
    const japaneseMappings = generateMappings(combinedData);
    languages.japanese = japaneseMappings;
  }
  
  // レイアウトTSVファイルを読み込み
  const layoutsData = {};
  if (fs.existsSync(layoutsDir)) {
    const layoutFiles = fs.readdirSync(layoutsDir).filter(file => file.endsWith('.tsv'));
    
    layoutFiles.forEach(file => {
      const layoutName = path.basename(file, '.tsv');
      const layoutPath = path.join(layoutsDir, file);
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      const layoutData = parseTSV(layoutContent);
      layoutsData[layoutName] = layoutData;
    });
  }
  
  // レイアウト情報を生成
  const layouts = generateLayouts(layoutsData);
  
  // TypeScriptファイルを生成
  const tsContent = `// 自動生成されたファイル - 直接編集しないでください
// 生成日時: ${new Date().toISOString()}

export interface KeyboardLanguage {
  id: string;
  name: string;
  keyMapping: { [key: string]: string };
  specialKeys: { [key: string]: string };
  shiftMapping: { [key: string]: string };
}

export interface KeyPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layoutRow: number;
  layoutCol: number;
  description: string;
}

export interface KeyboardLayout {
  id: string;
  name: string;
  positions: (KeyPosition | null)[][];
}

// キーボードマッピングデータ
export const KEYBOARD_MAPPINGS = {
  english: {
    keyMapping: ${JSON.stringify(languages.english.keyMapping, null, 4)},
    shiftMapping: ${JSON.stringify(languages.english.shiftMapping, null, 4)}
  },
  japanese: {
    keyMapping: ${JSON.stringify(languages.japanese.keyMapping, null, 4)},
    shiftMapping: ${JSON.stringify(languages.japanese.shiftMapping, null, 4)}
  }
};

// 言語定義
export const KEYBOARD_LANGUAGES: { [key: string]: KeyboardLanguage } = {
  english: {
    id: 'english',
    name: 'English (US)',
    keyMapping: KEYBOARD_MAPPINGS.english.keyMapping,
    specialKeys: {},
    shiftMapping: KEYBOARD_MAPPINGS.english.shiftMapping
  },
  japanese: {
    id: 'japanese', 
    name: 'Japanese (JIS)',
    keyMapping: KEYBOARD_MAPPINGS.japanese.keyMapping,
    specialKeys: {},
    shiftMapping: KEYBOARD_MAPPINGS.japanese.shiftMapping
  }
};

// キーボードレイアウトデータ
export const KEYBOARD_LAYOUTS: { [key: string]: KeyboardLayout } = {
${Object.entries(layouts).map(([layoutName, positions]) => `  ${layoutName}: {
    id: '${layoutName}',
    name: '${layoutName.charAt(0).toUpperCase() + layoutName.slice(1).replace('_', ' ')}',
    positions: ${JSON.stringify(positions, null, 4)}
  }`).join(',\n')}
};

// 現在の言語を取得する関数（後方互換性のため）
let currentLanguage = 'japanese';

export function getCurrentKeyboardLanguage(): KeyboardLanguage {
  return KEYBOARD_LANGUAGES[currentLanguage];
}

export function setCurrentKeyboardLanguage(languageId: string) {
  if (KEYBOARD_LANGUAGES[languageId]) {
    currentLanguage = languageId;
  }
}

export function getKeyMapping(languageId: string): { [key: string]: string } {
  const language = KEYBOARD_LANGUAGES[languageId];
  return language ? language.keyMapping : KEYBOARD_MAPPINGS.english.keyMapping;
}

export function getShiftMapping(languageId: string): { [key: string]: string } {
  const language = KEYBOARD_LANGUAGES[languageId];
  return language ? language.shiftMapping : KEYBOARD_MAPPINGS.english.shiftMapping;
}
`;
  
  // 出力ファイルを書き込み
  const outputPath = path.join(outputDir, 'keyboardConfig.generated.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  
  console.log('✅ Keyboard mappings generated successfully');
  console.log(`📁 Output: ${outputPath}`);
  console.log(`🌐 Languages: ${Object.keys(languages).join(', ')}`);
  console.log(`🔤 English keys: ${Object.keys(languages.english.keyMapping).length}`);
  console.log(`🔤 Japanese keys: ${Object.keys(languages.japanese.keyMapping).length}`);
}

// スクリプト実行
if (require.main === module) {
  main();
}