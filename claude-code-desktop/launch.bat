@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo 正在启动 Claude Code 桌面版...
"node_modules\electron\dist\electron.exe" .
