[CmdletBinding()]
param(
    [ValidateSet("Debug", "Release")]
    [string]$BuildType = "Debug",
    [switch]$CleanBuild,
    [string]$ProjectRelativePath = "tetris-final",
    [string]$BuildDirName = "build-agent-gcc"
)

$ErrorActionPreference = "Continue"
$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow
$Cyan = [ConsoleColor]::Cyan
$White = [ConsoleColor]::White
$Magenta = [ConsoleColor]::Magenta

# --- Paths ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ScriptDir))
$ProjectRoot = Split-Path -Parent $ClaudeDir
$TargetDir = Join-Path $ProjectRoot $ProjectRelativePath
$BuildDir = Join-Path $TargetDir $BuildDirName

# --- Add MSYS2/CMake to PATH ---
$extraPaths = @(
    "C:/msys64/mingw64/bin",
    "C:/Qt/Tools/CMake_64/bin",
    "C:/Program Files/CMake/bin"
)
foreach ($p in $extraPaths) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) {
        $env:PATH = $p + ";" + $env:PATH
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor $Cyan
Write-Host "  C++ DevOps Build System" -ForegroundColor $Cyan
Write-Host "===============================================" -ForegroundColor $Cyan
Write-Host ""
Write-Host ("[INFO] Project: " + $TargetDir) -ForegroundColor $White
Write-Host ("[INFO] Config: " + $BuildType) -ForegroundColor $White
Write-Host ("[INFO] Build:  " + $BuildDir) -ForegroundColor $White

# --- Find Tools ---
$gppPath = (Get-Command "g++" -ErrorAction SilentlyContinue).Source
$cmakePath = (Get-Command "cmake" -ErrorAction SilentlyContinue).Source

if (-not $gppPath) { Write-Host "[FAIL] g++ not found" -ForegroundColor $Red; exit 1 }
if (-not $cmakePath) { Write-Host "[FAIL] cmake not found" -ForegroundColor $Red; exit 1 }

Write-Host ("[PASS] g++:  " + $gppPath) -ForegroundColor $Green
Write-Host ("[PASS] cmake: " + $cmakePath) -ForegroundColor $Green

# --- Clean Build ---
if ($CleanBuild -and (Test-Path $BuildDir)) {
    Write-Host ""
    Write-Host "==> Cleaning..." -ForegroundColor $Cyan
    Remove-Item -Path $BuildDir -Recurse -Force
    Write-Host "  Removed old build directory" -ForegroundColor $Yellow
}

# --- CMake Configure ---
Write-Host ""
Write-Host "==> 1. CMake Configure" -ForegroundColor $Cyan
$configureTimer = [System.Diagnostics.Stopwatch]::StartNew()

Push-Location $TargetDir
$cfgResult = cmake -S $TargetDir -B $BuildDir -G "Ninja" ("-DCMAKE_BUILD_TYPE=" + $BuildType) -DCMAKE_CXX_COMPILER=g++ -DCMAKE_C_COMPILER=gcc 2>&1
$cmakeExit = $LASTEXITCODE
Pop-Location

$configureTimer.Stop()

if ($cmakeExit -eq 0) {
    Write-Host ("[PASS] CMake configure OK (" + $configureTimer.Elapsed.TotalSeconds.ToString("F2") + "s)") -ForegroundColor $Green
} else {
    Write-Host "[FAIL] CMake configure failed" -ForegroundColor $Red
    $cfgResult | ForEach-Object { Write-Host ("  " + $_) -ForegroundColor $Red }
    exit 1
}

# --- CMake Build ---
Write-Host ""
Write-Host "==> 2. CMake Build" -ForegroundColor $Cyan
$buildTimer = [System.Diagnostics.Stopwatch]::StartNew()

Push-Location $TargetDir
$buildResult = cmake --build $BuildDir --parallel 2>&1
$buildExit = $LASTEXITCODE
Pop-Location

$buildTimer.Stop()

if ($buildExit -eq 0) {
    Write-Host ("[PASS] Build OK (" + $buildTimer.Elapsed.TotalSeconds.ToString("F2") + "s)") -ForegroundColor $Green
} else {
    Write-Host "[FAIL] Build failed" -ForegroundColor $Red
    $buildResult | ForEach-Object { Write-Host ("  " + $_) -ForegroundColor $Red }
    exit 1
}

# --- Find Artifacts ---
Write-Host ""
Write-Host "==> 3. Build Artifacts" -ForegroundColor $Cyan
$exeFiles = Get-ChildItem -Path $BuildDir -Filter "*.exe" -ErrorAction SilentlyContinue
if ($exeFiles) {
    foreach ($exe in $exeFiles) {
        $sizeKB = [math]::Round($exe.Length / 1KB, 1)
        Write-Host ("  [PACKAGE] " + $exe.Name + " (" + $sizeKB + " KB) @ " + $exe.FullName) -ForegroundColor $Magenta
    }
} else {
    Write-Host "  [INFO] No .exe files found in build directory" -ForegroundColor $Yellow
}

# --- Summary ---
Write-Host ""
Write-Host "==> Summary" -ForegroundColor $Cyan
$totalTime = $configureTimer.Elapsed.TotalSeconds + $buildTimer.Elapsed.TotalSeconds
Write-Host ("  Config: " + $BuildType) -ForegroundColor $White
Write-Host ("  Configure: " + $configureTimer.Elapsed.TotalSeconds.ToString("F2") + "s") -ForegroundColor $White
Write-Host ("  Build: " + $buildTimer.Elapsed.TotalSeconds.ToString("F2") + "s") -ForegroundColor $White
Write-Host ("  Total: " + $totalTime.ToString("F2") + "s") -ForegroundColor $Yellow
Write-Host ("  Output: " + $BuildDir) -ForegroundColor $White
Write-Host ""
Write-Host "===============================================" -ForegroundColor $Cyan
Write-Host "  Build Complete" -ForegroundColor $Cyan
Write-Host "===============================================" -ForegroundColor $Cyan
