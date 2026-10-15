# 方块引擎（Cube Engine）— 项目 PPT 大纲

---

## Slide 1 · 封面

```
方块引擎（Cube Engine）
软件工程全流程文档展示

703 Studio
2026-07-10
```

---

## Slide 2 · 项目概览

- **架构**：Electron + C++ Native Addon（N-API v7）
- **渲染**：Canvas 2D + Web Audio API（无外部资源）
- **语言**：C++17（引擎）+ JavaScript（UI）+ HTML/CSS
- **构建**：node-gyp + CMake
- **测试**：Google Test（~25 cases）
- **CI/CD**：GitLab CI（4 阶段）
- **远程 API**：C++17 TCP Socket 服务器（端口 8920）
- **开发周期**：5 天 · 3 人 · 87 次提交

---

## Slide 3 · 需求分析 — 六大游戏模式

| 模式 | 核心玩法 |
|------|---------|
| 🎯 **闯关模式** | 逐关推进，目标分数达标晋级，速度递增 |
| 🤖 **人机对战** | 同屏 vs AI（Easy/Medium/Hard 三档） |
| 👥 **双人对战 PvP** | 同键盘对战，先触顶者输 |
| 🤝 **合作模式 Co-op** | 20×20 宽棋盘，双人同屏合作 |
| ⏱ **挑战模式** | 5 分钟限时，追求最高分 |
| 🏗 **建造模式** | 创意建造 + 随机挑战，无 Game Over |

**共 56 项功能需求（FR-01 ~ FR-56）+ 14 项非功能需求**

---

## Slide 4 · 需求分析 — 核心系统

- **账户系统**：多账户 + 游客 + GM 管理员
- **成就系统**：39 个成就，金币/钻石双货币奖励
- **商店系统**：8 种方块皮肤 + 7 种 UI 主题
- **自定义键位**：13 个可绑定操作 + 冲突检测
- **回放系统**：增量录制，4 倍速回放
- **AI 系统**：Pierre Dellacherie 评估（6 特征加权）
- **排行榜**：挑战模式 Top 10

---

## Slide 5 · 原型设计 — 界面流程

```
启动 Logo → 账户选择 → 主菜单
                          │
        ┌────┬────┬────┬────┼────┬────┐
      闯关  人机  对战  合作  挑战  建造
      模式  对战              模式  模式

主菜单底部：⚙ 设置  🛒 商店  🏆 成就
```

**12 个界面原型（ASCII 线框图）**

---

## Slide 6 · 原型设计 — 交互规范

**按键映射（P1 / P2）**
| 操作 | P1 | P2 |
|------|----|-----|
| 移动 | A / D | ← / → |
| 旋转 | W | ↑ |
| 软降 | S | ↓ |
| 硬降 | F | Space |

**事件反馈**：方块移动→短促"滴"声 + 平滑平移
消行→闪烁消失 + 粒子爆发 + 上升音调
Tetris→金色粒子雨 + 高亢长音

---

## Slide 7 · 数据结构 — 三层架构

```
┌───────────────────────────────────┐
│   JSON 持久化层 (data/*.json)      │
│   用户/成就/商店/排行榜/主题/皮肤   │
└────────────┬──────────────────────┘
             │ db:get / db:set (IPC)
┌────────────▼──────────────────────┐
│   内存运行时层 (JS)                │
│   GameProxy · gameStats · 成就引擎 │
└────────────┬──────────────────────┘
             │ getState() (IPC)
┌────────────▼──────────────────────┐
│   C++ 原生引擎层 (addon)           │
│   TetrisGame · grid · AI · 物理   │
└───────────────────────────────────┘
```

---

## Slide 8 · 数据结构 — 核心数据

| 层级 | 关键数据 |
|------|---------|
| **C++** | `grid[20][10]`, `bag[]` 7-Bag, `lockDelay`, `AIMove` 评分 |
| **JS** | `GameProxy` 镜像, `SHAPES` 方块表, `ACHIEVEMENTS[39]` |
| **JSON** | 8 种文件类型，前缀 `tetris_{user}_{type}.json` |

**AI 评估函数（Pierre Dellacherie）**：
```
Score = -4.5×landingHeight + 3.4×erodedCells - 3.2×rowTrans
        - 9.3×colTrans - 7.9×holes - 3.4×wellSum
```

---

## Slide 9 · 接口设计 — 通信架构

```
渲染进程                  主进程               C++ 引擎
 ┌───────┐    IPC     ┌───────┐   N-API    ┌──────────┐
 │ Canvas│ ←────────→ │ main  │ ←────────→ │ Tetris   │
 │ UI    │ 16 channels│ .js   │ 12 exports │ Core     │
 └───────┘            └───────┘            └──────────┘
                              │
                     HTTP API 服务器 (:8920)
                     11 REST endpoints
                     C++17 TCP Socket
```

**核心帧循环（60fps）**：
1. `update(dt)` → 重力/锁定/AI
2. `getState()` → 全量状态拉取
3. 渲染 Canvas

---

## Slide 10 · 接口设计 — 关键接口

**IPC 通道（16 个）**：
- `game:move/rotate/hardDrop/getGhostY` — 操作
- `game:update` — 帧更新（60次/秒）
- `game:getState` — 状态同步（60次/秒）
- `game:aiTick` — AI 决策
- `db:get/set/delete/deletePrefix` — 数据持久化

**REST API（11 端点）**：
- `GET /api/health` — 健康检查
- `POST /api/game/*` — CRUD 游戏操作
- `POST /api/user/*` — 注册/登录/高分

---

## Slide 11 · 版本管理 — Git 统计

| 指标 | 数据 |
|------|------|
| **总提交** | 87 |
| **贡献者** | 3 人 |
| **周期** | 5 天（07/06 → 07/10） |
| **代码** | +7000 / -3700 行 |
| **分支策略** | Trunk-Based Development |

**提交类型分布**：
```
fix: 38%  ███████████████████
feat: 24% ████████████
其他: 26% █████████████
重构: 11% █████
```

---

## Slide 12 · 版本管理 — 团队协作

| 成员 | 提交数 | 角色 |
|------|--------|------|
| 🎨 **LuoYushi** | 40 (46%) | UI/UX、粒子特效、暗色/亮色系统、CI/CD |
| ⚙️ **Fan Yi** | 26 (30%) | C++ 引擎、AI 策略、双人/建造模式 |
| 👤 **mosikedeye** | 21 (24%) | 合作模式、皮肤、成就、回放系统 |

**4 天里程碑**：
```
Day 1: 初始化          Day 3: 前后端分离 + AI 升级
Day 2: 功能井喷(37)    Day 4: CI/CD + 亮暗主题 + Bug 歼灭
```

---

## Slide 13 · CI/CD 流水线

```yaml
stages:
  - build
    ├─ build-electron  → npm install + node-gyp rebuild
    └─ build-backend   → cmake + gcc 编译 C++ 服务器
  - test
    ├─ test-unittest   → Google Test (~25 cases)
    └─ test-lint       → ESLint
  - deploy
    └─ deploy-manual   → 手动触发部署
```

- **触发**：Push 到 `main` / `develop` 分支
- **特点**：并行编译 + 并行测试

---

## Slide 14 · 构建运行说明

### 构建 C++ 模块

```powershell
# 安装依赖
npm install

# 编译 C++ Native Addon（必需）
npx node-gyp rebuild

# （可选）编译 HTTP API 服务器
cd back_end
cmake -B build && cmake --build build
```

### 运行

```powershell
# 启动游戏（Electron）
npm start

# 或双击 开始游戏.bat

# （可选）启动 API 服务器
cd back_end/build && ./cube_server
```

**前提环境**：Node.js ≥ 18 · Python 3.12+ · Visual Studio 2022

---

## Slide 15 · 功能演示

### 六大模式一览

| 模式 | 截图要点 | 演示操作 |
|------|---------|---------|
| 🎯 **闯关模式** | 标准棋盘 + Ghost Piece + HUD | A/D 移动 · W 旋转 · F 硬降 |
| 🤖 **人机对战** | 双棋盘并排（玩家 vs AI） | 选择困难模式，展示 AI 自动落子 |
| 👥 **PvP 对战** | 双棋盘 + 双人按键 | P1(A/D/W/S/F) vs P2(方向键+Space) |
| 🤝 **合作模式** | 20×20 宽棋盘 + 虚线分隔 | 两人各控半场，同生共死 |
| ⏱ **挑战模式** | 倒计时 + 排行榜 | 5 分钟限时冲刺 |
| 🏗 **建造模式** | 特殊方块 + 挑战列表 | SINGLE/BAR2/BAR3/CORNER 建造 |

### 亮点效果演示

- **粒子特效**：消行爆发 ✦ Tetris 金雨 ✦ 冲击波 ✦ 锁定涟漪
- **UI 特效**：光标白光跟随 · 装饰方块鼠标扰动 · 手绘非对称菜单
- **主题切换**：暗色/亮色模式 · 7 套 UI 主题 · 8 种方块皮肤

---

## Slide 16 · 单元测试

### Google Test — 24 个测试用例

| 测试类别 | 用例数 | 测试内容 |
|---------|--------|---------|
| 🟢 **基本功能** | 3 | 初始棋盘为空、重置恢复状态、七种方块存在 |
| 🔵 **方块移动** | 4 | 左移/右移、左边界碰撞、右边界碰撞 |
| 🟡 **旋转系统** | 3 | 旋转保持类型、4 次还原、与已有块碰撞 |
| 🟠 **消行计分** | 2 | Single 加分、Tetris（消4行）加分 |
| 🔴 **游戏结束** | 1 | 方块堆顶触发 Game Over |
| ⚪ **硬降/Ghost** | 2 | 硬降到底、投影 Y ≥ 实际 Y |
| 🟣 **AI & 难度** | 2 | 难度影响速度、AI 能找到有效位置 |
| 📐 **形状验证** | 4 | I/O 旋转、形状非空、格值 0/1 |
| 📏 **边界测试** | 1 | 棋盘尺寸 20×10 |
| 💪 **压力测试** | 1 | 重复操作不崩溃 |

```
测试覆盖率：核心引擎全路径覆盖
运行方式：cd tests && cmake --build build && build/tetris_test
```

---

## Slide 17 · 项目文件结构

```
cube-engine/
├── native/          C++ 核心引擎 (tetris_core.h/.cpp, addon.cpp)
├── renderer/        UI 层 (index.html, style.css, js/14模块)
├── back_end/        HTTP API 服务器 (C++17 TCP Socket)
├── tests/           单元测试 (Google Test, ~24 cases)
├── documents/       项目文档（6 篇：需求/原型/数据/接口/版本/PPT）
├── data/            用户数据（自动生成）
├── main.js          Electron 主进程（IPC 通信）
├── preload.js       contextBridge 桥接
├── .gitlab-ci.yml   CI/CD 4 阶段流水线
├── binding.gyp      node-gyp 编译配置
├── CMakeLists.txt   C++ 项目构建
└── 开始游戏.bat     Windows 启动器
```

---

## Slide 18 · 总结 & 展望

**已完成**：
- ✅ 6 种游戏模式 + 完整经济/成就系统
- ✅ C++ 引擎高性能运算 + JS 灵活渲染
- ✅ 全流程文档（需求→原型→数据→接口→版本）
- ✅ CI/CD 自动化流水线
- ✅ 25+ 单元测试覆盖核心逻辑

**展望**：
- 进一步美化ui
- 完善游戏
- 开发出更新奇的模式


---

*703 Studio · 2026-07-10 · 感谢聆听*
