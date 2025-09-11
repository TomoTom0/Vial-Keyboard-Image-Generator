// ブラウザ対応版 ComponentBatchGenerator
import type { VialConfig, RenderOptions, ComboInfo, ReplaceRule } from './types'
import { Utils } from './utils'
import { Parser } from './parser'
import { CanvasDrawingUtils, type CanvasAdapter } from './canvasDrawingUtils'
import { KEYBOARD_CONSTANTS } from '../constants/keyboard'

// バックエンドの共通モジュールをインポート
import { getThemeColors } from '../../../backend/src/modules/types'
import { Utils as BackendUtils } from '../../../backend/src/modules/utils'

// Rendererだけは型の問題があるので、描画ロジックを直接コピー
// （実際のCanvas APIは同じなので、型だけの問題）

interface ComponentGeneratorOptions {
    configPath: string;
    colorMode: 'dark' | 'light';
    comboHighlight: boolean;
    subtextHighlight: boolean;
    quality: 'high' | 'low';
    replaceRules?: ReplaceRule[];
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
    
    // 共通定数を使用
    private static get keyWidth() { return KEYBOARD_CONSTANTS.keyWidth }
    private static get keyHeight() { return KEYBOARD_CONSTANTS.keyHeight }
    private static get keyGap() { return KEYBOARD_CONSTANTS.keyGap }
    private static get unitX() { return KEYBOARD_CONSTANTS.unitX }
    private static get unitY() { return KEYBOARD_CONSTANTS.unitY }
    private static get margin() { return KEYBOARD_CONSTANTS.margin }
    // 全コンポーネント画像を一括生成してcanvas配列を返す
    static async generateAllComponents(
        vilFileContent: string,
        options: ComponentGeneratorOptions
    ): Promise<GeneratedComponent[]> {
        try {
            const {
                configPath,
                colorMode,
                comboHighlight,
                subtextHighlight,
                quality,
                replaceRules
            } = options;

            const components: GeneratedComponent[] = [];


        // Vial設定を読み込み
        const config = Utils.loadVialConfigFromContent(vilFileContent);
        
        // 品質設定に応じてスケール倍率を決定
        const scale = quality === 'low' ? 0.3 : 1.0;
        
        // レンダリングオプションを設定
        const renderOptions: RenderOptions = {
            theme: colorMode,
            highlightComboKeys: comboHighlight,
            highlightSubtextKeys: subtextHighlight,
            showComboMarkers: comboHighlight
        };

        // 基準画像幅（レイヤー画像と統一した計算）
        const baseContentWidth = this.unitX * 13.5 + this.keyWidth;
        const baseImageWidth = Math.ceil(baseContentWidth + this.margin * 2);
        const imageWidth = Math.floor(baseImageWidth * scale);

        // 1. 個別レイヤー画像を生成（バックエンドと同じロジックを使用）
        const layerCanvases: HTMLCanvasElement[] = [];
        for (let layerIndex = 0; layerIndex < config.layout.length; layerIndex++) {
            const canvas = this.generateLayerCanvas(config, layerIndex, renderOptions, scale, replaceRules);
            layerCanvases.push(canvas);
            components.push({
                canvas,
                type: 'layer',
                name: `layer${layerIndex}-${quality}`
            });
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
            comboHighlight, // highlightComboKeys
            comboHighlight // showComboMarkers
        );
        components.push({
            canvas: combo1xResult.canvas,
            type: 'combo',
            name: `combo-1x-${quality}`
        });

        // 2x幅でコンボ情報生成
        const combo2xResult = CanvasDrawingUtils.drawCombos(
            this.adapter,
            combos, 
            baseImageWidth * 2, 
            true, // isWideLayout
            colorMode, 
            scale, 
            comboHighlight, // highlightComboKeys
            comboHighlight // showComboMarkers
        );
        components.push({
            canvas: combo2xResult.canvas,
            type: 'combo',
            name: `combo-2x-${quality}`
        });

        // 3x幅でコンボ情報生成
        const combo3xResult = CanvasDrawingUtils.drawCombos(
            this.adapter,
            combos, 
            baseImageWidth * 3, 
            true, // isWideLayout
            colorMode, 
            scale, 
            comboHighlight, // highlightComboKeys
            comboHighlight // showComboMarkers
        );
        components.push({
            canvas: combo3xResult.canvas,
            type: 'combo',
            name: `combo-3x-${quality}`
        });

        // 3. レイアウト見出し画像を生成（1x, 2x, 3x幅）
        // 1x幅ヘッダー
        const header1xCanvas = CanvasDrawingUtils.generateHeaderImage(
            this.adapter,
            baseImageWidth,
            colorMode,
            configPath, // 実際のファイル名を使用
            scale
        );
        components.push({
            canvas: header1xCanvas,
            type: 'header',
            name: `header-1x-${quality}`
        });

        // 2x幅ヘッダー
        const header2xCanvas = CanvasDrawingUtils.generateHeaderImage(
            this.adapter,
            baseImageWidth * 2,
            colorMode,
            configPath,
            scale
        );
        components.push({
            canvas: header2xCanvas,
            type: 'header',
            name: `header-2x-${quality}`
        });

        // 3x幅ヘッダー
        const header3xCanvas = CanvasDrawingUtils.generateHeaderImage(
            this.adapter,
            baseImageWidth * 3,
            colorMode,
            configPath,
            scale
        );
        components.push({
            canvas: header3xCanvas,
            type: 'header',
            name: `header-3x-${quality}`
        });

        // 4. 結合画像を生成（TODO: 必要に応じて実装）
        // 縦配置結合と横配置結合は別途実装

            return components;
        } catch (error) {
            console.error('BrowserComponentBatchGenerator.generateAllComponents failed:', error);
            throw new Error(`Canvas generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // バックエンドと同じレイヤー画像生成ロジック（ブラウザCanvasAdapter使用）
    private static generateLayerCanvas(config: VialConfig, layerIndex: number, options: RenderOptions, scale: number, replaceRules?: ReplaceRule[]): HTMLCanvasElement {
        try {
        // Combo情報を解析（バックエンドの共通モジュールを使用）
        const combos = Parser.parseComboInfo(config);

        // 画像サイズを計算（左右に適切な余白を含む）
        const contentWidth = this.unitX * 13.5 + this.keyWidth;
        const contentHeight = this.unitY * 3.0 + this.keyHeight;
        const imgWidth = Math.ceil((contentWidth + this.margin * 2) * scale);
        const imgHeight = Math.ceil((contentHeight + this.margin * 2) * scale);

        // ブラウザCanvasを作成
        const canvas = this.adapter.createCanvas(imgWidth, imgHeight);
        const ctx = this.adapter.getContext(canvas);

        // スケール適用
        ctx.scale(scale, scale);

        // テーマ色を取得（バックエンドの共通関数を使用）
        const colors = getThemeColors(options.theme);
        
        // 背景を塗りつぶし
        ctx.fillStyle = options.backgroundColor || colors.background;
        ctx.fillRect(0, 0, imgWidth / scale, imgHeight / scale);

        // キー配置情報を取得（バックエンドの共通モジュールを使用）
        const positions = BackendUtils.getKeyPositions(this.keyWidth, this.keyHeight, this.keyGap, this.margin);

        // 指定されたレイヤーのキーを描画
        if (config.layout.length > layerIndex) {
            const layer = config.layout[layerIndex];

            for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
                for (let colIdx = 0; colIdx < positions[rowIdx].length; colIdx++) {
                    const pos = positions[rowIdx][colIdx];
                    if (!pos) continue;

                    const keycode = layer[rowIdx]?.[colIdx] || -1;
                    const label = Parser.keycodeToLabel(keycode, config);

                    // キーを描画（フロントエンド独自canvasDrawingUtilsを使用）
                    const stringKeycode = String(keycode);
                    const colors = getThemeColors(options.theme);
                    CanvasDrawingUtils.drawKey(ctx, pos, label, stringKeycode, options, colors, combos);
                    CanvasDrawingUtils.drawText(ctx, pos, label, stringKeycode, options, colors, combos, replaceRules);
                }
            }
        }

        // レイヤー番号を装飾付きで描画（フロントエンド独自canvasDrawingUtilsを使用）
        CanvasDrawingUtils.drawLayerNumber(ctx, layerIndex, canvas.width / scale, canvas.height / scale, colors);

            return canvas;
        } catch (error) {
            console.error(`generateLayerCanvas failed for layer ${layerIndex}:`, error);
            throw new Error(`Layer ${layerIndex} canvas generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}