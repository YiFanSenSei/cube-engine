// ===== 粒子特效系统 =====
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.texts = [];
        this.shockwaves = [];
        this._getRowColor = () => '#ffffff';
    }

    // 通用粒子发射
    emit(x, y, count, color, options = {}) {
        const { speedMin = 30, speedMax = 120, sizeMin = 2, sizeMax = 5, lifeMin = 400, lifeMax = 800, gravity = 80, spread = Math.PI * 2, vyOffset = -40 } = options;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * spread;
            const spd = speedMin + Math.random() * (speedMax - speedMin);
            const life = lifeMin + Math.random() * (lifeMax - lifeMin);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd + vyOffset,
                size: sizeMin + Math.random() * (sizeMax - sizeMin),
                color,
                alpha: 0.9 + Math.random() * 0.1,
                life, maxLife: life,
                gravity: gravity + Math.random() * 40,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 8,
                shrink: true
            });
        }
    }

    // 消除行粒子爆发
    emitLineClear(rows) {
        for (const row of rows) {
            for (let c = 0; c < COLS; c++) {
                const px = c * CELL + CELL / 2;
                const py = row * CELL + CELL / 2;
                const color = this._getRowColor(row, c) || '#ffffff';
                this.emit(px, py, 1, color, {
                    speedMin: 40, speedMax: 120,
                    sizeMin: 2, sizeMax: 4,
                    lifeMin: 500, lifeMax: 900,
                    spread: Math.PI * 2,
                    vyOffset: -50
                });
            }
        }
    }


    // 硬降落地冲击
    emitHardDrop(x, y, color) {
        this.shockwaves.push({
            x, y, radius: 4, maxRadius: 50,
            width: 3, alpha: 0.5, color,
            speed: 100
        });
        this.emit(x, y, 10, color, {
            speedMin: 60, speedMax: 140,
            sizeMin: 2, sizeMax: 5,
            lifeMin: 300, lifeMax: 600,
            spread: Math.PI * 2,
            vyOffset: -20
        });
        this.emit(x, y + 10, 6, 'rgba(255,255,255,0.4)', {
            speedMin: 20, speedMax: 60,
            sizeMin: 1, sizeMax: 3,
            lifeMin: 200, lifeMax: 400,
            spread: Math.PI * 0.8,
            vyOffset: -10,
            gravity: 20
        });
    }

    // Skin-based Tetris celebration color scheme
    _getTetrisColors() {
        const skin = skinManager.getActiveSkinId();
        const schemes = {
            neon: ['#ff00ff', '#00ffff', '#ff0066', '#00ff66', '#ff3300'],
            candy: ['#ff9ff3', '#feca57', '#48dbfb', '#ff6b6b', '#5f27cd'],
            matrix: ['#00ff41', '#33ee00', '#66ff33', '#aaff00', '#00cc33'],
            golden: ['#ffd700', '#daa520', '#ffc107', '#ffb300', '#ffea00'],
            crystal: ['#80e8ff', '#ffffff', '#c8a0ff', '#80ffb0', '#ffd080'],
            pastel: ['#a8e6cf', '#ffd3b6', '#dcedc1', '#ff8b94', '#b5eaea']
        };
        return schemes[skin] || ['#ffd700', '#ff6bff', '#fff'];
    }

    // Tetris（四消）庆典
    emitTetris() {
        const colors = this._getTetrisColors();
        for (let i = 0; i < 60; i++) {
            const life = 1500 + Math.random() * 1200;
            this.particles.push({
                x: Math.random() * COLS * CELL,
                y: -20 - Math.random() * 80,
                vx: (Math.random() - 0.5) * 40,
                vy: 40 + Math.random() * 80,
                size: 2 + Math.random() * 5,
                color: colors[i % colors.length],
                alpha: 1, life, maxLife: life,
                gravity: 15 + Math.random() * 10,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 3,
                shrink: false
            });
        }
        this.emit(COLS * CELL / 2, ROWS * CELL / 2, 30, colors[0], {
            speedMin: 80, speedMax: 200,
            sizeMin: 3, sizeMax: 7,
            lifeMin: 600, lifeMax: 1200
        });
        this.emit(COLS * CELL / 2, ROWS * CELL / 2, 20, colors[1], {
            speedMin: 60, speedMax: 160,
            sizeMin: 2, sizeMax: 5,
            lifeMin: 400, lifeMax: 900
        });
    }

    // 锁定落定涟漪
    emitLockRipple(x, y, color) {
        this.shockwaves.push({
            x, y, radius: 4, maxRadius: 35,
            width: 2, alpha: 0.4, color,
            speed: 80
        });
        this.emit(x, y, 4, color, {
            speedMin: 20, speedMax: 60,
            sizeMin: 1, sizeMax: 3,
            lifeMin: 200, lifeMax: 400,
            spread: Math.PI * 2,
            vyOffset: -10
        });
    }

    // Skin-specific text style config - faithfully reproduces block skin aesthetics
    _getTextSkinStyle(skinId, text, baseColor) {
        const styles = {
            neon: {
                color: `hsl(${(Date.now() / 50) % 360}, 100%, 60%)`,
                glowColor: 'rgba(255,0,255,0.6)',
                glowBlur: 14,
                strokeColor: 'rgba(0,0,0,0.8)',
                strokeWidth: 3,
                shadowColor: 'rgba(0,255,255,0.4)',
                shadowBlur: 10,
                // Extra neon scanlines behind text
                scanlines: true
            },
            candy: {
                color: baseColor,
                glowColor: 'rgba(255,200,100,0.5)',
                glowBlur: 12,
                strokeColor: 'rgba(0,0,0,0.3)',
                strokeWidth: 1,
                shadowColor: 'rgba(255,100,200,0.3)',
                shadowBlur: 8,
                // Draw confetti dots around text
                confetti: true
            },
            matrix: {
                color: '#00ff41',
                glowColor: 'rgba(0,255,65,0.7)',
                glowBlur: 8,
                strokeColor: 'rgba(0,30,0,0.8)',
                strokeWidth: 2,
                shadowColor: 'rgba(0,255,65,0.3)',
                shadowBlur: 4,
                // Matrix block-style: thick neon border outline, dark empty center
                hollow: true,
                hollowWidth: 1.5,
                // Block-style scanline across the text
                scanline: true,
                // Corner brackets
                brackets: true
            },
            golden: {
                color: '#ffd700',
                glowColor: 'rgba(255,215,0,0.5)',
                glowBlur: 8,
                strokeColor: 'rgba(80,40,0,0.6)',
                strokeWidth: 2,
                shadowColor: 'rgba(255,200,50,0.3)',
                shadowBlur: 6
            },
            crystal: {
                color: baseColor,
                glowColor: 'rgba(180,220,255,0.5)',
                glowBlur: 18,
                strokeColor: 'rgba(255,255,255,0.5)',
                strokeWidth: 1.5,
                shadowColor: 'rgba(200,230,255,0.4)',
                shadowBlur: 14,
                // Crystal sparkle overlay
                sparkle: true,
                // Double glow for glass refraction
                doubleGlow: true,
                // Prismatic edge tint
                prismatic: true
            },
            pastel: {
                color: `hsl(${(Date.now() / 80) % 360}, 60%, 72%)`,
                glowColor: 'rgba(255,220,200,0.5)',
                glowBlur: 10,
                strokeColor: 'rgba(255,240,230,0.5)',
                strokeWidth: 1.5,
                shadowColor: 'rgba(240,200,220,0.25)',
                shadowBlur: 5,
                softEdge: true
            }
        };
        return styles[skinId] || null;
    }

    // 浮动得分文字
    showFloatingText(x, y, text, color, size = 26, vy = -60, rotation = 0) {
        const skin = skinManager.getActiveSkinId();
        const skinStyle = this._getTextSkinStyle(skin, text, color);
        this.texts.push({
            x, y, text, color, size,
            alpha: 1, life: 900, maxLife: 900,
            vy,
            scale: 0.5,
            rotation,
            skin,
            skinStyle
        });
    }

    // 更新所有粒子状态
    update(dt) {
        const dtSec = dt / 1000;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dtSec;
            p.y += p.vy * dtSec;
            p.vy += p.gravity * dtSec;
            p.rotation += p.rotSpeed * dtSec;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.shrink) p.size *= (1 - dtSec * 0.5);
            if (p.life <= 0 || p.size < 0.3) this.particles.splice(i, 1);
        }

        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y += t.vy * dtSec;
            t.vy *= 0.95;
            t.life -= dt;
            t.alpha = Math.max(0, t.life / t.maxLife);
            t.scale = Math.min(1, t.scale + dtSec * 3);
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const s = this.shockwaves[i];
            s.radius += s.speed * dtSec;
            s.alpha = Math.max(0, s.alpha - dtSec * 1.5);
            s.width = Math.max(0.5, s.width - dtSec * 1.5);
            if (s.alpha <= 0 || s.radius >= s.maxRadius) this.shockwaves.splice(i, 1);
        }

    }


    // 渲染所有粒子
    render(ctx) {
        // 冲击波
        for (const s of this.shockwaves) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;
            ctx.globalAlpha = s.alpha * 0.6;
            ctx.stroke();
            ctx.globalAlpha = 1;
            if (s.radius > 10) {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius * 0.6, 0, Math.PI * 2);
                ctx.strokeStyle = s.color;
                ctx.lineWidth = s.width * 0.5;
                ctx.globalAlpha = s.alpha * 0.2;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        // 粒子
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.size * 2;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // 浮动文字
        for (const t of this.texts) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            const ss = t.skinStyle;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.translate(t.x, t.y);
            ctx.rotate(t.rotation * Math.PI / 180);
            ctx.scale(t.scale, t.scale);

            const tw = ctx.measureText ? ctx.measureText(t.text).width || (t.text.length * t.size * 0.6) : (t.text.length * t.size * 0.6);
            const th = t.size;

            if (ss) {
                ctx.font = `bold ${t.size}px 'Segoe UI', 'PingFang SC', sans-serif`;

                // --- Crystal: double glow + sparkle ---
                if (ss.doubleGlow) {
                    ctx.shadowColor = 'rgba(200,230,255,0.5)';
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.fillText(t.text, 2, 2);
                    ctx.shadowBlur = 0;
                }

                // --- Scanlines (neon) ---
                if (ss.scanlines) {
                    ctx.globalAlpha *= 0.08;
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    for (let sl = -th/2; sl < th/2; sl += 3) {
                        ctx.fillRect(-tw/2 - 4, sl, tw + 8, 1);
                    }
                    ctx.globalAlpha = t.alpha;
                }

                // --- Confetti dots (candy) ---
                if (ss.confetti) {
                    const dotColors = ['#ff9ff3','#feca57','#48dbfb','#ff6b6b','#5f27cd'];
                    ctx.globalAlpha *= 0.5;
                    for (let d = 0; d < 12; d++) {
                        const dx = (Math.sin(d * 3.7 + t.x) * tw * 0.7);
                        const dy = (Math.cos(d * 2.3 + t.y) * th * 0.6);
                        ctx.fillStyle = dotColors[d % dotColors.length];
                        ctx.fillRect(dx - 2, dy - 2, 4, 4);
                    }
                    ctx.globalAlpha = t.alpha;
                }

                // --- Corner brackets (matrix) ---
                if (ss.brackets) {
                    ctx.strokeStyle = 'rgba(0,255,65,0.3)';
                    ctx.lineWidth = 1.5;
                    const cp = 6;
                    // Top-left
                    ctx.beginPath(); ctx.moveTo(-tw/2 - 6, -th/2); ctx.lineTo(-tw/2 - 6, -th/2 - cp); ctx.lineTo(-tw/2 - 6 + cp, -th/2 - cp); ctx.stroke();
                    // Top-right
                    ctx.beginPath(); ctx.moveTo(tw/2 + 6, -th/2); ctx.lineTo(tw/2 + 6, -th/2 - cp); ctx.lineTo(tw/2 + 6 - cp, -th/2 - cp); ctx.stroke();
                    // Bottom-left
                    ctx.beginPath(); ctx.moveTo(-tw/2 - 6, th/2); ctx.lineTo(-tw/2 - 6, th/2 + cp); ctx.lineTo(-tw/2 - 6 + cp, th/2 + cp); ctx.stroke();
                    // Bottom-right
                    ctx.beginPath(); ctx.moveTo(tw/2 + 6, th/2); ctx.lineTo(tw/2 + 6, th/2 + cp); ctx.lineTo(tw/2 + 6 - cp, th/2 + cp); ctx.stroke();
                }

                // --- Outer glow ---
                ctx.shadowColor = ss.glowColor;
                ctx.shadowBlur = ss.glowBlur;

                if (ss.hollow) {
                    // Matrix block-style: thick neon border, dark center, scanline
                    const hw = ss.hollowWidth || 1.5;
                    // Dark hollow center
                    ctx.fillStyle = 'rgba(0,5,0,0.85)';
                    ctx.fillText(t.text, 0, 0);
                    // Outer glow
                    ctx.shadowColor = ss.glowColor;
                    ctx.shadowBlur = 8;
                    // Thick neon border outline
                    ctx.strokeStyle = ss.color;
                    ctx.lineWidth = hw + 1.5;
                    ctx.strokeText(t.text, 0, 0);
                    ctx.shadowBlur = 0;
                    // Bright inner edge
                    ctx.strokeStyle = `rgba(${Math.min(255,65+30)},255,${Math.min(255,65+20)},0.7)`;
                    ctx.lineWidth = hw;
                    ctx.strokeText(t.text, 0, 0);
                    // CRT scanline across middle
                    ctx.fillStyle = 'rgba(0,255,65,0.06)';
                    ctx.fillRect(-tw/2, -1, tw, 2);
                    // Scanning line animation
                    const scanY = (Date.now() / 120) % (th + 8) - th/2 - 4;
                    ctx.fillStyle = 'rgba(0,255,65,0.08)';
                    ctx.fillRect(-tw/2 - 2, scanY, tw + 4, 2);
                } else if (ss.prismatic) {
                    // Crystal: prismatic edge tint + semi-transparent glass fill
                    // Red-tinted glow offset
                    ctx.shadowColor = 'rgba(255,100,100,0.2)';
                    ctx.shadowBlur = 12;
                    ctx.fillStyle = 'rgba(255,255,255,0.08)';
                    ctx.fillText(t.text, -1, -1);
                    // Blue-tinted glow offset
                    ctx.shadowColor = 'rgba(100,150,255,0.3)';
                    ctx.fillStyle = 'rgba(200,230,255,0.12)';
                    ctx.fillText(t.text, 1, 1);
                    ctx.shadowBlur = 0;
                    // Main semi-transparent text
                    ctx.shadowColor = ss.glowColor;
                    ctx.shadowBlur = ss.glowBlur;
                    ctx.fillStyle = ss.color;
                    ctx.fillText(t.text, 0, 0);
                    ctx.shadowBlur = 0;
                    // Glass edge stroke
                    ctx.strokeStyle = ss.strokeColor;
                    ctx.lineWidth = ss.strokeWidth;
                    ctx.strokeText(t.text, 0, 0);
                    // Additional shadow
                    if (ss.shadowBlur > 0) {
                        ctx.shadowColor = ss.shadowColor;
                        ctx.shadowBlur = ss.shadowBlur;
                        ctx.fillText(t.text, 0, 0);
                    }
                } else {
                    // Normal fill + stroke
                    ctx.fillStyle = ss.color;
                    ctx.fillText(t.text, 0, 0);
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = ss.strokeColor;
                    ctx.lineWidth = ss.strokeWidth;
                    ctx.strokeText(t.text, 0, 0);
                    ctx.fillText(t.text, 0, 0);

                    if (ss.shadowBlur > 0) {
                        ctx.shadowColor = ss.shadowColor;
                        ctx.shadowBlur = ss.shadowBlur;
                        ctx.fillText(t.text, 0, 0);
                    }
                }
                ctx.shadowBlur = 0;

                // --- Sparkle overlay (crystal) - massively enhanced ---
                if (ss.sparkle) {
                    const sparkTime = Date.now() / 300;
                    // Draw 6 bright sparkle stars (was 3)
                    for (let s = 0; s < 6; s++) {
                        const phase = s * 1.047 + sparkTime;
                        const sx = Math.sin(phase + s * 0.5) * tw * 0.5;
                        const sy = Math.cos(phase * 1.2 + s * 0.3) * th * 0.45;
                        const sl = 4 + Math.sin(phase * 0.5 + s) * 4;
                        const sa = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(sparkTime * 1.5 + s * 2.1));
                        ctx.globalAlpha = t.alpha * sa * 0.8;
                        // Brighter white core
                        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(sx - sl - 1, sy); ctx.lineTo(sx + sl + 1, sy);
                        ctx.moveTo(sx, sy - sl - 1); ctx.lineTo(sx, sy + sl + 1);
                        ctx.stroke();
                        // Colored secondary sparkle
                        const hue = (s * 60 + sparkTime * 40) % 360;
                        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.6)`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(sx - sl * 0.7, sy - sl * 0.7); ctx.lineTo(sx + sl * 0.7, sy + sl * 0.7);
                        ctx.moveTo(sx + sl * 0.7, sy - sl * 0.7); ctx.lineTo(sx - sl * 0.7, sy + sl * 0.7);
                        ctx.stroke();
                    }
                    // Extra glitter particles around text
                    ctx.globalAlpha = t.alpha * 0.4;
                    for (let g = 0; g < 15; g++) {
                        const gp = g * 2.1 + sparkTime;
                        const gx = Math.sin(gp * 0.7 + g * 1.3) * tw * 0.7;
                        const gy = Math.cos(gp * 0.9 + g * 0.7) * th * 0.6;
                        const gs = 1 + Math.sin(gp + g) * 1;
                        const gc = `hsl(${(g * 45 + sparkTime * 60) % 360}, 100%, 75%)`;
                        ctx.fillStyle = gc;
                        ctx.fillRect(gx - gs/2, gy - gs/2, gs, gs);
                    }
                    ctx.globalAlpha = t.alpha;
                }

            } else {
                // Default text rendering (classic or unknown skin)
                ctx.font = `bold ${t.size}px 'Segoe UI', 'PingFang SC', sans-serif`;
                ctx.fillStyle = t.color;
                ctx.shadowColor = 'rgba(0,0,0,0.6)';
                ctx.shadowBlur = 6;
                ctx.fillText(t.text, 0, 0);
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                ctx.lineWidth = 2;
                ctx.strokeText(t.text, 0, 0);
            }
            ctx.restore();
        }
    }

    setGridColors(getColorFn) {
        this._getRowColor = getColorFn;
    }

    clear() {
        this.particles = [];
        this.texts = [];
        this.shockwaves = [];
    }
}