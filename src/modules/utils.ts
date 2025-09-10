// ユーティリティモジュール（外部依存なし）
import * as fs from 'fs';
import { VialConfig, KeyPosition } from './types';

export class Utils {
    // US配列から日本語配列への変換
    static convertUsToJis(keyStr: string): string {
        // US配列の物理キー位置 → JIS配列での実際の文字
        const usToJisMapping: { [key: string]: string } = {
            // 数字行の記号
            'KC_MINUS': 'KC_MINUS',        // - → - (同じ位置)
            'KC_EQUAL': 'KC_EQUAL',        // = → = (JISでは^の位置だが、実際は=)
            
            // 上段記号行
            'KC_LBRACKET': 'KC_AT',        // [ → @ (JIS配列の@位置)
            'KC_RBRACKET': 'KC_RBRACKET',  // ] → [ (座標修正のためそのまま)  
            'KC_BSLASH': 'KC_RBRACKET',    // \ → ] (JIS配列の]位置)
            
            // ホーム行記号
            'KC_SCOLON': 'KC_SCOLON',      // ; → ; (JIS配列では+の位置だが、;として表示)
            'KC_QUOTE': 'KC_QUOTE',        // ' → ' (JIS配列では*の位置だが、'として表示)
            
            // 下段記号
            'KC_COMMA': 'KC_COMMA',        // , → , (同じ)
            'KC_DOT': 'KC_DOT',            // . → . (同じ)
            'KC_SLASH': 'KC_SLASH',        // / → / (同じ)
            'KC_GRAVE': 'KC_GRAVE',        // ` → ` (JIS配列では別位置)
        };

        // LSFT+キーの変換（USキーボードの物理位置 → JIS配列での実際の出力文字）
        if (keyStr.startsWith('LSFT(KC_')) {
            const baseKeyMatch = keyStr.match(/LSFT\(KC_(.+)\)/);
            if (baseKeyMatch) {
                const baseKey = baseKeyMatch[1];
                const shiftMapping: { [key: string]: string } = {
                    // 数字キー - JIS配列での実際の出力
                    '1': '!',          // Shift+1 = ! (同じ)
                    '2': '"',          // Shift+2 = " (JIS配列) - 確認済み
                    '3': '#',          // Shift+3 = # 
                    '4': '$',          // Shift+4 = $ (同じ)
                    '5': '%',          // Shift+5 = % (同じ)
                    '6': '&',          // Shift+6 = & (JIS配列)
                    '7': "'",          // Shift+7 = ' (元に戻す)
                    '8': '(',          // Shift+8 = ( (JIS配列)
                    '9': ')',          // Shift+9 = ) (JIS配列)
                    '0': '0',          // Shift+0 = 0 (JIS配列では0のまま)
                    
                    // 記号キー (Geminiの正確なUS→JIS変換)
                    'MINUS': '=',          // Shift+- → = (修正)
                    'EQUAL': '~',          // Shift+= → ~ (JIS配列)
                    'LBRACKET': '`',       // Shift+[ → ` (座標修正)
                    'RBRACKET': '{',       // Shift+] → { (JIS配列)
                    'BSLASH': '|',         // Shift+\ → | (JIS配列)
                    'SCOLON': '+',         // Shift+; → + (JIS配列)
                    'QUOTE': '*',          // Shift+' → * (JIS配列)
                    'COMMA': '<',          // Shift+, → <
                    'DOT': '>',            // Shift+. → >
                    'SLASH': '?',          // Shift+/ → ?
                    'GRAVE': '~',          // Shift+` → ~
                    'JYEN': '|',           // Shift+JYEN → | (座標修正)
                };
                
                return `SHIFT_${shiftMapping[baseKey] || baseKey}`;
            }
        }

        // 通常キーの変換
        if (usToJisMapping[keyStr]) {
            return usToJisMapping[keyStr];
        }

        // 変換不要な場合はそのまま返す
        return keyStr;
    }

    // Vial設定ファイルを読み込み
    static loadVialConfig(filePath: string): VialConfig {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
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