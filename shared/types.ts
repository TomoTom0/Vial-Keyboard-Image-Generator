// 共有型定義
// フロントエンドとバックエンドで使用する共通の型定義

export interface GenerationOptions {
    theme: 'dark' | 'light';
    format: 'vertical' | 'horizontal' | 'individual';
    layerRange?: {
        start: number;
        end: number;
    };
    showComboInfo?: boolean;
    fileLabel?: string;
    imageOptions?: ImageOutputOptions;
}

export interface ImageOutputOptions {
    // プレビュー版設定
    generatePreview?: boolean;
    previewMaxWidth?: number;
    previewQuality?: number;
    
    // フル版設定
    fullQuality?: number;
    fullFormat?: 'png' | 'jpeg';
    
    // 共通設定
    compressionLevel?: number;
}

export interface GenerationRequest {
    file: File | Buffer;
    filename: string;
    options: GenerationOptions;
}

export interface GenerationResponse {
    success: boolean;
    images: GeneratedImage[];
    error?: string;
}

export interface GeneratedImage {
    id: string;
    filename: string;
    type: 'combined' | 'layer';
    layer?: number;
    format: string;
    url: string;
    previewUrl?: string;  // プレビュー版のURL
    size: number;
    previewSize?: number; // プレビュー版のサイズ
    timestamp: Date;
}

export interface CacheEntry {
    id: string;
    filename: string;
    options: GenerationOptions;
    images: GeneratedImage[];
    timestamp: Date;
    expiresAt: Date;
}

export interface HistoryEntry {
    id: string;
    filename: string;
    options: GenerationOptions;
    timestamp: Date;
    cached: boolean;
}