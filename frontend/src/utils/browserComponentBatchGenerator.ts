// ブラウザ対応版 ComponentBatchGenerator
import { VialConfig, RenderOptions, ComboInfo } from './types'
import { Utils } from './utils'
import { Parser } from './parser'
import { CanvasDrawingUtils, CanvasAdapter } from './canvasDrawingUtils'

interface ComponentGeneratorOptions {
    configPath: string;
    colorMode: 'dark' | 'light';
    comboHighlight: boolean;
    subtextHighlight: boolean;
    quality: 'high' | 'low';
}

interface GeneratedComponent {
    canvas: HTMLCanvasElement;
    type: 'layer' | 'combo' | 'header' | 'combined';
    name: string;
}

// ブラウザ用のCanvasAdapter実装
class BrowserCanvasAdapter implements CanvasAdapter {
    createCanvas(width: number, height: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context取得に失敗しました');
        return ctx;
    }
}

export class BrowserComponentBatchGenerator {
    private static adapter = new BrowserCanvasAdapter();
    // 全コンポーネント画像を一括生成してcanvas配列を返す
    static async generateAllComponents(
        vilFileContent: string,
        options: ComponentGeneratorOptions
    ): Promise<GeneratedComponent[]> {
        const {
            colorMode,
            comboHighlight,
            subtextHighlight,
            quality
        } = options;

        const components: GeneratedComponent[] = [];

        console.log(`ブラウザ版コンポーネント一括生成開始`);

        // Vial設定を読み込み
        const config = Utils.loadVialConfigFromContent(vilFileContent);
        
        // 品質設定に応じてスケール倍率を決定
        const scale = quality === 'low' ? 0.5 : 1.0;
        
        // レンダリングオプションを設定
        const renderOptions: RenderOptions = {
            theme: colorMode,
            highlightComboKeys: comboHighlight,
            highlightSubtextKeys: subtextHighlight,
            showComboMarkers: comboHighlight
        };

        // 基準画像幅（元実装から）
        const baseImageWidth = 1276;
        const imageWidth = Math.floor(baseImageWidth * scale);

        // 1. 個別レイヤー画像を生成
        const layerCanvases: HTMLCanvasElement[] = [];
        for (let layerIndex = 0; layerIndex < config.layout.length; layerIndex++) {
            const canvas = CanvasDrawingUtils.drawKeyboardImage(
                this.adapter,
                config,
                layerIndex,
                renderOptions,
                scale
            );
            layerCanvases.push(canvas);
            components.push({
                canvas,
                type: 'layer',
                name: `layer${layerIndex}-${quality}`
            });
            console.log(`レイヤー${layerIndex}生成完了`);
        }

        // 2. コンボ情報画像を生成（1x, 2x, 3x幅）
        const combos = Parser.parseComboInfo(config);
        
        // 1x幅でコンボ情報生成
        const combo1xResult = CanvasDrawingUtils.drawCombos(
            this.adapter,
            combos, 
            baseImageWidth, 
            false, // isWideLayout
            colorMode, 
            scale, 
            false, // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight // showComboMarkers（三角マーカーのみ）
        );
        components.push({
            canvas: combo1xResult.canvas,
            type: 'combo',
            name: `combo-1x-${quality}`
        });
        console.log(`コンボ情報（1x）生成完了`);

        // 2x幅でコンボ情報生成
        const combo2xResult = CanvasDrawingUtils.drawCombos(
            this.adapter,
            combos, 
            baseImageWidth * 2, 
            true, // isWideLayout
            colorMode, 
            scale, 
            false, // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight // showComboMarkers（三角マーカーのみ）
        );
        components.push({
            canvas: combo2xResult.canvas,
            type: 'combo',
            name: `combo-2x-${quality}`
        });
        console.log(`コンボ情報（2x）生成完了`);

        // 3x幅でコンボ情報生成
        const combo3xResult = CanvasDrawingUtils.drawCombos(
            this.adapter,
            combos, 
            baseImageWidth * 3, 
            true, // isWideLayout
            colorMode, 
            scale, 
            false, // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight // showComboMarkers（三角マーカーのみ）
        );
        components.push({
            canvas: combo3xResult.canvas,
            type: 'combo',
            name: `combo-3x-${quality}`
        });
        console.log(`コンボ情報（3x）生成完了`);

        // 3. レイアウト見出し画像を生成（1x, 2x, 3x幅）
        // 1x幅ヘッダー
        const header1xCanvas = CanvasDrawingUtils.generateHeaderImage(
            this.adapter,
            baseImageWidth,
            colorMode,
            'config.vil', // 仮のファイル名
            scale
        );
        components.push({
            canvas: header1xCanvas,
            type: 'header',
            name: `header-1x-${quality}`
        });
        console.log(`レイアウト見出し画像（1x）生成完了`);

        // 2x幅ヘッダー
        const header2xCanvas = CanvasDrawingUtils.generateHeaderImage(
            this.adapter,
            baseImageWidth * 2,
            colorMode,
            'config.vil',
            scale
        );
        components.push({
            canvas: header2xCanvas,
            type: 'header',
            name: `header-2x-${quality}`
        });
        console.log(`レイアウト見出し画像（2x）生成完了`);

        // 3x幅ヘッダー
        const header3xCanvas = CanvasDrawingUtils.generateHeaderImage(
            this.adapter,
            baseImageWidth * 3,
            colorMode,
            'config.vil',
            scale
        );
        components.push({
            canvas: header3xCanvas,
            type: 'header',
            name: `header-3x-${quality}`
        });
        console.log(`レイアウト見出し画像（3x）生成完了`);

        // 4. 結合画像を生成（TODO: 必要に応じて実装）
        // 縦配置結合と横配置結合は別途実装

        console.log(`全コンポーネント生成完了: ${components.length}個`);
        return components;
    }




}