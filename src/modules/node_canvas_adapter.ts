// Node.js用canvasアダプター
import { createCanvas } from 'canvas';

export class NodeCanvasAdapter {
    createCanvas(width: number, height: number): any {
        return createCanvas(width, height);
    }
    
    getContext(canvas: any): any {
        return canvas.getContext('2d');
    }
}