// Node.js用renderアダプター
import { Renderer } from './renderer';

export class NodeRenderAdapter {
    drawKey(ctx: any, pos: any, label: any, keycode?: string, combos?: any[], options?: any): void {
        Renderer.drawKey(ctx, pos, label, keycode, combos, options);
    }
    
    drawText(ctx: any, pos: any, label: any, keycode?: string, combos?: any[], options?: any): void {
        Renderer.drawText(ctx, pos, label, keycode, combos, options);
    }
    
    drawLayerNumber(ctx: any, layerIndex: number, canvasWidth: number, canvasHeight: number, options?: any): void {
        Renderer.drawLayerNumber(ctx, layerIndex, canvasWidth, canvasHeight, options);
    }
}