// Canvas描画共通ユーティリティ
// Node.js版とブラウザ版で共通のCanvas描画ロジック

import type { VialConfig, RenderOptions, ComboInfo } from './types';
import { getThemeColors } from './types';
import { KEYBOARD_CONSTANTS } from '../constants/keyboard';

export interface CanvasAdapter {
  createCanvas(width: number, height: number): any;
  getContext(canvas: any): CanvasRenderingContext2D;
  toBuffer?(canvas: any, format: string): Buffer;
  loadImage?(imagePath: string): Promise<any>;
}

export class CanvasDrawingUtils {
  // 共通定数を使用
  static get keyWidth() { return KEYBOARD_CONSTANTS.keyWidth }
  static get keyHeight() { return KEYBOARD_CONSTANTS.keyHeight }
  static get keyGap() { return KEYBOARD_CONSTANTS.keyGap }
  static get margin() { return KEYBOARD_CONSTANTS.margin }
  static get unitX() { return KEYBOARD_CONSTANTS.unitX }
  static get unitY() { return KEYBOARD_CONSTANTS.unitY }


  // キー配置情報を取得（元のutils.tsと同じ配置で、width, heightも含める）
  static getKeyPositions() {
    const { keyWidth, keyHeight, keyGap, margin, unitX, unitY } = this;
    const positions: (any | null)[][] = [];

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
        { x: margin + unitX * 5.0, y: margin + unitY * 3.0, width: keyWidth * 1.5, height: keyHeight, rotation: 0.0 }, // LCtrl (1.5x幅)
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
        { x: margin + unitX * 8.5 - keyWidth * 0.5, y: margin + unitY * 3.0, width: keyWidth * 1.5, height: keyHeight, rotation: 0.0 }, // LT3 Tab (1.5x幅)
        null,
    ];

    return positions;
  }

  // キーコード変換
  static keycodeToLabel(keycode: number, config: VialConfig) {
    if (keycode === -1 || keycode === 0) {
      return { mainText: '', subTexts: [] };
    }
    
    // 基本的なキーコード変換
    const keycodeMap: {[key: number]: string} = {
      4: 'A', 5: 'B', 6: 'C', 7: 'D', 8: 'E', 9: 'F', 10: 'G',
      11: 'H', 12: 'I', 13: 'J', 14: 'K', 15: 'L', 16: 'M', 17: 'N',
      18: 'O', 19: 'P', 20: 'Q', 21: 'R', 22: 'S', 23: 'T',
      24: 'U', 25: 'V', 26: 'W', 27: 'X', 28: 'Y', 29: 'Z',
      30: '1', 31: '2', 32: '3', 33: '4', 34: '5',
      35: '6', 36: '7', 37: '8', 38: '9', 39: '0',
      40: 'Enter', 41: 'ESC', 42: 'BS', 43: 'Tab', 44: 'Space',
      57: 'Caps', 225: 'LShft', 229: 'RShft'
    };
    
    return {
      mainText: keycodeMap[keycode] || `KC_${keycode}`,
      subTexts: []
    };
  }

  // キーボード画像を描画（共通ロジック）
  static drawKeyboardImage(
    adapter: CanvasAdapter,
    config: VialConfig,
    layerIndex: number,
    options: RenderOptions,
    scale: number = 1.0
  ): any {
    // 画像サイズを計算
    const contentWidth = this.unitX * 14.0 + 30.0 + this.keyWidth;
    const contentHeight = this.unitY * 3.0 + this.keyHeight;
    const baseImgWidth = Math.ceil(contentWidth + this.margin * 2);
    const baseImgHeight = Math.ceil(contentHeight + this.margin * 2);
    
    // スケールを適用
    const imgWidth = Math.floor(baseImgWidth * scale);
    const imgHeight = Math.floor(baseImgHeight * scale);

    // Canvasを作成
    const canvas = adapter.createCanvas(imgWidth, imgHeight);
    const ctx = adapter.getContext(canvas);
    
    // 低品質の場合は描画品質を下げる
    if (scale < 1.0) {
      ctx.imageSmoothingEnabled = false; // アンチエイリアシング無効化
    }
    
    // スケーリング変換を適用
    ctx.scale(scale, scale);

    // テーマ色を取得
    const colors = getThemeColors(options.theme);
    
    // 背景を塗りつぶし（スケール前のサイズで）
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, baseImgWidth, baseImgHeight);

    // キー配置情報を取得
    const positions = this.getKeyPositions();

    // Combo情報を解析（空配列ではなく実際の情報を取得）
    const combos: ComboInfo[] = [];
    if (config.combo && Array.isArray(config.combo)) {
      // 簡易的なCombo解析（実際のParserロジックは複雑なのでシンプル版）
      config.combo.forEach((comboData: any, index: number) => {
        if (Array.isArray(comboData) && comboData.length >= 2) {
          const keys = comboData.slice(0, -1); // 最後以外がキー
          combos.push({
            keys: keys.map((k: any) => String(k)),
            keycodes: keys.map((k: any) => String(k)),
            keySubTexts: [],
            action: String(comboData[comboData.length - 1]),
            description: `Combo ${index + 1}`,
            index
          });
        }
      });
    }

    // 指定されたレイヤーのキーを描画
    if (config.layout.length > layerIndex) {
      const layer = config.layout[layerIndex];

      for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
        for (let colIdx = 0; colIdx < positions[rowIdx]?.length || 0; colIdx++) {
          const pos = positions[rowIdx]?.[colIdx];
          if (!pos) continue;

          const keycode = layer[rowIdx]?.[colIdx] || -1;
          const label = this.keycodeToLabel(keycode, config);

          // キーを描画（実際のcombos情報を渡す）
          this.drawKey(ctx, pos, label, String(keycode), options, colors, combos);
          this.drawText(ctx, pos, label, String(keycode), options, colors, combos);
        }
      }
    }

    // レイヤー番号を装飾付きで左下に表示（スケール前のサイズで）
    this.drawLayerNumber(ctx, layerIndex, baseImgWidth, baseImgHeight, colors);
    
    return canvas;
  }

  // Combo入力キーかどうかを判定するヘルパー関数
  private static isComboInputKey(keycode: string, combos: ComboInfo[]): boolean {
    for (const combo of combos) {
      if (combo.keycodes && combo.keycodes.includes(keycode)) {
        return true;
      }
    }
    return false;
  }

  // キーを描画
  static drawKey(
    ctx: CanvasRenderingContext2D,
    pos: {x: number, y: number, width: number, height: number},
    label: any,
    keycode: string,
    options: RenderOptions,
    colors: any,
    combos?: ComboInfo[]
  ) {
    const {
      highlightComboKeys = true,
      highlightSubtextKeys = true,
      showComboMarkers = true
    } = options;

    const isComboKey = (combos && keycode !== undefined) ? this.isComboInputKey(keycode, combos) : false;
    const hasSubTexts = label.subTexts && label.subTexts.length > 0;
    
    let keyColor: string;
    let borderColor: string;
    
    if (label.mainText === '') {
      keyColor = colors.keyEmpty || colors.keyNormal; // 空キー色
      borderColor = colors.borderEmpty || colors.borderNormal;
    } else if ((isComboKey && highlightComboKeys) || (hasSubTexts && highlightSubtextKeys)) {
      keyColor = colors.keySpecial;
      borderColor = colors.borderSpecial;
    } else {
      keyColor = colors.keyNormal;
      borderColor = colors.borderNormal;
    }

    // メインキーエリア（位置情報のwidth, heightを使用）
    ctx.fillStyle = keyColor;
    ctx.fillRect(pos.x + 1, pos.y + 1, pos.width - 2, pos.height - 2);

    // 細いボーダー
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

    // Combo入力キーには右上に直角三角形マーカーを追加
    if (isComboKey && showComboMarkers) {
      const triangleSize = 12;
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.moveTo(pos.x + pos.width - triangleSize, pos.y);
      ctx.lineTo(pos.x + pos.width, pos.y);
      ctx.lineTo(pos.x + pos.width, pos.y + triangleSize);
      ctx.closePath();
      ctx.fill();
    }
  }

  // テキストを描画
  static drawText(
    ctx: CanvasRenderingContext2D,
    pos: {x: number, y: number, width: number, height: number},
    label: any,
    keycode: string,
    options: RenderOptions,
    colors: any,
    combos?: ComboInfo[]
  ) {
    if (label.mainText === '') return;

    const {
      highlightComboKeys = true,
      highlightSubtextKeys = true,
      showTextColors = true
    } = options;

    const isComboKey = (combos && keycode !== undefined) ? this.isComboInputKey(keycode, combos) : false;
    const hasSubTexts = label.subTexts && label.subTexts.length > 0;

    const mainColor = (showTextColors && ((isComboKey && highlightComboKeys) || (hasSubTexts && highlightSubtextKeys))) 
        ? colors.textSpecial 
        : colors.textNormal;
    
    let fontSize: number;
    if (label.mainText.length === 1) {
      fontSize = 24;
    } else if (label.mainText.length > 8) {
      fontSize = 14;
    } else if (label.subText) {
      fontSize = 20;
    } else {
      fontSize = 18;
    }

    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = mainColor;
    ctx.textAlign = 'center';

    const mainY = pos.y + pos.height * 0.35;
    ctx.fillText(label.mainText, pos.x + pos.width / 2, mainY);

    // サブテキストの描画
    if (label.subTexts && label.subTexts.length > 0) {
      ctx.fillStyle = colors.textSub;
      
      if (label.subTexts.length === 1) {
        ctx.font = '14px Arial, sans-serif';
        const y = pos.y + pos.height * 0.75;
        ctx.fillText(label.subTexts[0], pos.x + pos.width / 2, y);
      } else {
        const startY = pos.y + pos.height * 0.65;
        const lineHeight = 13;
        
        for (let i = 0; i < label.subTexts.length; i += 2) {
          const row = Math.floor(i / 2);
          const y = startY + (row * lineHeight);
          
          if (i + 1 < label.subTexts.length) {
            const leftX = pos.x + pos.width * 0.25;
            const rightX = pos.x + pos.width * 0.75;
            
            ctx.font = '13px Arial, sans-serif';
            ctx.fillText(label.subTexts[i], leftX, y);
            
            ctx.font = '11px Arial, sans-serif';
            ctx.fillText(label.subTexts[i + 1], rightX, y);
          } else {
            ctx.font = '11px Arial, sans-serif';
            ctx.fillText(label.subTexts[i], pos.x + pos.width / 2, y);
          }
        }
      }
    }
  }

  // レイヤー番号を描画
  static drawLayerNumber(
    ctx: CanvasRenderingContext2D,
    layerIndex: number,
    width: number,
    height: number,
    colors: any
  ) {
    // レイヤー番号を三行目の中央の隙間（左右ボタンの中間）に表示
    const keyWidth = KEYBOARD_CONSTANTS.keyWidth;
    const keyHeight = KEYBOARD_CONSTANTS.keyHeight;
    const keyGap = KEYBOARD_CONSTANTS.keyGap;
    const unitX = KEYBOARD_CONSTANTS.unitX;
    const unitY = KEYBOARD_CONSTANTS.unitY;
    const margin = KEYBOARD_CONSTANTS.margin;
    
    // 三行目のY座標を計算
    const thirdRowY = margin + unitY * 2 + keyHeight / 2;
    
    // 左側最後のキー（V: unitX * 5.0）と右側最初のキー（M: unitX * 8.0）の中間のX座標
    const leftKeyEndX = margin + unitX * 5.0 + keyWidth;
    const rightKeyStartX = margin + unitX * 8.0;
    const centerX = (leftKeyEndX + rightKeyStartX) / 2;
    
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = colors.textSub;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${layerIndex}`, centerX, thirdRowY);
  }

  // コンボ情報を描画（ComboRendererから移植）
  static drawCombos(
    adapter: CanvasAdapter,
    combos: ComboInfo[],
    width: number,
    isWideLayout: boolean = false,
    theme: 'dark' | 'light' = 'dark',
    scale: number = 1.0,
    highlightComboKeys: boolean = true,
    showComboMarkers: boolean = true
  ): { canvas: any, height: number } {
    if (combos.length === 0) {
      // Comboがない場合は高さ0のキャンバスを返す
      const canvas = adapter.createCanvas(width, 1);
      return { canvas, height: 0 };
    }

    // Comboをフィルタリングしてグループ分け（1個の入力キーは除外）
    const validCombos = combos.filter(combo => combo.keys.length >= 2);
    const shortCombos = validCombos.filter(combo => combo.keys.length <= 3);
    const longCombos = validCombos.filter(combo => combo.keys.length >= 4);

    if (validCombos.length === 0) {
      const canvas = adapter.createCanvas(width, 1);
      return { canvas, height: 0 };
    }

    // 描画サイズを計算
    const margin = 15;
    const lineHeight = 70;
    const headerHeight = 45;
    
    // 短いCombo（2-3個の入力キー）の列数設定
    const shortComboColumnsCount = isWideLayout ? 6 : 3;
    const longComboColumnsCount = isWideLayout ? 4 : 2;
    
    const shortComboRows = Math.ceil(shortCombos.length / shortComboColumnsCount);
    const longComboRows = Math.ceil(longCombos.length / longComboColumnsCount);
    const totalRows = shortComboRows + longComboRows;
    
    const baseTotalHeight = headerHeight + (totalRows * lineHeight) + margin;
    
    // スケールを適用したサイズを計算
    const scaledWidth = Math.floor(width * scale);
    const scaledHeight = Math.floor(baseTotalHeight * scale);

    // キャンバスを作成
    const canvas = adapter.createCanvas(scaledWidth, scaledHeight);
    const ctx = adapter.getContext(canvas);
    
    // 低品質の場合は描画品質を下げる
    if (scale < 1.0) {
      ctx.imageSmoothingEnabled = false;
    }

    // テーマ色を取得して背景を塗りつぶし
    const colors = getThemeColors(theme);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);

    // ヘッダー背景を描画
    ctx.fillStyle = colors.headerBackground;
    ctx.fillRect(0, 0, scaledWidth, Math.floor(37 * scale));

    // ヘッダーを描画
    ctx.font = `bold ${Math.floor(32 * scale)}px Arial, sans-serif`;
    ctx.fillStyle = colors.headerText;
    ctx.textAlign = 'left';
    ctx.fillText('COMBOS', Math.floor(15 * scale), Math.floor(28 * scale));

    // 区切り線を描画
    ctx.strokeStyle = colors.headerBorder;
    ctx.lineWidth = Math.max(1, Math.floor(1 * scale));
    ctx.beginPath();
    ctx.moveTo(Math.floor(15 * scale), Math.floor(37 * scale));
    ctx.lineTo(scaledWidth - Math.floor(15 * scale), Math.floor(37 * scale));
    ctx.stroke();

    // コンボ描画ロジック（元の実装）
    const scaledHeaderHeight = Math.floor(headerHeight * scale);
    const scaledMargin = Math.floor(margin * scale);
    const scaledLineHeight = Math.floor(lineHeight * scale);
    
    let currentRow = 0;
    
    // 短いCombo（2-3個の入力キー）を複数列で配置
    const shortColumnCombos: ComboInfo[][] = Array.from({ length: shortComboColumnsCount }, () => []);
    
    // 縦方向優先で各列に分割
    const shortRowsPerColumn = Math.ceil(shortCombos.length / shortComboColumnsCount);
    for (let i = 0; i < shortCombos.length; i++) {
      const columnIndex = Math.floor(i / shortRowsPerColumn);
      if (columnIndex < shortComboColumnsCount) {
        shortColumnCombos[columnIndex].push(shortCombos[i]);
      }
    }
    
    // 各列を同時に描画
    const maxRows = Math.max(...shortColumnCombos.map(col => col.length));
    for (let row = 0; row < maxRows; row++) {
      const y = scaledHeaderHeight + scaledMargin + (currentRow * scaledLineHeight);
      
      // 各列のComboを描画
      for (let col = 0; col < shortComboColumnsCount; col++) {
        if (row < shortColumnCombos[col].length) {
          const availableWidth = scaledWidth - (scaledMargin * 2);
          const columnWidth = availableWidth / shortComboColumnsCount;
          const columnX = scaledMargin + col * columnWidth;
          this.drawSingleCombo(ctx, shortColumnCombos[col][row], columnX, y, colors, scale, highlightComboKeys, showComboMarkers);
        }
      }
      currentRow++;
    }
    
    // 長いCombo（4個以上の入力キー）を複数列で配置
    const longColumnCombos: ComboInfo[][] = Array.from({ length: longComboColumnsCount }, () => []);
    
    const longRowsPerColumn = Math.ceil(longCombos.length / longComboColumnsCount);
    for (let i = 0; i < longCombos.length; i++) {
      const columnIndex = Math.floor(i / longRowsPerColumn);
      if (columnIndex < longComboColumnsCount) {
        longColumnCombos[columnIndex].push(longCombos[i]);
      }
    }
    
    // 各列を同時に描画
    const maxLongRows = Math.max(...longColumnCombos.map(col => col.length));
    for (let row = 0; row < maxLongRows; row++) {
      const y = scaledHeaderHeight + scaledMargin + (currentRow * scaledLineHeight);
      
      for (let col = 0; col < longComboColumnsCount; col++) {
        if (row < longColumnCombos[col].length) {
          const availableWidth = scaledWidth - (scaledMargin * 2);
          const columnWidth = availableWidth / longComboColumnsCount;
          const columnX = scaledMargin + col * columnWidth;
          this.drawSingleCombo(ctx, longColumnCombos[col][row], columnX, y, colors, scale, highlightComboKeys, showComboMarkers);
        }
      }
      currentRow++;
    }

    return { canvas, height: baseTotalHeight };
  }

  // ヘッダー画像を生成
  static generateHeaderImage(
    adapter: CanvasAdapter,
    width: number,
    theme: 'dark' | 'light' = 'dark',
    label?: string,
    scale: number = 1
  ): any {
    const scaledWidth = Math.floor(width * scale);
    const scaledHeight = Math.floor(45 * scale);
    
    const canvas = adapter.createCanvas(scaledWidth, scaledHeight);
    const ctx = adapter.getContext(canvas);
    
    this.drawHeader(ctx, 'LAYOUTS', 0, 0, scaledWidth, theme, label, scale);
    
    return canvas;
  }

  // 見出しを描画する
  static drawHeader(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number,
    theme: 'dark' | 'light' = 'dark',
    label?: string,
    scale: number = 1
  ): number {
    const headerHeight = Math.floor(45 * scale);
    const colors = getThemeColors(theme);
    
    // 背景色を描画
    ctx.fillStyle = colors.headerBackground;
    ctx.fillRect(x, y, width, Math.floor(37 * scale));
    
    // ヘッダーテキストを描画
    ctx.font = `bold ${Math.floor(32 * scale)}px Arial, sans-serif`;
    ctx.fillStyle = colors.headerText;
    ctx.textAlign = 'left';
    ctx.fillText(text, x + Math.floor(15 * scale), y + Math.floor(28 * scale));
    
    // ラベル（ファイル名など）を右側に描画
    if (label) {
      ctx.font = `${Math.floor(28 * scale)}px Arial, sans-serif`;
      ctx.fillStyle = colors.textSub;
      ctx.textAlign = 'right';
      ctx.fillText(label, x + width - Math.floor(15 * scale), y + Math.floor(28 * scale));
    }
    
    // 区切り線を描画
    ctx.strokeStyle = colors.headerBorder;
    ctx.lineWidth = Math.floor(1 * scale);
    ctx.beginPath();
    ctx.moveTo(x + Math.floor(15 * scale), y + Math.floor(37 * scale));
    ctx.lineTo(x + width - Math.floor(15 * scale), y + Math.floor(37 * scale));
    ctx.stroke();
    
    return headerHeight;
  }

  // combo_renderer.tsから正確に移植した単一のCombo描画メソッド
  private static drawSingleCombo(
    ctx: CanvasRenderingContext2D, 
    combo: ComboInfo, 
    startX: number, 
    y: number, 
    colors: any, 
    scale: number = 1.0, 
    highlightComboKeys: boolean = true, 
    showComboMarkers: boolean = true
  ): void {
    let currentX = startX;

    // インデックス番号を描画（スケール対応、1から始める）
    ctx.fillStyle = colors.textNormal;
    ctx.font = `bold ${Math.floor(28 * scale)}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`#${combo.index + 1}`, currentX, y + Math.floor(30 * scale));
    currentX += Math.floor(50 * scale);

    // 左側にアクションボタンを描画（サブテキスト付き）
    const actionButtonWidth = this.drawKeyButton(ctx, combo.action, currentX, y, true, combo.actionSubTexts, false, colors, scale, highlightComboKeys, showComboMarkers);
    currentX += actionButtonWidth + Math.floor(15 * scale);

    // ダッシュを描画（ボタンの中央の高さに合わせる）
    ctx.fillStyle = colors.textSub;
    ctx.font = `${Math.floor(14 * scale)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('────', currentX + Math.floor(20 * scale), y + Math.floor(30 * scale));
    currentX += Math.floor(50 * scale);

    // 組み合わせキーをボタンとして描画（サブテキスト付き）
    for (let j = 0; j < combo.keys.length; j++) {
      const key = combo.keys[j];
      const keySubTexts = combo.keySubTexts[j]; // 各キーのサブテキストを取得
      
      // キーボタンを描画（サブテキスト付き、Combo入力キーマーカー付き）
      const buttonWidth = this.drawKeyButton(ctx, key, currentX, y, false, keySubTexts, true, colors, scale, highlightComboKeys, showComboMarkers);
      currentX += buttonWidth + Math.floor(8 * scale);
    }

    console.log(`Combo #${combo.index + 1}: ${combo.description}`);
  }

  // combo_renderer.tsから正確に移植したキーボタン描画メソッド
  private static drawKeyButton(
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    isAction: boolean = false, 
    subTexts?: string[], 
    isComboInputKey: boolean = false, 
    colors?: any, 
    scale: number = 1.0, 
    highlightComboKeys: boolean = true, 
    showComboMarkers: boolean = true
  ): number {
    // キーボードと同じサイズ（スケール対応）
    const buttonWidth = Math.floor(78 * scale);  
    const buttonHeight = Math.floor(60 * scale);

    // ボタンの色設定
    // サブテキストがあるキーは特別色、アクションボタンは通常色
    const hasSubTexts = subTexts && subTexts.length > 0;
    const shouldUseSpecialColor = (hasSubTexts && highlightComboKeys && !isAction) || (isComboInputKey && highlightComboKeys);
    
    const buttonColor = shouldUseSpecialColor ? colors.keySpecial : colors.keyNormal;
    const borderColor = shouldUseSpecialColor ? colors.borderSpecial : colors.borderNormal;
    const textColor = shouldUseSpecialColor ? colors.textSpecial : colors.textNormal;

    // ボタン背景を描画（キーキャップスタイル）
    ctx.fillStyle = buttonColor;
    ctx.fillRect(x + 1, y + 1, buttonWidth - 2, buttonHeight - 2);

    // ボタンボーダーを描画
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, buttonWidth, buttonHeight);

    // メインテキストを描画
    let fontSize: number;
    if (text.length === 1) {
      fontSize = Math.floor(24 * scale); // 単一文字
    } else if (text.length > 8) {
      fontSize = Math.floor(14 * scale); // 長いテキスト
    } else if (subTexts && subTexts.length > 0) {
      fontSize = Math.floor(20 * scale); // サブテキストがある場合
    } else {
      fontSize = Math.floor(18 * scale); // 通常サイズ
    }

    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    
    // メインテキストを上に寄せて配置
    const mainY = y + buttonHeight * 0.35;
    ctx.fillText(text, x + buttonWidth / 2, mainY);

    // サブテキストの描画
    if (subTexts && subTexts.length > 0) {
      ctx.fillStyle = colors.textSub;
      
      if (subTexts.length === 1) {
        // 単一のサブテキストは大きな文字で中央に表示
        ctx.font = `${Math.floor(14 * scale)}px Arial, sans-serif`;
        const subY = y + buttonHeight * 0.75;
        ctx.fillText(subTexts[0], x + buttonWidth / 2, subY);
      } else {
        // 複数のサブテキストは一行に二個ずつ配置
        const startY = y + buttonHeight * 0.65;
        const lineHeight = Math.floor(13 * scale);
        
        for (let i = 0; i < subTexts.length; i += 2) {
          const row = Math.floor(i / 2);
          const subY = startY + (row * lineHeight);
          
          if (i + 1 < subTexts.length) {
            // 一行に二個表示：左側は少し大きく、右側は通常サイズ
            const leftX = x + buttonWidth * 0.25;
            const rightX = x + buttonWidth * 0.75;
            
            // 左側（もう少し大きく、太字で視認性向上）
            ctx.font = `bold ${Math.floor(13 * scale)}px Arial, sans-serif`;
            ctx.fillText(subTexts[i], leftX, subY);
            
            // 右側（通常サイズ、太字で視認性向上）
            ctx.font = `bold ${Math.floor(11 * scale)}px Arial, sans-serif`;
            ctx.fillText(subTexts[i + 1], rightX, subY);
          } else {
            // 奇数個の場合、最後の一個は中央に表示（太字で視認性向上）
            ctx.font = `bold ${Math.floor(11 * scale)}px Arial, sans-serif`;
            ctx.fillText(subTexts[i], x + buttonWidth / 2, subY);
          }
        }
      }
    }

    // Combo入力キーには右上に直角三角形マーカーを追加
    if (isComboInputKey && showComboMarkers) {
      const triangleSize = Math.floor(12 * scale);
      ctx.fillStyle = '#ff6b6b'; // 赤色のマーカー
      ctx.beginPath();
      ctx.moveTo(x + buttonWidth - triangleSize, y);
      ctx.lineTo(x + buttonWidth, y);
      ctx.lineTo(x + buttonWidth, y + triangleSize);
      ctx.closePath();
      ctx.fill();
    }

    return buttonWidth;
  }
}