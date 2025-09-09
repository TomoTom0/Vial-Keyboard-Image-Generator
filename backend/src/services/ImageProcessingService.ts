import { Canvas, createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { ImageOutputOptions } from '../../../shared/types';

export interface ProcessedImageResult {
    fullPath: string;
    fullSize: number;
    previewPath?: string;
    previewSize?: number;
}

export class ImageProcessingService {
    /**
     * 画像を処理してフル版・プレビュー版を生成
     */
    static async processImage(
        sourceCanvas: Canvas,
        baseFilename: string,
        outputDir: string,
        options: ImageOutputOptions = {}
    ): Promise<ProcessedImageResult> {
        const {
            generatePreview = true,
            previewMaxWidth = 400,
            previewQuality = 0.7,
            fullQuality = 1.0,
            fullFormat = 'png',
            compressionLevel = 6
        } = options;

        const result: ProcessedImageResult = {
            fullPath: '',
            fullSize: 0
        };

        // フル版画像を保存
        const fullPath = path.join(outputDir, `${baseFilename}.${fullFormat}`);
        const fullBuffer = this.canvasToBuffer(sourceCanvas, fullFormat, fullQuality, compressionLevel);
        fs.writeFileSync(fullPath, fullBuffer);
        
        result.fullPath = fullPath;
        result.fullSize = fullBuffer.length;

        // プレビュー版生成
        if (generatePreview) {
            const previewCanvas = this.resizeCanvas(sourceCanvas, previewMaxWidth);
            const previewPath = path.join(outputDir, `${baseFilename}_preview.jpeg`);
            const previewBuffer = this.canvasToBuffer(previewCanvas, 'jpeg', previewQuality);
            fs.writeFileSync(previewPath, previewBuffer);
            
            result.previewPath = previewPath;
            result.previewSize = previewBuffer.length;

            console.log(`📸 Generated preview: ${this.formatFileSize(result.previewSize)} (${Math.round((1 - result.previewSize / result.fullSize) * 100)}% smaller)`);
        }

        console.log(`💾 Processed image: Full=${this.formatFileSize(result.fullSize)}, Preview=${result.previewSize ? this.formatFileSize(result.previewSize) : 'None'}`);

        return result;
    }

    /**
     * Canvasをリサイズ
     */
    static resizeCanvas(sourceCanvas: Canvas, maxWidth: number): Canvas {
        const sourceWidth = sourceCanvas.width;
        const sourceHeight = sourceCanvas.height;

        // アスペクト比を保持してリサイズサイズを計算
        let targetWidth = sourceWidth;
        let targetHeight = sourceHeight;

        if (sourceWidth > maxWidth) {
            const ratio = maxWidth / sourceWidth;
            targetWidth = maxWidth;
            targetHeight = Math.round(sourceHeight * ratio);
        }

        // リサイズが不要な場合は元のCanvasを返す
        if (targetWidth === sourceWidth && targetHeight === sourceHeight) {
            return sourceCanvas;
        }

        // 新しいCanvasを作成
        const targetCanvas = createCanvas(targetWidth, targetHeight);
        const ctx = targetCanvas.getContext('2d');

        // 高品質なリサイズ設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // リサイズ描画
        ctx.drawImage(sourceCanvas as any, 0, 0, targetWidth, targetHeight);

        return targetCanvas;
    }

    /**
     * CanvasをBufferに変換（フォーマット・品質指定）
     */
    static canvasToBuffer(
        canvas: Canvas, 
        format: 'png' | 'jpeg', 
        quality: number = 1.0,
        compressionLevel: number = 6
    ): Buffer {
        if (format === 'jpeg') {
            // JPEG: 品質指定
            return canvas.toBuffer('image/jpeg', { quality });
        } else {
            // PNG: 圧縮レベル指定
            return canvas.toBuffer('image/png', { compressionLevel });
        }
    }

    /**
     * 品質・サイズの最適化されたデフォルト設定を取得
     */
    static getOptimizedOptions(imageType: 'preview' | 'full'): ImageOutputOptions {
        const baseOptions: ImageOutputOptions = {
            generatePreview: true,
            compressionLevel: 6
        };

        if (imageType === 'preview') {
            return {
                ...baseOptions,
                previewMaxWidth: 400,
                previewQuality: 0.7,
                fullQuality: 1.0,
                fullFormat: 'png'
            };
        } else {
            return {
                ...baseOptions,
                previewMaxWidth: 600,
                previewQuality: 0.8,
                fullQuality: 1.0,
                fullFormat: 'png'
            };
        }
    }

    /**
     * 複数サイズバリエーション生成
     */
    static async generateMultipleSizes(
        sourceCanvas: Canvas,
        baseFilename: string,
        outputDir: string
    ): Promise<{ [key: string]: ProcessedImageResult }> {
        const sizes = {
            thumbnail: { maxWidth: 200, quality: 0.6 },
            preview: { maxWidth: 400, quality: 0.7 },
            medium: { maxWidth: 800, quality: 0.8 },
            full: { maxWidth: sourceCanvas.width, quality: 1.0 }
        };

        const results: { [key: string]: ProcessedImageResult } = {};

        for (const [sizeName, sizeOptions] of Object.entries(sizes)) {
            const options: ImageOutputOptions = {
                generatePreview: false, // 各サイズで個別生成
                previewMaxWidth: sizeOptions.maxWidth,
                previewQuality: sizeOptions.quality,
                fullFormat: sizeOptions.maxWidth < sourceCanvas.width ? 'jpeg' : 'png'
            };

            // リサイズされたCanvas
            const resizedCanvas = this.resizeCanvas(sourceCanvas, sizeOptions.maxWidth);
            
            // ファイル名にサイズを含める
            const filename = sizeName === 'full' ? baseFilename : `${baseFilename}_${sizeName}`;
            
            const result = await this.processImage(resizedCanvas, filename, outputDir, options);
            results[sizeName] = result;
        }

        return results;
    }

    /**
     * ファイルサイズをフォーマット
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * 画像品質とファイルサイズの関係をテスト
     */
    static async testQualityVsSize(
        sourceCanvas: Canvas,
        outputDir: string
    ): Promise<void> {
        const qualities = [0.3, 0.5, 0.7, 0.8, 0.9, 1.0];
        
        console.log('📊 Quality vs Size Test:');
        
        for (const quality of qualities) {
            const buffer = this.canvasToBuffer(sourceCanvas, 'jpeg', quality);
            const sizeKB = Math.round(buffer.length / 1024);
            console.log(`   Quality ${quality}: ${sizeKB}KB`);
        }
    }
}