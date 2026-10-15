$p = Invoke-RestMethod -Uri 'https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/pipelines?per_page=1' -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
$jobs = Invoke-RestMethod -Uri "https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/pipelines/$($p[0].id)/jobs" -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
$failed = $jobs | Where-Object { $_.status -eq 'failed' }
$log = Invoke-RestMethod -Uri "https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/jobs/$($failed[0].id)/trace" -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
$lines = $log -split "`n"
# Find ERROR lines
foreach ($line in $lines) {
    if ($line -match "ERROR|error:|Caused by|Fail") {
        Write-Host $line
    }
}
