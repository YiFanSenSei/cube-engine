# Cube Engine 项目 - Agent 指南

## 项目概述

基于 Electron + C++ 的方块游戏，包含：

| 组件 | 技术栈 | 说明 |
|------|--------|------|
| **桌面客户端** | Electron + Node.js + C++ (node-gyp) | 游戏主界面，通过原生插件调用游戏引擎 |
| **后端 API 服务器** | C++17 + Winsock/POSIX sockets | 独立的 RESTful HTTP 服务器，端口 8080 |
| **游戏引擎** | C++17 (原生) | 核心游戏逻辑，同时被 node-gyp 和后端使用 |
| **前端 UI** | 原生 JavaScript + HTML + CSS | 无框架渲染器 |

## 测试体系

### 1. C++ 单元测试（Google Test）

**位置：** `tests/test_tetris_core.cpp`（18 个测试用例）

```bash
# 运行方式
cd tests
cmake -B build
cmake --build build
./build/tetris_test
```

**测试内容：**
- `RotationTests` — 7 种方块的顺时针旋转
- `MovementTests` — 左右碰撞、墙壁碰撞、堆叠碰撞、向下移动
- `LineClearingTests` — 满行消除、得分计算
- `GameOverTests` — 方块堆到顶部触发游戏结束
- `DifficultyTests` — 难度等级约束验证
- `HardDropTests` — 硬降功能正确性

### 2. Jest JavaScript 单元测试

**位置：** `renderer/js/__tests__/`（25 个测试用例）

```bash
npm test          # 运行所有测试
npm run test:watch  # 监听模式
```

**配置文件：** `jest.config.js`
- 环境: node
- 覆盖率收集: constants.js, account.js
- Mock 设置: `jest.setup.js`（模拟 Electron nativeAPI）

**测试内容：**
- `constants.test.js` — rotateCW()、shuffle()、网格常量、方块定义、主题定义
- `account.test.js` — getStorageKey()、getCurrentUser()、setCurrentUser()

### 3. ESLint 代码质量检查

```bash
eslint renderer/js/
```

**配置：** `.eslintrc.json`（9 条规则，40+ 全局声明）

### 4. Swagger API 测试

**位置：** `back_end/swagger/index.html`

启动后端服务器后，在浏览器打开可直接交互式测试全部 11 个 API 端点。

### 5. JMeter 性能测试

**位置：** `tests/jmeter/TetrisAPI_LoadTest.jmx`

包含 4 个测试场景：

| 场景 | 用户数 | 持续时间 | 说明 |
|------|--------|----------|------|
| 健康检查与认证 | 1 | 单次 | 确认服务器工作和用户注册/登录流程 |
| 游戏会话生命周期 | 5 | 单次 | 完整游戏流程（init→操作→hardDrop→reset） |
| 高强度并发压力 | 20 | 60s | 密集随机操作，测试服务器吞吐量 |
| 错误路径测试 | 1 | 单次 | 无效 gameId、空用户名、错误密码 |

```bash
# 运行方式（需要安装 JMeter）
jmeter -n -t tests/jmeter/TetrisAPI_LoadTest.jmx -l results.jtl
```

### 6. API 端点清单（共 11 个）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/game/init` | 初始化游戏会话 |
| POST | `/api/game/move` | 移动方块 |
| POST | `/api/game/rotate` | 旋转方块 |
| POST | `/api/game/hardDrop` | 硬降 |
| POST | `/api/game/state` | 查询游戏状态 |
| POST | `/api/game/update` | 更新游戏（时间推进） |
| POST | `/api/game/reset` | 重置游戏 |
| POST | `/api/user/register` | 用户注册 |
| POST | `/api/user/login` | 用户登录 |
| POST | `/api/user/highscore` | 提交最高分 |

**OpenAPI 规范：** `back_end/cube-engine.openapi.yaml`

## CI/CD 流水线

**配置：** `.gitlab-ci.yml`

| 阶段 | 任务 | 触发条件 |
|------|------|----------|
| build | build-electron (node:18 + node-gyp) | main/develop |
| build | build-backend (gcc + cmake) | main/develop |
| test | test-unittest (Google Test) | main/develop |
| test | test-lint (ESLint) | main/develop |
| test | test-jest (Jest) | main/develop |
| deploy | deploy (alpine, manual) | main |

## 构建指南

### 后端服务器
```bash
cd back_end
cmake -B build
cmake --build build
./build/cube_server.exe  # 启动 HTTP 服务 :8080
```

### Electron 客户端
```bash
npm install
npx node-gyp rebuild      # 编译 C++ 原生插件
npm start                 # 启动 Electron
```

### 原生模块（node-gyp）
- `binding.gyp` — 构建配置
- `native/tetris_core.cpp` + `native/addon.cpp` — 源码
- 输出: `build/Release/tetris_core.node`

## 项目文件结构

```
tetris-new/
├── back_end/               # C++ HTTP 后端服务器
│   ├── main.cpp            # 服务器入口、路由、CORS
│   ├── api.h               # API 声明、GameManager、GameSession
│   ├── api.cpp             # 11 个 API 实现、用户文件存储
│   ├── cube-engine.openapi.yaml  # OpenAPI 3.0 规范
│   ├── CMakeLists.txt
│   └── swagger/
│       └── index.html      # Swagger UI 交互测试页
├── native/                 # C++ 游戏引擎（核心）
│   ├── tetris_core.h
│   ├── tetris_core.cpp
│   └── addon.cpp           # node-gyp 原生插件桥接
├── renderer/
│   └── js/
│       ├── constants.js    # 游戏常量与工具函数
│       ├── account.js      # 账户系统
│       ├── main.js         # 游戏主循环
│       ├── ai.js           # AI 逻辑
│       └── __tests__/      # Jest 测试
│           ├── constants.test.js
│           └── account.test.js
├── tests/
│   ├── CMakeLists.txt
│   ├── test_tetris_core.cpp  # Google Test 18 用例
│   └── jmeter/
│       └── TetrisAPI_LoadTest.jmx  # JMeter 性能测试
├── jest.config.js
├── jest.setup.js
├── .eslintrc.json
├── .gitlab-ci.yml
└── AGENT.md
```
