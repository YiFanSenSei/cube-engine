[CmdletBinding()]
param([switch]$AllowInstallLocalVcpkg)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow
$Cyan = [ConsoleColor]::Cyan
$White = [ConsoleColor]::White

Write-Host ""
Write-Host "===============================================" -ForegroundColor $Cyan
Write-Host "  C++ DevOps Toolchain Environment Check" -ForegroundColor $Cyan
Write-Host "  Windows + MinGW Development Environment" -ForegroundColor $Cyan
Write-Host "===============================================" -ForegroundColor $Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ScriptDir))
$ProjectRoot = Split-Path -Parent $ClaudeDir

Write-Host ("[INFO] Project: " + $ProjectRoot) -ForegroundColor $White
Write-Host ("[INFO] Time: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor $White
Write-Host ""

function Find-Tool {
    param([string]$Name, [string[]]$ExtraPaths, [string]$VersionArg = "--version")
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($cmd) {
        $result = & $Name $VersionArg 2>&1
        $line = ($result | Select-Object -First 1).ToString().Trim()
        return @{ Path = $cmd.Source; Version = $line }
    }
    foreach ($extra in $ExtraPaths) {
        $candidate = Join-Path $extra "$Name.exe"
        if (Test-Path $candidate) {
            $result = & $candidate $VersionArg 2>&1
            $line = ($result | Select-Object -First 1).ToString().Trim()
            return @{ Path = $candidate; Version = $line }
        }
    }
    return $null
}

function Write-Check {
    param([bool]$Passed, [string]$Label, [string]$Detail)
    $icon = if ($Passed) { "[PASS]" } else { "[FAIL]" }
    $color = if ($Passed) { $Green } else { $Red }
    if ($Detail) {
        Write-Host ("  " + $icon + " " + $Label + " - " + $Detail) -ForegroundColor $color
    } else {
        Write-Host ("  " + $icon + " " + $Label) -ForegroundColor $color
    }
}

$commonPaths = @(
    "C:/msys64/mingw64/bin",
    "C:/msys64/ucrt64/bin"
)
$cmakePaths = @(
    "C:/Qt/Tools/CMake_64/bin",
    "C:/Program Files/CMake/bin"
)

# --- 1. Compiler ---
Write-Host "--- 1. C++ Compiler ---" -ForegroundColor $Yellow
$gccInfo = Find-Tool "gcc" -ExtraPaths $commonPaths
$gppInfo = Find-Tool "g++" -ExtraPaths $commonPaths
if ($gccInfo) { Write-Check $true "gcc" ($gccInfo.Version + " @ " + $gccInfo.Path) }
else { Write-Check $false "gcc" "not found" }
if ($gppInfo) { Write-Check $true "g++" ($gppInfo.Version + " @ " + $gppInfo.Path) }
else { Write-Check $false "g++" "not found" }

# --- 2. CMake ---
Write-Host "--- 2. CMake Build Tool ---" -ForegroundColor $Yellow
$cmakeInfo = Find-Tool "cmake" -ExtraPaths $cmakePaths
if ($cmakeInfo) { Write-Check $true "cmake" ($cmakeInfo.Version + " @ " + $cmakeInfo.Path) }
else { Write-Check $false "cmake" "not found" }

# --- 3. Git ---
Write-Host "--- 3. Git Version Control ---" -ForegroundColor $Yellow
$gitInfo = Find-Tool "git"
if ($gitInfo) { Write-Check $true "git" ($gitInfo.Version + " @ " + $gitInfo.Path) }
else { Write-Check $false "git" "not found" }

# --- 4. vcpkg ---
Write-Host "--- 4. vcpkg Package Manager ---" -ForegroundColor $Yellow
$vcpkgExe = $null
$localVcpkgExe = Join-Path (Join-Path $ProjectRoot "vcpkg") "vcpkg.exe"
if (Test-Path $localVcpkgExe) {
    $vcpkgExe = $localVcpkgExe
    Write-Check $true "vcpkg (local)" $localVcpkgExe
} elseif ($env:VCPKG_ROOT) {
    $envExe = Join-Path $env:VCPKG_ROOT "vcpkg.exe"
    if (Test-Path $envExe) {
        $vcpkgExe = $envExe
        Write-Check $true "vcpkg (VCPKG_ROOT)" $envExe
    } else {
        Write-Check $false "vcpkg" ("VCPKG_ROOT set but vcpkg.exe not found at " + $env:VCPKG_ROOT)
    }
} else {
    $globalVcpkg = Get-Command "vcpkg" -ErrorAction SilentlyContinue
    if ($globalVcpkg) {
        $vcpkgExe = $globalVcpkg.Source
        Write-Check $true "vcpkg (PATH)" $vcpkgExe
    } else {
        Write-Check $false "vcpkg" "not found"
    }
}

# --- 5. Google Test ---
Write-Host "--- 5. Google Test ---" -ForegroundColor $Yellow
$gtestFound = $false
if ($vcpkgExe) {
    $pkgList = & $vcpkgExe list 2>&1 | Out-String
    if ($pkgList -match "gtest") { $gtestFound = $true; Write-Check $true "gtest" "installed via vcpkg" }
}
if (-not $gtestFound) { Write-Check $false "gtest" "not found (install via: vcpkg install gtest)" }

# --- 6. Compile Test ---
Write-Host "--- 6. Compilation Test ---" -ForegroundColor $Yellow
$compileOK = $false
if ($gppInfo) {
    $gppDir = Split-Path -Parent $gppInfo.Path
    $oldPath = $env:PATH
    $env:PATH = $gppDir + ";" + $env:PATH

    $testFile = Join-Path $env:TEMP "test_compilation_$$.cpp"
    $testExe = Join-Path $env:TEMP "test_compilation_$$.exe"
    '#include <iostream>' | Out-File -FilePath $testFile -Encoding ascii
    'int main() {' | Out-File -FilePath $testFile -Encoding ascii -Append
    '    std::cout << "C++17 compilation OK" << std::endl;' | Out-File -FilePath $testFile -Encoding ascii -Append
    '    return 0;' | Out-File -FilePath $testFile -Encoding ascii -Append
    '}' | Out-File -FilePath $testFile -Encoding ascii -Append

    $result = & "g++" -std=c++17 $testFile -o $testExe 2>&1
    if (($LASTEXITCODE -eq 0) -and (Test-Path $testExe)) {
        $compileOK = $true
        $output = & $testExe 2>&1
        Write-Check $true "C++17 compile test" ($output -join " ")
    } else {
        Write-Check $false "C++17 compile test" ($result -join " ")
    }
    Remove-Item $testFile -Force -ErrorAction SilentlyContinue
    Remove-Item $testExe -Force -ErrorAction SilentlyContinue
    $env:PATH = $oldPath
} else {
    Write-Check $false "C++17 compile test" "g++ not found, skipped"
}

# --- Summary ---
Write-Host ""
Write-Host "--- Summary ---" -ForegroundColor $Yellow
$checks = @(
    @{ Name = "gcc";         Pass = ($null -ne $gccInfo) }
    @{ Name = "g++";         Pass = ($null -ne $gppInfo) }
    @{ Name = "CMake";       Pass = ($null -ne $cmakeInfo) }
    @{ Name = "Git";         Pass = ($null -ne $gitInfo) }
    @{ Name = "vcpkg";       Pass = ($null -ne $vcpkgExe) }
    @{ Name = "Google Test"; Pass = $gtestFound }
    @{ Name = "Compile";     Pass = $compileOK }
)
$passCount = 0
foreach ($check in $checks) { if ($check.Pass) { $passCount++ } }
foreach ($check in $checks) { Write-Check $check.Pass $check.Name }
Write-Host ("  Score: " + $passCount + "/" + $checks.Count) -ForegroundColor $Yellow
if ($passCount -eq $checks.Count) {
    Write-Host "  ALL CHECKS PASSED!" -ForegroundColor $Green
} else {
    Write-Host "  Some checks failed. See details above." -ForegroundColor $Yellow
}
Write-Host ""
Write-Host "===============================================" -ForegroundColor $Cyan
Write-Host "  Check Complete" -ForegroundColor $Cyan
Write-Host "===============================================" -ForegroundColor $Cyan
