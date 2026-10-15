// ===== 渲染上下文管理器 =====
// 统一管理所有 Canvas 的获取、上下文创建和 CSS 变量读取

class RenderContext {
    /**
     * 获取 Canvas 元素并返回 2D 上下文
     * @param {string} id Canvas 元素的 DOM ID
     * @returns {CanvasRenderingContext2D|null}
     */
    static getContext(id) {
        const canvas = document.getElementById(id);
        if (!canvas) {
            console.warn(`[RenderContext] Canvas #${id} 未找到`);
            return null;
        }
        return canvas.getContext('2d');
    }

    /**
     * 获取 Canvas 元素
     * @param {string} id Canvas 元素的 DOM ID
     * @returns {HTMLCanvasElement|null}
     */
    static getCanvas(id) {
        return document.getElementById(id);
    }

    /**
     * 读取 CSS 变量（画布背景色）
     */
    static getCanvasBgColor() {
        const style = getComputedStyle(document.body);
        return style.getPropertyValue('--bg-canvas').trim() || '#111122';
    }

    /**
     * 读取 CSS 变量（网格线颜色）
     */
    static getGridLineColor() {
        const style = getComputedStyle(document.body);
        const border = style.getPropertyValue('--border-color').trim();
        return border ? border.replace(/[^,]+(?=\))/, '0.04') : 'rgba(255,255,255,0.04)';
    }

    /**
     * 根据 canvas ID 推断对应的 HUD canvas ID
     * 规则：'playerCanvas' → 'playerHudCanvas', 'aiCanvas' → 'aiHudCanvas'
     */
    static getHudCanvasId(canvasId) {
        return canvasId.replace('Canvas', 'HudCanvas');
    }

    /**
     * 获取 HUD canvas 的 ID
     * @param {string} baseCanvasId 棋盘 canvas ID
     */
    static createHudManager(baseCanvasId) {
        const hid = RenderContext.getHudCanvasId(baseCanvasId);
        return new HudManager(hid);
    }
}