// 描画モジュール（独立性高い）
import { CanvasRenderingContext2D } from 'canvas';
import { KeyPosition, KeyLabel, COLORS, ComboInfo, RenderOptions, getThemeColors } from './types';

export class Renderer {
    // Combo入力キーかどうかを判定（文字列キーコードで比較）
    private static isComboInputKey(keycode: string, combos: ComboInfo[]): boolean {
        for (const combo of combos) {
            if (combo.keycodes.includes(keycode)) {
                return true;
            }
        }
        return false;
    }
    // キーの背景を描画
    static drawKey(ctx: CanvasRenderingContext2D, pos: KeyPosition, label: KeyLabel, keycode?: string, combos?: ComboInfo[], options: RenderOptions = {}): void {
        // テーマ色を取得
        const colors = getThemeColors(options.theme);
        
        // キーの背景色を決定
        let keyColor: string;
        let borderColor: string;
        
        // オプションのデフォルト値設定
        const {
            highlightComboKeys = true,
            highlightSubtextKeys = true,
            showComboMarkers = true
        } = options;

        // Combo入力キーまたはサブテキストがあるキーかチェック
        const isComboKey = (combos && keycode !== undefined) ? Renderer.isComboInputKey(keycode, combos) : false;
        const hasSubTexts = label.subTexts && label.subTexts.length > 0;
        
        // デバッグ情報
        if (isComboKey || hasSubTexts || label.isSpecial) {
            console.log(`Debug: Key "${label.mainText}" (keycode: ${keycode}) - isComboKey: ${isComboKey}, hasSubTexts: ${hasSubTexts}, isSpecial: ${label.isSpecial}, subTexts: ${JSON.stringify(label.subTexts)}`);
        }
        
        if (label.mainText === '') {
            keyColor = colors.keyEmpty;
            borderColor = colors.borderEmpty;
        } else if ((isComboKey && highlightComboKeys) || (hasSubTexts && highlightSubtextKeys)) {
            // オプションに応じて特別色を適用
            keyColor = colors.keySpecial;
            borderColor = colors.borderSpecial;
        } else {
            // その他は通常色（isSpecialは無視）
            keyColor = colors.keyNormal;
            borderColor = colors.borderNormal;
        }

        // メインキーエリア（少し小さくして縁取りを作る）
        ctx.fillStyle = keyColor;
        ctx.fillRect(pos.x + 1, pos.y + 1, pos.width - 2, pos.height - 2);

        // 細いボーダー
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

        // Combo入力キーには右上に直角三角形マーカーを追加
        if (isComboKey && showComboMarkers) {
            const triangleSize = 12;
            ctx.fillStyle = '#ff6b6b'; // 赤色のマーカー
            ctx.beginPath();
            ctx.moveTo(pos.x + pos.width - triangleSize, pos.y);
            ctx.lineTo(pos.x + pos.width, pos.y);
            ctx.lineTo(pos.x + pos.width, pos.y + triangleSize);
            ctx.closePath();
            ctx.fill();
        }
    }

    // テキストを描画
    static drawText(ctx: CanvasRenderingContext2D, pos: KeyPosition, label: KeyLabel, keycode?: string, combos?: ComboInfo[], options: RenderOptions = {}): void {
        if (label.mainText === '') return;

        // テーマ色を取得
        const colors = getThemeColors(options.theme);

        // オプションのデフォルト値設定
        const {
            highlightComboKeys = true,
            highlightSubtextKeys = true,
            showTextColors = true
        } = options;

        // Combo入力キーまたはサブテキストがあるキーかチェック
        const isComboKey = (combos && keycode !== undefined) ? Renderer.isComboInputKey(keycode, combos) : false;
        const hasSubTexts = label.subTexts && label.subTexts.length > 0;

        // フォント設定 - オプションに応じて特別色を適用
        const mainColor = (showTextColors && ((isComboKey && highlightComboKeys) || (hasSubTexts && highlightSubtextKeys))) 
            ? colors.textSpecial 
            : colors.textNormal;
        
        // フォントサイズの決定
        let fontSize: number;
        if (label.mainText.length === 1) {
            fontSize = 24; // 単一文字
        } else if (label.mainText.length > 8) {
            fontSize = 14; // 長いテキスト
        } else if (label.subText) {
            fontSize = 20; // TD/LTキーのメインテキスト
        } else {
            fontSize = 18; // 通常サイズ
        }

        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = mainColor;
        ctx.textAlign = 'center';

        // メインテキストを上に寄せて配置
        const mainY = pos.y + pos.height * 0.35;
        ctx.fillText(label.mainText, pos.x + pos.width / 2, mainY);

        // サブテキストの描画
        if (label.subTexts && label.subTexts.length > 0) {
            ctx.fillStyle = colors.textSub;
            
            if (label.subTexts.length === 1) {
                // 単一のサブテキストは大きな文字で中央に表示
                ctx.font = '14px Arial, sans-serif';
                const y = pos.y + pos.height * 0.75;
                ctx.fillText(label.subTexts[0], pos.x + pos.width / 2, y);
            } else {
                // 複数のサブテキストは一行に二個ずつ配置
                const startY = pos.y + pos.height * 0.65;
                const lineHeight = 13;
                
                for (let i = 0; i < label.subTexts.length; i += 2) {
                    const row = Math.floor(i / 2);
                    const y = startY + (row * lineHeight);
                    
                    if (i + 1 < label.subTexts.length) {
                        // 一行に二個表示：左側は少し大きく、右側は通常サイズ
                        const leftX = pos.x + pos.width * 0.25;
                        const rightX = pos.x + pos.width * 0.75;
                        
                        // 左側（もう少し大きく、太字で視認性向上）
                        ctx.font = 'bold 13px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i], leftX, y);
                        
                        // 右側（通常サイズ、太字で視認性向上）
                        ctx.font = 'bold 11px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i + 1], rightX, y);
                    } else {
                        // 奇数個の場合、最後の一個は中央に表示（太字で視認性向上）
                        ctx.font = 'bold 11px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i], pos.x + pos.width / 2, y);
                    }
                }
            }
        }
    }

    // レイヤー番号を装飾付きで描画（3行目中央に配置）
    static drawLayerNumber(ctx: any, layerIndex: number, canvasWidth: number, canvasHeight: number, options: RenderOptions = {}): void {
        // テーマ色を取得
        const colors = getThemeColors(options.theme);
        const margin = 20;
        const boxWidth = 80;
        const boxHeight = 40;
        
        // 実際の値を使って計算: keyWidth=78, keyGap=4, unitX=82
        // BキーとNキーの間の空白部分の中央を計算
        const keyWidth = 78;
        const keyGap = 4;
        const unitX = keyWidth + keyGap; // 82
        
        // Bキー右端: margin + unitX * 5 + keyWidth = 20 + 82*5 + 78 = 508px
        // Nキー左端: margin + unitX * 8.5 = 20 + 82*8.5 = 717px
        const bKeyRightEnd = margin + unitX * 5 + keyWidth; 
        const nKeyLeftStart = margin + unitX * 8.5; 
        const keyboardCenterX = (bKeyRightEnd + nKeyLeftStart) / 2;
        const x = keyboardCenterX - boxWidth / 2;
        
        // 3行目の位置を計算（キーボードレイアウトの3行目）
        const keyRowHeight = 64; // キー高さ60px + ギャップ4px
        const y = margin + keyRowHeight * 2; // 3行目の位置
        const cornerRadius = 8;

        // 背景ボックスを描画（角丸四角形）
        ctx.fillStyle = colors.headerBackground;
        ctx.strokeStyle = colors.headerBorder;
        ctx.lineWidth = 2;
        
        // 角丸四角形を描画
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + boxWidth - cornerRadius, y);
        ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + cornerRadius);
        ctx.lineTo(x + boxWidth, y + boxHeight - cornerRadius);
        ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - cornerRadius, y + boxHeight);
        ctx.lineTo(x + cornerRadius, y + boxHeight);
        ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // レイヤー番号を「#数字」形式で中央に表示
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = colors.headerText;
        ctx.textAlign = 'center';
        const centerX = keyboardCenterX; // キーボードレイアウトの中央を使用
        const centerY = y + boxHeight / 2 + 6;
        ctx.fillText(`#${layerIndex}`, centerX, centerY);
    }
}