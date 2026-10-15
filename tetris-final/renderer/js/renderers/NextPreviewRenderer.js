// ===== Next 预览渲染器（共享逻辑） =====
// 提取 Renderer 和 CoopRenderer 中重复的 Next 预览渲染

class NextPreviewRenderer {
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} game
     */
    constructor(ctx, game) {
        this.ctx = ctx;
        this.game = game;
        this._tempCanvas = null;
        this._tempCtx = null;
    }

    /** 获取或创建临时 Canvas */
    _getTempCanvas() {
        if (!this._tempCanvas) {
            this._tempCanvas = document.createElement('canvas');
            this._tempCanvas.width = CELL;
            this._tempCanvas.height = CELL;
            this._tempCtx = this._tempCanvas.getContext('2d');
        }
        return { canvas: this._tempCanvas, ctx: this._tempCtx };
    }

    render() {
        const ctx = this.ctx, canvas = this._tempCanvas ? this._tempCanvas.parentNode : null;
        // 实际传入的 canvas 是 nextCanvas，通过参数传递
        // 这个方法需要外部传入 canvas
    }

    /**
     * 渲染到指定的 next canvas
     * @param {HTMLCanvasElement} canvas 目标 canvas
     */
    renderTo(canvas) {
        const ctx = canvas.getContext ? canvas.getContext('2d') : this.ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!this.game.nextPiece) return;
        const shapes = this.game.buildMode ? BUILD_SHAPES : SHAPES;
        const shape = shapes[this.game.nextPiece];
        const cw = 18;
        const rows = shape.length, cols = shape[0].length;
        const ox = (canvas.width - cols * cw) / 2;
        const oy = (canvas.height - rows * cw) / 2;

        const { canvas: tempCanvas, ctx: tempCtx } = this._getTempCanvas();

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const px = ox + c * cw, py = oy + r * cw;
                    tempCtx.clearRect(0, 0, CELL, CELL);
                    skinManager.drawBlock(tempCtx, 0, 0, COLORS[this.game.nextPiece], COLOR_GLOW[this.game.nextPiece], 1, CELL);
                    ctx.drawImage(tempCanvas, px + 1, py + 1, cw - 2, cw - 2);
                }
            }
        }
    }
}