// モジュール分割版のメインファイル
import * as path from 'path';
import { VialKeyboardImageGenerator } from './modules/generator';

// メイン実行
function main(): void {
    const generator = new VialKeyboardImageGenerator();
    const configPath = process.argv[2] || path.join(__dirname, '../data/yivu40-250906.vil');
    const layerIndex = process.argv[3] ? parseInt(process.argv[3]) : 1;
    
    const outputPath = path.join(__dirname, `../output/keyboard_layout_layer${layerIndex}_modular.png`);
    generator.generateKeyboardImage(configPath, outputPath, layerIndex);
}

if (require.main === module) {
    main();
}