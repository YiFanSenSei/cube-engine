// ===== 回放录制模块 =====
// 在游戏每帧录制棋盘快照，完全独立于播放系统

class ReplayRecorder {
    constructor() {
        this.frames = [];
        this.recording = false;
    }

    /** 开始录制（新游戏时调用） */
    start() {
        this.frames = [];
        this.recording = true;
    }

    /** 停止录制 */
    stop() {
        this.recording = false;
    }

    /** 录制一帧（game loop 中每帧调用，支持合作模式双棋盘） */
    recordFrame(game, mode) {
        if (!this.recording) return;
        if (mode === 'pvp') return; // 双人对战回放已移除

        // 合作模式使用 recordCoopFrame 记录两个棋盘
        if (mode === 'coop' && typeof playerGame !== 'undefined' && typeof aiGame !== 'undefined') {
            this._recordCoopFrame(mode);
            return;
        }

        // 人机模式：同时录制玩家和 AI 双方数据
        if (mode === 'ai' && typeof playerGame !== 'undefined' && typeof aiGame !== 'undefined') {
            this._recordAiFrame(mode);
            return;
        }

        // 空棋盘不录（游戏尚未开始的有效内容）
        const hasGrid = game.grid && game.grid.some(row => row.some(c => c !== 0));
        const hasPiece = game.piece && game.currentShape && game.currentShape.length > 0;
        if (!hasGrid && !hasPiece) return;

        const frame = {
            mode: mode,
            grid: game.grid.map(r => [...r]),
            piece: game.piece,
            pieceX: game.pieceX,
            pieceY: game.pieceY,
            pieceShape: game.currentShape ? game.currentShape.map(r => [...r]) : [],
            score: game.score,
            lines: game.lines,
            level: game.level,
            gameOver: game.gameOver
        };

        this.frames.push(frame);
    }

    /** 录制合作模式双棋盘帧 */
    _recordCoopFrame(mode) {
        // 防止重复录制同一帧（相邻帧完全相同时跳过）
        const g1Grid = playerGame.grid.map(r => [...r]);
        const g2Grid = aiGame.grid.map(r => [...r]);

        // 至少一个棋盘有内容才录
        const hasGrid1 = g1Grid.some(row => row.some(c => c !== 0));
        const hasGrid2 = g2Grid.some(row => row.some(c => c !== 0));
        const hasPiece1 = playerGame.piece && playerGame.currentShape && playerGame.currentShape.length > 0;
        const hasPiece2 = aiGame.piece && aiGame.currentShape && aiGame.currentShape.length > 0;
        if (!hasGrid1 && !hasPiece1 && !hasGrid2 && !hasPiece2) return;

        // 去重：与最后一帧完全相同时跳过
        const last = this.frames[this.frames.length - 1];
        if (last && last.isCoop) {
            const g1Same = last.grid1.length === g1Grid.length &&
                g1Grid.every((r, ri) => r.every((c, ci) => c === last.grid1[ri][ci]));
            const g2Same = last.grid2.length === g2Grid.length &&
                g2Grid.every((r, ri) => r.every((c, ci) => c === last.grid2[ri][ci]));
            if (g1Same && g2Same) return;
        }

        const frame = {
            mode: mode,
            isCoop: true,
            grid1: g1Grid,
            grid2: g2Grid,
            piece1: playerGame.piece,
            piece2: aiGame.piece,
            pieceX1: playerGame.pieceX,
            pieceY1: playerGame.pieceY,
            pieceX2: aiGame.pieceX,
            pieceY2: aiGame.pieceY,
            pieceShape1: playerGame.currentShape ? playerGame.currentShape.map(r => [...r]) : [],
            pieceShape2: aiGame.currentShape ? aiGame.currentShape.map(r => [...r]) : [],
            score1: playerGame.score,
            score2: aiGame.score,
            lines1: playerGame.lines,
            lines2: aiGame.lines,
            level1: playerGame.level,
            level2: aiGame.level,
            gameOver1: playerGame.gameOver,
            gameOver2: aiGame.gameOver
        };

        this.frames.push(frame);
    }

    /** 录制人机模式双棋盘帧（玩家 + AI） */
    _recordAiFrame(mode) {
        const g1Grid = playerGame.grid.map(r => [...r]);
        const g2Grid = aiGame.grid.map(r => [...r]);

        // 至少一个棋盘有内容才录
        const hasGrid1 = g1Grid.some(row => row.some(c => c !== 0));
        const hasGrid2 = g2Grid.some(row => row.some(c => c !== 0));
        const hasPiece1 = playerGame.piece && playerGame.currentShape && playerGame.currentShape.length > 0;
        const hasPiece2 = aiGame.piece && aiGame.currentShape && aiGame.currentShape.length > 0;
        if (!hasGrid1 && !hasPiece1 && !hasGrid2 && !hasPiece2) return;

        // 去重：与最后一帧完全相同时跳过
        const last = this.frames[this.frames.length - 1];
        if (last && last.isAi) {
            const g1Same = last.grid1.length === g1Grid.length &&
                g1Grid.every((r, ri) => r.every((c, ci) => c === last.grid1[ri][ci]));
            const g2Same = last.grid2.length === g2Grid.length &&
                g2Grid.every((r, ri) => r.every((c, ci) => c === last.grid2[ri][ci]));
            if (g1Same && g2Same) return;
        }

        const frame = {
            mode: mode,
            isAi: true,
            grid1: g1Grid,
            grid2: g2Grid,
            piece1: playerGame.piece,
            piece2: aiGame.piece,
            pieceX1: playerGame.pieceX,
            pieceY1: playerGame.pieceY,
            pieceX2: aiGame.pieceX,
            pieceY2: aiGame.pieceY,
            pieceShape1: playerGame.currentShape ? playerGame.currentShape.map(r => [...r]) : [],
            pieceShape2: aiGame.currentShape ? aiGame.currentShape.map(r => [...r]) : [],
            score1: playerGame.score,
            score2: aiGame.score,
            lines1: playerGame.lines,
            lines2: aiGame.lines,
            level1: playerGame.level,
            level2: aiGame.level,
            gameOver1: playerGame.gameOver,
            gameOver2: aiGame.gameOver
        };

        this.frames.push(frame);
    }

    /** 获取录制帧数 */
    getFrameCount() {
        return this.frames.length;
    }

    /** 获取某帧数据 */
    getFrame(index) {
        if (index < 0 || index >= this.frames.length) return null;
        return this.frames[index];
    }

    /** 获取所有帧 */
    getAllFrames() {
        return this.frames;
    }

    /** 清除录制 */
    clear() {
        this.frames = [];
        this.recording = false;
    }
}

// 全局实例
const replayRecorder = new ReplayRecorder();