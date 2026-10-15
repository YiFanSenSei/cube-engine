// ===== 游戏状态代理（纯数据容器，无游戏逻辑）=====
// 所有游戏逻辑由 C++ 后端执行，此类仅保存 C++ 同步过来的状态供渲染器使用

class GameProxy {
    constructor(isAI){
        this.isAI = isAI;
        this.difficulty = 'medium';
        this.buildMode = false;
        this.gravityEnabled = !isAI;

        this.grid = [];
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.blockStats = {};
        this.gameOver = false;
        this.paused = false;

        this.piece = null;
        this.nextPiece = null;
        this.currentShape = [];
        this.pieceX = 0;
        this.pieceY = 0;
        this.currentRotation = 0;
        this.hasLocked = false;

        this.clearing = false;
        this.clearRows = [];
        this.clearTimer = 0;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.lockDelay = 0;
        this.lockDelayMax = 500;

        this.aiMoveSteps = [];
        this.aiWaitTimer = 0;

        this._ghostY = 0;
        this._cachedClearRows = null;
        this._clearingCounted = false;

        this.reset();
    }

    reset(){
        this.grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.blockStats = {};
        this.gameOver = false;
        this.paused = false;
        this.piece = null;
        this.nextPiece = null;
        this.currentShape = [];
        this.pieceX = 0;
        this.pieceY = 0;
        this.currentRotation = 0;
        this.hasLocked = false;
        this.clearing = false;
        this.clearRows = [];
        this.clearTimer = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.lockDelay = 0;
        this.lockDelayMax = 500;
        this.aiMoveSteps = [];
        this.aiWaitTimer = 0;
        this._ghostY = 0;
        this._cachedClearRows = null;
        this._clearingCounted = false;
    }

    // Ghost Y through C++ IPC
    getGhostY(){
        // For coop/pvp modes where C++ isn't available for input, we compute locally
        if(!window.nativeAPI) return this._ghostY;
        // We'll update this value in syncFromNative - use cached value
        return this._ghostY;
    }

    // Used only for placeholder rendering (pre-game overlay)
    isValid(){ return true; }
    move(){ return false; }
    rotate(){ return false; }
    hardDrop(){ return false; }
    update(){}
    clearLinesAndContinue(){}
    afterLock(){}
    aiStep(){}
    evaluatePosition(){ return -999; }
    getBestMove(){ return null; }
    isValidShapeOnGrid(){ return false; }
    aiThink(){}
    spawnPiece(){}
    lockPiece(){}
    fillBag(){}
    getNextFromBag(){ return ''; }
}

// Create global game instances
const playerGame = new GameProxy(false);
const aiGame = new GameProxy(true);

// Sync functions
async function syncFromNative(){
    try {
        const [p, a] = await Promise.all([
            window.nativeAPI.getState({game:'player'}),
            window.nativeAPI.getState({game:'ai'})
        ]);
        if(p) applyNativeState(playerGame, p);
        if(a) applyNativeState(aiGame, a);
    } catch(e){ console.warn('[syncFromNative]', e); }
}

function applyNativeState(proxy, state){
    proxy.grid = [];
    for(let r = 0; r < ROWS; r++){
        proxy.grid[r] = [];
        for(let c = 0; c < COLS; c++){
            proxy.grid[r][c] = state.gridNames[r * COLS + c] || (state.grid[r * COLS + c] ? 'X' : 0);
        }
    }

    // Track cleared blocks: during clearing animation, C++ still has blocks in clearRows
    if(state.clearing && state.clearRows && state.clearRows.length > 0 && !proxy._clearingCounted){
        proxy._clearingCounted = true;
        for(const rowIdx of state.clearRows){
            for(let c = 0; c < COLS; c++){
                const val = proxy.grid[rowIdx]?.[c];
                if(val !== 0 && val !== undefined && val !== null){
                    const name = typeof val === 'string' ? val : 'X';
                    proxy.blockStats[name] = (proxy.blockStats[name] || 0) + 1;
                }
            }
        }
    }
    if(!state.clearing) proxy._clearingCounted = false;
    proxy.score = state.score;
    proxy.lines = state.lines;
    proxy.level = state.level;
    proxy.gameOver = state.gameOver;
    proxy.paused = state.paused;

    // === 先保存旧状态，再更新新状态（时序关键！）===
    const oldPiece = proxy.piece;
    const oldPieceX = proxy.pieceX;
    const oldPieceY = proxy.pieceY;
    const oldShape = proxy.currentShape;

    proxy.clearing = state.clearing || false;
    proxy.clearRows = state.clearRows || [];
    // 缓存消除行位置：只要 clearing 期间有 clearRows，就记住它们
    if (proxy.clearing && proxy.clearRows.length > 0) {
        proxy._cachedClearRows = proxy.clearRows.slice();
    }
    proxy.clearTimer = state.clearTimer || 0;
    proxy.dropInterval = state.dropInterval || 1000;
    proxy.buildMode = state.buildMode || false;

    // 现在更新新值
    proxy.piece = state.piece || null;
    proxy.nextPiece = state.nextPiece || null;
    proxy.pieceX = state.pieceX;
    proxy.pieceY = state.pieceY;
    proxy.currentRotation = state.currentRotation || 0;

    // 锁定检测移至 gameLoop 轮询，不依赖回调时序

    if(state.piece){
        const shapes = proxy.buildMode ? BUILD_SHAPES : SHAPES;
        if(shapes[state.piece]){
            let shape = shapes[state.piece].map(r => [...r]);
            const rot = state.currentRotation || 0;
            for(let i = 0; i < rot; i++) shape = rotateCW(shape);
            proxy.currentShape = shape;
        }
    }

    // 建造模式 safety net：任意方块到达第 0 行（顶部）→ game over
    // 使用 some 而不是检查单一列，因为侧边的方块堆到顶部时也要结束
    // 注意：clearing 期间不检测，因为消除会插入空行到顶部，grid[0] 的状态是临时的
    if (proxy.buildMode && !proxy.gameOver && !proxy.clearing && proxy.grid[0]) {
        if (proxy.grid[0].some(cell => cell !== 0)) {
            proxy.gameOver = true;
        }
    }

    // Compute ghost Y locally for rendering
    if(proxy.piece && proxy.currentShape.length > 0){
        let gy = proxy.pieceY;
        while(isValidShape(proxy.grid, proxy.currentShape, proxy.pieceX, gy + 1)) gy++;
        proxy._ghostY = gy;
    } else {
        proxy._ghostY = proxy.pieceY;
    }
}

function isValidShape(grid, shape, px, py){
    for(let r = 0; r < shape.length; r++)
        for(let c = 0; c < shape[r].length; c++){
            if(!shape[r][c]) continue;
            const x = px + c, y = py + r;
            if(x < 0 || x >= COLS || y >= ROWS) return false;
            if(y >= 0 && grid[y][x] !== 0) return false;
        }
    return true;
}

// Check native availability
let nativeAvailable = false;
(async function(){
    try {
        const c = await window.nativeAPI.available();
        nativeAvailable = c;
        if(!c){
            console.error('[Tetris] C++ 引擎未加载！请先运行: npx node-gyp rebuild');
        }
    } catch(e){
        console.error('[Tetris] C++ 引擎检查失败:', e);
    }
})();

// Node.js 导出（用于 Jest 测试）
if(typeof module !== 'undefined' && module.exports){
    module.exports = { GameProxy, applyNativeState, isValidShape, syncFromNative };
}
