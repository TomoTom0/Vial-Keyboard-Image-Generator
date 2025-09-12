// 新しいパーサーモジュール（構造体ベース）
import type { VialConfig, KeyLabel, ComboInfo, VirtualButton, PhysicalButton, TapDance, Combo } from './types';
import { VialDataProcessor } from './vialDataProcessor';

export class ParserNew {
    // 文字列キーコードを数値に変換
    static stringToKeycode(keyStr: string): number | undefined {
        if (typeof keyStr === 'number') return keyStr;
        
        // KC_プレフィックスを除去
        let cleanStr = keyStr;
        if (cleanStr.startsWith('KC_')) {
            cleanStr = cleanStr.substring(3);
        }
        
        // 基本的なキーマッピング（実際のキーコード値）
        const keycodeMap: { [key: string]: number } = {
            'A': 4, 'B': 5, 'C': 6, 'D': 7, 'E': 8, 'F': 9, 'G': 10, 'H': 11,
            'I': 12, 'J': 13, 'K': 14, 'L': 15, 'M': 16, 'N': 17, 'O': 18, 'P': 19,
            'Q': 20, 'R': 21, 'S': 22, 'T': 23, 'U': 24, 'V': 25, 'W': 26, 'X': 27,
            'Y': 28, 'Z': 29,
            '1': 30, '2': 31, '3': 32, '4': 33, '5': 34, '6': 35, '7': 36, '8': 37,
            '9': 38, '0': 39,
            'ENTER': 40, 'RETURN': 40, 'ESC': 41, 'ESCAPE': 41, 'BSPC': 42, 'BSPACE': 42,
            'TAB': 43, 'SPACE': 44, 'SPC': 44, 'CAPS': 57, 'CAPSLOCK': 57,
            'F1': 58, 'F2': 59, 'F3': 60, 'F4': 61, 'F5': 62, 'F6': 63,
            'F7': 64, 'F8': 65, 'F9': 66, 'F10': 67, 'F11': 68, 'F12': 69,
            'HOME': 74, 'PGUP': 75, 'PGDN': 78, 'END': 77, 'DEL': 76, 'DELETE': 76,
            'LCTRL': 224, 'LSHIFT': 225, 'LALT': 226, 'LGUI': 227,
            'RCTRL': 228, 'RSHIFT': 229, 'RALT': 230, 'RGUI': 231
        };
        
        return keycodeMap[cleanStr];
    }

    // キーコード文字列を物理ボタンに変換（新構造体版）
    static keycodeToPhysicalButton(keycodeStr: string | number, config: VialConfig): PhysicalButton {
        const keyStr = typeof keycodeStr === 'number' ? keycodeStr.toString() : keycodeStr;
        
        // -1 や数値、空の場合は空キーとして処理
        if (keycodeStr === -1 || keycodeStr === '' || keycodeStr === 'KC_NO') {
            return {
                rawKeyCode: 'KC_NO',
                main: { keyCode: 'KC_NO', keyText: '', isSpecial: false },
                sub: undefined
            };
        }
        
        return VialDataProcessor.createPhysicalButton(keyStr, config);
    }

    // 後方互換性のためのラベル変換メソッド（既存コード用）
    static keycodeToLabel(keycodeStr: string | number, config: VialConfig): KeyLabel {
        const physicalButton = ParserNew.keycodeToPhysicalButton(keycodeStr, config);
        
        // PhysicalButtonからKeyLabelに変換
        if (physicalButton.sub) {
            // サブテキストがある場合
            const subTexts: string[] = [];
            if (physicalButton.sub.tap) subTexts.push(physicalButton.sub.tap.keyText);
            if (physicalButton.sub.hold) subTexts.push(physicalButton.sub.hold.keyText);
            if (physicalButton.sub.double) subTexts.push(physicalButton.sub.double.keyText);
            if (physicalButton.sub.taphold) subTexts.push(physicalButton.sub.taphold.keyText);
            
            return {
                mainText: physicalButton.main.keyText,
                subTexts: subTexts.length > 0 ? subTexts : undefined,
                isSpecial: physicalButton.main.isSpecial
            };
        } else {
            // サブテキストがない場合
            return {
                mainText: physicalButton.main.keyText,
                subText: undefined,
                isSpecial: physicalButton.main.isSpecial
            };
        }
    }

    // TapDance構造体を取得
    static getTapDances(config: VialConfig): TapDance[] {
        return VialDataProcessor.getTapDances(config);
    }

    // Combo構造体を取得
    static getCombos(config: VialConfig): Combo[] {
        return VialDataProcessor.getCombos(config);
    }

    // レイヤーの物理ボタンマップを取得
    static getPhysicalButtonLayers(config: VialConfig): PhysicalButton[][] {
        return VialDataProcessor.getPhysicalButtons(config);
    }

    // 後方互換性：従来のCombo情報を解析
    static parseComboInfo(config: VialConfig): ComboInfo[] {
        const combos = ParserNew.getCombos(config);
        
        return combos.map(combo => ({
            keys: combo.keys.map(k => k.keyText),
            keycodes: combo.rawKeys,
            keySubTexts: combo.keys.map(k => k.isSpecial ? [k.keyText] : undefined),
            action: combo.action.keyText,
            description: combo.description,
            actionSubTexts: combo.action.isSpecial ? [combo.action.keyText] : undefined,
            index: combo.index
        }));
    }
}