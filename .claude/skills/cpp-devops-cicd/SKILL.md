---
name: cpp-devops-cicd
description: 展示 C++ CI/CD 流水线配置（GitLab CI / GitHub Actions），一键演示从代码提交到构建、测试、质量检查的全流程。
---

# cpp-devops-cicd

展示 C++ 项目的 CI/CD 流水线概念。

## 课堂演示要点

1. 展示 CI/CD 流水线的各个阶段
2. 演示一键执行「检查 → 构建 → 测试 → 质量」全流程
3. 提供 GitLab CI 和 GitHub Actions 配置文件模板
4. 展示流水线执行结果

## 要做什么

1. 先跑流水线演示脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .claude/skills/cpp-devops-cicd/scripts/run-pipeline.ps1
```

2. 脚本会依次执行：
   - **① 环境检查** — 调用 cpp-devops-env 的环境检查逻辑
   - **② 代码质量** — 调用 cpp-devops-quality 的质量检查逻辑
   - **③ 构建** — 调用 cpp-devops-build 的构建逻辑
   - **④ 单元测试** — 调用 cpp-devops-test 的测试逻辑
   - **⑤ 生成流水线报告** — 汇总各阶段结果

3. 向用户展示完整的流水线报告

## 处理边界

- 如果某阶段失败，流水线停止并报告失败阶段
- 流水线报告显示每个阶段的耗时和状态
- 生成 CI/CD 配置文件模板（.gitlab-ci.yml / .github/workflows）
