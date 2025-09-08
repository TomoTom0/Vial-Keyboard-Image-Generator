// 画像結合モジュール
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, loadImage, Canvas, Image } from 'canvas';
import { ComboRenderer } from './combo_renderer';
import { Parser } from './parser';
import { VialConfig, COLORS, getThemeColors } from './types';

export class ImageCombiner {
    // 見出しを描画する
    private static drawHeader(ctx: any, text: string, x: number, y: number, width: number, theme: 'dark' | 'light' = 'dark', label?: string): number {
        const headerHeight = 30;
        const colors = getThemeColors(theme);
        
        // 背景色を描画（水平線より上側のみ）
        ctx.fillStyle = colors.headerBackground;
        ctx.fillRect(x, y, width, 22);
        
        // ヘッダーテキストを描画
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.fillStyle = colors.headerText;
        ctx.textAlign = 'left';
        ctx.fillText(text, x + 15, y + 16);
        
        // ラベル（ファイル名など）を右側に描画
        if (label) {
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = colors.textSub;
            ctx.textAlign = 'right';
            ctx.fillText(label, x + width - 15, y + 16);
        }
        
        // 区切り線を描画
        ctx.strokeStyle = colors.headerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 22);
        ctx.lineTo(x + width - 15, y + 22);
        ctx.stroke();
        
        return headerHeight;
    }
    // 4枚の画像を縦に並べて結合（Combo情報付き）
    static async combineVertical(imagePaths: string[], outputPath: string, vialConfig?: VialConfig, theme: 'dark' | 'light' = 'dark', configPath?: string): Promise<void> {
        console.log('縦並び画像結合を開始します');
        
        // 画像を読み込み
        const images: Image[] = [];
        for (const imagePath of imagePaths) {
            const image = await loadImage(imagePath);
            images.push(image);
            console.log(`読み込み完了: ${imagePath} (${image.width}x${image.height})`);
        }

        // Combo情報を準備
        let comboCanvas: Canvas | null = null;
        let comboHeight = 0;
        
        if (vialConfig) {
            const combos = Parser.parseComboInfo(vialConfig);
            if (combos.length > 0) {
                const comboResult = ComboRenderer.drawCombos(combos, Math.max(...images.map(img => img.width)), false, theme); // 縦長レイアウト
                comboCanvas = comboResult.canvas;
                comboHeight = comboResult.height;
                console.log(`Combo情報を追加: ${combos.length}個 (高さ: ${comboHeight}px)`);
            }
        }

        // 全画像の幅の最大値と高さの合計を計算（Combo分と見出し分も含める）
        const maxWidth = Math.max(...images.map(img => img.width));
        const layoutHeaderHeight = comboHeight > 0 ? 30 : 0; // Comboがある場合のみレイアウト見出しを追加
        const totalHeight = images.reduce((sum, img) => sum + img.height, 0) + comboHeight + layoutHeaderHeight;
        
        console.log(`結合画像サイズ: ${maxWidth}x${totalHeight} (Combo: ${comboHeight}px, 見出し: ${layoutHeaderHeight}px含む)`);

        // 結合用キャンバスを作成
        const canvas = createCanvas(maxWidth, totalHeight);
        const ctx = canvas.getContext('2d');

        // テーマ色を取得して背景を塗りつぶし
        const colors = getThemeColors(theme);
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, maxWidth, totalHeight);

        let currentY = 0;

        // レイアウト見出しを最上部に追加
        if (comboCanvas) {
            // 設定ファイルパスからファイル名を抽出
            const label = configPath ? path.basename(configPath) : undefined;
            const headerHeight = ImageCombiner.drawHeader(ctx, 'LAYOUTS', 0, currentY, maxWidth, theme, label);
            console.log(`レイアウト見出しを配置: (0, ${currentY})`);
            currentY += headerHeight;
        }

        // 各画像を縦に配置
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            // 画像を中央に配置
            const x = (maxWidth - image.width) / 2;
            ctx.drawImage(image, x, currentY);
            console.log(`レイヤー${i}を配置: (${x}, ${currentY})`);
            currentY += image.height;
        }

        // Combo情報を最下部に配置
        if (comboCanvas) {
            const comboX = (maxWidth - comboCanvas.width) / 2;
            ctx.drawImage(comboCanvas, comboX, currentY);
            console.log(`Combo情報を配置: (${comboX}, ${currentY})`);
        }

        // 画像を保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`縦並び結合画像を生成しました: ${outputPath}`);
    }

    // 4枚の画像を横長に並べて結合（0,1を縦に並べて左側、2,3を縦に並べて右側、Combo情報付き）
    static async combineHorizontal(imagePaths: string[], outputPath: string, vialConfig?: VialConfig, theme: 'dark' | 'light' = 'dark', configPath?: string): Promise<void> {
        console.log('横長画像結合を開始します');
        
        // 画像を読み込み
        const images: Image[] = [];
        for (const imagePath of imagePaths) {
            const image = await loadImage(imagePath);
            images.push(image);
            console.log(`読み込み完了: ${imagePath} (${image.width}x${image.height})`);
        }

        // 各画像のサイズを取得（全て同じと仮定）
        const imageWidth = images[0].width;
        const imageHeight = images[0].height;
        
        // Combo情報を準備（横長レイアウト）
        let comboCanvas: Canvas | null = null;
        let comboHeight = 0;
        
        if (vialConfig) {
            const combos = Parser.parseComboInfo(vialConfig);
            if (combos.length > 0) {
                const comboResult = ComboRenderer.drawCombos(combos, imageWidth * 2, true, theme); // 横長レイアウト
                comboCanvas = comboResult.canvas;
                comboHeight = comboResult.height;
                console.log(`Combo情報を追加: ${combos.length}個 (高さ: ${comboHeight}px)`);
            }
        }
        
        // 横長配置のサイズを計算（横に2つ、縦に2つ、Combo分と見出し分も含める）
        const gridWidth = imageWidth * 2;
        const layoutHeaderHeight = comboHeight > 0 ? 30 : 0; // Comboがある場合のみレイアウト見出しを追加
        const gridHeight = imageHeight * 2 + comboHeight + layoutHeaderHeight;
        
        console.log(`結合画像サイズ: ${gridWidth}x${gridHeight} (Combo: ${comboHeight}px, 見出し: ${layoutHeaderHeight}px含む)`);

        // 結合用キャンバスを作成
        const canvas = createCanvas(gridWidth, gridHeight);
        const ctx = canvas.getContext('2d');

        // テーマ色を取得して背景を塗りつぶし
        const colors = getThemeColors(theme);
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, gridWidth, gridHeight);

        let startY = 0;

        // レイアウト見出しを最上部に追加
        if (comboCanvas) {
            // 設定ファイルパスからファイル名を抽出
            const label = configPath ? path.basename(configPath) : undefined;
            const headerHeight = ImageCombiner.drawHeader(ctx, 'LAYOUTS', 0, startY, gridWidth, theme, label);
            console.log(`レイアウト見出しを配置: (0, ${startY})`);
            startY += headerHeight;
        }

        // 横長配置で各画像を配置（0,1を左側縦並び、2,3を右側縦並び）
        const positions = [
            { x: 0, y: startY },                    // 左上: レイヤー0
            { x: 0, y: startY + imageHeight },      // 左下: レイヤー1
            { x: imageWidth, y: startY },           // 右上: レイヤー2
            { x: imageWidth, y: startY + imageHeight }  // 右下: レイヤー3
        ];

        for (let i = 0; i < Math.min(images.length, 4); i++) {
            const image = images[i];
            const pos = positions[i];
            ctx.drawImage(image, pos.x, pos.y);
            console.log(`レイヤー${i}を配置: (${pos.x}, ${pos.y})`);
        }

        // Combo情報を最下部に配置
        if (comboCanvas) {
            const comboX = (gridWidth - comboCanvas.width) / 2;
            const comboY = startY + imageHeight * 2; // 画像2行の下
            ctx.drawImage(comboCanvas, comboX, comboY);
            console.log(`Combo情報を配置: (${comboX}, ${comboY})`);
        }

        // 画像を保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`横長結合画像を生成しました: ${outputPath}`);
    }
}