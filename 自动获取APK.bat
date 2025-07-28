@echo off
echo ===================================================
echo 報告系統 - 快速獲取APK
echo ===================================================
echo.

:: 打开PWABuilder页面
echo 正在打开APK生成网站...
start "" "https://www.pwabuilder.com/"
timeout /t 2 > nul

:: 同时打开项目部署页面
echo 正在打开报告系统PWA网站...
start "" "https://bananamax9113.github.io/report-system-app/"
timeout /t 2 > nul

echo.
echo 请按照以下步骤获取APK：
echo.
echo 1. 在PWABuilder网站中输入：
echo    https://bananamax9113.github.io/report-system-app/
echo.
echo 2. 点击"Start"开始分析
echo.
echo 3. 分析完成后点击"Build"，选择Android平台
echo.
echo 4. 点击"Build"按钮下载APK
echo.

echo 是否需要查看详细的解决方案文档？(Y/N)
choice /c YN /n
if errorlevel 2 goto END
if errorlevel 1 goto OPEN_DOC

:OPEN_DOC
notepad "简易APK生成解决方案.md"
goto END

:END
echo.
echo 感谢使用报告系统APK快速获取工具！
pause 