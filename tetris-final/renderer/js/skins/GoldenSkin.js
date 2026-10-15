// ===== 黄金皮肤 =====
class GoldenSkin extends BaseSkin {
    drawBlock(ctx, x, y, color, glow, alpha, cell) {
        if (alpha <= 0.5) { this._drawDefault(ctx, x, y, color, glow, alpha, cell); return; }
        const { r: baseR, g: baseG, b: baseB } = this._parseColor(color);
        const px = x * cell, py = y * cell, pad = 1, sz = cell - pad * 2;

        ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        const darkR = Math.max(0, Math.floor(baseR * 0.4));
        const darkG = Math.max(0, Math.floor(baseG * 0.4));
        const darkB = Math.max(0, Math.floor(baseB * 0.3));
        const mortarColor = `rgba(${darkR},${darkG},${darkB},0.5)`;
        ctx.strokeStyle = mortarColor;
        ctx.lineWidth = 1.2;
        const my1 = py + pad + sz * 0.5;
        ctx.beginPath(); ctx.moveTo(px + pad, my1); ctx.lineTo(px + sz, my1); ctx.stroke();

        const brickPhase = Math.floor(x * 2 + y) % 2;
        const vPos = px + pad + sz * (brickPhase ? 0.6 : 0.4);
        ctx.beginPath(); ctx.moveTo(vPos, py + pad); ctx.lineTo(vPos, py + pad + sz * 0.5); ctx.stroke();
        const vPos2 = px + pad + sz * (brickPhase ? 0.4 : 0.6);
        ctx.beginPath(); ctx.moveTo(vPos2, py + pad + sz * 0.5); ctx.lineTo(vPos2, py + pad + sz); ctx.stroke();

        ctx.shadowColor = `rgba(${Math.min(255,baseR-30)},${Math.min(255,baseG-30)},${Math.min(255,baseB-20)},0.15)`;
        ctx.shadowBlur = 2;
        ctx.strokeRect(px + pad, py + pad, sz - 1, sz - 1);
        ctx.shadowBlur = 0;

        const broadGlow = ctx.createRadialGradient(px + pad + 2, py + pad + 2, 0, px + pad + 2, py + pad + 2, sz * 0.6);
        broadGlow.addColorStop(0, `rgba(${Math.min(255,baseR+80)},${Math.min(255,baseG+80)},${Math.min(255,baseB+20)},0.35)`);
        broadGlow.addColorStop(0.3, `rgba(${Math.min(255,baseR+50)},${Math.min(255,baseG+50)},${Math.min(255,baseB+10)},0.12)`);
        broadGlow.addColorStop(0.7, `rgba(${baseR},${baseG},${baseB},0.04)`);
        broadGlow.addColorStop(1, `rgba(${baseR},${baseG},${baseB},0)`);
        ctx.fillStyle = broadGlow;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        const broadGlow2 = ctx.createRadialGradient(px + sz - 2, py + sz - 2, 0, px + sz - 2, py + sz - 2, sz * 0.5);
        broadGlow2.addColorStop(0, `rgba(${Math.min(255,baseR+40)},${Math.min(255,baseG+40)},${Math.min(255,baseB+10)},0.15)`);
        broadGlow2.addColorStop(1, `rgba(${baseR},${baseG},${baseB},0)`);
        ctx.fillStyle = broadGlow2;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        const g1 = ctx.createRadialGradient(px + pad + 3, py + pad + 3, 0, px + pad + 3, py + pad + 3, 7);
        g1.addColorStop(0, `rgba(255,255,220,0.85)`);
        g1.addColorStop(0.3, `rgba(255,240,150,0.3)`);
        g1.addColorStop(1, `rgba(255,200,50,0)`);
        ctx.fillStyle = g1;
        ctx.fillRect(px + pad - 3, py + pad - 3, 14, 14);

        const g2 = ctx.createRadialGradient(px + sz * 0.35, py + pad + 1, 0, px + sz * 0.35, py + pad + 1, 5);
        g2.addColorStop(0, `rgba(255,255,200,0.6)`);
        g2.addColorStop(0.5, `rgba(255,230,120,0.15)`);
        g2.addColorStop(1, `rgba(255,200,50,0)`);
        ctx.fillStyle = g2;
        ctx.fillRect(px + sz * 0.35 - 5, py + pad - 3, 10, 10);

        const g3 = ctx.createRadialGradient(px + pad + 1, py + sz * 0.3, 0, px + pad + 1, py + sz * 0.3, 4);
        g3.addColorStop(0, `rgba(255,240,170,0.5)`);
        g3.addColorStop(1, `rgba(255,200,50,0)`);
        ctx.fillStyle = g3;
        ctx.fillRect(px + pad - 3, py + sz * 0.3 - 4, 8, 8);

        const g4 = ctx.createRadialGradient(px + sz - 4, py + sz - 4, 0, px + sz - 4, py + sz - 4, 5);
        g4.addColorStop(0, `rgba(255,220,120,0.4)`);
        g4.addColorStop(1, `rgba(255,180,50,0)`);
        ctx.fillStyle = g4;
        ctx.fillRect(px + sz - 9, py + sz - 9, 10, 10);

        ctx.fillStyle = `rgba(${Math.min(255,baseR+60)},${Math.min(255,baseG+60)},${Math.min(255,baseB+15)},0.2)`;
        ctx.fillRect(px + pad, py + pad, sz, 1.5);
        ctx.fillRect(px + pad, py + pad, 1.5, sz);
    }
}