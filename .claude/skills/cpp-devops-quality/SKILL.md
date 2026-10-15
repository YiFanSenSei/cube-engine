---
name: cpp-devops-quality
description: 代码质量检查：格式化扫描、静态分析、最佳实践检查，生成代码质量报告，用于课堂演示。
---

# cpp-devops-quality

适用于本项目的 C++ 代码质量检查。

## 课堂演示要点

1. 展示代码格式化检查结果
2. 展示静态代码分析
3. 展示代码规范遵循情况
4. 输出结构化的质量报告

## 要做什么

1. 先跑质量检查脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .claude/skills/cpp-devops-quality/scripts/check-quality.ps1
```

2. 脚本会：
   - 统计代码行数、文件数
   - 检查命名规范（类名、函数名、变量名）
   - 检查头文件保护宏
   - 检测常见的代码异味
   - 检查注释密度
   - 生成质量报告

3. 向用户展示质量报告摘要

## 处理边界

- 只读分析，不修改任何代码
- 如果项目使用 MSVC，检查 UTF-8 编码兼容性
- 报告要量化、可视化
