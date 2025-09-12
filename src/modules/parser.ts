// パーサーモジュール（相互依存）
import { VialConfig, KeyLabel, ComboInfo } from './types';
import { Utils } from './utils';

export class Parser {
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

    // キーコード文字列をラベルに変換
    static keycodeToLabel(keycodeStr: string | number, config: VialConfig): KeyLabel {
        // -1 や数値の場合は空キーとして処理
        if (keycodeStr === -1 || keycodeStr === '' || keycodeStr === 'KC_NO') {
            return { mainText: '', subText: undefined, isSpecial: false };
        }
        
        // 数値を文字列に変換
        const keyStr = typeof keycodeStr === 'number' ? keycodeStr.toString() : keycodeStr;

        // US配列から日本語配列への変換
        const convertedKeyStr = Utils.convertUsToJis(keyStr);
        
        // デバッグ情報
        if (keyStr.includes('NONUS_HASH') || keyStr.includes('RO') || keyStr.includes('LSFT(KC_7)') || keyStr.includes('LSFT(KC_9)')) {
            console.log(`Debug: Original=${keyStr}, Converted=${convertedKeyStr}`);
        }

        // Tap Dance処理
        if (convertedKeyStr.startsWith('TD(')) {
            const match = convertedKeyStr.match(/TD\((\d+)\)/);
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
            return { mainText: convertedKeyStr, subText: undefined, isSpecial: true };
        }

        // Layer Tap処理
        if (convertedKeyStr.match(/^LT\d+\(/)) {
            const match = convertedKeyStr.match(/^LT(\d+)\(KC_(.+)\)$/);
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

        // TO(layer)処理
        if (convertedKeyStr.startsWith('TO(')) {
            const match = convertedKeyStr.match(/TO\((\d+)\)/);
            if (match) {
                return { mainText: `TO(${match[1]})`, subText: undefined, isSpecial: true };
            }
        }

        // SHIFT_プレフィックス付きキーの処理
        if (convertedKeyStr.startsWith('SHIFT_')) {
            const shiftedChar = convertedKeyStr.substring(6); // "SHIFT_"を除去
            // 特殊な変換
            if (shiftedChar === 'RO') {
                return { mainText: '_', subText: undefined, isSpecial: true }; // Shift+RO = _
            }
            if (shiftedChar === 'NONUS_HASH') {
                return { mainText: '}', subText: undefined, isSpecial: true }; // Shift+NONUS_HASH = }
            }
            return { mainText: shiftedChar, subText: undefined, isSpecial: true };
        }

        // LSFT(key)処理 - 変換されなかった場合のフォールバック
        if (convertedKeyStr.startsWith('LSFT(')) {
            const match = convertedKeyStr.match(/LSFT\(KC_(.+)\)/);
            if (match) {
                return { mainText: `S+${match[1]}`, subText: undefined, isSpecial: true };
            }
        }

        // 特殊な日本語配列キーの個別処理（正確な対応）
        if (convertedKeyStr === 'KC_NONUS_HASH' || convertedKeyStr === 'NONUS_HASH') {
            console.log(`Debug: KC_NONUS_HASH matched, returning ]`);
            return { mainText: ']', subText: undefined, isSpecial: false };
        }
        if (convertedKeyStr === 'KC_RO' || convertedKeyStr === 'RO') {
            return { mainText: '\\', subText: undefined, isSpecial: false };
        }
        if (convertedKeyStr === 'KC_JYEN' || convertedKeyStr === 'JYEN') {
            return { mainText: '\\', subText: undefined, isSpecial: false };
        }

        // 基本キーマッピング（KC_プレフィックス付き） - 日本語配列対応
        if (convertedKeyStr.startsWith('KC_')) {
            const baseKey = convertedKeyStr.substring(3);
            
            // 特定のキーコードのKC_プレフィックス除去（LANG1, LANG2等）
            if (baseKey.startsWith('LANG') || baseKey.startsWith('HENK') || baseKey.startsWith('MHEN') || 
                baseKey.startsWith('KANA') || baseKey.startsWith('APP') || baseKey.startsWith('MENU')) {
                return { mainText: baseKey, subText: undefined, isSpecial: false };
            }
            
            if (baseKey === 'NONUS_HASH') {
                console.log(`Debug: Processing KC_NONUS_HASH, baseKey=${baseKey}`);
            }
            const keyMapping: { [key: string]: string } = {
                // アルファベット
                'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
                'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S',
                'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
                // 数字
                '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
                // 特殊キー
                'ENTER': 'Enter', 'ESC': 'Esc', 'ESCAPE': 'Esc', 'BSPACE': 'Bksp', 'TAB': 'Tab', 'SPACE': 'Space',
                // 記号 - JIS配列対応
                'MINUS': '-', 'EQUAL': '^', 'BSLASH': '\\', 
                'AT': '@', 'LBRACKET': '@', 'RBRACKET': '[',
                'SCOLON': ';', 'QUOTE': ':', 'GRAVE': '`', 
                'COMMA': ',', 'DOT': '.', 'SLASH': '/',
                // 日本語配列特殊キー
                'NONUS_HASH': ']',     // KC_NONUS_HASH → ] (大カッコ閉じる)
                'RO': '\\',            // RO (日本語配列の\キー)
                'INT1': '_',           // 日本語配列のアンダーバー位置
                'INT3': '\\',          // 日本語配列のバックスラッシュ
                'CAPSLOCK': 'Caps', 'PSCREEN': 'Print\nScreen',
                // 修飾キー
                'LCTRL': 'LCtrl', 'LSHIFT': 'LShift', 'LALT': 'LAlt', 'LGUI': 'LGui',
                'RCTRL': 'RCtrl', 'RSHIFT': 'RShift', 'RALT': 'RAlt', 'RGUI': 'RGui',
                // ファンクションキー
                'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
                'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
                // 矢印キー
                'UP': '↑', 'DOWN': '↓', 'LEFT': '←', 'RIGHT': '→',
                // ナビゲーションキー
                'HOME': 'Home', 'END': 'End', 'PGUP': 'PgUp', 'PGDN': 'PgDn',
                'INSERT': 'Ins', 'DELETE': 'Del',
                // テンキー
                'KP_0': '0', 'KP_1': '1', 'KP_2': '2', 'KP_3': '3', 'KP_4': '4',
                'KP_5': '5', 'KP_6': '6', 'KP_7': '7', 'KP_8': '8', 'KP_9': '9',
                'KP_DOT': '.', 'KP_SLASH': '/', 'KP_ASTERISK': '*', 'KP_MINUS': '-',
                'KP_PLUS': '+', 'KP_EQUAL': '=', 'KP_ENTER': 'Enter',
                // 日本語キー
                'MHEN': 'MHEN', 'HENK': 'HENK', 'KANA': 'KANA',
                // 透過キー
                'TRNS': '▽'
            };

            const mappedKey = keyMapping[baseKey];
            if (mappedKey) {
                return { mainText: mappedKey, subText: undefined, isSpecial: false };
            }
        }

        // その他の特殊処理
        switch (convertedKeyStr) {
            case 'KC_RALT': return { mainText: 'RAlt', subText: undefined, isSpecial: false };
            default:
                if (convertedKeyStr.includes('NONUS_HASH')) {
                    console.log(`Debug: Reached default case with ${convertedKeyStr}`);
                }
                return { mainText: convertedKeyStr, subText: undefined, isSpecial: false };
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