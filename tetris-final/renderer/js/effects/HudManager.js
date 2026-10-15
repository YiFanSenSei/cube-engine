// ===== HUD 管理器 =====
// 管理棋盘外的 HUD 覆盖层（连击文字、浮动特效等）
// 整合 Renderer 中的 hudCanvas 创建和渲染

class HudManager {
    /**
     * @param {string} canvasId HUD canvas 的 DOM ID
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.ctx = null;
            this.particles = null;
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.particles = new ParticleSystem();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /** 检查 HUD 是否可用 */
    isAvailable() {
        return this.ctx !== null && this.particles !== null;
    }

    /** 更新 HUD 粒子 */
    update(dt) {
        if (this.particles) this.particles.update(dt);
    }

    /** 渲染 HUD 内容 */
    render() {
        if (!this.isAvailable()) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.render(this.ctx);
    }

    /** 清除所有 HUD 内容 */
    clear() {
        if (this.particles) this.particles.clear();
    }

    /** 显示浮动文字（委托给粒子系统） */
    showFloatingText(x, y, text, color, size, vy, rotation) {
        if (this.particles) {
            this.particles.showFloatingText(x, y, text, color, size, vy, rotation);
        }
    }
}