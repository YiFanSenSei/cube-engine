// ===== 游戏主循环管理器 =====
// 从 ui.js 提取 gameLoop 核心逻辑，分离职责

class GameLoopManager {
    constructor() {
        this._animFrameId = null;
        this._running = false;
        this._gameStarted = false;
    }

    /** 检查游戏是否正在运行 */
    isRunning() { return this._running; }
    isStarted() { return this._gameStarted; }

    /** 启动循环（由 startGame 调用） */
    start() {
        this._running = true;
        this._gameStarted = true;
        if (this._animFrameId) cancelAnimationFrame(this._animFrameId);
        this._animFrameId = requestAnimationFrame((t) => this._loop(t));
    }

    /** 停止循环 */
    stop() {
        this._running = false;
    }

    /** 暂停/恢复切换 */
    setPaused(paused) {
        this._running = !paused;
    }

    /** 销毁循环 */
    destroy() {
        this._running = false;
        this._gameStarted = false;
        if (this._animFrameId) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }
    }

    /**
     * 核心循环（保持与原 gameLoop 行为完全一致）
     * 注意：此方法访问全局变量（playerGame, aiGame, playerRenderer 等）
     * 这些变量在 main.js 中创建并挂载到全局作用域
     */
    async _loop(timestamp) {
        // 暂停时仍然保持渲染
        if (!this._running && this._gameStarted) {
            this._animFrameId = requestAnimationFrame((t) => this._loop(t));
            if (!isReplayMode) {
                if (gameMode === 'coop') coopRenderer.render();
                else { playerRenderer.render(); aiRenderer.render(); }
                updateUI();
            }
            return;
        }
        if (!this._running || !this._gameStarted) return;

        const dt = Math.min(timestamp - (playerGame.lastTime || timestamp), 50);
        playerGame.lastTime = timestamp;
        aiGame.lastTime = timestamp;
        const mode = gameMode;

        try { processInput(); } catch(e) { console.warn('[processInput]', e); }

        // Stage win animation for single mode — 记录帧后处理，不跳过录制
        if (mode === 'single' && stageWinTimer >= 0) {
            // 通关动画期间也录制帧，避免回放时画面跳跃
            if (!isReplayMode) replayRecorder.recordFrame(playerGame, mode);
            this._handleStageWin(dt);
            return;
        }

        // === 主循环逻辑整体包裹 try/catch，防止未捕获错误终止动画帧链 ===
        try {

        // === Piece lock polling ===
        this._checkPieceLock();

        // C++ native update — 确保 syncFromNative 每帧都执行
        if (nativeAvailable) {
            if (mode === 'ai') {
                try { await window.nativeAPI.update({ game: 'player', dt }); } catch(e) { console.warn('[update P1]', e); }
                try { await window.nativeAPI.aiTick({ dt }); } catch(e) { console.warn('[aiTick]', e); }
            } else if (mode === 'pvp') {
                // PvP: player 和 ai 的 update 互不依赖，并行执行
                try { await Promise.all([
                    window.nativeAPI.update({ game: 'player', dt }).catch(e => { console.warn('[update P1]', e); }),
                    window.nativeAPI.update({ game: 'ai', dt }).catch(e => { console.warn('[update P2]', e); })
                ]); } catch(e) { /* individual catches handle it */ }
            } else if (mode === 'coop') {
                // Coop: 并行 update P1+P2 → 串行 coopClearCheck → 并行 getState
                try { await Promise.all([
                    window.nativeAPI.update({ game: 'player', dt }).catch(e => { console.warn('[update P1]', e); }),
                    window.nativeAPI.update({ game: 'ai', dt }).catch(e => { console.warn('[update P2]', e); })
                ]); } catch(e) { /* individual catches handle it */ }
                try { await window.nativeAPI.coopClearCheck(); } catch(e) { console.warn('[coopClearCheck]', e); }
            } else {
                // single: 只更新 player
                try { await window.nativeAPI.update({ game: 'player', dt }); } catch(e) { console.warn('[update P1]', e); }
            }
            try { await syncFromNative(); } catch(e) { console.warn('[syncFromNative]', e); }
        }

        // === 诊断：检查 JS 代理状态是否正常 ===
        if (mode === 'coop' && this._diagCounter === undefined) this._diagCounter = 0;
        if (mode === 'coop') {
            this._diagCounter = (this._diagCounter || 0) + 1;
            if (this._diagCounter <= 5 || this._diagCounter % 60 === 0) {
                const p = playerGame.piece || '(null)';
                const a = aiGame.piece || '(null)';
                const pGrid = playerGame.grid ? playerGame.grid.flat().filter(v => v !== 0).length : -1;
                const aGrid = aiGame.grid ? aiGame.grid.flat().filter(v => v !== 0).length : -1;
                console.log(`[Coop Diag] #${this._diagCounter} P1:piece=${p} blocks=${pGrid} P2:piece=${a} blocks=${aGrid}`);
            }
        }
        // === 诊断结束 ===

        // Achievement tracking
        if (playerGame.piece && !gameStats._allPieces) {
            if (!_trackedPiecesThisGame) _trackedPiecesThisGame = new Set();
            _trackedPiecesThisGame.add(playerGame.piece);
            if (_trackedPiecesThisGame.size >= 7) gameStats._allPieces = true;
        }

        // Lines cleared detection
        if (playerGame.lines > gameStats._lastLines) {
            this._handleLinesCleared();
        }
        gameStats._lastLines = playerGame.lines;

        // 合作模式追踪 P2 消行（统计、音效、成就）
        if (mode === 'coop') {
            if (gameStats._lastLinesAi === undefined) gameStats._lastLinesAi = 0;
            if (aiGame.lines > gameStats._lastLinesAi) {
                const d = aiGame.lines - gameStats._lastLinesAi;
                gameStats.playerLines += d;
                if (d === 4) { gameStats.tetrisCount++; playSfx('tetris'); } else playSfx('clear');
                coopRenderer.applyShake(d);
                if (!gameStats._firstLineCleared) {
                    gameStats._firstLineCleared = true;
                    if (Date.now() - gameStats._gameStartTime < 15000) gameStats.fastClear = true;
                }
            }
            gameStats._lastLinesAi = aiGame.lines;
        }

        gameStats.playerMaxScore = Math.max(gameStats.playerMaxScore, playerGame.score);
        gameStats.maxLevel = Math.max(gameStats.maxLevel, playerGame.level);

        // Stage / Challenge / Build mode checks
        this._checkModeSpecific(mode, dt);

        // Update particles + render
        this._updateAndRender(mode, dt);

        // Achievement timer
        if (this._gameStarted && this._running && !playerGame.paused && !aiGame.paused &&
            (gameStats._achievementTimer || 0) <= performance.now() - 1000) {
            checkAchievements().catch(() => {});
            gameStats._achievementTimer = performance.now();
        }

        if (checkGameOver()) return;

        } catch (e) {
            console.error('[GameLoop] 主循环错误，继续运行:', e);
            console.error(e.stack);
        }

        this._animFrameId = requestAnimationFrame((t) => this._loop(t));
    }

    /** 处理关卡通关动画（旧版延迟通关，现在直接跳转，保留以防引用） */
    _handleStageWin(dt) {
        // 现在不再使用延迟通关动画，直接推进关卡
        stageWinTimer = -1;
        // 但为了防止意外调用，仍然做清理
        playerRenderer.hideOverlay('playerOverlay');
    }

    /** 检测方块锁定落地（硬降连击 + 粒子触发 + 回放录制） */
    _checkPieceLock() {
        this._processGamePieceLock(playerGame, '');
        // 合作模式 / 人机模式同时追踪 P2 (aiGame) 的方块锁定
        if (gameMode === 'coop' || gameMode === 'ai') {
            this._processGamePieceLock(aiGame, '_ai');
        }
    }

    /** 处理单个游戏的方块锁定检测 */
    _processGamePieceLock(game, suf) {
        const key = (k) => k + suf;
        if (!game.gameOver && !game.paused && game.piece) {
            if (gameStats[key('_lastPieceName')] === undefined) {
                gameStats[key('_lastPieceName')] = game.piece;
            } else if (game.piece !== gameStats[key('_lastPieceName')]) {
                // 方块锁定音效
                playSfx('lock');

                // 旧方块锁定 — 录制回放帧
                if (!isReplayMode) {
                    replayRecorder.recordFrame(game, gameMode);
                }

                // P1 专属特效（硬降连击 + 粒子）
                if (suf === '') {
                    const lx = gameStats[key('_lastPieceX')];
                    const lShape = gameStats[key('_lastPieceShape')];
                    const lColor = COLORS[gameStats[key('_lastPieceName')] || 'I'] || '#ffffff';
                    const groundY = gameStats[key('_lastPieceGhostY')] !== undefined
                        ? gameStats[key('_lastPieceGhostY')] : gameStats[key('_lastPieceY')];

                    // 硬降连击
                    if (gameStats[key('_lastDropWasHard')]) {
                        combo = (combo || 0) + 1;
                        if (combo >= 5) {
                            const comboText = '硬降 x ' + combo;
                            const comboColors = ['#ff6b35', '#ff2d55', '#ffd700', '#ff00ff', '#00ffff'];
                            const comboColor = comboColors[(combo - 5) % comboColors.length];
                            const cSize = 22 + Math.random() * 14;
                            const cRot = (Math.random() - 0.5) * 30;
                            const yOff = (Math.random() - 0.5) * 40;
                            const groundX = COLS * CELL + 12;
                            const safeGroundY = Math.max(1, groundY || 0);
                            const groundYpx = (safeGroundY - 1) * CELL + yOff;
                            eventBus.emit('hardDropCombo', {
                                x: groundX, y: groundYpx,
                                text: comboText, color: comboColor,
                                size: cSize, vy: -60, rotation: cRot
                            });
                        }
                    } else {
                        combo = 0;
                    }
                    gameStats[key('_lastDropWasHard')] = false;

                    if (lShape && lShape.length > 0) {
                        let maxRow = 0, minCol = 999, maxCol = 0;
                        for (let r = 0; r < lShape.length; r++) {
                            for (let c = 0; c < lShape[r].length; c++) {
                                if (lShape[r][c]) {
                                    if (r > maxRow) maxRow = r;
                                    if (c < minCol) minCol = c;
                                    if (c > maxCol) maxCol = c;
                                }
                            }
                        }
                        const cx = (lx + (minCol + maxCol) / 2) * CELL + CELL / 2;
                        const by = (groundY + maxRow) * CELL + CELL / 2;
                        eventBus.emit('pieceLocked', { x: cx, y: by, color: lColor });
                    }

                    // P2 硬降连击（合作模式）
                    if (suf === '_ai') {
                        const groundY = gameStats[key('_lastPieceGhostY')] !== undefined
                            ? gameStats[key('_lastPieceGhostY')] : gameStats[key('_lastPieceY')];
                        if (gameStats[key('_lastDropWasHard')]) {
                            combo_ai = (combo_ai || 0) + 1;
                            if (combo_ai >= 5) {
                                const comboText = '硬降 x ' + combo_ai;
                                const comboColors = ['#ff6b35', '#ff2d55', '#ffd700', '#ff00ff', '#00ffff'];
                                const comboColor = comboColors[(combo_ai - 5) % comboColors.length];
                                const cSize = 22 + Math.random() * 14;
                                const cRot = (Math.random() - 0.5) * 30;
                                const yOff = (Math.random() - 0.5) * 40;
                                const groundX = COLS * CELL * 2 + 12; // P2 右侧
                                const safeGroundY = Math.max(1, groundY || 0);
                                const groundYpx = (safeGroundY - 1) * CELL + yOff;
                                eventBus.emit('hardDropCombo', {
                                    x: groundX, y: groundYpx,
                                    text: comboText, color: comboColor,
                                    size: cSize, vy: -60, rotation: cRot
                                });
                            }
                        } else {
                            combo_ai = 0;
                        }
                        gameStats[key('_lastDropWasHard')] = false;
                    }
                }
            }
        }
        // 保存状态供下一帧
        gameStats[key('_lastPieceName')] = game.piece;
        if (game.piece && game.currentShape) {
            gameStats[key('_lastPieceX')] = game.pieceX;
            gameStats[key('_lastPieceY')] = game.pieceY;
            gameStats[key('_lastPieceGhostY')] = game._ghostY;
            gameStats[key('_lastPieceShape')] = game.currentShape.map(r => [...r]);
        }
    }

    /** 处理消除行（触发事件总线） */
    _handleLinesCleared() {
        const d = playerGame.lines - gameStats._lastLines;
        gameStats.playerLines += d;
        if (d === 4) { gameStats.tetrisCount++; playSfx('tetris'); } else playSfx('clear');

        let rows = playerGame._cachedClearRows;
        if (!rows || rows.length === 0) {
            rows = [];
            for (let i = 0; i < d; i++) rows.push(ROWS - 1 - i);
        }
        playerGame._cachedClearRows = null;

        const isCoop = gameMode === 'coop';
        if (isCoop) {
            // 合作模式：粒子/文字/环特效在 coopRenderer.checkParticleTriggers 中处理
            // 这里只触发棋盘震动
            if (coopRenderer) coopRenderer.applyShake(d);
        } else {
            // 单人/对战模式：通过事件触发放到 playerRenderer 上
            eventBus.emit('linesClearedRing', { count: d });
            eventBus.emit('linesClearedParticles', { rows, game: playerGame });
            if (playerRenderer) playerRenderer.applyShake(d);
            const baseRow = rows[0];
            const cx = COLS * CELL / 2;
            const cy = baseRow * CELL;
            let txt = '+' + (d * 100);
            let color = '#ffffff';
            if (d === 2) { txt = '+' + (d * 100) + ' 双消!'; color = '#4ecdc4'; }
            else if (d === 3) { txt = '+' + (d * 100) + ' 三消!'; color = '#45b7d1'; }
            else if (d >= 4) { txt = 'TETRIS! +' + (d * 100); color = '#ffd700'; eventBus.emit('tetrisCelebration', {}); }
            eventBus.emit('linesClearedText', { x: cx, y: cy - 20, text: txt, color, size: d >= 4 ? 36 : 26 });
        }

        if (!gameStats._firstLineCleared) {
            gameStats._firstLineCleared = true;
            if (Date.now() - gameStats._gameStartTime < 15000) gameStats.fastClear = true;
        }
    }

    /** 模式特定检查（关卡/挑战/建造） */
    _checkModeSpecific(mode, dt) {
        if (mode === 'single' && !playerGame.gameOver && !playerGame.paused && !playerGame.clearing &&
            playerGame.score >= stageTarget && stageWinTimer < 0) {
            // 推进关卡，不暂停游戏，弹出小标签提示
            const oldTarget = stageTarget;
            stage++;
            playSfx('stageup');
            gameStats.maxStage = Math.max(gameStats.maxStage, stage);
            stageTarget = Math.floor(stage * 1000 * (1 + (stage - 1) * 0.5));
            document.getElementById('targetScoreDisplay').textContent = stageTarget;
            document.getElementById('playerLevel').textContent = stage;
            showStageNotification(stage, stageTarget);
            // 如果分数仍然达到新目标（连过数关），继续推进
            if (playerGame.score >= stageTarget && stageWinTimer < 0) {
                return; // 在下一帧会再次检测
            }
        }

        if (mode === 'challenge' && !playerGame.gameOver && !playerGame.paused && challengeTimeLeft <= 0) {
            playerGame.gameOver = true;
        }

        if (mode === 'build' && !playerGame.gameOver && !playerGame.paused && !playerGame.clearing) {
            if (buildChallengeCompleted) {
                buildChallengeTimer += dt;
                if (buildChallengeTimer >= 2500) {
                    buildChallengeTimer = -1; buildChallengeCompleted = false;
                    buildCurrentChallenge = getNextBuildChallenge();
                    buildCooldown = 3000;
                    updateBuildChallengeUI();
                }
            } else if (buildCooldown > 0) buildCooldown -= dt;
            else if (buildCurrentChallenge && buildCurrentChallenge.check(playerGame.grid)) {
                buildChallengeCompleted = true;
                buildChallengeTimer = 0;
                buildCompletedCount++;
                gameStats._buildCount++;
                buildCombo++;
                const b = Math.floor((buildCombo - 1) * 50);
                playerGame.score += buildCurrentChallenge.reward + b;
                playSfx('tetris');
                showBuildChallengeComplete(buildCurrentChallenge, b);
                updateBuildChallengeUI();
            } else if (!buildCurrentChallenge) {
                // buildCurrentChallenge 为 null 时每 3 秒重试一次
                // 玩家继续搭方块可能破坏已有挑战的条件（如对称），从而出现新任务
                _buildNullRetryTimer = (_buildNullRetryTimer || 0) + dt;
                if (_buildNullRetryTimer >= 3000) {
                    _buildNullRetryTimer = 0;
                    buildCurrentChallenge = getNextBuildChallenge();
                    if (buildCurrentChallenge) {
                        buildCooldown = 3000;
                        updateBuildChallengeUI();
                    }
                }
            }
        }
    }

    /** 更新粒子 + 呼吸特效 + 心跳音效 + 渲染 */
    _updateAndRender(mode, dt) {
        if (mode === 'coop') {
            coopRenderer.updateParticles(dt);
        } else {
            playerRenderer.updateParticles(dt);
            playerRenderer.updateHudParticles(dt);
            if (mode === 'ai' || mode === 'pvp') aiRenderer.updateParticles(dt);
        }

        // 更新呼吸特效
        breathEffect.update(dt);

        // 呼吸心跳音效系统：达到橙色（等级2）或红色（等级3）呼吸时播放心跳
        const heartbeatInterval = breathEffect.getHeartbeatInterval();
        if (heartbeatInterval > 0) {
            const now = performance.now();
            // 如果距离上次心跳超过了interval，触发新心跳
            if (typeof this._lastHeartbeatTime === 'undefined') {
                this._lastHeartbeatTime = 0;
            }
            if (now - this._lastHeartbeatTime >= heartbeatInterval) {
                playHeartbeat(heartbeatInterval);
                this._lastHeartbeatTime = now;
            }
        } else {
            // 无心跳时重置计时，避免恢复后瞬间触发
            this._lastHeartbeatTime = 0;
        }

        if (mode === 'coop') coopRenderer.render();
        else {
            playerRenderer.render();
            playerRenderer.renderHud();
            aiRenderer.render();
        }

        // 渲染呼吸特效（在棋盘渲染之后）
        breathEffect.render();

        updateUI();
    }
}