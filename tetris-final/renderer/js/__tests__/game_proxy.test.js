/**
 * game_proxy.js 单元测试
 *
 * 测试 GameProxy 数据容器、isValidShape 碰撞检测、和 applyNativeState 状态同步。
 * 所有常量（ROWS, COLS, SHAPES 等）来自 jest.setup.js 初始化的全局变量。
 */

const { GameProxy, applyNativeState, isValidShape } = require('../game_proxy');

// ========== 构造函数 ==========

describe('GameProxy 构造函数', () => {
    let proxy;

    beforeEach(() => {
        proxy = new GameProxy(false);
    });

    test('创建后棋盘为空', () => {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                expect(proxy.grid[r][c]).toBe(0);
            }
        }
        expect(proxy.grid.length).toBe(ROWS);
        expect(proxy.grid[0].length).toBe(COLS);
    });

    test('初始分数/行数/等级正确', () => {
        expect(proxy.score).toBe(0);
        expect(proxy.lines).toBe(0);
        expect(proxy.level).toBe(1);
    });

    test('初始游戏状态正确', () => {
        expect(proxy.gameOver).toBe(false);
        expect(proxy.paused).toBe(false);
        expect(proxy.piece).toBeNull();
    });

    test('AI 标记正确设置', () => {
        const player = new GameProxy(false);
        const ai = new GameProxy(true);
        expect(player.isAI).toBe(false);
        expect(ai.isAI).toBe(true);
    });

    test('锁延迟参数正确', () => {
        // AI 的 lockDelayMax 应该 >= 玩家的 (由 C++ 设置，这里只测默认)
        expect(proxy.lockDelay).toBe(0);
        expect(proxy.lockDelayMax).toBe(500);
    });

    test('下落参数初始值正确', () => {
        expect(proxy.dropInterval).toBe(1000);
        expect(proxy.dropCounter).toBe(0);
    });

    test('所有字段都有初始值', () => {
        // 核心字段都不应为 undefined
        const fields = ['grid', 'score', 'lines', 'level', 'gameOver', 'paused',
            'piece', 'nextPiece', 'pieceX', 'pieceY', 'clearing',
            'dropInterval', 'lockDelay'];
        fields.forEach(f => {
            expect(proxy[f]).toBeDefined();
        });
    });
});

// ========== reset 方法 ==========

describe('GameProxy.reset()', () => {
    test('重置后所有状态恢复初始', () => {
        const proxy = new GameProxy(false);
        proxy.score = 999;
        proxy.lines = 50;
        proxy.level = 5;
        proxy.gameOver = true;
        proxy.piece = 'T';
        proxy.clearing = true;

        proxy.reset();

        expect(proxy.score).toBe(0);
        expect(proxy.lines).toBe(0);
        expect(proxy.level).toBe(1);
        expect(proxy.gameOver).toBe(false);
        expect(proxy.piece).toBeNull();
        expect(proxy.clearing).toBe(false);
    });

    test('重置后棋盘全空', () => {
        const proxy = new GameProxy(false);
        proxy.grid[5][5] = 1;
        proxy.reset();

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                expect(proxy.grid[r][c]).toBe(0);
            }
        }
    });

    test('重置后清除缓存属性', () => {
        const proxy = new GameProxy(false);
        proxy._ghostY = 15;
        proxy._cachedClearRows = [19];
        proxy._clearingCounted = true;

        proxy.reset();

        expect(proxy._ghostY).toBe(0);
        expect(proxy._cachedClearRows).toBeNull();
        expect(proxy._clearingCounted).toBe(false);
    });
});

// ========== isValidShape 测试 ==========

describe('isValidShape()', () => {
    let proxy;

    beforeEach(() => {
        proxy = new GameProxy(false);
    });

    test('空棋盘上的合法位置返回 true', () => {
        const shape = [[1]];
        expect(isValidShape(proxy.grid, shape, 5, 5)).toBe(true);
    });

    test('超出左边界返回 false', () => {
        const shape = [[1]];
        expect(isValidShape(proxy.grid, shape, -1, 5)).toBe(false);
    });

    test('超出右边界返回 false', () => {
        const shape = [[1, 1, 1, 1, 1]];
        // px=7, I shape width=5 → rightmost at 11 > COLS=10
        expect(isValidShape(proxy.grid, shape, 7, 5)).toBe(false);
    });

    test('超出底部边界返回 false', () => {
        const shape = [[1]];
        expect(isValidShape(proxy.grid, shape, 5, 20)).toBe(false);
    });

    test('与已有方块重叠返回 false', () => {
        proxy.grid[5][5] = 'T'; // 已有方块
        const shape = [[1]];
        expect(isValidShape(proxy.grid, shape, 5, 5)).toBe(false);
    });

    test('相邻位置不受影响', () => {
        proxy.grid[5][5] = 'T';
        const shape = [[1]];
        expect(isValidShape(proxy.grid, shape, 4, 5)).toBe(true);  // 不重叠
        expect(isValidShape(proxy.grid, shape, 6, 5)).toBe(true);  // 不重叠
    });

    test('多行形状的完整合法性检测', () => {
        // T 型: [[0,1,0],[1,1,1]]
        const tShape = [[0, 1, 0], [1, 1, 1]];
        expect(isValidShape(proxy.grid, tShape, 4, 10)).toBe(true);

        // 在底部边缘 → y=19 时 shape[1] 在 y=20 → 超出
        expect(isValidShape(proxy.grid, tShape, 4, 19)).toBe(false);
    });

    test('形状在第一行上方（负 y）时合法', () => {
        const shape = [[1]];
        expect(isValidShape(proxy.grid, shape, 5, -1)).toBe(true);
    });

    test('部分超出底部 row+height=ROWS 返回 false', () => {
        // I 形状竖放: 4 行, px=5, py=16 → 底部 19 = ROWS-1 (OK)
        const iVert = [[1], [1], [1], [1]];
        expect(isValidShape(proxy.grid, iVert, 5, 16)).toBe(true);   // 底部 19 = ROWS-1
        expect(isValidShape(proxy.grid, iVert, 5, 17)).toBe(false);  // 底部 20 = ROWS
    });
});

// ========== applyNativeState 测试 ==========

describe('applyNativeState()', () => {
    let proxy;

    beforeEach(() => {
        proxy = new GameProxy(false);
    });

    test('设置网格数据', () => {
        const state = {
            grid: new Array(ROWS * COLS).fill(0),
            gridNames: new Array(ROWS * COLS).fill(''),
            score: 100,
            lines: 5,
            level: 1,
            gameOver: false,
            paused: false,
            piece: 'T',
            nextPiece: 'I',
            pieceX: 3,
            pieceY: 10,
            currentRotation: 0,
            currentShape: [0,1,0,1,1,1],
            clearing: false,
            clearRows: [],
            clearTimer: 0,
            dropInterval: 1000,
            buildMode: false
        };
        // 在底部放一个方块
        state.gridNames[(ROWS - 1) * COLS + 5] = 'T';

        applyNativeState(proxy, state);

        expect(proxy.score).toBe(100);
        expect(proxy.lines).toBe(5);
        expect(proxy.piece).toBe('T');
        expect(proxy.pieceX).toBe(3);
        expect(proxy.pieceY).toBe(10);

        // 底部方块的名称应保留
        expect(proxy.grid[ROWS - 1][5]).toBe('T');
    });

    test('clearing 状态同步', () => {
        const state = {
            grid: new Array(ROWS * COLS).fill(0),
            gridNames: new Array(ROWS * COLS).fill(''),
            score: 0, lines: 0, level: 1,
            gameOver: false, paused: false,
            piece: null, nextPiece: null,
            pieceX: 0, pieceY: 0,
            currentRotation: 0, currentShape: [],
            clearing: true,
            clearRows: [19],
            clearTimer: 150,
            dropInterval: 1000,
            buildMode: false
        };

        applyNativeState(proxy, state);

        expect(proxy.clearing).toBe(true);
        expect(proxy.clearRows).toEqual([19]);
        expect(proxy.clearTimer).toBe(150);
        expect(proxy._cachedClearRows).toEqual([19]);
    });

    test('gameOver 状态同步', () => {
        const baseState = (overrides = {}) => ({
            grid: new Array(ROWS * COLS).fill(0),
            gridNames: new Array(ROWS * COLS).fill(''),
            score: 0, lines: 0, level: 1,
            gameOver: true, paused: false,
            piece: null, nextPiece: null,
            pieceX: 0, pieceY: 0,
            currentRotation: 0, currentShape: [],
            clearing: false, clearRows: [], clearTimer: 0,
            dropInterval: 1000, buildMode: false,
            ...overrides
        });

        applyNativeState(proxy, baseState());
        expect(proxy.gameOver).toBe(true);
    });

    test('piece 存在时计算 ghostY', () => {
        // I 方块放在顶部，ghostY 应该到底部
        const flatGrid = new Array(ROWS * COLS).fill(0);
        const flatNames = new Array(ROWS * COLS).fill('');

        const state = {
            grid: flatGrid,
            gridNames: flatNames,
            score: 0, lines: 0, level: 1,
            gameOver: false, paused: false,
            piece: 'I', nextPiece: 'O',
            pieceX: 3, pieceY: 0,
            currentRotation: 0,
            currentShape: [1,1,1,1],
            clearing: false, clearRows: [], clearTimer: 0,
            dropInterval: 1000, buildMode: false
        };

        applyNativeState(proxy, state);

        // I 横向(1x4)从 y=0 开始，ghostY 应该到最底部(ROWS-1)因为没有障碍
        expect(proxy._ghostY).toBe(ROWS - 1);
        expect(proxy.currentShape).toBeDefined();
    });

    test('piece 为 null 时 ghostY 为 0', () => {
        const state = {
            grid: new Array(ROWS * COLS).fill(0),
            gridNames: new Array(ROWS * COLS).fill(''),
            score: 0, lines: 0, level: 1,
            gameOver: false, paused: false,
            piece: null, nextPiece: null,
            pieceX: 0, pieceY: 0,
            currentRotation: 0, currentShape: [],
            clearing: false, clearRows: [], clearTimer: 0,
            dropInterval: 1000, buildMode: false
        };

        applyNativeState(proxy, state);
        expect(proxy._ghostY).toBe(0);
    });
});

// ========== getGhostY 测试 ==========

describe('GameProxy.getGhostY()', () => {
    test('无 nativeAPI 时返回 _ghostY 缓存值', () => {
        const proxy = new GameProxy(false);
        proxy._ghostY = 15;
        expect(proxy.getGhostY()).toBe(15);
    });
});
