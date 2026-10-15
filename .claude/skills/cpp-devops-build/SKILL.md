---
name: cpp-devops-build
description: One-click C++ build with CMake + Ninja, supports Debug/Release, generates build report for classroom demo.
---

# cpp-devops-build

One-click C++ project build for this project.

## Demo points for class

1. Shows CMake configure phase output
2. Shows build phase with timing
3. Shows build artifacts info
4. Supports Debug/Release switching

## What to do

Run the build script:

```powershell
powershell -ExecutionPolicy Bypass -File .claude/skills/cpp-devops-build/scripts/build.ps1
```

Optional:
- `-BuildType Release` (default Debug)
- `-CleanBuild` (force rebuild)

## Notes

- If vcpkg is missing, run cpp-devops-env first
- Does not modify source code
- Build output goes to `build-agent-gcc/`
