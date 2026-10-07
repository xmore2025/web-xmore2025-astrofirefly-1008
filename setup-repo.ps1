<#
 仓库初始化脚本
 仓库：https://github.com/xmore2025/web_xmore2025_astrofirefly-1008
 用法：右键 -> 使用 PowerShell 运行；或 powershell -ExecutionPolicy Bypass -File setup-repo.ps1
#>

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/xmore2025/web_xmore2025_astrofirefly-1008.git"
$ProjDir = $PSScriptRoot

Set-Location $ProjDir

# 0. 先确认损坏的 .git 已清除
if (Test-Path -LiteralPath ".git") {
    Write-Host ""
    Write-Host "[X] 目录里仍存在 .git，无法初始化。请先手动删除：" -ForegroundColor Red
    Write-Host "    powershell -Command `"Remove-Item -LiteralPath '$ProjDir\.git' -Recurse -Force`"" -ForegroundColor Yellow
    Write-Host "    若提示拒绝访问，是 exFAT 卷上有损坏的目录项，需先修复磁盘：" -ForegroundColor Yellow
    Write-Host "    chkdsk E: /f" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "[1/6] git init" -ForegroundColor Cyan
git init

Write-Host "[2/6] 分支重命名为 main" -ForegroundColor Cyan
git branch -M main

Write-Host "[3/6] 配置本地身份" -ForegroundColor Cyan
git config user.name "xmore2025"
git config user.email "336082097+xmore2025@users.noreply.github.com"

Write-Host "[4/6] 忽略 wrangler 本地状态" -ForegroundColor Cyan
if (Test-Path ".git/info") {
    Add-Content -Path ".git/info/exclude" -Value ".wrangler/"
}

Write-Host "[5/6] 关联远程仓库" -ForegroundColor Cyan
$existing = git remote get-url origin 2>$null
if ($existing) {
    git remote set-url origin $RepoUrl
    Write-Host "    remote 已更新: $RepoUrl"
} else {
    git remote add origin $RepoUrl
    Write-Host "    remote 已添加: $RepoUrl"
}

Write-Host "[6/6] 暂存并提交" -ForegroundColor Cyan
git add -A
$staged = git diff --cached --name-only
Write-Host "    将提交 $($staged.Count) 个文件"
git commit -m "init: 简约版 Firefly 博客 (Astro + Cloudflare)"

Write-Host ""
Write-Host "=== 本地仓库已就绪 ===" -ForegroundColor Green
git remote -v
git log --oneline -1
Write-Host ""
Write-Host "下一步：推送到 GitHub（会弹出浏览器授权，用 xmore2025 账号登录）" -ForegroundColor Yellow
Write-Host "    git push -u origin main" -ForegroundColor Yellow
