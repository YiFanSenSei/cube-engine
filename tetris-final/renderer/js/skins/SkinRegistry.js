// ===== 皮肤注册表 =====
// 集中注册所有方块皮肤到 SkinManager，在 main.js 前加载

function registerAllSkins() {
    skinManager.register('classic', new BaseSkin()); // 使用基类默认渲染
    skinManager.register('neon', new NeonSkin());
    skinManager.register('candy', new CandySkin());
    skinManager.register('matrix', new MatrixSkin());
    skinManager.register('golden', new GoldenSkin());
    skinManager.register('crystal', new CrystalSkin());
    skinManager.register('pastel', new BaseSkin());   // pastel 使用经典渲染
    skinManager.register('custom', new CustomTextureSkin());
    skinManager.register('uploaded', new CustomTextureSkin());
}