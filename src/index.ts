import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, CanvasRenderingContext2D, Canvas } from 'canvas';

// Vial設定の型定義
interface VialConfig {
    version: number;
    uid: number;
    layout: (string | number)[][][];
    tap_dance: string[][];
}

// キーの位置とサイズ
interface KeyPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

// キーのラベル情報
interface KeyLabel {
    mainText: string;
    subText?: string;
    subTexts?: string[]; // 複数のサブテキスト対応
    isSpecial: boolean;
}

// カラーパレット
const COLORS = {
    background: '#1c1c20',
    keyNormal: '#343a46',
    keySpecial: '#2d3446',
    keyEmpty: '#282a30',
    borderNormal: '#444c5c',
    borderSpecial: '#41497e',
    borderEmpty: '#32353d',
    textNormal: '#f0f6fc',
    textSpecial: '#9cdcfe',
    textSub: '#9ca3af'
} as const;

class VialKeyboardImageGenerator {
    private readonly keyWidth = 78;
    private readonly keyHeight = 60;
    private readonly keyGap = 4;
    private readonly unitX: number;
    private readonly unitY: number;
    private readonly margin = 10;

    constructor() {
        this.unitX = this.keyWidth + this.keyGap;
        this.unitY = this.keyHeight + this.keyGap;
    }

    // US配列から日本語配列への正確な変換
    private convertUsToJis(keyStr: string): string {
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
    private loadVialConfig(filePath: string): VialConfig {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }

    // キーコード文字列をラベルに変換（Rust版と同等の精度）
    private keycodeToLabel(keycodeStr: string | number, config: VialConfig): KeyLabel {
        // -1 や数値の場合は空キーとして処理
        if (keycodeStr === -1 || keycodeStr === '' || keycodeStr === 'KC_NO') {
            return { mainText: '', subText: undefined, isSpecial: false };
        }
        
        // 数値を文字列に変換
        const keyStr = typeof keycodeStr === 'number' ? keycodeStr.toString() : keycodeStr;

        // US配列から日本語配列への変換
        const convertedKeyStr = this.convertUsToJis(keyStr);
        
        // デバッグ情報
        if (keyStr.includes('NONUS_HASH') || keyStr.includes('RO') || keyStr.includes('LSFT(KC_7)') || keyStr.includes('LSFT(KC_9)')) {
            console.log(`Debug: Original=${keyStr}, Converted=${convertedKeyStr}`);
        }

        // Tap Dance処理
        if (convertedKeyStr.startsWith('TD(')) {
            const match = convertedKeyStr.match(/TD\((\d+)\)/);
            if (match) {
                const tdIndex = parseInt(match[1]);
                console.log(`Debug: Processing TD(${tdIndex})`);
                const tdInfo = this.getTapDanceInfo(tdIndex, config);
                if (tdInfo) {
                    console.log(`Debug: TD(${tdIndex}) info:`, tdInfo);
                    const subTexts: string[] = [];
                    if (tdInfo.hold && tdInfo.hold !== 'KC_NO' && tdInfo.hold !== 'NO') {
                        subTexts.push(tdInfo.hold);
                    }
                    if (tdInfo.doubleTap && tdInfo.doubleTap !== 'KC_NO' && tdInfo.doubleTap !== 'NO') {
                        subTexts.push(tdInfo.doubleTap);
                    }
                    if (tdInfo.tapHold && tdInfo.tapHold !== 'KC_NO' && tdInfo.tapHold !== 'NO') {
                        subTexts.push(tdInfo.tapHold);
                    }
                    console.log(`Debug: TD(${tdIndex}) subTexts:`, subTexts);
                    
                    return {
                        mainText: tdInfo.tap,
                        subTexts: subTexts.length > 0 ? subTexts : undefined,
                        isSpecial: true
                    };
                } else {
                    console.log(`Debug: No TD info found for TD(${tdIndex})`);
                }
            }
            return { mainText: convertedKeyStr, subText: undefined, isSpecial: true };
        }

        // Layer Tap処理
        if (convertedKeyStr.match(/^LT\d+\(/)) {
            const match = convertedKeyStr.match(/^LT(\d+)\(KC_(.+)\)$/);
            if (match) {
                const layerNum = match[1];
                const baseKey = match[2];
                
                let keyName = '';
                switch (baseKey) {
                    case 'SPACE': keyName = 'SPACE'; break;
                    case 'TAB': keyName = 'TAB'; break;
                    default: keyName = baseKey;
                }
                
                return {
                    mainText: keyName,
                    subTexts: [`LT${layerNum}`],
                    isSpecial: true
                };
            }
        }

        // TO(layer)処理
        if (convertedKeyStr.startsWith('TO(')) {
            const match = convertedKeyStr.match(/TO\((\d+)\)/);
            if (match) {
                return { mainText: `TO(${match[1]})`, subText: undefined, isSpecial: true };
            }
        }

        // SHIFT_プレフィックス付きキーの処理
        if (convertedKeyStr.startsWith('SHIFT_')) {
            const shiftedChar = convertedKeyStr.substring(6); // "SHIFT_"を除去
            // 特殊な変換
            if (shiftedChar === 'RO') {
                return { mainText: '_', subText: undefined, isSpecial: true }; // Shift+RO = _
            }
            if (shiftedChar === 'NONUS_HASH') {
                return { mainText: '}', subText: undefined, isSpecial: true }; // Shift+NONUS_HASH = }
            }
            return { mainText: shiftedChar, subText: undefined, isSpecial: true };
        }

        // LSFT(key)処理 - 変換されなかった場合のフォールバック
        if (convertedKeyStr.startsWith('LSFT(')) {
            const match = convertedKeyStr.match(/LSFT\(KC_(.+)\)/);
            if (match) {
                return { mainText: `S+${match[1]}`, subText: undefined, isSpecial: true };
            }
        }

        // 特殊な日本語配列キーの個別処理（正確な対応）
        if (convertedKeyStr === 'KC_NONUS_HASH' || convertedKeyStr === 'NONUS_HASH') {
            console.log(`Debug: KC_NONUS_HASH matched, returning ]`);
            return { mainText: ']', subText: undefined, isSpecial: false };
        }
        if (convertedKeyStr === 'KC_RO' || convertedKeyStr === 'RO') {
            return { mainText: '\\', subText: undefined, isSpecial: false };
        }
        if (convertedKeyStr === 'KC_JYEN' || convertedKeyStr === 'JYEN') {
            return { mainText: '\\', subText: undefined, isSpecial: false };
        }

        // 基本キーマッピング（KC_プレフィックス付き） - 日本語配列対応
        if (convertedKeyStr.startsWith('KC_')) {
            const baseKey = convertedKeyStr.substring(3);
            if (baseKey === 'NONUS_HASH') {
                console.log(`Debug: Processing KC_NONUS_HASH, baseKey=${baseKey}`);
            }
            const keyMapping: { [key: string]: string } = {
                // アルファベット
                'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
                'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S',
                'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
                // 数字
                '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
                // 特殊キー
                'ENTER': 'Enter', 'ESC': 'Esc', 'ESCAPE': 'Esc', 'BSPACE': 'Bksp', 'TAB': 'Tab', 'SPACE': 'Space',
                // 記号 - JIS配列対応
                'MINUS': '-', 'EQUAL': '^', 'BSLASH': '\\', 
                'AT': '@', 'LBRACKET': '@', 'RBRACKET': '[',
                'SCOLON': ';', 'QUOTE': ':', 'GRAVE': '`', 
                'COMMA': ',', 'DOT': '.', 'SLASH': '/',
                // 日本語配列特殊キー
                'NONUS_HASH': ']',     // KC_NONUS_HASH → ] (大カッコ閉じる)
                'RO': '\\',            // RO (日本語配列の\キー)
                'INT1': '_',           // 日本語配列のアンダーバー位置
                'INT3': '\\',          // 日本語配列のバックスラッシュ
                'CAPSLOCK': 'Caps', 'PSCREEN': 'Print\nScreen',
                // 修飾キー
                'LCTRL': 'LCtrl', 'LSHIFT': 'LShift', 'LALT': 'LAlt', 'LGUI': 'LGui',
                'RCTRL': 'RCtrl', 'RSHIFT': 'RShift', 'RALT': 'RAlt', 'RGUI': 'RGui',
                // ファンクションキー
                'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
                'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
                // 矢印キー
                'UP': '↑', 'DOWN': '↓', 'LEFT': '←', 'RIGHT': '→',
                // ナビゲーションキー
                'HOME': 'Home', 'END': 'End', 'PGUP': 'PgUp', 'PGDN': 'PgDn',
                'INSERT': 'Ins', 'DELETE': 'Del',
                // テンキー
                'KP_0': '0', 'KP_1': '1', 'KP_2': '2', 'KP_3': '3', 'KP_4': '4',
                'KP_5': '5', 'KP_6': '6', 'KP_7': '7', 'KP_8': '8', 'KP_9': '9',
                'KP_DOT': '.', 'KP_SLASH': '/', 'KP_ASTERISK': '*', 'KP_MINUS': '-',
                'KP_PLUS': '+', 'KP_EQUAL': '=', 'KP_ENTER': 'Enter',
                // 日本語キー
                'MHEN': 'MHEN', 'HENK': 'HENK', 'KANA': 'KANA',
                // 透過キー
                'TRNS': '▽'
            };

            const mappedKey = keyMapping[baseKey];
            if (mappedKey) {
                return { mainText: mappedKey, subText: undefined, isSpecial: false };
            }
        }

        // その他の特殊処理
        switch (convertedKeyStr) {
            case 'KC_RALT': return { mainText: 'RAlt', subText: undefined, isSpecial: false };
            default:
                if (convertedKeyStr.includes('NONUS_HASH')) {
                    console.log(`Debug: Reached default case with ${convertedKeyStr}`);
                }
                return { mainText: convertedKeyStr, subText: undefined, isSpecial: false };
        }
    }

    // Tap Dance情報を取得
    private getTapDanceInfo(index: number, config: VialConfig): { tap: string; hold?: string; doubleTap?: string; tapHold?: string } | null {
        if (!config.tap_dance || index >= config.tap_dance.length) {
            return null;
        }

        const td = config.tap_dance[index];
        if (td.length < 1) {
            return null;
        }

        const result: { tap: string; hold?: string; doubleTap?: string; tapHold?: string } = {
            tap: this.keycodeToLabel(td[0], config).mainText
        };

        // hold動作（2番目の要素）
        if (td.length > 1 && td[1] && td[1] !== 'KC_NO') {
            result.hold = this.keycodeToLabel(td[1], config).mainText;
        }

        // double tap動作（3番目の要素）
        if (td.length > 2 && td[2] && td[2] !== 'KC_NO') {
            result.doubleTap = this.keycodeToLabel(td[2], config).mainText;
        }

        // tap+hold動作（4番目の要素）
        if (td.length > 3 && td[3] && td[3] !== 'KC_NO') {
            result.tapHold = this.keycodeToLabel(td[3], config).mainText;
        }

        return result;
    }

    // キー位置の定義
    private getKeyPositions(): (KeyPosition | null)[][] {
        const positions: (KeyPosition | null)[][] = [];

        // 行0: 左上段
        positions[0] = [
            { x: this.margin + 0.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // TO(0)
            { x: this.margin + this.unitX * 1.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Q
            { x: this.margin + this.unitX * 2.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // W
            { x: this.margin + this.unitX * 3.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // E
            { x: this.margin + this.unitX * 4.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // R
            { x: this.margin + this.unitX * 5.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // T
            { x: this.margin + this.unitX * 6.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Print Screen
        ];

        // 行1: 左中段
        positions[1] = [
            { x: this.margin + 0.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Caps
            { x: this.margin + this.unitX * 1.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // A
            { x: this.margin + this.unitX * 2.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // S
            { x: this.margin + this.unitX * 3.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // D
            { x: this.margin + this.unitX * 4.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // F
            { x: this.margin + this.unitX * 5.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // G
            { x: this.margin + this.unitX * 6.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Tab
        ];

        // 行2: 左下段
        positions[2] = [
            { x: this.margin + 0.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // LShift
            { x: this.margin + this.unitX * 1.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Z
            { x: this.margin + this.unitX * 2.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // X
            { x: this.margin + this.unitX * 3.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // C
            { x: this.margin + this.unitX * 4.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // V
            { x: this.margin + this.unitX * 5.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // B
            null,
        ];

        // 行3: 左親指部
        positions[3] = [
            null, null, null,
            { x: this.margin + this.unitX * 3.0, y: this.margin + this.unitY * 3.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // MHEN
            { x: this.margin + this.unitX * 4.0, y: this.margin + this.unitY * 3.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // LT1 Space
            { x: this.margin + this.unitX * 5.0, y: this.margin + this.unitY * 3.0, width: this.keyWidth * 1.5, height: this.keyHeight, rotation: 0.0 }, // LCtrl
            null,
        ];

        // 行4: 右上段
        positions[4] = [
            { x: this.margin + this.unitX * 13.5, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // KC_NO
            { x: this.margin + this.unitX * 12.5, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // P
            { x: this.margin + this.unitX * 11.5, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // O
            { x: this.margin + this.unitX * 10.5, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // I
            { x: this.margin + this.unitX * 9.5, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // U
            { x: this.margin + this.unitX * 8.5, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Y
            { x: this.margin + this.unitX * 7.5, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // RAlt
        ];

        // 行5: 右中段
        positions[5] = [
            { x: this.margin + this.unitX * 13.5, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // TD(0)
            { x: this.margin + this.unitX * 12.5, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Bksp
            { x: this.margin + this.unitX * 11.5, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // L
            { x: this.margin + this.unitX * 10.5, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // K
            { x: this.margin + this.unitX * 9.5, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // J
            { x: this.margin + this.unitX * 8.5, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // H
            { x: this.margin + this.unitX * 7.5, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // RShift
        ];

        // 行6: 右下段
        positions[6] = [
            { x: this.margin + this.unitX * 13.5, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Enter
            { x: this.margin + this.unitX * 12.5, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // ?
            { x: this.margin + this.unitX * 11.5, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // ;
            { x: this.margin + this.unitX * 10.5, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // M
            { x: this.margin + this.unitX * 9.5, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // ,
            { x: this.margin + this.unitX * 8.5, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // N
            null,
        ];

        // 行7: 右親指部
        positions[7] = [
            null, null, null,
            { x: this.margin + this.unitX * 10.5, y: this.margin + this.unitY * 3.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // RGui
            { x: this.margin + this.unitX * 9.5, y: this.margin + this.unitY * 3.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // LT2 Space
            { x: this.margin + this.unitX * 8.5 - this.keyWidth * 0.5, y: this.margin + this.unitY * 3.0, width: this.keyWidth * 1.5, height: this.keyHeight, rotation: 0.0 }, // LT3 Tab
            null,
        ];

        return positions;
    }

    // キーを描画
    private drawKey(ctx: CanvasRenderingContext2D, pos: KeyPosition, label: KeyLabel): void {
        // キーの背景色を決定
        let keyColor: string;
        let borderColor: string;
        
        if (label.mainText === '') {
            keyColor = COLORS.keyEmpty;
            borderColor = COLORS.borderEmpty;
        } else if (label.isSpecial) {
            keyColor = COLORS.keySpecial;
            borderColor = COLORS.borderSpecial;
        } else {
            keyColor = COLORS.keyNormal;
            borderColor = COLORS.borderNormal;
        }

        // メインキーエリア（少し小さくして縁取りを作る）
        ctx.fillStyle = keyColor;
        ctx.fillRect(pos.x + 1, pos.y + 1, pos.width - 2, pos.height - 2);

        // 細いボーダー
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
    }

    // テキストを描画
    private drawText(ctx: CanvasRenderingContext2D, pos: KeyPosition, label: KeyLabel): void {
        if (label.mainText === '') return;

        // フォント設定
        const mainColor = label.isSpecial ? COLORS.textSpecial : COLORS.textNormal;
        
        // フォントサイズの決定
        let fontSize: number;
        if (label.mainText.length === 1) {
            fontSize = 24; // 単一文字
        } else if (label.mainText.length > 8) {
            fontSize = 14; // 長いテキスト
        } else if (label.subText) {
            fontSize = 20; // TD/LTキーのメインテキスト
        } else {
            fontSize = 18; // 通常サイズ
        }

        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = mainColor;
        ctx.textAlign = 'center';

        // メインテキストを上に寄せて配置
        const mainY = pos.y + pos.height * 0.35;
        ctx.fillText(label.mainText, pos.x + pos.width / 2, mainY);

        // サブテキストの描画
        if (label.subTexts && label.subTexts.length > 0) {
            ctx.fillStyle = COLORS.textSub;
            
            if (label.subTexts.length === 1) {
                // 単一のサブテキストは大きな文字で中央に表示
                ctx.font = '14px Arial, sans-serif';
                const y = pos.y + pos.height * 0.75;
                ctx.fillText(label.subTexts[0], pos.x + pos.width / 2, y);
            } else {
                // 複数のサブテキストは一行に二個ずつ配置
                const startY = pos.y + pos.height * 0.65;
                const lineHeight = 13;
                
                for (let i = 0; i < label.subTexts.length; i += 2) {
                    const row = Math.floor(i / 2);
                    const y = startY + (row * lineHeight);
                    
                    if (i + 1 < label.subTexts.length) {
                        // 一行に二個表示：左側は少し大きく、右側は通常サイズ
                        const leftX = pos.x + pos.width * 0.25;
                        const rightX = pos.x + pos.width * 0.75;
                        
                        // 左側（もう少し大きく）
                        ctx.font = '13px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i], leftX, y);
                        
                        // 右側（通常サイズ）
                        ctx.font = '11px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i + 1], rightX, y);
                    } else {
                        // 奇数個の場合、最後の一個は中央に表示
                        ctx.font = '11px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i], pos.x + pos.width / 2, y);
                    }
                }
            }
        }
    }

    // キーボード画像を生成
    public generateKeyboardImage(configPath: string, outputPath: string, layerIndex: number = 0): void {
        console.log('Vial Keyboard Image Generator (TypeScript)');
        
        // Vial設定を読み込み
        const config = this.loadVialConfig(configPath);
        console.log(`読み込み成功: version=${config.version}, uid=${config.uid}`);
        console.log(`レイヤー数: ${config.layout.length}`);
        console.log(`生成対象レイヤー: ${layerIndex}`);

        // 画像サイズを計算
        const contentWidth = this.unitX * 14.0 + 30.0 + this.keyWidth;
        const contentHeight = this.unitY * 3.0 + this.keyHeight;
        const imgWidth = Math.ceil(contentWidth + this.margin * 2);
        const imgHeight = Math.ceil(contentHeight + this.margin * 2);

        // Canvasを作成
        const canvas = createCanvas(imgWidth, imgHeight);
        const ctx = canvas.getContext('2d');

        // 背景を塗りつぶし
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, imgWidth, imgHeight);

        // キー配置情報を取得
        const positions = this.getKeyPositions();

        // 指定されたレイヤーのキーを描画
        if (config.layout.length > layerIndex) {
            const layer = config.layout[layerIndex];

            for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
                for (let colIdx = 0; colIdx < positions[rowIdx].length; colIdx++) {
                    const pos = positions[rowIdx][colIdx];
                    if (!pos) continue;

                    const keycode = layer[rowIdx]?.[colIdx] || -1;
                    const label = this.keycodeToLabel(keycode, config);

                    // キーを描画
                    this.drawKey(ctx, pos, label);
                    this.drawText(ctx, pos, label);
                }
            }
        }

        // 画像を保存
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        // 座標とメイン文字の対応をファイルに出力
        this.outputCoordinateMapping(config, layerIndex);
        
        console.log(`キーボード画像を生成しました: ${outputPath}`);
    }

    // 座標とメイン文字の対応をファイルに出力
    private outputCoordinateMapping(config: VialConfig, layerIndex: number): void {
        const outputFile = path.join(__dirname, `../output/layer${layerIndex}_coordinates.txt`);
        const positions = this.getKeyPositions();
        
        if (config.layout.length <= layerIndex) return;
        const layer = config.layout[layerIndex];
        
        let output = `レイヤー${layerIndex}の座標とメイン文字の対応:\n\n`;
        
        // 左ブロック
        output += "=== 左ブロック ===\n";
        for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
            const row = positions[rowIdx];
            if (!row) continue;
            
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const pos = row[colIdx];
                if (!pos || pos.x > 400) continue; // 左側のみ
                
                const keycode = layer[rowIdx]?.[colIdx] || -1;
                const label = this.keycodeToLabel(keycode, config);
                if (label.mainText) {
                    output += `左(${colIdx + 1},${rowIdx + 1}): ${label.mainText}\n`;
                }
            }
        }
        
        output += "\n=== 右ブロック ===\n";
        for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
            const row = positions[rowIdx];
            if (!row) continue;
            
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const pos = row[colIdx];
                if (!pos || pos.x <= 400) continue; // 右側のみ
                
                const keycode = layer[rowIdx]?.[colIdx] || -1;
                const label = this.keycodeToLabel(keycode, config);
                if (label.mainText) {
                    output += `右(${colIdx + 1},${rowIdx + 1}): ${label.mainText}\n`;
                }
            }
        }
        
        fs.writeFileSync(outputFile, output, 'utf8');
        console.log(`座標マッピングを出力しました: ${outputFile}`);
    }
}

// メイン実行
function main(): void {
    const generator = new VialKeyboardImageGenerator();
    const configPath = process.argv[2] || path.join(__dirname, '../data/yivu40-250906.vil');
    const layerIndex = process.argv[3] ? parseInt(process.argv[3]) : 1;
    
    const outputPath = path.join(__dirname, `../output/keyboard_layout_layer${layerIndex}_ts.png`);
    generator.generateKeyboardImage(configPath, outputPath, layerIndex);
}

if (require.main === module) {
    main();
}