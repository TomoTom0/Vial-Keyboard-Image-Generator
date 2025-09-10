// 統合・生成モジュール（メイン処理）
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';
import { VialConfig, COLORS, RenderOptions, getThemeColors } from './types';
import { Utils } from './utils';
import { Parser } from './parser';
import { Renderer } from './renderer';

export class VialKeyboardImageGenerator {
    private readonly keyWidth = 78;
    private readonly keyHeight = 60;
    private readonly keyGap = 4;
    private readonly unitX: number;
    private readonly unitY: number;
    private readonly margin = 10;

    constructor() {
        this.unitX = this.keyWidth + this.keyGap;
        this.unitY = this.keyHeight + this.keyGap;
    }


    // キーボード画像を生成
    public generateKeyboardImage(configPath: string, outputPath: string, layerIndex: number = 0, options: RenderOptions = {}, scale: number = 1.0): void {
        console.log('Vial Keyboard Image Generator (TypeScript)');
        
        // Vial設定を読み込み
        const config = Utils.loadVialConfig(configPath);
        console.log(`読み込み成功: version=${config.version}, uid=${config.uid}`);
        console.log(`レイヤー数: ${config.layout.length}`);
        console.log(`生成対象レイヤー: ${layerIndex}`);
        
        // Combo情報を解析
        const combos = Parser.parseComboInfo(config);
        console.log(`Combo数: ${combos.length}個`);

        // 画像サイズを計算
        const contentWidth = this.unitX * 14.0 + 30.0 + this.keyWidth;
        const contentHeight = this.unitY * 3.0 + this.keyHeight;
        const baseImgWidth = Math.ceil(contentWidth + this.margin * 2);
        const baseImgHeight = Math.ceil(contentHeight + this.margin * 2);
        
        // スケールを適用
        const imgWidth = Math.floor(baseImgWidth * scale);
        const imgHeight = Math.floor(baseImgHeight * scale);

        // Canvasを作成
        const canvas = createCanvas(imgWidth, imgHeight);
        const ctx = canvas.getContext('2d');
        
        // 低品質の場合は描画品質を下げる
        if (scale < 1.0) {
            ctx.imageSmoothingEnabled = false; // アンチエイリアシング無効化
        }
        
        // スケーリング変換を適用
        ctx.scale(scale, scale);

        // テーマ色を取得
        const colors = getThemeColors(options.theme);
        
        // 背景を塗りつぶし（スケール前のサイズで）
        ctx.fillStyle = options.backgroundColor || colors.background;
        ctx.fillRect(0, 0, baseImgWidth, baseImgHeight);

        // キー配置情報を取得
        const positions = Utils.getKeyPositions(this.keyWidth, this.keyHeight, this.keyGap, this.margin);

        // 指定されたレイヤーのキーを描画
        if (config.layout.length > layerIndex) {
            const layer = config.layout[layerIndex];

            for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
                for (let colIdx = 0; colIdx < positions[rowIdx].length; colIdx++) {
                    const pos = positions[rowIdx][colIdx];
                    if (!pos) continue;

                    const keycode = layer[rowIdx]?.[colIdx] || -1;
                    const label = Parser.keycodeToLabel(keycode, config);

                    // キーを描画（Combo情報付き）
                    const stringKeycode = String(keycode);
                    Renderer.drawKey(ctx, pos, label, stringKeycode, combos, options);
                    Renderer.drawText(ctx, pos, label, stringKeycode, combos, options);
                }
            }
        }

        // レイヤー番号を装飾付きで左下に表示（スケール前のサイズで）
        Renderer.drawLayerNumber(ctx, layerIndex, baseImgWidth, baseImgHeight, options);

        // 画像を保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`キーボード画像を生成しました: ${outputPath}`);
    }
}