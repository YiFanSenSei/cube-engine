const { contextBridge, ipcRenderer, nativeTheme } = require('electron');

contextBridge.exposeInMainWorld('nativeAPI', {
    // 检查 C++ 模块是否可用
    available: () => ipcRenderer.invoke('native:available'),

    // 游戏初始化
    init: (opts) => ipcRenderer.invoke('game:init', opts),

    // 玩家操作
    move: (opts) => ipcRenderer.invoke('game:move', opts),
    rotate: (opts) => ipcRenderer.invoke('game:rotate', opts),
    hardDrop: (opts) => ipcRenderer.invoke('game:hardDrop', opts),
    getGhostY: (opts) => ipcRenderer.invoke('game:getGhostY', opts),

    // 帧更新
    update: (opts) => ipcRenderer.invoke('game:update', opts),
    aiTick: (opts) => ipcRenderer.invoke('game:aiTick', opts),

    // 获取状态
    getState: (opts) => ipcRenderer.invoke('game:getState', opts),

    // 设置参数
    setDifficulty: (opts) => ipcRenderer.invoke('game:setDifficulty', opts),
    setBuildMode: (opts) => ipcRenderer.invoke('game:setBuildMode', opts),

    // 合作模式：只消除双方同时满的行
    coopClearCheck: () => ipcRenderer.invoke('game:coopClearCheck'),
    setCoopMode: (enabled) => ipcRenderer.invoke('game:setCoopMode', enabled),

    // 获取系统主题（'dark' 或 'light'）
    getSystemTheme: () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light',

    // ========== 数据存储（JSON 文件）==========
    dbGet: (key) => ipcRenderer.invoke('db:get', key),
    dbSet: (key, value) => ipcRenderer.invoke('db:set', key, value),
    dbDelete: (key) => ipcRenderer.invoke('db:delete', key),
    dbDeletePrefix: (prefix) => ipcRenderer.invoke('db:deletePrefix', prefix),
});