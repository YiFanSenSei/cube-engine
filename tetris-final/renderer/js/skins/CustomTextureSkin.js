// ===== 自定义纹理皮肤 =====
// 处理 'custom' 和 'uploaded' 两种自定义纹理皮肤
class CustomTextureSkin extends BaseSkin {
    drawBlock(ctx, x, y, color, glow, alpha, cell) {
        if (alpha <= 0.5) { this._drawDefault(ctx, x, y, color, glow, alpha, cell); return; }
        const px = x * cell, py = y * cell, pad = 1, sz = cell - pad * 2;

        if (textureSkinActive && customTexturePattern) {
            ctx.fillStyle = customTexturePattern;
            ctx.fillRect(px + pad, py + pad, sz, sz);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(px + pad, py + pad, sz, 3);
            ctx.fillRect(px + pad, py + pad, 3, sz);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(px + pad, py + sz - 3, sz, 3);
            ctx.fillRect(px + sz - 3, py + pad, 3, sz);
            if(glow && alpha > 0.8){
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 6;
                ctx.fillStyle = 'transparent';
                ctx.fillRect(px + pad, py + pad, sz, sz);
                ctx.shadowBlur = 0;
            }
        } else {
            // 纹理未加载时回退到经典
            this._drawDefault(ctx, x, y, color, glow, alpha, cell);
        }
    }
}