$p = Invoke-RestMethod -Uri 'https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/pipelines?per_page=3' -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
foreach ($pipe in $p) {
    Write-Host "Pipeline $($pipe.id) $($pipe.ref) $($pipe.status) $($pipe.created_at)"
}
Write-Host "=== Latest pipeline jobs ==="
$jobs = Invoke-RestMethod -Uri "https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/pipelines/$($p[0].id)/jobs" -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
$jobs | ForEach-Object { Write-Host "$($_.name): $($_.status)" }
# Find failed jobs
$failed = $jobs | Where-Object { $_.status -eq 'failed' }
foreach ($f in $failed) {
    Write-Host "=== $($f.name) FAILED ==="
    $log = Invoke-RestMethod -Uri "https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/jobs/$($f.id)/trace" -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
    $lines = $log -split "`n"
    $lines[-10..-1]
}
