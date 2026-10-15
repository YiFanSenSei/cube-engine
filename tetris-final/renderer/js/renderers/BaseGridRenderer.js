// ===== 棋盘网格渲染器（共享逻辑） =====
// 提取 Renderer 和 CoopRenderer 中重复的棋盘绘制逻辑

class BaseGridRenderer {
    /**
     * @param {CanvasRenderingContext2D} ctx 画布上下文
     * @param {object} game 游戏实例
     * @param {number} offsetX 横向偏移（Coop 模式第二个棋盘使用）
     */
    constructor(ctx, game, offsetX = 0) {
        this.ctx = ctx;
        this.game = game;
        this.offsetX = offsetX;
    }

    /** 获取画布背景色（CSS 变量） */
    static getCanvasBgColor() {
        const style = getComputedStyle(document.body);
        return style.getPropertyValue('--bg-canvas').trim() || '#111122';
    }

    /** 获取网格线颜色（CSS 变量） */
    static getGridLineColor() {
        const style = getComputedStyle(document.body);
        const border = style.getPropertyValue('--border-color').trim();
        return border ? border.replace(/[^,]+(?=\))/, '0.04') : 'rgba(255,255,255,0.04)';
    }

    /** 绘制棋盘背景 */
    drawBackground(ctx, canvas) {
        const bgColor = BaseGridRenderer.getCanvasBgColor();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /** 绘制网格线 */
    drawGrid(ctx, canvas) {
        ctx.strokeStyle = BaseGridRenderer.getGridLineColor();
        ctx.lineWidth = 1;
        const ox = this.offsetX;
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(ox, r * CELL);
            ctx.lineTo(ox + canvas.width, r * CELL);
            ctx.stroke();
        }
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(ox + c * CELL, 0);
            ctx.lineTo(ox + c * CELL, canvas.height);
            ctx.stroke();
        }
    }

    /** 绘制已固定的方块 */
    drawBlocks(ctx) {
        const { grid } = this.game;
        ctx.save();
        ctx.translate(this.offsetX, 0);
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const v = grid[r][c];
                if (v) {
                    skinManager.drawBlock(ctx, c, r, COLORS[v], COLOR_GLOW[v], 1, CELL);
                }
            }
        }
        ctx.restore();
    }

    /** 绘制幽灵方块 */
    drawGhostPiece(ctx) {
        const { piece, gameOver, clearing } = this.game;
        if (!piece || gameOver || clearing) return;
        const gy = this.game.getGhostY();
        ctx.save();
        ctx.translate(this.offsetX, 0);
        for (let r = 0; r < this.game.currentShape.length; r++) {
            for (let c = 0; c < this.game.currentShape[r].length; c++) {
                if (this.game.currentShape[r][c]) {
                    const y = gy + r;
                    if (y >= 0) {
                        skinManager.drawBlock(ctx, this.game.pieceX + c, y, COLORS[this.game.piece], null, 0.2, CELL);
                    }
                }
            }
        }
        ctx.restore();
    }

    /** 绘制当前活动方块 */
    drawActivePiece(ctx) {
        const { piece, gameOver, clearing } = this.game;
        if (!piece || gameOver || clearing) return;
        ctx.save();
        ctx.translate(this.offsetX, 0);
        for (let r = 0; r < this.game.currentShape.length; r++) {
            for (let c = 0; c < this.game.currentShape[r].length; c++) {
                if (this.game.currentShape[r][c]) {
                    const y = this.game.pieceY + r;
                    if (y >= 0) {
                        skinManager.drawBlock(ctx, this.game.pieceX + c, y, COLORS[this.game.piece], COLOR_GLOW[this.game.piece], 1, CELL);
                    }
                }
            }
        }
        ctx.restore();
    }

    /** 绘制消除动画 */
    drawClearAnimation(ctx) {
        if (!this.game.clearing || !this.game.clearRows || this.game.clearRows.length === 0) {
            this._clearStartTime = 0;
            return;
        }
        const { clearRows } = this.game;
        if (!this._clearStartTime) this._clearStartTime = performance.now();
        const elapsed = performance.now() - this._clearStartTime;
        const a = 0.5 + 0.5 * Math.sin(elapsed * 0.01);
        ctx.save();
        ctx.translate(this.offsetX, 0);
        for (const r of clearRows) {
            ctx.fillStyle = `rgba(255,255,255,${a * 0.5})`;
            ctx.fillRect(0, r * CELL, COLS * CELL, CELL);
        }
        ctx.restore();
    }

    /** 重置消除动画计时（新游戏时调用） */
    resetClearAnimation() {
        this._clearStartTime = 0;
    }
}