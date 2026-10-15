// Handle ELECTRON_RUN_AS_NODE - some shells set this and it breaks Electron's
// built-in module resolution for require('electron')
delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ========== 数据存储（JSON 文件）==========
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function sanitizeKey(key) {
    return key.replace(/[^a-zA-Z0-9_一-鿿]/g, '_');
}

function getDataPath(key) {
    return path.join(DATA_DIR, sanitizeKey(key) + '.json');
}

ipcMain.handle('db:get', (event, key) => {
    const fp = getDataPath(key);
    try {
        if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch (e) { console.error('[DB] get error:', key, e.message); }
    return null;
});

ipcMain.handle('db:set', (event, key, value) => {
    const fp = getDataPath(key);
    try {
        fs.writeFileSync(fp, JSON.stringify(value, null, 2), 'utf-8');
        return true;
    } catch (e) { console.error('[DB] set error:', key, e.message); }
    return false;
});

ipcMain.handle('db:delete', (event, key) => {
    const fp = getDataPath(key);
    try {
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
        return true;
    } catch (e) { return false; }
});

ipcMain.handle('db:deletePrefix', (event, prefix) => {
    const san = sanitizeKey(prefix);
    try {
        const files = fs.readdirSync(DATA_DIR);
        for (const f of files) {
            if (f.startsWith(san)) fs.unlinkSync(path.join(DATA_DIR, f));
        }
        return true;
    } catch (e) { return false; }
});

// ========== 加载 C++ Native Addon（必需）==========
let tetrisCore = null;
try {
    tetrisCore = require('./build/Release/tetris_core.node');
    console.log('[C++ Native Addon] ✅ 加载成功');
} catch (e) {
    console.error('[C++ Native Addon] ❌ 加载失败:', e.message);
    console.error('请先运行: npx node-gyp rebuild');
    process.exit(1); // C++ 模块是必需依赖，无法加载则退出
}

// ========== 游戏实例管理 ==========
const games = { player: null, ai: null };

function createGame(isAI) {
    if (!tetrisCore) return null;
    try {
        return tetrisCore.createGame(isAI);
    } catch (e) {
        console.error('创建游戏实例失败:', e);
        return null;
    }
}

// ========== 辅助函数 ==========
function getGame(name) { return name === 'ai' ? games.ai : games.player; }
function getGameOrFail(name) {
    const g = getGame(name);
    return (g && tetrisCore) ? g : null;
}

// ========== IPC 处理器 ==========
ipcMain.handle('game:init', (event, { playerIsAI, aiIsAI, difficulty, buildMode, p2pMode }) => {
    if (!tetrisCore) return { error: 'C++ 模块未加载' };
    try {
        games.player = null;
        games.ai = null;
        // Player game instance
        games.player = createGame(playerIsAI || false);
        if (games.player) {
            tetrisCore.reset(games.player);
            if (difficulty) tetrisCore.setDifficulty(games.player, difficulty);
            if (buildMode) tetrisCore.setBuildMode(games.player, buildMode);
        }
        // AI / P2 game instance (needed for ai, pvp, coop modes)
        const needAI = aiIsAI !== undefined || p2pMode;
        if (needAI) {
            games.ai = createGame(aiIsAI === true);
            if (games.ai) {
                tetrisCore.reset(games.ai);
                if (difficulty) tetrisCore.setDifficulty(games.ai, difficulty);
                if (buildMode) tetrisCore.setBuildMode(games.ai, buildMode);
            }
        }
        return {
            playerState: games.player ? tetrisCore.getState(games.player) : null,
            aiState: games.ai ? tetrisCore.getState(games.ai) : null,
        };
    } catch (e) {
        console.error('game:init 错误:', e);
        return { error: e.message };
    }
});

ipcMain.handle('game:move', (event, { game, dx, dy }) => {
    const g = getGameOrFail(game);
    return g ? tetrisCore.move(g, dx, dy) : false;
});

ipcMain.handle('game:rotate', (event, { game }) => {
    const g = getGameOrFail(game);
    return g ? tetrisCore.rotate(g) : false;
});

ipcMain.handle('game:hardDrop', (event, { game }) => {
    const g = getGameOrFail(game);
    return g ? tetrisCore.hardDrop(g) : false;
});

ipcMain.handle('game:getGhostY', (event, { game }) => {
    const g = getGameOrFail(game);
    return g ? tetrisCore.getGhostY(g) : 0;
});

ipcMain.handle('game:update', (event, { game, dt }) => {
    const g = getGameOrFail(game);
    if (!g) return null;
    tetrisCore.update(g, dt);
    return tetrisCore.getState(g);
});

ipcMain.handle('game:aiStep', (event, { dt }) => {
    if (!games.ai || !tetrisCore) return null;
    tetrisCore.aiStep(games.ai, dt);
    return tetrisCore.getState(games.ai);
});

ipcMain.handle('game:aiTick', (event, { dt }) => {
    if (!games.ai || !tetrisCore) return null;
    tetrisCore.aiStep(games.ai, dt);
    tetrisCore.update(games.ai, dt);
    return tetrisCore.getState(games.ai);
});

ipcMain.handle('game:getState', (event, { game }) => {
    const g = getGameOrFail(game);
    return g ? tetrisCore.getState(g) : null;
});

ipcMain.handle('game:setDifficulty', (event, { game, difficulty }) => {
    const g = getGameOrFail(game);
    if (g) tetrisCore.setDifficulty(g, difficulty);
});

ipcMain.handle('game:setBuildMode', (event, { game, buildMode }) => {
    const g = getGameOrFail(game);
    if (g) tetrisCore.setBuildMode(g, buildMode);
});

ipcMain.handle('game:coopClearCheck', () => {
    if (!tetrisCore || !games.player || !games.ai) return;
    tetrisCore.coopClearCheck(games.player, games.ai);
});

ipcMain.handle('game:setCoopMode', (event, enabled) => {
    if (!tetrisCore || !games.player || !games.ai) return;
    tetrisCore.setCoopMode(games.player, enabled);
    tetrisCore.setCoopMode(games.ai, enabled);
});

ipcMain.handle('native:available', () => tetrisCore !== null);

// ========== Electron 窗口 ==========
function createWindow() {
    const win = new BrowserWindow({
        width: 860,
        height: 960,
        resizable: true,
        fullscreenable: true,
        title: '方块引擎 Cube Engine (C++ 引擎)',
        backgroundColor: '#0a0a1a',
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 添加时间戳防止缓存
    win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { query: { t: Date.now() } });
    win.setMenuBarVisibility(false);

    win.once('ready-to-show', () => {
        win.show();
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});