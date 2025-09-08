// 画像結合実行スクリプト
import * as path from 'path';
import { ImageCombiner } from './modules/combiner';
import { Utils } from './modules/utils';

export async function combineImages(configPath: string, imagePaths?: string[], outputDir?: string, theme: 'dark' | 'light' = 'dark'): Promise<void> {
    const baseOutputDir = outputDir || path.join(__dirname, '../output');
    const defaultImagePaths = imagePaths || [
        path.join(baseOutputDir, 'keyboard_layout_layer0_modular.png'),
        path.join(baseOutputDir, 'keyboard_layout_layer1_modular.png'),
        path.join(baseOutputDir, 'keyboard_layout_layer2_modular.png'),
        path.join(baseOutputDir, 'keyboard_layout_layer3_modular.png')
    ];

    try {
        console.log('Combo情報付き連結画像生成を開始します');
        
        // Vial設定を読み込み
        const config = Utils.loadVialConfig(configPath);
        console.log(`設定ファイル読み込み完了: ${configPath}`);

        // 1. 縦長結合画像を作成（Combo情報付き）
        const verticalOutputPath = path.join(baseOutputDir, `combined_layers_vertical_with_combos_${theme}.png`);
        await ImageCombiner.combineVertical(defaultImagePaths, verticalOutputPath, config, theme, configPath);

        // 2. 横長結合画像を作成（Combo情報付き）
        const horizontalOutputPath = path.join(baseOutputDir, `combined_layers_horizontal_with_combos_${theme}.png`);
        await ImageCombiner.combineHorizontal(defaultImagePaths, horizontalOutputPath, config, theme, configPath);

        console.log('全てのCombo情報付き結合画像の生成が完了しました');
    } catch (error) {
        console.error('結合画像生成でエラーが発生しました:', error);
        throw error;
    }
}

async function main(): Promise<void> {
    if (!process.argv[2]) {
        console.error('Usage: npx ts-node src/combine_images.ts <config-file.vil>');
        process.exit(1);
    }
    const outputDir = path.join(__dirname, '../output');
    const configPath = process.argv[2];
    
    // yivu40-250907.vilファイルで生成されたレイヤー0-3の画像パス
    const imagePaths = [
        path.join(outputDir, 'keyboard_layout_layer0_modular.png'),
        path.join(outputDir, 'keyboard_layout_layer1_modular.png'),
        path.join(outputDir, 'keyboard_layout_layer2_modular.png'),
        path.join(outputDir, 'keyboard_layout_layer3_modular.png')
    ];

    try {
        console.log('Combo情報付き連結画像生成を開始します');
        
        // Vial設定を読み込み
        const config = Utils.loadVialConfig(configPath);
        console.log(`設定ファイル読み込み完了: ${configPath}`);

        await combineImages(configPath, imagePaths, outputDir, 'dark');

        console.log('全てのCombo情報付き結合画像の生成が完了しました');
    } catch (error) {
        console.error('画像結合でエラーが発生しました:', error);
    }
}

if (require.main === module) {
    main();
}