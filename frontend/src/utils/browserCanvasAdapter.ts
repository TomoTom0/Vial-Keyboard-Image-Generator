// ブラウザ用canvasアダプター
export class BrowserCanvasAdapter {
    createCanvas(width: number, height: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    
    getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context');
        }
        return ctx;
    }
}