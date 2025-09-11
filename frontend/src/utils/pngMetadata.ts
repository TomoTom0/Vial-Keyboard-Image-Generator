// PNG画像にメタデータを埋め込むユーティリティ
// draw.io形式のようにPNG tEXtチャンクにJSONデータを埋め込む

export interface PngMetadata {
  vilConfig?: string;      // VIL設定JSON文字列
  settings?: string;       // 生成設定JSON文字列
  timestamp?: string;      // 生成日時
  generator?: string;      // 生成アプリ名
}

/**
 * PNG画像のDataURLにメタデータを埋め込む
 */
export function embedMetadataToPng(dataUrl: string, metadata: PngMetadata): string {
  console.log('🔄 embedMetadataToPng called with:', { dataUrl: dataUrl.substring(0, 50) + '...', metadata })
  try {
    // DataURLからbase64部分を抽出
    const base64Data = dataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // PNGヘッダー確認 (89 50 4E 47)
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
      throw new Error('Not a valid PNG file');
    }
    
    // IHDRチャンクの後ろにtEXtチャンクを挿入する位置を探す
    let insertPos = 8; // PNGヘッダー後
    
    // IHDRチャンクをスキップ
    const ihdrLength = (bytes[8] << 24) | (bytes[9] << 16) | (bytes[10] << 8) | bytes[11];
    insertPos += 4 + 4 + ihdrLength + 4; // length + type + data + CRC
    
    // 新しいバッファを作成
    const textChunks: Uint8Array[] = [];
    
    // メタデータをtEXtチャンクとして作成
    Object.entries(metadata).forEach(([key, value]) => {
      if (value) {
        const textChunk = createTextChunk(key, value);
        textChunks.push(textChunk);
      }
    });
    
    // 全体のサイズを計算
    const totalTextSize = textChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const newBytes = new Uint8Array(bytes.length + totalTextSize);
    
    // 元の画像データをコピー
    newBytes.set(bytes.subarray(0, insertPos), 0);
    
    // tEXtチャンクを挿入
    let currentPos = insertPos;
    textChunks.forEach(chunk => {
      newBytes.set(chunk, currentPos);
      currentPos += chunk.length;
    });
    
    // 残りの画像データをコピー
    newBytes.set(bytes.subarray(insertPos), currentPos);
    
    // 新しいDataURLを作成（大きなUint8Arrayを安全に変換）
    let resultBinaryString = '';
    const chunkSize = 32768; // 32KB chunks to avoid call stack overflow
    for (let i = 0; i < newBytes.length; i += chunkSize) {
      const chunk = newBytes.subarray(i, Math.min(i + chunkSize, newBytes.length));
      resultBinaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const newBase64 = btoa(resultBinaryString);
    const result = `data:image/png;base64,${newBase64}`;
    console.log('✅ Metadata embedded successfully, size increased from', bytes.length, 'to', newBytes.length, 'bytes');
    return result;
    
  } catch (error) {
    console.error('❌ Failed to embed metadata:', error);
    return dataUrl; // エラー時は元のDataURLを返す
  }
}

/**
 * PNGのtEXtチャンクを作成
 */
function createTextChunk(keyword: string, text: string): Uint8Array {
  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);
  const dataLength = keywordBytes.length + 1 + textBytes.length; // keyword + null separator + text
  
  // チャンク構造: length(4) + type(4) + data + CRC(4)
  const chunk = new Uint8Array(4 + 4 + dataLength + 4);
  let pos = 0;
  
  // Length (Big Endian)
  chunk[pos++] = (dataLength >>> 24) & 0xFF;
  chunk[pos++] = (dataLength >>> 16) & 0xFF;
  chunk[pos++] = (dataLength >>> 8) & 0xFF;
  chunk[pos++] = dataLength & 0xFF;
  
  // Type "tEXt"
  chunk[pos++] = 0x74; // 't'
  chunk[pos++] = 0x45; // 'E'
  chunk[pos++] = 0x58; // 'X'
  chunk[pos++] = 0x74; // 't'
  
  // Data (keyword + null + text)
  chunk.set(keywordBytes, pos);
  pos += keywordBytes.length;
  chunk[pos++] = 0; // null separator
  chunk.set(textBytes, pos);
  pos += textBytes.length;
  
  // CRC (type + data)
  const crcData = chunk.subarray(4, pos);
  const crc = calculateCRC32(crcData);
  chunk[pos++] = (crc >>> 24) & 0xFF;
  chunk[pos++] = (crc >>> 16) & 0xFF;
  chunk[pos++] = (crc >>> 8) & 0xFF;
  chunk[pos++] = crc & 0xFF;
  
  return chunk;
}

/**
 * PNG画像からメタデータを抽出
 */
export function extractMetadataFromPng(dataUrl: string): PngMetadata | null {
  try {
    const base64Data = dataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // PNGヘッダー確認
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
      return null;
    }
    
    const metadata: PngMetadata = {};
    let pos = 8; // PNGヘッダー後
    
    // チャンクを順次読み取り
    while (pos < bytes.length - 8) {
      const length = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
      const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      
      if (type === 'tEXt') {
        // tEXtチャンクからキーワードとテキストを抽出
        const dataStart = pos + 8;
        const dataEnd = dataStart + length;
        const data = bytes.subarray(dataStart, dataEnd);
        
        // null区切りでキーワードとテキストを分離
        let nullPos = -1;
        for (let i = 0; i < data.length; i++) {
          if (data[i] === 0) {
            nullPos = i;
            break;
          }
        }
        
        if (nullPos !== -1) {
          const keyword = new TextDecoder().decode(data.subarray(0, nullPos));
          const text = new TextDecoder().decode(data.subarray(nullPos + 1));
          
          // メタデータフィールドにマッピング（PngMetadata interface のプロパティ）
          if (keyword === 'vilConfig' || keyword === 'settings' || keyword === 'timestamp' || keyword === 'generator') {
            (metadata as any)[keyword] = text;
          }
        }
      }
      
      // IENDチャンクで終了
      if (type === 'IEND') {
        break;
      }
      
      pos += 4 + 4 + length + 4; // length + type + data + CRC
    }
    
    return Object.keys(metadata).length > 0 ? metadata : null;
    
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    return null;
  }
}

/**
 * CRC32計算（PNG仕様準拠）
 */
function calculateCRC32(data: Uint8Array): number {
  const table: number[] = [];
  
  // CRC32テーブル初期化
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}