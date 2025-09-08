// 画像結合実行スクリプト
import * as path from 'path';
import { ImageCombiner } from './modules/combiner';

async function main(): Promise<void> {
    const outputDir = path.join(__dirname, '../output');
    
    // yivu40-250907.vilファイルで生成されたレイヤー0-3の画像パス
    const imagePaths = [
        path.join(outputDir, 'keyboard_layout_layer0_modular.png'),
        path.join(outputDir, 'keyboard_layout_layer1_modular.png'),
        path.join(outputDir, 'keyboard_layout_layer2_modular.png'),
        path.join(outputDir, 'keyboard_layout_layer3_modular.png')
    ];

    try {
        // 1. 縦長結合画像を作成
        const verticalOutputPath = path.join(outputDir, 'combined_layers_vertical.png');
        await ImageCombiner.combineVertical(imagePaths, verticalOutputPath);

        // 2. 横長結合画像を作成（0,1を左側縦並び、2,3を右側縦並び）
        const horizontalOutputPath = path.join(outputDir, 'combined_layers_horizontal.png');
        await ImageCombiner.combineHorizontal(imagePaths, horizontalOutputPath);

        console.log('全ての結合画像の生成が完了しました');
    } catch (error) {
        console.error('画像結合でエラーが発生しました:', error);
    }
}

if (require.main === module) {
    main();
}