// VIALデータ統一処理モジュール
import type { VialConfig, VirtualButton, TapDance, ReplaceRule } from './types';
import { PhysicalButton, Combo } from './types';
import { getCurrentKeyboardLanguage, getKeyMapping } from './keyboardConfig';

/**
 * VIALデータを統一的な構造体に変換する処理クラス
 */
export class VialDataProcessor {
  // 静的なReplace Rules（画像生成時に設定）
  private static currentReplaceRules: ReplaceRule[] = [];
  // 静的なVialConfig（画像生成時に設定）
  private static currentConfig: VialConfig | null = null;
  
  /**
   * Replace Rulesを設定
   */
  static setReplaceRules(replaceRules: ReplaceRule[]) {
    this.currentReplaceRules = replaceRules || [];
  }
  
  /**
   * VialConfigを設定
   */
  static setConfig(config: VialConfig) {
    this.currentConfig = config;
  }
  
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
      // 通常のキーは言語設定から取得（空文字列も有効な値として扱う）
      if (keycode in keyMapping) {
        keyText = keyMapping[keycode];
      } else {
        keyText = this.parseKeyCodeText(keycode, keyMapping);
      }
    }
    
    // Replace rulesを適用
    if (this.currentReplaceRules.length > 0) {
      keyText = this.applyReplaceRules(keyText, this.currentReplaceRules);
    }
    
    return {
      keyCode: keycode,
      keyText: keyText,
      isSpecial: isSpecial
    };
  }
  
  /**
   * Replace rulesをkeyTextに適用（完全一致のみ）
   */
  private static applyReplaceRules(keyText: string, replaceRules: ReplaceRule[]): string {
    // 有効なルールのみ適用
    const enabledRules = replaceRules.filter(rule => rule.enabled && rule.from.trim() && rule.to.trim());
    
    // 各ルールを順番に適用（完全一致のみ）
    for (const rule of enabledRules) {
      const fromText = rule.from.trim();
      const toText = rule.to.trim();
      
      // 完全一致の場合のみ置換
      if (keyText === fromText) {
        return toText;
      }
    }
    
    return keyText;
  }
  
  /**
   * 特殊キーかどうかを判定（レイヤー操作系のみ）
   */
  private static isSpecialKey(keycode: string): boolean {
    // TO, MO, LT, OSM のみ（レイヤー操作機能）
    return keycode.startsWith('TO(') ||
           keycode.startsWith('MO(') ||
           keycode.match(/^LT\d+\(/) ||  // LT1(XXX) 形式
           keycode.startsWith('OSM(');
  }
  
  /**
   * 非特殊キーコードのテキスト解析（TD, Modifier組み合わせなど）
   */
  private static parseKeyCodeText(keycode: string, keyMapping: { [key: string]: string }): string {
    // Tap Dance
    if (keycode.startsWith('TD(')) {
      const match = keycode.match(/TD\((\d+)\)/);
      return match ? `TD(${match[1]})` : keycode;
    }
    
    // Modifier Tap (LSFT, LCTL等)
    if (keycode.includes('_T(')) {
      const modMatch = keycode.match(/^(L[A-Z]+)_T\(/);
      return modMatch ? modMatch[1] : keycode;
    }
    
    // Shift組み合わせ (実際のshift文字を表示)
    if (keycode.startsWith('LSFT(')) {
      const match = keycode.match(/LSFT\((.+)\)/);
      if (match) {
        const baseKeycode = match[1];
        const language = getCurrentKeyboardLanguage();
        const shiftChar = language.shiftMapping[baseKeycode];
        
        if (shiftChar) {
          return shiftChar;
        } else {
          const baseText = keyMapping[baseKeycode] || baseKeycode;
          return `S+${baseText}`;
        }
      }
    }
    
    // 他のModifier組み合わせ
    const modifierMap: { [key: string]: string } = {
      'LCTL(': 'C+',
      'LALT(': 'A+',
      'LGUI(': 'G+'
    };
    
    for (const [prefix, displayPrefix] of Object.entries(modifierMap)) {
      if (keycode.startsWith(prefix)) {
        const match = keycode.match(new RegExp(`${prefix.replace('(', '\\(')}(.+)\\)`));
        if (match) {
          const baseKeycode = match[1];
          const baseText = keyMapping[baseKeycode] || baseKeycode.replace('KC_', '');
          return `${displayPrefix}${baseText}`;
        }
      }
    }
    
    // その他のケース
    return keycode;
  }

  /**
   * 特殊キーの表示テキストを生成（TO/MO/LT/OSM専用）
   */
  private static getSpecialKeyText(keycode: string): string {
    // TO - Layer Toggle
    if (keycode.startsWith('TO(')) {
      const match = keycode.match(/TO\((\d+)\)/);
      return match ? `TO(${match[1]})` : keycode;
    }
    
    // MO - Momentary Layer
    if (keycode.startsWith('MO(')) {
      const match = keycode.match(/MO\((\d+)\)/);
      return match ? `MO(${match[1]})` : keycode;
    }
    
    // LT - Layer Tap (LT1(XXX) 形式)
    if (keycode.match(/^LT\d+\(/)) {
      const match = keycode.match(/^LT(\d+)\(/);
      return match ? `LT${match[1]}` : keycode;
    }
    
    // OSM - One Shot Modifier
    if (keycode.startsWith('OSM(')) {
      const match = keycode.match(/OSM\((.+)\)/);
      if (match) {
        const modifiers = match[1];
        
        // 左側と右側のモディファイアを分けて処理（元の実装に基づく）
        const leftMods = [];
        const rightMods = [];
        
        if (modifiers.includes('MOD_LCTL')) leftMods.push('C');
        if (modifiers.includes('MOD_LSFT')) leftMods.push('S');
        if (modifiers.includes('MOD_LALT')) leftMods.push('A');
        if (modifiers.includes('MOD_LGUI')) leftMods.push('G');
        
        if (modifiers.includes('MOD_RCTL')) rightMods.push('RC');
        if (modifiers.includes('MOD_RSFT')) rightMods.push('RS');
        if (modifiers.includes('MOD_RALT')) rightMods.push('RA');
        if (modifiers.includes('MOD_RGUI')) rightMods.push('RG');
        
        // 左側のモディファイアがある場合は L プレフィックス付き
        let result = '';
        if (leftMods.length > 0) {
          result += 'L' + leftMods.join('');
        }
        if (rightMods.length > 0) {
          result += rightMods.join('');
        }
        
        return result ? `OSM(${result})` : `OSM(${modifiers})`;
      }
      return keycode;
    }
    
    // 予期しないケース（この関数はSpecialキーのみで呼ばれるはず）
    return keycode;
  }
  
  /**
   * raw keycodeから物理ボタンを作成
   */
  static createPhysicalButton(rawKeycode: string): PhysicalButton {
    const config = this.currentConfig;
    // Tap Dance処理
    if (rawKeycode.startsWith('TD(')) {
      const match = rawKeycode.match(/TD\((\d+)\)/);
      if (match) {
        const tdIndex = parseInt(match[1]);
        const tapDance = this.getTapDanceByIndex(tdIndex, config);
        if (tapDance) {
          return new PhysicalButton(
            rawKeycode,
            tapDance.tap,
            {
              ...(tapDance.hold && { hold: tapDance.hold }),
              ...(tapDance.double && { double: tapDance.double }),
              ...(tapDance.taphold && { taphold: tapDance.taphold })
            }
          );
        }
      }
    }
    
    // Layer Tap処理
    if (rawKeycode.match(/^LT\d+\(/)) {
      const match = rawKeycode.match(/^LT(\d+)\(KC_(.+)\)$/);
      if (match) {
        const layerNum = match[1];
        const baseKey = `KC_${match[2]}`;
        
        return new PhysicalButton(
          rawKeycode,
          this.createVirtualButton(baseKey),
          {
            hold: this.createVirtualButton(`LT${layerNum}`)
          }
        );
      }
    }
    
    // Modifier Tap処理
    if (rawKeycode.includes('_T(')) {
      const match = rawKeycode.match(/^(L[A-Z]+)_T\(KC_(.+)\)$/);
      if (match) {
        const modifier = match[1];
        const baseKey = `KC_${match[2]}`;
        
        return new PhysicalButton(
          rawKeycode,
          this.createVirtualButton(baseKey),
          {
            hold: this.createVirtualButton(modifier)
          }
        );
      }
    }
    
    // 単純なキー (KC_A, LSFT(KC_A) など)
    return new PhysicalButton(
      rawKeycode,
      this.createVirtualButton(rawKeycode)
    );
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
      
      combos.push(new Combo(
        i,
        validKeys,
        keys,
        actionButton,
        `${keys.map(k => k.keyText).join(' + ')} → ${actionButton.keyText}`
      ));
    }
    
    return combos;
  }
  
  /**
   * レイヤーの物理ボタンマップを取得
   */
  static getPhysicalButtons(config: VialConfig): PhysicalButton[][][] {
    if (!config.layout) return [];
    
    return config.layout.map(layer => {
      const layerButtons: PhysicalButton[][] = [];
      for (const [rowIndex, row] of Object.entries(layer)) {
        if (Array.isArray(row)) {
          layerButtons[parseInt(rowIndex)] = row.map((keycode: any) => this.createPhysicalButton(keycode));
        }
      }
      return layerButtons;
    });
  }
}