// 型定義モジュール
import { KEYBOARD_CONSTANTS } from '../constants/keyboard';
import { getFontConfig, getThemeColors } from './styleConfig.generated';
import { SVGRenderer } from './svgRenderer';

// サブテキストの種別に応じた色を取得（ハイライトレベルがstrongの時のみ）
function getSubTextColor(type: 'tap' | 'hold' | 'double' | 'taphold', theme: 'dark' | 'light', highlightLevel: number): string {
  // ハイライトレベルがstrong(30)未満の場合は、通常の文字色を返す
  if (highlightLevel < 30) {
    return theme === 'dark' ? '#f0f6fc' : '#212529';
  }

  if (theme === 'dark') {
    switch (type) {
      case 'tap': return '#f0f6fc'; // ほぼ白 - 通常
      case 'hold': return '#58a6ff'; // ブルー - 青系
      case 'double': return '#ff7b72'; // ライトレッド - 赤系
      case 'taphold': return '#56d364'; // グリーン - 緑系
    }
  } else {
    // ライトモード用
    switch (type) {
      case 'tap': return '#212529'; // ダークグレー - 通常
      case 'hold': return '#0969da'; // ブルー - 青系
      case 'double': return '#d1242f'; // レッド - 赤系
      case 'taphold': return '#1a7f37'; // グリーン - 緑系
    }
  }
}

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

  // SVG版の描画メソッド（Canvas版と同じ見た目）
  drawSVG(renderer: SVGRenderer, x: number, y: number, width: number, height: number, options: RenderOptions, combos?: any[], qualityScale: number = 1.0): void {
    const colors = getThemeColors(options.theme);

    // 背景色を決定（Canvas版と同じロジック）
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

    // キーの背景を描画（Canvas版と同じ）
    renderer.fillStyle = bgColor;
    renderer.fillRect(x, y, width, height);

    // 枠線を描画（Canvas版と同じ）
    renderer.strokeStyle = borderColor;
    renderer.lineWidth = 1;
    renderer.strokeRect(x, y, width, height);

    // コンボマーカー（右上の赤い三角形）（Canvas版と同じ）
    const isComboKey = this.isComboInputKey(combos);
    if (isComboKey && options.showComboMarkers !== false) {
      const triangleSize = 12;
      renderer.fillStyle = '#ff6b6b';
      renderer.beginPath();
      renderer.moveTo(x + width - triangleSize, y);
      renderer.lineTo(x + width, y);
      renderer.lineTo(x + width, y + triangleSize);
      renderer.closePath();
      renderer.fill();
    }

    // テキストを描画（Canvas版と同じ）
    this.drawTextSVG(renderer, x, y, width, height, options, combos, colors, qualityScale);
  }
  
  // テキスト描画
  private drawText(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, options: RenderOptions, combos: any[] | undefined, colors: any, qualityScale: number = 1.0): void {
    if (!this.main.keyText) return;
    
    // ハイライト判定
    const hasSubTexts = this.hasSubTexts();
    const isComboKey = this.isComboInputKey(combos);
    const shouldHighlight = (hasSubTexts && options.highlightSubtextKeys !== false) || (isComboKey && options.highlightComboKeys !== false);
    
    // フォント設定を取得
    const styleConfig = getFontConfig();
    
    // メインテキストのフォントサイズを段階的に決定（文字数が多いほど小さく）
    let fontSize: number;
    
    // 特定の1文字テキストは小さくする（マッピングファイルから取得した正確な文字）
    const smallSingleChars = ['▽']; // KC_TRNS（透明キー）
    
    if (this.main.keyText.length > 8) {
      fontSize = styleConfig.fontSizes.main.long; // 非常に長いテキスト
    } else if (this.main.keyText.length === 1) {
      if (smallSingleChars.includes(this.main.keyText)) {
        fontSize = styleConfig.fontSizes.main.normal; // 特定の1文字は通常サイズ
      } else {
        fontSize = styleConfig.fontSizes.main.single; // 通常の単一文字
      }
    } else {
      fontSize = styleConfig.fontSizes.main.normal; // 2文字以上
    }

    ctx.font = `${fontSize}px ${getFontConfig().fontFamily}`;
    ctx.fillStyle = (shouldHighlight && options.showTextColors !== false) ? colors.textSpecial : colors.textNormal;
    ctx.textAlign = 'center';
    
    // メインテキストの位置計算（最新の実装に基づく）
    const textX = x + width / 2;
    const textY = y + height * 0.35; // 固定位置、サブテキストの有無は関係なし
    
    ctx.fillText(this.main.keyText, textX, textY);
    
    // サブテキストを描画（種別情報も含めて）
    if (this.sub) {
      const subTexts: {text: string, type: 'tap' | 'hold' | 'double' | 'taphold'}[] = [];
      if (this.sub.tap) subTexts.push({text: this.sub.tap.keyText, type: 'tap'});
      if (this.sub.hold) subTexts.push({text: this.sub.hold.keyText, type: 'hold'});
      if (this.sub.double) subTexts.push({text: this.sub.double.keyText, type: 'double'});
      if (this.sub.taphold) subTexts.push({text: this.sub.taphold.keyText, type: 'taphold'});

      if (subTexts.length > 0) {
        // サブテキスト種別に応じた色を取得
        
        // 等幅フォントの文字幅を計算（おおよその値）
        const getCharWidth = (fontSize: number): number => fontSize * 0.6;
        
        // テキスト幅に基づいて最適なフォントサイズを計算
        const calculateOptimalFontSize = (text: string, maxWidth: number): number => {
          const targetSizes = [styleConfig.fontSizes.sub.normal, styleConfig.fontSizes.sub.small, styleConfig.fontSizes.sub.mini];

          for (const size of targetSizes) {
            const estimatedWidth = text.length * getCharWidth(size);
            if (estimatedWidth <= maxWidth) {
              return size;
            }
          }
          return styleConfig.fontSizes.sub.mini; // 最小サイズ
        };

        if (subTexts.length === 1) {
          // 単一サブテキスト：幅に応じて動的にサイズ調整
          const availableWidth = width * 0.9; // 少し余裕を持つ
          const optimalFontSize = calculateOptimalFontSize(subTexts[0].text, availableWidth);

          ctx.fillStyle = getSubTextColor(subTexts[0].type, options.theme, options.highlightLevel || 30);
          ctx.font = `${optimalFontSize}px ${styleConfig.fontFamily}`;
          const subY = y + height * 0.75;
          ctx.fillText(subTexts[0].text, x + width / 2, subY);
          
        } else if (subTexts.length === 2) {
          // 2個の場合は積極的に2行レイアウトを使用
          const availableWidth = width * 0.9;
          const startY = y + height * 0.65;
          const lineHeight = 16; // 行間を少し広げる
          
          for (let i = 0; i < subTexts.length; i++) {
            const optimalFontSize = calculateOptimalFontSize(subTexts[i].text, availableWidth);
            ctx.fillStyle = getSubTextColor(subTexts[i].type, options.theme, options.highlightLevel || 30);
            ctx.font = `${optimalFontSize}px ${styleConfig.fontFamily}`;
            const subY = startY + (i * lineHeight);
            ctx.fillText(subTexts[i].text, x + width / 2, subY);
          }
          
        } else if (subTexts.length === 3) {
          // 3個の場合：文字数に基づいて最適な改行位置を決定
          const displayTexts = subTexts.slice(0, 3);
          const startY = y + height * 0.65;
          const lineHeight = 16;
          const leftAvailableWidth = width * 0.4;
          const rightAvailableWidth = width * 0.4;
          const centerAvailableWidth = width * 0.9;
          
          // 各要素の文字数を取得
          const lengths = displayTexts.map(item => item.text.length);
          
          // パターン1: [2個][1個] と パターン2: [1個][2個] の総文字数を比較
          const pattern1TotalChars = lengths[0] + lengths[1]; // 1行目2個
          const pattern2TotalChars = lengths[1] + lengths[2]; // 2行目2個
          
          // より文字数が少ない方を2個並べる行にする
          const usePattern1 = pattern1TotalChars <= pattern2TotalChars;
          
          if (usePattern1) {
            // パターン1: [要素0, 要素1] / [要素2]
            // 1行目：左右に2個
            const leftFontSize = calculateOptimalFontSize(displayTexts[0].text, leftAvailableWidth);
            ctx.fillStyle = getSubTextColor(displayTexts[0].type, options.theme, options.highlightLevel || 30);
            ctx.font = `${leftFontSize}px ${styleConfig.fontFamily}`;
            ctx.fillText(displayTexts[0].text, x + width * 0.25, startY);

            const rightFontSize = calculateOptimalFontSize(displayTexts[1].text, rightAvailableWidth);
            ctx.fillStyle = getSubTextColor(displayTexts[1].type, options.theme, options.highlightLevel || 30);
            ctx.font = `${rightFontSize}px ${styleConfig.fontFamily}`;
            ctx.fillText(displayTexts[1].text, x + width * 0.75, startY);

            // 2行目：中央に1個
            const centerFontSize = calculateOptimalFontSize(displayTexts[2].text, centerAvailableWidth);
            ctx.fillStyle = getSubTextColor(displayTexts[2].type, options.theme, options.highlightLevel || 30);
            ctx.font = `${centerFontSize}px ${styleConfig.fontFamily}`;
            ctx.fillText(displayTexts[2].text, x + width / 2, startY + lineHeight);
          } else {
            // パターン2: [要素0] / [要素1, 要素2]
            // 1行目：中央に1個
            const topCenterFontSize = calculateOptimalFontSize(displayTexts[0].text, centerAvailableWidth);
            ctx.fillStyle = getSubTextColor(displayTexts[0].type, options.theme, options.highlightLevel || 30);
            ctx.font = `${topCenterFontSize}px ${styleConfig.fontFamily}`;
            ctx.fillText(displayTexts[0].text, x + width / 2, startY);

            // 2行目：左右に2個
            const bottomLeftFontSize = calculateOptimalFontSize(displayTexts[1].text, leftAvailableWidth);
            ctx.fillStyle = getSubTextColor(displayTexts[1].type, options.theme, options.highlightLevel || 30);
            ctx.font = `${bottomLeftFontSize}px ${styleConfig.fontFamily}`;
            ctx.fillText(displayTexts[1].text, x + width * 0.25, startY + lineHeight);

            const bottomRightFontSize = calculateOptimalFontSize(displayTexts[2].text, rightAvailableWidth);
            ctx.fillStyle = getSubTextColor(displayTexts[2].type, options.theme, options.highlightLevel || 30);
            ctx.font = `${bottomRightFontSize}px ${styleConfig.fontFamily}`;
            ctx.fillText(displayTexts[2].text, x + width * 0.75, startY + lineHeight);
          }
          
        } else if (subTexts.length > 3) {
          // 4個以上の場合：最大4個を2行×2列に納める
          const displayTexts = subTexts.slice(0, 4); // 最大4個まで
          const startY = y + height * 0.65;
          const lineHeight = 16;
          const leftAvailableWidth = width * 0.4;
          const rightAvailableWidth = width * 0.4;
          
          for (let i = 0; i < displayTexts.length; i += 2) {
            const row = Math.floor(i / 2);
            const subY = startY + (row * lineHeight);
            
            if (i + 1 < displayTexts.length) {
              // 左側
              const leftX = x + width * 0.25;
              const leftFontSize = calculateOptimalFontSize(displayTexts[i].text, leftAvailableWidth);
              ctx.fillStyle = getSubTextColor(displayTexts[i].type, options.theme, options.highlightLevel || 30);
              ctx.font = `${leftFontSize}px ${styleConfig.fontFamily}`;
              ctx.fillText(displayTexts[i].text, leftX, subY);

              // 右側
              const rightX = x + width * 0.75;
              const rightFontSize = calculateOptimalFontSize(displayTexts[i + 1].text, rightAvailableWidth);
              ctx.fillStyle = getSubTextColor(displayTexts[i + 1].type, options.theme, options.highlightLevel || 30);
              ctx.font = `${rightFontSize}px ${styleConfig.fontFamily}`;
              ctx.fillText(displayTexts[i + 1].text, rightX, subY);
            } else {
              // 中央（奇数の最後）- 通常は発生しない
              const centerFontSize = calculateOptimalFontSize(displayTexts[i].text, width * 0.9);
              ctx.fillStyle = getSubTextColor(displayTexts[i].type, options.theme, options.highlightLevel || 30);
              ctx.font = `${centerFontSize}px ${styleConfig.fontFamily}`;
              ctx.fillText(displayTexts[i].text, x + width / 2, subY);
            }
          }
        }
      }
    }
  }

  // SVG版のテキスト描画（Canvas版と完全に同じロジック）
  private drawTextSVG(renderer: SVGRenderer, x: number, y: number, width: number, height: number, options: RenderOptions, combos: any[] | undefined, colors: any, qualityScale: number = 1.0): void {
    if (!this.main.keyText) return;

    // ハイライト判定
    const hasSubTexts = this.hasSubTexts();
    const isComboKey = this.isComboInputKey(combos);
    const shouldHighlight = (hasSubTexts && options.highlightSubtextKeys !== false) || (isComboKey && options.highlightComboKeys !== false);

    // フォント設定を取得
    const styleConfig = getFontConfig();

    // メインテキストのフォントサイズを段階的に決定（文字数が多いほど小さく）
    let fontSize: number;

    // 特定の1文字テキストは小さくする（マッピングファイルから取得した正確な文字）
    const smallSingleChars = ['▽']; // KC_TRNS（透明キー）

    if (this.main.keyText.length > 8) {
      fontSize = styleConfig.fontSizes.main.long; // 非常に長いテキスト
    } else if (this.main.keyText.length === 1) {
      if (smallSingleChars.includes(this.main.keyText)) {
        fontSize = styleConfig.fontSizes.main.normal; // 特定の1文字は通常サイズ
      } else {
        fontSize = styleConfig.fontSizes.main.single; // 通常の単一文字
      }
    } else {
      fontSize = styleConfig.fontSizes.main.normal; // 2文字以上
    }

    renderer.font = `${fontSize}px ${getFontConfig().fontFamily}`;
    renderer.fillStyle = (shouldHighlight && options.showTextColors !== false) ? colors.textSpecial : colors.textNormal;
    renderer.textAlign = 'center';

    // メインテキストの位置計算（最新の実装に基づく）
    const textX = x + width / 2;
    const textY = y + height * 0.35; // 固定位置、サブテキストの有無は関係なし

    renderer.fillText(this.main.keyText, textX, textY);

    // サブテキストを描画（種別情報も含めて）
    if (this.sub) {
      const subTexts: {text: string, type: 'tap' | 'hold' | 'double' | 'taphold'}[] = [];
      if (this.sub.tap) subTexts.push({text: this.sub.tap.keyText, type: 'tap'});
      if (this.sub.hold) subTexts.push({text: this.sub.hold.keyText, type: 'hold'});
      if (this.sub.double) subTexts.push({text: this.sub.double.keyText, type: 'double'});
      if (this.sub.taphold) subTexts.push({text: this.sub.taphold.keyText, type: 'taphold'});

      if (subTexts.length > 0) {
        // サブテキスト種別に応じた色を取得

        // 等幅フォントの文字幅を計算（おおよその値）
        const getCharWidth = (fontSize: number): number => fontSize * 0.6;

        // テキスト幅に基づいて最適なフォントサイズを計算
        const calculateOptimalFontSize = (text: string, maxWidth: number): number => {
          const targetSizes = [styleConfig.fontSizes.sub.normal, styleConfig.fontSizes.sub.small, styleConfig.fontSizes.sub.mini];

          for (const size of targetSizes) {
            const estimatedWidth = text.length * getCharWidth(size);
            if (estimatedWidth <= maxWidth) {
              return size;
            }
          }
          return styleConfig.fontSizes.sub.mini; // 最小サイズ
        };

        if (subTexts.length === 1) {
          // 単一サブテキスト：幅に応じて動的にサイズ調整
          const availableWidth = width * 0.9; // 少し余裕を持つ
          const optimalFontSize = calculateOptimalFontSize(subTexts[0].text, availableWidth);

          renderer.fillStyle = getSubTextColor(subTexts[0].type, options.theme, options.highlightLevel || 30);
          renderer.font = `${optimalFontSize}px ${styleConfig.fontFamily}`;
          const subY = y + height * 0.75;
          renderer.fillText(subTexts[0].text, x + width / 2, subY);

        } else if (subTexts.length === 2) {
          // 2個の場合は積極的に2行レイアウトを使用
          const availableWidth = width * 0.9;
          const startY = y + height * 0.65;
          const lineHeight = 16; // 行間を少し広げる

          for (let i = 0; i < subTexts.length; i++) {
            const optimalFontSize = calculateOptimalFontSize(subTexts[i].text, availableWidth);
            renderer.fillStyle = getSubTextColor(subTexts[i].type, options.theme, options.highlightLevel || 30);
            renderer.font = `${optimalFontSize}px ${styleConfig.fontFamily}`;
            const subY = startY + (i * lineHeight);
            renderer.fillText(subTexts[i].text, x + width / 2, subY);
          }

        } else if (subTexts.length === 3) {
          // 3個の場合：文字数に基づいて最適な改行位置を決定
          const displayTexts = subTexts.slice(0, 3);
          const startY = y + height * 0.65;
          const lineHeight = 16;
          const leftAvailableWidth = width * 0.4;
          const rightAvailableWidth = width * 0.4;
          const centerAvailableWidth = width * 0.9;

          // 各要素の文字数を取得
          const lengths = displayTexts.map(item => item.text.length);

          // パターン1: [2個][1個] と パターン2: [1個][2個] の総文字数を比較
          const pattern1TotalChars = lengths[0] + lengths[1]; // 1行目2個
          const pattern2TotalChars = lengths[1] + lengths[2]; // 2行目2個

          // より文字数が少ない方を2個並べる行にする
          const usePattern1 = pattern1TotalChars <= pattern2TotalChars;

          if (usePattern1) {
            // パターン1: [要素0, 要素1] / [要素2]
            // 1行目：左右に2個
            const leftFontSize = calculateOptimalFontSize(displayTexts[0].text, leftAvailableWidth);
            renderer.fillStyle = getSubTextColor(displayTexts[0].type, options.theme, options.highlightLevel || 30);
            renderer.font = `${leftFontSize}px ${styleConfig.fontFamily}`;
            renderer.fillText(displayTexts[0].text, x + width * 0.25, startY);

            const rightFontSize = calculateOptimalFontSize(displayTexts[1].text, rightAvailableWidth);
            renderer.fillStyle = getSubTextColor(displayTexts[1].type, options.theme, options.highlightLevel || 30);
            renderer.font = `${rightFontSize}px ${styleConfig.fontFamily}`;
            renderer.fillText(displayTexts[1].text, x + width * 0.75, startY);

            // 2行目：中央に1個
            const centerFontSize = calculateOptimalFontSize(displayTexts[2].text, centerAvailableWidth);
            renderer.fillStyle = getSubTextColor(displayTexts[2].type, options.theme, options.highlightLevel || 30);
            renderer.font = `${centerFontSize}px ${styleConfig.fontFamily}`;
            renderer.fillText(displayTexts[2].text, x + width / 2, startY + lineHeight);
          } else {
            // パターン2: [要素0] / [要素1, 要素2]
            // 1行目：中央に1個
            const topCenterFontSize = calculateOptimalFontSize(displayTexts[0].text, centerAvailableWidth);
            renderer.fillStyle = getSubTextColor(displayTexts[0].type, options.theme, options.highlightLevel || 30);
            renderer.font = `${topCenterFontSize}px ${styleConfig.fontFamily}`;
            renderer.fillText(displayTexts[0].text, x + width / 2, startY);

            // 2行目：左右に2個
            const bottomLeftFontSize = calculateOptimalFontSize(displayTexts[1].text, leftAvailableWidth);
            renderer.fillStyle = getSubTextColor(displayTexts[1].type, options.theme, options.highlightLevel || 30);
            renderer.font = `${bottomLeftFontSize}px ${styleConfig.fontFamily}`;
            renderer.fillText(displayTexts[1].text, x + width * 0.25, startY + lineHeight);

            const bottomRightFontSize = calculateOptimalFontSize(displayTexts[2].text, rightAvailableWidth);
            renderer.fillStyle = getSubTextColor(displayTexts[2].type, options.theme, options.highlightLevel || 30);
            renderer.font = `${bottomRightFontSize}px ${styleConfig.fontFamily}`;
            renderer.fillText(displayTexts[2].text, x + width * 0.75, startY + lineHeight);
          }

        } else if (subTexts.length > 3) {
          // 4個以上の場合：最大4個を2行×2列に納める
          const displayTexts = subTexts.slice(0, 4); // 最大4個まで
          const startY = y + height * 0.65;
          const lineHeight = 16;
          const leftAvailableWidth = width * 0.4;
          const rightAvailableWidth = width * 0.4;

          for (let i = 0; i < displayTexts.length; i += 2) {
            const row = Math.floor(i / 2);
            const subY = startY + (row * lineHeight);

            if (i + 1 < displayTexts.length) {
              // 左側
              const leftX = x + width * 0.25;
              const leftFontSize = calculateOptimalFontSize(displayTexts[i].text, leftAvailableWidth);
              renderer.fillStyle = getSubTextColor(displayTexts[i].type, options.theme, options.highlightLevel || 30);
              renderer.font = `${leftFontSize}px ${styleConfig.fontFamily}`;
              renderer.fillText(displayTexts[i].text, leftX, subY);

              // 右側
              const rightX = x + width * 0.75;
              const rightFontSize = calculateOptimalFontSize(displayTexts[i + 1].text, rightAvailableWidth);
              renderer.fillStyle = getSubTextColor(displayTexts[i + 1].type, options.theme, options.highlightLevel || 30);
              renderer.font = `${rightFontSize}px ${styleConfig.fontFamily}`;
              renderer.fillText(displayTexts[i + 1].text, rightX, subY);
            } else {
              // 中央（奇数の最後）- 通常は発生しない
              const centerFontSize = calculateOptimalFontSize(displayTexts[i].text, width * 0.9);
              renderer.fillStyle = getSubTextColor(displayTexts[i].type, options.theme, options.highlightLevel || 30);
              renderer.font = `${centerFontSize}px ${styleConfig.fontFamily}`;
              renderer.fillText(displayTexts[i].text, x + width / 2, subY);
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
    const styleConfig = getFontConfig();
    const buttonHeight = keyHeight;
    const buttonWidth = keyWidth;
    const spacing = 10;
    
    let currentX = x + spacing;
    const buttonY = y + (height - buttonHeight) / 2;
    
    // インデックス番号を描画（より大きなフォント）
    ctx.fillStyle = colors.textNormal;
    ctx.font = `bold ${styleConfig.fontSizes.combo.index}px ${styleConfig.headerFontFamily}`;
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
    ctx.font = `${styleConfig.fontSizes.combo.content}px ${styleConfig.fontFamily}`;
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

  async drawSVG(renderer: SVGRenderer, x: number, y: number, width: number, height: number, options: RenderOptions, qualityScale: number = 1.0): Promise<void> {
    const colors = getThemeColors(options.theme);
    const { keyWidth, keyHeight } = KEYBOARD_CONSTANTS;
    const styleConfig = getFontConfig();
    const buttonHeight = keyHeight;
    const buttonWidth = keyWidth;
    const spacing = 10;

    let currentX = x + spacing;
    const buttonY = y + (height - buttonHeight) / 2;

    // インデックス番号を描画（より大きなフォント）
    renderer.fillStyle = colors.textNormal;
    renderer.font = `bold ${styleConfig.fontSizes.combo.index}px ${styleConfig.headerFontFamily}`;
    renderer.textAlign = 'left';
    renderer.fillText(`#${this.index + 1}`, currentX, buttonY + buttonHeight / 2 + 5);
    currentX += 40;

    // アクションボタンを描画
    const { VialDataProcessor } = await import('./vialDataProcessor');
    const actionButton = VialDataProcessor.createPhysicalButton(this.action.keyCode);
    actionButton.drawSVG(renderer, currentX, buttonY, buttonWidth, buttonHeight, options, [], qualityScale);
    currentX += buttonWidth + spacing;

    // ダッシュを描画
    renderer.fillStyle = colors.textSub;
    renderer.font = `${styleConfig.fontSizes.combo.content}px ${styleConfig.fontFamily}`;
    renderer.textAlign = 'center';
    renderer.fillText('—', currentX + 15, buttonY + buttonHeight / 2 + 5);
    currentX += 40;

    // 組み合わせキーを描画
    for (const keyButton of this.keys) {
      const physicalKey = VialDataProcessor.createPhysicalButton(keyButton.keyCode);
      physicalKey.drawSVG(renderer, currentX, buttonY, buttonWidth, buttonHeight, options, [this], qualityScale); // comboとして自分を渡す
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

  drawSVG(renderer: SVGRenderer, options: RenderOptions, combos?: any[], qualityScale: number = 1.0, customPosition?: KeyPosition): void {
    const { x, y, width, height } = customPosition || this.drawPosition;

    // PhysicalButton.drawSVG()メソッドを使用して描画処理を委譲
    this.button.drawSVG(renderer, x, y, width, height, options, combos, qualityScale);
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
    const styleConfig = getFontConfig();
    
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
    
    ctx.font = `bold ${styleConfig.fontSizes.combo.title}px ${styleConfig.headerFontFamily}`;
    ctx.fillStyle = colors.textSub;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${layerNumber}`, centerX, thirdRowY);
  }

  drawLayerNumberSVG(renderer: SVGRenderer, layerNumber: number, x: number, y: number, options: RenderOptions, qualityScale: number = 1.0): void {
    const colors = getThemeColors(options.theme);
    const styleConfig = getFontConfig();

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

    renderer.font = `bold ${styleConfig.fontSizes.combo.title}px ${styleConfig.headerFontFamily}`;
    renderer.fillStyle = colors.textSub;
    renderer.textAlign = 'center';
    renderer.textBaseline = 'middle';
    renderer.fillText(`#${layerNumber}`, centerX, thirdRowY);
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

    // 色の説明ラベルを右下に追加（ハイライトレベルがstrong以上の時のみ）
    if (options.highlightLevel >= 30) {
      this.drawColorLegend(ctx, canvasSize, options, qualityScale);
    }
  }

  drawSVG(renderer: SVGRenderer, options: RenderOptions, combos?: any[], qualityScale: number = 1.0): void {
    // 背景色を設定
    const colors = getThemeColors(options.theme);
    const canvasSize = this.calculateCanvasSize();

    renderer.fillStyle = options.backgroundColor || colors.background;
    renderer.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // 全ボタンを描画
    for (const positionedButton of this.buttons) {
      positionedButton.drawSVG(renderer, options, combos, qualityScale);
    }

    // レイヤー番号を描画
    this.drawLayerNumberSVG(renderer, this.layerIndex, 0, 0, options, qualityScale);

    // 色の説明ラベルを右下に追加（ハイライトレベルがstrong以上の時のみ）
    if (options.highlightLevel >= 30) {
      this.drawColorLegendSVG(renderer, canvasSize, options, qualityScale);
    }
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

  // 色の説明ラベルを右下に描画
  drawColorLegend(ctx: CanvasRenderingContext2D, canvasSize: {width: number, height: number}, options: RenderOptions, qualityScale: number): void {
    // ハイライトレベルがstrong未満の場合は何も描画しない
    if (options.highlightLevel < 30) {
      return;
    }

    const styleConfig = getFontConfig();
    const fontSize = styleConfig.fontSizes.sub.small;
    const lineHeight = fontSize + 2;
    const margin = 8;

    // 説明する色の種類（tapは通常色なので除外）
    const colorTypes: Array<{type: 'hold' | 'double' | 'taphold', label: string}> = [
      {type: 'hold', label: 'HOLD'},
      {type: 'double', label: 'DOUBLE'},
      {type: 'taphold', label: 'TAP+HOLD'}
    ];

    // 開始位置（右下から逆算）
    const startY = canvasSize.height - margin - (colorTypes.length * lineHeight);
    const startX = canvasSize.width - margin - 80; // 80は推定幅

    ctx.font = `${fontSize}px ${styleConfig.fontFamily}`;
    ctx.textAlign = 'right';

    for (let i = 0; i < colorTypes.length; i++) {
      const {type, label} = colorTypes[i];
      const y = startY + (i * lineHeight);

      ctx.fillStyle = getSubTextColor(type, options.theme || 'dark');
      ctx.fillText(label, startX, y);
    }
  }

  drawColorLegendSVG(renderer: SVGRenderer, canvasSize: {width: number, height: number}, options: RenderOptions, qualityScale: number): void {
    // ハイライトレベルがstrong未満の場合は何も描画しない
    if (options.highlightLevel < 30) {
      return;
    }

    const styleConfig = getFontConfig();
    const fontSize = styleConfig.fontSizes.sub.small;
    const lineHeight = fontSize + 2;
    const margin = 8;

    // 説明する色の種類（tapは通常色なので除外）
    const colorTypes: Array<{type: 'hold' | 'double' | 'taphold', label: string}> = [
      {type: 'hold', label: 'HOLD'},
      {type: 'double', label: 'DOUBLE'},
      {type: 'taphold', label: 'TAP+HOLD'}
    ];

    // 開始位置（右下から逆算）
    const startY = canvasSize.height - margin - (colorTypes.length * lineHeight);
    const startX = canvasSize.width - margin - 80; // 80は推定幅

    renderer.font = `${fontSize}px ${styleConfig.fontFamily}`;
    renderer.textAlign = 'right';

    for (let i = 0; i < colorTypes.length; i++) {
      const {type, label} = colorTypes[i];
      const y = startY + (i * lineHeight);

      renderer.fillStyle = getSubTextColor(type, options.theme || 'dark');
      renderer.fillText(label, startX, y);
    }
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
    },
    public vilContent?: string              // 元のVILファイルの内容（JSON文字列）
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

  generateLayerSVG(layerIndex: number, options: RenderOptions, qualityScale: number): string {
    const layer = this.layers.find(l => l.layerIndex === layerIndex);
    if (!layer) {
      throw new Error(`Layer ${layerIndex} not found`);
    }

    const canvasSize = layer.calculateCanvasSize();
    const renderer = new SVGRenderer(canvasSize.width, canvasSize.height);

    // VILデータが利用可能な場合は埋め込み
    if (this.vilContent) {
      renderer.setVilData(this.vilContent);
    }

    layer.drawSVG(renderer, options, this.combos, qualityScale);
    return renderer.toSVG();
  }
  
  generateAllLayersCanvases(options: RenderOptions, qualityScale: number): HTMLCanvasElement[] {
    return this.layers.map(layer => this.generateLayerCanvas(layer.layerIndex, options, qualityScale));
  }
  
  generateLayoutHeaderCanvas(options: RenderOptions, qualityScale: number, label?: string): HTMLCanvasElement[] {
    const canvases: HTMLCanvasElement[] = [];
    const styleConfig = getFontConfig();
    
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
      
      // 背景色を描画
      ctx.fillStyle = colors.headerBackground;
      ctx.fillRect(0, 0, width, 37);
      
      // ヘッダーテキストを描画（左側）
      ctx.font = `bold ${styleConfig.fontSizes.header.title}px ${styleConfig.headerFontFamily}`;
      ctx.fillStyle = colors.headerText;
      ctx.textAlign = 'left';
      ctx.fillText('LAYOUTS', 15, 28);
      
      // ラベル（ファイル名など）を右側に描画
      if (label || this.keyboardName) {
        const displayLabel = label || this.keyboardName || '';
        ctx.font = `${styleConfig.fontSizes.header.subtitle}px ${styleConfig.headerFontFamily}`;
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

  generateLayoutHeaderSVG(options: RenderOptions, qualityScale: number, label?: string): string[] {
    const svgStrings: string[] = [];
    const styleConfig = getFontConfig();

    // KEYBOARD_CONSTANTSを使用した統一計算式
    const { keyWidth, keyHeight, keyGap, margin, unitX, unitY } = KEYBOARD_CONSTANTS;
    const baseContentWidth = unitX * 13.5 + keyWidth;
    const baseImageWidth = Math.ceil(baseContentWidth + margin * 2);

    // 1x, 2x, 3x の3つの幅倍率で生成
    for (let widthScale = 1; widthScale <= 3; widthScale++) {
      const width = baseImageWidth * widthScale;
      const height = 45; // 古い実装の高さに合わせる

      const renderer = new SVGRenderer(width, height);

      // VILデータが利用可能な場合は埋め込み
      if (this.vilContent) {
        renderer.setVilData(this.vilContent);
      }

      const colors = getThemeColors(options.theme);

      // 背景色を描画
      renderer.fillStyle = colors.headerBackground;
      renderer.fillRect(0, 0, width, height);

      // ヘッダーテキストを描画（左側）
      renderer.font = `bold ${styleConfig.fontSizes.header.title}px ${styleConfig.headerFontFamily}`;
      renderer.fillStyle = colors.headerText;
      renderer.textAlign = 'left';
      renderer.fillText('LAYOUTS', 15, 28);

      // ラベル（ファイル名など）を右側に描画
      if (label || this.keyboardName) {
        const displayLabel = label || this.keyboardName || '';
        renderer.font = `${styleConfig.fontSizes.header.subtitle}px ${styleConfig.headerFontFamily}`;
        renderer.fillStyle = colors.textSub;
        renderer.textAlign = 'right';
        renderer.fillText(displayLabel, width - 15, 28);
      }

      // 区切り線を描画
      renderer.fillStyle = colors.borderNormal;
      renderer.fillRect(0, 44, width, 1);

      svgStrings.push(renderer.toSVG());
    }

    return svgStrings;
  }

  async generateComboListCanvas(options: RenderOptions, qualityScale: number): Promise<HTMLCanvasElement[]> {
    // コンボがない場合は空の配列を返す（画像を生成しない）
    if (this.combos.length === 0) {
      return [];
    }
    
    const canvases: HTMLCanvasElement[] = [];
    const styleConfig = getFontConfig();
    
    // KEYBOARD_CONSTANTSを使用した統一計算式
    const { keyWidth, keyHeight, keyGap, margin, unitX, unitY } = KEYBOARD_CONSTANTS;
    const baseContentWidth = unitX * 13.5 + keyWidth;
    const baseImageWidth = Math.ceil(baseContentWidth + margin * 2);
    
    // 1x, 2x, 3x の3つの幅倍率で生成
    for (let widthScale = 1; widthScale <= 3; widthScale++) {
      const canvas = document.createElement('canvas');

      const width = baseImageWidth * widthScale;
      // 古い実装に合わせた高さ計算
      const headerHeight = 45;
      const lineHeight = 70;
      const columnsCount = 2;
      const rows = Math.ceil(this.combos.length / columnsCount);
      const totalHeight = headerHeight + (rows * lineHeight) + margin;
      
      canvas.width = width * qualityScale;
      canvas.height = totalHeight * qualityScale;
      const ctx = canvas.getContext('2d')!;
      
      ctx.scale(qualityScale, qualityScale);
      
      const colors = getThemeColors(options.theme);
      
      // 背景
      ctx.fillStyle = options.backgroundColor || colors.background;
      ctx.fillRect(0, 0, width, totalHeight);
      
      // ヘッダー
      ctx.fillStyle = colors.headerBackground;
      ctx.fillRect(0, 0, width, headerHeight - 8);
      
      ctx.fillStyle = colors.headerText;
      ctx.font = `bold ${styleConfig.fontSizes.header.title}px ${styleConfig.headerFontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText('COMBOS', 15, 28);
      
      // 区切り線
      ctx.fillStyle = colors.borderNormal;
      ctx.fillRect(0, headerHeight - 8, width, 1);
      
      // コンボリスト（2列固定レイアウト）
      const columnWidth = (width - 30) / 2;
      for (let index = 0; index < this.combos.length; index++) {
        const combo = this.combos[index];
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = 15 + col * columnWidth;
        const y = headerHeight + 10 + row * lineHeight;

        await combo.draw(ctx, x, y, columnWidth - 10, KEYBOARD_CONSTANTS.keyHeight, options, qualityScale);
      }
      
      canvases.push(canvas);
    }
    
    return canvases;
  }

  async generateComboListSVG(options: RenderOptions, qualityScale: number): Promise<string[]> {
    // コンボがない場合は空の配列を返す（画像を生成しない）
    if (this.combos.length === 0) {
      return [];
    }

    const svgStrings: string[] = [];
    const styleConfig = getFontConfig();

    // KEYBOARD_CONSTANTSを使用した統一計算式
    const { keyWidth, keyHeight, keyGap, margin, unitX, unitY } = KEYBOARD_CONSTANTS;
    const baseContentWidth = unitX * 13.5 + keyWidth;
    const baseImageWidth = Math.ceil(baseContentWidth + margin * 2);

    // 1x, 2x, 3x の3つの幅倍率で生成
    for (let widthScale = 1; widthScale <= 3; widthScale++) {
      const width = baseImageWidth * widthScale;
      // 古い実装に合わせた高さ計算
      const headerHeight = 45;
      const lineHeight = 70;
      const columnsCount = 2;
      const rows = Math.ceil(this.combos.length / columnsCount);
      const totalHeight = headerHeight + (rows * lineHeight) + margin;

      const renderer = new SVGRenderer(width, totalHeight);

      // VILデータが利用可能な場合は埋め込み
      if (this.vilContent) {
        renderer.setVilData(this.vilContent);
      }

      const colors = getThemeColors(options.theme);

      // 背景
      renderer.fillStyle = options.backgroundColor || colors.background;
      renderer.fillRect(0, 0, width, totalHeight);

      // ヘッダー
      renderer.fillStyle = colors.headerBackground;
      renderer.fillRect(0, 0, width, headerHeight - 8);

      renderer.fillStyle = colors.headerText;
      renderer.font = `bold ${styleConfig.fontSizes.header.title}px ${styleConfig.headerFontFamily}`;
      renderer.textAlign = 'left';
      renderer.fillText('COMBOS', 15, 28);

      // 区切り線
      renderer.fillStyle = colors.borderNormal;
      renderer.fillRect(0, headerHeight - 8, width, 1);

      // コンボリスト（2列固定レイアウト）
      const columnWidth = (width - 30) / 2;
      for (let index = 0; index < this.combos.length; index++) {
        const combo = this.combos[index];
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = 15 + col * columnWidth;
        const y = headerHeight + 10 + row * lineHeight;

        await combo.drawSVG(renderer, x, y, columnWidth - 10, KEYBOARD_CONSTANTS.keyHeight, options, qualityScale);
      }

      svgStrings.push(renderer.toSVG());
    }

    return svgStrings;
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
    backgroundColor?: string;          // キャンバス背景色 (デフォルト: getThemeColors().background)
    showComboInfo?: boolean;           // Combo情報を画像に含める (デフォルト: true)
    changeKeyColors?: boolean;         // キーの背景色を変更する (デフォルト: true)
    changeEmptyKeyColors?: boolean;    // 空白ボタンの背景色を変更する (デフォルト: true)
    theme?: 'dark' | 'light';         // テーマモード (デフォルト: 'dark')
    highlightLevel?: number;           // ハイライトレベル 10=off, 20=weak, 30=strong (デフォルト: 30)
}

