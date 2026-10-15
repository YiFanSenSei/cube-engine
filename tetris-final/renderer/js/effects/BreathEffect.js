// ===== 呼吸特效系统 =====
// 屏幕左右两侧边缘光晕，根据棋盘堆叠高度产生不同颜色和频率的呼吸效果
// 单人/合作模式：左右同步（反映同一个棋盘）
// AI/PvP 模式：左侧对应玩家1，右侧对应AI/玩家2，各自独立

class BreathEffect {
    constructor() {
        this._canvas = null;
        this.ctx = null;

        // 左侧和右侧的呼吸状态（独立）
        this.leftState = this._createState();
        this.rightState = this._createState();

        // 模式配置
        this.mode = 'single'; // 'single' | 'ai' | 'pvp' | 'coop'

        // 游戏引用（由外部设置）
        this.leftGame = null;   // 左侧对应的 game 对象
        this.rightGame = null;  // 右侧对应的 game 对象
    }

    _createState() {
        return {
            level: 0,           // 0=无, 1=黄, 2=橙, 3=红
            phase: 0,           // 正弦波相位
            alpha: 0,           // 当前透明度
            color: [0, 0, 0],   // RGB 颜色
            period: 1000,       // 呼吸周期(ms)
            alphaMin: 0,        // 最小透明度
            alphaMax: 0,        // 最大透明度
            stackHeight: 0,     // 当前堆叠高度
            prevLevel: 0        // 上一帧等级（用于检测变化）
        };
    }

    /**
     * 初始化 canvas
     */
    _init() {
        if (this.ctx) return true;
        this._canvas = document.getElementById('breathCanvas');
        if (!this._canvas) return false;
        this.ctx = this._canvas.getContext('2d');
        this._resize();
        return true;
    }

    _resize() {
        if (!this._canvas || !this.ctx) return;
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
    }

    /**
     * 设置模式并绑定游戏对象
     * @param {string} mode - 游戏模式
     * @param {object} playerGame - 玩家1游戏
     * @param {object} aiGame - AI/玩家2游戏（单人模式下为 null）
     */
    setMode(mode, playerGame, aiGame) {
        this.mode = mode;
        if (mode === 'coop') {
            // 合作模式：左右分别对应两个玩家的棋盘，取最高者统一呼吸
            this.leftGame = playerGame;
            this.rightGame = aiGame;
        } else if (mode === 'single' || mode === 'build') {
            // 单人/建造：左右同步，都看 playerGame
            this.leftGame = playerGame;
            this.rightGame = playerGame;
        } else {
            // AI/PvP：左侧看玩家1，右侧看AI/玩家2
            this.leftGame = playerGame;
            this.rightGame = aiGame;
        }
    }

    /**
     * 计算棋盘的堆叠高度
     * 从顶部往下找第一个非空格子，返回从底部算起的行数
     */
    _getStackHeight(game) {
        if (!game || !game.grid || game.gameOver) return 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (game.grid[r] && game.grid[r][c]) {
                    return ROWS - r;
                }
            }
        }
        return 0;
    }

    /**
     * 根据堆叠高度确定呼吸等级
     * @param {number} height 堆叠高度（行数）
     * @returns {object} { level, color, period, alphaMin, alphaMax }
     */
    _getBreathConfig(height) {
        if (height < 9) {
            return { level: 0, color: [0, 0, 0], period: 1000, alphaMin: 0, alphaMax: 0 };
        }
        if (height < 13) {
            // 黄色呼吸：频率略快，强度提升
            return { level: 1, color: [255, 215, 0], period: 2000, alphaMin: 0.08, alphaMax: 0.24 };
        }
        if (height < 16) {
            // 橙色呼吸：频率加快，强度提升
            return { level: 2, color: [255, 165, 0], period: 1300, alphaMin: 0.14, alphaMax: 0.35 };
        }
        // 红色呼吸：频率更快，强度更高
        return { level: 3, color: [255, 50, 50], period: 800, alphaMin: 0.20, alphaMax: 0.50 };
    }

    /**
     * 更新单个呼吸状态
     */
    _updateState(state, game, dt) {
        const height = this._getStackHeight(game);
        state.stackHeight = height;

        const config = this._getBreathConfig(height);
        state.level = config.level;
        state.color = config.color;
        state.period = config.period;
        state.alphaMin = config.alphaMin;
        state.alphaMax = config.alphaMax;

        // 更新相位
        if (state.level > 0) {
            const freq = (2 * Math.PI) / config.period;
            state.phase += freq * dt;
            if (state.phase > Math.PI * 2) {
                state.phase -= Math.PI * 2;
            }
            // 计算当前 alpha：使用正弦波在 [0, PI] 区间产生呼吸效果
            // sin(phase) 在 [0, PI] 范围从 0 到 1 再到 0
            const sinVal = Math.sin(state.phase);
            // 将 sinVal 从 [-1, 1] 映射到 [0, 1]
            const normalized = (sinVal + 1) / 2;
            // 映射到 alpha 范围
            state.alpha = state.alphaMin + normalized * (state.alphaMax - state.alphaMin);
        } else {
            state.phase = 0;
            state.alpha = 0;
        }

        // 检测等级变化（从无到有或等级切换）
        if (state.level !== state.prevLevel) {
            state.prevLevel = state.level;
            if (state.level > 0) {
                // 重置相位，让呼吸从最亮开始
                state.phase = Math.PI / 2; // sin(π/2)=1 → 最亮
            }
        }
    }

    /**
     * 获取当前最高呼吸等级（用于心跳音效触发）
     * @returns {number} 0=无, 1=黄, 2=橙, 3=红
     */
    getBreathLevel() {
        return Math.max(this.leftState.level, this.rightState.level);
    }

    /**
     * 获取当前心跳间隔时间（根据呼吸周期确定）
     * @returns {number} 心跳间隔毫秒数，0 表示不播放心跳
     */
    getHeartbeatInterval() {
        const level = this.getBreathLevel();
        if (level >= 3) {
            // 红色呼吸：心跳最快，约 800ms
            return 800;
        } else if (level === 2) {
            // 橙色呼吸：心跳，约 1300ms
            return 1300;
        } else if (level === 1) {
            // 黄色呼吸：心跳较慢，约 2000ms
            return 2000;
        }
        return 0; // 无心跳
    }

    /**
     * 获取屏幕左右边缘的位置
     * 呼吸特效贴住屏幕边缘，从画面边向内扩散 → 全屏沉浸感
     * @returns {object} { left, right } 屏幕左右边缘 x 坐标
     */
    _getBoardEdges() {
        // 始终返回屏幕（窗口）的左右边界
        return { left: 0, right: window.innerWidth };
    }

    /**
     * 更新呼吸特效
     * @param {number} dt 时间间隔(ms)
     */
    update(dt) {
        if (!this._init()) return;
        if (!this.leftGame && !this.rightGame) return;

        // 合作模式：分别计算两岸堆叠高度，取最高者作为统一的呼吸依据
        if (this.mode === 'coop' && this.leftGame && this.rightGame && this.rightGame !== this.leftGame) {
            const leftHeight = this._getStackHeight(this.leftGame);
            const rightHeight = this._getStackHeight(this.rightGame);
            const maxHeight = Math.max(leftHeight, rightHeight);

            // 完全基于最大高度计算呼吸参数，不调用 _updateState（避免被单边低高度干扰）
            const config = this._getBreathConfig(maxHeight);
            this.leftState.stackHeight = maxHeight;
            this.leftState.level = config.level;
            this.leftState.color = config.color;
            this.leftState.period = config.period;
            this.leftState.alphaMin = config.alphaMin;
            this.leftState.alphaMax = config.alphaMax;

            // 相位与透明度计算（与 _updateState 逻辑一致，但基于 maxHeight）
            if (this.leftState.level > 0) {
                const freq = (2 * Math.PI) / config.period;
                this.leftState.phase += freq * dt;
                if (this.leftState.phase > Math.PI * 2) {
                    this.leftState.phase -= Math.PI * 2;
                }
                const sinVal = Math.sin(this.leftState.phase);
                const normalized = (sinVal + 1) / 2;
                this.leftState.alpha = this.leftState.alphaMin + normalized * (this.leftState.alphaMax - this.leftState.alphaMin);
            } else {
                this.leftState.phase = 0;
                this.leftState.alpha = 0;
            }
            // 等级变化检测
            if (this.leftState.level !== this.leftState.prevLevel) {
                this.leftState.prevLevel = this.leftState.level;
                if (this.leftState.level > 0) {
                    this.leftState.phase = Math.PI / 2;
                }
            }

            // 左右同步
            this.rightState.level = this.leftState.level;
            this.rightState.phase = this.leftState.phase;
            this.rightState.alpha = this.leftState.alpha;
            this.rightState.color = this.leftState.color;
            this.rightState.alphaMin = this.leftState.alphaMin;
            this.rightState.alphaMax = this.leftState.alphaMax;
            this.rightState.stackHeight = this.leftState.stackHeight;
            this.rightState.prevLevel = this.leftState.prevLevel;
            return;
        }

        // 非合作模式：原有逻辑
        if (this.leftGame) {
            this._updateState(this.leftState, this.leftGame, dt);
        }

        // 右侧状态更新策略：
        // - 如果 rightGame 不存在，或与 leftGame 是同一个对象（单人/建造），
        //   则直接同步左侧的呼吸状态，保证左右一起呼吸
        // - 否则（AI/PvP），右侧独立更新
        if (!this.rightGame || this.rightGame === this.leftGame) {
            // 同步模式：左右一起呼吸
            this.rightState.level = this.leftState.level;
            this.rightState.phase = this.leftState.phase;
            this.rightState.alpha = this.leftState.alpha;
            this.rightState.color = this.leftState.color;
            this.rightState.alphaMin = this.leftState.alphaMin;
            this.rightState.alphaMax = this.leftState.alphaMax;
            this.rightState.stackHeight = this.leftState.stackHeight;
            this.rightState.prevLevel = this.leftState.prevLevel;
        } else {
            this._updateState(this.rightState, this.rightGame, dt);
        }
    }

    /**
     * 绘制呼吸特效
     */
    render() {
        if (!this._init()) return;
        if (!this.leftGame && !this.rightGame) return;

        const c = this.ctx;
        const canvas = this._canvas;

        // 清除画布
        c.clearRect(0, 0, canvas.width, canvas.height);

        // 获取棋盘边缘位置
        const edges = this._getBoardEdges();

        // --- 左侧呼吸光晕 ---
        if (this.leftState.level > 0 && this.leftState.alpha > 0.01) {
            this._drawSideGlow(c, canvas, 'left', edges.left, this.leftState);
        }

        // --- 右侧呼吸光晕 ---
        if (this.rightState.level > 0 && this.rightState.alpha > 0.01) {
            this._drawSideGlow(c, canvas, 'right', edges.right, this.rightState);
        }
    }

    /**
     * 绘制单侧呼吸光晕（从屏幕边缘向内照射）
     * @param {CanvasRenderingContext2D} c
     * @param {HTMLCanvasElement} canvas
     * @param {string} side 'left' | 'right'
     * @param {number} boardEdge 屏幕边缘 x 坐标（左侧=0，右侧=window.innerWidth）
     * @param {object} state 呼吸状态
     */
    _drawSideGlow(c, canvas, side, boardEdge, state) {
        const [r, g, b] = state.color;
        const alpha = state.alpha;
        const canvasH = canvas.height;

        // 光晕宽度：从屏幕边缘向内扩散约 350px（覆盖范围更大）
        const glowWidth = 350;

        let xStart, xEnd;

        if (side === 'left') {
            // 左侧光晕：从屏幕左边缘（x=0）向右（向内）扩散
            xStart = 0;
            xEnd = glowWidth;
        } else {
            // 右侧光晕：从屏幕右边缘向左（向内）扩散
            xStart = boardEdge;        // window.innerWidth
            xEnd = boardEdge - glowWidth;
        }

        // 使用多个渐变层叠加，产生丰富的呼吸光晕效果
        // 第一层：主光晕（宽渐变，覆盖范围更大）
        const grad = c.createLinearGradient(xStart, 0, xEnd, 0);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`);
        grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${alpha * 0.12})`);
        grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${alpha * 0.03})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        c.fillStyle = grad;
        c.fillRect(Math.min(xStart, xEnd), 0, glowWidth, canvasH);

        // 第二层：靠近屏幕边缘的内层光晕（更亮、更集中，范围也扩大）
        const innerWidth = 140;
        const innerEnd = side === 'left' ? innerWidth : boardEdge - innerWidth;
        const innerGrad = c.createLinearGradient(xStart, 0, innerEnd, 0);
        innerGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.18})`);
        innerGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        c.fillStyle = innerGrad;
        c.fillRect(Math.min(xStart, innerEnd), 0, innerWidth, canvasH);

    }

    /**
     * 清空呼吸画布（游戏结束后重置用）
     */
    clear() {
        if (this.ctx && this._canvas) {
            this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
        // 重置状态
        this.leftState = this._createState();
        this.rightState = this._createState();
    }

    /**
     * 窗口尺寸变化时重设 canvas 大小
     */
    handleResize() {
        this._resize();
    }

    /**
     * 清理资源
     */
    destroy() {
        this.clear();
        this.leftGame = null;
        this.rightGame = null;
    }
}

// 全局单例
const breathEffect = new BreathEffect();