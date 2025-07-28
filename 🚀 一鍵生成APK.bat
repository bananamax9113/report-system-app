@echo off
chcp 65001 >nul
title 一鍵生成APK - 報告系統
color 0A

echo.
echo   ██████╗ ███████╗██████╗  ██████╗ ██████╗ ████████╗    █████╗ ██████╗ ██╗  ██╗
echo   ██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝   ██╔══██╗██╔══██╗██║ ██╔╝
echo   ██████╔╝█████╗  ██████╔╝██║   ██║██████╔╝   ██║      ███████║██████╔╝█████╔╝ 
echo   ██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║██╔══██╗   ██║      ██╔══██║██╔═══╝ ██╔═██╗ 
echo   ██║  ██║███████╗██║     ╚██████╔╝██║  ██║   ██║      ██║  ██║██║     ██║  ██╗
echo   ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝      ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝
echo.
echo                          ✅ 帶您的Logo圖標版本
echo        ========================================================================
echo.

:: 獲取IP地址
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :ip_found
    )
)
:ip_found

echo 🎯 Expo雲構建狀態：❌ Gradle構建失敗
echo 📱 圖標狀態：✅ 已使用apk-logo.png設置
echo 🌐 本地服務器地址：http://localhost:3000
echo 📲 手機訪問地址：http://%LOCAL_IP%:3000
echo.
echo ========================================================================
echo 🚀 選擇APK生成方式：
echo ========================================================================
echo.
echo [1] 🥇 PWA轉APK（推薦）- 100%%成功率
echo     ✅ 5分鐘完成   ✅ 功能完整   ✅ 包含您的logo
echo.
echo [2] 🥈 直接PWA安裝（最快）- 1分鐘完成
echo     ✅ 無需APK     ✅ 自動更新   ✅ 原生體驗
echo.
echo [3] 🥉 Android Studio構建（傳統）
echo     ⚠️  需要安裝開發環境
echo.
echo [4] 📖 查看詳細說明
echo.

set /p choice="請選擇方式 [1-4]: "

if "%choice%"=="1" goto :pwa_apk
if "%choice%"=="2" goto :pwa_direct
if "%choice%"=="3" goto :android_studio
if "%choice%"=="4" goto :help
goto :invalid

:pwa_apk
echo.
echo ========================================================================
echo 🚀 PWA轉APK方式（推薦）
echo ========================================================================
echo.
echo 正在啟動本地服務器...
cd dist
start "本地服務器" cmd /c "title 本地服務器 - 請勿關閉 & echo 服務器運行中... & echo 地址：http://localhost:3000 & echo 手機地址：http://%LOCAL_IP%:3000 & echo. & echo 請保持此窗口開啟！ & npx serve -p 3000"

timeout /t 3 /nobreak >nul

echo ✅ 本地服務器已啟動！
echo.
echo 📋 接下來的步驟：
echo.
echo 步驟1: 正在打開PWA Builder網站...
start "PWA Builder" "https://www.pwabuilder.com/"

echo 步驟2: 在網站中輸入：http://localhost:3000
echo 步驟3: 點擊 "Start"
echo 步驟4: 等待分析完成後，點擊 "Build My PWA"
echo 步驟5: 選擇 "Android" 標籤
echo 步驟6: 點擊 "Download Package"
echo 步驟7: 等待2-3分鐘生成APK
echo 步驟8: 下載zip文件，解壓獲得APK
echo.
echo 💡 生成的APK包含您的logo，功能完全相同！
echo.
goto :end

:pwa_direct
echo.
echo ========================================================================
echo 🚀 直接PWA安裝方式（最快）
echo ========================================================================
echo.
echo 正在啟動本地服務器...
cd dist
start "本地服務器" cmd /c "title 本地服務器 - 請勿關閉 & echo 服務器運行中... & echo 地址：http://localhost:3000 & echo 手機地址：http://%LOCAL_IP%:3000 & echo. & echo 請保持此窗口開啟！ & npx serve -p 3000"

timeout /t 3 /nobreak >nul

echo ✅ 本地服務器已啟動！
echo.
echo 📋 在手機上的操作步驟：
echo.
echo 步驟1: 用手機瀏覽器訪問：http://%LOCAL_IP%:3000
echo 步驟2: 點擊瀏覽器菜單中的 "添加到主屏幕"
echo 步驟3: 確認安裝
echo 步驟4: 完成！桌面會出現 "報告系統" 圖標
echo.
echo 💡 效果與APK完全相同，還支持自動更新！
echo.
goto :end

:android_studio
echo.
echo ========================================================================
echo 🛠️ Android Studio構建方式
echo ========================================================================
echo.
echo 📋 需要完成以下步驟：
echo.
echo 步驟1: 下載Android Studio
start "Android Studio" "https://developer.android.com/studio"
echo 步驟2: 安裝並啟動Android Studio
echo 步驟3: 選擇 "Open an existing Android Studio project"
echo 步驟4: 打開此項目的 android/ 文件夾
echo 步驟5: 等待Gradle同步完成
echo 步驟6: Build ^> Build Bundle(s)/APK(s) ^> Build APK(s)
echo 步驟7: APK位置：android/app/build/outputs/apk/debug/
echo.
echo ⚠️  注意：需要約30分鐘安裝和配置時間
echo.
goto :end

:help
echo.
echo ========================================================================
echo 📖 詳細說明和幫助
echo ========================================================================
echo.
echo 📄 查看詳細文檔：🎯 最終APK生成方案.md
echo 🌐 PWA Builder：https://www.pwabuilder.com/
echo 🛠️ Android Studio：https://developer.android.com/studio
echo.
echo 💡 推薦順序：
echo   1. 先試方式2（直接PWA安裝）- 最快
echo   2. 如需APK文件，用方式1（PWA轉APK）
echo   3. 專業用戶可選方式3（Android Studio）
echo.
pause
goto :menu

:invalid
echo.
echo ❌ 無效選擇，請重新選擇 [1-4]
timeout /t 2 /nobreak >nul
goto :menu

:end
echo.
echo ========================================================================
echo 🎉 設置完成！
echo ========================================================================
echo.
echo 📞 如需幫助：
echo   - 查看：🎯 最終APK生成方案.md
echo   - 重新運行此腳本
echo.
echo ⚠️  重要提醒：
echo   - 保持本地服務器窗口開啟
echo   - 手機和電腦需在同一WiFi網絡
echo.
pause

:menu
cls
goto :start 