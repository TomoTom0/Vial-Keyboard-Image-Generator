// VIALデータ統一処理モジュール
import type { VialConfig, VirtualButton, PhysicalButton, TapDance, Combo, TapDanceInfo } from './types';
import { getCurrentKeyboardLanguage, getKeyMapping } from './keyboardConfig';

/**
 * VIALデータを統一的な構造体に変換する処理クラス
 */
export class VialDataProcessor {
  
  /**
   * keycode文字列から仮想ボタンを作成
   */
  static createVirtualButton(keycode: string, languageId?: string): VirtualButton {
    const language = languageId ? { id: languageId } : getCurrentKeyboardLanguage();
    const keyMapping = getKeyMapping(language.id);
    
    // 特殊キーの判定 (LT, MO, OSM, TD等は言語変更の影響を受けない)
    const isSpecial = this.isSpecialKey(keycode);
    
    // 表示テキストの決定
    let keyText: string;
    
    if (isSpecial) {
      keyText = this.getSpecialKeyText(keycode);
    } else {
      // 通常のキーは言語設定から取得
      keyText = keyMapping[keycode] || keycode;
    }
    
    return {
      keyCode: keycode,
      keyText: keyText,
      isSpecial: isSpecial
    };
  }
  
  /**
   * 特殊キーかどうかを判定
   */
  private static isSpecialKey(keycode: string): boolean {
    // LT, MO, OSM, TD, Modifier組み合わせなど
    return keycode.startsWith('LT') || 
           keycode.startsWith('MO(') ||
           keycode.startsWith('OSM(') ||
           keycode.startsWith('TD(') ||
           keycode.includes('_T(') ||  // LCTL_T, LSFTなど
           keycode.startsWith('TO(') ||
           keycode.startsWith('LSFT(') ||
           keycode.startsWith('LCTL(') ||
           keycode.startsWith('LALT(') ||
           keycode.startsWith('LGUI(');
  }
  
  /**
   * 特殊キーの表示テキストを生成
   */
  private static getSpecialKeyText(keycode: string): string {
    // Tap Dance
    if (keycode.startsWith('TD(')) {
      const match = keycode.match(/TD\((\d+)\)/);
      return match ? `TD(${match[1]})` : keycode;
    }
    
    // Layer Tap
    if (keycode.match(/^LT\d+\(/)) {
      const match = keycode.match(/^LT(\d+)\(/);
      return match ? `LT${match[1]}` : keycode;
    }
    
    // Modifier Tap (LSFT, LCTL等)
    if (keycode.includes('_T(')) {
      const modMatch = keycode.match(/^(L[A-Z]+)_T\(/);
      return modMatch ? modMatch[1] : keycode;
    }
    
    // Shift組み合わせ
    if (keycode.startsWith('LSFT(')) {
      const match = keycode.match(/LSFT\(KC_(.+)\)/);
      if (match) {
        const baseKey = match[1];
        const keyMapping = getKeyMapping(getCurrentKeyboardLanguage().id);
        const baseText = keyMapping[`KC_${baseKey}`] || baseKey;
        return `S+${baseText}`;
      }
    }
    
    // その他のケース
    return keycode;
  }
  
  /**
   * raw keycodeから物理ボタンを作成
   */
  static createPhysicalButton(rawKeycode: string, config: VialConfig): PhysicalButton {
    // Tap Dance処理
    if (rawKeycode.startsWith('TD(')) {
      const match = rawKeycode.match(/TD\((\d+)\)/);
      if (match) {
        const tdIndex = parseInt(match[1]);
        const tapDance = this.getTapDanceByIndex(tdIndex, config);
        if (tapDance) {
          return {
            rawKeyCode: rawKeycode,
            main: tapDance.tap,
            sub: {
              ...(tapDance.hold && { hold: tapDance.hold }),
              ...(tapDance.double && { double: tapDance.double }),
              ...(tapDance.taphold && { taphold: tapDance.taphold })
            }
          };
        }
      }
    }
    
    // Layer Tap処理
    if (rawKeycode.match(/^LT\d+\(/)) {
      const match = rawKeycode.match(/^LT(\d+)\(KC_(.+)\)$/);
      if (match) {
        const layerNum = match[1];
        const baseKey = `KC_${match[2]}`;
        
        return {
          rawKeyCode: rawKeycode,
          main: this.createVirtualButton(baseKey),
          sub: {
            hold: this.createVirtualButton(`LT${layerNum}`)
          }
        };
      }
    }
    
    // Modifier Tap処理
    if (rawKeycode.includes('_T(')) {
      const match = rawKeycode.match(/^(L[A-Z]+)_T\(KC_(.+)\)$/);
      if (match) {
        const modifier = match[1];
        const baseKey = `KC_${match[2]}`;
        
        return {
          rawKeyCode: rawKeycode,
          main: this.createVirtualButton(baseKey),
          sub: {
            hold: this.createVirtualButton(modifier)
          }
        };
      }
    }
    
    // 単純なキー (KC_A, LSFT(KC_A) など)
    return {
      rawKeyCode: rawKeycode,
      main: this.createVirtualButton(rawKeycode),
      sub: undefined
    };
  }
  
  /**
   * TapDanceデータを取得
   */
  static getTapDances(config: VialConfig): TapDance[] {
    if (!config.tap_dance) return [];
    
    const tapDances: TapDance[] = [];
    
    for (let i = 0; i < config.tap_dance.length; i++) {
      const td = config.tap_dance[i];
      if (td.length < 1) continue;
      
      const tapDance: TapDance = {
        index: i,
        rawData: td,
        tap: this.createVirtualButton(td[0])
      };
      
      // hold動作
      if (td.length > 1 && td[1] && td[1] !== 'KC_NO') {
        tapDance.hold = this.createVirtualButton(td[1]);
      }
      
      // double tap動作
      if (td.length > 2 && td[2] && td[2] !== 'KC_NO') {
        tapDance.double = this.createVirtualButton(td[2]);
      }
      
      // tap+hold動作
      if (td.length > 3 && td[3] && td[3] !== 'KC_NO') {
        tapDance.taphold = this.createVirtualButton(td[3]);
      }
      
      tapDances.push(tapDance);
    }
    
    return tapDances;
  }
  
  /**
   * インデックスからTapDanceを取得
   */
  private static getTapDanceByIndex(index: number, config: VialConfig): TapDance | null {
    const tapDances = this.getTapDances(config);
    return tapDances.find(td => td.index === index) || null;
  }
  
  /**
   * Comboデータを取得
   */
  static getCombos(config: VialConfig): Combo[] {
    if (!config.combo) return [];
    
    const combos: Combo[] = [];
    
    for (let i = 0; i < config.combo.length; i++) {
      const combo = config.combo[i];
      if (combo.length < 5) continue;
      
      // KC_NOでない有効なキーを抽出
      const validKeys = combo.slice(0, 4).filter(key => key !== 'KC_NO' && key !== '');
      if (validKeys.length === 0) continue;
      
      const action = combo[4];
      if (!action || action === 'KC_NO') continue;
      
      // 仮想ボタンに変換
      const keys = validKeys.map(key => this.createVirtualButton(key));
      const actionButton = this.createVirtualButton(action);
      
      combos.push({
        index: i,
        rawKeys: validKeys,
        keys: keys,
        action: actionButton,
        description: `${keys.map(k => k.keyText).join(' + ')} → ${actionButton.keyText}`
      });
    }
    
    return combos;
  }
  
  /**
   * レイヤーの物理ボタンマップを取得
   */
  static getPhysicalButtons(config: VialConfig): PhysicalButton[][] {
    if (!config.layers) return [];
    
    return config.layers.map(layer => 
      layer.map(keycode => this.createPhysicalButton(keycode, config))
    );
  }
}