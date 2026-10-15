// Jest 测试配置
module.exports = {
    testEnvironment: 'node',
    rootDir: '.',
    setupFiles: ['<rootDir>/jest.setup.js'],
    testMatch: [
        '<rootDir>/renderer/js/__tests__/**/*.test.js'
    ],
    verbose: true,
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
        'renderer/js/constants.js',
        'renderer/js/account.js',
        'renderer/js/shop.js',
        'renderer/js/game_proxy.js',
        '!**/node_modules/**'
    ]
};
