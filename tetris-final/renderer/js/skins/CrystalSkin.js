// ===== 水晶皮肤 =====
class CrystalSkin extends BaseSkin {
    drawBlock(ctx, x, y, color, glow, alpha, cell) {
        if (alpha <= 0.5) { this._drawDefault(ctx, x, y, color, glow, alpha, cell); return; }
        const { r: baseR, g: baseG, b: baseB } = this._parseColor(color);
        const px = x * cell, py = y * cell, pad = 1, sz = cell - pad * 2;

        const grad = ctx.createLinearGradient(px + pad, py + pad, px + sz, py + sz);
        const tl = `rgba(${Math.min(255,baseR+60)},${Math.min(255,baseG+60)},${Math.min(255,baseB+60)},0.55)`;
        const mm = `rgba(${baseR},${baseG},${baseB},0.35)`;
        const br = `rgba(${Math.max(0,baseR-30)},${Math.max(0,baseG-30)},${Math.max(0,baseB-30)},0.50)`;
        grad.addColorStop(0, tl);
        grad.addColorStop(0.4, mm);
        grad.addColorStop(0.7, `rgba(${Math.min(255,baseR+20)},${Math.min(255,baseG+20)},${Math.min(255,baseB+30)},0.30)`);
        grad.addColorStop(1, br);
        ctx.fillStyle = grad;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        ctx.shadowColor = `rgba(${baseR},${baseG},${baseB},0.3)`;
        ctx.shadowBlur = 4;
        ctx.strokeStyle = `rgba(255,255,255,0.15)`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + pad + 0.5, py + pad + 0.5, sz - 1, sz - 1);
        ctx.shadowBlur = 0;

        const shineGrad = ctx.createLinearGradient(px + pad, py + pad, px + sz * 1.2, py + sz * 0.3);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.45)');
        shineGrad.addColorStop(0.3, 'rgba(255,255,255,0.12)');
        shineGrad.addColorStop(0.6, 'rgba(255,255,255,0.02)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.moveTo(px + pad, py + pad);
        ctx.lineTo(px + sz * 0.6, py + pad);
        ctx.lineTo(px + pad, py + sz * 0.6);
        ctx.closePath();
        ctx.fill();

        const brShine = ctx.createLinearGradient(px + sz, py + sz, px + sz * 0.4, py + sz * 0.7);
        brShine.addColorStop(0, 'rgba(255,255,255,0.08)');
        brShine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = brShine;
        ctx.beginPath();
        ctx.moveTo(px + sz, py + sz);
        ctx.lineTo(px + sz * 0.5, py + sz);
        ctx.lineTo(px + sz, py + sz * 0.5);
        ctx.closePath();
        ctx.fill();

        const spot = ctx.createRadialGradient(px + pad + 4, py + pad + 4, 1, px + pad + 4, py + pad + 4, 8);
        spot.addColorStop(0, 'rgba(255,255,255,0.7)');
        spot.addColorStop(0.4, 'rgba(255,255,255,0.2)');
        spot.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = spot;
        ctx.fillRect(px + pad - 2, py + pad - 2, 16, 16);

        const sparkleSeed = (x * 7 + y * 13) % 5;
        const sparkleTime = Date.now() / 1000;
        const phase = sparkleSeed * 1.256;
        const sparkleBright = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(sparkleTime * 1.5 + phase));
        if(sparkleBright > 0.55){
            const cx = px + sz/2, cy = py + sz/2;
            const sparkleSize = 3 + sparkleBright * 3;
            ctx.strokeStyle = `rgba(255,255,255,${0.3 * sparkleBright})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - sparkleSize, cy);
            ctx.lineTo(cx + sparkleSize, cy);
            ctx.moveTo(cx, cy - sparkleSize);
            ctx.lineTo(cx, cy + sparkleSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - sparkleSize * 0.6, cy - sparkleSize * 0.6);
            ctx.lineTo(cx + sparkleSize * 0.6, cy + sparkleSize * 0.6);
            ctx.moveTo(cx + sparkleSize * 0.6, cy - sparkleSize * 0.6);
            ctx.lineTo(cx - sparkleSize * 0.6, cy + sparkleSize * 0.6);
            ctx.stroke();
        }
    }
}