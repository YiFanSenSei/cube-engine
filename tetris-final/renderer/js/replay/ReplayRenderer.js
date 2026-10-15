// ===== 回放渲染器 =====
// 使用 BaseGridRenderer 渲染回放帧，外观与游戏一致
// 支持单棋盘和合作模式双棋盘回放

class ReplayRenderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.secondaryCanvas = null;
        this.secondaryCtx = null;
        this.boardRenderer = null;
        this.frame = null;

        // 临时游戏对象，用于喂给 BaseGridRenderer
        this._tempGame = {
            grid: [],
            piece: null,
            pieceX: 0,
            pieceY: 0,
            currentShape: [],
            getGhostY: () => 0,
            clearing: false,
            gameOver: false
        };
    }

    /** 设置目标 Canvas */
    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.boardRenderer = new BaseGridRenderer(this.ctx, this._tempGame, 0);
    }

    /** 设置次要 Canvas（人机模式回放 AI 棋盘用） */
    setSecondaryCanvas(canvas) {
        this.secondaryCanvas = canvas;
        this.secondaryCtx = canvas ? canvas.getContext('2d') : null;
    }

    /** 渲染指定帧数据 */
    render(frame) {
        if (!this.canvas || !this.ctx || !frame) return;

        if (frame.isAi) {
            this._renderAi(frame);
        } else if (frame.isCoop) {
            this._renderCoop(frame);
        } else {
            this._renderSingle(frame);
        }
    }

    /** 渲染人机模式双棋盘帧 */
    _renderAi(frame) {
        // 玩家棋盘 → 主 Canvas
        this._renderSingleBoard(this.ctx, this.canvas, frame, '1');
        // AI 棋盘 → 次 Canvas
        if (this.secondaryCtx && this.secondaryCanvas) {
            this._renderSingleBoard(this.secondaryCtx, this.secondaryCanvas, frame, '2');
        }
        // 更新双方 HUD
        this._updateAiStats(frame);
    }

    /** 渲染单个棋盘到指定 Canvas */
    _renderSingleBoard(ctx, canvas, frame, suf) {
        const game = this._tempGame;
        game.grid = frame[`grid${suf}`] || [];
        game.piece = frame[`piece${suf}`] || null;
        game.pieceX = frame[`pieceX${suf}`] !== undefined ? frame[`pieceX${suf}`] : 0;
        game.pieceY = frame[`pieceY${suf}`] !== undefined ? frame[`pieceY${suf}`] : 0;
        game.currentShape = frame[`pieceShape${suf}`] || [];
        game.clearing = false;
        game.gameOver = frame[`gameOver${suf}`] || false;

        const br = new BaseGridRenderer(ctx, game, 0);
        br.drawBackground(ctx, canvas);
        br.drawGrid(ctx, canvas);
        br.drawBlocks(ctx);

        if (game.piece && game.currentShape.length > 0 && !game.gameOver) {
            br.drawGhostPiece(ctx);
            br.drawActivePiece(ctx);
        }

        // 顶栏回放标识
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('📼 回放', 8, 17);
    }

    /** 更新人机模式回放时双方 HUD */
    _updateAiStats(frame) {
        const e = (id) => document.getElementById(id);
        if (e('playerScore')) e('playerScore').textContent = frame.score1 || 0;
        if (e('playerLines')) e('playerLines').textContent = frame.lines1 || 0;
        if (e('playerLevel')) e('playerLevel').textContent = frame.level1 || 1;
        if (e('aiScore')) e('aiScore').textContent = frame.score2 || 0;
        if (e('aiLines')) e('aiLines').textContent = frame.lines2 || 0;
        if (e('aiLevel')) e('aiLevel').textContent = frame.level2 || 1;
    }

    /** 渲染单棋盘帧 */
    _renderSingle(frame) {
        const { ctx, canvas } = this;
        const game = this._tempGame;

        // 将帧数据填入 tempGame
        game.grid = frame.grid || [];
        game.piece = frame.piece || null;
        game.pieceX = frame.pieceX !== undefined ? frame.pieceX : 0;
        game.pieceY = frame.pieceY !== undefined ? frame.pieceY : 0;
        game.currentShape = frame.pieceShape || [];
        game.clearing = false;
        game.gameOver = frame.gameOver || false;

        // 渲染棋盘
        this.boardRenderer.drawBackground(ctx, canvas);
        this.boardRenderer.drawGrid(ctx, canvas);
        this.boardRenderer.drawBlocks(ctx);

        // 仅当有活动方块且游戏未结束时绘制
        if (game.piece && game.currentShape.length > 0 && !game.gameOver) {
            this.boardRenderer.drawGhostPiece(ctx);
            this.boardRenderer.drawActivePiece(ctx);
        }

        // 顶栏信息（回放标识 + 帧计数）
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('📼 回放', 8, 17);

        // 更新分数显示
        this._updateStats(frame);
    }

    /** 渲染合作模式双棋盘帧 */
    _renderCoop(frame) {
        const { ctx, canvas } = this;
        const bgColor = BaseGridRenderer.getCanvasBgColor();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const hw = COLS * CELL;

        // 网格线
        ctx.strokeStyle = BaseGridRenderer.getGridLineColor();
        ctx.lineWidth = 1;
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(canvas.width, r * CELL); ctx.stroke();
        }
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(hw + c * CELL, 0); ctx.lineTo(hw + c * CELL, canvas.height); ctx.stroke();
        }

        // 中间分隔线
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(hw, 0); ctx.lineTo(hw, canvas.height); ctx.stroke();
        ctx.setLineDash([]);

        // 构建临时游戏对象用于渲染
        const temp1 = {
            grid: frame.grid1 || [],
            piece: frame.piece1 || null,
            pieceX: frame.pieceX1 || 0,
            pieceY: frame.pieceY1 || 0,
            currentShape: frame.pieceShape1 || [],
            getGhostY: () => 0,
            clearing: false,
            gameOver: frame.gameOver1 || false
        };
        const temp2 = {
            grid: frame.grid2 || [],
            piece: frame.piece2 || null,
            pieceX: frame.pieceX2 || 0,
            pieceY: frame.pieceY2 || 0,
            currentShape: frame.pieceShape2 || [],
            getGhostY: () => 0,
            clearing: false,
            gameOver: frame.gameOver2 || false
        };

        // 使用临时渲染器绘制两个棋盘（每次新建以使用正确的 offsetX）
        const br1 = new BaseGridRenderer(ctx, temp1, 0);
        const br2 = new BaseGridRenderer(ctx, temp2, hw);

        br1.drawBlocks(ctx);
        br2.drawBlocks(ctx);

        // 幽灵 + 活动方块
        if (temp1.piece && temp1.currentShape.length > 0 && !temp1.gameOver) {
            br1.drawGhostPiece(ctx);
            br1.drawActivePiece(ctx);
        }
        if (temp2.piece && temp2.currentShape.length > 0 && !temp2.gameOver) {
            br2.drawGhostPiece(ctx);
            br2.drawActivePiece(ctx);
        }

        // 顶栏信息
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('📼 回放', 8, 17);

        // 更新合作模式分数
        this._updateCoopStats(frame);
    }

    /** 更新单人/对战模式 HUD 数值 */
    _updateStats(frame) {
        const e = (id) => document.getElementById(id);
        if (e('playerScore')) e('playerScore').textContent = frame.score || 0;
        if (e('playerLines')) e('playerLines').textContent = frame.lines || 0;
        if (e('playerLevel')) e('playerLevel').textContent = frame.level || 1;
        if (e('aiScore')) e('aiScore').textContent = frame.score || 0;
        if (e('aiLines')) e('aiLines').textContent = frame.lines || 0;
        if (e('aiLevel')) e('aiLevel').textContent = frame.level || 1;
    }

    /** 更新合作模式 HUD 数值 */
    _updateCoopStats(frame) {
        const e = (id) => document.getElementById(id);
        if (e('playerScore')) e('playerScore').textContent = frame.score1 || 0;
        if (e('playerLines')) e('playerLines').textContent = frame.lines1 || 0;
        if (e('playerLevel')) e('playerLevel').textContent = frame.level1 || 1;
        if (e('aiScore')) e('aiScore').textContent = frame.score2 || 0;
        if (e('aiLines')) e('aiLines').textContent = frame.lines2 || 0;
        if (e('aiLevel')) e('aiLevel').textContent = frame.level2 || 1;
        if (e('coopP1Score')) e('coopP1Score').textContent = frame.score1 || 0;
        if (e('coopP2Score')) e('coopP2Score').textContent = frame.score2 || 0;
        if (e('coopLines')) e('coopLines').textContent = (frame.lines1 || 0) + (frame.lines2 || 0);
    }

    /** 清理 */
    clear() {
        if (!this.canvas || !this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.frame = null;
    }
}

// 全局实例
const replayRenderer = new ReplayRenderer();
