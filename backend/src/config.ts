import path from 'path';

export const config = {
    // サーバー設定
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // CORS設定
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    // ファイル設定
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.vil'],
    uploadsDir: path.join(__dirname, '../uploads'),
    cacheDir: path.join(__dirname, '../cache'),
    
    // キャッシュ設定
    cacheExpiry: 24 * 60 * 60 * 1000, // 24時間（ミリ秒）
    maxCacheFiles: 100,
    
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15分
        max: 100, // 最大リクエスト数
    },
    
    // 画像生成設定
    defaultTheme: 'dark' as 'dark' | 'light',
    defaultFormat: 'vertical' as 'vertical' | 'horizontal' | 'individual',
    defaultLayerRange: { start: 0, end: 3 },
    
    // セキュリティ設定
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
};