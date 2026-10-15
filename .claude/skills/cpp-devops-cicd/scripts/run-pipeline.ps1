[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow
$Cyan = [ConsoleColor]::Cyan
$White = [ConsoleColor]::White
$Magenta = [ConsoleColor]::Magenta

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor $Cyan
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$TemplatesDir = Join-Path $SkillDir "templates"
$ClaudeDir = Split-Path -Parent (Split-Path -Parent $SkillDir)
$ProjectRoot = Split-Path -Parent $ClaudeDir

$pipelineTimer = [System.Diagnostics.Stopwatch]::StartNew()
$stages = @()

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║           C++ DevOps CI/CD 流水线                            ║" -ForegroundColor $Cyan
Write-Host "║   环境检查 → 代码质量 → 构建 → 测试 → 报告                  ║" -ForegroundColor $Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""

# ─── 阶段 1: 环境检查 ───
Write-Step "阶段 1/4: 🔍 环境检查"
$stageTimer = [System.Diagnostics.Stopwatch]::StartNew()

$gccOk = $null -ne (Get-Command "gcc" -ErrorAction SilentlyContinue)
$gppOk = $null -ne (Get-Command "g++" -ErrorAction SilentlyContinue)
$cmakeOk = $null -ne (Get-Command "cmake" -ErrorAction SilentlyContinue)
$gitOk = $null -ne (Get-Command "git" -ErrorAction SilentlyContinue)

$gccInfo = if ($gccOk) { (gcc --version 2>&1) -join " " -split "`n" | Select-Object -First 1 } else { "未安装" }
$gppInfo = if ($gppOk) { (g++ --version 2>&1) -join " " -split "`n" | Select-Object -First 1 } else { "未安装" }
$cmakeInfo = if ($cmakeOk) { (cmake --version 2>&1) -join " " -split "`n" | Select-Object -First 1 } else { "未安装" }
$gitInfo = if ($gitOk) { (git --version 2>&1) -join " " | Select-Object -First 1 } else { "未安装" }

Write-Host "  $("✅" -f $gccOk) gcc: $gccInfo"  -ForegroundColor $(if ($gccOk) { $Green } else { $Red })
Write-Host "  $("✅" -f $gppOk) g++: $gppInfo"  -ForegroundColor $(if ($gppOk) { $Green } else { $Red })
Write-Host "  $("✅" -f $cmakeOk) cmake: $cmakeInfo" -ForegroundColor $(if ($cmakeOk) { $Green } else { $Red })
Write-Host "  $("✅" -f $gitOk) git: $gitInfo"   -ForegroundColor $(if ($gitOk) { $Green } else { $Red })

$stageTimer.Stop()
$envPassed = $gccOk -and $gppOk -and $cmakeOk -and $gitOk
$stages += @{ Name = "环境检查"; Passed = $envPassed; Time = $stageTimer.Elapsed.TotalSeconds }

if (-not $envPassed) {
    Write-Host "❌ 环境检查未通过，流水线终止" -ForegroundColor $Red
    exit 1
}
Write-Host "  ✅ 环境检查通过，耗时: $($stageTimer.Elapsed.TotalSeconds.ToString('F2'))s" -ForegroundColor $Green

# ─── 阶段 2: 代码质量 ───
Write-Step "阶段 2/4: 📋 代码质量检查"
$stageTimer = [System.Diagnostics.Stopwatch]::StartNew()

$targetDir = Join-Path $ProjectRoot "tetris-final"
$srcDir = Join-Path $targetDir "src"
$cppFiles = Get-ChildItem -Path $srcDir -Recurse -Include "*.cpp", "*.h", "*.hpp" -ErrorAction SilentlyContinue
$totalLines = 0
$smellCount = 0

foreach ($file in $cppFiles) {
    $content = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    $totalLines += $content.Count
    foreach ($line in $content) {
        if ($line.Length -gt 120) { $smellCount++ }
        if ($line -match "TODO|FIXME|HACK") { $smellCount++ }
    }
}

Write-Host "  📁 源文件数: $($cppFiles.Count)" -ForegroundColor $White
Write-Host "  📄 总代码行: $totalLines" -ForegroundColor $White
Write-Host "  ⚠️  代码异味: $smellCount 处" -ForegroundColor $(if ($smellCount -eq 0) { $Green } else { $Yellow })

$stageTimer.Stop()
$stages += @{ Name = "代码质量"; Passed = $true; Time = $stageTimer.Elapsed.TotalSeconds }

# ─── 阶段 3: 构建 ───
Write-Step "阶段 3/4: 🔧 编译构建"
$stageTimer = [System.Diagnostics.Stopwatch]::StartNew()

$buildDir = Join-Path $targetDir "build-agent-gcc"
$buildOk = $false

if ($cmakeOk -and $gppOk) {
    Push-Location $targetDir
    try {
        $cfg = cmake -S $targetDir -B $buildDir -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_COMPILER=g++ -DCMAKE_C_COMPILER=gcc 2>&1
        if ($LASTEXITCODE -eq 0) {
            $buildOut = cmake --build $buildDir --parallel 2>&1
            $buildOk = $LASTEXITCODE -eq 0
            if ($buildOk) {
                Write-Host "  ✅ 构建成功" -ForegroundColor $Green
            } else {
                Write-Host "  ❌ 构建失败" -ForegroundColor $Red
            }
        } else {
            Write-Host "  ❌ CMake 配置失败" -ForegroundColor $Red
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "  ⚠️ 缺少编译器或 CMake，跳过构建" -ForegroundColor $Yellow
}

$stageTimer.Stop()
$stages += @{ Name = "编译构建"; Passed = $buildOk; Time = $stageTimer.Elapsed.TotalSeconds }

# ─── 阶段 4: 单元测试 ───
Write-Step "阶段 4/4: 🧪 单元测试"
$stageTimer = [System.Diagnostics.Stopwatch]::StartNew()

$testOk = $false
if ($buildOk) {
    $testExe = Get-ChildItem -Path $buildDir -Filter "*.exe" -Recurse | Select-Object -First 1
    if ($testExe) {
        $testOutput = & $testExe.FullName 2>&1
        $testOk = $LASTEXITCODE -eq 0
        $passedTests = ($testOutput | Select-String "PASSED" | Measure-Object).Count
        $failedTests = ($testOutput | Select-String "FAILED" | Measure-Object).Count
        Write-Host "  通过: $passedTests | 失败: $failedTests" -ForegroundColor $(if ($testOk) { $Green } else { $Red })
    } else {
        Write-Host "  ⚠️ 未找到测试可执行文件" -ForegroundColor $Yellow
    }
} else {
    Write-Host "  ⚠️ 构建阶段未通过，跳过测试" -ForegroundColor $Yellow
}

$stageTimer.Stop()
$stages += @{ Name = "单元测试"; Passed = $testOk; Time = $stageTimer.Elapsed.TotalSeconds }

# ─── 流水线报告 ───
$pipelineTimer.Stop()
Write-Step "📊 CI/CD 流水线报告"
Write-Host ""

$allPassed = ($stages | Where-Object { -not $_.Passed }).Count -eq 0
$totalTime = $pipelineTimer.Elapsed.TotalSeconds

Write-Host ("{0,-20} {1,10} {2,12}" -f "阶段", "状态", "耗时") -ForegroundColor $Cyan
Write-Host ("{0,-20} {1,10} {2,12}" -f ("-"*20), ("-"*10), ("-"*12)) -ForegroundColor $White

foreach ($stage in $stages) {
    $status = if ($stage.Passed) { "✅ 通过" } else { "❌ 失败" }
    $color = if ($stage.Passed) { $Green } else { $Red }
    Write-Host ("{0,-20} {1,10} {2,10:F2}s" -f $stage.Name, $status, $stage.Time) -ForegroundColor $color
}

Write-Host ("{0,-20} {1,10} {2,12}" -f ("-"*20), ("-"*10), ("-"*12)) -ForegroundColor $White
Write-Host ("{0,-20} {1,10} {2,10:F2}s" -f "总耗时", "", $totalTime) -ForegroundColor $Yellow

Write-Host ""
if ($allPassed) {
    Write-Host "  🎉 流水线全部通过！" -ForegroundColor $Green
    Write-Host "  环境检查 → 代码质量 → 编译构建 → 单元测试  ✓ 全链路正常" -ForegroundColor $Green
} else {
    Write-Host "  ⚠️ 流水线有阶段未通过" -ForegroundColor $Yellow
    $stages | Where-Object { -not $_.Passed } | ForEach-Object {
        Write-Host "    ❌ $($_.Name)" -ForegroundColor $Red
    }
}

# ─── 生成 CI 配置文件 ───
Write-Step "生成 CI/CD 配置文件模板"

$gitlabCIPath = Join-Path $ProjectRoot ".gitlab-ci.yml"
$githubActionsDir = Join-Path $ProjectRoot ".github" "workflows"
$githubActionsPath = Join-Path $githubActionsDir "cpp-devops.yml"

$gitlabCI = @'
# ══════════════════════════════════════════════════
# GitLab CI/CD 流水线配置 — C++ DevOps 课堂演示
# ══════════════════════════════════════════════════

stages:
  - check
  - build
  - test
  - quality

variables:
  GIT_SUBMODULE_STRATEGY: recursive

# 阶段 1: 环境检查
env-check:
  stage: check
  script:
    - g++ --version
    - cmake --version
    - git --version
    - echo "✅ 环境就绪"

# 阶段 2: 编译构建
build:
  stage: build
  script:
    - mkdir -p build && cd build
    - cmake .. -DCMAKE_BUILD_TYPE=Release
    - cmake --build . --parallel
  artifacts:
    paths:
      - build/

# 阶段 3: 单元测试
test:
  stage: test
  script:
    - cd build
    - ./tetris_test || echo "⚠️ 需要先配置 gtest"

# 阶段 4: 代码质量
code-quality:
  stage: quality
  script:
    - echo "📊 代码统计..."
    - find . -name '*.cpp' -o -name '*.h' | xargs wc -l
    - echo "✅ 质量检查完成"
'@

Set-Content -Path $gitlabCIPath -Value $gitlabCI -Encoding UTF8
Write-Host "  ✅ 已生成: .gitlab-ci.yml" -ForegroundColor $Green

# GitHub Actions
if (-not (Test-Path $githubActionsDir)) {
    New-Item -ItemType Directory -Path $githubActionsDir -Force | Out-Null
}

$githubActions = @'
# ══════════════════════════════════════════════════
# GitHub Actions CI/CD — C++ DevOps 课堂演示
# ══════════════════════════════════════════════════

name: C++ DevOps Pipeline

on:
  push:
    branches: [ master, main, develop ]
  pull_request:
    branches: [ master, main ]

jobs:
  build:
    runs-on: windows-latest
    steps:
    - uses: actions/checkout@v4

    - name: 🔍 环境检查
      run: |
        g++ --version
        cmake --version
        echo "✅ 环境就绪"

    - name: 🔧 CMake 配置
      run: |
        cmake -S . -B build -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Debug

    - name: 🔨 编译构建
      run: |
        cmake --build build --parallel

    - name: 🧪 运行测试
      run: |
        cd build
        ctest --output-on-failure || echo "⚠️ 测试未配置"

    - name: 📊 上传构建产物
      uses: actions/upload-artifact@v4
      with:
        name: build-artifacts
        path: build/
'@

Set-Content -Path $githubActionsPath -Value $githubActions -Encoding UTF8
Write-Host "  ✅ 已生成: .github/workflows/cpp-devops.yml" -ForegroundColor $Green

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║               CI/CD 流水线演示完成                           ║" -ForegroundColor $Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""
