import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, CanvasRenderingContext2D, Canvas } from 'canvas';

// Vial設定の型定義
interface VialConfig {
    version: number;
    uid: number;
    layout: string[][][];
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

    // Vial設定ファイルを読み込み
    private loadVialConfig(filePath: string): VialConfig {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }

    // キーコード文字列をラベルに変換（Rust版と同等の精度）
    private keycodeToLabel(keycodeStr: string, config: VialConfig): KeyLabel {
        if (!keycodeStr || keycodeStr === 'KC_NO' || keycodeStr === '') {
            return { mainText: '', subText: undefined, isSpecial: false };
        }

        // Tap Dance処理
        if (keycodeStr.startsWith('TD(')) {
            const match = keycodeStr.match(/TD\((\d+)\)/);
            if (match) {
                const tdIndex = parseInt(match[1]);
                const tdInfo = this.getTapDanceInfo(tdIndex, config);
                if (tdInfo) {
                    return {
                        mainText: tdInfo.tap,
                        subText: tdInfo.hold,
                        isSpecial: true
                    };
                }
            }
            return { mainText: keycodeStr, subText: undefined, isSpecial: true };
        }

        // Layer Tap処理
        if (keycodeStr.match(/^LT\d+\(/)) {
            const match = keycodeStr.match(/^LT(\d+)\(KC_(.+)\)$/);
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
                    subText: `LT${layerNum}`,
                    isSpecial: true
                };
            }
        }

        // TO(layer)処理
        if (keycodeStr.startsWith('TO(')) {
            const match = keycodeStr.match(/TO\((\d+)\)/);
            if (match) {
                return { mainText: `TO(${match[1]})`, subText: undefined, isSpecial: true };
            }
        }

        // 基本キーマッピング（KC_プレフィックス付き）
        if (keycodeStr.startsWith('KC_')) {
            const baseKey = keycodeStr.substring(3);
            const keyMapping: { [key: string]: string } = {
                // アルファベット
                'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
                'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S',
                'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
                // 数字
                '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
                // 特殊キー
                'ENTER': 'Enter', 'ESC': 'Esc', 'BSPACE': 'Bksp', 'TAB': 'Tab', 'SPACE': 'Space',
                // 記号
                'MINUS': '-', 'EQUAL': '=', 'LBRACKET': '[', 'RBRACKET': ']', 'BSLASH': '\\',
                'SCOLON': ';', 'QUOTE': '?', 'GRAVE': '`', 'COMMA': ',', 'DOT': '.', 'SLASH': '?/',
                'CAPSLOCK': 'Caps', 'PSCREEN': 'Print\nScreen',
                // 修飾キー
                'LCTRL': 'LCtrl', 'LSHIFT': 'LShift', 'LALT': 'LAlt', 'LGUI': 'LGui',
                'RCTRL': 'RCtrl', 'RSHIFT': 'RShift', 'RALT': 'RAlt', 'RGUI': 'RGui',
                // 日本語キー
                'MHEN': 'MHEN', 'HENK': 'HENK', 'KANA': 'KANA'
            };

            const mappedKey = keyMapping[baseKey];
            if (mappedKey) {
                return { mainText: mappedKey, subText: undefined, isSpecial: false };
            }
        }

        // その他の特殊処理
        switch (keycodeStr) {
            case 'KC_RALT': return { mainText: 'RAlt', subText: undefined, isSpecial: false };
            default:
                return { mainText: keycodeStr, subText: undefined, isSpecial: false };
        }
    }

    // Tap Dance情報を取得
    private getTapDanceInfo(index: number, config: VialConfig): { tap: string; hold: string } | null {
        if (!config.tap_dance || index >= config.tap_dance.length) {
            return null;
        }

        const td = config.tap_dance[index];
        if (td.length < 2) {
            return null;
        }

        const tapKey = this.keycodeToLabel(td[0], config);
        const holdKey = this.keycodeToLabel(td[1], config);

        return {
            tap: tapKey.mainText,
            hold: holdKey.mainText
        };
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
            { x: this.margin + this.unitX * 14.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // KC_NO
            { x: this.margin + this.unitX * 13.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // P
            { x: this.margin + this.unitX * 12.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // O
            { x: this.margin + this.unitX * 11.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // I
            { x: this.margin + this.unitX * 10.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // U
            { x: this.margin + this.unitX * 9.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Y
            { x: this.margin + this.unitX * 8.0, y: this.margin + 0.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // RAlt
        ];

        // 行5: 右中段
        positions[5] = [
            { x: this.margin + this.unitX * 14.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // TD(0)
            { x: this.margin + this.unitX * 13.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Bksp
            { x: this.margin + this.unitX * 12.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // L
            { x: this.margin + this.unitX * 11.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // K
            { x: this.margin + this.unitX * 10.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // J
            { x: this.margin + this.unitX * 9.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // H
            { x: this.margin + this.unitX * 8.0, y: this.margin + this.unitY * 1.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // RShift
        ];

        // 行6: 右下段
        positions[6] = [
            { x: this.margin + this.unitX * 14.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // Enter
            { x: this.margin + this.unitX * 13.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // ?
            { x: this.margin + this.unitX * 12.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // ;
            { x: this.margin + this.unitX * 11.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // M
            { x: this.margin + this.unitX * 10.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // ,
            { x: this.margin + this.unitX * 9.0, y: this.margin + this.unitY * 2.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // N
            null,
        ];

        // 行7: 右親指部
        positions[7] = [
            null, null, null,
            { x: this.margin + this.unitX * 11.0, y: this.margin + this.unitY * 3.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // RGui
            { x: this.margin + this.unitX * 10.0, y: this.margin + this.unitY * 3.0, width: this.keyWidth, height: this.keyHeight, rotation: 0.0 }, // LT2 Space
            { x: this.margin + this.unitX * 9.0 - this.keyWidth * 0.5, y: this.margin + this.unitY * 3.0, width: this.keyWidth * 1.5, height: this.keyHeight, rotation: 0.0 }, // LT3 Tab
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

        // メインテキストを常に中央に配置
        const mainY = pos.y + pos.height / 2 + 6;
        ctx.fillText(label.mainText, pos.x + pos.width / 2, mainY);

        // サブテキストの描画
        if (label.subText) {
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = COLORS.textSub;
            const subY = pos.y + pos.height * 0.85;
            ctx.fillText(label.subText, pos.x + pos.width / 2, subY);
        }
    }

    // キーボード画像を生成
    public generateKeyboardImage(configPath: string, outputPath: string): void {
        console.log('Vial Keyboard Image Generator (TypeScript)');
        
        // Vial設定を読み込み
        const config = this.loadVialConfig(configPath);
        console.log(`読み込み成功: version=${config.version}, uid=${config.uid}`);
        console.log(`レイヤー数: ${config.layout.length}`);

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

        // レイヤー0のキーを描画
        if (config.layout.length > 0) {
            const layer0 = config.layout[0];

            for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
                for (let colIdx = 0; colIdx < positions[rowIdx].length; colIdx++) {
                    const pos = positions[rowIdx][colIdx];
                    if (!pos) continue;

                    const keycode = layer0[rowIdx]?.[colIdx] || '';
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
        console.log(`キーボード画像を生成しました: ${outputPath}`);
    }
}

// メイン実行
function main(): void {
    const generator = new VialKeyboardImageGenerator();
    const configPath = path.join(__dirname, '../data/yivu40-250906.vil');
    const outputPath = path.join(__dirname, '../output/keyboard_layout_ts.png');
    
    generator.generateKeyboardImage(configPath, outputPath);
}

if (require.main === module) {
    main();
}