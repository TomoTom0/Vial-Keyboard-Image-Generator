// ライトモード結合画像作成スクリプト
import { combineImages } from './src/combine_images';

async function main() {
    const configPath = 'data/yivu40-250907.vil';
    
    console.log('ライトモードで結合画像を生成中...');
    
    // ライトモードで結合画像を生成
    await combineImages(configPath, undefined, './output', 'light');
    
    console.log('ライトモード結合画像生成完了！');
}

main().catch(console.error);