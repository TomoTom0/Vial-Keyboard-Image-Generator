// 画像結合モジュール
import * as fs from 'fs';
import { createCanvas, loadImage, Canvas, Image } from 'canvas';

export class ImageCombiner {
    // 4枚の画像を縦に並べて結合
    static async combineVertical(imagePaths: string[], outputPath: string): Promise<void> {
        console.log('縦並び画像結合を開始します');
        
        // 画像を読み込み
        const images: Image[] = [];
        for (const imagePath of imagePaths) {
            const image = await loadImage(imagePath);
            images.push(image);
            console.log(`読み込み完了: ${imagePath} (${image.width}x${image.height})`);
        }

        // 全画像の幅の最大値と高さの合計を計算
        const maxWidth = Math.max(...images.map(img => img.width));
        const totalHeight = images.reduce((sum, img) => sum + img.height, 0);
        
        console.log(`結合画像サイズ: ${maxWidth}x${totalHeight}`);

        // 結合用キャンバスを作成
        const canvas = createCanvas(maxWidth, totalHeight);
        const ctx = canvas.getContext('2d');

        // 背景を黒で塗りつぶし
        ctx.fillStyle = '#1c1c20';
        ctx.fillRect(0, 0, maxWidth, totalHeight);

        // 各画像を縦に配置
        let currentY = 0;
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            // 画像を中央に配置
            const x = (maxWidth - image.width) / 2;
            ctx.drawImage(image, x, currentY);
            console.log(`レイヤー${i}を配置: (${x}, ${currentY})`);
            currentY += image.height;
        }

        // 画像を保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`縦並び結合画像を生成しました: ${outputPath}`);
    }

    // 4枚の画像を横長に並べて結合（0,1を縦に並べて左側、2,3を縦に並べて右側）
    static async combineHorizontal(imagePaths: string[], outputPath: string): Promise<void> {
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
        
        // 横長配置のサイズを計算（横に2つ、縦に2つ）
        const gridWidth = imageWidth * 2;
        const gridHeight = imageHeight * 2;
        
        console.log(`結合画像サイズ: ${gridWidth}x${gridHeight}`);

        // 結合用キャンバスを作成
        const canvas = createCanvas(gridWidth, gridHeight);
        const ctx = canvas.getContext('2d');

        // 背景を黒で塗りつぶし
        ctx.fillStyle = '#1c1c20';
        ctx.fillRect(0, 0, gridWidth, gridHeight);

        // 横長配置で各画像を配置（0,1を左側縦並び、2,3を右側縦並び）
        const positions = [
            { x: 0, y: 0 },                    // 左上: レイヤー0
            { x: 0, y: imageHeight },          // 左下: レイヤー1
            { x: imageWidth, y: 0 },           // 右上: レイヤー2
            { x: imageWidth, y: imageHeight }  // 右下: レイヤー3
        ];

        for (let i = 0; i < Math.min(images.length, 4); i++) {
            const image = images[i];
            const pos = positions[i];
            ctx.drawImage(image, pos.x, pos.y);
            console.log(`レイヤー${i}を配置: (${pos.x}, ${pos.y})`);
        }

        // 画像を保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`横長結合画像を生成しました: ${outputPath}`);
    }
}