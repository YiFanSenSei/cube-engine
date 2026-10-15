$p = Invoke-RestMethod -Uri 'https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/pipelines?per_page=1' -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
$jobs = Invoke-RestMethod -Uri "https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/pipelines/$($p[0].id)/jobs" -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
$j = $jobs | Where-Object { $_.name -eq 'sonarqube' }
$log = Invoke-RestMethod -Uri "https://csgitlab.whu.edu.cn/api/v4/projects/2025-2026-3-devops%2F2025-se-152%2Ftetris/jobs/$($j.id)/trace" -Headers @{'PRIVATE-TOKEN'=$env:GITLAB_TOKEN}
$lines = $log -split "`n"
$lines[-20..-1]
