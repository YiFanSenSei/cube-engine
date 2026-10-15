# cpp.jiaoshoujia — C++ 项目脚手架

一个现代化的 C++ 项目脚手架，基于 [CPP项目脚手架.md](https://gitee.com/lgc653/tetris) 的设计理念，整合了以下工具链：

| 工具 | 用途 |
|------|------|
| **CMake** | 跨平台构建系统 |
| **vcpkg** | C/C++ 包管理器 |
| **Google Test** | 单元测试框架 |
| **Clang-Format** | 代码自动格式化 |
| **Cppcheck** | 静态代码分析 |

---

## 目录结构

```
cpp.jiaoshoujia/
├── CMakeLists.txt              # 顶层构建配置
├── CMakePresets.json           # CMake 预设 (MSVC/Ninja)
├── vcpkg.json                  # 依赖声明 (fmt, gtest, nlohmann-json)
├── vcpkg-configuration.json    # vcpkg 配置
├── .clang-format               # 代码格式化规则
├── .gitignore                  # Git 忽略规则
├── README.md                   # 本文件
├── src/
│   ├── CMakeLists.txt
│   ├── main.cpp                # 主程序入口
│   └── hello/
│       ├── CMakeLists.txt
│       ├── hello.h             # 示例库头文件
│       └── hello.cpp           # 示例库实现
├── tests/
│   ├── CMakeLists.txt
│   ├── main_test.cpp           # 测试入口
│   └── test_hello.cpp          # 示例测试用例
└── .vscode/
    ├── settings.json           # VSCode 编辑器设置 + Cppcheck 配置
    ├── launch.json             # 调试配置 (MSVC/GDB)
    ├── tasks.json              # 构建/测试/分析任务
    └── c_cpp_properties.json   # C++ IntelliSense 配置
```

---

## 前置条件

### 1. 安装 Visual Studio 2022

- 下载 [Visual Studio 2022](https://visualstudio.microsoft.com/)
- 工作负载选择："使用 C++ 的桌面开发"
- 包含 **MSVC v143** 生成工具和 **Windows 10/11 SDK**

### 2. 安装 CMake

```powershell
# 从 https://cmake.org/download/ 下载安装
# 安装时选择 "Add CMake to system PATH"
cmake --version
```

### 3. 安装 vcpkg

```powershell
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
.\bootstrap-vcpkg.bat

# 设置环境变量 (或加到系统环境变量)
$env:VCPKG_ROOT = "D:\Dev\vcpkg"   # 改为你的实际路径
$env:PATH += ";$env:VCPKG_ROOT"
```

### 4. （可选）安装 Clang-Format

```powershell
# 通过 LLVM 安装: https://releases.llvm.org/
# 或通过 vcpkg: vcpkg install clang-format
clang-format --version
```

### 5. （可选）安装 Cppcheck

- 下载地址: https://github.com/danmar/cppcheck/releases
- 安装后确保 `cppcheck.exe` 在 PATH 中，或在 `.vscode/settings.json` 中配置路径

### 6. 安装 VSCode 扩展

- [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
- [CMake Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools)
- [Clang-Format](https://marketplace.visualstudio.com/items?itemName=xaver.clang-format)
- [CppCheck-Lint](https://marketplace.visualstudio.com/items?itemName=rubymaniac.vscode-cpp-check-lints)

---

## 快速开始

### 方式一：使用 VSCode CMake Tools（推荐）

1. 用 VSCode 打开本项目
2. 按 `Ctrl+Shift+P` → `CMake: Select Configure Preset` → 选择 `msvc-debug`
3. 按 `Ctrl+Shift+P` → `CMake: Build`
4. 按 `Ctrl+Shift+P` → `CMake: Run Tests`

### 方式二：命令行构建

```powershell
# 1. 安装依赖（首次需要，会自动安装到 vcpkg_installed）
vcpkg install --triplet x64-windows

# 2. 配置（使用 CMakePresets）
cmake --preset msvc-debug

# 3. 构建
cmake --build build/msvc-debug --config Debug

# 4. 运行
.\build\msvc-debug\bin\jiaoshoujia_main.exe

# 5. 运行测试
ctest --preset msvc-debug --output-on-failure
```

### 方式三：快速构建（Ninja）

如果安装了 Ninja，可以用更快的构建：

```powershell
cmake --preset ninja-msvc-debug
cmake --build build/ninja-msvc-debug
ctest --preset ninja-msvc-debug
```

---

## 添加新依赖

编辑 `vcpkg.json`，添加包名：

```json
{
    "dependencies": [
        "fmt",
        "gtest",
        "nlohmann-json",
        "spdlog"       # 添加这里
    ]
}
```

然后：

```powershell
vcpkg install --triplet x64-windows
```

在 CMake 中链接：

```cmake
find_package(spdlog CONFIG REQUIRED)
target_link_libraries(your_target PRIVATE spdlog::spdlog)
```

---

## 代码质量工具

### Clang-Format（代码格式化）

VSCode 已配置保存时自动格式化。也可以手动检查：

```powershell
# 检查格式问题
clang-format --style=file --dry-run --Werror src/main.cpp

# 实际格式化文件
clang-format -i src/main.cpp
```

### Cppcheck（静态分析）

VSCode 任务面板中运行 "Cppcheck: 静态分析"，或命令行：

```powershell
cppcheck --enable=all --suppress=missingIncludeSystem --std=c++20 --language=c++ src/
```

---

## 技术栈

| 组件 | 技术选型 |
|------|----------|
| 构建系统 | CMake 3.20+ |
| 包管理 | vcpkg |
| C++ 标准 | C++20 |
| 编译器 | MSVC (Visual Studio 2022) |
| 单元测试 | Google Test |
| 格式化 | Clang-Format |
| 静态分析 | Cppcheck |
| 编辑器 | Visual Studio Code |

---

## 许可证

MIT
