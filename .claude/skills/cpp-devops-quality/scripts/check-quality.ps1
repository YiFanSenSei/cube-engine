[CmdletBinding()]
param(
    [string]$ProjectRelativePath = "tetris-final"
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

function Write-Status {
    param([bool]$Passed, [string]$Message)
    $icon = if ($Passed) { "✅" } else { "❌" }
    $color = if ($Passed) { $Green } else { $Red }
    Write-Host "  $icon $Message" -ForegroundColor $color
}

# ─── 路径 ───
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ScriptDir))
$ProjectRoot = Split-Path -Parent $ClaudeDir
$TargetDir = Join-Path $ProjectRoot $ProjectRelativePath
$SrcDir = Join-Path $TargetDir "src"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║     C++ DevOps 代码质量检查                    ║" -ForegroundColor $Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""

if (-not (Test-Path $SrcDir)) {
    Write-Host "❌ 未找到源码目录: $SrcDir" -ForegroundColor $Red
    exit 1
}

# ─── 1. 代码统计 ───
Write-Step "① 代码统计"

$cppFiles = Get-ChildItem -Path $SrcDir -Recurse -Include "*.cpp", "*.h", "*.hpp" | Sort-Object Name
$totalFiles = $cppFiles.Count
$totalLines = 0
$totalCodeLines = 0
$totalCommentLines = 0
$totalBlankLines = 0
$fileStats = @()

foreach ($file in $cppFiles) {
    $content = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    $lines = $content.Count
    $blank = ($content | Where-Object { $_.Trim() -eq "" }).Count
    $comment = ($content | Where-Object { $_.Trim() -match "^(//|#|/\*|\*)" }).Count
    $code = $lines - $blank - $comment

    $totalLines += $lines
    $totalCodeLines += $code
    $totalCommentLines += $comment
    $totalBlankLines += $blank

    $fileStats += [PSCustomObject]@{
        File = $file.Name
        Lines = $lines
        Code = $code
        Comment = $comment
        Blank = $blank
    }
}

Write-Host "  📊 项目概况" -ForegroundColor $Yellow
Write-Host "     源文件数: $totalFiles" -ForegroundColor $White
Write-Host "     总行数:   $totalLines" -ForegroundColor $White
Write-Host "     代码行数: $totalCodeLines" -ForegroundColor $White
Write-Host "     注释行数: $totalCommentLines ($([math]::Round($totalCommentLines/$totalLines*100,1))%)" -ForegroundColor $White
Write-Host "     空行数:   $totalBlankLines ($([math]::Round($totalBlankLines/$totalLines*100,1))%)" -ForegroundColor $White

# ─── 2. 命名规范检查 ───
Write-Step "② 命名规范检查"

$namingIssues = 0
foreach ($file in $cppFiles) {
    $content = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    foreach ($line in $content) {
        # 检查类名是否以大写开头（仅检查 class 声明）
        if ($line -match "^\s*class\s+([a-z][a-zA-Z0-9_]*)") {
            Write-Host "  ⚠️  类名应以大写开头: $($Matches[1]) 在 $($file.Name)" -ForegroundColor $Yellow
            $namingIssues++
        }
        # 检查函数名是否以小写或大写开头（允许两种风格）
        # 这里只是检测，不强制
    }
}

if ($namingIssues -eq 0) {
    Write-Status $true "未发现明显的命名规范问题"
} else {
    Write-Host "  发现 $namingIssues 个命名问题" -ForegroundColor $Yellow
}

# ─── 3. 头文件保护检查 ───
Write-Step "③ 头文件保护检查"

$headerFiles = $cppFiles | Where-Object { $_.Extension -in ".h", ".hpp" }
$missingGuard = 0
foreach ($file in $headerFiles) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -notmatch "#pragma once" -and $content -notmatch "#ifndef") {
        Write-Host "  ⚠️  缺少头文件保护: $($file.Name)" -ForegroundColor $Yellow
        $missingGuard++
    }
}

if ($missingGuard -eq 0) {
    Write-Status $true "所有头文件都包含保护机制"
} else {
    Write-Status $false "$missingGuard 个头文件缺少保护"
}

# ─── 4. 代码异味检测 ───
Write-Step "④ 代码异味检测"

$smellCount = 0
$smells = @()

foreach ($file in $cppFiles) {
    $content = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    for ($i = 0; $i -lt $content.Count; $i++) {
        $line = $content[$i]
        $lineNum = $i + 1

        # 检测魔法数字
        if ($line -match "if\s*\(.*\d{4,}.*\)" -or $line -match "return\s+\d{4,}") {
            $smells += [PSCustomObject]@{ File = $file.Name; Line = $lineNum; Issue = "魔法数字"; Detail = $line.Trim() }
            $smellCount++
        }
        # 检测超长行 (>120字符)
        if ($line.Length -gt 120) {
            $smells += [PSCustomObject]@{ File = $file.Name; Line = $lineNum; Issue = "超长行"; Detail = "$($line.Length) 字符" }
            $smellCount++
        }
        # 检测 TODO/FIXME
        if ($line -match "TODO|FIXME|XXX|HACK") {
            $smells += [PSCustomObject]@{ File = $file.Name; Line = $lineNum; Issue = "待办事项"; Detail = $line.Trim() }
            $smellCount++
        }
        # 检测嵌套过深（连续3个以上缩进级别）
        if ($line -match "^\s{24,}") {
            $smells += [PSCustomObject]@{ File = $file.Name; Line = $lineNum; Issue = "缩进过深"; Detail = $line.Trim() }
            $smellCount++
        }
    }
}

if ($smellCount -eq 0) {
    Write-Status $true "代码质量良好，未发现明显代码异味"
} else {
    Write-Host "  发现 $smellCount 个潜在问题:" -ForegroundColor $Yellow
    $smells | Group-Object Issue | ForEach-Object {
        Write-Host "     • $($_.Name): $($_.Count) 处" -ForegroundColor $Yellow
    }
}

# ─── 5. 详细文件报告 ───
Write-Step "⑤ 文件质量详情"
Write-Host ""
Write-Host ("{0,-25} {1,8} {2,8} {3,8} {4,8}" -f "文件名", "总行数", "代码", "注释", "空行") -ForegroundColor $Cyan
Write-Host ("{0,-25} {1,8} {2,8} {3,8} {4,8}" -f ("-"*25), ("-"*8), ("-"*8), ("-"*8), ("-"*8)) -ForegroundColor $White

$fileStats | Sort-Object Lines -Descending | ForEach-Object {
    Write-Host ("{0,-25} {1,8} {2,8} {3,8} {4,8}" -f $_.File, $_.Lines, $_.Code, $_.Comment, $_.Blank) -ForegroundColor $White
}

# ─── 6. 总评 ───
Write-Step "📊 质量报告摘要"
Write-Host ""

$score = 100
$score -= ($smellCount * 2)
if ($missingGuard -gt 0) { $score -= ($missingGuard * 5) }
$score = [math]::Max(0, $score)

$grade = if ($score -ge 90) { "A" } elseif ($score -ge 80) { "B" } elseif ($score -ge 70) { "C" } else { "D" }
$gradeColor = if ($score -ge 90) { $Green } elseif ($score -ge 70) { $Yellow } else { $Red }

Write-Host "  综合评分: $score/100" -ForegroundColor $gradeColor
Write-Host "  质量等级: $grade" -ForegroundColor $gradeColor
Write-Host ""
Write-Host "  关键指标:" -ForegroundColor $Yellow
Write-Host "    📁 源文件数:    $totalFiles" -ForegroundColor $White
Write-Host "    💬 注释率:      $([math]::Round($totalCommentLines/$totalLines*100,1))%" -ForegroundColor $White
Write-Host "    ⚠️  代码异味:   $smellCount 处" -ForegroundColor $White
Write-Host "    🛡️  头文件保护: $($headerFiles.Count - $missingGuard)/$($headerFiles.Count)" -ForegroundColor $White
Write-Host ""

if ($smellCount -gt 0) {
    Write-Host "  改进建议:" -ForegroundColor $Yellow
    $smells | Group-Object Issue | ForEach-Object {
        Write-Host "    • 修复 $($_.Name)（$($_.Count) 处）" -ForegroundColor $Yellow
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║     质量检查完成                              ║" -ForegroundColor $Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""
