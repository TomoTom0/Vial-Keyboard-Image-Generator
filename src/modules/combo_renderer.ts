// Combo描画モジュール
import { CanvasRenderingContext2D, createCanvas } from 'canvas';
import { ComboInfo, COLORS_LEGACY, getThemeColors } from './types';

export class ComboRenderer {
    // キーボタンを描画（キーキャップスタイル、キーボードと同サイズ、サブテキスト対応）
    private static drawKeyButton(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, isAction: boolean = false, subTexts?: string[], isComboInputKey: boolean = false, colors?: any, scale: number = 1.0, highlightComboKeys: boolean = true, showComboMarkers: boolean = true): number {
        // キーボードと同じサイズ（スケール対応）
        const buttonWidth = Math.floor(78 * scale);  
        const buttonHeight = Math.floor(60 * scale);

        // ボタンの色設定
        // サブテキストがあるキーは特別色、アクションボタンは通常色
        const hasSubTexts = subTexts && subTexts.length > 0;
        const shouldUseSpecialColor = (hasSubTexts && highlightComboKeys && !isAction) || (isComboInputKey && highlightComboKeys);
        
        // カラーパレットの取得（引数で渡されない場合はレガシー色を使用）
        const colorPalette = colors || COLORS_LEGACY;
        const buttonColor = shouldUseSpecialColor ? colorPalette.keySpecial : colorPalette.keyNormal;
        const borderColor = shouldUseSpecialColor ? colorPalette.borderSpecial : colorPalette.borderNormal;
        const textColor = shouldUseSpecialColor ? colorPalette.textSpecial : colorPalette.textNormal;

        // ボタン背景を描画（キーキャップスタイル）
        ctx.fillStyle = buttonColor;
        ctx.fillRect(x + 1, y + 1, buttonWidth - 2, buttonHeight - 2);

        // ボタンボーダーを描画
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, buttonWidth, buttonHeight);

        // Combo入力キーには右上に直角三角形マーカーを追加
        if (isComboInputKey) {
            const triangleSize = Math.floor(12 * scale);
            ctx.fillStyle = '#ff6b6b'; // 赤色のマーカー
            ctx.beginPath();
            ctx.moveTo(x + buttonWidth - triangleSize, y);
            ctx.lineTo(x + buttonWidth, y);
            ctx.lineTo(x + buttonWidth, y + triangleSize);
            ctx.closePath();
            ctx.fill();
        }

        // メインテキストを描画
        let fontSize: number;
        if (text.length === 1) {
            fontSize = Math.floor(24 * scale); // 単一文字
        } else if (text.length > 8) {
            fontSize = Math.floor(14 * scale); // 長いテキスト
        } else if (subTexts && subTexts.length > 0) {
            fontSize = Math.floor(20 * scale); // サブテキストがある場合
        } else {
            fontSize = Math.floor(18 * scale); // 通常サイズ
        }

        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        
        // メインテキストを上に寄せて配置
        const mainY = y + buttonHeight * 0.35;
        ctx.fillText(text, x + buttonWidth / 2, mainY);

        // サブテキストの描画
        if (subTexts && subTexts.length > 0) {
            ctx.fillStyle = colorPalette.textSub;
            
            if (subTexts.length === 1) {
                // 単一のサブテキストは大きな文字で中央に表示
                ctx.font = `${Math.floor(14 * scale)}px Arial, sans-serif`;
                const subY = y + buttonHeight * 0.75;
                ctx.fillText(subTexts[0], x + buttonWidth / 2, subY);
            } else {
                // 複数のサブテキストは一行に二個ずつ配置
                const startY = y + buttonHeight * 0.65;
                const lineHeight = Math.floor(13 * scale);
                
                for (let i = 0; i < subTexts.length; i += 2) {
                    const row = Math.floor(i / 2);
                    const subY = startY + (row * lineHeight);
                    
                    if (i + 1 < subTexts.length) {
                        // 一行に二個表示：左側は少し大きく、右側は通常サイズ
                        const leftX = x + buttonWidth * 0.25;
                        const rightX = x + buttonWidth * 0.75;
                        
                        // 左側（もう少し大きく、太字で視認性向上）
                        ctx.font = `bold ${Math.floor(13 * scale)}px Arial, sans-serif`;
                        ctx.fillText(subTexts[i], leftX, subY);
                        
                        // 右側（通常サイズ、太字で視認性向上）
                        ctx.font = `bold ${Math.floor(11 * scale)}px Arial, sans-serif`;
                        ctx.fillText(subTexts[i + 1], rightX, subY);
                    } else {
                        // 奇数個の場合、最後の一個は中央に表示（太字で視認性向上）
                        ctx.font = `bold ${Math.floor(11 * scale)}px Arial, sans-serif`;
                        ctx.fillText(subTexts[i], x + buttonWidth / 2, subY);
                    }
                }
            }
        }

        // Combo入力キーには右上に直角三角形マーカーを追加
        if (isComboInputKey && showComboMarkers) {
            const triangleSize = Math.floor(12 * scale);
            ctx.fillStyle = '#ff6b6b'; // 赤色のマーカー
            ctx.beginPath();
            ctx.moveTo(x + buttonWidth - triangleSize, y);
            ctx.lineTo(x + buttonWidth, y);
            ctx.lineTo(x + buttonWidth, y + triangleSize);
            ctx.closePath();
            ctx.fill();
        }

        return buttonWidth;
    }


    // Combo情報を複数配置で描画（横長対応）
    static drawCombos(combos: ComboInfo[], width: number, isWideLayout: boolean = false, theme: 'dark' | 'light' = 'dark', scale: number = 1.0, highlightComboKeys: boolean = true, showComboMarkers: boolean = true): { canvas: any, height: number } {
        if (combos.length === 0) {
            // Comboがない場合は高さ0のキャンバスを返す
            const canvas = createCanvas(width, 1);
            return { canvas, height: 0 };
        }

        console.log(`Combo情報を描画します: ${combos.length}個`);

        // Comboをフィルタリングしてグループ分け（1個の入力キーは除外）
        const validCombos = combos.filter(combo => combo.keys.length >= 2); // 2個以上の入力キーのみ表示
        const shortCombos = validCombos.filter(combo => combo.keys.length <= 3); // 2-3個の入力キー
        const longCombos = validCombos.filter(combo => combo.keys.length >= 4);  // 4個以上の入力キー

        if (validCombos.length === 0) {
            // 有効なComboがない場合は高さ0のキャンバスを返す
            const canvas = createCanvas(width, 1);
            return { canvas, height: 0 };
        }

        console.log(`有効なCombo情報を描画します: ${validCombos.length}個 (${shortCombos.length}個の短いCombo, ${longCombos.length}個の長いCombo)`);

        // 描画サイズを計算
        const margin = 15;
        const lineHeight = 70; // キーボードボタン高さ60px + 余白10px
        const headerHeight = 45;  // 見出しフォントサイズ拡大に合わせて高さも拡大
        
        // 短いCombo（2-3個の入力キー）の列数設定
        // 横長レイアウトの場合は6列、縦長は3列  
        const shortComboColumnsCount = isWideLayout ? 6 : 3;
        // 長いCombo（4個以上の入力キー）の列数設定
        // 横長レイアウトの場合は4列、縦長は2列
        const longComboColumnsCount = isWideLayout ? 4 : 2;
        console.log(`レイアウト: ${isWideLayout ? '横長' : '縦長'} (${shortComboColumnsCount}列配置)`);
        
        // 短いComboは指定列数ずつ、長いComboも指定列数ずつ配置
        const shortComboRows = Math.ceil(shortCombos.length / shortComboColumnsCount);
        const longComboRows = Math.ceil(longCombos.length / longComboColumnsCount);
        const totalRows = shortComboRows + longComboRows;
        
        const baseTotalHeight = headerHeight + (totalRows * lineHeight) + margin;
        
        // スケールを適用したサイズを計算
        const scaledWidth = Math.floor(width * scale);
        const scaledHeight = Math.floor(baseTotalHeight * scale);
        const scaledMargin = Math.floor(margin * scale);
        const scaledHeaderHeight = Math.floor(headerHeight * scale);
        const scaledLineHeight = Math.floor(lineHeight * scale);

        // キャンバスを作成
        const canvas = createCanvas(scaledWidth, scaledHeight);
        const ctx = canvas.getContext('2d');
        
        // 低品質の場合は描画品質を下げる
        if (scale < 1.0) {
            ctx.imageSmoothingEnabled = false; // アンチエイリアシング無効化
        }

        // テーマ色を取得して背景を塗りつぶし
        const colors = getThemeColors(theme);
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, scaledWidth, scaledHeight);

        // ヘッダー背景を描画（高さを拡大）
        ctx.fillStyle = colors.headerBackground;
        ctx.fillRect(0, 0, scaledWidth, Math.floor(37 * scale));

        // ヘッダーを描画（フォントサイズを2倍に拡大）
        ctx.font = `bold ${Math.floor(32 * scale)}px Arial, sans-serif`;
        ctx.fillStyle = colors.headerText;
        ctx.textAlign = 'left';
        ctx.fillText('COMBOS', Math.floor(15 * scale), Math.floor(28 * scale));

        // 区切り線を描画（位置を拡大されたヘッダーに合わせて調整）
        ctx.strokeStyle = colors.headerBorder;
        ctx.lineWidth = Math.max(1, Math.floor(1 * scale));
        ctx.beginPath();
        ctx.moveTo(Math.floor(15 * scale), Math.floor(37 * scale));
        ctx.lineTo(scaledWidth - Math.floor(15 * scale), Math.floor(37 * scale));
        ctx.stroke();

        // 短いCombo（2-3個の入力キー）を縦優先で配置
        let currentRow = 0;
        const columnCombos: ComboInfo[][] = Array.from({ length: shortComboColumnsCount }, () => []);
        
        // 縦方向優先で各列に分割
        const rowsPerColumn = Math.ceil(shortCombos.length / shortComboColumnsCount);
        for (let i = 0; i < shortCombos.length; i++) {
            const columnIndex = Math.floor(i / rowsPerColumn);
            if (columnIndex < shortComboColumnsCount) {
                columnCombos[columnIndex].push(shortCombos[i]);
            }
        }
        
        // 各列を同時に描画
        const maxRows = Math.max(...columnCombos.map(col => col.length));
        for (let row = 0; row < maxRows; row++) {
            const y = scaledHeaderHeight + scaledMargin + (currentRow * scaledLineHeight);
            
            // 各列のComboを描画
            for (let col = 0; col < shortComboColumnsCount; col++) {
                if (row < columnCombos[col].length) {
                    let columnX;
                    // 利用可能幅を列数で分割
                    const availableWidth = scaledWidth - (scaledMargin * 2);
                    const columnWidth = availableWidth / shortComboColumnsCount;
                    columnX = scaledMargin + col * columnWidth;
                    ComboRenderer.drawSingleCombo(ctx, columnCombos[col][row], columnX, y, colors, scale, highlightComboKeys, showComboMarkers);
                }
            }
            
            currentRow++;
        }

        // 長いCombo（4個以上の入力キー）を複数列で配置
        const longColumnCombos: ComboInfo[][] = Array.from({ length: longComboColumnsCount }, () => []);
        
        // 縦方向優先で各列に分割
        const longRowsPerColumn = Math.ceil(longCombos.length / longComboColumnsCount);
        for (let i = 0; i < longCombos.length; i++) {
            const columnIndex = Math.floor(i / longRowsPerColumn);
            if (columnIndex < longComboColumnsCount) {
                longColumnCombos[columnIndex].push(longCombos[i]);
            }
        }
        
        // 各列を同時に描画
        const maxLongRows = Math.max(...longColumnCombos.map(col => col.length));
        for (let row = 0; row < maxLongRows; row++) {
            const y = scaledHeaderHeight + scaledMargin + (currentRow * scaledLineHeight);
            
            // 各列のComboを描画
            for (let col = 0; col < longComboColumnsCount; col++) {
                if (row < longColumnCombos[col].length) {
                    let columnX;
                    // 利用可能幅を列数で分割
                    const availableWidth = scaledWidth - (scaledMargin * 2);
                    const columnWidth = availableWidth / longComboColumnsCount;
                    columnX = scaledMargin + col * columnWidth;
                    ComboRenderer.drawSingleCombo(ctx, longColumnCombos[col][row], columnX, y, colors, scale, highlightComboKeys, showComboMarkers);
                }
            }
            
            currentRow++;
        }

        return { canvas, height: baseTotalHeight };
    }

    // 単一のComboを描画（インデックス付き）
    private static drawSingleCombo(ctx: CanvasRenderingContext2D, combo: ComboInfo, startX: number, y: number, colors: any, scale: number = 1.0, highlightComboKeys: boolean = true, showComboMarkers: boolean = true): void {
        let currentX = startX;

        // インデックス番号を描画（スケール対応）
        ctx.fillStyle = colors.textNormal;
        ctx.font = `bold ${Math.floor(28 * scale)}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`#${combo.index}`, currentX, y + Math.floor(30 * scale));
        currentX += Math.floor(50 * scale);

        // 左側にアクションボタンを描画（サブテキスト付き）
        const actionButtonWidth = ComboRenderer.drawKeyButton(ctx, combo.action, currentX, y, true, combo.actionSubTexts, false, colors, scale, highlightComboKeys, showComboMarkers);
        currentX += actionButtonWidth + Math.floor(15 * scale);

        // ダッシュを描画（ボタンの中央の高さに合わせる）
        ctx.fillStyle = colors.textSub;
        ctx.font = `${Math.floor(14 * scale)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('────', currentX + Math.floor(20 * scale), y + Math.floor(30 * scale));
        currentX += Math.floor(50 * scale);

        // 組み合わせキーをボタンとして描画（サブテキスト付き）
        for (let j = 0; j < combo.keys.length; j++) {
            const key = combo.keys[j];
            const keySubTexts = combo.keySubTexts[j]; // 各キーのサブテキストを取得
            
            // キーボタンを描画（サブテキスト付き、Combo入力キーマーカー付き）
            const buttonWidth = ComboRenderer.drawKeyButton(ctx, key, currentX, y, false, keySubTexts, true, colors, scale, highlightComboKeys, showComboMarkers);
            currentX += buttonWidth + Math.floor(8 * scale);
        }

        console.log(`Combo #${combo.index}: ${combo.description}`);
    }
}