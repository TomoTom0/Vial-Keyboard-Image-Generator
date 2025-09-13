// 型定義モジュール
import { KEYBOARD_CONSTANTS } from '../constants/keyboard';
import { useSettingsStore } from '../stores/settings';

// === ボタン構造体 ===

// 仮想ボタン：キーコードと表示テキストの純粋な対応
export interface VirtualButton {
  keyCode: string;    // "KC_A", "LT1", "LSFT" など
  keyText: string;    // "A", "LT1", "LSFT" など表示テキスト
  isSpecial: boolean; // 言語変更の影響を受けない特殊キー（LT, MO, OSMなど）
}

// 物理ボタン：実際のハードウェアキーの表現
export class PhysicalButton {
  constructor(
    public rawKeyCode: string,           // "KC_A", "TD(0)", "LT1(KC_SPACE)" など元のキーコード
    public main: VirtualButton,          // メイン表示用の仮想ボタン
    public sub?: {                       // サブテキスト用の仮想ボタン辞書
      tap?: VirtualButton;
      hold?: VirtualButton;
      double?: VirtualButton;
      taphold?: VirtualButton;
    }
  ) {}
  
  // ハイライト判定メソッド
  hasSubTexts(): boolean {
    return this.sub !== undefined;
  }
  
  isComboInputKey(combos?: Combo[]): boolean {
    return combos ? combos.some(combo => combo.rawKeys.includes(this.rawKeyCode)) : false;
  }
  
  // 物理ボタンを指定座標に描画
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, options: RenderOptions, combos?: any[], qualityScale: number = 1.0): void {
    const colors = getThemeColors(options.theme);
    
    // 背景色を決定
    let bgColor = colors.keyNormal;
    let borderColor = colors.borderNormal;
    
    // 空きボタンの場合
    if (this.rawKeyCode === 'KC_NO' || this.main.keyCode === 'KC_NO') {
      if (options.changeEmptyKeyColors !== false) {
        bgColor = colors.keyEmpty;
        borderColor = colors.borderEmpty;
      }
    }
    // サブテキスト付きまたはコンボ入力の場合
    else {
      const hasSubTexts = this.hasSubTexts();
      const isComboKey = this.isComboInputKey(combos);
      
      if ((hasSubTexts || isComboKey) && options.changeKeyColors !== false) {
        bgColor = colors.keySpecial;
        borderColor = colors.borderSpecial;
      }
    }
    
    // キーの背景を描画
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);
    
    // 枠線を描画
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // コンボマーカー（右上の赤い三角形）
    const isComboKey = this.isComboInputKey(combos);
    if (isComboKey && options.showComboMarkers !== false) {
      const triangleSize = 12;
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.moveTo(x + width - triangleSize, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + triangleSize);
      ctx.closePath();
      ctx.fill();
    }
    
    // テキストを描画
    this.drawText(ctx, x, y, width, height, options, combos, colors, qualityScale);
  }
  
  // テキスト描画
  private drawText(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, options: RenderOptions, combos: any[] | undefined, colors: any, qualityScale: number = 1.0): void {
    if (!this.main.keyText) return;
    
    // ハイライト判定
    const hasSubTexts = this.hasSubTexts();
    const isComboKey = this.isComboInputKey(combos);
    const shouldHighlight = (hasSubTexts && options.highlightSubtextKeys !== false) || (isComboKey && options.highlightComboKeys !== false);
    
    // settingsStoreからフォント設定を取得
    const settingsStore = useSettingsStore();
    const { fontFamily, fontSizes } = settingsStore;
    
    // メインテキストのフォントサイズを段階的に決定（文字数が多いほど小さく）
    let fontSize: number;
    if (this.main.keyText.length > 8) {
      fontSize = fontSizes.main.long; // 非常に長いテキスト
    } else if (this.main.keyText.length === 1) {
      fontSize = fontSizes.main.single; // 単一文字
    } else {
      fontSize = fontSizes.main.normal; // 2文字以上
    }

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = (shouldHighlight && options.showTextColors !== false) ? colors.textSpecial : colors.textNormal;
    ctx.textAlign = 'center';
    
    // メインテキストの位置計算（最新の実装に基づく）
    const textX = x + width / 2;
    const textY = y + height * 0.35; // 固定位置、サブテキストの有無は関係なし
    
    ctx.fillText(this.main.keyText, textX, textY);
    
    // サブテキストを描画（最新の実装に基づく）
    if (this.sub) {
      const subTexts: string[] = [];
      if (this.sub.tap) subTexts.push(this.sub.tap.keyText);
      if (this.sub.hold) subTexts.push(this.sub.hold.keyText);
      if (this.sub.double) subTexts.push(this.sub.double.keyText);
      if (this.sub.taphold) subTexts.push(this.sub.taphold.keyText);
      
      if (subTexts.length > 0) {
        ctx.fillStyle = colors.textSub;
        
        if (subTexts.length === 1) {
          // 単一サブテキストのフォントサイズを文字数に応じて決定（少し大きめ）
          let subFontSize: number;
          if (subTexts[0].length > 6) {
            subFontSize = 12; // 長いサブテキスト
          } else if (subTexts[0].length > 3) {
            subFontSize = 14; // 中程度のサブテキスト
          } else {
            subFontSize = 16; // 短いサブテキスト
          }
          
          ctx.font = `${subFontSize}px ${fontFamily}`;
          const subY = y + height * 0.75;
          ctx.fillText(subTexts[0], x + width / 2, subY);
        } else {
          // 複数サブテキスト：長いテキストがある場合は一行一つずつ表示
          const hasLongText = subTexts.some(text => text.length > 4);
          
          if (hasLongText) {
            // 長いテキストがある場合：一行一つずつ表示
            const startY = y + height * 0.65;
            const lineHeight = 12;
            
            for (let i = 0; i < subTexts.length; i++) {
              const subY = startY + (i * lineHeight);
              let fontSize = subTexts[i].length > 5 ? 9 : 11;
              
              ctx.font = `${fontSize}px ${fontFamily}`;
              ctx.fillText(subTexts[i], x + width / 2, subY);
            }
          } else {
            // 短いテキストのみ：従来の2列表示
            const startY = y + height * 0.65;
            const lineHeight = 13;
            
            for (let i = 0; i < subTexts.length; i += 2) {
              const row = Math.floor(i / 2);
              const subY = startY + (row * lineHeight);
              
              if (i + 1 < subTexts.length) {
                const leftX = x + width * 0.25;
                const rightX = x + width * 0.75;
                
                ctx.font = `${fontSizes.sub.normal}px ${fontFamily}`;
                ctx.fillText(subTexts[i], leftX, subY);
                
                ctx.font = `${fontSizes.sub.small}px ${fontFamily}`;
                ctx.fillText(subTexts[i + 1], rightX, subY);
              } else {
                ctx.font = `${fontSizes.sub.small}px ${fontFamily}`;
                ctx.fillText(subTexts[i], x + width / 2, subY);
              }
            }
          }
        }
      }
    }
  }
}

// TapDance構造体
export interface TapDance {
  index: number;                // TD(0)のindex番号
  rawData: TapDanceInfo;        // 元のVIALデータ
  tap: VirtualButton;           // タップ動作
  hold?: VirtualButton;         // ホールド動作
  double?: VirtualButton;       // ダブルタップ動作
  taphold?: VirtualButton;      // タップ+ホールド動作
}

// Combo構造体  
export class Combo {
  constructor(
    public index: number,                // 元のコンボインデックス
    public rawKeys: string[],            // 元のキー配列
    public keys: VirtualButton[],        // 組み合わせキーの仮想ボタン配列
    public action: VirtualButton,        // 実行アクションの仮想ボタン
    public description: string           // 説明テキスト
  ) {}
  
  async generateComboImage(options: RenderOptions, qualityScale: number): Promise<HTMLCanvasElement[]> {
    const { keyHeight } = KEYBOARD_CONSTANTS;
    const baseWidth = 300;
    const baseHeight = keyHeight;
    const canvases: HTMLCanvasElement[] = [];
    
    // 1x, 2x, 3x の3つの幅倍率で生成
    for (let widthScale = 1; widthScale <= 3; widthScale++) {
      const canvas = document.createElement('canvas');
      const finalWidth = baseWidth * widthScale * qualityScale;
      const finalHeight = baseHeight * qualityScale;
      
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d')!;
      
      // 品質スケールのみ適用（widthScaleは既にcanvasサイズに反映済み）
      ctx.scale(qualityScale, qualityScale);
      
      await this.draw(ctx, 0, 0, baseWidth * widthScale, baseHeight, options, 1.0);
      canvases.push(canvas);
    }
    
    return canvases;
  }

  async draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, options: RenderOptions, qualityScale: number = 1.0): Promise<void> {
    const colors = getThemeColors(options.theme);
    const { keyWidth, keyHeight } = KEYBOARD_CONSTANTS;
    
    // settingsStoreからフォント設定を取得
    const settingsStore = useSettingsStore();
    const { fontFamily, fontSizes } = settingsStore;
    const buttonHeight = keyHeight;
    const buttonWidth = keyWidth;
    const spacing = 10;
    
    let currentX = x + spacing;
    const buttonY = y + (height - buttonHeight) / 2;
    
    // インデックス番号を描画（より大きなフォント）
    ctx.fillStyle = colors.textNormal;
    ctx.font = `bold ${fontSizes.combo.index}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText(`#${this.index + 1}`, currentX, buttonY + buttonHeight / 2 + 5);
    currentX += 40;
    
    // アクションボタンを描画
    const { VialDataProcessor } = await import('./vialDataProcessor');
    const actionButton = VialDataProcessor.createPhysicalButton(this.action.keyCode);
    actionButton.draw(ctx, currentX, buttonY, buttonWidth, buttonHeight, options, [], qualityScale);
    currentX += buttonWidth + spacing;
    
    // ダッシュを描画
    ctx.fillStyle = colors.textSub;
    ctx.font = `${fontSizes.header.info}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('—', currentX + 15, buttonY + buttonHeight / 2 + 5);
    currentX += 40;
    
    // 組み合わせキーを描画
    for (const keyButton of this.keys) {
      const physicalKey = VialDataProcessor.createPhysicalButton(keyButton.keyCode);
      physicalKey.draw(ctx, currentX, buttonY, buttonWidth, buttonHeight, options, [this], qualityScale); // comboとして自分を渡す
      currentX += buttonWidth + spacing / 2;
    }
  }
}

// === ParsedVial構造体 ===

// 配置・描画情報を含む物理ボタン
export class PositionedPhysicalButton {
  constructor(
    public button: PhysicalButton,           // 物理ボタン情報
    public layoutPosition: KeyPosition,      // 配置座標（論理位置）
    public drawPosition: KeyPosition,        // 描画座標（実際の描画位置）
    public rowIndex: number,                 // 行インデックス
    public colIndex: number                  // 列インデックス
  ) {}
  
  draw(ctx: CanvasRenderingContext2D, options: RenderOptions, combos?: any[], qualityScale: number = 1.0, customPosition?: KeyPosition): void {
    const { x, y, width, height } = customPosition || this.drawPosition;
    
    // PhysicalButton.draw()メソッドを使用して描画処理を委譲
    this.button.draw(ctx, x, y, width, height, options, combos, qualityScale);
  }
}

// 解析済みレイヤー情報
export class ParsedLayer {
  constructor(
    public layerIndex: number,                      // レイヤー番号
    public buttons: PositionedPhysicalButton[],     // 配置済み物理ボタン配列
    public name?: string,                           // レイヤー名（オプション）
    public enabled?: boolean                        // レイヤー有効状態（オプション）
  ) {}
  
  // レイヤー番号を描画（元実装準拠：キーボード中央の空きスペースに配置）
  drawLayerNumber(ctx: CanvasRenderingContext2D, layerNumber: number, x: number, y: number, options: RenderOptions, qualityScale: number = 1.0): void {
    const colors = getThemeColors(options.theme);
    
    // settingsStoreからフォント設定を取得
    const settingsStore = useSettingsStore();
    const { fontFamily, fontSizes } = settingsStore;
    
    // 三行目の中央の隙間（左右ボタンの中間）に表示する座標を計算
    const { keyWidth, keyHeight, keyGap, margin } = KEYBOARD_CONSTANTS;
    const unitX = KEYBOARD_CONSTANTS.unitX;
    const unitY = KEYBOARD_CONSTANTS.unitY;
    
    // 三行目のY座標を計算
    const thirdRowY = margin + unitY * 2 + keyHeight / 2;
    
    // 左側最後のキー（V: unitX * 5.0）と右側最初のキー（M: unitX * 8.0）の中間のX座標（少し右寄り）
    const leftKeyEndX = margin + unitX * 5.0 + keyWidth;
    const rightKeyStartX = margin + unitX * 8.0;
    const centerX = (leftKeyEndX + rightKeyStartX) / 2 + 15; // 15px右にずらす
    
    ctx.font = `bold ${fontSizes.combo.title}px ${fontFamily}`;
    ctx.fillStyle = colors.textSub;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${layerNumber}`, centerX, thirdRowY);
  }
  
  draw(ctx: CanvasRenderingContext2D, options: RenderOptions, combos?: any[], qualityScale: number = 1.0): void {
    // 背景色を設定
    const colors = getThemeColors(options.theme);
    const canvasSize = this.calculateCanvasSize();
    
    ctx.fillStyle = options.backgroundColor || colors.background;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // 全ボタンを描画
    for (const positionedButton of this.buttons) {
      positionedButton.draw(ctx, options, combos, qualityScale);
    }
    
    // レイヤー番号を描画（x, y パラメータは使用されない）
    this.drawLayerNumber(ctx, this.layerIndex, 0, 0, options, qualityScale);
  }
  
  calculateCanvasSize(): {width: number, height: number} {
    // KEYBOARD_CONSTANTSを使用した統一計算式
    const { keyWidth, keyHeight, keyGap, margin, unitX, unitY } = KEYBOARD_CONSTANTS;
    
    // 実際のキー配置に合わせた計算式（最右端はunitX * 13.5）
    const contentWidth = unitX * 13.5 + keyWidth;
    const contentHeight = unitY * 3.0 + keyHeight;
    const baseImgWidth = Math.ceil(contentWidth + margin * 2);
    const baseImgHeight = Math.ceil(contentHeight + margin * 2);
    
    return {
      width: baseImgWidth,
      height: baseImgHeight
    };
  }
  
}

// 解析済みVIAL構造体
export class ParsedVial {
  constructor(
    public original: VialConfig,             // 元のVIALデータ
    public tapDances: TapDance[],           // TapDance情報
    public combos: Combo[],                 // コンボ情報
    public layers: ParsedLayer[],           // 解析済みレイヤー情報（配置・描画座標付き）
    public keyboardName?: string,           // キーボード名（オプション）
    public metadata?: {                     // メタデータ（オプション）
      generatedAt: Date;
      version?: string;
    }
  ) {}
  
  generateLayerCanvas(layerIndex: number, options: RenderOptions, qualityScale: number): HTMLCanvasElement {
    const layer = this.layers.find(l => l.layerIndex === layerIndex);
    if (!layer) {
      throw new Error(`Layer ${layerIndex} not found`);
    }
    
    const canvasSize = layer.calculateCanvasSize();
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width * qualityScale;
    canvas.height = canvasSize.height * qualityScale;
    const ctx = canvas.getContext('2d')!;
    
    // 品質スケールを適用
    ctx.scale(qualityScale, qualityScale);
    
    layer.draw(ctx, options, this.combos, qualityScale);
    return canvas;
  }
  
  generateAllLayersCanvases(options: RenderOptions, qualityScale: number): HTMLCanvasElement[] {
    return this.layers.map(layer => this.generateLayerCanvas(layer.layerIndex, options, qualityScale));
  }
  
  generateLayoutHeaderCanvas(options: RenderOptions, qualityScale: number, label?: string): HTMLCanvasElement[] {
    const canvases: HTMLCanvasElement[] = [];
    
    // KEYBOARD_CONSTANTSを使用した統一計算式
    const { keyWidth, keyHeight, keyGap, margin, unitX, unitY } = KEYBOARD_CONSTANTS;
    const baseContentWidth = unitX * 13.5 + keyWidth;
    const baseImageWidth = Math.ceil(baseContentWidth + margin * 2);
    
    // 1x, 2x, 3x の3つの幅倍率で生成
    for (let widthScale = 1; widthScale <= 3; widthScale++) {
      const width = baseImageWidth * widthScale;
      const height = 45; // 古い実装の高さに合わせる
      
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(width * qualityScale);
      canvas.height = Math.floor(height * qualityScale);
      const ctx = canvas.getContext('2d')!;
      
      // 品質スケールを適用
      ctx.scale(qualityScale, qualityScale);
      
      const colors = getThemeColors(options.theme);
      
      // settingsStoreからフォント設定を取得
      const settingsStore = useSettingsStore();
      const { fontFamily, fontSizes } = settingsStore;
      
      // 背景色を描画
      ctx.fillStyle = colors.headerBackground;
      ctx.fillRect(0, 0, width, 37);
      
      // ヘッダーテキストを描画（左側）
      ctx.font = `bold ${fontSizes.header.title}px ${fontFamily}`;
      ctx.fillStyle = colors.headerText;
      ctx.textAlign = 'left';
      ctx.fillText('LAYOUTS', 15, 28);
      
      // ラベル（ファイル名など）を右側に描画
      if (label || this.keyboardName) {
        const displayLabel = label || this.keyboardName || '';
        ctx.font = `${fontSizes.header.subtitle}px ${fontFamily}`;
        ctx.fillStyle = colors.textSub;
        ctx.textAlign = 'right';
        ctx.fillText(displayLabel, width - 15, 28);
      }
      
      // 区切り線を描画
      ctx.fillStyle = colors.borderNormal;
      ctx.fillRect(0, 37, width, 1);
      
      canvases.push(canvas);
    }
    
    return canvases;
  }
  
  async generateComboListCanvas(options: RenderOptions, qualityScale: number): Promise<HTMLCanvasElement[]> {
    const canvases: HTMLCanvasElement[] = [];
    
    // settingsStoreからフォント設定を取得
    const settingsStore = useSettingsStore();
    const { fontFamily, fontSizes } = settingsStore;
    
    // KEYBOARD_CONSTANTSを使用した統一計算式
    const { keyWidth, keyHeight, keyGap, margin, unitX, unitY } = KEYBOARD_CONSTANTS;
    const baseContentWidth = unitX * 13.5 + keyWidth;
    const baseImageWidth = Math.ceil(baseContentWidth + margin * 2);
    
    // 1x, 2x, 3x の3つの幅倍率で生成
    for (let widthScale = 1; widthScale <= 3; widthScale++) {
      const canvas = document.createElement('canvas');
      
      if (this.combos.length === 0) {
        const width = baseImageWidth * widthScale;
        const height = 50;
        
        canvas.width = width * qualityScale;
        canvas.height = height * qualityScale;
        const ctx = canvas.getContext('2d')!;
        
        ctx.scale(qualityScale, qualityScale);
        
        const colors = getThemeColors(options.theme);
        
        ctx.fillStyle = options.backgroundColor || colors.background;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = colors.textNormal;
        ctx.font = `${fontSizes.header.info}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('No combos defined', width / 2, 30);
        
        canvases.push(canvas);
        continue;
      }
      
      const width = baseImageWidth * widthScale;
      // 古い実装に合わせた高さ計算
      const headerHeight = 45;
      const lineHeight = 70;
      const columnsCount = widthScale >= 3 ? 6 : (widthScale >= 2 ? 4 : 3);
      const rows = Math.ceil(this.combos.length / columnsCount);
      const totalHeight = headerHeight + (rows * lineHeight) + margin;
      
      canvas.width = width * qualityScale;
      canvas.height = totalHeight * qualityScale;
      const ctx = canvas.getContext('2d')!;
      
      ctx.scale(qualityScale, qualityScale);
      
      const colors = getThemeColors(options.theme);
      
      // settingsStoreからフォント設定を取得
      const settingsStore = useSettingsStore();
      const { fontFamily, fontSizes } = settingsStore;
      
      // 背景
      ctx.fillStyle = options.backgroundColor || colors.background;
      ctx.fillRect(0, 0, width, totalHeight);
      
      // ヘッダー
      ctx.fillStyle = colors.headerBackground;
      ctx.fillRect(0, 0, width, headerHeight - 8);
      
      ctx.fillStyle = colors.headerText;
      ctx.font = `bold ${fontSizes.header.title}px ${fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText('COMBOS', 15, 28);
      
      // 区切り線
      ctx.fillStyle = colors.borderNormal;
      ctx.fillRect(0, headerHeight - 8, width, 1);
      
      // コンボリスト（グリッドレイアウト）
      const columnWidth = (width - 30) / columnsCount;
      for (let index = 0; index < this.combos.length; index++) {
        const combo = this.combos[index];
        const row = Math.floor(index / columnsCount);
        const col = index % columnsCount;
        const x = 15 + col * columnWidth;
        const y = headerHeight + 10 + row * lineHeight;
        
        await combo.draw(ctx, x, y, columnWidth - 10, KEYBOARD_CONSTANTS.keyHeight, options, qualityScale);
      }
      
      canvases.push(canvas);
    }
    
    return canvases;
  }
}

// === 既存の型定義 ===

// KeyOverride設定の型定義
export interface KeyOverride {
    trigger: string | number;
    replacement: string | number;
    layers: number;
    trigger_mods: number;
    negative_mod_mask: number;
    suppressed_mods: number;
    options: number;
}

// VialSettings設定の型定義
export interface VialSettings {
    [key: string]: number;
}

// TapDance設定の型定義 - [tap, hold, double_tap, tap_hold, tapping_term] - jq分析により最初の4つは文字列、最後は数値
export interface TapDanceInfo {
    readonly 0: string;  // tap keycode
    readonly 1: string;  // hold keycode
    readonly 2: string;  // double tap keycode (通常KC_NO)
    readonly 3: string;  // tap hold keycode (通常KC_NO)
    readonly 4: number;  // tapping term (ミリ秒)
    readonly length: 5;
}

// Combo設定の型定義 - [key1, key2, key3, key4, result] - jq分析により全て文字列の5要素配列
export interface ComboEntry extends Array<string> {
    0: string;  // first key
    1: string;  // second key  
    2: string;  // third key (KC_NO if unused)
    3: string;  // fourth key (KC_NO if unused)
    4: string;  // result keycode
}

// Encoder設定の型定義 - [clockwise, counter_clockwise]
export interface EncoderEntry extends Array<string> {
    0: string;  // clockwise rotation (文字列)
    1: string;  // counter-clockwise rotation (文字列)
}

// レイヤー構造の型定義
export type KeyCode = string | -1;  // キーコードは文字列または-1（無効位置）

export interface KeymapLayer {
    [rowIndex: number]: KeyCode[];  // 各行のキー配列
}

// Vial設定の型定義（完全版）
export interface VialConfig {
    version: number;
    uid: number;
    layout: KeymapLayer[];                     // レイヤー配列（-1は無効位置のみ）
    encoder_layout: string[][][];              // [layer][encoder][direction] 文字列のみ
    layout_options: number;
    macro: string[][];                         // [macro_index][step] 文字列のみ
    vial_protocol: number;
    via_protocol: number;
    tap_dance: TapDanceInfo[];                 // [tap_dance_index] 最後の要素のみ数値（タイミング）
    combo: string[][];                         // [combo_index] 文字列のみ
    key_override: KeyOverride[];               // [override_index]
    alt_repeat_key: unknown[];                 // alternate repeat key settings
    settings: VialSettings;                    // numbered settings
}

// キーの位置とサイズ
export interface KeyPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

// キーのラベル情報
export interface KeyLabel {
    mainText: string;
    subText?: string;
    subTexts?: string[]; // 複数のサブテキスト対応
    isSpecial: boolean;
}

// Combo情報
export interface ComboInfo {
    keys: string[];         // 組み合わせキー（KC_NOを除く）
    keycodes: string[];     // 組み合わせキーのキーコード（KC_NOを除く）
    keySubTexts: (string[] | undefined)[]; // 各キーのサブテキスト
    action: string;         // 実行されるアクション
    description: string;    // 表示用の説明文
    actionSubTexts?: string[]; // アクションのサブテキスト
    index: number;          // 元のインデックス番号
}

// テキスト置換ルール
export interface ReplaceRule {
    id: string;
    enabled: boolean;
    from: string;
    to: string;
    validationStatus?: 'valid' | 'invalid' | 'unknown';  // キーボード配列でのバリデーション結果
}

// 描画オプション
export interface RenderOptions {
    highlightComboKeys?: boolean;      // Combo入力キーの背景色変更 (デフォルト: true)
    highlightSubtextKeys?: boolean;    // サブテキスト付きキーの背景色変更 (デフォルト: true)
    showComboMarkers?: boolean;        // Combo入力キーの右上三角形マーカー (デフォルト: true)
    showTextColors?: boolean;          // 特別な文字色 (デフォルト: true)
    backgroundColor?: string;          // キャンバス背景色 (デフォルト: COLORS.background)
    showComboInfo?: boolean;           // Combo情報を画像に含める (デフォルト: true)
    changeKeyColors?: boolean;         // キーの背景色を変更する (デフォルト: true)
    changeEmptyKeyColors?: boolean;    // 空白ボタンの背景色を変更する (デフォルト: true)
    theme?: 'dark' | 'light';         // テーマモード (デフォルト: 'dark')
}

// カラーパレット
export const COLORS = {
    dark: {
        background: '#1c1c20',
        keyNormal: '#343a46',
        keySpecial: '#2d3446',
        keyEmpty: '#282a30',
        borderNormal: '#444c5c',
        borderSpecial: '#41497e',
        borderEmpty: '#32353d',
        textNormal: '#f0f6fc',
        textSpecial: '#9cdcfe',
        textSub: '#e5e7eb',
        headerBackground: '#2a2d35',
        headerBorder: '#4a5568',
        headerText: '#ffffff'
    },
    light: {
        background: '#f5f5f5',
        keyNormal: '#ffffff',
        keySpecial: '#e3f2fd',
        keyEmpty: '#eeeeee',
        borderNormal: '#d0d7de',
        borderSpecial: '#90caf9',
        borderEmpty: '#c6c6c6',
        textNormal: '#212529',
        textSpecial: '#1976d2',
        textSub: '#343a40',
        headerBackground: '#ffffff',
        headerBorder: '#dee2e6',
        headerText: '#212529'
    }
} as const;

// 後方互換性のために古い形式も維持
export const COLORS_LEGACY = COLORS.dark;

// カラーパレットの型定義
export type ThemeColors = {
  readonly background: string;
  readonly keyNormal: string;
  readonly keySpecial: string;
  readonly keyEmpty: string;
  readonly borderNormal: string;
  readonly borderSpecial: string;
  readonly borderEmpty: string;
  readonly textNormal: string;
  readonly textSpecial: string;
  readonly textSub: string;
  readonly headerBackground: string;
  readonly headerBorder: string;
  readonly headerText: string;
};

// テーマに基づいて色を取得するヘルパー関数
export function getThemeColors(theme: 'dark' | 'light' = 'dark'): ThemeColors {
    return COLORS[theme];
}