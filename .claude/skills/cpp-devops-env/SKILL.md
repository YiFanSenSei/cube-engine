---
name: cpp-devops-env
description: Check C++ DevOps toolchain (gcc/g++, cmake, git, vcpkg), generate environment report for classroom demo.
---

# cpp-devops-env

One-click C++ development environment check for this project.

## Demo points for class

1. Shows complete toolchain detection flow
2. Each step shows PASS/FAIL status with version info
3. Generates structured environment report

## What to do

Run the check script:

```powershell
powershell -ExecutionPolicy Bypass -File .claude/skills/cpp-devops-env/scripts/check-env.ps1
```

## Notes

- Read-only check, does not install anything
- If vcpkg is missing, run with: `-AllowInstallLocalVcpkg`
- Report results in Chinese to the user
