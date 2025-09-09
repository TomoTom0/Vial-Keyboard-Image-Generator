// 画像結合モジュール
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, loadImage, Canvas, Image } from 'canvas';
import { ComboRenderer } from './combo_renderer';
import { Parser } from './parser';
import { Utils } from './utils';
import { VialConfig, COLORS, getThemeColors } from './types';

export class ImageCombiner {
    // レイアウト見出し画像を生成する
    static async generateHeaderImage(width: number, theme: 'dark' | 'light' = 'dark', label?: string, scale: number = 1): Promise<Buffer> {
        const scaledWidth = Math.floor(width * scale);
        const scaledHeight = Math.floor(45 * scale);  // ヘッダー画像の高さも拡大
        
        const canvas = createCanvas(scaledWidth, scaledHeight);
        const ctx = canvas.getContext('2d');
        
        this.drawHeader(ctx, 'LAYOUTS', 0, 0, scaledWidth, theme, label, scale);
        
        return canvas.toBuffer('image/png');
    }

    // 生成済みコンポーネント画像を使用して縦結合
    static async combineVerticalFromComponents(
        layerPaths: string[], 
        headerPath: string, 
        comboNormalPath: string, 
        outputPath: string, 
        theme: 'dark' | 'light' = 'dark'
    ): Promise<void> {
        console.log('コンポーネント画像から縦並び結合を開始します');
        
        // 全画像を読み込み
        const layerImages: Image[] = [];
        for (const path of layerPaths) {
            const image = await loadImage(path);
            layerImages.push(image);
            console.log(`読み込み完了: ${path} (${image.width}x${image.height})`);
        }
        
        const headerImage = await loadImage(headerPath);
        const comboImage = await loadImage(comboNormalPath);
        console.log(`見出し読み込み完了: ${headerPath} (${headerImage.width}x${headerImage.height})`);
        console.log(`コンボ読み込み完了: ${comboNormalPath} (${comboImage.width}x${comboImage.height})`);
        
        // サイズ計算
        const maxWidth = Math.max(...layerImages.map(img => img.width), headerImage.width, comboImage.width);
        const totalHeight = headerImage.height + layerImages.reduce((sum, img) => sum + img.height, 0) + comboImage.height;
        
        // Canvas作成
        const canvas = createCanvas(maxWidth, totalHeight);
        const ctx = canvas.getContext('2d');
        
        // 背景塗りつぶし
        const colors = getThemeColors(theme);
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, maxWidth, totalHeight);
        
        let currentY = 0;
        
        // 見出し配置
        const headerX = (maxWidth - headerImage.width) / 2;
        ctx.drawImage(headerImage, headerX, currentY);
        console.log(`見出しを配置: (${headerX}, ${currentY})`);
        currentY += headerImage.height;
        
        // レイヤー画像配置
        for (let i = 0; i < layerImages.length; i++) {
            const image = layerImages[i];
            const x = (maxWidth - image.width) / 2;
            ctx.drawImage(image, x, currentY);
            console.log(`レイヤー${i}を配置: (${x}, ${currentY})`);
            currentY += image.height;
        }
        
        // コンボ情報配置
        const comboX = (maxWidth - comboImage.width) / 2;
        ctx.drawImage(comboImage, comboX, currentY);
        console.log(`コンボ情報を配置: (${comboX}, ${currentY})`);
        
        // 画像保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`縦並び結合画像を生成しました: ${outputPath}`);
    }

    // 生成済みコンポーネント画像を使用して横結合
    static async combineHorizontalFromComponents(
        layerPaths: string[], 
        headerPath: string, 
        comboWidePath: string, 
        outputPath: string, 
        theme: 'dark' | 'light' = 'dark'
    ): Promise<void> {
        console.log('コンポーネント画像から横並び結合を開始します');
        
        // 全画像を読み込み
        const layerImages: Image[] = [];
        for (const path of layerPaths) {
            const image = await loadImage(path);
            layerImages.push(image);
            console.log(`読み込み完了: ${path} (${image.width}x${image.height})`);
        }
        
        const headerImage = await loadImage(headerPath);
        const comboImage = await loadImage(comboWidePath);
        console.log(`見出し読み込み完了: ${headerPath} (${headerImage.width}x${headerImage.height})`);
        console.log(`コンボ読み込み完了: ${comboWidePath} (${comboImage.width}x${comboImage.height})`);
        
        // サイズ計算（2x2グリッド + 見出し + コンボ）
        const imageWidth = layerImages[0].width;
        const imageHeight = layerImages[0].height;
        const gridWidth = imageWidth * 2;
        const gridHeight = imageHeight * 2 + headerImage.height + comboImage.height;
        
        // Canvas作成
        const canvas = createCanvas(gridWidth, gridHeight);
        const ctx = canvas.getContext('2d');
        
        // 背景塗りつぶし
        const colors = getThemeColors(theme);
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, gridWidth, gridHeight);
        
        let currentY = 0;
        
        // 見出し配置
        const headerX = (gridWidth - headerImage.width) / 2;
        ctx.drawImage(headerImage, headerX, currentY);
        console.log(`見出しを配置: (${headerX}, ${currentY})`);
        currentY += headerImage.height;
        
        // レイヤー画像を2x2グリッドで配置
        for (let i = 0; i < Math.min(4, layerImages.length); i++) {
            const image = layerImages[i];
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = col * imageWidth;
            const y = currentY + row * imageHeight;
            ctx.drawImage(image, x, y);
            console.log(`レイヤー${i}を配置: (${x}, ${y})`);
        }
        currentY += imageHeight * 2;
        
        // コンボ情報配置
        const comboX = (gridWidth - comboImage.width) / 2;
        ctx.drawImage(comboImage, comboX, currentY);
        console.log(`コンボ情報を配置: (${comboX}, ${currentY})`);
        
        // 画像保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`横並び結合画像を生成しました: ${outputPath}`);
    }

    // 見出しを描画する
    private static drawHeader(ctx: any, text: string, x: number, y: number, width: number, theme: 'dark' | 'light' = 'dark', label?: string, scale: number = 1): number {
        const headerHeight = Math.floor(45 * scale);  // 高さを拡大
        const colors = getThemeColors(theme);
        
        // 背景色を描画（水平線より上側のみ）
        ctx.fillStyle = colors.headerBackground;
        ctx.fillRect(x, y, width, Math.floor(37 * scale));  // 背景高さを拡大
        
        // ヘッダーテキストを描画（フォントサイズを2倍に拡大）
        ctx.font = `bold ${Math.floor(32 * scale)}px Arial, sans-serif`;
        ctx.fillStyle = colors.headerText;
        ctx.textAlign = 'left';
        ctx.fillText(text, x + Math.floor(15 * scale), y + Math.floor(28 * scale));
        
        // ラベル（ファイル名など）を右側に描画（フォントサイズを2倍に拡大）
        if (label) {
            ctx.font = `${Math.floor(28 * scale)}px Arial, sans-serif`;
            ctx.fillStyle = colors.textSub;
            ctx.textAlign = 'right';
            ctx.fillText(label, x + width - Math.floor(15 * scale), y + Math.floor(28 * scale));
        }
        
        // 区切り線を描画（位置を拡大されたヘッダーに合わせて調整）
        ctx.strokeStyle = colors.headerBorder;
        ctx.lineWidth = Math.floor(1 * scale);
        ctx.beginPath();
        ctx.moveTo(x + Math.floor(15 * scale), y + Math.floor(37 * scale));
        ctx.lineTo(x + width - Math.floor(15 * scale), y + Math.floor(37 * scale));
        ctx.stroke();
        
        return headerHeight;
    }
}