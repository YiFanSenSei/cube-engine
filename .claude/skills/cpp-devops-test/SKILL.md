---
name: cpp-devops-test
description: 一键配置 Google Test 并运行单元测试，生成测试报告，用于课堂演示 C++ 自动化测试流程。
---

# cpp-devops-test

适用于本项目的 Google Test 单元测试集成。

## 课堂演示要点

1. 展示 gtest 的引入和配置过程
2. 展示测试用例编写规范
3. 运行测试并展示通过/失败结果
4. 展示测试覆盖率概念

## 要做什么

1. 先跑测试脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .claude/skills/cpp-devops-test/scripts/run-tests.ps1
```

可选参数：
- `-AllowInstallLocalVcpkg`：如果 vcpkg 缺失，允许自动安装
- `-GenerateSampleTests`：为项目生成示例测试文件

2. 脚本会自动：
   - 检查 vcpkg 和 gtest
   - 用模板覆盖测试用的 CMakeLists.txt
   - 编译测试程序
   - 运行测试并输出结果
   - 恢复原始 CMakeLists.txt

3. 根据测试结果：
   - 成功：显示测试通过数、耗时、测试用例列表
   - 失败：显示具体失败的测试和断言

## 处理边界

- 不要修改项目源代码
- 测试完成后自动恢复 CMakeLists.txt
- 如果 vcpkg 缺失，提示安装方案
- 运行前先检查环境
