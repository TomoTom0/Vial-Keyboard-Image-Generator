use serde::{Deserialize, Serialize};
use std::fs;
use std::error::Error;
use image::{Rgb, RgbImage};
use imageproc::drawing::{draw_filled_rect_mut, draw_text_mut};
use imageproc::rect::Rect;
use ab_glyph::{Font, FontRef, PxScale};

// Vilファイルのデータ構造
#[derive(Serialize, Deserialize, Debug)]
struct VialConfig {
    version: u32,
    uid: u64,
    layout: Vec<Vec<Vec<serde_json::Value>>>,
    #[serde(default)]
    encoder_layout: Vec<Vec<Vec<String>>>,
    layout_options: u32,
    #[serde(default)]
    macro_data: Vec<Vec<String>>,
    vial_protocol: u32,
    via_protocol: u32,
    #[serde(default)]
    tap_dance: Vec<Vec<serde_json::Value>>,
    #[serde(default)]
    combo: Vec<Vec<String>>,
    #[serde(default)]
    key_override: Vec<serde_json::Value>,
    #[serde(default)]
    settings: serde_json::Value,
}

// キーの物理的な位置とサイズを定義
#[derive(Debug, Clone)]
struct KeyPosition {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    rotation: f32, // 親指キー用の回転角度
}

#[derive(Debug, Clone)]
struct KeyLabel {
    main_text: String,
    sub_text: Option<String>,
    is_special: bool, // LT, TD等の特殊キー
}

// Tap Danceデータを解析
fn get_tap_dance_info(config: &VialConfig, td_index: usize) -> Option<(String, String)> {
    if td_index >= config.tap_dance.len() {
        return None;
    }
    
    let td_data = &config.tap_dance[td_index];
    if td_data.len() >= 2 {
        let tap = td_data[0].as_str().unwrap_or("").to_string();
        let hold = td_data[1].as_str().unwrap_or("").to_string();
        
        // キーコードを読みやすいラベルに変換
        let tap_label = simple_keycode_to_label(&tap);
        let hold_label = simple_keycode_to_label(&hold);
        
        Some((tap_label, hold_label))
    } else {
        None
    }
}

// 基本的なキーコード変換（TD解析用）
fn simple_keycode_to_label(keycode: &str) -> String {
    match keycode {
        "KC_MINUS" => "-".to_string(),
        "KC_RSHIFT" => "RShift".to_string(),
        "KC_TAB" => "Tab".to_string(),
        "MO(3)" => "MO3".to_string(),
        "KC_Z" => "Z".to_string(),
        "KC_LALT" => "LAlt".to_string(),
        "KC_X" => "X".to_string(),
        "KC_LGUI" => "LGui".to_string(),
        "KC_C" => "C".to_string(),
        "KC_LCTRL" => "LCtrl".to_string(),
        "KC_V" => "V".to_string(),
        "KC_LSHIFT" => "LShift".to_string(),
        "KC_M" => "M".to_string(),
        "KC_COMMA" => ",".to_string(),
        "KC_RCTRL" => "RCtrl".to_string(),
        "KC_DOT" => ".".to_string(),
        "KC_RGUI" => "RGui".to_string(),
        "KC_NO" => "".to_string(),
        _ => keycode.replace("KC_", ""),
    }
}

// キーコードをラベル構造体に変換
fn keycode_to_label(keycode: &serde_json::Value, config: &VialConfig) -> KeyLabel {
    match keycode {
        serde_json::Value::String(s) => {
            if s.starts_with("KC_") {
                // 基本キーコード
                let label = match s.as_str() {
                    "KC_Q" => "Q".to_string(),
                    "KC_W" => "W".to_string(),
                    "KC_E" => "E".to_string(),
                    "KC_R" => "R".to_string(),
                    "KC_T" => "T".to_string(),
                    "KC_Y" => "Y".to_string(),
                    "KC_U" => "U".to_string(),
                    "KC_I" => "I".to_string(),
                    "KC_O" => "O".to_string(),
                    "KC_P" => "P".to_string(),
                    "KC_A" => "A".to_string(),
                    "KC_S" => "S".to_string(),
                    "KC_D" => "D".to_string(),
                    "KC_F" => "F".to_string(),
                    "KC_G" => "G".to_string(),
                    "KC_H" => "H".to_string(),
                    "KC_J" => "J".to_string(),
                    "KC_K" => "K".to_string(),
                    "KC_L" => "L".to_string(),
                    "KC_Z" => "Z".to_string(),
                    "KC_X" => "X".to_string(),
                    "KC_C" => "C".to_string(),
                    "KC_V" => "V".to_string(),
                    "KC_B" => "B".to_string(),
                    "KC_N" => "N".to_string(),
                    "KC_M" => "M".to_string(),
                    "KC_SPACE" => "Space".to_string(),
                    "KC_ENTER" => "Enter".to_string(),
                    "KC_TAB" => "Tab".to_string(),
                    "KC_BSPACE" => "Bksp".to_string(),
                    "KC_LSHIFT" => "LShift".to_string(),
                    "KC_RSHIFT" => "RShift".to_string(),
                    "KC_LCTRL" => "LCtrl".to_string(),
                    "KC_RCTRL" => "RCtrl".to_string(),
                    "KC_LALT" => "LAlt".to_string(),
                    "KC_RALT" => "RAlt".to_string(),
                    "KC_LGUI" => "LGui".to_string(),
                    "KC_RGUI" => "RGui".to_string(),
                    "KC_CAPSLOCK" => "Caps".to_string(),
                    "KC_SLASH" => "?/".to_string(),
                    "KC_COMMA" => ",".to_string(),
                    "KC_DOT" => ".".to_string(),
                    "KC_MINUS" => "-".to_string(),
                    "KC_PSCREEN" => "Print\nScreen".to_string(),
                    "KC_MHEN" => "MHEN".to_string(),
                    "KC_NO" => "".to_string(),
                    _ => s.replace("KC_", ""),
                };
                KeyLabel { main_text: label, sub_text: None, is_special: false }
            } else if s.starts_with("TD(") {
                // Tap Dance処理
                let td_num_str = s.trim_start_matches("TD(").trim_end_matches(")");
                if let Ok(td_index) = td_num_str.parse::<usize>() {
                    if let Some((tap, hold)) = get_tap_dance_info(config, td_index) {
                        if !tap.is_empty() && !hold.is_empty() {
                            KeyLabel { main_text: tap, sub_text: Some(hold), is_special: true }
                        } else {
                            KeyLabel { main_text: format!("TD({})", td_index), sub_text: None, is_special: true }
                        }
                    } else {
                        KeyLabel { main_text: s.clone(), sub_text: None, is_special: true }
                    }
                } else {
                    KeyLabel { main_text: s.clone(), sub_text: None, is_special: true }
                }
            } else if s.starts_with("LT") {
                // レイヤータップ処理 - LT1(KC_SPACE) -> main_text: "SPACE", sub_text: "LT1"（順序修正）
                let formatted = s.replace("(KC_", "|").replace(")", "");
                let parts: Vec<&str> = formatted.split('|').collect();
                if parts.len() == 2 {
                    let main_text = parts[1].to_string(); // キー機能をメインに
                    let sub_text = parts[0].to_string(); // レイヤー名をサブに
                    KeyLabel { main_text, sub_text: Some(sub_text), is_special: true }
                } else {
                    KeyLabel { main_text: s.clone(), sub_text: None, is_special: true }
                }
            } else if s.starts_with("TO(") {
                KeyLabel { main_text: s.clone(), sub_text: None, is_special: true }
            } else {
                KeyLabel { main_text: s.clone(), sub_text: None, is_special: false }
            }
        }
        serde_json::Value::Number(n) => {
            if n.as_i64() == Some(-1) {
                KeyLabel { main_text: String::new(), sub_text: None, is_special: false } // 存在しないキー
            } else {
                KeyLabel { main_text: n.to_string(), sub_text: None, is_special: false }
            }
        }
        _ => KeyLabel { main_text: String::new(), sub_text: None, is_special: false },
    }
}

// YIVU40の物理的なキー配置を定義（サンプル画像から正確に再現）
fn get_key_positions(margin: f32) -> Vec<Vec<Option<KeyPosition>>> {
    let key_width = 78.0;  // 横幅（横長プロポーション）
    let key_height = 60.0; // 高さ（コンパクト）
    let key_gap = 4.0;     // 間隔
    let unit_x = key_width + key_gap;
    let unit_y = key_height + key_gap;
    
    vec![
        // 行0: 左上段
        vec![
            Some(KeyPosition { x: margin + 0.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // TO(0)
            Some(KeyPosition { x: margin + unit_x * 1.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // Q
            Some(KeyPosition { x: margin + unit_x * 2.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // W
            Some(KeyPosition { x: margin + unit_x * 3.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // E
            Some(KeyPosition { x: margin + unit_x * 4.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // R
            Some(KeyPosition { x: margin + unit_x * 5.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // T
            Some(KeyPosition { x: margin + unit_x * 6.0 + 15.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // Print Screen
        ],
        // 行1: 左中段
        vec![
            Some(KeyPosition { x: margin + 0.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(9)
            Some(KeyPosition { x: margin + unit_x * 1.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // A
            Some(KeyPosition { x: margin + unit_x * 2.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // S
            Some(KeyPosition { x: margin + unit_x * 3.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // D
            Some(KeyPosition { x: margin + unit_x * 4.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // F
            Some(KeyPosition { x: margin + unit_x * 5.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // G
            Some(KeyPosition { x: margin + unit_x * 6.0 + 15.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // Tab
        ],
        // 行2: 左下段
        vec![
            Some(KeyPosition { x: margin + 0.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // LCtrl
            Some(KeyPosition { x: margin + unit_x * 1.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(2)
            Some(KeyPosition { x: margin + unit_x * 2.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(3)
            Some(KeyPosition { x: margin + unit_x * 3.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(4)
            Some(KeyPosition { x: margin + unit_x * 4.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(5)
            Some(KeyPosition { x: margin + unit_x * 5.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // B
            None, // -1
        ],
        // 行3: 左親指部（C,Vと水平座標を揃える）
        vec![
            None, // -1
            None, // -1
            None, // -1
            Some(KeyPosition { x: margin + unit_x * 2.0, y: margin + unit_y * 3.0, width: key_width, height: key_height, rotation: 0.0 }), // MHEN (Cと揃える)
            Some(KeyPosition { x: margin + unit_x * 3.0, y: margin + unit_y * 3.0, width: key_width, height: key_height, rotation: 0.0 }), // LT1 Space (Vと揃える)
            Some(KeyPosition { x: margin + unit_x * 4.0, y: margin + unit_y * 3.0, width: key_width * 1.5, height: key_height, rotation: 0.0 }), // LCtrl (横長)
            None, // -1
        ],
        // 行4: 右上段
        vec![
            Some(KeyPosition { x: margin + unit_x * 14.0 + 30.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // KC_NO
            Some(KeyPosition { x: margin + unit_x * 13.0 + 30.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // P
            Some(KeyPosition { x: margin + unit_x * 12.0 + 30.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // O
            Some(KeyPosition { x: margin + unit_x * 11.0 + 30.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // I
            Some(KeyPosition { x: margin + unit_x * 10.0 + 30.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // U
            Some(KeyPosition { x: margin + unit_x * 9.0 + 30.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // Y
            Some(KeyPosition { x: margin + unit_x * 8.0 + 15.0, y: margin + 0.0, width: key_width, height: key_height, rotation: 0.0 }), // RAlt
        ],
        // 行5: 右中段
        vec![
            Some(KeyPosition { x: margin + unit_x * 14.0 + 30.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(0)
            Some(KeyPosition { x: margin + unit_x * 13.0 + 30.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // Bksp
            Some(KeyPosition { x: margin + unit_x * 12.0 + 30.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // L
            Some(KeyPosition { x: margin + unit_x * 11.0 + 30.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // K
            Some(KeyPosition { x: margin + unit_x * 10.0 + 30.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // J
            Some(KeyPosition { x: margin + unit_x * 9.0 + 30.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // H
            Some(KeyPosition { x: margin + unit_x * 8.0 + 15.0, y: margin + unit_y * 1.0, width: key_width, height: key_height, rotation: 0.0 }), // RShift
        ],
        // 行6: 右下段
        vec![
            Some(KeyPosition { x: margin + unit_x * 14.0 + 30.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // ?/
            Some(KeyPosition { x: margin + unit_x * 13.0 + 30.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // Enter
            Some(KeyPosition { x: margin + unit_x * 12.0 + 30.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(8)
            Some(KeyPosition { x: margin + unit_x * 11.0 + 30.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(7)
            Some(KeyPosition { x: margin + unit_x * 10.0 + 30.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // TD(6)
            Some(KeyPosition { x: margin + unit_x * 9.0 + 30.0, y: margin + unit_y * 2.0, width: key_width, height: key_height, rotation: 0.0 }), // N
            None, // -1
        ],
        // 行7: 右親指部（M,カンマと水平座標を揃える）
        vec![
            None, // -1
            None, // -1
            None, // -1
            Some(KeyPosition { x: margin + unit_x * 11.0 + 30.0, y: margin + unit_y * 3.0, width: key_width, height: key_height, rotation: 0.0 }), // RGui (カンマと揃える)
            Some(KeyPosition { x: margin + unit_x * 10.0 + 30.0, y: margin + unit_y * 3.0, width: key_width, height: key_height, rotation: 0.0 }), // LT2 Space (Mと揃える)  
            Some(KeyPosition { x: margin + unit_x * 9.0 + 30.0 - key_width * 0.5, y: margin + unit_y * 3.0, width: key_width * 1.5, height: key_height, rotation: 0.0 }), // LT3 Tab (横長、間隔調整)
            None, // -1
        ],
    ]
}

fn generate_keyboard_image(config: &VialConfig) -> Result<(), Box<dyn Error>> {
    // 画像サイズ設定（統一された小さな余白で最適化）
    let margin = 10.0; // 上下左右統一の小さな余白
    let key_width = 78.0;  // 横幅
    let key_height = 60.0; // 高さ
    let key_gap = 4.0;     // 間隔
    let unit_x = key_width + key_gap;
    let unit_y = key_height + key_gap;
    let content_width = unit_x * 14.0 + 30.0 + key_width; // 実際のキーボード幅
    let content_height = unit_y * 3.0 + key_height; // 実際のキーボード高さ
    let img_width = (content_width + margin * 2.0) as u32; // 左右余白を追加
    let img_height = (content_height + margin * 2.0) as u32; // 上下余白を追加
    
    // 画像作成（モダンダークテーマ）
    let mut img = RgbImage::new(img_width, img_height);
    let bg_color = Rgb([28, 28, 32]);  // より洗練されたダークカラー
    
    // 背景を塗りつぶし
    for pixel in img.pixels_mut() {
        *pixel = bg_color;
    }
    
    // フォント設定
    let font_data = include_bytes!("../assets/fonts/DejaVuSans.ttf");
    let font = FontRef::try_from_slice(font_data as &[u8])
        .map_err(|_| "フォントファイルの読み込みに失敗しました")?;
    
    let scale = PxScale::from(18.0); // 2倍解像度対応基本フォントサイズ
    
    // キー配置情報を取得
    let positions = get_key_positions(margin);
    
    // レイヤー0のキーを描画
    if !config.layout.is_empty() {
        let layer0 = &config.layout[0];
        
        for (row_idx, row) in layer0.iter().enumerate() {
            if row_idx >= positions.len() {
                continue;
            }
            
            for (col_idx, keycode) in row.iter().enumerate() {
                if col_idx >= positions[row_idx].len() {
                    continue;
                }
                
                if let Some(pos) = &positions[row_idx][col_idx] {
                    let label = keycode_to_label(keycode, &config);
                    
                    // モダンスタイルのキー描画
                    let (key_color, border_color) = if label.main_text.is_empty() {
                        (Rgb([40, 42, 48]), Rgb([50, 53, 61])) // 空キーは最も暗く
                    } else if label.is_special {
                        (Rgb([45, 52, 70]), Rgb([65, 73, 96])) // 特殊キーはブルー系
                    } else { 
                        (Rgb([52, 58, 70]), Rgb([68, 76, 92])) // 通常キー
                    };
                    
                    // メインキーエリア（少し小さくして縁取りを作る）
                    let main_rect = Rect::at((pos.x + 1.0) as i32, (pos.y + 1.0) as i32)
                        .of_size((pos.width - 2.0) as u32, (pos.height - 2.0) as u32);
                    draw_filled_rect_mut(&mut img, main_rect, key_color);
                    
                    // 細いボーダーで洗練された輪郭
                    // 上縁
                    draw_filled_rect_mut(&mut img, 
                        Rect::at(pos.x as i32, pos.y as i32).of_size(pos.width as u32, 1), 
                        border_color);
                    // 下縁
                    draw_filled_rect_mut(&mut img, 
                        Rect::at(pos.x as i32, (pos.y + pos.height - 1.0) as i32).of_size(pos.width as u32, 1), 
                        border_color);
                    // 左縁
                    draw_filled_rect_mut(&mut img, 
                        Rect::at(pos.x as i32, pos.y as i32).of_size(1, pos.height as u32), 
                        border_color);
                    // 右縁
                    draw_filled_rect_mut(&mut img, 
                        Rect::at((pos.x + pos.width - 1.0) as i32, pos.y as i32).of_size(1, pos.height as u32), 
                        border_color);
                    
                    // ラベルテキストを描画（空でない場合のみ）
                    if !label.main_text.is_empty() {
                        // メインテキストの色とサイズ
                        let main_color = if label.is_special { 
                            Rgb([156, 220, 254]) // モダンなブルーアクセント
                        } else { 
                            Rgb([240, 246, 252]) // ソフトホワイト
                        };
                        // 2倍解像度対応フォントサイズ（視認性とコンパクト性をバランス）
                        let main_scale = if label.main_text.len() == 1 {
                            PxScale::from(24.0) // 単一文字（2倍解像度）
                        } else if label.main_text.len() > 8 {
                            PxScale::from(14.0) // 長いテキスト
                        } else if label.sub_text.is_some() {
                            PxScale::from(20.0) // TD/LTキーのメインテキスト
                        } else {
                            PxScale::from(18.0) // 通常サイズ（2倍解像度）
                        };
                        
                        // メインテキストの位置計算（改行対応）
                        let lines: Vec<&str> = label.main_text.split('\n').collect();
                        let line_height = 16.0; // 2倍解像度に合わせた行間
                        let total_height = lines.len() as f32 * line_height;
                        
                        // 2倍解像度対応：上余白調整
                        let start_y = pos.y + 12.0; // 2倍解像度に合わせて調整
                        
                        for (i, line) in lines.iter().enumerate() {
                            // 文字列の正確な中央揃えを実現
                            let char_count = line.chars().count() as f32;
                            // 文字タイプ別に異なる幅を考慮
                            let estimated_width = if line.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()) {
                                char_count * main_scale.x * 0.65 // 大文字・数字は幅が広め
                            } else if line.chars().all(|c| c.is_ascii_lowercase()) {
                                char_count * main_scale.x * 0.55 // 小文字は幅が狭め
                            } else {
                                char_count * main_scale.x * 0.6  // 混合文字は中間値
                            };
                            let text_x = pos.x + (pos.width - estimated_width) / 2.0;
                            let text_y = start_y + (i as f32 * line_height);
                            draw_text_mut(&mut img, main_color, text_x as i32, text_y as i32, main_scale, &font, line);
                        }
                        
                        // サブテキスト（hold）を描画
                        if let Some(ref sub_text) = label.sub_text {
                            let sub_color = Rgb([156, 163, 175]); // モダンなグレー
                            let sub_scale = PxScale::from(18.0); // サブテキストをさらに大きく（メインテキストに近いサイズ）
                            // サブテキストの正確な中央揃え
                            let char_count = sub_text.chars().count() as f32;
                            let estimated_width = if sub_text.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()) {
                                char_count * sub_scale.x * 0.65 // 大文字・数字
                            } else if sub_text.chars().all(|c| c.is_ascii_lowercase()) {
                                char_count * sub_scale.x * 0.55 // 小文字
                            } else {
                                char_count * sub_scale.x * 0.6  // 混合文字
                            };
                            let sub_x = pos.x + (pos.width - estimated_width) / 2.0;
                            let sub_y = pos.y + pos.height * 0.75; // サブテキストの位置調整
                            draw_text_mut(&mut img, sub_color, sub_x as i32, sub_y as i32, sub_scale, &font, sub_text);
                        }
                    }
                }
            }
        }
    }
    
    // 画像を保存
    img.save("output/keyboard_layout.png")?;
    println!("キーボード画像を生成しました: output/keyboard_layout.png");
    
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {
    println!("Vial Keyboard Image Generator");
    
    // 出力フォルダ作成
    std::fs::create_dir_all("output")?;
    
    // Vilファイルを読み込み
    let vil_path = "data/yivu40-250906.vil";
    let vil_content = fs::read_to_string(vil_path)?;
    let config: VialConfig = serde_json::from_str(&vil_content)?;
    
    println!("読み込み成功: version={}, uid={}", config.version, config.uid);
    println!("レイヤー数: {}", config.layout.len());
    
    // キーボード画像を生成
    generate_keyboard_image(&config)?;
    
    Ok(())
}
