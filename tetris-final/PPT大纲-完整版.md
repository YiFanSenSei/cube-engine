# 方块引擎 Cube Engine — 汇报PPT大纲

> **项目：** 基于 Electron + C++ Native Addon 的桌面游戏
> **制作：** 七零三游戏制作组
> **学年：** 2025-2026

---

## 封面

**标题：** 方块引擎 Cube Engine
**副标题：** C++ 原生引擎 · 六种对战模式 · AI 对决 · DevOps 全自动化
**底部：** 七零三游戏制作组 · 2025-2026 学年

---

## 目录

1. 需求分析
2. 功能原型设计
3. 数据结构设计
4. 接口设计
5. 游戏功能展示
6. 测试报告
7. 部署文档
8. DevOps 流程与 CI/CD 配置
9. 项目演示
10. 总结与致谢

---

## 一、需求分析

### 1.1 项目背景

- 经典俄罗斯方块玩法，结合现代游戏设计理念
- C++ 引擎驱动，Electron 桌面端
- 前后端分离架构，支持多人在线

### 1.2 功能需求

| 模块 | 功能 | 说明 |
|------|------|------|
| 游戏核心 | 6 种游戏模式 | 闯关/AI对战/双人对战/合作/挑战/建造 |
| AI 系统 | 三级难度 AI | 基于 Pierre Dellacherie 评估函数 |
| 成就系统 | 39 个成就 | 涵盖分数/消行/连击/AI对战/建造等全玩法 |
| 商城系统 | 皮肤购买/试用/上传 | 方块皮肤 10 种 + UI 皮肤 5 套 |
| 回放系统 | 自动录制/回放 | 支持四档速度控制 |
| 后端 API | RESTful 服务 | 用户注册/登录/高分榜 |
| 数据持久化 | JSON 文件存储 | 账户/成就/商城/回放 |

### 1.3 非功能需求

- C++ 引擎零 JS 回退
- 合作模式：双方同一行同时满才消除
- 窗口自适应缩放
- 5 套 UI 主题 + 亮暗模式
- 程序化音效系统（Web Audio API，无外部文件依赖）

---

## 二、功能原型设计

### 2.1 主界面原型

- 卡片式功能入口
- 六种模式选择按钮（闯关/AI/双人对战/合作/挑战/建造）
- 成就/商城/设置入口
- 彩色几何纸片装饰，呼吸动画
- 小提示角色（可拖拽，随机展示操作技巧）

### 2.2 游戏界面原型

- **上：** 方块预览 + 分数/等级/行数
- **中：** 10×20 游戏棋盘
- **下：** 操作提示 + 进度条
- 合作模式：双棋盘并列显示
- 建造模式：显示当前挑战目标

### 2.3 UI 主题设计

| 主题 | 特点 | 价格 |
|------|------|------|
| 经典黄 | 默认配色 | 免费 |
| 深海蓝 | 宁静海洋主题 | 800 金币 |
| 森林绿 | 清新森林主题 | 2500 金币 |
| 午夜紫 | 深邃紫色主题 | 80 钻石 |
| 少女粉 | 粉色少女主题 | 1500 金币 |

---

## 三、数据结构设计

### 3.1 游戏核心数据结构

```cpp
class TetrisGame {
    vector<vector<int>> grid;           // 20×10 棋盘
    vector<string> gridNames;           // 方块类型标记
    string piece;                       // 当前方块
    int pieceX, pieceY;                 // 方块位置
    int currentRotation;                // 当前旋转
    vector<vector<int>> currentShape;   // 当前形状矩阵
    int score, lines, level;            // 游戏状态
    bool gameOver, paused;              // 标志位
    double dropCounter, dropInterval;   // 下落计时
    double lockDelay;                   // 锁定延迟
    bool clearing;                      // 消行中
    vector<int> clearRows;              // 待消除行
    bool buildMode;                     // 建造模式
    bool coopMode;                      // 合作模式
};
```

### 3.2 方块定义

- 7 种标准方块：I, O, T, S, Z, J, L
- 每种方块用二维矩阵表示
- 建造模式额外 5 种特殊形状

### 3.3 数据持久化

- `users.json`：用户账户和密码
- 本地 JSON：成就进度、商城购买、回放数据
- 后端 API 通过 JSON 文件存储用户数据

---

## 四、接口设计

### 4.1 后端 RESTful API

| 接口 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/health` | GET | 健康检查 | — |
| `/api/game/init` | POST | 创建游戏 | isAI, buildMode, difficulty |
| `/api/game/move` | POST | 移动方块 | gameId, dx, dy |
| `/api/game/rotate` | POST | 旋转方块 | gameId |
| `/api/game/hardDrop` | POST | 硬降 | gameId |
| `/api/game/state` | POST | 获取状态 | gameId |
| `/api/user/register` | POST | 用户注册 | username, password |
| `/api/user/login` | POST | 用户登录 | username, password |
| `/api/user/highscore` | POST | 提交/获取高分 | id, score |

### 4.2 C++ ↔ JavaScript IPC 接口

- `init()`：初始化游戏，传入 AI/难度/模式参数
- `update()`：游戏逐帧更新，返回状态
- `move()` / `rotate()` / `hardDrop()`：操作转发
- `coopClearCheck()`：合作模式消行检查
- `aiTick()`：AI 决策更新
- `getState()`：获取游戏状态快照
- `getGhostY()`：获取幽灵方块位置

### 4.3 OpenAPI 文档

- 标准 OpenAPI 3.0 规范
- 接口文档位于 `back_end/cube-engine.openapi.yaml`

---

## 五、游戏功能展示

### 5.1 六种游戏模式

| 模式 | 说明 | 玩法 |
|------|------|------|
| 🎯 **闯关模式** | 逐关挑战，达成分数目标通关 | 单人，难度递增 |
| 🤖 **人机对战** | 与 AI 一决高下 | 三级难度（EASY/MEDIUM/HARD） |
| 👥 **双人对战** | 两名玩家在同一台电脑上对决 | 分数高者胜 |
| 🤝 **双人合作** | 共享棋盘各控一半 | **双方同一行同时满才消除** |
| ⏱ **挑战模式** | 5 分钟限时挑战 | 冲击排行榜 |
| 🧱 **建造模式** | 自由堆叠 | 完成 10 种随机造型挑战，全部完成则随机轮转 |

### 5.2 特色系统

- **AI 对手：** 基于 Pierre Dellacherie 评估函数（7 维度），两阶段消行优先策略；AI 死后玩家继续游戏，最终比较分数
- **成就系统：** 39 个成就，涵盖分数/消行/连击/旋转/AI对战/建造等全玩法
- **商城系统：** 方块皮肤 10 种（经典/霓虹/马卡龙/糖果/黑客帝国/黄金/水晶/彩虹/塔菲喵/自定义上传）+ UI 皮肤 5 套，金币/钻石购买，支持试用
- **回放系统：** 自动录制对局，慢/中/快/极速四档回放速度
- **粒子特效：** 消除爆发、硬降冲击波、锁定涟漪、Tetris 金雨、浮动得分文字
- **音效系统：** Web Audio API 程序化生成（消行/旋转/锁定/硬降/连击/游戏结束等 30+ 交互场景）；**呼吸心跳系统：** 黄色/橙色/红色呼吸各有不同频率的心跳声
- **小提示角色：** 游戏界面中的可拖拽助手，随机展示俄罗斯方块技巧（12 秒自动切换）
- **自定义键位：** 所有操作按键均可自由设置
- **窗口自适应：** 任意窗口大小自动缩放

---

## 六、测试报告

### 6.1 C++ 单元测试（Google Test）

- **35 个测试用例，6 个测试套件**
- 覆盖范围：
  - 基本功能（初始棋盘、重置、方块定义）
  - 方块移动（左移/右移/边界碰撞）
  - 方块旋转（旋转不变性、四次复位）
  - 碰撞检测（与已有方块碰撞）
  - 消行计分（单消、四消 Tetris 奖励、不同消除得分）
  - 游戏结束检测
  - 硬降、幽灵方块
  - 难度设置（不影响基础下落速度、AI 思考延迟）
  - AI 决策（找到合法落点）
  - 关卡升级（消行数提升等级、下落速度随等级增加）
  - 建造模式（等级公式、消除扣分）
  - 锁定延迟（仅在空中计数）
  - 边界条件、压力测试（1000 次连续操作不崩溃）
- 全部通过 ✅
- FetchContent 自动下载 GTest，兼容 vcpkg 系统安装

### 6.2 Jest 前端测试

- 单元测试：`game_proxy.test.js`、`shop.test.js`
- 测试游戏状态管理和商城逻辑

### 6.3 JMeter 性能测试

- `TetrisAPI_LoadTest.jmx`
- 后端 API 并发压力测试

### 6.4 测试命令

```bash
# C++ 测试
cd tests && cmake -B build && cmake --build build && ./build/cube_test

# JS 测试
npm test
```

---

## 七、部署文档

### 7.1 部署架构

```
GitLab CI Runner（VM 本地 shell 执行器）
  → 从 GitLab 拉取最新代码
  → CMake 编译 back_end/
  → 备份旧版本二进制
  → nohup 启动 cube_server
  → curl 健康检查 /api/health
  → 失败自动回滚
```

### 7.2 部署方式

| 方式 | 命令 | 适用场景 |
|------|------|---------|
| **GitLab CI 自动部署** | 点击 `deploy` 按钮 | 生产环境 |
| **本地 Ansible 部署** | `ansible-playbook deploy_local.yml -e local_repo=true` | 本地测试 |
| **Docker 部署** | `docker run -d -p 8080:8080 cube-server` | 容器化环境 |

### 7.3 健康检查与回滚

- 部署后自动 `curl` 验证 `/api/health`
- 健康检查连续失败**自动恢复上一版本**
- 备份文件保存在 `build/cube_server.backup`
- 无可用备份时 playbook 报错，不静默留空

### 7.4 后端服务

```bash
cd back_end
cmake -B build && cmake --build build
./build/cube_server
# 服务监听 0.0.0.0:8080，提供 RESTful API
```

---

## 八、DevOps 流程与 CI/CD 配置

### 8.1 工具链总览

| 工具 | 用途 |
|------|------|
| **Git + GitLab** | 版本控制与代码托管（228+ commits） |
| **GitLab CI/CD** | 5 阶段全自动流水线 |
| **GitLab Runner** | VM 本地 shell 执行器，tag: `vm-runner` |
| **CMake** | C++ 跨平台构建系统 |
| **Google Test** | 单元测试框架（35 用例） |
| **SonarQube + Cppcheck** | 代码质量分析平台（17 个问题跟踪） |
| **ESLint** | JavaScript 代码风格检查 |
| **Docker** | 多阶段容器化构建 |
| **Ansible** | 自动化部署编排（含回滚机制） |
| **Crow** | C++ HTTP 框架（后端 API） |

### 8.2 CI/CD 流水线

| 阶段 | 内容 | 触发 | 时间 |
|------|------|------|------|
| 🔨 **build-backend** | CMake 编译 C++ 后端 | 自动 | ~2 min |
| 🧪 **test-unittest** | Google Test（35 用例） | 自动 | ~1 min |
| 📊 **sonarqube** | Cppcheck → SonarQube（17 issues） | 自动 | ~1 min |
| 📋 **eslint** | JS 代码风格检查 | 自动（允许失败） | ~1 min |
| 🚀 **deploy** | 编译→备份→启动→健康检查 | **手动触发** | ~2 min |

### 8.3 SonarQube 代码质量

- 每次 CI 自动运行 Cppcheck 静态分析
- 结果上传到 SonarQube 仪表盘（**17 个代码问题持续跟踪**）
- 展示 Bugs、Code Smells、技术债务等指标
- 安装 sonar-cxx 社区插件实现 C++ 分析
- VM Docker 运行（`sonarqube:lts-community`），`--restart unless-stopped` 开机自启
- 数据挂载持久化目录，关 VM 不丢失

### 8.4 自动回滚机制

```
编译成功 → 备份旧版本 → 启动新服务 → 健康检查
  ↓通过                 ↓失败
部署完成 ← 恢复备份 → 重启旧版本
```

### 8.5 关键技术挑战与解决方案

| 挑战 | 解决方案 |
|------|---------|
| 共享 Runner 拉取 Docker 镜像慢 | **VM 本地注册 Runner，shell 执行器无需镜像** |
| Docker Hub 网络限速 / 403 | 配置国内镜像源（清华/阿里云/DaoCloud） |
| SonarQube 社区版不支持 C++ | 安装 sonar-cxx 社区插件 + 激活分析规则 |
| 跨 stage artifacts 403 | 每个 job 设置 `dependencies: []` |
| GTest 系统安装路径不一致 | FetchContent 自动下载编译，兼容 vcpkg |
| 虚拟机局域网无法公网访问 | 本地 Runner，CI 在 VM 内执行 |
| ESLint 版本不兼容 | 固定 v8，使用 `npx eslint@8` 运行 |
| SonarQube 与扫描器网络不通 | 统一在 VM 本地执行，`localhost:9000` 直连 |
| SonarQube 8.3 与 LTS 版本数据库格式不兼容 | 清空旧数据目录，使用 `lts-community` 标签 |

### 8.6 演示前检查清单

- [ ] VM 已开机，等待 1-2 分钟服务自启
- [ ] GitLab Runner 在线：`sudo gitlab-runner status`
- [ ] SonarQube 可访问：`http://192.168.254.3:9000`
- [ ] 后端 API 验证：`curl http://localhost:8080/api/health`
- [ ] 有一条已跑好的全绿流水线备份

---

## 九、项目演示

### 演示流程（4 分钟）

| 时间 | 操作 | 解说 |
|------|------|------|
| 0:00 | 打开 GitLab → 修改一行代码 → 提交到 main | "每次提交自动触发 CI" |
| 0:30 | 切到 CI/CD → Pipelines 展示新流水线 | "流水线 5 阶段自动跑" |
| 1:30 | build-backend（编译）+ test-unittest（35 用例全绿） | "编译和测试阶段" |
| 2:00 | sonarqube 展示（17 issues 导入） | "SonarQube 自动代码质量分析" |
| 2:30 | eslint（允许失败） + 点 deploy ▶️ | "JS 检查 + 手动触发部署" |
| 3:00 | deploy 跑完 → curl 验证 | `{"status":"ok","activeGames":0}` |
| 3:30 | 打开 SonarQube 仪表盘展示 | "Bugs、Code Smells、技术债务" |
| 4:00 | 展示 Dockerfile 多阶段构建 + 总结 | "完整 DevOps 闭环" |

---

## 十、总结与致谢

### 项目总结

- **游戏功能完整：** 6 种模式 + 三级 AI 对战 + 39 成就 + 商城（10 种方块皮肤 + 5 套 UI 主题）+ 回放 + 粒子特效 + 呼吸心跳系统
- **架构清晰：** C++ 引擎 + Electron 前端 + 后端 API，前后端分离，零 JS 回退
- **质量可靠：** 35 个 Google Test 全部通过，SonarQube 持续跟踪 17 个代码问题
- **完整 DevOps 闭环：** 提交 → 编译 → 测试 → 质量分析 → 部署 → 回滚，全自动化
- **质量左移：** 通过 SonarQube 和 Cppcheck 在 CI 阶段提前拦截代码问题

### 致谢

> 七零三游戏制作组 · 全体成员 · 指导老师
>
> **Q & A**

---

> 本大纲对应项目文档：
> - 需求分析：`documents/01-需求分析文档.md`
> - 功能原型：`documents/02-功能原型设计稿.md`
> - 数据结构：`documents/03-数据结构设计说明.md`
> - 接口设计：`documents/04-接口设计说明.md`
> - 测试报告：`documents/07-测试报告.md`
> - 部署指南：`documents/06-部署指南.md`
> - 用户手册：`documents/08-用户手册.md`
> - 版本管理：`documents/05-GitLab仓库版本管理展示.md`
