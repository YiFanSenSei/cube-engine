// ===== 方块皮肤基类 =====
// 所有皮肤策略继承此基类，实现 drawBlock 方法

class BaseSkin {
    /**
     * 绘制单个方块
     * @param {CanvasRenderingContext2D} ctx 画布上下文
     * @param {number} x 棋盘列位置
     * @param {number} y 棋盘行位置
     * @param {string} color 方块主色（如 '#ff0000'）
     * @param {string|null} glow 发光色
     * @param {number} alpha 透明度 0~1
     * @param {number} cell 格子像素大小
     */
    drawBlock(ctx, x, y, color, glow, alpha, cell) {
        // 子类应重写此方法
        this._drawDefault(ctx, x, y, color, glow, alpha, cell);
    }

    /**
     * 默认经典皮肤渲染
     */
    _drawDefault(ctx, x, y, color, glow, alpha, cell) {
        const px = x * cell, py = y * cell, pad = 1, sz = cell - pad * 2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(px + pad, py + pad, sz, sz);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(px + pad, py + pad, sz, 3);
        ctx.fillRect(px + pad, py + pad, 3, sz);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(px + pad, py + sz - 3, sz, 3);
        ctx.fillRect(px + sz - 3, py + pad, 3, sz);
        if (glow && alpha > 0.8) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = 'transparent';
            ctx.fillRect(px + pad, py + pad, sz, sz);
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
    }

    /**
     * 辅助：解析 hex 颜色为 RGB 分量
     */
    _parseColor(hex) {
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        };
    }

    /**
     * 辅助：获取当前皮肤ID（方便子类引用）
     */
    getSkinId() {
        return skinManager.getActiveSkinId();
    }
}