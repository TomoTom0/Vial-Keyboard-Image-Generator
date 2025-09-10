// シンプルなCanvas生成モジュール：vilデータからcanvasセットを返す
import { createCanvas } from 'canvas';
import { VialKeyboardImageGenerator } from './generator';
import { ComboRenderer } from './combo_renderer';
import { ImageCombiner } from './combiner';
import { Parser } from './parser';
import { RenderOptions } from './types';

interface ComponentGeneratorOptions {
    configPath: string;
    colorMode: 'dark' | 'light';
    comboHighlight: boolean;
    subtextHighlight: boolean;
    quality: 'high' | 'low';
}

interface ImageComponent {
    canvas: any; // Canvas (Node.js canvas package)
    type: 'layer' | 'combo' | 'header';
    name: string;
}

export class CanvasComponentGenerator {
    // vilデータからcanvasセットを返す（シンプル版）
    static async generateAllComponents(vilContent: string, options: ComponentGeneratorOptions): Promise<ImageComponent[]> {
        const {
            colorMode,
            comboHighlight,
            subtextHighlight,
            quality
        } = options;

        // Vial設定をパース
        const config = JSON.parse(vilContent);
        
        // 品質設定に応じてスケール倍率を決定
        const scale = quality === 'low' ? 0.5 : 1.0;
        
        const components: ImageComponent[] = [];
        
        // レンダリングオプションを設定
        const renderOptions: RenderOptions = {
            theme: colorMode,
            highlightComboKeys: comboHighlight,
            highlightSubtextKeys: subtextHighlight,
            showComboMarkers: comboHighlight
        };

        // VialKeyboardImageGeneratorを使用して各レイヤーのcanvasを直接取得
        const generator = new VialKeyboardImageGenerator();
        
        // 各レイヤーのcanvasを生成
        for (let layerIndex = 0; layerIndex < config.layout.length; layerIndex++) {
            const canvas = generator.generateKeyboardCanvas(config, layerIndex, renderOptions, scale);
            
            components.push({
                canvas,
                type: 'layer',
                name: `layer${layerIndex}-${quality}`
            });
            
            console.log(`レイヤー${layerIndex} canvas生成完了`);
        }

        return components;
    }
}