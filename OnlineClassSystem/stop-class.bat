@echo off
chcp 65001 >nul
title 在线课堂一键停止

echo 正在停止 class-server (8090) ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8090 " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

echo 正在停止 class-web (5174) ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174 " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

echo 正在停止 SRS 容器 ...
"C:\Users\91870\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe" stop srs >nul 2>&1

echo 完成（MySQL 为共用实例，未停止）
pause
