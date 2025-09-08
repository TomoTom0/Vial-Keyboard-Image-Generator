// 全レイヤー画像生成スクリプト
import * as path from 'path';
import { VialKeyboardImageGenerator } from './modules/generator';

export async function generateAllLayers(
    configPath: string, 
    outputDir?: string, 
    options?: {
        layerRange?: { start: number; end: number };
        renderOptions?: {
            backgroundColor?: string;
            showComboInfo?: boolean;
            changeKeyColors?: boolean;
            highlightComboKeys?: boolean;
            highlightSubtextKeys?: boolean;
            showComboMarkers?: boolean;
            showTextColors?: boolean;
            theme?: 'dark' | 'light';
        };
    }
): Promise<void> {
    const generator = new VialKeyboardImageGenerator();
    const baseOutputDir = outputDir || path.join(__dirname, '../output');
    const layerStart = options?.layerRange?.start || 0;
    const layerEnd = options?.layerRange?.end || 3;

    console.log('全レイヤー画像生成を開始します');

    try {
        for (let layer = layerStart; layer <= layerEnd; layer++) {
            const outputPath = path.join(baseOutputDir, `keyboard_layout_layer${layer}_modular.png`);
            generator.generateKeyboardImage(configPath, outputPath, layer, options?.renderOptions || {});
            console.log(`レイヤー${layer}画像を生成しました: ${outputPath}`);
        }

        console.log('全レイヤー画像の生成が完了しました');
    } catch (error) {
        console.error('画像生成でエラーが発生しました:', error);
        throw error;
    }
}

async function main(): Promise<void> {
    if (!process.argv[2]) {
        console.error('Usage: npx ts-node src/generate_all_layers.ts <config-file.vil>');
        process.exit(1);
    }
    const configPath = process.argv[2];
    await generateAllLayers(configPath);
}

if (require.main === module) {
    main();
}