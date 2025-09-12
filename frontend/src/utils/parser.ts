// パーサーモジュール（ブラウザ対応版）
import type { VialConfig, KeyLabel, ComboInfo, VirtualButton, PhysicalButton } from './types';
import { getCurrentKeyboardLanguage, getKeyMapping } from './keyboardConfig';
import { VialDataProcessor } from './vialDataProcessor';

export class Parser {
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

    // Tap Dance情報を取得
    static getTapDanceInfo(index: number, config: VialConfig): { tap: string; hold?: string; doubleTap?: string; tapHold?: string } | null {
        if (!config.tap_dance || index >= config.tap_dance.length) {
            return null;
        }

        const td = config.tap_dance[index];
        if (td.length < 1) {
            return null;
        }

        const result: { tap: string; hold?: string; doubleTap?: string; tapHold?: string } = {
            tap: Parser.keycodeToLabel(td[0], config).mainText
        };

        // hold動作（2番目の要素）
        if (td.length > 1 && td[1] && td[1] !== 'KC_NO') {
            result.hold = Parser.keycodeToLabel(td[1], config).mainText;
        }

        // double tap動作（3番目の要素）
        if (td.length > 2 && td[2] && td[2] !== 'KC_NO') {
            result.doubleTap = Parser.keycodeToLabel(td[2], config).mainText;
        }

        // tap+hold動作（4番目の要素）
        if (td.length > 3 && td[3] && td[3] !== 'KC_NO') {
            result.tapHold = Parser.keycodeToLabel(td[3], config).mainText;
        }

        return result;
    }

    // キーコード文字列をラベルに変換（新構造体版）
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
        // -1 や数値の場合は空キーとして処理
        if (keycodeStr === -1 || keycodeStr === '' || keycodeStr === 'KC_NO') {
            return { mainText: '', subText: undefined, isSpecial: false };
        }
        
        // 数値を文字列に変換
        const keyStr = typeof keycodeStr === 'number' ? keycodeStr.toString() : keycodeStr;

        // Tap Dance処理
        if (keyStr.startsWith('TD(')) {
            const match = keyStr.match(/TD\((\d+)\)/);
            if (match) {
                const tdIndex = parseInt(match[1]);
                console.log(`Debug: Processing TD(${tdIndex})`);
                const tdInfo = Parser.getTapDanceInfo(tdIndex, config);
                if (tdInfo) {
                    console.log(`Debug: TD(${tdIndex}) info:`, tdInfo);
                    const subTexts: string[] = [];
                    if (tdInfo.hold && tdInfo.hold !== 'KC_NO' && tdInfo.hold !== 'NO') {
                        subTexts.push(tdInfo.hold);
                    }
                    if (tdInfo.doubleTap && tdInfo.doubleTap !== 'KC_NO' && tdInfo.doubleTap !== 'NO') {
                        subTexts.push(tdInfo.doubleTap);
                    }
                    if (tdInfo.tapHold && tdInfo.tapHold !== 'KC_NO' && tdInfo.tapHold !== 'NO') {
                        subTexts.push(tdInfo.tapHold);
                    }
                    console.log(`Debug: TD(${tdIndex}) subTexts:`, subTexts);
                    
                    return {
                        mainText: tdInfo.tap,
                        subTexts: subTexts.length > 0 ? subTexts : undefined,
                        isSpecial: true
                    };
                } else {
                    console.log(`Debug: No TD info found for TD(${tdIndex})`);
                }
            }
            return { mainText: keyStr, subText: undefined, isSpecial: true };
        }

        // Layer Tap処理
        if (keyStr.match(/^LT\d+\(/)) {
            const match = keyStr.match(/^LT(\d+)\(KC_(.+)\)$/);
            if (match) {
                const layerNum = match[1];
                const baseKey = match[2];
                
                let keyName = '';
                switch (baseKey) {
                    case 'SPACE': keyName = 'SPACE'; break;
                    case 'TAB': keyName = 'TAB'; break;
                    case 'ESCAPE': keyName = 'Esc'; break;
                    case 'ENTER': keyName = 'Enter'; break;
                    case 'BSPACE': keyName = 'Bksp'; break;
                    default: keyName = baseKey;
                }
                
                return {
                    mainText: keyName,
                    subTexts: [`LT${layerNum}`],
                    isSpecial: true
                };
            }
        }

        // モディファイアタップキー処理
        const modifierTapKeys = [
            { prefix: 'LCTL_T(', modifier: 'LCTL' },
            { prefix: 'LSFT_T(', modifier: 'LSFT' },
            { prefix: 'LALT_T(', modifier: 'LALT' },
            { prefix: 'LGUI_T(', modifier: 'LGUI' },
            { prefix: 'RCTL_T(', modifier: 'RCTL' },
            { prefix: 'RSFT_T(', modifier: 'RSFT' },
            { prefix: 'RALT_T(', modifier: 'RALT' },
            { prefix: 'RGUI_T(', modifier: 'RGUI' }
        ];

        for (const tapKey of modifierTapKeys) {
            if (keyStr.startsWith(tapKey.prefix)) {
                const match = keyStr.match(new RegExp(`${tapKey.prefix.replace('(', '\\(')}KC_(.+)\\)`)) || 
                             keyStr.match(new RegExp(`${tapKey.prefix.replace('(', '\\(')}(.+)\\)`));
                if (match) {
                    const baseKey = match[1];
                    
                    // KC_プレフィックスを除去
                    let keyName = baseKey.replace(/^KC_/, '');
                    
                    // 一般的なキー名の変換
                    switch (keyName) {
                        case 'SPACE': keyName = 'SPACE'; break;
                        case 'TAB': keyName = 'TAB'; break;
                        case 'ENTER': keyName = 'Enter'; break;
                        case 'ESCAPE': keyName = 'Esc'; break;
                        case 'BSPACE': keyName = 'Bksp'; break;
                        default: keyName = keyName;
                    }
                    
                    return {
                        mainText: keyName,
                        subTexts: [tapKey.modifier],
                        isSpecial: true
                    };
                }
            }
        }

        // TO(layer)処理
        if (keyStr.startsWith('TO(')) {
            const match = keyStr.match(/TO\((\d+)\)/);
            if (match) {
                return { mainText: `TO(${match[1]})`, subText: undefined, isSpecial: true };
            }
        }

        // OSM(モディファイア)処理
        if (keyStr.startsWith('OSM(')) {
            const match = keyStr.match(/OSM\((.+)\)/);
            if (match) {
                const modifiers = match[1];
                let shortForm = 'OSM(';
                
                // 左側と右側のモディファイアを分けて処理
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
                
                shortForm += result + ')';
                
                return { mainText: shortForm, subText: undefined, isSpecial: true };
            }
        }

        // SHIFT_プレフィックス付きキーの処理
        if (keyStr.startsWith('SHIFT_')) {
            const shiftedChar = keyStr.substring(6); // "SHIFT_"を除去
            // 特殊な変換
            if (shiftedChar === 'RO') {
                return { mainText: '_', subText: undefined, isSpecial: true }; // Shift+RO = _
            }
            if (shiftedChar === 'NONUS_HASH') {
                return { mainText: '}', subText: undefined, isSpecial: true }; // Shift+NONUS_HASH = }
            }
            return { mainText: shiftedChar, subText: undefined, isSpecial: true };
        }

        // LSFT(key)処理 - 現在の言語のShiftマッピングを使用
        if (keyStr.startsWith('LSFT(')) {
            const match = keyStr.match(/LSFT\(KC_(.+)\)/);
            if (match) {
                const baseKey = match[1];
                const currentLanguageForShift = getCurrentKeyboardLanguage();
                const shiftMapping = currentLanguageForShift.shiftMapping;
                
                if (shiftMapping[baseKey]) {
                    return { mainText: shiftMapping[baseKey], subText: undefined, isSpecial: false };
                }
                return { mainText: `S+${baseKey}`, subText: undefined, isSpecial: true };
            }
        }

        // KC_付きキーマッピングから直接検索
        const currentLanguage = getCurrentKeyboardLanguage();
        const keyMapping = getKeyMapping(currentLanguage.id);
        
        // keycode文字列（KC_プレフィックス付き）から表示テキストに変換
        if (keyMapping[keyStr]) {
            return { mainText: keyMapping[keyStr], subText: undefined, isSpecial: false };
        }

        // その他の特殊処理
        switch (keyStr) {
            case 'KC_RALT': return { mainText: 'RAlt', subText: undefined, isSpecial: false };
            default:
                if (keyStr.includes('NONUS_HASH')) {
                    console.log(`Debug: Reached default case with ${keyStr}`);
                }
                return { mainText: keyStr, subText: undefined, isSpecial: false };
        }
    }

    // Combo情報を解析
    static parseComboInfo(config: VialConfig): ComboInfo[] {
        if (!config.combo) return [];

        const combos: ComboInfo[] = [];
        
        for (let i = 0; i < config.combo.length; i++) {
            const combo = config.combo[i];
            if (combo.length < 5) continue;

            // KC_NOでない有効なキーを抽出
            const validKeys = combo.slice(0, 4).filter(key => key !== 'KC_NO' && key !== '');
            if (validKeys.length === 0) continue;

            const action = combo[4];
            if (!action || action === 'KC_NO') continue;

            // キー名を読みやすい形式に変換＆サブテキストも取得
            const keyLabels: string[] = [];
            const keySubTexts: (string[] | undefined)[] = [];
            
            validKeys.forEach(key => {
                const label = Parser.keycodeToLabel(key, config);
                keyLabels.push(label.mainText || key);
                keySubTexts.push(label.subTexts);
            });

            // キーコードを文字列として保持（複合キーコードも処理）
            const validKeycodes = validKeys.map(key => {
                if (typeof key === 'string') {
                    return key; // 文字列のキーコードをそのまま使用
                }
                return String(key);
            });

            // アクション名を読みやすい形式に変換
            const actionLabel = Parser.keycodeToLabel(action, config);

            
            combos.push({
                keys: keyLabels,
                keycodes: validKeycodes,
                keySubTexts: keySubTexts, // 各キーのサブテキスト
                action: actionLabel.mainText || action,
                description: `${keyLabels.join(' + ')} → ${actionLabel.mainText || action}`,
                actionSubTexts: actionLabel.subTexts, // アクションのサブテキストも保存
                index: i // 元のインデックス番号を保存
            });
        }

        return combos;
    }
}