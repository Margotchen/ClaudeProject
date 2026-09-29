@echo off
chcp 65001 >nul
title 商城一键启动
setlocal

rem ===== 工具路径（按本机实际环境配置） =====
set "JAVA_HOME=C:\jdk-17-temp"
set "MAVEN_HOME=C:\apache-maven-3.9.16"
set "MYSQL_HOME=C:\mysql-8.0.39"
set "BASE_DIR=c:\ClaudeProject\OnlineMall\05-项目源代码"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"

echo ==========================================
echo   在线商城 - 一键启动
echo ==========================================
echo.

rem ===== 1. MySQL (3306) =====
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul
if not errorlevel 1 goto mysql_skip
echo [启动] MySQL ...
del /q "%MYSQL_HOME%\data\*.pid" 2>nul
start "MySQL" /min "%MYSQL_HOME%\bin\mysqld.exe" --console
set /a retries=0
:wait_mysql
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul
if not errorlevel 1 goto mysql_ok
set /a retries+=1
if %retries% lss 30 goto wait_mysql
echo [警告] MySQL 启动超时，请检查 MySQL 窗口日志，后端接口将不可用
goto mysql_done
:mysql_ok
echo [完成] MySQL 已就绪
goto mysql_done
:mysql_skip
echo [跳过] MySQL 已在运行
:mysql_done

rem ===== 2. Redis (6379，Windows 服务) =====
netstat -ano | findstr ":6379 " | findstr "LISTENING" >nul
if not errorlevel 1 goto redis_done
echo [启动] Redis 服务 ...
net start redis >nul 2>&1
if errorlevel 1 (echo [警告] Redis 服务启动失败，验证码等功能可能不可用) else (echo [完成] Redis 已就绪)
goto redis_end
:redis_done
echo [跳过] Redis 已在运行
:redis_end

rem ===== 3. mall-portal 后端 (8085，买家端) =====
netstat -ano | findstr ":8085 " | findstr "LISTENING" >nul
if not errorlevel 1 goto portal_done
echo [启动] mall-portal 后端 ...
start "mall-portal" /D "%BASE_DIR%\backend" cmd /k "mvn spring-boot:run -pl mall-portal"
goto portal_end
:portal_done
echo [跳过] mall-portal 已在运行
:portal_end

rem ===== 4. mall-admin 后端 (8080，管理端) =====
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul
if not errorlevel 1 goto admin_done
echo [启动] mall-admin 后端 ...
start "mall-admin" /D "%BASE_DIR%\backend" cmd /k "mvn spring-boot:run -pl mall-admin"
goto admin_end
:admin_done
echo [跳过] mall-admin 已在运行
:admin_end

rem ===== 5. 前端 (5173) =====
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul
if not errorlevel 1 goto front_done
echo [启动] 前端 Vite ...
start "frontend" /D "%BASE_DIR%\frontend" cmd /k "npm run dev"
goto front_end
:front_done
echo [跳过] 前端已在运行
:front_end

echo.
echo ==========================================
echo   启动完成！访问入口：
echo   买家端:  http://localhost:5173/#/buyer
echo   管理端:  http://localhost:5173/#/login
echo.
echo   后端首次启动需 30-60 秒编译加载，
echo   请等各服务窗口显示启动完成后再访问。
echo ==========================================
pause
