import { ComponentBatchGenerator } from './src/modules/component_batch_generator';

async function generateAllSamples() {
    console.log('4つの組み合わせでサンプル画像生成開始...');
    
    const combinations = [
        { colorMode: 'dark' as const, comboHighlight: false, subtextHighlight: false, folder: '0-0' },
        { colorMode: 'dark' as const, comboHighlight: true, subtextHighlight: true, folder: '1-1' },
        { colorMode: 'light' as const, comboHighlight: false, subtextHighlight: false, folder: '0-0' },
        { colorMode: 'light' as const, comboHighlight: true, subtextHighlight: true, folder: '1-1' },
    ];
    
    for (const combo of combinations) {
        try {
            console.log(`\n📸 ${combo.colorMode}モード ${combo.folder}の生成中...`);
            
            await ComponentBatchGenerator.generateAllComponents({
                configPath: './data/yivu40-250907.vil',
                colorMode: combo.colorMode,
                comboHighlight: combo.comboHighlight,
                subtextHighlight: combo.subtextHighlight,
                quality: 'low'
            });
            
            console.log(`✅ ${combo.colorMode}モード ${combo.folder}生成完了`);
        } catch (error) {
            console.error(`❌ ${combo.colorMode}モード ${combo.folder}でエラー:`, error);
        }
    }
    
    console.log('\n🎉 全4組み合わせの生成完了！');
    console.log('\n生成された画像:');
    console.log('- output/yivu40-250907/dark/0-0/');
    console.log('- output/yivu40-250907/dark/1-1/');
    console.log('- output/yivu40-250907/light/0-0/');
    console.log('- output/yivu40-250907/light/1-1/');
}

generateAllSamples();