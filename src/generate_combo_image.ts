// Combo画像単体生成スクリプト
import * as fs from 'fs';
import * as path from 'path';
import { Utils } from './modules/utils';
import { Parser } from './modules/parser';
import { ComboRenderer } from './modules/combo_renderer';

async function main(): Promise<void> {
    const configPath = process.argv[2] || path.join(__dirname, '../data/yivu40-250907.vil');
    const outputPath = path.join(__dirname, '../output/combos_only.png');

    try {
        console.log('Combo画像生成を開始します');
        console.log(`設定ファイル: ${configPath}`);

        // Vial設定を読み込み
        const config = Utils.loadVialConfig(configPath);
        console.log(`読み込み成功: version=${config.version}, uid=${config.uid}`);

        // Combo情報を解析
        const combos = Parser.parseComboInfo(config);
        console.log(`Combo数: ${combos.length}`);

        if (combos.length === 0) {
            console.log('Comboが設定されていません');
            return;
        }

        // Combo画像を生成（幅は標準的なキーボード画像と同じ）
        const imageWidth = 1276;
        const result = ComboRenderer.drawCombos(combos, imageWidth);

        if (result.height === 0) {
            console.log('描画するComboがありません');
            return;
        }

        // 画像を保存
        const buffer = result.canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`Combo画像を生成しました: ${outputPath}`);
        console.log(`画像サイズ: ${imageWidth}x${result.height}`);

    } catch (error) {
        console.error('Combo画像生成でエラーが発生しました:', error);
    }
}

if (require.main === module) {
    main();
}