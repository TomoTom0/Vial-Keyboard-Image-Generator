// 描画モジュール（独立性高い）
import { CanvasRenderingContext2D } from 'canvas';
import { KeyPosition, KeyLabel, COLORS } from './types';

export class Renderer {
    // キーの背景を描画
    static drawKey(ctx: CanvasRenderingContext2D, pos: KeyPosition, label: KeyLabel): void {
        // キーの背景色を決定
        let keyColor: string;
        let borderColor: string;
        
        if (label.mainText === '') {
            keyColor = COLORS.keyEmpty;
            borderColor = COLORS.borderEmpty;
        } else if (label.isSpecial) {
            keyColor = COLORS.keySpecial;
            borderColor = COLORS.borderSpecial;
        } else {
            keyColor = COLORS.keyNormal;
            borderColor = COLORS.borderNormal;
        }

        // メインキーエリア（少し小さくして縁取りを作る）
        ctx.fillStyle = keyColor;
        ctx.fillRect(pos.x + 1, pos.y + 1, pos.width - 2, pos.height - 2);

        // 細いボーダー
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
    }

    // テキストを描画
    static drawText(ctx: CanvasRenderingContext2D, pos: KeyPosition, label: KeyLabel): void {
        if (label.mainText === '') return;

        // フォント設定
        const mainColor = label.isSpecial ? COLORS.textSpecial : COLORS.textNormal;
        
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
            ctx.fillStyle = COLORS.textSub;
            
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
                        
                        // 左側（もう少し大きく）
                        ctx.font = '13px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i], leftX, y);
                        
                        // 右側（通常サイズ）
                        ctx.font = '11px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i + 1], rightX, y);
                    } else {
                        // 奇数個の場合、最後の一個は中央に表示
                        ctx.font = '11px Arial, sans-serif';
                        ctx.fillText(label.subTexts[i], pos.x + pos.width / 2, y);
                    }
                }
            }
        }
    }

    // レイヤー番号を装飾付きで描画
    static drawLayerNumber(ctx: any, layerIndex: number, canvasWidth: number, canvasHeight: number): void {
        const margin = 20;
        const boxWidth = 80;
        const boxHeight = 40;
        const x = margin;
        const y = canvasHeight - margin - boxHeight;
        const cornerRadius = 8;

        // 背景ボックスを描画（角丸四角形）
        ctx.fillStyle = '#2a2d35';
        ctx.strokeStyle = '#4a5568';
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

        // "LAYER"テキストを上部に小さく表示
        ctx.font = '10px Arial, sans-serif';
        ctx.fillStyle = '#a0aec0';
        ctx.textAlign = 'center';
        ctx.fillText('LAYER', x + boxWidth / 2, y + 15);

        // レイヤー番号を大きく中央に表示
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(layerIndex.toString(), x + boxWidth / 2, y + 32);
    }
}