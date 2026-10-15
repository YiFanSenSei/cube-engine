/**
 * constants.js 单元测试
 *
 * 测试工具函数 rotateCW 和 shuffle 的正确性，
 * 以及关键常量定义的有效性。
 */

const { rotateCW, shuffle, COLS, ROWS, SHAPES, PIECE_NAMES, THEMES } = require('../constants');

// ========== 常量测试 ==========

describe('Grid 常量', () => {
    test('COLS = 10', () => {
        expect(COLS).toBe(10);
    });

    test('ROWS = 20', () => {
        expect(ROWS).toBe(20);
    });
});

describe('方块定义', () => {
    test('有 7 种标准方块', () => {
        expect(PIECE_NAMES.length).toBe(7);
        expect(PIECE_NAMES).toEqual(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });

    test('SHAPES 包含所有 7 种方块', () => {
        PIECE_NAMES.forEach(name => {
            expect(SHAPES).toHaveProperty(name);
        });
    });

    test('所有方块的形状只包含 0 或 1', () => {
        for (const [name, shape] of Object.entries(SHAPES)) {
            for (const row of shape) {
                for (const cell of row) {
                    expect(cell === 0 || cell === 1).toBe(true);
                }
            }
        }
    });

    test('每种方块至少有一个填色格子', () => {
        for (const [name, shape] of Object.entries(SHAPES)) {
            const hasBlock = shape.some(row => row.some(cell => cell === 1));
            expect(hasBlock).toBe(true);
        }
    });
});

describe('主题定义', () => {
    test('有 5 种 UI 主题', () => {
        expect(THEMES.length).toBe(5);
    });

    test('每种主题有 id、name、dot 属性', () => {
        THEMES.forEach(theme => {
            expect(theme).toHaveProperty('id');
            expect(theme).toHaveProperty('name');
            expect(theme).toHaveProperty('dot');
        });
    });

    test('classic 主题是第一个', () => {
        expect(THEMES[0].id).toBe('classic');
        expect(THEMES[0].name).toBe('经典黄');
    });
});

// ========== rotateCW 测试 ==========

describe('rotateCW()', () => {
    test('I 方块旋转：1x4 → 4x1', () => {
        const iShape = SHAPES['I'];
        expect(iShape.length).toBe(1);
        expect(iShape[0].length).toBe(4);

        const rotated = rotateCW(iShape);
        expect(rotated.length).toBe(4);
        expect(rotated[0].length).toBe(1);
    });

    test('O 方块旋转后不变', () => {
        const oShape = SHAPES['O'];
        const rotated = rotateCW(oShape);
        expect(rotated).toEqual(oShape);
    });

    test('连续旋转四次回到原始形状', () => {
        const original = SHAPES['T'];
        let rotated = rotateCW(original);
        rotated = rotateCW(rotated);
        rotated = rotateCW(rotated);
        rotated = rotateCW(rotated);
        expect(rotated).toEqual(original);
    });

    test('T 方块旋转一次形状正确', () => {
        const tShape = SHAPES['T'];
        // T: [[0,1,0],[1,1,1]] 顺时针旋转90° → [[1,0],[1,1],[1,0]]
        const rotated = rotateCW(tShape);
        expect(rotated).toEqual([
            [1, 0],
            [1, 1],
            [1, 0]
        ]);
    });

    test('S 方块旋转不丢失方块', () => {
        const sShape = SHAPES['S'];
        const rotated = rotateCW(sShape);
        // S 有 4 个格子，旋转后也应该有 4 个
        const countBlocks = shape => shape.reduce((sum, row) => sum + row.reduce((s, c) => s + c, 0), 0);
        expect(countBlocks(rotated)).toBe(4);
    });
});

// ========== shuffle 测试 ==========

describe('shuffle()', () => {
    test('不改变数组长度', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = shuffle([...arr]);
        expect(result.length).toBe(arr.length);
    });

    test('包含相同的元素（重排列）', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = shuffle([...arr]);
        expect(result.sort()).toEqual(arr);
    });

    test('空数组返回空数组', () => {
        expect(shuffle([])).toEqual([]);
    });

    test('单元素数组不变', () => {
        expect(shuffle([42])).toEqual([42]);
    });
});
