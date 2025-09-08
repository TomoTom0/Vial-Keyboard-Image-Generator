// キー関連の型定義

export interface KeyPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

export interface KeyLabel {
    mainText: string;
    subText?: string;
    subTexts?: string[];
    isSpecial: boolean;
}

export interface TapDanceInfo {
    tap: string;
    hold?: string;
    doubleTap?: string;
    tapHold?: string;
}