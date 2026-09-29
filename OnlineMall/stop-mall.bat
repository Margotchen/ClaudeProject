@echo off
chcp 65001 >nul
title 商城一键停止
setlocal

echo ==========================================
echo   在线商城 - 一键停止
echo ==========================================
echo.

rem 按端口找监听进程并结束进程树：3306=MySQL, 8085=mall-portal, 8080=mall-admin, 5173=前端
for %%P in (3306 8085 8080 5173) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo [停止] 端口 %%P 进程 PID=%%A
        taskkill /PID %%A /F /T >nul 2>&1
    )
)

rem 清理残留的启动窗口（按窗口标题）
for %%T in (MySQL mall-portal mall-admin frontend) do (
    taskkill /FI "WINDOWTITLE eq %%T*" /F >nul 2>&1
)

echo.
echo [完成] 已停止 MySQL / mall-portal / mall-admin / 前端
echo [说明] Redis 为 Windows 服务，未停止；如需停止请运行: net stop redis
pause
