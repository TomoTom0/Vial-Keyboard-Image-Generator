// コンポーネント一括生成モジュール（完全共通化）
import { ComboRenderer } from './combo_renderer';
import { ImageCombiner } from './combiner';
import { Parser } from './parser';
import { Utils } from './utils';
import { RenderOptions, getThemeColors } from './types';

// Canvas抽象化インターface
interface CanvasAdapter {
    createCanvas(width: number, height: number): any;
    getContext(canvas: any): any;
}

// 共通描画ロジック（Rendererクラスの内容を直接実装）
class CommonRenderer {
    // Combo入力キーかどうかを判定
    private static isComboInputKey(keycode: string, combos: any[]): boolean {
        for (const combo of combos) {
            if (combo.keycodes.includes(keycode)) {
                return true;
            }
        }
        return false;
    }

    // キーの背景を描画（共通ロジック）
    static drawKey(ctx: any, pos: any, label: any, keycode?: string, combos?: any[], options: any = {}): void {
        const colors = getThemeColors(options.theme);
        
        const {
            highlightComboKeys = true,
            highlightSubtextKeys = true,
            showComboMarkers = true
        } = options;

        const isComboKey = (combos && keycode !== undefined) ? CommonRenderer.isComboInputKey(keycode, combos) : false;
        const hasSubTexts = label.subTexts && label.subTexts.length > 0;
        
        let keyColor: string;
        let borderColor: string;
        
        if (label.mainText === '') {
            keyColor = colors.keyEmpty;
            borderColor = colors.borderEmpty;
        } else if ((isComboKey && highlightComboKeys) || (hasSubTexts && highlightSubtextKeys)) {
            keyColor = colors.keySpecial;
            borderColor = colors.borderSpecial;
        } else {
            keyColor = colors.keyNormal;
            borderColor = colors.borderNormal;
        }

        // メインキーエリア
        ctx.fillStyle = keyColor;
        ctx.fillRect(pos.x + 1, pos.y + 1, pos.width - 2, pos.height - 2);

        // 細いボーダー
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

        // Combo入力キーには右上に直角三角形マーカーを追加
        if (isComboKey && showComboMarkers) {
            const triangleSize = 12;
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.moveTo(pos.x + pos.width - triangleSize, pos.y);
            ctx.lineTo(pos.x + pos.width, pos.y);
            ctx.lineTo(pos.x + pos.width, pos.y + triangleSize);
            ctx.closePath();
            ctx.fill();
        }
    }

    // テキストを描画（共通ロジック）
    static drawText(ctx: any, pos: any, label: any, keycode?: string, combos?: any[], options: any = {}): void {
        if (label.mainText === '') return;

        const colors = getThemeColors(options.theme);
        const {
            highlightComboKeys = true,
            highlightSubtextKeys = true,
            showTextColors = true
        } = options;

        const isComboKey = (combos && keycode !== undefined) ? CommonRenderer.isComboInputKey(keycode, combos) : false;
        const hasSubTexts = label.subTexts && label.subTexts.length > 0;

        const mainColor = (showTextColors && ((isComboKey && highlightComboKeys) || (hasSubTexts && highlightSubtextKeys))) 
            ? colors.textSpecial 
            : colors.textNormal;
        
        let fontSize: number;
        if (label.mainText.length === 1) {
            fontSize = 24;
        } else if (label.mainText.length > 8) {
            fontSize = 14;
        } else if (label.subText) {
            fontSize = 20;
        } else {
            fontSize = 18;
        }

        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = mainColor;
        ctx.textAlign = 'center';

        const mainY = pos.y + pos.height * 0.35;
        ctx.fillText(label.mainText, pos.x + pos.width / 2, mainY);

        // サブテキストの描画
        if (label.subTexts && label.subTexts.length > 0) {
            ctx.fillStyle = colors.textSub;
            
            if (label.subTexts.length === 1) {
                ctx.font = '14px Arial, sans-serif';
                const y = pos.y + pos.height * 0.75;
                ctx.fillText(label.subTexts[0], pos.x + pos.width / 2, y);
            } else {
                const startY = pos.y + pos.height * 0.65;
                const lineHeight = 13;
                
                // サブテキストの長さに応じて配置を調整
                let i = 0;
                let row = 0;
                
                while (i < label.subTexts.length) {
                    const y = startY + (row * lineHeight);
                    
                    // 現在の要素が長いかチェック
                    const currentText = label.subTexts[i];
                    ctx.font = '13px Arial, sans-serif';
                    const textWidth = ctx.measureText(currentText).width;
                    const maxSingleWidth = pos.width * 0.4; // キー幅の40%以下なら2個配置可能
                    
                    // 次の要素も存在し、両方が短い場合は2個配置
                    if (i + 1 < label.subTexts.length && textWidth <= maxSingleWidth) {
                        const nextText = label.subTexts[i + 1];
                        ctx.font = '11px Arial, sans-serif';
                        const nextTextWidth = ctx.measureText(nextText).width;
                        const maxSecondWidth = pos.width * 0.35;
                        
                        if (nextTextWidth <= maxSecondWidth) {
                            // 一行に二個表示
                            const leftX = pos.x + pos.width * 0.25;
                            const rightX = pos.x + pos.width * 0.75;
                            
                            ctx.font = '13px Arial, sans-serif';
                            ctx.fillText(currentText, leftX, y);
                            
                            ctx.font = '11px Arial, sans-serif';
                            ctx.fillText(nextText, rightX, y);
                            
                            i += 2;
                        } else {
                            // 次の要素が長いので現在の要素のみ表示
                            ctx.font = '11px Arial, sans-serif';
                            ctx.fillText(currentText, pos.x + pos.width / 2, y);
                            i += 1;
                        }
                    } else {
                        // 現在の要素のみ表示（長いか、最後の要素）
                        ctx.font = '11px Arial, sans-serif';
                        ctx.fillText(currentText, pos.x + pos.width / 2, y);
                        i += 1;
                    }
                    
                    row++;
                }
            }
        }
    }

    // レイヤー番号を描画（共通ロジック）
    static drawLayerNumber(ctx: any, layerIndex: number, canvasWidth: number, canvasHeight: number, options: any = {}): void {
        const colors = getThemeColors(options.theme);
        const margin = 20;
        const boxWidth = 80;
        const boxHeight = 40;
        
        const keyWidth = 78;
        const keyGap = 4;
        const unitX = keyWidth + keyGap;
        
        const bKeyRightEnd = margin + unitX * 5 + keyWidth; 
        const nKeyLeftStart = margin + unitX * 8.5; 
        const keyboardCenterX = (bKeyRightEnd + nKeyLeftStart) / 2;
        const x = keyboardCenterX - boxWidth / 2;
        
        const keyRowHeight = 64;
        const y = margin + keyRowHeight * 2;
        const cornerRadius = 8;

        // 背景ボックスを描画
        ctx.fillStyle = colors.headerBackground;
        ctx.strokeStyle = colors.headerBorder;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + boxWidth - cornerRadius, y);
        ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + cornerRadius);
        ctx.lineTo(x + boxWidth, y + boxHeight - cornerRadius);
        ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - cornerRadius, y + boxHeight);
        ctx.lineTo(x + cornerRadius, y + boxHeight);
        ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // レイヤー番号を表示
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = colors.headerText;
        ctx.textAlign = 'center';
        const centerX = keyboardCenterX;
        const centerY = y + boxHeight / 2 + 6;
        ctx.fillText(`#${layerIndex}`, centerX, centerY);
    }
}

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

export class ComponentBatchGenerator {
    // 全コンポーネント画像を一括生成してcanvasを返す（canvas抽象化対応）
    static async generateAllComponents(
        vilContent: string, 
        options: ComponentGeneratorOptions, 
        canvasAdapter: CanvasAdapter,
        renderAdapter: RenderAdapter
    ): Promise<ImageComponent[]> {
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

        // ジェネレーターを作成
        const generator = new VialKeyboardImageGenerator();
        
        // 画像サイズを計算（一時ファイルを使わずに直接計算）
        const keyWidth = 78;
        const keyGap = 4;
        const unitX = keyWidth + keyGap;
        const margin = 10;
        const contentWidth = unitX * 14.0 + 30.0 + keyWidth;
        const baseImageWidth = Math.ceil(contentWidth + margin * 2);

        // 1. 個別レイヤーcanvasを生成
        for (let layerIndex = 0; layerIndex < config.layout.length; layerIndex++) {
            const canvas = generator.generateKeyboardCanvas(config, layerIndex, renderOptions, scale);
            components.push({
                canvas,
                type: 'layer',
                name: `layer${layerIndex}-${quality}`
            });
            console.log(`レイヤー${layerIndex} canvas生成完了`);
        }

        // 2. コンボ情報canvasを生成
        const combos = Parser.parseComboInfo(config);
        
        // 1x幅でコンボ情報生成
        const combo1xResult = ComboRenderer.drawCombos(
            combos, 
            baseImageWidth, 
            false, 
            colorMode, 
            scale, 
            false,           // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight   // showComboMarkers（三角マーカーのみ）
        );
        components.push({
            canvas: combo1xResult.canvas,
            type: 'combo',
            name: `combo-1x-${quality}`
        });
        console.log(`コンボ情報（1x）canvas生成完了`);

        // 2x幅でコンボ情報生成
        const combo2xResult = ComboRenderer.drawCombos(
            combos, 
            baseImageWidth * 2, 
            true, 
            colorMode, 
            scale, 
            false,           // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight   // showComboMarkers（三角マーカーのみ）
        );
        components.push({
            canvas: combo2xResult.canvas,
            type: 'combo',
            name: `combo-2x-${quality}`
        });
        console.log(`コンボ情報（2x）canvas生成完了`);

        // 3x幅でコンボ情報生成
        const combo3xResult = ComboRenderer.drawCombos(
            combos, 
            baseImageWidth * 3, 
            true, 
            colorMode, 
            scale, 
            false,           // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight   // showComboMarkers（三角マーカーのみ）
        );
        components.push({
            canvas: combo3xResult.canvas,
            type: 'combo',
            name: `combo-3x-${quality}`
        });
        console.log(`コンボ情報（3x）canvas生成完了`);

        // 3. レイアウト見出しcanvasを生成（1x, 2x, 3x幅）
        // 1x幅ヘッダー
        const header1xCanvas = ImageCombiner.generateHeaderCanvas(
            baseImageWidth,
            colorMode,
            options.configPath,
            scale
        );
        components.push({
            canvas: header1xCanvas,
            type: 'header',
            name: `header-1x-${quality}`
        });
        console.log(`レイアウト見出し（1x）canvas生成完了`);

        // 2x幅ヘッダー
        const header2xCanvas = ImageCombiner.generateHeaderCanvas(
            baseImageWidth * 2,
            colorMode,
            options.configPath,
            scale
        );
        components.push({
            canvas: header2xCanvas,
            type: 'header',
            name: `header-2x-${quality}`
        });
        console.log(`レイアウト見出し（2x）canvas生成完了`);

        // 3x幅ヘッダー
        const header3xCanvas = ImageCombiner.generateHeaderCanvas(
            baseImageWidth * 3,
            colorMode,
            options.configPath,
            scale
        );
        components.push({
            canvas: header3xCanvas,
            type: 'header',
            name: `header-3x-${quality}`
        });
        console.log(`レイアウト見出し（3x）canvas生成完了`);

        console.log(`全コンポーネントcanvas生成完了: ${components.length}個`);
        return components;
    }
}