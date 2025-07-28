@echo off
echo ===================================================
echo 報告系統 - APK打包工具
echo ===================================================
echo.
echo 此工具將帮助您快速生成真实可用的APK文件
echo.
echo 准备开始PWA打包流程...
echo.
echo 正在打开必要的网页...
echo.
echo ===================================================
echo.

:: 打开GitHub Pages部署网站
start "" "https://bananamax9113.github.io/report-system-app/"

timeout /t 3 > nul

:: 打开PWABuilder网站
start "" "https://www.pwabuilder.com/"

echo.
echo 请按照以下步骤操作:
echo.
echo 1. 在PWABuilder网站输入: https://bananamax9113.github.io/report-system-app/
echo 2. 点击"Start"开始分析
echo 3. 等待分析完成后点击"Build"
echo 4. 选择"Android"平台
echo 5. 点击"Build"按钮生成APK
echo 6. 下载APK文件
echo.
echo 下载完成后，可以将APK文件重命名为"report-system-app.apk"
echo 并替换GitHub仓库中的演示APK文件。
echo.
echo ===================================================
echo.
echo 是否要查看详细的APK打包指南? (Y/N)
choice /c YN /n
if errorlevel 2 goto END
if errorlevel 1 goto OPEN_GUIDE

:OPEN_GUIDE
echo 正在打开详细指南...
start notepad "PWA打包APK操作指南.md"
goto END

:END
echo.
echo 感謝使用報告系統APK打包工具!
echo.
pause 