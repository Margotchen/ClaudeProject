@echo off
chcp 65001 >nul
title 在线课堂一键启动
setlocal

rem ===== 工具路径（按本机实际环境配置） =====
set "JAVA_HOME=C:\jdk-17-temp"
set "MAVEN_HOME=C:\apache-maven-3.9.16"
set "MYSQL_HOME=C:\mysql-8.0.39"
set "DOCKER=C:\Users\91870\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe"
set "BASE_DIR=c:\ClaudeProject\OnlineClassSystem\05-项目源代码"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"
rem 项目路径含中文，必须指定 UTF-8 编码，否则 Maven 编译打包中文乱码
set "MAVEN_OPTS=-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"

echo ==========================================
echo   在线课堂直播平台 - 一键启动
echo ==========================================
echo.

rem ===== 1. MySQL (3306，与商城共用实例) =====
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

rem ===== 2. SRS 流媒体服务 (Docker 容器，直播推拉流 + DVR 自动录制) =====
rem 挂载点说明：容器启动实际加载 conf/docker.conf，自定义配置必须挂到该路径
rem dvr 目录挂载到容器 /data/dvr，录制完成由 SRS 回调后端生成录播记录
"%DOCKER%" info >nul 2>&1
if errorlevel 1 goto srs_skip
"%DOCKER%" ps --filter "name=srs" --filter "status=running" --format "{{.Names}}" | findstr /x "srs" >nul
if not errorlevel 1 goto srs_running
"%DOCKER%" ps -a --filter "name=srs" --format "{{.Names}}" | findstr /x "srs" >nul
if not errorlevel 1 goto srs_start_existing
echo [启动] 创建并启动 SRS 容器 ...
if not exist "%~dp0docker\srs\dvr" mkdir "%~dp0docker\srs\dvr"
"%DOCKER%" run -d --name srs --restart unless-stopped -p 1935:1935 -p 1985:1985 -p 8088:8080 -p 8000:8000/udp -v "%~dp0docker\srs\srs.conf:/usr/local/srs/conf/docker.conf" -v "%~dp0docker\srs\dvr:/data/dvr" --add-host host.docker.internal:host-gateway ossrs/srs:5 >nul
goto srs_done
:srs_start_existing
echo [启动] 启动已有 SRS 容器 ...
"%DOCKER%" start srs >nul
goto srs_done
:srs_running
echo [跳过] SRS 容器已在运行
goto srs_done
:srs_skip
echo [跳过] Docker 引擎未运行，SRS 不可用（视频推拉流将不可用，互动功能不受影响）
:srs_done

rem ===== 3. 后端 class-server (8090) =====
netstat -ano | findstr ":8090 " | findstr "LISTENING" >nul
if not errorlevel 1 goto server_skip
echo [启动] class-server (8090) ...
if not exist "%BASE_DIR%\class-server\target\class-server-1.0.0.jar" (
    echo [构建] 首次运行，先打包 ...
    cd /d "%BASE_DIR%\class-server"
    call mvn package -DskipTests -q
)
start "class-server" /D "%BASE_DIR%\class-server" cmd /k "java -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8 -jar target\class-server-1.0.0.jar"
goto server_done
:server_skip
echo [跳过] class-server 已在运行
:server_done

rem ===== 4. 前端 class-web (5174) =====
netstat -ano | findstr ":5174 " | findstr "LISTENING" >nul
if not errorlevel 1 goto web_skip
echo [启动] class-web (5174) ...
start "class-web" /D "%BASE_DIR%\class-web" cmd /k "npm run dev"
goto web_done
:web_skip
echo [跳过] class-web 已在运行
:web_done

echo.
echo ==========================================
echo   启动完成
echo   前端入口: http://localhost:5174
echo   后端接口: http://localhost:8090
echo   SRS 控制台: http://localhost:8088
echo ==========================================
endlocal
