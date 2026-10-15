// ===== 糖果皮肤 =====
class CandySkin extends BaseSkin {
    drawBlock(ctx, x, y, color, glow, alpha, cell) {
        if (alpha <= 0.5) { this._drawDefault(ctx, x, y, color, glow, alpha, cell); return; }
        const { r: baseR, g: baseG, b: baseB } = this._parseColor(color);
        const px = x * cell, py = y * cell, pad = 1, sz = cell - pad * 2;

        ctx.fillStyle = color;
        ctx.fillRect(px + pad, py + pad, sz, sz);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(px + pad, py + pad, sz, 3);
        ctx.fillRect(px + pad, py + pad, 3, sz);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(px + pad, py + sz - 3, sz, 3);
        ctx.fillRect(px + sz - 3, py + pad, 3, sz);
        if(glow && alpha > 0.8){
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = 'transparent';
            ctx.fillRect(px + pad, py + pad, sz, sz);
            ctx.shadowBlur = 0;
        }

        const seed = x * 7 + y * 13;
        const dotCount = 4 + (seed % 3);
        const palettes = [
            [[255,200,80],[255,120,180],[120,200,255],[100,255,160],[255,160,60]],
            [[255,100,150],[180,255,80],[160,120,255],[255,200,60],[80,220,255]],
            [[200,220,255],[255,180,100],[180,255,160],[255,100,200],[100,200,255]],
            [[255,160,80],[120,255,200],[255,120,220],[200,180,255],[80,255,180]],
            [[180,255,120],[255,140,180],[120,200,255],[255,200,100],[200,120,255]],
            [[255,200,120],[160,255,180],[200,120,255],[120,220,255],[255,160,100]],
            [[200,255,120],[255,140,200],[120,200,255],[255,180,80],[160,255,220]]
        ];
        const palette = palettes[(seed % 7)];
        const dotSize = 3;
        for(let i = 0; i < dotCount; i++){
            const pxOff = ((seed * 3 + i * 11) % (sz - dotSize * 2 - 2)) + 3;
            const pyOff = ((seed * 7 + i * 13 + Math.floor(x * y)) % (sz - dotSize * 2 - 2)) + 3;
            const colIdx = (seed + i) % palette.length;
            const [dr, dg, db] = palette[colIdx];
            ctx.fillStyle = `rgba(${dr},${dg},${db},0.7)`;
            ctx.fillRect(px + pad + pxOff, py + pad + pyOff, dotSize, dotSize);
            ctx.fillStyle = `rgba(${Math.min(255,dr+40)},${Math.min(255,dg+40)},${Math.min(255,db+40)},0.3)`;
            ctx.fillRect(px + pad + pxOff, py + pad + pyOff, dotSize, 1);
        }
    }
}