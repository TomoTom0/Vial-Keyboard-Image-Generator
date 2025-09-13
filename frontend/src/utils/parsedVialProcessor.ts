// ParsedVial統一処理モジュール
import type { VialConfig, KeyPosition, KeymapLayer } from './types';
import { ParsedVial, ParsedLayer, PositionedPhysicalButton } from './types';
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
    console.log('🚨 ParsedVialProcessor: parseVialConfig called for:', keyboardName, '- Call stack:', new Error().stack?.split('\n').slice(1, 4).join(' | '));
    console.log('🔧 config object keys:', Object.keys(config));
    
    // TapDanceとCombo情報を事前取得
    const tapDances = VialDataProcessor.getTapDances(config);
    const combos = VialDataProcessor.getCombos(config);
    console.log('🔧 Generated tapDances:', tapDances.length);
    console.log('🔧 Generated combos:', combos.length);
    
    // レイヤー情報を解析
    const layers = ParsedVialProcessor.parseLayers(config);
    console.log('🔧 Generated layers:', layers.length);
    
    return new ParsedVial(
      config,
      tapDances,
      combos,
      layers,
      keyboardName,
      {
        generatedAt: new Date(),
        version: '1.0.0'
      }
    );
  }
  
  /**
   * レイヤー情報を解析して配置・描画座標を計算
   */
  private static parseLayers(config: VialConfig): ParsedLayer[] {
    console.log('🔧 ParsedVialProcessor: parseLayers called')
    console.log('🔧 config.layout exists:', !!config.layout)
    console.log('🔧 config.layout length:', config.layout?.length)
    console.log('🔧 config.layout type:', typeof config.layout)
    console.log('🔧 config.layout isArray:', Array.isArray(config.layout))
    
    if (!config.layout) return [];
    
    const result = config.layout.map((layer, layerIndex) => {
      console.log(`🔧 Processing layer ${layerIndex}, layer type:`, typeof layer, 'isArray:', Array.isArray(layer))
      const buttons = ParsedVialProcessor.parseLayerButtons(layer, config);
      console.log(`🔧 Layer ${layerIndex} generated ${buttons.length} buttons`)
      
      return new ParsedLayer(
        layerIndex,
        buttons,
        `Layer ${layerIndex}`,
        true
      );
    });
    
    console.log('🔧 ParsedVialProcessor: parseLayers returning', result.length, 'layers')
    return result;
  }
  
  /**
   * レイヤー内のボタンを解析して位置情報付きボタンを生成
   */
  private static parseLayerButtons(
    layer: KeymapLayer, 
    config: VialConfig
  ): PositionedPhysicalButton[] {
    const buttons: PositionedPhysicalButton[] = [];
    
    // キーボードレイアウトの位置情報を取得（元実装と同じサイズ）
    const keyPositions = Utils.getKeyPositions(78, 60, 4, 20);
    
    // 実際のVialデータはKeymapLayerインデックス付きオブジェクトとして来る
    for (const [rowIndexStr, row] of Object.entries(layer)) {
      const rowIndex = parseInt(rowIndexStr);
      if (!row || !Array.isArray(row)) continue;
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const keycode = row[colIndex];
        
        // 配置位置の取得
        const layoutPosition = keyPositions[rowIndex]?.[colIndex];
        if (!layoutPosition) {
          console.log(`🔧 No layout position for row ${rowIndex}, col ${colIndex}`);
          continue;
        }
        
        // 空きボタン（KC_NO、-1、null、undefined）の正規化
        const normalizedKeycode = (!keycode || keycode === -1) ? 'KC_NO' : keycode;
        // if (normalizedKeycode === 'KC_NO') {
        //   console.log(`🔧 Empty button at [${rowIndex}, ${colIndex}]: "${keycode}" → "${normalizedKeycode}"`);
        // }
        
        // 物理ボタンの生成（空きボタンも含める）
        const physicalButton = VialDataProcessor.createPhysicalButton(normalizedKeycode, config);
        
        // 描画位置の計算（配置位置から実際の描画座標を計算）
        const drawPosition = ParsedVialProcessor.calculateDrawPosition(layoutPosition);
        
        buttons.push(new PositionedPhysicalButton(
          physicalButton,
          layoutPosition,
          drawPosition,
          rowIndex,
          colIndex
        ));
      }
    }
    
    return buttons;
  }
  
  /**
   * キーボードレイアウトの位置情報を取得
   * 注意: これは仮実装です。実際のキーボードレイアウトに応じて調整が必要
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        height: keyHeight,
        rotation: 0
      })),
      
      // Row 1: QWERTY row
      Array.from({ length: 14 }, (_, i) => ({
        x: i * unitWidth,
        y: unitHeight,
        width: keyWidth,
        height: keyHeight,
        rotation: 0
      })),
      
      // Row 2: ASDF row
      Array.from({ length: 13 }, (_, i) => ({
        x: i * unitWidth,
        y: unitHeight * 2,
        width: keyWidth,
        height: keyHeight,
        rotation: 0
      })),
      
      // Row 3: ZXCV row
      Array.from({ length: 12 }, (_, i) => ({
        x: i * unitWidth,
        y: unitHeight * 3,
        width: keyWidth,
        height: keyHeight,
        rotation: 0
      })),
      
      // Row 4: Bottom row (space, etc.)
      Array.from({ length: 8 }, (_, i) => ({
        x: i * unitWidth,
        y: unitHeight * 4,
        width: keyWidth,
        height: keyHeight,
        rotation: 0
      }))
    ];
    
    return rows;
  }
  
  /**
   * 配置座標から描画座標を計算（Utils.getKeyPositionsで既にマージンが含まれているのでそのまま使用）
   */
  private static calculateDrawPosition(layoutPosition: KeyPosition): KeyPosition {
    // Utils.getKeyPositions()で既にマージンが含まれているため、そのまま返す
    return {
      x: layoutPosition.x,
      y: layoutPosition.y,
      width: layoutPosition.width,
      height: layoutPosition.height,
      rotation: layoutPosition.rotation || 0
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