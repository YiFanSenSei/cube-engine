// ===== 黑客帝国皮肤 =====
class MatrixSkin extends BaseSkin {
    drawBlock(ctx, x, y, color, glow, alpha, cell) {
        if (alpha <= 0.5) { this._drawDefault(ctx, x, y, color, glow, alpha, cell); return; }
        const { r: baseR, g: baseG, b: baseB } = this._parseColor(color);
        const px = x * cell, py = y * cell, pad = 1, sz = cell - pad * 2;

        const codeChars = ['0','1','0','1','ㄒ','ム','░','█','│','─','┌','┐','┘','└','@','#'];
        const charIdx = (x * 13 + y * 7 + Math.floor(Date.now() / 400)) % codeChars.length;
        const codeChar = codeChars[charIdx];
        const nextChar = codeChars[(charIdx + 1) % codeChars.length];

        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * 0.08;
        ctx.fillRect(px + pad, py + pad, sz, sz);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = alpha;

        ctx.fillStyle = `rgba(0,5,0,0.6)`;
        ctx.fillRect(px + pad, py + pad, sz, sz);

        const borderGlow = Math.sin(Date.now() / 600 + x * 0.5 + y * 1.3) * 0.15 + 0.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = `rgba(${Math.min(255,baseR+30)},${Math.min(255,baseG+30)},${Math.min(255,baseB+30)},${0.6 + borderGlow * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + pad + 0.5, py + pad + 0.5, sz - 1, sz - 1);
        ctx.shadowBlur = 0;

        const scanY = (Date.now() / 80 + y * 20) % (sz - 4);
        ctx.fillStyle = `rgba(0,255,65,0.08)`;
        ctx.fillRect(px + pad + 2, py + pad + 2 + scanY, sz - 4, 2);

        const charPhase = Math.sin(Date.now() / 300 + x * 3 + y * 7) * 0.5 + 0.5;
        ctx.font = '11px "Consolas","Courier New",monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.fillStyle = `rgba(${Math.min(255,baseR+20)},${Math.min(255,baseG+40)},${Math.min(255,baseB+20)},${0.5 + charPhase * 0.4})`;
        ctx.fillText(codeChar, px + sz/2 + 0.5, py + sz/2 + 0.5);
        if(charPhase > 0.7){
            ctx.fillStyle = `rgba(${Math.min(255,baseR+60)},255,${Math.min(255,baseB+60)},0.2)`;
            ctx.fillText(nextChar, px + sz/2 - 1, py + sz/2 + 1);
        }
        ctx.shadowBlur = 0;

        ctx.strokeStyle = `rgba(0,255,65,${0.15 + charPhase * 0.1})`;
        ctx.lineWidth = 0.5;
        const cp = 3;
        ctx.beginPath(); ctx.moveTo(px + pad + 2, py + pad + 2 + cp); ctx.lineTo(px + pad + 2, py + pad + 2); ctx.lineTo(px + pad + 2 + cp, py + pad + 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + sz - 2 - cp, py + pad + 2); ctx.lineTo(px + sz - 2, py + pad + 2); ctx.lineTo(px + sz - 2, py + pad + 2 + cp); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + pad + 2, py + sz - 2 - cp); ctx.lineTo(px + pad + 2, py + sz - 2); ctx.lineTo(px + pad + 2 + cp, py + sz - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + sz - 2 - cp, py + sz - 2); ctx.lineTo(px + sz - 2, py + sz - 2); ctx.lineTo(px + sz - 2, py + sz - 2 - cp); ctx.stroke();
    }
}