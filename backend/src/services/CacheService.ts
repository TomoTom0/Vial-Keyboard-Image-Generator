import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { CacheEntry, HistoryEntry, GenerationOptions } from '../../../shared/types';
import { config } from '../config';

export class CacheService {
    private static cacheFilePath = path.join(config.cacheDir, 'cache.json');
    private static historyFilePath = path.join(config.cacheDir, 'history.json');

    /**
     * キャッシュキーを生成（ファイル名とオプションから）
     */
    static generateCacheKey(filename: string, options: GenerationOptions): string {
        const optionsString = JSON.stringify({
            theme: options.theme,
            format: options.format,
            layerRange: options.layerRange,
            showComboInfo: options.showComboInfo
        });
        
        const hash = crypto.createHash('sha256')
            .update(filename + optionsString)
            .digest('hex');
        
        return `${filename}-${hash.substring(0, 16)}`;
    }

    /**
     * キャッシュからデータを取得
     */
    static async getCachedResult(cacheKey: string): Promise<CacheEntry | null> {
        try {
            if (!fs.existsSync(this.cacheFilePath)) {
                return null;
            }

            const cacheData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf-8'));
            const entry = cacheData[cacheKey];

            if (!entry) {
                return null;
            }

            // 期限切れチェック
            const expiresAt = new Date(entry.expiresAt);
            if (expiresAt < new Date()) {
                console.log(`⏰ Cache expired for key: ${cacheKey}`);
                await this.clearCache(cacheKey);
                return null;
            }

            // 画像ファイルの存在確認
            const imageExists = entry.images.every((img: any) => {
                const imagePath = path.join(config.cacheDir, `${img.id}.png`);
                return fs.existsSync(imagePath);
            });

            if (!imageExists) {
                console.log(`📁 Cache images missing for key: ${cacheKey}`);
                await this.clearCache(cacheKey);
                return null;
            }

            return {
                ...entry,
                timestamp: new Date(entry.timestamp),
                expiresAt: new Date(entry.expiresAt)
            };

        } catch (error) {
            console.error('❌ Cache read error:', error);
            return null;
        }
    }

    /**
     * キャッシュにデータを保存
     */
    static async setCachedResult(cacheKey: string, entry: CacheEntry): Promise<void> {
        try {
            let cacheData: { [key: string]: any } = {};
            
            if (fs.existsSync(this.cacheFilePath)) {
                try {
                    cacheData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf-8'));
                } catch {
                    // ファイルが壊れている場合は空のオブジェクトで初期化
                    cacheData = {};
                }
            }

            // 古いエントリのクリーンアップ
            await this.cleanupExpiredCache(cacheData);

            // 新しいエントリを追加
            cacheData[cacheKey] = entry;

            // ファイルに書き込み
            fs.writeFileSync(this.cacheFilePath, JSON.stringify(cacheData, null, 2));
            
            // 履歴に追加
            await this.addToHistory({
                id: entry.id,
                filename: entry.filename,
                options: entry.options,
                timestamp: entry.timestamp,
                cached: true
            });

            console.log(`💾 Cached result for key: ${cacheKey}`);

        } catch (error) {
            console.error('❌ Cache write error:', error);
            throw error;
        }
    }

    /**
     * 特定のキャッシュを削除
     */
    static async clearCache(cacheKey: string): Promise<void> {
        try {
            if (!fs.existsSync(this.cacheFilePath)) {
                return;
            }

            const cacheData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf-8'));
            const entry = cacheData[cacheKey];

            if (entry) {
                // 関連する画像ファイルを削除
                entry.images.forEach((img: any) => {
                    const imagePath = path.join(config.cacheDir, `${img.id}.png`);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                });

                // キャッシュエントリを削除
                delete cacheData[cacheKey];
                fs.writeFileSync(this.cacheFilePath, JSON.stringify(cacheData, null, 2));
                
                console.log(`🗑️  Cleared cache for key: ${cacheKey}`);
            }

        } catch (error) {
            console.error('❌ Cache clear error:', error);
            throw error;
        }
    }

    /**
     * 期限切れのキャッシュをクリーンアップ
     */
    private static async cleanupExpiredCache(cacheData: { [key: string]: any }): Promise<void> {
        const now = new Date();
        const keysToDelete: string[] = [];

        for (const [key, entry] of Object.entries(cacheData)) {
            const expiresAt = new Date(entry.expiresAt);
            if (expiresAt < now) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            await this.clearCache(key);
        }

        if (keysToDelete.length > 0) {
            console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
        }
    }

    /**
     * 履歴を取得
     */
    static async getHistory(): Promise<HistoryEntry[]> {
        try {
            if (!fs.existsSync(this.historyFilePath)) {
                return [];
            }

            const historyData = JSON.parse(fs.readFileSync(this.historyFilePath, 'utf-8'));
            return historyData.map((entry: any) => ({
                ...entry,
                timestamp: new Date(entry.timestamp)
            }));

        } catch (error) {
            console.error('❌ History read error:', error);
            return [];
        }
    }

    /**
     * 履歴に追加
     */
    private static async addToHistory(entry: HistoryEntry): Promise<void> {
        try {
            let historyData: any[] = [];
            
            if (fs.existsSync(this.historyFilePath)) {
                try {
                    historyData = JSON.parse(fs.readFileSync(this.historyFilePath, 'utf-8'));
                } catch {
                    historyData = [];
                }
            }

            // 新しいエントリを先頭に追加
            historyData.unshift(entry);

            // 履歴の長さを制限（最大100件）
            if (historyData.length > 100) {
                historyData = historyData.slice(0, 100);
            }

            fs.writeFileSync(this.historyFilePath, JSON.stringify(historyData, null, 2));

        } catch (error) {
            console.error('❌ History write error:', error);
            // 履歴の保存に失敗してもメイン機能に影響しないようにする
        }
    }

    /**
     * キャッシュディレクトリの初期化
     */
    static async initializeCache(): Promise<void> {
        try {
            if (!fs.existsSync(config.cacheDir)) {
                fs.mkdirSync(config.cacheDir, { recursive: true });
            }

            // 起動時に期限切れキャッシュをクリーンアップ
            if (fs.existsSync(this.cacheFilePath)) {
                const cacheData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf-8'));
                await this.cleanupExpiredCache(cacheData);
            }

            console.log('🗃️  Cache service initialized');

        } catch (error) {
            console.error('❌ Cache initialization error:', error);
        }
    }
}