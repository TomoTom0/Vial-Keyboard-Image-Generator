// ParsedVial統一処理モジュール
import type { VialConfig, KeyPosition, KeymapLayer } from './types';
import { ParsedVial, ParsedLayer, PositionedPhysicalButton } from './types';
import { VialDataProcessor } from './vialDataProcessor';
import { KEYBOARD_LAYOUTS } from './keyboardConfig.generated';

/**
 * VIALデータを解析済み構造体に変換する処理クラス
 */
export class ParsedVialProcessor {
  
  /**
   * VIALConfigからParsedVialを生成
   */
  static parseVialConfig(config: VialConfig, keyboardName?: string): ParsedVial {
    
    // VialDataProcessorにconfigを設定
    VialDataProcessor.setConfig(config);
    
    // TapDanceとCombo情報を事前取得
    const tapDances = VialDataProcessor.getTapDances(config);
    const combos = VialDataProcessor.getCombos(config);
    
    // レイヤー情報を解析
    const layers = ParsedVialProcessor.parseLayers(config);
    
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
    
    if (!config.layout) return [];
    
    const result = config.layout.map((layer, layerIndex) => {
      const buttons = ParsedVialProcessor.parseLayerButtons(layer, config);
      
      return new ParsedLayer(
        layerIndex,
        buttons,
        `Layer ${layerIndex}`,
        true
      );
    });
    
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
    
    // キーボードレイアウトの位置情報を取得（TSV生成データを使用）
    const keyPositions = KEYBOARD_LAYOUTS.corne_v4.positions;
    
    // 実際のVialデータはKeymapLayerインデックス付きオブジェクトとして来る
    for (const [rowIndexStr, row] of Object.entries(layer)) {
      const rowIndex = parseInt(rowIndexStr);
      if (!row || !Array.isArray(row)) continue;
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const keycode = row[colIndex];
        
        // 配置位置の取得
        const layoutPosition = keyPositions[rowIndex]?.[colIndex];
        if (!layoutPosition) {
          continue;
        }
        
        // 空きボタン（KC_NO、-1、null、undefined）の正規化
        const normalizedKeycode = (!keycode || keycode === -1) ? 'KC_NO' : keycode;
        // if (normalizedKeycode === 'KC_NO') {
        //   console.log(`🔧 Empty button at [${rowIndex}, ${colIndex}]: "${keycode}" → "${normalizedKeycode}"`);
        // }
        
        // 物理ボタンの生成（空きボタンも含める）
        const physicalButton = VialDataProcessor.createPhysicalButton(normalizedKeycode);
        
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