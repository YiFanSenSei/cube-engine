[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$CommitMessage,
    [switch]$CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow
$Cyan = [ConsoleColor]::Cyan
$White = [ConsoleColor]::White

# ─── 验证 Commit Message 格式 ───
$validPrefixes = @("feat:", "fix:", "chore:", "docs:", "refactor:", "test:", "ci:")
$prefixValid = $false
foreach ($prefix in $validPrefixes) {
    if ($CommitMessage -match "^$prefix\s") {
        $prefixValid = $true
        break
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║     Git 安全提交检查                          ║" -ForegroundColor $Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""
Write-Host "📝 Commit Message: $CommitMessage" -ForegroundColor $White

if (-not $prefixValid) {
    Write-Host "❌ Commit message 格式无效" -ForegroundColor $Red
    Write-Host "   允许的前缀: $($validPrefixes -join ', ')" -ForegroundColor $Yellow
    Write-Host "   示例: feat: 添加游戏排行榜功能" -ForegroundColor $Yellow
    exit 1
}
Write-Host "✅ Commit message 格式正确" -ForegroundColor $Green

# ─── 检查敏感信息 ───
$issues = @()

# 检查暂存区
$stagedFiles = git diff --cached --name-only 2>&1
$allFiles = git ls-files --others --exclude-standard 2>&1
$changedFiles = git diff --name-only 2>&1

$filesToCheck = @()
$filesToCheck += $stagedFiles | Where-Object { $_ -and $_ -notmatch "^\." }
$filesToCheck += $allFiles | Where-Object { $_ -and $_ -notmatch "^\." }
$filesToCheck += $changedFiles | Where-Object { $_ -and $_ -notmatch "^\." }
$filesToCheck = $filesToCheck | Select-Object -Unique

# ─── 文件名检查 ───
$sensitivePatterns = @(
    ".*\.pem$",
    ".*\.key$",
    ".*id_rsa.*",
    ".*credential.*",
    ".*secret.*",
    ".*token.*",
    ".*\.env$",
    ".*password.*",
    ".*\.exe$",
    ".*\.dll$",
    ".*\.pdb$"
)

foreach ($file in $filesToCheck) {
    if (-not $file) { continue }
    foreach ($pattern in $sensitivePatterns) {
        if ($file -match $pattern) {
            $issues += "包含敏感文件或二进制文件: $file"
            break
        }
    }
}

# ─── 文件内容检查 ───
foreach ($file in ($stagedFiles | Where-Object { $_ -and $_ -notmatch "\.(exe|dll|pdb|o|a|lib|png|jpg|ico|wav|mp3|ogg)$" })) {
    if (-not (Test-Path $file -ErrorAction SilentlyContinue)) { continue }
    $content = Get-Content -Path $file -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    # 检查 API 密钥模式
    if ($content -match "(?i)(api[_-]?key|secret|password|token)\s*[:=]\s*['""][A-Za-z0-9_\-]{16,}['""]") {
        $issues += "文件 $file 包含疑似密钥/密码"
    }
}

# 检查大文件 (>1MB)
foreach ($file in ($stagedFiles | Where-Object { $_ })) {
    if (Test-Path $file -ErrorAction SilentlyContinue) {
        $fileInfo = Get-Item $file -ErrorAction SilentlyContinue
        if ($fileInfo -and $fileInfo.Length -gt 1MB) {
            $sizeMB = [math]::Round($fileInfo.Length / 1MB, 1)
            $issues += "文件 $file 体积过大 (${sizeMB}MB)，建议使用 .gitignore"
        }
    }
}

Write-Host ""
Write-Host "🔍 安全检查" -ForegroundColor $Yellow
Write-Host "  扫描文件数: $($filesToCheck.Count)" -ForegroundColor $White

if ($issues.Count -gt 0) {
    foreach ($issue in $issues) {
        Write-Host "  ❌ $issue" -ForegroundColor $Red
    }
    Write-Host ""
    Write-Host "⛔ 提交被拦截，请修复上述问题后重试" -ForegroundColor $Red
    exit 1
}

Write-Host "  ✅ 安全检查通过" -ForegroundColor $Green
Write-Host "  ✅ 未发现敏感信息" -ForegroundColor $Green

# ─── 检查模式 ───
if ($CheckOnly) {
    Write-Host ""
    Write-Host "=== 检查模式 ===" -ForegroundColor $Cyan
    Write-Host "✅ 所有检查通过，可以提交！" -ForegroundColor $Green
    Write-Host "   执行不加 -CheckOnly 即可提交" -ForegroundColor $Yellow
    exit 0
}

# ─── 执行提交 ───
Write-Host ""
Write-Host "📦 执行提交..." -ForegroundColor $Yellow
git add -A 2>&1 | Out-Host
git commit -m $CommitMessage 2>&1 | Out-Host
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 提交成功！" -ForegroundColor $Green
} else {
    Write-Host "❌ 提交失败" -ForegroundColor $Red
    exit 1
}
