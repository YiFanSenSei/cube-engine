# 方块引擎 Cube Engine

用 **Electron + HTML5 Canvas + C++ Native Addon** 构建的桌面版方块游戏。

项目采用**前后端分离**架构：C++ 引擎负责全部游戏核心逻辑，前端仅负责渲染与交互。

> 完整的功能介绍见 [tetris-final/README.md](tetris-final/README.md)。

---

## 仓库结构

```
.
├── tetris-final/                 # 游戏主项目
│   ├── back_end/                 #   C++ 后端服务（Crow HTTP + 游戏引擎）
│   │   ├── GameEngine.cpp/.h     #     核心游戏逻辑
│   │   ├── HttpServer.cpp/.h     #     HTTP 服务与路由
│   │   ├── api.cpp/.h            #     接口实现
│   │   └── crow.h                #     Crow 框架（第三方，随源码引入）
│   ├── renderer/                 #   Electron 渲染进程（前端界面）
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── js/                   #     交互逻辑
│   │   └── assets/               #     方块皮肤等图片资源
│   ├── native/                   #   C++ Native Addon 绑定
│   ├── core/                     #   游戏核心（另一实现路径）
│   ├── tests/                    #   单元测试与 JMeter 压测
│   ├── ansible/                  #   自动化部署脚本
│   ├── documents/                #   需求、设计、接口、测试、部署文档
│   ├── scaffolds/                #   C++ 项目脚手架工具
│   ├── data/                     #   运行时数据（主题、键位、排行榜等）
│   ├── main.js / preload.js      #   Electron 主进程与预加载脚本
│   ├── CMakeLists.txt            #   C++ 构建配置
│   └── Dockerfile / .gitlab-ci.yml
└── .claude/skills/               # C++ DevOps 辅助技能脚本
```

---

## 运行方式

### 前置要求

| 依赖 | 版本 | 说明 |
|---|---|---|
| Node.js | ≥ 18 | 运行 Electron 前端 |
| CMake | ≥ 3.15 | 构建 C++ 后端 |
| Visual Studio 2019/2022 | — | 提供 MSVC 编译器 |
| Python | 3.x | node-gyp 构建原生模块所需 |

### 安装与启动

```bash
cd tetris-final
npm install          # 安装依赖
npm start            # 启动游戏
```

也可以直接双击 `tetris-final/开始游戏.bat`。

### 构建 C++ 后端

```bash
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

---

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面外壳 | Electron |
| 前端渲染 | 原生 HTML5 Canvas + JavaScript（无框架） |
| 游戏引擎 | C++17 |
| HTTP 服务 | Crow（header-only，随源码引入） |
| 原生绑定 | node-gyp / N-API |
| 测试 | GoogleTest（单元）+ JMeter（压测） |
| 部署 | Docker + Ansible + GitLab CI |

---

## 关于本仓库

- 仓库内容为课程实训项目，用于学习 **C++ 后端开发、前后端分离架构与 DevOps 流水线**。
- 个人周报、个人总结等含个人信息的文档未包含在本仓库中。
- **注意**：所有访问 GitLab / 其他服务的令牌一律通过环境变量传入，仓库内不保存任何真实凭据。参见 `.claude/skills/` 中的脚本示例。
