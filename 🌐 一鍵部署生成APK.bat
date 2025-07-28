@echo off
chcp 65001 >nul
title 一鍵部署到公網生成APK
color 0B

:start
echo.
echo   🌐 部署到公網 + 生成APK 工具
echo   ========================================
echo          帶您的Logo圖標版本
echo   ========================================
echo.

echo 📋 當前狀況：
echo   ✅ 應用已準備就緒（包含您的logo）
echo   ✅ Web版本完美運行
echo   ❌ 需要公網地址才能生成APK
echo.

echo 🎯 解決方案：部署到免費公網服務
echo.

echo ========================================
echo 🚀 選擇部署方式：
echo ========================================
echo.
echo [1] 🥇 Netlify部署（推薦）- 最快5分鐘
echo     ✅ 拖拽上傳   ✅ 即時部署   ✅ 永久免費
echo.
echo [2] 🥈 GitHub Pages部署 - 永久穩定
echo     ✅ 永久免費   ✅ 高可靠性   ✅ 自定義域名
echo.
echo [3] 🥉 Vercel部署 - 開發者友好
echo     ✅ 快速部署   ✅ 自動優化   ✅ 全球CDN
echo.
echo [4] 📋 準備部署包（通用）
echo     📦 創建可上傳的文件包
echo.
echo [5] 📖 查看詳細教程
echo.

set /p choice="請選擇部署方式 [1-5]: "

if "%choice%"=="1" goto :netlify
if "%choice%"=="2" goto :github
if "%choice%"=="3" goto :vercel  
if "%choice%"=="4" goto :prepare_package
if "%choice%"=="5" goto :tutorial
goto :invalid

:netlify
echo.
echo ========================================
echo 🚀 Netlify部署方式（推薦）
echo ========================================
echo.
echo 正在準備部署文件...

:: 創建部署文件夾
if exist "deploy-package" rmdir /s /q "deploy-package"
mkdir "deploy-package"

:: 複製所有必要文件
xcopy "dist\*" "deploy-package\" /E /I /H /R /Y >nul 2>&1

echo ✅ 部署包已準備完成！
echo.
echo 📋 接下來的步驟：
echo.
echo 步驟1: 正在打開Netlify網站...
start "Netlify" "https://www.netlify.com"

echo 步驟2: 註冊免費賬戶（如果沒有）
echo 步驟3: 登錄後，找到"Sites"頁面
echo 步驟4: 將 deploy-package 文件夾拖拽到 "Want to deploy a new site?" 區域
echo 步驟5: 等待部署完成（約1分鐘）
echo 步驟6: 複製獲得的URL（類似：https://名稱.netlify.app）
echo.
echo 💡 部署完成後，使用該URL在PWABuilder生成APK！
echo.

:: 打開部署文件夾
echo 正在打開部署文件夾...
start "" "deploy-package"

echo ⚠️  注意：將整個 deploy-package 文件夾拖拽到Netlify
echo.
goto :apk_steps

:github
echo.
echo ========================================
echo 🚀 GitHub Pages部署方式
echo ========================================
echo.
echo 正在準備GitHub部署包...

:: 創建GitHub部署包
if exist "github-deploy" rmdir /s /q "github-deploy"
mkdir "github-deploy"

:: 複製文件
xcopy "dist\*" "github-deploy\" /E /I /H /R /Y >nul 2>&1

:: 創建README文件
echo # 報告系統 > "github-deploy\README.md"
echo. >> "github-deploy\README.md"
echo 這是一個完整的報告管理系統Web應用。 >> "github-deploy\README.md"
echo. >> "github-deploy\README.md"
echo ## 功能特色 >> "github-deploy\README.md"
echo - 報告創建和管理 >> "github-deploy\README.md"  
echo - 圖片上傳和處理 >> "github-deploy\README.md"
echo - PDF生成和預覽 >> "github-deploy\README.md"
echo - 用戶認證系統 >> "github-deploy\README.md"

echo ✅ GitHub部署包已準備完成！
echo.
echo 📋 接下來的步驟：
echo.
echo 步驟1: 正在打開GitHub網站...
start "GitHub" "https://github.com"

echo 步驟2: 登錄/註冊GitHub賬戶
echo 步驟3: 點擊 "New repository"
echo 步驟4: 倉庫名稱：report-system-app
echo 步驟5: 設為 Public，點擊 "Create repository"
echo 步驟6: 點擊 "uploading an existing file"
echo 步驟7: 將 github-deploy 文件夾中的所有文件拖拽上傳
echo 步驟8: 提交信息："Deploy report system app"
echo 步驟9: 點擊 "Commit changes"
echo 步驟10: 去 Settings ^> Pages，啟用GitHub Pages
echo 步驟11: 幾分鐘後獲得URL：https://用戶名.github.io/report-system-app
echo.

:: 打開GitHub部署文件夾
start "" "github-deploy"

echo ⚠️  注意：上傳 github-deploy 文件夾中的所有文件（不是文件夾本身）
echo.
goto :apk_steps

:vercel
echo.
echo ========================================
echo 🚀 Vercel部署方式
echo ========================================
echo.
echo 正在準備Vercel部署包...

:: 創建Vercel部署包
if exist "vercel-deploy" rmdir /s /q "vercel-deploy"
mkdir "vercel-deploy"

:: 複製文件
xcopy "dist\*" "vercel-deploy\" /E /I /H /R /Y >nul 2>&1

:: 創建vercel配置文件
echo { > "vercel-deploy\vercel.json"
echo   "name": "report-system-app", >> "vercel-deploy\vercel.json"
echo   "version": 2, >> "vercel-deploy\vercel.json"
echo   "builds": [ >> "vercel-deploy\vercel.json"
echo     { >> "vercel-deploy\vercel.json"
echo       "src": "index.html", >> "vercel-deploy\vercel.json"
echo       "use": "@vercel/static" >> "vercel-deploy\vercel.json"
echo     } >> "vercel-deploy\vercel.json"
echo   ] >> "vercel-deploy\vercel.json"
echo } >> "vercel-deploy\vercel.json"

echo ✅ Vercel部署包已準備完成！
echo.
echo 📋 接下來的步驟：
echo.
echo 步驟1: 正在打開Vercel網站...
start "Vercel" "https://vercel.com"

echo 步驟2: 使用GitHub賬戶登錄Vercel
echo 步驟3: 點擊 "Add New" ^> "Project"  
echo 步驟4: 選擇 "Browse All Templates"
echo 步驟5: 或直接拖拽 vercel-deploy 文件夾
echo 步驟6: 等待自動部署完成
echo 步驟7: 獲得URL：https://項目名.vercel.app
echo.

:: 打開Vercel部署文件夾
start "" "vercel-deploy"

goto :apk_steps

:prepare_package
echo.
echo ========================================
echo 📦 準備通用部署包
echo ========================================
echo.

:: 創建通用部署包
if exist "universal-deploy" rmdir /s /q "universal-deploy"
mkdir "universal-deploy"

:: 複製所有文件
xcopy "dist\*" "universal-deploy\" /E /I /H /R /Y >nul 2>&1

:: 創建部署說明
echo 部署說明 > "universal-deploy\部署說明.txt"
echo ================= >> "universal-deploy\部署說明.txt"
echo. >> "universal-deploy\部署說明.txt"
echo 這個文件夾包含完整的報告系統應用。 >> "universal-deploy\部署說明.txt"
echo. >> "universal-deploy\部署說明.txt"
echo 可以部署到任何靜態網站托管服務： >> "universal-deploy\部署說明.txt"
echo - Netlify >> "universal-deploy\部署說明.txt"
echo - GitHub Pages >> "universal-deploy\部署說明.txt"
echo - Vercel >> "universal-deploy\部署說明.txt"
echo - Firebase Hosting >> "universal-deploy\部署說明.txt"
echo - 任何支持靜態網站的服務 >> "universal-deploy\部署說明.txt"
echo. >> "universal-deploy\部署說明.txt"
echo 部署後使用公網URL在PWABuilder生成APK。 >> "universal-deploy\部署說明.txt"

echo ✅ 通用部署包已準備完成！
echo.
echo 📂 部署包位置：universal-deploy 文件夾
echo 📄 包含部署說明文件
echo.
echo 💡 您可以將此文件夾上傳到任何靜態網站托管服務
echo.

start "" "universal-deploy"

goto :apk_steps

:tutorial
echo.
echo ========================================
echo 📖 詳細教程
echo ========================================
echo.
echo 正在打開詳細部署指南...
start "" "部署到公网生成APK.md"
echo.
echo 📋 推薦閱讀順序：
echo 1. 選擇一種部署方式（Netlify最簡單）
echo 2. 按照步驟部署到公網
echo 3. 獲得公網URL
echo 4. 使用PWABuilder生成APK
echo.
pause
goto :menu

:apk_steps
echo ========================================
echo 📱 生成APK的步驟：
echo ========================================
echo.
echo 部署完成後，按以下步驟生成APK：
echo.
echo 步驟1: 訪問 https://www.pwabuilder.com/
echo 步驟2: 輸入您獲得的公網URL
echo 步驟3: 點擊 "Start"
echo 步驟4: 等待分析完成（約30秒）
echo 步驟5: 點擊 "Build My PWA"
echo 步驟6: 選擇 "Android" 標籤
echo 步驟7: 點擊 "Download Package"
echo 步驟8: 等待2-3分鐘，下載APK文件
echo.
echo 💡 生成的APK包含您的logo，功能完全相同！
echo.

set /p next="部署完成後按任意鍵打開PWABuilder..."
start "PWABuilder" "https://www.pwabuilder.com/"
echo.
echo 🎉 請在PWABuilder中輸入您的公網URL生成APK！
echo.
goto :end

:invalid
echo.
echo ❌ 無效選擇，請重新選擇 [1-5]
timeout /t 2 /nobreak >nul
goto :menu

:end
echo ========================================
echo ✅ 操作完成！
echo ========================================
echo.
echo 📞 如需幫助：
echo   - 查看：部署到公网生成APK.md
echo   - 重新運行此腳本
echo.
pause

:menu
cls
goto :start 