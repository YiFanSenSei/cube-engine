// ===== 全窗口扩散圈特效系统 =====
// 使用 HTML 中 body 级别的 #ringCanvas（fixed 定位，z-index -1），
// canvas 覆盖整个游戏窗口，圆圈可向四周充分扩散，
// 信息板（stats-sidebar）和棋盘（canvas-wrap）的不透明背景会遮挡下方的特效。

class BoardRingEffect {
    constructor() {
        this.ringWaves = [];
        this.ctx = null;
        this._rafId = null;
        this._running = false;
        this._lastTime = 0;
        this._canvas = null;
        this._boundUpdate = (t) => this._loop(t);
    }

    _init() {
        if (this.ctx) return true;
        this._canvas = document.getElementById('ringCanvas');
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

    _boardCenter() {
        if (!this._canvas) return { x: 0, y: 0 };
        const cc = document.querySelector('.game-canvas');
        if (!cc) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const gameRect = cc.getBoundingClientRect();
        return {
            x: gameRect.left + gameRect.width / 2,
            y: gameRect.top + gameRect.height / 2
        };
    }

    _isLightMode() {
        return document.body.getAttribute('data-brightness') === 'light';
    }

    emitClearRing(count) {
        if (!this._init()) return;
        this._resize();

        const center = this._boardCenter();
        const maxR = Math.max(this._canvas.width, this._canvas.height) * 1.5;

        const isLight = this._isLightMode();

        let colors;
        if (isLight) {
            // 亮色模式：使用较深/饱和的颜色，在亮色背景下清晰可见
            colors = count === 1 ? ['rgba(30,60,120,0.70)']
                : count === 2 ? ['rgba(20,100,150,0.85)', 'rgba(140,60,20,0.65)']
                : count === 3 ? ['rgba(20,80,160,0.85)', 'rgba(160,80,20,0.75)', 'rgba(140,40,140,0.55)']
                : ['rgba(180,40,20,0.90)', 'rgba(20,100,160,0.80)', 'rgba(160,80,20,0.70)', 'rgba(100,30,140,0.60)'];
        } else {
            // 暗色模式（原有实现，不做改动）
            colors = count === 1 ? ['rgba(200,220,255,0.85)']
                : count === 2 ? ['rgba(78,205,196,0.95)', 'rgba(69,183,209,0.75)']
                : count === 3 ? ['rgba(69,183,209,0.95)', 'rgba(45,156,219,0.85)', 'rgba(255,215,0,0.65)']
                : ['rgba(255,215,0,1.0)', 'rgba(255,100,50,0.85)', 'rgba(255,200,0,0.75)', 'rgba(255,255,100,0.65)'];
        }

        // 不清除旧圈，支持叠加
        if (this.ringWaves.length > 30) this.ringWaves = this.ringWaves.slice(-20);

        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            this.ringWaves.push({
                x: center.x + Math.cos(a) * 10,
                y: center.y + Math.sin(a) * 10,
                radius: 0,
                maxRadius: maxR,
                width: 4 + i * 1.5,
                alpha: 1,
                color: colors[i % colors.length],
                speed: 1000 + i * 25,
                delay: i * 180,
                elapsed: 0,
                maxAlpha: isLight ? 0.20 + i * 0.03 : 0.30 + i * 0.03,
                innerGlow: true
            });
        }

        this._startLoop();
    }

    _startLoop() {
        if (this._running) return;
        this._running = true;
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._boundUpdate);
    }

    _stopLoop() {
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
        this._running = false;
    }

    _loop(ts) {
        const dt = Math.min(ts - this._lastTime, 50);
        this._lastTime = ts;
        this._update(dt);
        this._render();
        if (this.ringWaves.length) {
            this._rafId = requestAnimationFrame(this._boundUpdate);
        } else {
            this._stopLoop();
            if (this.ctx && this._canvas) {
                this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            }
        }
    }

    _update(dt) {
        for (let i = this.ringWaves.length - 1; i >= 0; i--) {
            const r = this.ringWaves[i];
            r.elapsed += dt;
            if (r.elapsed >= r.delay) {
                const t = r.elapsed - r.delay;
                r.radius = t * r.speed / 1000;
                // 渐入：前150ms 内线性渐入
                const fi = Math.min(1, t / 150);
                // 渐出：平滑滚降，衰减剧烈但无硬截断
                const life = r.radius / r.maxRadius;
                const fadeStart = 0.05;
                let fo = 1;
                if (life > fadeStart) {
                    const t = (life - fadeStart) * 8;
                    fo = 1 / (1 + t * t);
                }
                r.alpha = r.maxAlpha * fi * fo;
                if (r.radius >= r.maxRadius) this.ringWaves.splice(i, 1);
            }
        }
    }

    _render() {
        if (!this.ctx || !this._canvas) return;
        const c = this.ctx;
        c.clearRect(0, 0, this._canvas.width, this._canvas.height);

        for (const r of this.ringWaves) {
            if (r.elapsed < r.delay || r.alpha <= 0) continue;

            c.beginPath();
            c.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            c.strokeStyle = r.color;
            c.lineWidth = r.width;
            c.globalAlpha = r.alpha;
            c.stroke();

            if (r.radius > 20 && r.innerGlow) {
                const ir = r.radius * 0.5;
                const m = r.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (m) {
                    const g = c.createRadialGradient(r.x, r.y, 2, r.x, r.y, ir);
                    g.addColorStop(0, `rgba(${m[1]},${m[2]},${m[3]},${r.alpha * 0.12})`);
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    c.fillStyle = g;
                    c.globalAlpha = r.alpha * 0.5;
                    c.beginPath(); c.arc(r.x, r.y, ir, 0, Math.PI * 2); c.fill();
                }
            }
            c.globalAlpha = 1;
        }
    }

    clear() {
        this.ringWaves = [];
        if (this.ctx && this._canvas) this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._stopLoop();
    }
}

const boardRingEffect = new BoardRingEffect();
const bgEffects = boardRingEffect;