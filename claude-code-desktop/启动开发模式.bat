@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ======================================
echo   Claude Code 桌面汉化版
echo   开发模式 - 热更新
echo ======================================

echo [1/2] 构建前端资源...
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo 构建失败，请检查错误信息
    pause
    exit /b 1
)

echo [2/2] 启动应用...
node_modules\electron\dist\electron.exe .

echo.
echo 应用已关闭
pause
