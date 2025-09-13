// ユーティリティモジュール（ブラウザ対応版）
import type { KeyPosition } from './types';
import { KEYBOARD_LAYOUTS } from './keyboardConfig.generated';

export class Utils {

    // キー配置座標を取得（TSV生成データを使用）
    static getKeyPositions(): (KeyPosition | null)[][] {
        // TSV生成データからcorne_v4レイアウトを取得
        const corneLayout = KEYBOARD_LAYOUTS.corne_v4;
        return corneLayout.positions;
    }
}