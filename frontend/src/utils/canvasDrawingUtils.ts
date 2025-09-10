// Canvas描画共通ユーティリティ
// Node.js版とブラウザ版で共通のCanvas描画ロジック

import { VialConfig, RenderOptions, ComboInfo } from './types';

export interface CanvasAdapter {
  createCanvas(width: number, height: number): any;
  getContext(canvas: any): CanvasRenderingContext2D;
  toBuffer?(canvas: any, format: string): Buffer;
  loadImage?(imagePath: string): Promise<any>;
}

export class CanvasDrawingUtils {
  static keyWidth = 78;
  static keyHeight = 60;
  static keyGap = 4;
  static margin = 10;
  static unitX = CanvasDrawingUtils.keyWidth + CanvasDrawingUtils.keyGap;
  static unitY = CanvasDrawingUtils.keyHeight + CanvasDrawingUtils.keyGap;

  // テーマ色を取得
  static getThemeColors(theme?: 'dark' | 'light') {
    const isDark = theme !== 'light';
    return {
      background: isDark ? '#1a1a1a' : '#ffffff',
      keyNormal: isDark ? '#2d2d2d' : '#f5f5f5',
      keySpecial: isDark ? '#404040' : '#e0e0e0',
      borderNormal: isDark ? '#444444' : '#cccccc',
      borderSpecial: isDark ? '#666666' : '#aaaaaa',
      textNormal: isDark ? '#ffffff' : '#000000',
      textSpecial: isDark ? '#ffffff' : '#000000',
      textSub: isDark ? '#888888' : '#666666',
      headerBackground: isDark ? '#2a2d35' : '#ffffff',
      headerText: isDark ? '#f0f6fc' : '#24292f',
      headerBorder: isDark ? '#21262d' : '#d0d7de'
    };
  }

  // キー配置情報を取得
  static getKeyPositions() {
    const { keyWidth, keyHeight, keyGap, margin, unitX, unitY } = this;
    
    return [
      // Row 0
      [
        { x: margin, y: margin },
        { x: margin + unitX, y: margin },
        { x: margin + unitX * 2, y: margin },
        { x: margin + unitX * 3, y: margin },
        { x: margin + unitX * 4, y: margin },
        { x: margin + unitX * 5, y: margin },
        { x: margin + unitX * 6 + 30, y: margin },
        { x: margin + unitX * 7 + 30, y: margin },
        { x: margin + unitX * 8 + 30, y: margin },
        { x: margin + unitX * 9 + 30, y: margin },
        { x: margin + unitX * 10 + 30, y: margin },
        { x: margin + unitX * 11 + 30, y: margin }
      ],
      // Row 1
      [
        { x: margin, y: margin + unitY },
        { x: margin + unitX, y: margin + unitY },
        { x: margin + unitX * 2, y: margin + unitY },
        { x: margin + unitX * 3, y: margin + unitY },
        { x: margin + unitX * 4, y: margin + unitY },
        { x: margin + unitX * 5, y: margin + unitY },
        { x: margin + unitX * 6 + 30, y: margin + unitY },
        { x: margin + unitX * 7 + 30, y: margin + unitY },
        { x: margin + unitX * 8 + 30, y: margin + unitY },
        { x: margin + unitX * 9 + 30, y: margin + unitY },
        { x: margin + unitX * 10 + 30, y: margin + unitY },
        { x: margin + unitX * 11 + 30, y: margin + unitY }
      ],
      // Row 2
      [
        { x: margin, y: margin + unitY * 2 },
        { x: margin + unitX, y: margin + unitY * 2 },
        { x: margin + unitX * 2, y: margin + unitY * 2 },
        { x: margin + unitX * 3, y: margin + unitY * 2 },
        { x: margin + unitX * 4, y: margin + unitY * 2 },
        { x: margin + unitX * 5, y: margin + unitY * 2 },
        { x: margin + unitX * 6 + 30, y: margin + unitY * 2 },
        { x: margin + unitX * 7 + 30, y: margin + unitY * 2 },
        { x: margin + unitX * 8 + 30, y: margin + unitY * 2 },
        { x: margin + unitX * 9 + 30, y: margin + unitY * 2 },
        { x: margin + unitX * 10 + 30, y: margin + unitY * 2 },
        { x: margin + unitX * 11 + 30, y: margin + unitY * 2 }
      ],
      // Row 3 (thumbs)
      [
        null,
        null,
        null,
        { x: margin + unitX * 3, y: margin + unitY * 3 },
        { x: margin + unitX * 4, y: margin + unitY * 3 },
        { x: margin + unitX * 5, y: margin + unitY * 3 },
        { x: margin + unitX * 6 + 30, y: margin + unitY * 3 },
        { x: margin + unitX * 7 + 30, y: margin + unitY * 3 },
        { x: margin + unitX * 8 + 30, y: margin + unitY * 3 },
        null,
        null,
        null
      ]
    ];
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
    const colors = this.getThemeColors(options.theme);
    
    // 背景を塗りつぶし（スケール前のサイズで）
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, baseImgWidth, baseImgHeight);

    // キー配置情報を取得
    const positions = this.getKeyPositions();

    // 指定されたレイヤーのキーを描画
    if (config.layout.length > layerIndex) {
      const layer = config.layout[layerIndex];

      for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
        for (let colIdx = 0; colIdx < positions[rowIdx]?.length || 0; colIdx++) {
          const pos = positions[rowIdx]?.[colIdx];
          if (!pos) continue;

          const keycode = layer[rowIdx]?.[colIdx] || -1;
          const label = this.keycodeToLabel(keycode, config);

          // キーを描画
          this.drawKey(ctx, pos, label, String(keycode), options, colors);
          this.drawText(ctx, pos, label, String(keycode), options, colors);
        }
      }
    }

    // レイヤー番号を装飾付きで左下に表示（スケール前のサイズで）
    this.drawLayerNumber(ctx, layerIndex, baseImgWidth, baseImgHeight, colors);
    
    return canvas;
  }

  // キーを描画
  static drawKey(
    ctx: CanvasRenderingContext2D,
    pos: {x: number, y: number},
    label: any,
    keycode: string,
    options: RenderOptions,
    colors: any
  ) {
    // キー背景を描画
    ctx.fillStyle = colors.keyNormal;
    ctx.fillRect(pos.x + 1, pos.y + 1, this.keyWidth - 2, this.keyHeight - 2);
    
    // キーボーダーを描画
    ctx.strokeStyle = colors.borderNormal;
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x, pos.y, this.keyWidth, this.keyHeight);
  }

  // テキストを描画
  static drawText(
    ctx: CanvasRenderingContext2D,
    pos: {x: number, y: number},
    label: any,
    keycode: string,
    options: RenderOptions,
    colors: any
  ) {
    if (!label.mainText) return;
    
    // メインテキストのフォントサイズ決定
    let fontSize: number;
    if (label.mainText.length === 1) {
      fontSize = 24; // 単一文字
    } else if (label.mainText.length > 8) {
      fontSize = 14; // 長いテキスト
    } else {
      fontSize = 18; // 通常サイズ
    }

    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = colors.textNormal;
    ctx.textAlign = 'center';
    
    // メインテキストを中央に配置
    const textX = pos.x + this.keyWidth / 2;
    const textY = pos.y + this.keyHeight / 2 + fontSize / 3;
    ctx.fillText(label.mainText, textX, textY);
  }

  // レイヤー番号を描画
  static drawLayerNumber(
    ctx: CanvasRenderingContext2D,
    layerIndex: number,
    width: number,
    height: number,
    colors: any
  ) {
    // レイヤー番号を左下に表示
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = colors.textSub;
    ctx.textAlign = 'left';
    ctx.fillText(`Layer ${layerIndex}`, 15, height - 15);
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
    const colors = this.getThemeColors(theme);
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

    // コンボ描画ロジック（簡略化版）
    let currentY = Math.floor((headerHeight + margin) * scale);
    validCombos.forEach((combo, index) => {
      if (currentY < scaledHeight - Math.floor(20 * scale)) {
        const text = `${combo.keys.join(' + ')} → ${combo.action}`;
        ctx.fillStyle = colors.textNormal;
        ctx.font = `${Math.floor(16 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(text, Math.floor(20 * scale), currentY);
        currentY += Math.floor(25 * scale);
      }
    });

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
    const colors = this.getThemeColors(theme);
    
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
}