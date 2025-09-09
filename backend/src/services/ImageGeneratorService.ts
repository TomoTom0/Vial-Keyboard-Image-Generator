import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Canvas, loadImage } from 'canvas';
import { generateAllLayers } from '../modules/generator';
import { combineImages } from '../modules/combiner';
import { GenerationOptions, GeneratedImage } from '../../../shared/types';
import { config } from '../config';
import { ImageProcessingService, ProcessedImageResult } from './ImageProcessingService';

export class ImageGeneratorService {
    /**
     * 画像を生成し、GeneratedImageの配列を返す
     */
    static async generateImages(
        filePath: string,
        originalFilename: string,
        options: GenerationOptions
    ): Promise<GeneratedImage[]> {
        const generatedImages: GeneratedImage[] = [];
        
        try {
            console.log('🎨 Starting image generation...');
            
            // 一時的な出力ディレクトリを作成
            const tempDir = path.join(config.cacheDir, uuidv4());
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const renderOptions = {
                theme: options.theme,
                backgroundColor: undefined,
                showComboInfo: options.showComboInfo || false,
                changeKeyColors: false,
                highlightComboKeys: false,
                highlightSubtextKeys: false,
                showComboMarkers: false,
                showTextColors: false
            };

            // 個別レイヤー画像の生成
            if (options.format === 'individual' || options.format === 'vertical' || options.format === 'horizontal') {
                console.log('📐 Generating individual layer images...');
                
                const layerStart = options.layerRange?.start || 0;
                const layerEnd = options.layerRange?.end || 3;

                // generateAllLayersに相当する処理を実行
                for (let layer = layerStart; layer <= layerEnd; layer++) {
                    const outputPath = path.join(tempDir, `keyboard_layout_layer${layer}_modular.png`);
                    
                    // 既存のgenerator.tsのVialKeyboardImageGeneratorを使用
                    const { VialKeyboardImageGenerator } = await import('../modules/generator');
                    const generator = new VialKeyboardImageGenerator();
                    
                    await generator.generateKeyboardImage(filePath, outputPath, layer, renderOptions);
                    
                    // 生成された画像をCanvasとして読み込み
                    const sourceImage = await loadImage(outputPath);
                    const { createCanvas } = await import('canvas');
                    const sourceCanvas = createCanvas(sourceImage.width, sourceImage.height);
                    const ctx = sourceCanvas.getContext('2d');
                    ctx.drawImage(sourceImage, 0, 0);
                    
                    // 画像処理サービスで最適化処理
                    const imageId = `${uuidv4()}-layer${layer}`;
                    const baseFilename = `${path.basename(originalFilename, '.vil')}_layer${layer}`;
                    
                    const processResult = await ImageProcessingService.processImage(
                        sourceCanvas,
                        baseFilename,
                        config.cacheDir,
                        options.imageOptions
                    );
                    
                    // GeneratedImageオブジェクトを作成
                    const generatedImage: GeneratedImage = {
                        id: imageId,
                        filename: path.basename(processResult.fullPath),
                        type: 'layer',
                        layer: layer,
                        format: options.imageOptions?.fullFormat || 'png',
                        url: `/api/download/${imageId}`,
                        size: processResult.fullSize,
                        timestamp: new Date()
                    };
                    
                    // プレビュー画像が生成されている場合
                    if (processResult.previewPath && processResult.previewSize) {
                        const previewId = `${imageId}_preview`;
                        generatedImage.previewUrl = `/api/download/${previewId}`;
                        generatedImage.previewSize = processResult.previewSize;
                        
                        // プレビュー画像をキャッシュディレクトリにコピー
                        const cachedPreviewPath = path.join(config.cacheDir, `${previewId}.jpeg`);
                        fs.copyFileSync(processResult.previewPath, cachedPreviewPath);
                    }
                    
                    // フル画像をキャッシュディレクトリにコピー
                    const cachedPath = path.join(config.cacheDir, `${imageId}.${generatedImage.format}`);
                    fs.copyFileSync(processResult.fullPath, cachedPath);
                    
                    generatedImages.push(generatedImage);
                    
                    console.log(`✅ Generated layer ${layer}: Full=${ImageProcessingService.formatFileSize(processResult.fullSize)}, Preview=${processResult.previewSize ? ImageProcessingService.formatFileSize(processResult.previewSize) : 'None'}`);
                }
            }

            // 結合画像の生成
            if (options.format === 'vertical' || options.format === 'horizontal') {
                console.log('🔗 Generating combined images...');
                
                const layerImages = [];
                for (let layer = (options.layerRange?.start || 0); layer <= (options.layerRange?.end || 3); layer++) {
                    layerImages.push(path.join(tempDir, `keyboard_layout_layer${layer}_modular.png`));
                }

                // VialConfig読み込み
                const { Utils } = await import('../modules/utils');
                const vialConfig = Utils.loadVialConfig(filePath);

                if (options.format === 'vertical') {
                    const verticalPath = path.join(tempDir, `combined_vertical_${options.theme}.png`);
                    const { ImageCombiner } = await import('../modules/combiner');
                    
                    await ImageCombiner.combineVertical(layerImages, verticalPath, vialConfig, options.theme, filePath);
                    
                    // 生成された結合画像をCanvasとして読み込み
                    const sourceImage = await loadImage(verticalPath);
                    const { createCanvas } = await import('canvas');
                    const sourceCanvas = createCanvas(sourceImage.width, sourceImage.height);
                    const ctx = sourceCanvas.getContext('2d');
                    ctx.drawImage(sourceImage, 0, 0);
                    
                    // 画像処理サービスで最適化処理
                    const imageId = `${uuidv4()}-vertical`;
                    const baseFilename = `${path.basename(originalFilename, '.vil')}_combined_vertical`;
                    
                    const processResult = await ImageProcessingService.processImage(
                        sourceCanvas,
                        baseFilename,
                        config.cacheDir,
                        options.imageOptions
                    );
                    
                    // GeneratedImageオブジェクトを作成
                    const generatedImage: GeneratedImage = {
                        id: imageId,
                        filename: path.basename(processResult.fullPath),
                        type: 'combined',
                        format: options.imageOptions?.fullFormat || 'png',
                        url: `/api/download/${imageId}`,
                        size: processResult.fullSize,
                        timestamp: new Date()
                    };
                    
                    // プレビュー画像が生成されている場合
                    if (processResult.previewPath && processResult.previewSize) {
                        const previewId = `${imageId}_preview`;
                        generatedImage.previewUrl = `/api/download/${previewId}`;
                        generatedImage.previewSize = processResult.previewSize;
                        
                        // プレビュー画像をキャッシュディレクトリにコピー
                        const cachedPreviewPath = path.join(config.cacheDir, `${previewId}.jpeg`);
                        fs.copyFileSync(processResult.previewPath, cachedPreviewPath);
                    }
                    
                    // フル画像をキャッシュディレクトリにコピー
                    const cachedPath = path.join(config.cacheDir, `${imageId}.${generatedImage.format}`);
                    fs.copyFileSync(processResult.fullPath, cachedPath);
                    
                    generatedImages.push(generatedImage);
                    
                    console.log(`✅ Generated vertical combined image: Full=${ImageProcessingService.formatFileSize(processResult.fullSize)}, Preview=${processResult.previewSize ? ImageProcessingService.formatFileSize(processResult.previewSize) : 'None'}`);
                }

                if (options.format === 'horizontal') {
                    const horizontalPath = path.join(tempDir, `combined_horizontal_${options.theme}.png`);
                    const { ImageCombiner } = await import('../modules/combiner');
                    
                    await ImageCombiner.combineHorizontal(layerImages, horizontalPath, vialConfig, options.theme, filePath);
                    
                    // 生成された結合画像をCanvasとして読み込み
                    const sourceImage = await loadImage(horizontalPath);
                    const { createCanvas } = await import('canvas');
                    const sourceCanvas = createCanvas(sourceImage.width, sourceImage.height);
                    const ctx = sourceCanvas.getContext('2d');
                    ctx.drawImage(sourceImage, 0, 0);
                    
                    // 画像処理サービスで最適化処理
                    const imageId = `${uuidv4()}-horizontal`;
                    const baseFilename = `${path.basename(originalFilename, '.vil')}_combined_horizontal`;
                    
                    const processResult = await ImageProcessingService.processImage(
                        sourceCanvas,
                        baseFilename,
                        config.cacheDir,
                        options.imageOptions
                    );
                    
                    // GeneratedImageオブジェクトを作成
                    const generatedImage: GeneratedImage = {
                        id: imageId,
                        filename: path.basename(processResult.fullPath),
                        type: 'combined',
                        format: options.imageOptions?.fullFormat || 'png',
                        url: `/api/download/${imageId}`,
                        size: processResult.fullSize,
                        timestamp: new Date()
                    };
                    
                    // プレビュー画像が生成されている場合
                    if (processResult.previewPath && processResult.previewSize) {
                        const previewId = `${imageId}_preview`;
                        generatedImage.previewUrl = `/api/download/${previewId}`;
                        generatedImage.previewSize = processResult.previewSize;
                        
                        // プレビュー画像をキャッシュディレクトリにコピー
                        const cachedPreviewPath = path.join(config.cacheDir, `${previewId}.jpeg`);
                        fs.copyFileSync(processResult.previewPath, cachedPreviewPath);
                    }
                    
                    // フル画像をキャッシュディレクトリにコピー
                    const cachedPath = path.join(config.cacheDir, `${imageId}.${generatedImage.format}`);
                    fs.copyFileSync(processResult.fullPath, cachedPath);
                    
                    generatedImages.push(generatedImage);
                    
                    console.log(`✅ Generated horizontal combined image: Full=${ImageProcessingService.formatFileSize(processResult.fullSize)}, Preview=${processResult.previewSize ? ImageProcessingService.formatFileSize(processResult.previewSize) : 'None'}`);
                }
            }

            // 一時ディレクトリをクリーンアップ
            this.cleanupDirectory(tempDir);
            
            console.log(`✨ Generation completed: ${generatedImages.length} images`);
            return generatedImages;

        } catch (error) {
            console.error('❌ Image generation failed:', error);
            throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * ディレクトリを再帰的に削除
     */
    private static cleanupDirectory(dirPath: string): void {
        try {
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`🧹 Cleaned up temporary directory: ${dirPath}`);
            }
        } catch (error) {
            console.warn(`⚠️  Failed to cleanup directory ${dirPath}:`, error);
        }
    }
}