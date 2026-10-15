// ===== 渲染系统 =====
// 使用 BaseGridRenderer + NextPreviewRenderer 消除重复

class Renderer {
    constructor(cnid, ncnid, game){
        this.canvas = document.getElementById(cnid);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById(ncnid);
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.game = game;

        // 使用共享棋盘渲染器
        this.boardRenderer = new BaseGridRenderer(this.ctx, game, 0);
        // 使用共享 Next 预览渲染器
        this.nextRenderer = new NextPreviewRenderer(this.nextCtx, game);

        this.flashTimer = 0;
        this.particles = new ParticleSystem();
        this._lastLines = 0;
        this._lastScore = 0;
        this._cachedClearRows = null;
        this.particles.setGridColors((r, c) => {
            const v = this.game.grid[r] && this.game.grid[r][c];
            if (v) return COLORS[v] || '#ffffff';
            return null;
        });

        // HUD 覆盖层（通过 HudManager 管理）
        this.hud = RenderContext.createHudManager(cnid);

        // 屏幕震动参数
        this._shakeIntensity = 0;  // 震动强度（像素）
        this._shakeTimer = 0;      // 震动剩余时间（ms）
        this._shakeEl = this.canvas.parentElement; // .canvas-wrap 容器
    }

    getCanvasCenter() {
        return { x: COLS * CELL / 2, y: ROWS * CELL / 2 };
    }

    _cacheClearRows(rows) {
        this._cachedClearRows = rows;
    }

    /**
     * 触发棋盘震动
     * @param {number} count 消除行数
     */
    applyShake(count) {
        // 双消轻微震动，三消/四消大幅震动
        if (count === 2) {
            this._shakeIntensity = 3;
            this._shakeTimer = 200;
        } else if (count >= 3) {
            this._shakeIntensity = 8;
            this._shakeTimer = 350;
        }
    }

    updateParticles(dt) {
        this.particles.update(dt);

        // 屏幕震动衰减
        if (this._shakeTimer > 0) {
            this._shakeTimer -= dt;
            if (this._shakeTimer <= 0) {
                this._shakeTimer = 0;
                this._shakeIntensity = 0;
                if (this._shakeEl) this._shakeEl.style.transform = '';
            } else {
                // 随机偏移实现震动效果
                const intensity = this._shakeIntensity * (this._shakeTimer / 350);
                const ox = (Math.random() - 0.5) * intensity * 2;
                const oy = (Math.random() - 0.5) * intensity * 2;
                const rot = (Math.random() - 0.5) * intensity * 0.5;
                if (this._shakeEl) {
                    this._shakeEl.style.transform = `translate(${ox}px, ${oy}px) rotate(${rot}deg)`;
                }
            }
        }
    }

    updateHudParticles(dt) {
        if (this.hud) this.hud.update(dt);
    }
    renderHud() {
        if (this.hud) this.hud.render();
    }

    render(){
        const {ctx, canvas, game} = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.boardRenderer.drawBackground(ctx, canvas);
        this.boardRenderer.drawGrid(ctx, canvas);
        this.boardRenderer.drawBlocks(ctx);
        this.boardRenderer.drawGhostPiece(ctx);
        this.boardRenderer.drawActivePiece(ctx);
        this.boardRenderer.drawClearAnimation(ctx);
        this.particles.render(ctx);
        this.nextRenderer.renderTo(this.nextCanvas);
    }

    // 保持兼容：简化后的 drawBlock 委托给 skinManager
    drawBlock(ctx, x, y, color, glow, alpha){
        skinManager.drawBlock(ctx, x, y, color, glow, alpha, CELL);
        ctx.globalAlpha = 1;
    }

    renderNext(){
        this.nextRenderer.renderTo(this.nextCanvas);
    }

    showOverlay(id, html, cls){
        const el = document.getElementById(id);
        el.innerHTML = html;
        el.className = 'overlay show' + (cls ? ' ' + cls : '');
    }
    hideOverlay(id){ document.getElementById(id).className = 'overlay'; }
}


class CoopRenderer {
    constructor(cid, nid1, nid2, g1, g2){
        this.canvas = document.getElementById(cid);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas1 = document.getElementById(nid1);
        this.nextCanvas2 = document.getElementById(nid2);
        this.nextCtx1 = this.nextCanvas1.getContext('2d');
        this.nextCtx2 = this.nextCanvas2.getContext('2d');

        // 两个棋盘的共享渲染器
        const hw = COLS * CELL;
        this.boardRenderer1 = new BaseGridRenderer(this.ctx, g1, 0);
        this.boardRenderer2 = new BaseGridRenderer(this.ctx, g2, hw);

        // Next 预览
        this.nextRenderer1 = new NextPreviewRenderer(this.nextCtx1, g1);
        this.nextRenderer2 = new NextPreviewRenderer(this.nextCtx2, g2);

        this.game1 = g1;
        this.game2 = g2;
        this.flashTimer = 0;
        this.particles = new ParticleSystem();
        this._lastLinesP1 = 0;
        this._lastLinesP2 = 0;
        this._lastScoreP1 = 0;
        this._lastScoreP2 = 0;
        this.particles.setGridColors((r, c) => null);

        // 屏幕震动参数（CoopRenderer 使用整个画布容器）
        this._shakeIntensity = 0;
        this._shakeTimer = 0;
        this._shakeEl = this.canvas.parentElement;
    }

    getCanvasCenter() {
        return { x: COLS * CELL, y: ROWS * CELL / 2 };
    }

    /**
     * 触发棋盘震动
     * @param {number} count 消除行数
     */
    applyShake(count) {
        if (count === 2) {
            this._shakeIntensity = 3;
            this._shakeTimer = 200;
        } else if (count >= 3) {
            this._shakeIntensity = 8;
            this._shakeTimer = 350;
        }
    }

    checkParticleTriggers() {
        // 追踪 clearing 状态变化，用于在 coop 消除动画开始时发射粒子
        if (this._clearingP1 === undefined) this._clearingP1 = false;
        if (this._clearingP2 === undefined) this._clearingP2 = false;

        for (const [g, prefix] of [[this.game1, 'P1'], [this.game2, 'P2']]) {
            const ck = prefix === 'P1' ? '_clearingP1' : '_clearingP2';
            const hw = COLS * CELL;
            const ox = prefix === 'P1' ? 0 : hw;

            // clearing 从 false → true：发射每个格子的粒子（白色闪烁动画期间）
            if (g.clearing && g.clearRows.length > 0 && !this[ck]) {
                this[ck] = true;
                for (const row of g.clearRows) {
                    for (let c = 0; c < COLS; c++) {
                        const px = ox + c * CELL + CELL / 2;
                        const py = row * CELL + CELL / 2;
                        const v = g.grid[row] && g.grid[row][c];
                        const color = v ? COLORS[v] || '#ffffff' : '#ffffff';
                        this.particles.emit(px, py, 1, color, {
                            speedMin: 40, speedMax: 120,
                            sizeMin: 2, sizeMax: 4,
                            lifeMin: 500, lifeMax: 900,
                            spread: Math.PI * 2,
                            vyOffset: -50
                        });
                    }
                }
            }
            if (g.gameOver || !g.clearing) this[ck] = false;

            // lines 增加：显示得分文字 + 环特效 + 棋盘震动
            const lk = prefix === 'P1' ? '_lastLinesP1' : '_lastLinesP2';
            const lines = g.lines;
            if (lines > this[lk]) {
                const cleared = lines - this[lk];
                let cx, cy;

                if (g.clearRows && g.clearRows.length > 0) {
                    cx = ox + COLS * CELL / 2;
                    cy = g.clearRows[0] * CELL;
                } else {
                    cx = ox + COLS * CELL / 2;
                    cy = ROWS * CELL / 2;
                }

                let txt = '+' + (cleared * 100);
                let color = '#ffffff';
                if (cleared === 2) { txt = '+' + (cleared * 100) + ' 双消!'; color = '#4ecdc4'; }
                else if (cleared === 3) { txt = '+' + (cleared * 100) + ' 三消!'; color = '#45b7d1'; }
                else if (cleared >= 4) { txt = 'TETRIS! +' + (cleared * 100); color = '#ffd700'; this.particles.emitTetris(); }
                this.particles.showFloatingText(cx, cy - 20, txt, color, cleared >= 4 ? 36 : 26);

                // 触发棋盘震动
                this.applyShake(cleared);

                if (typeof boardRingEffect !== 'undefined') {
                    boardRingEffect.emitClearRing(cleared);
                }
            }
            this[lk] = lines;
        }
    }

    updateParticles(dt) {
        this.checkParticleTriggers();
        this.particles.update(dt);

        // 屏幕震动衰减
        if (this._shakeTimer > 0) {
            this._shakeTimer -= dt;
            if (this._shakeTimer <= 0) {
                this._shakeTimer = 0;
                this._shakeIntensity = 0;
                if (this._shakeEl) this._shakeEl.style.transform = '';
            } else {
                const intensity = this._shakeIntensity * (this._shakeTimer / 350);
                const ox = (Math.random() - 0.5) * intensity * 2;
                const oy = (Math.random() - 0.5) * intensity * 2;
                const rot = (Math.random() - 0.5) * intensity * 0.5;
                if (this._shakeEl) {
                    this._shakeEl.style.transform = `translate(${ox}px, ${oy}px) rotate(${rot}deg)`;
                }
            }
        }
    }

    render(){
        const {ctx, canvas, game1, game2} = this;
        const bgColor = BaseGridRenderer.getCanvasBgColor();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const hw = COLS * CELL;

        // 网格线
        ctx.strokeStyle = BaseGridRenderer.getGridLineColor();
        ctx.lineWidth = 1;
        for(let r = 0; r <= ROWS; r++){ ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(canvas.width, r * CELL); ctx.stroke(); }
        for(let c = 0; c <= COLS; c++){
            ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(hw + c * CELL, 0); ctx.lineTo(hw + c * CELL, canvas.height); ctx.stroke();
        }

        // 中间分隔线
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(hw, 0); ctx.lineTo(hw, canvas.height); ctx.stroke();
        ctx.setLineDash([]);

        // 使用共享渲染器绘制两个棋盘的方块
        this.boardRenderer1.drawBlocks(ctx);
        this.boardRenderer2.drawBlocks(ctx);

        // 幽灵 + 活动方块
        for (const [br, g] of [[this.boardRenderer1, game1], [this.boardRenderer2, game2]]) {
            br.drawGhostPiece(ctx);
            br.drawActivePiece(ctx);
            br.drawClearAnimation(ctx);
        }

        this.particles.render(ctx);
        this.nextRenderer1.renderTo(this.nextCanvas1);
        this.nextRenderer2.renderTo(this.nextCanvas2);

        // === 诊断：帧计数器标记（仅在启动后前5秒显示）===
        if (gameStarted) {
            if (this._diagFrame === undefined) this._diagFrame = 0;
            this._diagFrame++;
            if (this._diagFrame <= 300) {
                ctx.fillStyle = 'rgba(255,0,0,0.8)';
                ctx.font = '12px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('F#' + this._diagFrame + ' P1:' + (game1.piece||'-') + ' P2:' + (game2.piece||'-'), canvas.width - 4, 14);
            }
        }
        // === 诊断结束 ===
    }

    renderNext(){
        this.nextRenderer1.renderTo(this.nextCanvas1);
        this.nextRenderer2.renderTo(this.nextCanvas2);
    }

    showOverlay(html, cls){
        const el = document.getElementById('coopOverlay');
        el.innerHTML = html;
        el.className = 'overlay show' + (cls ? ' ' + cls : '');
    }
    hideOverlay(){ document.getElementById('coopOverlay').className = 'overlay'; }
}