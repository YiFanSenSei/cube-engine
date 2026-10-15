// ===== 霓虹灯皮肤 =====
class NeonSkin extends BaseSkin {
    drawBlock(ctx, x, y, color, glow, alpha, cell) {
        if (alpha <= 0.5) { this._drawDefault(ctx, x, y, color, glow, alpha, cell); return; }
        const { r: baseR, g: baseG, b: baseB } = this._parseColor(color);
        const px = x * cell, py = y * cell, pad = 1, sz = cell - pad * 2;

        // Subtle accent color per block position
        const accentIdx = (x * 3 + y * 7) % 7;
        const accentPairs = [
            [[255,0,255],[0,200,255]],  [[0,200,255],[255,255,0]],
            [[255,255,0],[255,0,128]],  [[255,0,128],[0,255,128]],
            [[0,255,128],[128,0,255]],  [[128,0,255],[255,128,0]],
            [[255,128,0],[255,0,255]]
        ];
        const [acc1, acc2] = accentPairs[accentIdx];

        // 1. Outer glow (bloom)
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * 0.18;
        ctx.fillRect(px, py, sz + 2, sz + 2);
        ctx.shadowBlur = 28;
        ctx.fillStyle = 'transparent';
        ctx.fillRect(px + pad, py + pad, 1, 1);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = alpha;

        // 2. Solid core with gradient
        const coreGrad = ctx.createLinearGradient(px + pad, py + pad, px + sz, py + sz);
        coreGrad.addColorStop(0, `rgba(${Math.min(255,baseR+40)},${Math.min(255,baseG+40)},${Math.min(255,baseB+40)},0.95)`);
        coreGrad.addColorStop(0.5, `rgba(${baseR},${baseG},${baseB},0.90)`);
        coreGrad.addColorStop(1, `rgba(${Math.max(0,baseR-20)},${Math.max(0,baseG-20)},${Math.max(0,baseB-20)},0.85)`);
        ctx.fillStyle = coreGrad;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        // 3. Accent color bleeding
        const bleedGrad = ctx.createRadialGradient(px + pad + 2, py + pad + 2, 1, px + pad, py + pad, sz * 0.7);
        bleedGrad.addColorStop(0, `rgba(${acc1[0]},${acc1[1]},${acc1[2]},0.30)`);
        bleedGrad.addColorStop(0.4, `rgba(${acc2[0]},${acc2[1]},${acc2[2]},0.12)`);
        bleedGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bleedGrad;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        const bleed2 = ctx.createRadialGradient(px + sz - 2, py + sz - 2, 1, px + sz - 2, py + sz - 2, sz * 0.6);
        bleed2.addColorStop(0, `rgba(${acc2[0]},${acc2[1]},${acc2[2]},0.20)`);
        bleed2.addColorStop(0.6, `rgba(${acc1[0]},${acc1[1]},${acc1[2]},0.06)`);
        bleed2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bleed2;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        // 4. Warm center glow
        const centerGlow = ctx.createRadialGradient(px + sz * 0.4, py + sz * 0.35, 1, px + sz * 0.4, py + sz * 0.35, sz * 0.5);
        centerGlow.addColorStop(0, `rgba(${Math.min(255,baseR+60)},${Math.min(255,baseG+60)},${Math.min(255,baseB+60)},0.35)`);
        centerGlow.addColorStop(0.3, 'rgba(255,255,255,0.12)');
        centerGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = centerGlow;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        // 5. Chromatic edge highlight
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgba(${acc1[0]},${acc1[1]},${acc1[2]},0.25)`;
        ctx.fillRect(px + pad - 1, py + pad - 1, sz + 2, 2);
        ctx.fillRect(px + pad - 1, py + pad, 2, sz);
        ctx.fillStyle = `rgba(${acc2[0]},${acc2[1]},${acc2[2]},0.20)`;
        ctx.fillRect(px + sz - 2, py + pad, 2, sz);
        ctx.fillRect(px + pad, py + sz - 2, sz, 2);
        ctx.fillStyle = `rgba(${acc1[0]},${acc1[1]},${acc1[2]},0.12)`;
        ctx.fillRect(px + sz - 2, py + pad - 1, 2, 2);
        ctx.fillStyle = `rgba(${acc2[0]},${acc2[1]},${acc2[2]},0.12)`;
        ctx.fillRect(px + pad - 1, py + sz - 2, 2, 2);
    }
}