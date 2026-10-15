/**
 * account.js 单元测试
 *
 * 测试账户系统中不依赖 DOM 和 nativeAPI 的函数（纯逻辑）。
 */

const { getStorageKey, getCurrentUser, setCurrentUser } = require('../account');

describe('getStorageKey()', () => {
    beforeEach(() => {
        // 清除 currentUser 状态（通过设置空字符串）
        setCurrentUser('');
    });

    test('游客模式返回 tetris_游客_ 前缀', () => {
        setCurrentUser('');
        const key = getStorageKey('theme');
        expect(key).toBe('tetris_游客_theme');
    });

    test('已登录用户返回正确前缀', () => {
        setCurrentUser('张三');
        const key = getStorageKey('custom_bg');
        expect(key).toBe('tetris_张三_custom_bg');
    });

    test('拼接任意键名', () => {
        setCurrentUser('test_user');
        expect(getStorageKey('achievements')).toBe('tetris_test_user_achievements');
        expect(getStorageKey('shop')).toBe('tetris_test_user_shop');
        expect(getStorageKey('leaderboard')).toBe('tetris_test_user_leaderboard');
    });

    test('用户名含特殊字符时正常工作', () => {
        setCurrentUser('user_123-abc');
        expect(getStorageKey('data')).toBe('tetris_user_123-abc_data');
    });
});

describe('getCurrentUser() / setCurrentUser()', () => {
    test('初始用户名为空', () => {
        setCurrentUser('');
        expect(getCurrentUser()).toBe('');
    });

    test('设置后能正确读取', () => {
        setCurrentUser('李四');
        expect(getCurrentUser()).toBe('李四');
    });

    test('多次切换用户名', () => {
        setCurrentUser('Alice');
        expect(getCurrentUser()).toBe('Alice');
        setCurrentUser('Bob');
        expect(getCurrentUser()).toBe('Bob');
        setCurrentUser('');
        expect(getCurrentUser()).toBe('');
    });
});
