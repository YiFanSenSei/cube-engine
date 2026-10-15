// ===== 回放控制面板 UI =====
// 构建回放控制面板，绑定事件，管理回放生命周期

class ReplayUI {
    constructor() {
        this.panel = null;
        this.active = false;
        this.side = 'player'; // 'player' | 'ai' | 'coop'
        this.mode = 'single';
        this._restoreCallback = null; // 退出回放时恢复游戏的回调

        // DOM 元素缓存
        this.elements = {};

        // 速度选项
        this.speedOptions = [0.25, 0.5, 1, 2, 4, 8];
    }

    /** 创建回放面板 DOM */
    createPanel() {
        if (this.panel) return;

        const panel = document.createElement('div');
        panel.className = 'replay-panel';
        panel.id = 'replayPanel';
        panel.innerHTML = `
            <div class="replay-panel-header" id="replayDragHandle">
                <span class="replay-panel-title">📼 回放</span>
                <span class="replay-panel-info" id="replayFrameInfo">0 / 0</span>
                <button class="replay-close-btn" id="replayCloseBtn" title="退出回放">✕</button>
            </div>
            <div class="replay-panel-body">
                <div class="replay-progress-wrap">
                    <div class="replay-progress-bar" id="replayProgressBar">
                        <div class="replay-progress-fill" id="replayProgressFill"></div>
                    </div>
                    <span class="replay-progress-text" id="replayProgressText">0%</span>
                </div>

                <div class="replay-controls">
                    <button class="replay-btn replay-btn-skip" id="replayBtnStart" title="跳到开头">⏮</button>
                    <button class="replay-btn replay-btn-nav" id="replayBtnPrev" title="上一步">◀</button>
                    <button class="replay-btn replay-btn-play" id="replayBtnPlay" title="自动播放">▶</button>
                    <button class="replay-btn replay-btn-nav" id="replayBtnNext" title="下一步">▶</button>
                    <button class="replay-btn replay-btn-skip" id="replayBtnEnd" title="跳到末尾">⏭</button>
                </div>

                <div class="replay-speed-row">
                    <span class="replay-speed-label">速度</span>
                    <div class="replay-speed-btns" id="replaySpeedBtns"></div>
                </div>

                <div class="replay-actions">
                    <button class="replay-action-btn replay-action-primary" id="replayBtnRestart">🔄 重新回放</button>
                    <button class="replay-action-btn" id="replayBtnExit">← 退出回放</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;

        // 缓存 DOM 元素
        this.elements = {
            panel,
            frameInfo: document.getElementById('replayFrameInfo'),
            progressBar: document.getElementById('replayProgressBar'),
            progressFill: document.getElementById('replayProgressFill'),
            progressText: document.getElementById('replayProgressText'),
            btnStart: document.getElementById('replayBtnStart'),
            btnPrev: document.getElementById('replayBtnPrev'),
            btnPlay: document.getElementById('replayBtnPlay'),
            btnNext: document.getElementById('replayBtnNext'),
            btnEnd: document.getElementById('replayBtnEnd'),
            speedBtns: document.getElementById('replaySpeedBtns'),
            btnRestart: document.getElementById('replayBtnRestart'),
            btnExit: document.getElementById('replayBtnExit'),
            closeBtn: document.getElementById('replayCloseBtn')
        };

        // 构建速度按钮
        this._buildSpeedButtons();

        // 绑定事件
        this._bindEvents();
        // 启用拖拽
        this._makeDraggable();
        // 恢复上次位置
        this._restorePosition();
    }

    /** 构建速度选择按钮 */
    _buildSpeedButtons() {
        const container = this.elements.speedBtns;
        container.innerHTML = '';
        this.speedOptions.forEach(speed => {
            const btn = document.createElement('button');
            btn.className = 'replay-speed-btn' + (speed === 1 ? ' active' : '');
            btn.dataset.speed = speed;
            btn.textContent = speed + 'x';
            container.appendChild(btn);
        });
    }

    /** 绑定事件 */
    _bindEvents() {
        const el = this.elements;

        el.btnStart.addEventListener('click', () => { playSfx('replay_click'); this._onGoToStart(); });
        el.btnPrev.addEventListener('click', () => { playSfx('replay_click'); this._onPrev(); });
        el.btnPlay.addEventListener('click', () => { playSfx('replay_click'); this._onTogglePlay(); });
        el.btnNext.addEventListener('click', () => { playSfx('replay_click'); this._onNext(); });
        el.btnEnd.addEventListener('click', () => { playSfx('replay_click'); this._onGoToEnd(); });
        el.btnRestart.addEventListener('click', () => { playSfx('replay_click'); this._onRestart(); });
        el.btnExit.addEventListener('click', () => { playSfx('replay_click'); this._onExit(); });
        el.closeBtn.addEventListener('click', () => { playSfx('replay_click'); this._onExit(); });

        // 速度按钮事件委托
        el.speedBtns.addEventListener('click', (e) => {
            const btn = e.target.closest('.replay-speed-btn');
            if (!btn) return;
            playSfx('replay_click');
            const speed = parseFloat(btn.dataset.speed);
            this._onSpeedChange(speed);
        });
    }

    // ---- 拖拽功能 ----

    /** 启用面板拖拽（按住标题栏拖动） */
    _makeDraggable() {
        const header = this.panel.querySelector('#replayDragHandle');
        if (!header) return;

        let isDragging = false;
        let startX, startY, origLeft, origTop;

        header.style.cursor = 'grab';

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            isDragging = true;
            const rect = this.panel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            origLeft = rect.left;
            origTop = rect.top;

            header.style.cursor = 'grabbing';
            header.style.userSelect = 'none';
            // 禁用 CSS 过渡，防止拖拽延迟
            this.panel.style.transition = 'none';
            // 切换到 fixed 定位（覆盖 CSS 的 top/right/transform）
            this.panel.style.right = 'auto';
            this.panel.style.bottom = 'auto';
            this.panel.style.transform = 'none';
            this.panel.style.left = origLeft + 'px';
            this.panel.style.top = origTop + 'px';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let x = origLeft + e.clientX - startX;
            let y = origTop + e.clientY - startY;
            // 边界约束，防止拖出视口
            const pw = this.panel.offsetWidth;
            const ph = this.panel.offsetHeight;
            x = Math.max(0, Math.min(x, window.innerWidth - pw));
            y = Math.max(0, Math.min(y, window.innerHeight - ph));
            this.panel.style.left = x + 'px';
            this.panel.style.top = y + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            header.style.cursor = 'grab';
            header.style.userSelect = '';
            this.panel.style.transition = '';
            this._savePosition();
        });

        // === 触屏支持 ===
        const touchGet = (e) => e.touches?.[0] || e.changedTouches?.[0];

        header.addEventListener('touchstart', (e) => {
            const t = touchGet(e);
            if (!t || e.target.closest('button')) return;
            isDragging = true;
            const rect = this.panel.getBoundingClientRect();
            startX = t.clientX;
            startY = t.clientY;
            origLeft = rect.left;
            origTop = rect.top;
            this.panel.style.transition = 'none';
            this.panel.style.right = 'auto';
            this.panel.style.bottom = 'auto';
            this.panel.style.transform = 'none';
            this.panel.style.left = origLeft + 'px';
            this.panel.style.top = origTop + 'px';
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            const t = touchGet(e);
            if (!t || !isDragging) return;
            let x = origLeft + t.clientX - startX;
            let y = origTop + t.clientY - startY;
            const pw = this.panel.offsetWidth;
            const ph = this.panel.offsetHeight;
            x = Math.max(0, Math.min(x, window.innerWidth - pw));
            y = Math.max(0, Math.min(y, window.innerHeight - ph));
            this.panel.style.left = x + 'px';
            this.panel.style.top = y + 'px';
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            this.panel.style.transition = '';
            this._savePosition();
        });
    }

    /** 保存面板位置到 localStorage */
    _savePosition() {
        try {
            const rect = this.panel.getBoundingClientRect();
            localStorage.setItem('replayPanelX', rect.left);
            localStorage.setItem('replayPanelY', rect.top);
        } catch(e) { /* ignore */ }
    }

    /** 从 localStorage 恢复面板位置 */
    _restorePosition() {
        try {
            const x = localStorage.getItem('replayPanelX');
            const y = localStorage.getItem('replayPanelY');
            if (x !== null && y !== null) {
                this.panel.style.right = 'auto';
                this.panel.style.bottom = 'auto';
                this.panel.style.transform = 'none';
                this.panel.style.left = x + 'px';
                this.panel.style.top = y + 'px';
            }
        } catch(e) { /* ignore */ }
    }

    // ---- 事件处理 ----

    _onPrev() {
        if (!this.active) return;
        if (replayPlayer.previousStep()) {
            this._updateUI();
        }
    }

    _onNext() {
        if (!this.active) return;
        if (replayPlayer.nextStep()) {
            this._updateUI();
        }
    }

    _onTogglePlay() {
        if (!this.active) return;
        replayPlayer.togglePlay();
        this._updatePlayButton();
    }

    _onGoToStart() {
        if (!this.active) return;
        replayPlayer.goToStart();
        this._updateUI();
    }

    _onGoToEnd() {
        if (!this.active) return;
        replayPlayer.goToEnd();
        this._updateUI();
    }

    _onSpeedChange(speed) {
        if (!this.active) return;
        replayPlayer.setSpeed(speed);
        // 更新速度按钮高亮
        this.elements.speedBtns.querySelectorAll('.replay-speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
        });
    }

    _onRestart() {
        if (replayRecorder.getFrameCount() === 0) return;
        this._startReplay(this.side);
    }

    _onExit() {
        this._exitReplay();
    }

    // ---- 公共方法 ----

    /** 开始回放 */
    startReplay(side) {
        this.side = side || 'player';
        const frames = replayRecorder.getAllFrames();
        if (frames.length === 0) return;

        // 保存模式
        this.mode = frames[0].mode || 'single';

        this._startReplay(side);
    }

    /** 内部启动回放 */
    _startReplay(side) {
        const frames = replayRecorder.getAllFrames();
        if (frames.length === 0) return;

        this.side = side || this.side;
        this.mode = frames[0].mode || 'single';

        // 停止游戏循环
        if (typeof running !== 'undefined') {
            running = false;
        }

        // ---- 清除所有游戏特效/粒子 ----
        // 清除 HUD canvas（连击文字等浮动特效）
        const hudCanvas = document.getElementById('playerHudCanvas');
        if (hudCanvas) {
            const hudCtx = hudCanvas.getContext('2d');
            hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
        }
        // 清除粒子系统
        if (typeof playerRenderer !== 'undefined' && playerRenderer.particles) {
            playerRenderer.particles.clear();
        }
        if (typeof aiRenderer !== 'undefined' && aiRenderer.particles) {
            aiRenderer.particles.clear();
        }
        if (typeof coopRenderer !== 'undefined' && coopRenderer.particles) {
            coopRenderer.particles.clear();
        }
        // 清除 HUD 管理器粒子
        if (typeof playerRenderer !== 'undefined' && playerRenderer.hud && playerRenderer.hud.particles) {
            playerRenderer.hud.particles.clear();
            playerRenderer.hud.clear();
        }

        // 加载帧到播放器
        replayPlayer.loadFrames(frames);

        // 设置 Canvas
        const canvas = this._getCanvas();
        if (!canvas) {
            console.error('[ReplayUI] 找不到目标 Canvas');
            return;
        }
        replayRenderer.setCanvas(canvas);

        // 设置回调
        replayPlayer.onFrameChange((index) => {
            this._onFrameChanged(index);
        });
        replayPlayer.onFinish(() => {
            this._onReplayFinished();
        });
        replayPlayer.onStateChange((playing) => {
            this._updatePlayButton();
        });

        // 隐藏 overlay
        this._hideOverlays();

        // 人机模式回放：显示双方棋盘，设置次 Canvas 渲染 AI 侧
        if (this.mode === 'ai') {
            const aiCanvas = document.getElementById('aiCanvas');
            if (aiCanvas) replayRenderer.setSecondaryCanvas(aiCanvas);
            const aiSection = document.querySelector('.ai-section');
            if (aiSection) aiSection.classList.remove('hidden');
            const boardContainer = document.querySelector('.board-container');
            if (boardContainer) boardContainer.classList.remove('single-mode');
        }

        // 显示面板
        this.active = true;
        this.panel.classList.add('show');

        // 隐藏游戏控制区
        this._setControlsVisible(false);

        // 渲染第一帧
        const firstFrame = replayPlayer.getCurrentFrame();
        if (firstFrame) {
            replayRenderer.render(firstFrame);
        }
        this._updateUI();
    }

    /** 帧变化回调 */
    _onFrameChanged(index) {
        const frame = replayPlayer.getCurrentFrame();
        if (frame) {
            replayRenderer.render(frame);
        }
        this._updateUI();
    }

    /** 回放结束回调 */
    _onReplayFinished() {
        this._updateUI();
    }

    /** 更新 UI 状态 */
    _updateUI() {
        const total = replayPlayer.getFrameCount();
        const current = replayPlayer.getDisplayIndex();

        // 帧信息
        this.elements.frameInfo.textContent = `${current} / ${total}`;

        // 进度条
        const progress = total > 0 ? (current / total) * 100 : 0;
        this.elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
        this.elements.progressText.textContent = `${Math.round(progress)}%`;

        // 播放按钮状态
        this._updatePlayButton();
    }

    /** 更新播放按钮图标 */
    _updatePlayButton() {
        const btn = this.elements.btnPlay;
        if (replayPlayer.playing) {
            btn.textContent = '⏸';
            btn.title = '暂停';
            btn.classList.add('playing');
        } else {
            btn.textContent = '▶';
            btn.title = '自动播放';
            btn.classList.remove('playing');
        }
    }

    /** 获取回放目标 Canvas */
    _getCanvas() {
        const isMulti = this.mode === 'coop';

        if (isMulti) {
            return document.getElementById('coopCanvas');
        } else if (this.mode === 'ai') {
            // 人机模式：主 Canvas 永远是玩家侧，AI 侧通过 setSecondaryCanvas 设置
            return document.getElementById('playerCanvas');
        } else if (this.mode === 'pvp' && this.side === 'ai') {
            return document.getElementById('aiCanvas');
        } else {
            return document.getElementById('playerCanvas');
        }
    }

    /** 隐藏 overlay */
    _hideOverlays() {
        const overlays = ['playerOverlay', 'aiOverlay', 'coopOverlay'];
        overlays.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('show');
        });
    }

    /** 显示/隐藏游戏控制区 */
    _setControlsVisible(visible) {
        const controls = document.getElementById('gameControls');
        if (controls) {
            controls.style.display = visible ? '' : 'none';
        }
    }

    /** 退出回放（公开方法） */
    exitReplay() {
        this._exitReplay();
    }

    /** 退出回放（内部实现） */
    _exitReplay() {
        if (!this.active) return;

        // 停止播放
        replayPlayer.pause();
        replayPlayer.loadFrames([]);

        // 清除次 Canvas（人机模式双棋盘回放用）
        replayRenderer.setSecondaryCanvas(null);

        // 隐藏面板
        this.active = false;
        this.panel.classList.remove('show');

        // 恢复控制区显示
        this._setControlsVisible(true);

        // 恢复游戏按钮状态
        this._restoreGameState();
    }

    /** 恢复游戏状态 */
    _restoreGameState() {
        const gs = typeof gameStarted !== 'undefined' ? gameStarted : false;
        const pgo = typeof playerGame !== 'undefined' ? playerGame.gameOver : true;
        const ago = typeof aiGame !== 'undefined' ? aiGame.gameOver : true;
        const isOver = pgo || ago;

        // 重新启用按钮
        const btnStart = document.getElementById('btnStart');
        const btnPause = document.getElementById('btnPause');
        if (btnStart) btnStart.disabled = false;
        if (btnPause) btnPause.disabled = isOver; // 游戏结束时暂停按钮禁用

        // 恢复游戏渲染
        if (typeof playerRenderer !== 'undefined') playerRenderer.render();
        if (typeof aiRenderer !== 'undefined') aiRenderer.render();
        if (typeof coopRenderer !== 'undefined') coopRenderer.render();

        if (isOver) {
            // 游戏已结束 — 重新显示 game over overlay
            if (typeof checkGameOver === 'function') {
                checkGameOver();
            }
            // checkGameOver 因 _gameOverHandled 标记不会重新生成覆盖层 HTML，
            // 但 DOM 内容还在（只是被 _hideOverlays 隐藏了），手动显示即可
            const po = document.getElementById('playerOverlay');
            if (po) po.classList.add('show');
            const ao = document.getElementById('aiOverlay');
            if (ao) ao.classList.add('show');
            const co = document.getElementById('coopOverlay');
            if (co) co.classList.add('show');
        } else if (gs) {
            // 游戏尚未结束，恢复运行
            if (typeof running !== 'undefined') {
                running = true;
            }
            const pp = typeof playerGame !== 'undefined' ? playerGame.paused : false;
            if (!pp && typeof animFrameId !== 'undefined') {
                animFrameId = requestAnimationFrame(gameLoop);
            }
        }

        // 恢复 AI 区显示
        const aiSection = document.querySelector('.ai-section');
        if (aiSection) aiSection.classList.remove('hidden');
        const boardContainer = document.querySelector('.board-container');
        if (boardContainer) boardContainer.classList.remove('single-mode');

        // 更新模式 UI
        if (typeof updateModeUI === 'function') updateModeUI();
        if (typeof updateGameUI === 'function') updateGameUI();
        if (typeof updateUI === 'function') updateUI();
    }

    /** 判断回放是否激活 */
    isActive() {
        return this.active;
    }
}

// 全局实例
const replayUI = new ReplayUI();