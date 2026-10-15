// Jest setup 文件：模拟 Electron 渲染进程的全局 API
global.window = {
    nativeAPI: {
        dbGet: jest.fn(() => Promise.resolve(null)),
        dbSet: jest.fn(() => Promise.resolve()),
        dbDelete: jest.fn(() => Promise.resolve()),
        getSystemTheme: jest.fn(() => 'dark'),
        setDifficulty: jest.fn(() => {}),
        available: jest.fn(() => Promise.resolve(false)),
        update: jest.fn(() => Promise.resolve()),
        move: jest.fn(() => Promise.resolve(true)),
        rotate: jest.fn(() => Promise.resolve(true)),
        hardDrop: jest.fn(() => Promise.resolve(true)),
        getState: jest.fn(() => Promise.resolve(null)),
        getGhostY: jest.fn(() => Promise.resolve(0)),
        aiTick: jest.fn(() => Promise.resolve()),
        coopClearCheck: jest.fn(() => Promise.resolve()),
        setPiece: jest.fn(() => Promise.resolve())
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// 加载游戏常量到全局（shop.js、game_proxy.js 等依赖全局变量）
const constants = require('./renderer/js/constants');
for (const [key, value] of Object.entries(constants)) {
    global[key] = value;
}

// 模拟 skinManager（shop.js 中使用）
global.skinManager = {
    _activeSkinId: 'classic',
    setActiveSkin: jest.fn(function(id) { this._activeSkinId = id || 'classic'; }),
    getActiveSkinId: jest.fn(function() { return this._activeSkinId; })
};

// 模拟 document（shop.js 中 applyBlockSkin 调用 document.getElementById）
global.document = {
    getElementById: jest.fn(() => null)
};
