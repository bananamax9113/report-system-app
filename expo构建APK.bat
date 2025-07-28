@echo off
chcp 65001 > nul
echo ===================================================
echo 報告系統 - Expo APK构建工具
echo ===================================================
echo.

echo 步骤1: 安装必要依赖
echo ===================================================
echo 安装EAS构建工具...
call npm install -g eas-cli
call npm install

echo.
echo 步骤2: 配置EAS项目
echo ===================================================
echo 初始化EAS配置...
call npx eas build:configure

echo.
echo 步骤3: 更新eas.json配置
echo ===================================================
echo 更新EAS构建配置...
echo.
echo 请确保eas.json包含以下配置:
echo {
echo   "build": {
echo     "preview": {
echo       "android": {
echo         "buildType": "apk"
echo       },
echo       "distribution": "internal"
echo     }
echo   }
echo }
echo.

echo 步骤4: 生成必要的签名文件
echo ===================================================
call npx eas credentials

echo.
echo 步骤5: 开始构建APK
echo ===================================================
echo 创建APK构建任务...
call npx eas build -p android --profile preview

echo.
echo ===================================================
echo 注意:
echo 1. 构建过程可能需要一些时间
echo 2. 将在Expo服务器上完成构建
echo 3. 完成后将提供APK下载链接
echo 4. 您也可以在Expo网站上查看构建状态
echo ===================================================
echo.

pause 