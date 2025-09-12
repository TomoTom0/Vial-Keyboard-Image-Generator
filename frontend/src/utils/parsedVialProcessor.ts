// ParsedVial統一処理モジュール
import type { VialConfig, ParsedVial, ParsedLayer, PositionedPhysicalButton, KeyPosition } from './types';
import { VialDataProcessor } from './vialDataProcessor';
import { Utils } from './utils';

/**
 * VIALデータを解析済み構造体に変換する処理クラス
 */
export class ParsedVialProcessor {
  
  /**
   * VIALConfigからParsedVialを生成
   */
  static parseVialConfig(config: VialConfig, keyboardName?: string): ParsedVial {
    // TapDanceとCombo情報を事前取得
    const tapDances = VialDataProcessor.getTapDances(config);
    const combos = VialDataProcessor.getCombos(config);
    
    // レイヤー情報を解析
    const layers = ParsedVialProcessor.parseLayers(config);
    
    return {
      original: config,
      tapDances: tapDances,
      combos: combos,
      layers: layers,
      keyboardName: keyboardName,
      metadata: {
        generatedAt: new Date(),
        version: '1.0.0'
      }
    };
  }
  
  /**
   * レイヤー情報を解析して配置・描画座標を計算
   */
  private static parseLayers(config: VialConfig): ParsedLayer[] {
    if (!config.layers) return [];
    
    return config.layers.map((layer, layerIndex) => {
      const buttons = ParsedVialProcessor.parseLayerButtons(layer, layerIndex, config);
      
      return {
        layerIndex: layerIndex,
        buttons: buttons,
        name: `Layer ${layerIndex}`,
        enabled: true
      };
    });
  }
  
  /**
   * レイヤー内のボタンを解析して位置情報付きボタンを生成
   */
  private static parseLayerButtons(
    layer: string[][], 
    layerIndex: number, 
    config: VialConfig
  ): PositionedPhysicalButton[] {
    const buttons: PositionedPhysicalButton[] = [];
    
    // キーボードレイアウトの位置情報を取得
    const keyPositions = ParsedVialProcessor.getKeyboardLayout();
    
    for (let rowIndex = 0; rowIndex < layer.length; rowIndex++) {
      const row = layer[rowIndex];
      if (!row) continue;
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const keycode = row[colIndex];
        if (!keycode || keycode === 'KC_NO' || keycode === -1) continue;
        
        // 配置位置の取得
        const layoutPosition = keyPositions[rowIndex]?.[colIndex];
        if (!layoutPosition) continue;
        
        // 物理ボタンの生成
        const physicalButton = VialDataProcessor.createPhysicalButton(keycode, config);
        
        // 描画位置の計算（配置位置から実際の描画座標を計算）
        const drawPosition = ParsedVialProcessor.calculateDrawPosition(layoutPosition);
        
        buttons.push({
          button: physicalButton,
          layoutPosition: layoutPosition,
          drawPosition: drawPosition,
          rowIndex: rowIndex,
          colIndex: colIndex
        });
      }
    }
    
    return buttons;
  }
  
  /**
   * キーボードレイアウトの位置情報を取得
   * 注意: これは仮実装です。実際のキーボードレイアウトに応じて調整が必要
   */
  private static getKeyboardLayout(): (KeyPosition | null)[][] {
    // 標準的な60%キーボードのレイアウト例
    // 実際の実装では、キーボード種別に応じて動的に生成する必要がある
    
    const keyWidth = 50;
    const keyHeight = 50;
    const keyGap = 5;
    const unitWidth = keyWidth + keyGap;
    const unitHeight = keyHeight + keyGap;
    
    // 各行の開始位置とキー配置を定義
    const rows: (KeyPosition | null)[][] = [
      // Row 0: Number row
      Array.from({ length: 14 }, (_, i) => ({
        x: i * unitWidth,
        y: 0,
        width: keyWidth,
        height: keyHeight
      })),
      
      // Row 1: QWERTY row
      Array.from({ length: 14 }, (_, i) => ({
        x: i * unitWidth,
        y: unitHeight,
        width: keyWidth,
        height: keyHeight
      })),
      
      // Row 2: ASDF row
      Array.from({ length: 13 }, (_, i) => ({
        x: i * unitWidth,
        y: unitHeight * 2,
        width: keyWidth,
        height: keyHeight
      })),
      
      // Row 3: ZXCV row
      Array.from({ length: 12 }, (_, i) => ({
        x: i * unitWidth,
        y: unitHeight * 3,
        width: keyWidth,
        height: keyHeight
      })),
      
      // Row 4: Bottom row (space, etc.)
      Array.from({ length: 8 }, (_, i) => ({
        x: i * unitWidth,
        y: unitHeight * 4,
        width: keyWidth,
        height: keyHeight
      }))
    ];
    
    return rows;
  }
  
  /**
   * 配置座標から描画座標を計算
   */
  private static calculateDrawPosition(layoutPosition: KeyPosition): KeyPosition {
    // マージンを考慮した描画座標を計算
    const margin = 20;
    
    return {
      x: layoutPosition.x + margin,
      y: layoutPosition.y + margin,
      width: layoutPosition.width,
      height: layoutPosition.height
    };
  }
  
  /**
   * 特定レイヤーのボタンを取得
   */
  static getLayerButtons(parsedVial: ParsedVial, layerIndex: number): PositionedPhysicalButton[] {
    const layer = parsedVial.layers.find(l => l.layerIndex === layerIndex);
    return layer ? layer.buttons : [];
  }
  
  /**
   * 特定位置のボタンを取得
   */
  static getButtonAt(
    parsedVial: ParsedVial, 
    layerIndex: number, 
    rowIndex: number, 
    colIndex: number
  ): PositionedPhysicalButton | null {
    const layer = parsedVial.layers.find(l => l.layerIndex === layerIndex);
    if (!layer) return null;
    
    return layer.buttons.find(b => b.rowIndex === rowIndex && b.colIndex === colIndex) || null;
  }
  
  /**
   * コンボに関連するボタンを取得
   */
  static getComboRelatedButtons(parsedVial: ParsedVial, comboIndex: number): PositionedPhysicalButton[] {
    const combo = parsedVial.combos.find(c => c.index === comboIndex);
    if (!combo) return [];
    
    const relatedButtons: PositionedPhysicalButton[] = [];
    
    // 各レイヤーからコンボのキーコードと一致するボタンを検索
    for (const layer of parsedVial.layers) {
      for (const button of layer.buttons) {
        if (combo.rawKeys.includes(button.button.rawKeyCode)) {
          relatedButtons.push(button);
        }
      }
    }
    
    return relatedButtons;
  }
  
  /**
   * TapDanceに関連するボタンを取得
   */
  static getTapDanceRelatedButtons(parsedVial: ParsedVial, tdIndex: number): PositionedPhysicalButton[] {
    const relatedButtons: PositionedPhysicalButton[] = [];
    const tdKeycode = `TD(${tdIndex})`;
    
    // 各レイヤーからTD(n)と一致するボタンを検索
    for (const layer of parsedVial.layers) {
      for (const button of layer.buttons) {
        if (button.button.rawKeyCode === tdKeycode) {
          relatedButtons.push(button);
        }
      }
    }
    
    return relatedButtons;
  }
  
  /**
   * ParsedVialのキャンバスサイズを計算
   */
  static calculateCanvasSize(parsedVial: ParsedVial): { width: number; height: number } {
    let maxX = 0;
    let maxY = 0;
    
    // すべてのレイヤーのボタン位置からキャンバスサイズを計算
    for (const layer of parsedVial.layers) {
      for (const button of layer.buttons) {
        const rightEdge = button.drawPosition.x + button.drawPosition.width;
        const bottomEdge = button.drawPosition.y + button.drawPosition.height;
        
        maxX = Math.max(maxX, rightEdge);
        maxY = Math.max(maxY, bottomEdge);
      }
    }
    
    // マージンを追加
    const margin = 40;
    return {
      width: maxX + margin,
      height: maxY + margin
    };
  }
}