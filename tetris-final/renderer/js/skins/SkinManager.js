// ===== 皮肤策略管理器 =====
// 统一管理方块皮肤注册、切换和渲染，替代 window._currentBlockSkin 全局变量

class SkinManager {
    constructor() {
        this._skins = {};
        this._activeSkinId = 'classic';
    }

    /**
     * 注册一个皮肤策略
     * @param {string} id 皮肤ID（如 'neon', 'candy'）
     * @param {BaseSkin} skinInstance 皮肤实例
     */
    register(id, skinInstance) {
        this._skins[id] = skinInstance;
    }

    /**
     * 获取当前激活的皮肤ID
     */
    getActiveSkinId() {
        return this._activeSkinId;
    }

    /**
     * 设置当前激活的皮肤
     * @param {string} id 皮肤ID
     */
    setActiveSkin(id) {
        if (this._skins[id]) {
            this._activeSkinId = id;
        } else {
            console.warn(`[SkinManager] 未知皮肤 "${id}"，使用 classic`);
            this._activeSkinId = 'classic';
        }
    }

    /**
     * 获取皮肤实例
     * @param {string} id 皮肤ID（不传则返回当前激活的皮肤）
     */
    getSkin(id) {
        if (id) return this._skins[id] || this._skins.classic;
        return this._skins[this._activeSkinId] || this._skins.classic;
    }

    /**
     * 绘制一个方块（委托给当前激活皮肤的策略）
     */
    drawBlock(ctx, x, y, color, glow, alpha, cell) {
        const skin = this.getSkin();
        skin.drawBlock(ctx, x, y, color, glow, alpha, cell);
    }
}

// 全局单例
const skinManager = new SkinManager();