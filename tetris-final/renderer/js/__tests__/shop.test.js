/**
 * shop.js 单元测试
 *
 * 测试皮肤系统函数和商城数据定义的正确性。
 * applyBlockSkin 等函数在 Node 环境中直接修改全局 COLORS/COLOR_GLOW，
 * 这些全局变量由 jest.setup.js 从 constants.js 加载。
 */

const { applyBlockSkin, applyTrialSkin, clearTrialSkin, equipShopItem, SHOP_BLOCK_SKINS, SHOP_UI_SKINS, ownedItems, equippedItems } = require('../shop');

// ========== 商城数据完整性 ==========

describe('SHOP_BLOCK_SKINS', () => {
    test('所有条目包含必要字段', () => {
        SHOP_BLOCK_SKINS.forEach(item => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('desc');
            expect(item).toHaveProperty('icon');
            expect(item).toHaveProperty('price');
            expect(item).toHaveProperty('currency');
            expect(typeof item.id).toBe('string');
            expect(item.id.length).toBeGreaterThan(0);
        });
    });

    test('价格有效（>=0）', () => {
        SHOP_BLOCK_SKINS.forEach(item => {
            expect(item.price).toBeGreaterThanOrEqual(0);
        });
    });

    test('货币种类有效', () => {
        SHOP_BLOCK_SKINS.forEach(item => {
            expect(['gold', 'diamond']).toContain(item.currency);
        });
    });

    test('没有重复 id', () => {
        const ids = SHOP_BLOCK_SKINS.map(item => item.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('每种 BLOCK_SKIN_COLORS 定义的非纹理皮肤都在商城有售', () => {
        const shopIds = new Set(SHOP_BLOCK_SKINS.map(item => item.id));
        const definedIds = Object.keys(BLOCK_SKIN_COLORS);
        // custom 和 uploaded 是纹理皮肤，不在商城中手动上架也合理
        const expectedInShop = definedIds.filter(id => id !== 'custom' && id !== 'uploaded');
        expectedInShop.forEach(id => {
            expect(shopIds.has(id)).toBe(true);
        });
    });
});

describe('SHOP_UI_SKINS', () => {
    test('所有条目包含必要字段', () => {
        SHOP_UI_SKINS.forEach(item => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('price');
            expect(item).toHaveProperty('currency');
        });
    });

    test('价格有效', () => {
        SHOP_UI_SKINS.forEach(item => {
            expect(item.price).toBeGreaterThanOrEqual(0);
        });
    });

    test('货币种类有效', () => {
        SHOP_UI_SKINS.forEach(item => {
            expect(['gold', 'diamond']).toContain(item.currency);
        });
    });

    test('没有重复 id', () => {
        const ids = SHOP_UI_SKINS.map(item => item.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

// ========== applyBlockSkin 测试 ==========

describe('applyBlockSkin()', () => {
    const originalColors = { ...COLORS };
    const originalGlows = { ...COLOR_GLOW };

    afterEach(() => {
        // 每个测试后恢复经典色，避免测试间干扰
        applyBlockSkin('classic');
    });

    test('应用经典皮肤后颜色正确', () => {
        applyBlockSkin('classic');
        const classic = BLOCK_SKIN_COLORS.classic;
        for (const k of Object.keys(classic)) {
            expect(COLORS[k]).toBe(classic[k]);
        }
    });

    test('应用霓虹皮肤后颜色改变', () => {
        applyBlockSkin('neon');
        const neon = BLOCK_SKIN_COLORS.neon;
        for (const k of Object.keys(neon)) {
            expect(COLORS[k]).toBe(neon[k]);
        }
        // 验证霓虹色与经典色不同（至少检查 I 方块）
        expect(COLORS.I).toBe(neon.I);
        expect(COLORS.I).not.toBe(BLOCK_SKIN_COLORS.classic.I);
    });

    test('应用黄金皮肤后颜色正确', () => {
        applyBlockSkin('golden');
        const golden = BLOCK_SKIN_COLORS.golden;
        for (const k of Object.keys(golden)) {
            expect(COLORS[k]).toBe(golden[k]);
        }
    });

    test('应用彩虹皮肤后颜色正确', () => {
        applyBlockSkin('rainbow');
        const rainbow = BLOCK_SKIN_COLORS.rainbow;
        for (const k of Object.keys(rainbow)) {
            expect(COLORS[k]).toBe(rainbow[k]);
        }
    });

    test('应用未知皮肤 ID 回退到经典色', () => {
        applyBlockSkin('nonexistent_skin_123');
        const classic = BLOCK_SKIN_COLORS.classic;
        for (const k of Object.keys(classic)) {
            expect(COLORS[k]).toBe(classic[k]);
        }
    });

    test('GLOW 值同步更新', () => {
        applyBlockSkin('neon');
        const glows = BLOCK_SKIN_GLOWS.neon;
        for (const k of Object.keys(glows)) {
            expect(COLOR_GLOW[k]).toBe(glows[k]);
        }
    });

    test('经典色恢复后 GLOW 值正确', () => {
        applyBlockSkin('neon');      // 先设成霓虹
        applyBlockSkin('classic');   // 再恢复经典
        const classicGlows = BLOCK_SKIN_GLOWS.classic;
        for (const k of Object.keys(classicGlows)) {
            expect(COLOR_GLOW[k]).toBe(classicGlows[k]);
        }
    });

    test('每种皮肤都有 X 回退色', () => {
        for (const [id, colors] of Object.entries(BLOCK_SKIN_COLORS)) {
            expect(colors).toHaveProperty('X');
        }
        for (const [id, glows] of Object.entries(BLOCK_SKIN_GLOWS)) {
            expect(glows).toHaveProperty('X');
        }
    });
});

// ========== 默认装备状态 ==========

describe('equippedItems defaults', () => {
    test('初始装备方块皮肤为 classic', () => {
        expect(equippedItems.block).toBe('classic');
    });

    test('初始装备 UI 皮肤为 classic', () => {
        expect(equippedItems.ui).toBe('classic');
    });
});

describe('ownedItems defaults', () => {
    test('classic 方块皮肤默认已拥有', () => {
        expect(ownedItems['block:classic']).toBe(true);
    });

    test('classic UI 皮肤默认已拥有', () => {
        expect(ownedItems['ui:classic']).toBe(true);
    });

    test('uploaded 皮肤默认已拥有', () => {
        expect(ownedItems['blocks:uploaded']).toBe(true);
    });
});

// ========== 常量对照 ==========

describe('BLOCK_SKIN_COLORS vs SHOP_BLOCK_SKINS', () => {
    test('BLOCK_SKIN_COLORS 中每种皮肤在商城有对应条目', () => {
        const shopIds = new Set(SHOP_BLOCK_SKINS.map(item => item.id));
        for (const skinId of Object.keys(BLOCK_SKIN_COLORS)) {
            // custom 和 uploaded 是纹理皮肤，通过上传功能获取
            if (skinId === 'custom' || skinId === 'uploaded') continue;
            expect(shopIds.has(skinId)).toBe(true);
        }
    });

    test('商城方块皮肤名字不重复', () => {
        const names = SHOP_BLOCK_SKINS.map(item => item.name);
        expect(new Set(names).size).toBe(names.length);
    });

    test('免费皮肤（id=classic）价格为 0', () => {
        const classic = SHOP_BLOCK_SKINS.find(item => item.id === 'classic');
        expect(classic).toBeDefined();
        expect(classic.price).toBe(0);
    });
});
