@echo off
chcp 65001 >nul
echo.
echo ==========================================
echo    🚀 报告系统APK快速生成工具
echo ==========================================
echo.
echo 📦 正在打开部署工具...
echo.

REM 打开Netlify部署页面
echo 🌐 打开 Netlify 部署页面...
start https://app.netlify.com/drop

REM 等待2秒
timeout /t 2 /nobreak >nul

REM 打开PWABuilder
echo 📱 打开 PWABuilder APK生成页面...
start https://www.pwabuilder.com/

REM 打开部署文件夹
echo 📂 打开部署文件夹...
start explorer netlify-deploy

echo.
echo ==========================================
echo    📋 操作步骤提醒
echo ==========================================
echo.
echo ✅ 1. 将 netlify-deploy 文件夹拖拽到 Netlify 页面
echo ✅ 2. 等待部署完成，获得 https://xxxxx.netlify.app 网址
echo ✅ 3. 将网址粘贴到 PWABuilder 并生成APK
echo ✅ 4. 下载APK文件到手机安装
echo.
echo ⏱️  预计完成时间：5分钟
echo.
echo 按任意键关闭此窗口...
pause >nul 