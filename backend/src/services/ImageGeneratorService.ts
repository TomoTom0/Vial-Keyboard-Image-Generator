import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { generateAllLayers } from '../modules/generator';
import { combineImages } from '../modules/combiner';
import { GenerationOptions, GeneratedImage } from '../../../shared/types';
import { config } from '../config';

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
                    
                    // GeneratedImageオブジェクトを作成
                    const imageId = `${uuidv4()}-layer${layer}`;
                    const stats = fs.statSync(outputPath);
                    
                    // 画像をキャッシュディレクトリにコピー
                    const cachedPath = path.join(config.cacheDir, `${imageId}.png`);
                    fs.copyFileSync(outputPath, cachedPath);
                    
                    generatedImages.push({
                        id: imageId,
                        filename: `${path.basename(originalFilename, '.vil')}_layer${layer}.png`,
                        type: 'layer',
                        layer: layer,
                        format: 'png',
                        url: `/api/download/${imageId}`,
                        size: stats.size,
                        timestamp: new Date()
                    });
                    
                    console.log(`✅ Generated layer ${layer}: ${outputPath}`);
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
                    
                    const imageId = `${uuidv4()}-vertical`;
                    const stats = fs.statSync(verticalPath);
                    const cachedPath = path.join(config.cacheDir, `${imageId}.png`);
                    fs.copyFileSync(verticalPath, cachedPath);
                    
                    generatedImages.push({
                        id: imageId,
                        filename: `${path.basename(originalFilename, '.vil')}_combined_vertical.png`,
                        type: 'combined',
                        format: 'png',
                        url: `/api/download/${imageId}`,
                        size: stats.size,
                        timestamp: new Date()
                    });
                    
                    console.log(`✅ Generated vertical combined image: ${verticalPath}`);
                }

                if (options.format === 'horizontal') {
                    const horizontalPath = path.join(tempDir, `combined_horizontal_${options.theme}.png`);
                    const { ImageCombiner } = await import('../modules/combiner');
                    
                    await ImageCombiner.combineHorizontal(layerImages, horizontalPath, vialConfig, options.theme, filePath);
                    
                    const imageId = `${uuidv4()}-horizontal`;
                    const stats = fs.statSync(horizontalPath);
                    const cachedPath = path.join(config.cacheDir, `${imageId}.png`);
                    fs.copyFileSync(horizontalPath, cachedPath);
                    
                    generatedImages.push({
                        id: imageId,
                        filename: `${path.basename(originalFilename, '.vil')}_combined_horizontal.png`,
                        type: 'combined',
                        format: 'png',
                        url: `/api/download/${imageId}`,
                        size: stats.size,
                        timestamp: new Date()
                    });
                    
                    console.log(`✅ Generated horizontal combined image: ${horizontalPath}`);
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