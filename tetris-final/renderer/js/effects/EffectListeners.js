// ===== 事件驱动特效监听器 =====
// 将所有粒子/HUD/背景特效的触发从游戏循环解耦到事件监听

function setupEffectListeners() {
    /** 根据当前游戏模式获取正确的粒子系统 */
    function _getParticles() {
        if (gameMode === 'coop') return coopRenderer && coopRenderer.particles ? coopRenderer.particles : null;
        return playerRenderer && playerRenderer.particles ? playerRenderer.particles : null;
    }

    /** 根据当前游戏模式获取正确的 HUD 管理器 */
    function _getHud() {
        if (gameMode === 'coop') return null; // 合作模式不使用 HUD覆盖层
        return playerRenderer && playerRenderer.hud && playerRenderer.hud.isAvailable() ? playerRenderer.hud : null;
    }

    // ===== 方块锁定（硬降/落定粒子） =====
    eventBus.on('pieceLocked', function(data) {
        const { x, y, color } = data;
        const particles = _getParticles();
        if (particles) {
            particles.emitHardDrop(x, y, color);
            particles.emitLockRipple(x, y, color);
        }
    });

    // ===== 硬降连击 HUD 文字 =====
    eventBus.on('hardDropCombo', function(data) {
        const { x, y, text, color, size, vy, rotation } = data;
        const hud = _getHud();
        if (hud) {
            hud.showFloatingText(x, y, text, color, size, vy, rotation);
        }
    });

    // ===== 消除行：背景扩散圈特效 =====
    eventBus.on('linesClearedRing', function(data) {
        const { count } = data;
        if (typeof bgEffects !== 'undefined') {
            bgEffects.emitClearRing(count);
        }
    });

    // ===== 消除行：每个格子的粒子 =====
    eventBus.on('linesClearedParticles', function(data) {
        const { rows, game } = data;
        const particles = _getParticles();
        if (!particles) return;
        for (const row of rows) {
            for (let c = 0; c < COLS; c++) {
                const px = c * CELL + CELL / 2;
                const py = row * CELL + CELL / 2;
                const color = COLORS[PIECE_NAMES[(row + c) % PIECE_NAMES.length]] || '#ffffff';
                particles.emit(px, py, 1, color, {
                    speedMin: 40, speedMax: 120,
                    sizeMin: 2, sizeMax: 4,
                    lifeMin: 500, lifeMax: 900,
                    spread: Math.PI * 2,
                    vyOffset: -50
                });
            }
        }
    });

    // ===== 消除行：浮动得分文字 =====
    eventBus.on('linesClearedText', function(data) {
        const { x, y, text, color, size } = data;
        const particles = _getParticles();
        if (particles) {
            particles.showFloatingText(x, y, text, color, size);
        }
    });

    // ===== Tetris 四消庆典 =====
    eventBus.on('tetrisCelebration', function(data) {
        const particles = _getParticles();
        if (particles) {
            particles.emitTetris();
        }
    });

    console.log('[EffectListeners] 事件监听器已注册');
}