---
name: git-safe-commit
description: 安全提交：提交前检查工作区改动，拦截敏感信息和乱写 commit message，用于课堂演示 DevOps Git 规范流程。
---

# git-safe-commit

适用于本项目的安全提交检查。

## 课堂演示要点

1. 展示提交前的自动化安全检查
2. 展示规范的 commit message 格式
3. 拦截敏感信息（密钥、密码、本地配置）
4. 展示 DevOps 中的 Git 最佳实践

## 要做什么

1. 先检查工作区改动。

提交信息格式只允许这些前缀：
- `feat:` — 新功能
- `fix:` — 修复
- `chore:` — 杂项
- `docs:` — 文档
- `refactor:` — 重构
- `test:` — 测试
- `ci:` — CI/CD

2. 先跑检查模式，不要直接提交：

```powershell
powershell -ExecutionPolicy Bypass -File .claude/skills/git-safe-commit/scripts/safe-git-commit.ps1 -CommitMessage "feat: 你的中文摘要" -CheckOnly
```

3. 如果检查失败：
   - 告诉用户拦截原因
   - 转成中文说明
   - 不要提交

4. 如果检查通过，再执行提交：

```powershell
powershell -ExecutionPolicy Bypass -File .claude/skills/git-safe-commit/scripts/safe-git-commit.ps1 -CommitMessage "feat: 你的中文摘要"
```

## 处理边界

- 检查范围：整个工作区和已暂存文件
- 拦截规则：密码、密钥、敏感文件、可执行文件、超大文件
- 不自动 push
- 不自动删除用户文件
