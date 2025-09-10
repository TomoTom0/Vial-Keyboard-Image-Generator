#!/usr/bin/env npx ts-node

import { ComponentBatchGenerator } from '../src/modules/component_batch_generator';

// コマンドライン引数の処理
const args = process.argv.slice(2);
const configPath = args[0] || 'data/yivu40-250906.vil';
const colorMode = (args[1] as 'dark' | 'light') || 'dark';
const quality = (args[2] as 'high' | 'low') || 'high';

console.log(`設定ファイル: ${configPath}`);
console.log(`カラーモード: ${colorMode}`);
console.log(`品質: ${quality}`);

// 画像生成実行
ComponentBatchGenerator.generateAllComponents({
  configPath: configPath,
  colorMode: colorMode,
  comboHighlight: true,
  subtextHighlight: true,
  quality: quality
});