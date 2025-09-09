import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

import { config } from '../config';
import { ImageGeneratorService } from '../services/ImageGeneratorService';
import { ImageProcessingService } from '../services/ImageProcessingService';
import { GenerationOptions } from '../../../shared/types';

const router = express.Router();

// Multer設定（プレビュー用 - より軽量）
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `preview-${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: config.maxFileSize,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (config.allowedFileTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Only ${config.allowedFileTypes.join(', ')} files are allowed`));
        }
    }
});

/**
 * プレビュー画像生成エンドポイント
 * より軽量・高速な処理でプレビュー画像を生成
 */
router.post('/generate', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const options: GenerationOptions = {
            theme: req.body.theme || 'dark',
            format: req.body.format || 'individual',
            layerRange: req.body.layerRange ? JSON.parse(req.body.layerRange) : { start: 0, end: 3 },
            showComboInfo: req.body.showComboInfo === 'true',
            fileLabel: req.body.fileLabel || req.file.originalname,
            imageOptions: {
                generatePreview: true,
                previewMaxWidth: 200, // Small preview for fast generation
                previewQuality: 0.5,   // Lower quality for speed
                fullQuality: 0.8,      // Medium quality for preview
                fullFormat: 'jpeg',    // JPEG for smaller size
                compressionLevel: 8    // Higher compression
            }
        };

        console.log('🔍 Starting preview generation...');
        console.log('📁 File:', req.file.originalname);
        console.log('⚙️  Options:', options);

        // プレビュー用の軽量画像生成
        const previewImages = await generatePreviewImages(
            req.file.path,
            req.file.originalname,
            options
        );

        // アップロードされたファイルを削除（プレビューなので一時的）
        fs.unlinkSync(req.file.path);

        console.log(`✅ Preview generation completed: ${previewImages.length} images`);

        res.json({
            success: true,
            images: previewImages,
            preview: true
        });

    } catch (error) {
        console.error('❌ Preview generation error:', error);
        
        // エラー時もアップロードファイルを削除
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Preview generation failed'
        });
    }
});

/**
 * サンプルファイルのプレビュー生成
 */
router.get('/sample/:theme/:format', async (req, res) => {
    try {
        const { theme, format } = req.params;
        
        // サンプルファイルのパス
        const sampleFilePath = path.join(process.cwd(), 'data', 'sample.vil');
        
        if (!fs.existsSync(sampleFilePath)) {
            return res.status(404).json({ error: 'Sample file not found' });
        }

        const options: GenerationOptions = {
            theme: theme as 'light' | 'dark',
            format: format as any,
            layerRange: { start: 0, end: 3 },
            showComboInfo: true,
            fileLabel: 'Sample',
            imageOptions: {
                generatePreview: true,
                previewMaxWidth: 200,
                previewQuality: 0.6,
                fullQuality: 0.8,
                fullFormat: 'jpeg',
                compressionLevel: 8
            }
        };

        console.log('🔍 Generating sample preview...');

        const previewImages = await generatePreviewImages(
            sampleFilePath,
            'sample.vil',
            options
        );

        res.json({
            success: true,
            images: previewImages,
            preview: true,
            sample: true
        });

    } catch (error) {
        console.error('❌ Sample preview error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Sample preview failed'
        });
    }
});

/**
 * プレビュー画像生成の軽量版実装
 */
async function generatePreviewImages(
    filePath: string,
    originalFilename: string,
    options: GenerationOptions
): Promise<any[]> {
    const previewImages: any[] = [];
    
    // 一時的な出力ディレクトリを作成
    const tempDir = path.join(config.cacheDir, 'preview', uuidv4());
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
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

        // 選択されたレイヤーのみ生成
        const layerStart = options.layerRange?.start || 0;
        const layerEnd = options.layerRange?.end || 3;

        console.log(`📐 Generating preview for layers ${layerStart}-${layerEnd}...`);

        for (let layer = layerStart; layer <= layerEnd; layer++) {
            const outputPath = path.join(tempDir, `preview_layer${layer}.png`);
            
            // 既存のgenerator.tsのVialKeyboardImageGeneratorを使用
            const { VialKeyboardImageGenerator } = await import('../modules/generator');
            const generator = new VialKeyboardImageGenerator();
            
            await generator.generateKeyboardImage(filePath, outputPath, layer, renderOptions);
            
            // 生成された画像をCanvasとして読み込み
            const { loadImage, createCanvas } = await import('canvas');
            const sourceImage = await loadImage(outputPath);
            const sourceCanvas = createCanvas(sourceImage.width, sourceImage.height);
            const ctx = sourceCanvas.getContext('2d');
            ctx.drawImage(sourceImage, 0, 0);
            
            // プレビュー用の軽量処理
            const imageId = `preview-${uuidv4()}-layer${layer}`;
            const baseFilename = `preview_layer${layer}`;
            
            const processResult = await ImageProcessingService.processImage(
                sourceCanvas,
                baseFilename,
                tempDir,
                options.imageOptions
            );
            
            // プレビュー画像情報を作成
            const previewImage = {
                id: imageId,
                layer: layer,
                type: 'layer',
                url: `/api/preview/download/${imageId}`,
                size: processResult.previewSize || processResult.fullSize,
                timestamp: new Date(),
                temporary: true
            };
            
            // プレビュー画像をキャッシュディレクトリにコピー
            const cachedPath = path.join(config.cacheDir, `${imageId}.jpeg`);
            const sourcePath = processResult.previewPath || processResult.fullPath;
            fs.copyFileSync(sourcePath, cachedPath);
            
            previewImages.push(previewImage);
            
            console.log(`✅ Generated preview layer ${layer}: ${ImageProcessingService.formatFileSize(previewImage.size)}`);
        }

        return previewImages;

    } finally {
        // 一時ディレクトリをクリーンアップ
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}

/**
 * プレビュー画像ダウンロードエンドポイント
 */
router.get('/download/:imageId', async (req, res) => {
    try {
        const { imageId } = req.params;
        
        // プレビュー画像のパスを確認
        const imagePath = path.join(config.cacheDir, `${imageId}.jpeg`);
        
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Preview image not found' });
        }

        const stats = fs.statSync(imagePath);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ

        const fileStream = fs.createReadStream(imagePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('❌ Preview download error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Preview download failed'
        });
    }
});

/**
 * プレビューキャッシュクリーンアップ
 */
router.delete('/cache/cleanup', async (req, res) => {
    try {
        const previewCacheDir = path.join(config.cacheDir, 'preview');
        
        if (fs.existsSync(previewCacheDir)) {
            fs.rmSync(previewCacheDir, { recursive: true, force: true });
        }
        
        // 古いプレビューファイルを削除（1時間以上前）
        const cacheFiles = fs.readdirSync(config.cacheDir);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        
        for (const file of cacheFiles) {
            if (file.startsWith('preview-')) {
                const filePath = path.join(config.cacheDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime.getTime() < oneHourAgo) {
                    fs.unlinkSync(filePath);
                }
            }
        }
        
        res.json({ success: true, message: 'Preview cache cleaned up' });
        
    } catch (error) {
        console.error('❌ Preview cleanup error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Preview cleanup failed'
        });
    }
});

export { router as previewRouter };