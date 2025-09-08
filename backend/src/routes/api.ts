import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

import { config } from '../config';
import { ImageGeneratorService } from '../services/ImageGeneratorService';
import { CacheService } from '../services/CacheService';
import { GenerationOptions } from '../../../shared/types';

const router = express.Router();

// Multer設定（ファイルアップロード）
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
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

// 画像生成エンドポイント
router.post('/generate', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const options: GenerationOptions = {
            theme: req.body.theme || config.defaultTheme,
            format: req.body.format || config.defaultFormat,
            layerRange: req.body.layerRange ? JSON.parse(req.body.layerRange) : config.defaultLayerRange,
            showComboInfo: req.body.showComboInfo === 'true',
            fileLabel: req.body.fileLabel || req.file.originalname
        };

        console.log('📁 File received:', req.file.originalname);
        console.log('⚙️  Generation options:', options);

        // キャッシュチェック
        const cacheKey = CacheService.generateCacheKey(req.file.originalname, options);
        const cachedResult = await CacheService.getCachedResult(cacheKey);
        
        if (cachedResult) {
            console.log('📦 Cache hit for:', cacheKey);
            return res.json({
                success: true,
                images: cachedResult.images,
                cached: true
            });
        }

        // 画像生成
        const generatedImages = await ImageGeneratorService.generateImages(
            req.file.path,
            req.file.originalname,
            options
        );

        // キャッシュに保存
        await CacheService.setCachedResult(cacheKey, {
            id: uuidv4(),
            filename: req.file.originalname,
            options,
            images: generatedImages,
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + config.cacheExpiry)
        });

        console.log('✅ Generation completed:', generatedImages.length, 'images');

        res.json({
            success: true,
            images: generatedImages,
            cached: false
        });

    } catch (error) {
        console.error('❌ Generation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// 画像ダウンロードエンドポイント
router.get('/download/:imageId', async (req, res) => {
    try {
        const { imageId } = req.params;
        const imagePath = path.join(config.cacheDir, `${imageId}.png`);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const stats = fs.statSync(imagePath);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${imageId}.png"`);

        const fileStream = fs.createReadStream(imagePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Download failed'
        });
    }
});

// 履歴取得エンドポイント
router.get('/history', async (req, res) => {
    try {
        const history = await CacheService.getHistory();
        res.json(history);
    } catch (error) {
        console.error('❌ History error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get history'
        });
    }
});

// キャッシュクリアエンドポイント
router.delete('/cache/:cacheId', async (req, res) => {
    try {
        const { cacheId } = req.params;
        await CacheService.clearCache(cacheId);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Cache clear error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to clear cache'
        });
    }
});

// システム情報エンドポイント
router.get('/info', (req, res) => {
    res.json({
        version: '1.0.0',
        maxFileSize: config.maxFileSize,
        allowedFileTypes: config.allowedFileTypes,
        defaultOptions: {
            theme: config.defaultTheme,
            format: config.defaultFormat,
            layerRange: config.defaultLayerRange
        },
        uptime: process.uptime()
    });
});

export { router as apiRouter };