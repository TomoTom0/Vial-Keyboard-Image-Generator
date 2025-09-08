// ライトモードでの画像生成スクリプト
import { generateAllLayers } from './src/generate_all_layers';

async function main() {
    const configPath = 'data/yivu40-250907.vil';
    
    console.log('ライトモードでレイヤー画像を生成中...');
    
    // ライトモードでレイヤー画像を生成
    await generateAllLayers(configPath, './output', {
        renderOptions: {
            theme: 'light'
        }
    });
    
    console.log('ライトモード画像生成完了！');
}

main().catch(console.error);