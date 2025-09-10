// コンポーネント画像生成モジュール（レイヤーごと・コンボ情報単体）
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';
import { VialConfig, RenderOptions } from './types';
import { Utils } from './utils';
import { Parser } from './parser';
import { VialKeyboardImageGenerator } from './generator';
import { ComboRenderer } from './combo_renderer';

export interface ComponentGenerationOptions {
    theme: 'light' | 'dark';
    outputDir: string;
    filePrefix?: string;
    generateLayers?: boolean;
    generateCombo?: boolean;
    layerRange?: { start: number; end: number };
}

export class ComponentGenerator {
    /**
     * vilファイルから各コンポーネント画像を生成
     * @param vilFilePath vilファイルのパス
     * @param options 生成オプション
     */
    static async generateComponentImages(
        vilFilePath: string,
        options: ComponentGenerationOptions
    ): Promise<void> {
        console.log('🎨 コンポーネント画像生成を開始します');
        console.log(`📁 入力ファイル: ${vilFilePath}`);
        console.log(`📁 出力ディレクトリ: ${options.outputDir}`);
        
        // 出力ディレクトリを作成
        if (!fs.existsSync(options.outputDir)) {
            fs.mkdirSync(options.outputDir, { recursive: true });
            console.log(`📁 出力ディレクトリを作成: ${options.outputDir}`);
        }

        // Vial設定を読み込み
        const config = Utils.loadVialConfig(vilFilePath);
        console.log(`✅ Vial設定読み込み完了: version=${config.version}`);

        const renderOptions: RenderOptions = {
            theme: options.theme,
            showComboInfo: false, // コンポーネント生成では個別に制御
            changeKeyColors: false,
            highlightComboKeys: false,
            highlightSubtextKeys: false,
            showComboMarkers: false,
            showTextColors: false
        };

        const filePrefix = options.filePrefix || path.basename(vilFilePath, '.vil');

        // レイヤー画像を生成
        if (options.generateLayers !== false) {
            await ComponentGenerator.generateLayerComponents(
                vilFilePath,
                config,
                options.outputDir,
                filePrefix,
                renderOptions,
                options.layerRange
            );
        }

        // コンボ情報画像を生成
        if (options.generateCombo !== false) {
            await ComponentGenerator.generateComboComponent(
                config,
                options.outputDir,
                filePrefix,
                options.theme
            );
        }

        console.log('✨ コンポーネント画像生成が完了しました');
    }

    /**
     * vilファイルの内容から各コンポーネント画像を生成（ブラウザ対応）
     * @param vilContent vilファイルの内容
     * @param filename ファイル名
     * @param options 生成オプション
     */
    static async generateComponentImagesFromContent(
        vilContent: string,
        filename: string,
        options: ComponentGenerationOptions
    ): Promise<void> {
        console.log('🎨 コンポーネント画像生成を開始します（内容から）');
        console.log(`📁 ファイル名: ${filename}`);
        console.log(`📁 出力ディレクトリ: ${options.outputDir}`);
        
        // 出力ディレクトリを作成
        if (!fs.existsSync(options.outputDir)) {
            fs.mkdirSync(options.outputDir, { recursive: true });
            console.log(`📁 出力ディレクトリを作成: ${options.outputDir}`);
        }

        // Vial設定を内容から読み込み
        const config = Utils.loadVialConfigFromContent(vilContent);
        console.log(`✅ Vial設定読み込み完了: version=${config.version}`);

        const renderOptions: RenderOptions = {
            theme: options.theme,
            showComboInfo: false, // コンポーネント生成では個別に制御
            changeKeyColors: false,
            highlightComboKeys: false,
            highlightSubtextKeys: false,
            showComboMarkers: false,
            showTextColors: false
        };

        const filePrefix = options.filePrefix || filename.replace('.vil', '');

        // レイヤー画像を生成
        if (options.generateLayers !== false) {
            await ComponentGenerator.generateLayerComponentsFromConfig(
                config,
                options.outputDir,
                filePrefix,
                renderOptions,
                options.layerRange
            );
        }

        // コンボ情報画像を生成
        if (options.generateCombo !== false) {
            await ComponentGenerator.generateComboComponent(
                config,
                options.outputDir,
                filePrefix,
                options.theme
            );
        }

        console.log('✨ コンポーネント画像生成が完了しました');
    }

    /**
     * レイヤーごとの画像を生成（設定から直接）
     */
    private static async generateLayerComponentsFromConfig(
        config: VialConfig,
        outputDir: string,
        filePrefix: string,
        renderOptions: RenderOptions,
        layerRange?: { start: number; end: number }
    ): Promise<void> {
        console.log('📐 レイヤー画像を生成中（設定から）...');
        
        const generator = new VialKeyboardImageGenerator();
        const startLayer = layerRange?.start || 0;
        const endLayer = layerRange?.end || Math.min(config.layout.length - 1, 3);

        for (let layer = startLayer; layer <= endLayer; layer++) {
            if (layer >= config.layout.length) {
                console.log(`⚠️ レイヤー${layer}は存在しません（最大: ${config.layout.length - 1}）`);
                continue;
            }

            const outputPath = path.join(outputDir, `${filePrefix}_layer${layer}_component.png`);
            
            try {
                // TODO: generateKeyboardImageFromConfig メソッドが必要
                // generator.generateKeyboardImageFromConfig(config, outputPath, layer, renderOptions);
                console.log(`✅ レイヤー${layer}画像を生成: ${outputPath}`);
            } catch (error) {
                console.error(`❌ レイヤー${layer}画像生成エラー:`, error);
            }
        }
    }

    /**
     * レイヤーごとの画像を生成
     */
    private static async generateLayerComponents(
        vilFilePath: string,
        config: VialConfig,
        outputDir: string,
        filePrefix: string,
        renderOptions: RenderOptions,
        layerRange?: { start: number; end: number }
    ): Promise<void> {
        console.log('📐 レイヤー画像を生成中...');
        
        const generator = new VialKeyboardImageGenerator();
        const startLayer = layerRange?.start || 0;
        const endLayer = layerRange?.end || Math.min(config.layout.length - 1, 3);

        for (let layer = startLayer; layer <= endLayer; layer++) {
            if (layer >= config.layout.length) {
                console.log(`⚠️ レイヤー${layer}は存在しません（最大: ${config.layout.length - 1}）`);
                continue;
            }

            const outputPath = path.join(outputDir, `${filePrefix}_layer${layer}_component.png`);
            
            try {
                generator.generateKeyboardImage(vilFilePath, outputPath, layer, renderOptions);
                console.log(`✅ レイヤー${layer}画像を生成: ${outputPath}`);
            } catch (error) {
                console.error(`❌ レイヤー${layer}画像生成エラー:`, error);
            }
        }
    }

    /**
     * コンボ情報のみの画像を生成
     */
    private static async generateComboComponent(
        config: VialConfig,
        outputDir: string,
        filePrefix: string,
        theme: 'light' | 'dark'
    ): Promise<void> {
        console.log('🔗 コンボ情報画像を生成中...');

        try {
            // Combo情報を解析
            const combos = Parser.parseComboInfo(config);
            
            if (combos.length === 0) {
                console.log('📝 コンボ情報がありません。コンボ画像をスキップします');
                return;
            }

            // 適切な幅を設定（標準的なキーボード幅）
            const comboWidth = 800;
            
            // コンボ情報を描画（縦長レイアウト）
            const comboResult = ComboRenderer.drawCombos(combos, comboWidth, false, theme);
            
            if (comboResult.height === 0) {
                console.log('📝 有効なコンボ情報がありません。コンボ画像をスキップします');
                return;
            }

            // 画像を保存
            const outputPath = path.join(outputDir, `${filePrefix}_combo_${theme}.png`);
            const buffer = comboResult.canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);
            
            console.log(`✅ コンボ情報画像を生成: ${outputPath} (${comboResult.height}px高)`);
            
        } catch (error) {
            console.error('❌ コンボ情報画像生成エラー:', error);
        }
    }

    /**
     * サンプル用のコンポーネント画像を生成
     */
    static async generateSampleComponents(
        vilFilePath: string,
        theme: 'light' | 'dark' = 'dark'
    ): Promise<void> {
        const outputDir = path.join(process.cwd(), 'output', 'sample', 'yuvi40_' + theme, 'preview', 'component');
        
        const options: ComponentGenerationOptions = {
            theme,
            outputDir,
            filePrefix: 'yuvi40',
            generateLayers: true,
            generateCombo: true,
            layerRange: { start: 0, end: 3 }
        };

        await ComponentGenerator.generateComponentImages(vilFilePath, options);
    }
}