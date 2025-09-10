// 新しい位置ベースのキーボード画像生成器
import * as fs from 'fs';
import { createCanvas } from 'canvas';
import { VialConfig, COLORS, RenderOptions, ComboInfo, getThemeColors } from './types';
import { Utils } from './utils';
import { Parser } from './parser';
import { Renderer } from './renderer';
import { KeyboardLayout } from './layout';

export class NewVialKeyboardImageGenerator {
    private layout: KeyboardLayout;

    constructor() {
        this.layout = new KeyboardLayout();
    }

    // キーボード画像を生成（新しいアプローチ）
    public generateKeyboardImage(configPath: string, outputPath: string, layerIndex: number = 0, options: RenderOptions = {}): void {
        console.log('New Vial Keyboard Image Generator (Position-Based)');
        
        // Vial設定を読み込み
        const config = Utils.loadVialConfig(configPath);
        console.log(`レイヤー数: ${config.layout?.length || 0}`);
        console.log(`生成対象レイヤー: ${layerIndex}`);

        // Combo情報を取得
        const combos = Parser.parseComboInfo(config);
        console.log(`Combo数: ${combos.length}個`);

        // キャンバスサイズを計算
        const canvasWidth = 1276;
        const canvasHeight = 272;

        // Canvasを作成
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // 背景を塗りつぶし
        const colors = getThemeColors(options.theme);
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 位置ベースでキーを描画
        this.drawKeys(ctx, config, layerIndex, combos, options);

        // レイヤー番号を描画（位置ベースで中央計算）
        this.drawLayerNumber(ctx, layerIndex, canvasWidth, canvasHeight);

        // 画像として保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`キーボード画像を生成しました: ${outputPath}`);
    }

    // 位置ベースでキーを描画
    private drawKeys(ctx: any, config: VialConfig, layerIndex: number, combos: ComboInfo[], options: RenderOptions): void {
        const maxRows = this.layout.getMaxRows();
        const maxCols = this.layout.getMaxCols();

        for (let row = 0; row < maxRows; row++) {
            for (let col = 0; col < maxCols; col++) {
                // 画面位置を取得
                const screenPos = this.layout.getScreenPosition(row, col);
                if (!screenPos) continue; // 存在しない位置はスキップ

                // キーコードを取得
                const keycode = this.layout.getKeycodeAt(row, col, layerIndex, config);

                // ラベルを生成
                const label = Parser.keycodeToLabel(keycode, config);

                // キー位置を変換
                const pos = {
                    x: screenPos.x,
                    y: screenPos.y,
                    width: screenPos.width,
                    height: screenPos.height,
                    rotation: 0
                };

                // キーを描画
                Renderer.drawKey(ctx, pos, label, keycode, combos, options);
                Renderer.drawText(ctx, pos, label, keycode, combos, options);
            }
        }
    }

    // レイヤー番号を描画（位置ベースで中央計算）
    private drawLayerNumber(ctx: any, layerIndex: number, canvasWidth: number, canvasHeight: number): void {
        const boxWidth = 90;
        const boxHeight = 45;
        
        // BとNの間の中央位置を取得
        const centerPos = this.layout.getCenterBetweenBAndN();
        const x = centerPos.x - boxWidth / 2;
        const y = centerPos.y + 8; // 3行目の高さから少し下に
        const cornerRadius = 8;

        // 背景ボックスを描画
        ctx.fillStyle = '#2a2d35';
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        
        // 角丸四角形を描画
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

        // レイヤー番号テキストを描画
        ctx.font = 'bold 24px Arial, sans-serif'; // フォントサイズを大きく
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const textX = centerPos.x; // ボックスの中央
        const textY = y + boxHeight / 2 + 8; // 少し下に調整
        ctx.fillText(`#${layerIndex}`, textX, textY);
    }
}