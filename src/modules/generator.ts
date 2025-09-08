// 統合・生成モジュール（メイン処理）
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';
import { VialConfig, COLORS } from './types';
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

    // 座標とメイン文字の対応をファイルに出力
    private outputCoordinateMapping(config: VialConfig, layerIndex: number): void {
        const outputFile = path.join(__dirname, `../../output/layer${layerIndex}_coordinates.txt`);
        const positions = Utils.getKeyPositions(this.keyWidth, this.keyHeight, this.keyGap, this.margin);
        
        if (config.layout.length <= layerIndex) return;
        const layer = config.layout[layerIndex];
        
        let output = `レイヤー${layerIndex}の座標とメイン文字の対応:\n\n`;
        
        // 左ブロック
        output += "=== 左ブロック ===\n";
        for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
            const row = positions[rowIdx];
            if (!row) continue;
            
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const pos = row[colIdx];
                if (!pos || pos.x > 400) continue; // 左側のみ
                
                const keycode = layer[rowIdx]?.[colIdx] || -1;
                const label = Parser.keycodeToLabel(keycode, config);
                if (label.mainText) {
                    output += `左(${colIdx + 1},${rowIdx + 1}): ${label.mainText}\n`;
                }
            }
        }
        
        output += "\n=== 右ブロック ===\n";
        for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
            const row = positions[rowIdx];
            if (!row) continue;
            
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const pos = row[colIdx];
                if (!pos || pos.x <= 400) continue; // 右側のみ
                
                const keycode = layer[rowIdx]?.[colIdx] || -1;
                const label = Parser.keycodeToLabel(keycode, config);
                if (label.mainText) {
                    output += `右(${colIdx + 1},${rowIdx + 1}): ${label.mainText}\n`;
                }
            }
        }
        
        fs.writeFileSync(outputFile, output, 'utf8');
        console.log(`座標マッピングを出力しました: ${outputFile}`);
    }

    // キーボード画像を生成
    public generateKeyboardImage(configPath: string, outputPath: string, layerIndex: number = 0): void {
        console.log('Vial Keyboard Image Generator (TypeScript)');
        
        // Vial設定を読み込み
        const config = Utils.loadVialConfig(configPath);
        console.log(`読み込み成功: version=${config.version}, uid=${config.uid}`);
        console.log(`レイヤー数: ${config.layout.length}`);
        console.log(`生成対象レイヤー: ${layerIndex}`);

        // 画像サイズを計算
        const contentWidth = this.unitX * 14.0 + 30.0 + this.keyWidth;
        const contentHeight = this.unitY * 3.0 + this.keyHeight;
        const imgWidth = Math.ceil(contentWidth + this.margin * 2);
        const imgHeight = Math.ceil(contentHeight + this.margin * 2);

        // Canvasを作成
        const canvas = createCanvas(imgWidth, imgHeight);
        const ctx = canvas.getContext('2d');

        // 背景を塗りつぶし
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, imgWidth, imgHeight);

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

                    // キーを描画
                    Renderer.drawKey(ctx, pos, label);
                    Renderer.drawText(ctx, pos, label);
                }
            }
        }

        // レイヤー番号を装飾付きで左下に表示
        Renderer.drawLayerNumber(ctx, layerIndex, canvas.width, canvas.height);

        // 画像を保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        // 座標とメイン文字の対応をファイルに出力
        this.outputCoordinateMapping(config, layerIndex);
        
        console.log(`キーボード画像を生成しました: ${outputPath}`);
    }
}