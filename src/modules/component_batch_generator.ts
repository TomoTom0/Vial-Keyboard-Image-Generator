// コンポーネント一括生成モジュール
import * as fs from 'fs';
import * as path from 'path';
import { VialKeyboardImageGenerator } from './generator';
import { ComboRenderer } from './combo_renderer';
import { ImageCombiner } from './combiner';
import { Parser } from './parser';
import { Utils } from './utils';
import { RenderOptions } from './types';

interface ComponentGeneratorOptions {
    configPath: string;
    colorMode: 'dark' | 'light';
    comboHighlight: boolean;
    subtextHighlight: boolean;
    quality: 'high' | 'low';
}

export class ComponentBatchGenerator {
    // 全コンポーネント画像を一括生成
    static async generateAllComponents(options: ComponentGeneratorOptions): Promise<void> {
        const {
            configPath,
            colorMode,
            comboHighlight,
            subtextHighlight,
            quality
        } = options;

        // 設定ファイル名を取得（拡張子なし）
        const configName = path.basename(configPath, '.vil');
        
        // 出力フォルダパスを構築
        const comboFlag = comboHighlight ? '1' : '0';
        const subtextFlag = subtextHighlight ? '1' : '0';
        const outputDir = path.join('output', configName, colorMode, `${comboFlag}-${subtextFlag}`);
        
        // 出力フォルダを作成
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`コンポーネント一括生成開始: ${outputDir}`);

        // Vial設定を読み込み
        const config = Utils.loadVialConfig(configPath);
        
        // 品質設定に応じてスケール倍率を決定
        const scale = quality === 'low' ? 0.5 : 1.0;
        
        // レンダリングオプションを設定
        const renderOptions: RenderOptions = {
            theme: colorMode,
            highlightComboKeys: comboHighlight,
            highlightSubtextKeys: subtextHighlight,
            showComboMarkers: comboHighlight
        };

        // キーボード画像の幅を取得するために一時生成
        const generator = new VialKeyboardImageGenerator();
        const tempPath = path.join(outputDir, 'temp.png');
        generator.generateKeyboardImage(configPath, tempPath, 0, renderOptions);
        const { loadImage } = require('canvas');
        const tempImage = await loadImage(tempPath);
        const baseImageWidth = tempImage.width;
        const imageWidth = Math.floor(baseImageWidth * scale);
        fs.unlinkSync(tempPath); // 一時ファイル削除

        // 1. 個別レイヤー画像を生成
        const layerPaths: string[] = [];
        for (let layerIndex = 0; layerIndex < config.layout.length; layerIndex++) {
            const layerPath = path.join(outputDir, `layer${layerIndex}-${quality}.png`);
            generator.generateKeyboardImage(configPath, layerPath, layerIndex, renderOptions, scale);
            layerPaths.push(layerPath);
            console.log(`レイヤー${layerIndex}生成完了: ${layerPath}`);
        }

        // 2. コンボ情報画像を生成（normalとwide）
        const combos = Parser.parseComboInfo(config);
        
        // 1x幅でコンボ情報生成
        const combo1xResult = ComboRenderer.drawCombos(
            combos, 
            baseImageWidth, 
            false, 
            colorMode, 
            scale, 
            false,           // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight   // showComboMarkers（三角マーカーのみ）
        );
        const combo1xBuffer = combo1xResult.canvas.toBuffer('image/png');
        const combo1xPath = path.join(outputDir, `combo-1x-${quality}.png`);
        fs.writeFileSync(combo1xPath, combo1xBuffer);
        console.log(`コンボ情報（1x）生成完了: ${combo1xPath}`);

        // 2x幅でコンボ情報生成
        const combo2xResult = ComboRenderer.drawCombos(
            combos, 
            baseImageWidth * 2, 
            true, 
            colorMode, 
            scale, 
            false,           // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight   // showComboMarkers（三角マーカーのみ）
        );
        const combo2xBuffer = combo2xResult.canvas.toBuffer('image/png');
        const combo2xPath = path.join(outputDir, `combo-2x-${quality}.png`);
        fs.writeFileSync(combo2xPath, combo2xBuffer);
        console.log(`コンボ情報（2x）生成完了: ${combo2xPath}`);

        // 3x幅でコンボ情報生成
        const combo3xResult = ComboRenderer.drawCombos(
            combos, 
            baseImageWidth * 3, 
            true, 
            colorMode, 
            scale, 
            false,           // highlightComboKeys（背景色ハイライトは無効）
            comboHighlight   // showComboMarkers（三角マーカーのみ）
        );
        const combo3xBuffer = combo3xResult.canvas.toBuffer('image/png');
        const combo3xPath = path.join(outputDir, `combo-3x-${quality}.png`);
        fs.writeFileSync(combo3xPath, combo3xBuffer);
        console.log(`コンボ情報（3x）生成完了: ${combo3xPath}`);

        // 3. レイアウト見出し画像を生成（1x, 2x, 3x幅）
        // 1x幅ヘッダー
        const header1xBuffer = await ImageCombiner.generateHeaderImage(
            baseImageWidth,
            colorMode,
            path.basename(configPath),
            scale
        );
        const header1xPath = path.join(outputDir, `header-1x-${quality}.png`);
        fs.writeFileSync(header1xPath, header1xBuffer);
        console.log(`レイアウト見出し画像（1x）生成完了: ${header1xPath}`);

        // 2x幅ヘッダー
        const header2xBuffer = await ImageCombiner.generateHeaderImage(
            baseImageWidth * 2,
            colorMode,
            path.basename(configPath),
            scale
        );
        const header2xPath = path.join(outputDir, `header-2x-${quality}.png`);
        fs.writeFileSync(header2xPath, header2xBuffer);
        console.log(`レイアウト見出し画像（2x）生成完了: ${header2xPath}`);

        // 3x幅ヘッダー
        const header3xBuffer = await ImageCombiner.generateHeaderImage(
            baseImageWidth * 3,
            colorMode,
            path.basename(configPath),
            scale
        );
        const header3xPath = path.join(outputDir, `header-3x-${quality}.png`);
        fs.writeFileSync(header3xPath, header3xBuffer);
        console.log(`レイアウト見出し画像（3x）生成完了: ${header3xPath}`);

        // 4. 結合画像を生成（生成済みコンポーネントを使用）
        // 縦配置結合（1x幅ヘッダーを使用）
        const combinedVerticalPath = path.join(outputDir, `combined-vertical-${quality}.png`);
        await ImageCombiner.combineVerticalFromComponents(
            layerPaths,
            header1xPath,
            combo1xPath,
            combinedVerticalPath,
            colorMode
        );
        console.log(`縦配置結合画像生成完了: ${combinedVerticalPath}`);

        // 横配置結合（3x幅ヘッダーを使用）
        const combinedHorizontalPath = path.join(outputDir, `combined-horizontal-${quality}.png`);
        await ImageCombiner.combineHorizontalFromComponents(
            layerPaths,
            header3xPath,
            combo3xPath,
            combinedHorizontalPath,
            colorMode
        );
        console.log(`横配置結合画像生成完了: ${combinedHorizontalPath}`);

        console.log(`全コンポーネント生成完了: ${outputDir}`);
    }
}