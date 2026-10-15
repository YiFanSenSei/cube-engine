[CmdletBinding()]
param(
    [switch]$AllowInstallLocalVcpkg,
    [switch]$GenerateSampleTests,
    [string]$ProjectRelativePath = "tetris-final",
    [string]$BuildDirName = "build-agent-gtest"
)

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

function Write-Result {
    param([bool]$Passed, [string]$Message)
    $icon = if ($Passed) { "✅" } else { "❌" }
    $color = if ($Passed) { $Green } else { $Red }
    Write-Host "  $icon $Message" -ForegroundColor $color
}

# ─── 路径 ───
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$TemplatesDir = Join-Path $SkillDir "templates"
$ClaudeDir = Split-Path -Parent (Split-Path -Parent $SkillDir)
$ProjectRoot = Split-Path -Parent $ClaudeDir
$TargetDir = Join-Path $ProjectRoot $ProjectRelativePath
$BuildDir = Join-Path $TargetDir $BuildDirName
$TestDir = Join-Path $TargetDir "tests"

# ─── Banner ───
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║     C++ DevOps 单元测试                        ║" -ForegroundColor $Cyan
Write-Host "║     Google Test 自动化测试流程                 ║" -ForegroundColor $Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""

# ─── 前置检查 ───
Write-Step "① 环境检查"

$gppPath = (Get-Command "g++" -ErrorAction SilentlyContinue).Source
$cmakePath = (Get-Command "cmake" -ErrorAction SilentlyContinue).Source
$gitPath = (Get-Command "git" -ErrorAction SilentlyContinue).Source

if (-not $gppPath) { Write-Result $false "g++ 未安装"; exit 1 }
else { Write-Result $true "g++: $gppPath" }

if (-not $cmakePath) { Write-Result $false "cmake 未安装"; exit 1 }
else { Write-Result $true "cmake: $cmakePath" }

# ─── vcpkg ───
function Find-Vcpkg {
    # 检查项目本地
    $localExe = Join-Path (Join-Path $ProjectRoot "vcpkg") "vcpkg.exe"
    if (Test-Path $localExe) { return @{ Root = Join-Path $ProjectRoot "vcpkg"; Exe = $localExe } }

    # 检查环境变量
    if ($env:VCPKG_ROOT) {
        $envExe = Join-Path $env:VCPKG_ROOT "vcpkg.exe"
        if (Test-Path $envExe) { return @{ Root = $env:VCPKG_ROOT; Exe = $envExe } }
    }

    # 检查全局
    $globalExe = (Get-Command "vcpkg" -ErrorAction SilentlyContinue).Source
    if ($globalExe) { return @{ Root = Split-Path -Parent $globalExe; Exe = $globalExe } }

    # 本地安装
    if ($AllowInstallLocalVcpkg) {
        Write-Step "安装本地 vcpkg..."
        $localDir = Join-Path $ProjectRoot "vcpkg"
        & $gitPath clone "https://gitee.com/mirrors/vcpkg.git" $localDir 2>&1 | Out-Host
        Push-Location $localDir
        try {
            & .\bootstrap-vcpkg.bat -disableMetrics 2>&1 | Out-Host
        } finally {
            Pop-Location
        }
        $localExe = Join-Path $localDir "vcpkg.exe"
        if (Test-Path $localExe) {
            Write-Result $true "vcpkg 已安装到项目根目录"
            return @{ Root = $localDir; Exe = $localExe }
        }
    }

    return $null
}

$vcpkg = Find-Vcpkg
if ($vcpkg) {
    Write-Result $true "vcpkg: $($vcpkg.Exe)"
} else {
    Write-Result $false "vcpkg 未安装"
    Write-Host "  提示: 设置 VCPKG_ROOT 或加入 PATH，或加 -AllowInstallLocalVcpkg" -ForegroundColor $Yellow
    exit 1
}

# ─── 安装 gtest ───
Write-Step "② 安装 Google Test"

$pkgList = & $vcpkg.Exe list 2>&1
if ($pkgList -match "gtest") {
    Write-Result $true "gtest 已安装"
} else {
    Write-Host "  正在安装 gtest..." -ForegroundColor $Yellow
    & $vcpkg.Exe install gtest 2>&1 | Out-Host
    if ($LASTEXITCODE -eq 0) {
        Write-Result $true "gtest 安装成功"
    } else {
        Write-Result $false "gtest 安装失败"
        exit 1
    }
}

# ─── 生成示例测试 ───
if ($GenerateSampleTests -and -not (Test-Path (Join-Path $TestDir "sample_test.cpp"))) {
    Write-Step "生成示例测试文件"
    if (-not (Test-Path $TestDir)) { New-Item -ItemType Directory -Path $TestDir -Force | Out-Null }

    $sampleTest = @'
#include <gtest/gtest.h>
#include <string>
#include <vector>

// 示例测试 1: 基础断言
TEST(SampleTest, BasicAssertions) {
    EXPECT_TRUE(true);
    EXPECT_FALSE(false);
    EXPECT_EQ(1 + 1, 2);
    EXPECT_GT(10, 5);
    EXPECT_LT(3, 7);
}

// 示例测试 2: 字符串测试
TEST(SampleTest, StringOperations) {
    std::string hello = "Hello, C++ DevOps!";
    EXPECT_EQ(hello.length(), 20);
    EXPECT_STREQ(hello.c_str(), "Hello, C++ DevOps!");
    EXPECT_TRUE(hello.find("DevOps") != std::string::npos);
}

// 示例测试 3: 容器测试
TEST(SampleTest, VectorOperations) {
    std::vector<int> vec = {3, 1, 4, 1, 5, 9};
    EXPECT_EQ(vec.size(), 6);
    EXPECT_EQ(vec.front(), 3);
    EXPECT_EQ(vec.back(), 9);

    std::sort(vec.begin(), vec.end());
    EXPECT_EQ(vec.front(), 1);
    EXPECT_EQ(vec.back(), 9);
}

// 示例测试 4: 异常测试
TEST(SampleTest, ExceptionHandling) {
    EXPECT_NO_THROW({
        std::vector<int> v;
        v.push_back(42);
    });

    EXPECT_THROW({
        try {
            throw std::runtime_error("test error");
        } catch (...) {
            throw;
        }
    }, std::runtime_error);
}
'@
    Set-Content -Path (Join-Path $TestDir "sample_test.cpp") -Value $sampleTest -Encoding UTF8
    Write-Result $true "示例测试文件已生成: tests/sample_test.cpp"
}

# ─── 备份 CMakeLists ───
Write-Step "③ 配置测试构建"

$cmakeTemplate = Join-Path $TemplatesDir "CMakeLists_gtest.txt"
$originalCMake = Join-Path $TargetDir "CMakeLists.txt"
$backupCMake = Join-Path $TargetDir "CMakeLists.txt.bak"

if (Test-Path $originalCMake) {
    Copy-Item $originalCMake $backupCMake -Force
    Write-Host "  📦 已备份原始 CMakeLists.txt" -ForegroundColor $Yellow
}

try {
    # 应用测试模板
    if (Test-Path $cmakeTemplate) {
        Copy-Item $cmakeTemplate $originalCMake -Force
        Write-Host "  📋 已应用 gtest CMakeLists.txt 模板" -ForegroundColor $Yellow
    }

    # ─── CMake Configure ───
    Write-Step "④ CMake 配置"
    Push-Location $TargetDir
    try {
        $cmakeArgs = @(
            "-S", $TargetDir,
            "-B", $BuildDir,
            "-G", "MinGW Makefiles",
            "-DCMAKE_BUILD_TYPE=Debug",
            "-DCMAKE_CXX_COMPILER=g++",
            "-DCMAKE_C_COMPILER=gcc",
            "-DCMAKE_TOOLCHAIN_FILE=$($vcpkg.Root)/scripts/buildsystems/vcpkg.cmake"
        )
        cmake @cmakeArgs 2>&1 | ForEach-Object { Write-Host "   $_" -ForegroundColor $White }
        if ($LASTEXITCODE -ne 0) { throw "CMake 配置失败" }
        Write-Result $true "CMake 配置成功"
    } finally {
        Pop-Location
    }

    # ─── 编译测试 ───
    Write-Step "⑤ 编译测试程序"
    Push-Location $TargetDir
    try {
        $buildOutput = cmake --build $BuildDir --parallel 2>&1
        if ($LASTEXITCODE -eq 0) {
            $buildOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor $White }
            Write-Result $true "测试编译成功"
        } else {
            Write-Host "  ❌ 编译失败:" -ForegroundColor $Red
            $buildOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor $Red }
            throw "测试编译失败"
        }
    } finally {
        Pop-Location
    }

    # ─── 查找测试可执行文件 ───
    Write-Step "⑥ 运行测试"

    $testExe = Get-ChildItem -Path $BuildDir -Filter "*test*" -Recurse | Where-Object { $_.Extension -eq ".exe" } | Select-Object -First 1

    if (-not $testExe) {
        # 尝试找所有 exe
        $testExe = Get-ChildItem -Path $BuildDir -Filter "*.exe" -Recurse | Select-Object -First 1
    }

    if ($testExe) {
        Write-Host "  运行: $($testExe.FullName)" -ForegroundColor $Yellow
        Write-Host ""
        Write-Host "  ── 测试输出 ──" -ForegroundColor $Magenta
        $testOutput = & $testExe.FullName 2>&1
        $testOutput | ForEach-Object {
            $line = $_.ToString()
            if ($line -match "\[  PASSED  \]|\[       OK \]") {
                Write-Host "  $_" -ForegroundColor $Green
            } elseif ($line -match "\[  FAILED  \]") {
                Write-Host "  $_" -ForegroundColor $Red
            } elseif ($line -match "Running main|Google Test|Global test") {
                Write-Host "  $_" -ForegroundColor $Cyan
            } else {
                Write-Host "  $_" -ForegroundColor $White
            }
        }
        Write-Host "  ────────────" -ForegroundColor $Magenta
        Write-Host ""
        Write-Result $true "测试执行完成"
    } else {
        Write-Host "  ⚠️  未找到测试可执行文件" -ForegroundColor $Yellow
    }

} finally {
    # ─── 恢复 CMakeLists ───
    if (Test-Path $backupCMake) {
        Copy-Item $backupCMake $originalCMake -Force
        Remove-Item $backupCMake -Force
        Write-Host "  🔄 已恢复原始 CMakeLists.txt" -ForegroundColor $Yellow
    }
}

# ─── 测试报告 ───
Write-Step "📊 测试报告"
Write-Host ""
Write-Host "  📋 测试框架: Google Test" -ForegroundColor $White
Write-Host "  📁 测试目录: $TestDir" -ForegroundColor $White
Write-Host "  📁 构建目录: $BuildDir" -ForegroundColor $White
Write-Host "  🔧 vcpkg: $($vcpkg.Root)" -ForegroundColor $White
Write-Host ""

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║     测试流程完成                              ║" -ForegroundColor $Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""
