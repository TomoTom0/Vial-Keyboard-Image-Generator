// 新しい位置ベースのキーボードレイアウト定義

import { VialConfig } from './types';

export interface KeyPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

// キーボードの論理的な配置定義
export class KeyboardLayout {
    private readonly keyWidth = 78;
    private readonly keyHeight = 60;
    private readonly keyGap = 4;
    private readonly margin = 10;
    private readonly unitX: number;
    private readonly unitY: number;

    constructor() {
        this.unitX = this.keyWidth + this.keyGap;
        this.unitY = this.keyHeight + this.keyGap;
    }

    // (row, col)から実際の描画座標を計算
    getScreenPosition(row: number, col: number): KeyPosition | null {
        // キーボードの物理的な配置を定義
        const layout = this.getLayoutDefinition();
        
        if (row >= layout.length || col >= layout[row].length || !layout[row][col]) {
            return null;
        }

        const logicalPos = layout[row][col];
        const keyWidth = logicalPos.width ? this.keyWidth * logicalPos.width : this.keyWidth;
        return {
            x: this.margin + this.unitX * logicalPos.x,
            y: this.margin + this.unitY * logicalPos.y,
            width: keyWidth,
            height: this.keyHeight
        };
    }

    // キーボードの論理的配置定義（utils.tsの座標に合わせて修正）
    private getLayoutDefinition(): ({ x: number, y: number, width?: number } | null)[][] {
        return [
            // Row 0: 上段（左側：行0 + 右側：行4）
            [
                { x: 0.0, y: 0.0 },   // TO(0)
                { x: 1.0, y: 0.0 },   // Q  
                { x: 2.0, y: 0.0 },   // W
                { x: 3.0, y: 0.0 },   // E
                { x: 4.0, y: 0.0 },   // R
                { x: 5.0, y: 0.0 },   // T
                { x: 6.0, y: 0.0 },   // Print Screen
                { x: 7.5, y: 0.0 },   // RAlt
                { x: 8.5, y: 0.0 },   // Y
                { x: 9.5, y: 0.0 },   // U
                { x: 10.5, y: 0.0 },  // I
                { x: 11.5, y: 0.0 },  // O
                { x: 12.5, y: 0.0 },  // P
                { x: 13.5, y: 0.0 },  // KC_NO
            ],
            // Row 1: 中段
            [
                { x: 0.0, y: 1.0 },   // Caps
                { x: 1.0, y: 1.0 },   // A
                { x: 2.0, y: 1.0 },   // S  
                { x: 3.0, y: 1.0 },   // D
                { x: 4.0, y: 1.0 },   // F
                { x: 5.0, y: 1.0 },   // G
                { x: 6.0, y: 1.0 },   // Tab
                { x: 7.5, y: 1.0 },   // RShift
                { x: 8.5, y: 1.0 },   // H
                { x: 9.5, y: 1.0 },   // J
                { x: 10.5, y: 1.0 },  // K
                { x: 11.5, y: 1.0 },  // L
                { x: 12.5, y: 1.0 },  // Bksp
                { x: 13.5, y: 1.0 },  // TD(0)
            ],
            // Row 2: 下段
            [
                { x: 0.0, y: 2.0 },   // LShift
                { x: 1.0, y: 2.0 },   // Z
                { x: 2.0, y: 2.0 },   // X
                { x: 3.0, y: 2.0 },   // C
                { x: 4.0, y: 2.0 },   // V
                { x: 5.0, y: 2.0 },   // B
                null,                  // 空白
                null,                  // 空白
                { x: 8.5, y: 2.0 },   // N
                { x: 9.5, y: 2.0 },   // M
                { x: 10.5, y: 2.0 },  // ,
                { x: 11.5, y: 2.0 },  // .
                { x: 12.5, y: 2.0 },  // /
                { x: 13.5, y: 2.0 },  // Enter
            ],
            // Row 3: 親指部
            [
                null, null, null,
                { x: 3.0, y: 3.0 },   // MHEN
                { x: 4.0, y: 3.0 },   // LT1 Space
                { x: 5.0, y: 3.0, width: 1.5 },   // LCtrl（幅1.5倍）
                null,
                null,
                { x: 8.5 - 0.5, y: 3.0, width: 1.5 },   // LT3 Tab（幅1.5倍、位置調整）
                { x: 9.5, y: 3.0 },   // LT2 Space
                { x: 10.5, y: 3.0 },  // RGui
                null, null, null
            ]
        ];
    }

    // キーボードの最大行数・列数を取得
    getMaxRows(): number {
        return this.getLayoutDefinition().length;
    }

    getMaxCols(): number {
        return Math.max(...this.getLayoutDefinition().map(row => row.length));
    }

    // BとNの間の中央位置を計算
    getCenterBetweenBAndN(): { x: number, y: number } {
        const bPos = this.getScreenPosition(2, 5); // B
        const nPos = this.getScreenPosition(2, 8); // N
        
        if (!bPos || !nPos) {
            throw new Error('BキーまたはNキーの位置が見つかりません');
        }

        const bRightEnd = bPos.x + bPos.width;
        const nLeftStart = nPos.x;
        const centerX = (bRightEnd + nLeftStart) / 2;
        
        return { x: centerX, y: bPos.y };
    }

    // 位置からvilファイルの文字コードを取得
    getKeycodeAt(row: number, col: number, layerIndex: number, config: VialConfig): string {
        // vilファイルのレイアウトマッピングを定義
        const vilMapping = this.getVilMapping();
        
        if (row >= vilMapping.length || col >= vilMapping[row].length || vilMapping[row][col] === null) {
            return 'KC_NO'; // 存在しない位置
        }

        const vilIndex = vilMapping[row][col];
        if (!vilIndex) {
            return 'KC_NO';
        }

        // vilファイルからキーコードを取得
        const layers = config.layout || [];
        if (layerIndex >= layers.length) {
            return 'KC_NO';
        }

        const layer = layers[layerIndex];
        if (vilIndex.row >= layer.length || vilIndex.col >= layer[vilIndex.row].length) {
            return 'KC_NO';
        }

        const keycode = layer[vilIndex.row][vilIndex.col];
        return typeof keycode === 'string' ? keycode : `KC_${keycode}`;
    }

    // 論理位置からvilファイル内の位置へのマッピング
    private getVilMapping(): ({ row: number, col: number } | null)[][] {
        return [
            // Row 0: 上段（左側：行0 + 右側：行4）
            [
                { row: 0, col: 0 },   // TO(0)
                { row: 0, col: 1 },   // Q  
                { row: 0, col: 2 },   // W
                { row: 0, col: 3 },   // E
                { row: 0, col: 4 },   // R
                { row: 0, col: 5 },   // T
                { row: 0, col: 6 },   // Print Screen
                { row: 4, col: 6 },   // RAlt
                { row: 4, col: 5 },   // Y
                { row: 4, col: 4 },   // U
                { row: 4, col: 3 },   // I
                { row: 4, col: 2 },   // O
                { row: 4, col: 1 },   // P
                { row: 4, col: 0 },   // KC_NO
            ],
            // Row 1: 中段（左側：行1 + 右側：行5）
            [
                { row: 1, col: 0 },   // Caps
                { row: 1, col: 1 },   // A
                { row: 1, col: 2 },   // S  
                { row: 1, col: 3 },   // D
                { row: 1, col: 4 },   // F
                { row: 1, col: 5 },   // G
                { row: 1, col: 6 },   // Tab
                { row: 5, col: 6 },   // RShift
                { row: 5, col: 5 },   // H
                { row: 5, col: 4 },   // J
                { row: 5, col: 3 },   // K
                { row: 5, col: 2 },   // L
                { row: 5, col: 1 },   // Bksp
                { row: 5, col: 0 },   // TD(0)
            ],
            // Row 2: 下段（左側：行2 + 右側：行6）
            [
                { row: 2, col: 0 },   // LShift
                { row: 2, col: 1 },   // Z
                { row: 2, col: 2 },   // X
                { row: 2, col: 3 },   // C
                { row: 2, col: 4 },   // V
                { row: 2, col: 5 },   // B
                null,                  // 空白
                null,                  // 空白
                { row: 6, col: 5 },   // N
                { row: 6, col: 4 },   // M
                { row: 6, col: 3 },   // ,
                { row: 6, col: 2 },   // .
                { row: 6, col: 1 },   // /
                { row: 6, col: 0 },   // Enter
            ],
            // Row 3: 親指部（左側：行3 + 右側：行7）
            [
                null, null, null,
                { row: 3, col: 3 },   // MHEN
                { row: 3, col: 4 },   // LT1 Space
                { row: 3, col: 5 },   // LCtrl
                null,
                null,
                { row: 7, col: 5 },   // KC_BSPACE
                { row: 7, col: 4 },   // LT2 Space
                { row: 7, col: 3 },   // RGui
                null, null, null
            ]
        ];
    }
}