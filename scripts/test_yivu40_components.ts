#!/usr/bin/env ts-node

// yivu40ファイルでコンポーネント画像生成テストスクリプト
import * as path from 'path';
import { ComponentGenerator } from '../src/modules/component_generator';

async function main() {
    console.log('🚀 yivu40ファイルでコンポーネント画像生成テストを開始します');
    
    // yivu40ファイルのパス
    const yivu40FilePath = path.join(process.cwd(), 'data', 'yivu40-250907.vil');
    
    try {
        // ダークテーマのコンポーネント画像を生成
        console.log('🌙 ダークテーマのコンポーネント画像を生成中...');
        const outputDir = path.join(process.cwd(), 'output', 'test', 'yivu40_dark', 'preview', 'component');
        await ComponentGenerator.generateComponentImages(yivu40FilePath, {
            theme: 'dark',
            outputDir,
            filePrefix: 'yivu40',
            generateLayers: true,
            generateCombo: true,
            layerRange: { start: 0, end: 3 }
        });
        
        console.log('✨ yivu40コンポーネント画像生成が完了しました');
        
    } catch (error) {
        console.error('❌ yivu40コンポーネント画像生成エラー:', error);
        process.exit(1);
    }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
    main();
}