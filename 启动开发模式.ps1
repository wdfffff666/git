# Claude Code 桌面汉化版 - 启动脚本
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Claude Code 桌面汉化版" -ForegroundColor White
Write-Host "  启动中..." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

Set-Location $PSScriptRoot

Write-Host "[1/2] 构建前端资源..." -ForegroundColor Cyan
npx vite build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败，请检查错误信息" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

Write-Host "[2/2] 启动应用..." -ForegroundColor Cyan
npx electron .

Write-Host ""
Write-Host "应用已关闭" -ForegroundColor Gray
Read-Host "按 Enter 退出"
