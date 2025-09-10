#!/usr/bin/env npx ts-node
// Canvas返却関数の動作確認スクリプト

import * as fs from 'fs';
import * as path from 'path';
import { ComponentBatchGenerator } from '../src/modules/component_batch_generator';
import { NodeCanvasAdapter } from '../src/modules/node_canvas_adapter';

async function testCanvasGenerator() {
    console.log('Canvas生成関数のテスト開始');
    
    // テスト用のvialファイルを読み込み
    const testFilePath = 'data/yivu40-250907.vil';
    if (!fs.existsSync(testFilePath)) {
        console.error('テストファイルが見つかりません:', testFilePath);
        return;
    }
    
    const vilContent = fs.readFileSync(testFilePath, 'utf8');
    console.log('Vilファイル読み込み完了');
    
    // Canvas生成オプション
    const options = {
        configPath: 'yivu40.vil',
        colorMode: 'dark' as 'dark',
        comboHighlight: true,
        subtextHighlight: true,
        quality: 'low' as 'low'
    };
    
    try {
        // Node.js用アダプターを作成
        const canvasAdapter = new NodeCanvasAdapter();
        
        // 共通関数でCanvas配列を生成
        const components = await ComponentBatchGenerator.generateAllComponents(vilContent, options, canvasAdapter);
        
        console.log(`生成されたcanvas数: ${components.length}`);
        
        // 各canvasをファイルに保存
        for (const component of components) {
            console.log(`- ${component.name} (${component.type}): ${component.canvas.width}x${component.canvas.height}px`);
            
            // canvasからBufferに変換してPNG保存
            const buffer = component.canvas.toBuffer('image/png');
            const outputPath = path.join('output', 'test', `${component.name}.png`);
            
            // 出力ディレクトリ作成
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, buffer);
            console.log(`  -> 保存: ${outputPath}`);
        }
        
        console.log('Canvas生成関数のテスト完了');
        
    } catch (error) {
        console.error('テストエラー:', error);
    }
}

// スクリプト実行
testCanvasGenerator();