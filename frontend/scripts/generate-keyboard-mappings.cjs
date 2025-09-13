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

// メイン処理
function main() {
  const keymapsDir = path.join(__dirname, '../data/keymaps');
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