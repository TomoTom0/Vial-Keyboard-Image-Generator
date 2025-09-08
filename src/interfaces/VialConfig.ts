// VIL設定ファイルの型定義

export interface VialConfig {
    version: number;
    uid: number;
    layout: string[][][];
    tap_dance?: (string | number)[][];
}