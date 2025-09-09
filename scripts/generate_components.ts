#!/usr/bin/env ts-node

// コンポーネント画像生成テストスクリプト
import * as path from 'path';
import { ComponentGenerator } from '../src/modules/component_generator';

async function main() {
    console.log('🚀 コンポーネント画像生成テストを開始します');
    
    // サンプルファイルのパス
    const sampleFilePath = path.join(process.cwd(), 'data', 'sample.vil');
    
    try {
        // ダークテーマのコンポーネント画像を生成
        console.log('🌙 ダークテーマのコンポーネント画像を生成中...');
        await ComponentGenerator.generateSampleComponents(sampleFilePath, 'dark');
        
        // ライトテーマのコンポーネント画像を生成
        console.log('☀️ ライトテーマのコンポーネント画像を生成中...');
        await ComponentGenerator.generateSampleComponents(sampleFilePath, 'light');
        
        console.log('✨ すべてのコンポーネント画像生成が完了しました');
        
    } catch (error) {
        console.error('❌ コンポーネント画像生成エラー:', error);
        process.exit(1);
    }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
    main();
}