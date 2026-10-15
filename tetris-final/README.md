# 方块引擎 Cube Engine (Electron + C++ Native Addon)

**七零三游戏制作组 倾力巨制**

用 **Electron + HTML5 Canvas + C++ Native Addon** 构建的桌面版方块游戏，支持全部 **6 种游戏模式**。项目采用 **前后端分离** 架构——C++ 引擎负责全部游戏核心逻辑，前端仅负责渲染和交互。

---

## 🎮 游戏模式一览

| 模式 | 说明 |
|------|------|
| 🎯 **闯关模式** | 逐关挑战，达成分数目标通关，难度递增 |
| 🤖 **人机对战** | 与 AI 一决高下，支持简单/中等/困难三级难度 |
| 👥 **双人对战** | 两名玩家在同一台电脑上对决，分数高者胜 |
| 🤝 **双人合作** | 共享棋盘各控一半，**双方同一行同时满才消除** |
| ⏱ **挑战模式** | 5 分钟限时挑战，冲击排行榜 |
| 🧱 **建造模式** | 自由堆叠，完成造型挑战获得奖励 |

## 🎨 方块皮肤（9 种）

经典 · 霓虹 · 马卡龙 · 糖果 · 黑客帝国 · 彩虹 · 黄金 · 水晶 · 塔菲喵

更有自定义方块皮肤的功能
> 霓虹皮肤带有动态渐变和色彩泄漏特效，在游戏中视觉效果最为炫酷。

## 🧩 UI 皮肤（5 套）

经典黄· 深海蓝  · 森林绿  · 午夜紫 · 少女粉

支持亮色/暗色模式一键切换。
##  自定义背景功能

## 🏆 成就系统（39 个）

涵盖分数、消行、连击、旋转、AI 对战、建造等各类玩法，解锁成就可获得金币/钻石奖励。

---

## 🕹 操作说明

| 玩家 | 移动 | 旋转 | 加速下落 | 直落到底 |
|------|------|------|----------|----------|
| **P1** | A / D | W | S | F |
| **P2** | ← / → | ↑ | ↓ | Space |

- **P** — 暂停
- **ESC** — 返回菜单 / 关闭面板
- **Alt + Enter** — 全屏切换
- **TAB** — 打开商城（游戏中）
- 按键可在设置面板中**自定义**

---

## ✨ 核心特性

- **C++ 引擎驱动** — 全部游戏核心逻辑由 C++ Native Addon 执行，零 JS 回退
- **AI 对手** — 基于 Pierre Dellacherie 评估函数（7 维度），三级难度，两阶段消行优先策略
- **合作消行** — 双方同一行同时满才消除，单边满行保留等待对齐
- **粒子特效** — 消除爆发、硬降冲击波、锁定涟漪、Tetris 金雨、浮动得分文字
- **连击系统** — HUD 覆盖层显示连击文字反馈
- **游戏回放** — 自动录制对局，支持慢/中/快/极速四档回放
- **程序化音效** — Web Audio API 生成，无需外部音频文件
- **自定义键位** — 所有操作按键均可自由设置
- **JSON 持久化** — 账户数据、成就、商城、回放全部以 JSON 文件本地存储
- **窗口自适应** — 任意窗口大小自动缩放
- **光标特效** — 白光跟随光标，非线性过渡动画
- **多主题联动** — 装饰方块配色随主题自动切换

---

## 🏗 项目架构

```
cube-engine/
├── main.js                   ← Electron 主进程（IPC 通信）
├── preload.js                ← IPC 桥接（contextBridge）
├── binding.gyp               ← node-gyp 编译配置
├── package.json              ← 项目配置
├── jest.config.js            ← Jest 测试配置
├── jest.setup.js             ← Jest 测试环境初始化
├── .gitlab-ci.yml            ← GitLab CI/CD 流水线
├── 开始游戏.bat              ← Windows 双击启动
│
├── native/                   ← C++ 游戏引擎（核心模块）
│   ├── tetris_core.h         # 游戏核心接口
│   ├── tetris_core.cpp       # 游戏核心实现（含 AI 评估函数）
│   └── addon.cpp             # N-API 绑定层
│
├── renderer/                 ← 前端（渲染进程）
│   ├── index.html            # HTML 结构
│   ├── style.css             # CSS 样式（7 套主题 + 亮暗模式）
│   ├── assets/               # 静态资源（方块皮肤图片）
│   └── js/                   # JavaScript 模块
│       ├── main.js           # 入口 + 事件绑定
│       ├── constants.js      # 常量（颜色、形状、主题）
│       ├── audio.js          # 音效引擎（Web Audio API）
│       ├── ui.js             # UI 系统 + 游戏主循环
│       ├── input.js          # 键盘输入 + 自定义键位
│       ├── account.js        # 账户 + 主题管理
│       ├── game_proxy.js     # 游戏状态代理
│       ├── renderer.js       # Canvas 渲染入口
│       ├── particles.js      # 粒子特效系统
│       ├── achievements.js   # 成就系统（39 个成就）
│       ├── leaderboard.js    # 挑战模式排行榜
│       ├── shop.js           # 商城系统（皮肤购买/试用）
│       ├── replay.js         # 游戏回放系统
│       ├── build_mode.js     # 建造模式（10 种随机挑战）
│       ├── bg_effects.js     # 背景特效
│       ├── ScrollFadeManager.js  # 滚动淡入淡出管理
│       ├── core/             # 核心逻辑模块
│       ├── effects/          # 特效模块
│       ├── renderers/        # 渲染器模块
│       ├── loop/             # 游戏循环模块
│       ├── replay/           # 回放子模块
│       └── skins/            # 方块皮肤模块
│
├── back_end/                 ← RESTful API 服务（可选）
│   ├── CMakeLists.txt        # 构建配置
│   ├── main.cpp              # HTTP 服务器入口（Crow + TCP Socket）
│   ├── api.h                 # API 接口声明
│   ├── api.cpp               # API 实现（游戏/用户管理）
│   └── cube-engine.openapi.yaml  # OpenAPI 接口文档
│
├── tests/                    ← C++ 单元测试
│   ├── CMakeLists.txt        # 测试构建配置
│   ├── test_tetris_core.cpp  # 游戏引擎单元测试
│   └── jmeter/               # JMeter 性能测试脚本
│
├── data/                     ← 用户数据（JSON 持久化）
├── documents/                ← 项目文档（14 份）
│   ├── 01-需求分析文档.md
│   ├── 02-功能原型设计稿.md
│   ├── 03-数据结构设计说明.md
│   ├── 04-接口设计说明.md
│   ├── 05-GitLab仓库版本管理展示.md
│   ├── 06-部署指南.md
│   ├── 07-测试报告.md
│   ├── 08-用户手册.md
│   ├── PPT大纲-CubeEngine项目.md
│   ├── 面向傻瓜的开发指南.md
│   └── 周报/周报文件
│
├── scaffolds/                ← 脚手架文件
├── scripts/                  ← 部署脚本
├── ansible/                  ← Ansible 自动部署
├── build/                    ← C++ 编译输出
└── coverage/                 ← 测试覆盖率报告
```

### 数据流

```
用户按键 → 渲染进程 (input.js) → IPC → main.js → C++ 引擎计算
                                                          ↓
Canvas 渲染 ← game_proxy.js 同步 ← IPC ← 返回游戏状态
```

### 分层职责

| 层 | 职责 | 包含 |
|----|------|------|
| **C++ 引擎** | 100% 游戏核心逻辑 | 方块定义、碰撞检测、移动/旋转、消行计分、AI 决策、难度管理、合作消行 |
| **IPC 桥接** | 前后端通信 | N-API 绑定、Electron IPC、contextBridge |
| **前端 JS** | 渲染 + 交互（零游戏逻辑） | Canvas 绘图、键盘采集、音效播放、粒子特效、UI 控制、JSON 数据持久化 |
| **前端 样式** | 视觉呈现 | CSS 变量、动画、响应式布局、7 套主题、亮暗模式 |

---

## 🚀 快速开始

### 前提条件

- **Node.js** ≥ 18
- **Python** 3.12+（仅编译 C++ 时需要）
- **Visual Studio 2022**（仅编译 C++ 时需要）

### 1. 安装依赖

```powershell
cd cube-engine
npm install
```

### 2. 编译 C++ 模块（必需）

```powershell
npx node-gyp rebuild
```

### 3. 启动游戏

```powershell
npm start
```

或直接双击项目根目录的 **开始游戏.bat**

> ⚠️ **注意**：C++ 模块是**必需依赖**，必须编译成功后才能启动游戏。

### 启动后端 API 服务（可选）

```powershell
cd back_end
cmake -B build
cmake --build build
./build/cube_server
```

---

## 🔄 CI/CD 流水线

项目配置了 GitLab CI/CD 自动化流水线（`.gitlab-ci.yml`），支持 `main` 和 `devops` 双分支，完整流水线包含 5 个阶段：

| 阶段 | 内容 | 触发方式 |
|------|------|---------|
| 🔨 **build-backend** | CMake 编译 C++ 后端 API 服务器 | 自动 |
| 🧪 **test-unittest** | Google Test 单元测试（24 个用例） | 自动 |
| 📊 **sonarqube** | Cppcheck 静态分析 → 上传 SonarQube 仪表盘 | 自动 |
| 📋 **eslint** | JavaScript 代码风格检查 | 自动（允许失败） |
| 🚀 **deploy** | Ansible 自动部署 + 健康检查 + 自动回滚 | **手动触发** |

> C++ 相关阶段使用虚拟机上的 GitLab Runner（本地 shell 执行器），eslint 使用共享 Runner（node:18 镜像）。

---

## 📄 技术栈

| 技术 | 用途 |
|------|------|
| **C++ 17** | 游戏核心引擎 + AI 算法 + API 服务 |
| **Node.js + N-API** | C++ ↔ JavaScript 原生绑定 |
| **Electron** | 桌面应用框架（主进程 + 渲染进程） |
| **HTML5 Canvas** | 游戏画面渲染 |
| **Web Audio API** | 程序化音效生成 |
| **Particle System** | 粒子特效（消除爆发、冲击波、金雨） |
| **CMake** | C++ 构建系统 |
| **Google Test** | C++ 单元测试 |
| **node-gyp** | C++ 编译工具链 |
| **CSS 自定义属性** | 多主题皮肤系统 + 亮暗模式 |
| **JSON 文件** | 本地数据持久化 |
| **GitLab CI/CD** | 自动化流水线 |
| **Docker** | 容器化部署（多阶段构建） |
| **Ansible** | 自动化部署编排 |
| **SonarQube** | 代码质量分析平台 |
| **Cppcheck** | C++ 静态代码分析 |

---

## 🛠 DevOps 技能集成

| 工具 | 用途 |
|------|------|
| **Git + GitLab** | 版本控制、分支管理、Merge Request |
| **GitLab CI/CD** | 持续集成流水线（5 阶段全自动） |
| **GitLab Runner** | 本地 VM 注册，shell 执行器，C++ 编译环境 |
| **CMake** | 跨平台 C++ 构建系统 |
| **Google Test** | C++ 单元测试框架（24 个测试用例） |
| **SonarQube** | 代码质量检测 + 在线仪表盘（VM 上 Docker 运行） |
| **Cppcheck** | C++ 静态分析工具，集成到 CI 流水线 |
| **ESLint** | JavaScript 代码风格检查 |
| **Docker** | 多阶段构建（gcc:latest → debian slim） |
| **Ansible** | 自动部署 playbook（含回滚机制） |
| **RESTful API** | 后端 Crow 框架 + OpenAPI 文档 |
| **Apifox** | API 接口设计与测试 |

### 部署流程

```
提交代码 → CI 自动触发
  ├── build-backend（cmake 编译） ✅
  ├── test-unittest（24 用例全通过） ✅
  ├── sonarqube（代码质量分析） ✅
  ├── eslint（JS 代码检查） ✅
  └── deploy（手动触发）
       ├── 编译最新代码
       ├── 备份旧版本
       ├── 启动新服务
       ├── 健康检查 /api/health
       └── 失败则自动回滚 👍
```

### 代码质量平台

SonarQube 运行在虚拟机上，地址：`http://192.168.254.3:9000`

CI 自动运行 Cppcheck 静态分析并将结果上传，展示 Bugs、代码异味、技术债务等指标。VM 重启后 Docker 自启，数据持久化不丢失。
