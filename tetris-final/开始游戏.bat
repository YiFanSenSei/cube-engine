@echo off
chcp 65001 >nul
title 方块引擎 Cube Engine

echo ========================================
echo       方块引擎 Cube Engine - 启动中...
echo ========================================
echo.

:: 检查 Node.js 是否安装
where node.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址：https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node --version') do set NODE_VER=%%i
echo [信息] 检测到 Node.js 版本：%NODE_VER%

:: 进入脚本所在目录
cd /d "%~dp0"

:: 检查 node_modules 是否已安装
if not exist "node_modules\" (
    echo [提示] 首次启动需要安装依赖，请稍候（可能需要1~5分钟）...
    echo.
    call npm.cmd install 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败，请重试或检查网络连接
        pause
        exit /b 1
    )
    echo.
    echo [提示] 依赖安装完成！
    echo.
) else (
    echo [信息] 依赖已安装
)

:: 检查 electron 是否可用
if not exist "node_modules\.bin\electron.cmd" (
    echo [错误] 未找到 Electron，请重新执行 npm install
    pause
    exit /b 1
)

echo [信息] 正在启动游戏窗口...
echo.

:: 启动 Electron，在新窗口中运行
start "方块引擎" node_modules\.bin\electron.cmd .

:: 等待3秒让游戏启动
timeout /t 3 /nobreak >nul

:: 检查 electron 进程是否运行
tasklist /FI "IMAGENAME eq electron.exe" 2>nul | find /I "electron.exe" >nul
if %errorlevel% neq 0 (
    echo [警告] 常规方式启动失败，尝试使用 npx ...
    start "方块引擎" npx.cmd electron .
    timeout /t 3 /nobreak >nul
    tasklist /FI "IMAGENAME eq electron.exe" 2>nul | find /I "electron.exe" >nul
    if %errorlevel% neq 0 (
        echo [错误] 游戏启动失败，请尝试手动运行：
        echo     npm install
        echo     npx electron .
    ) else (
        echo [成功] 游戏已启动！
    )
) else (
    echo [成功] 游戏已启动！
)

echo.
echo 此窗口将在 3 秒后自动关闭...
timeout /t 3 /nobreak >nul