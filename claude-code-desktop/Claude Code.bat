@echo off
chcp 65001 >nul 2>&1
cd /d "C:\Users\Administrator\Desktop\claude-code-desktop"

if not exist "node_modules\electron\dist\electron.exe" (
    echo [错误] Electron 未安装，请先运行: npm install
    pause
    exit /b 1
)

echo 正在启动 Claude Code...
"node_modules\electron\dist\electron.exe" .
