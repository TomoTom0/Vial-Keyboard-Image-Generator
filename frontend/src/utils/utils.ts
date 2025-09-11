// ユーティリティモジュール（ブラウザ対応版）
import type { VialConfig, KeyPosition } from './types';

export class Utils {

    // Vial設定を内容から読み込み（ブラウザ対応）
    static loadVialConfigFromContent(content: string): VialConfig {
        return JSON.parse(content);
    }

    // キー配置座標を定義
    static getKeyPositions(keyWidth: number, keyHeight: number, keyGap: number, margin: number): (KeyPosition | null)[][] {
        const unitX = keyWidth + keyGap;
        const unitY = keyHeight + keyGap;
        const positions: (KeyPosition | null)[][] = [];

        // 行0: 左上段
        positions[0] = [
            { x: margin + 0.0, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // TO(0)
            { x: margin + unitX * 1.0, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // Q
            { x: margin + unitX * 2.0, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // W
            { x: margin + unitX * 3.0, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // E
            { x: margin + unitX * 4.0, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // R
            { x: margin + unitX * 5.0, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // T
            { x: margin + unitX * 6.0, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // Print Screen
        ];

        // 行1: 左中段
        positions[1] = [
            { x: margin + 0.0, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // Caps
            { x: margin + unitX * 1.0, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // A
            { x: margin + unitX * 2.0, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // S
            { x: margin + unitX * 3.0, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // D
            { x: margin + unitX * 4.0, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // F
            { x: margin + unitX * 5.0, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // G
            { x: margin + unitX * 6.0, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // Tab
        ];

        // 行2: 左下段
        positions[2] = [
            { x: margin + 0.0, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // LShift
            { x: margin + unitX * 1.0, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // Z
            { x: margin + unitX * 2.0, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // X
            { x: margin + unitX * 3.0, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // C
            { x: margin + unitX * 4.0, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // V
            { x: margin + unitX * 5.0, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // B
            null,
        ];

        // 行3: 左親指部
        positions[3] = [
            null, null, null,
            { x: margin + unitX * 3.0, y: margin + unitY * 3.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // MHEN
            { x: margin + unitX * 4.0, y: margin + unitY * 3.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // LT1 Space
            { x: margin + unitX * 5.0, y: margin + unitY * 3.0, width: keyWidth * 1.5, height: keyHeight, rotation: 0.0 }, // LCtrl
            null,
        ];

        // 行4: 右上段
        positions[4] = [
            { x: margin + unitX * 13.5, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // KC_NO
            { x: margin + unitX * 12.5, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // P
            { x: margin + unitX * 11.5, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // O
            { x: margin + unitX * 10.5, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // I
            { x: margin + unitX * 9.5, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // U
            { x: margin + unitX * 8.5, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // Y
            { x: margin + unitX * 7.5, y: margin + 0.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // RAlt
        ];

        // 行5: 右中段
        positions[5] = [
            { x: margin + unitX * 13.5, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // TD(0)
            { x: margin + unitX * 12.5, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // Bksp
            { x: margin + unitX * 11.5, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // L
            { x: margin + unitX * 10.5, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // K
            { x: margin + unitX * 9.5, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // J
            { x: margin + unitX * 8.5, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // H
            { x: margin + unitX * 7.5, y: margin + unitY * 1.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // RShift
        ];

        // 行6: 右下段
        positions[6] = [
            { x: margin + unitX * 13.5, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // Enter
            { x: margin + unitX * 12.5, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // ?
            { x: margin + unitX * 11.5, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // ;
            { x: margin + unitX * 10.5, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // M
            { x: margin + unitX * 9.5, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // ,
            { x: margin + unitX * 8.5, y: margin + unitY * 2.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // N
            null,
        ];

        // 行7: 右親指部
        positions[7] = [
            null, null, null,
            { x: margin + unitX * 10.5, y: margin + unitY * 3.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // RGui
            { x: margin + unitX * 9.5, y: margin + unitY * 3.0, width: keyWidth, height: keyHeight, rotation: 0.0 }, // LT2 Space
            { x: margin + unitX * 8.5 - keyWidth * 0.5, y: margin + unitY * 3.0, width: keyWidth * 1.5, height: keyHeight, rotation: 0.0 }, // LT3 Tab
            null,
        ];

        return positions;
    }
}