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
    size: number;
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