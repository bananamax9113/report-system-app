@echo off
echo ==============================================
echo 正在准备报告系统APK文件...
echo ==============================================

:: 创建目录
if not exist "apk" mkdir apk

:: 下载PWA示例APK作为临时占位符
echo 正在下载示例APK...
curl -L "https://github.com/pwa-builder/pwa-starter/releases/download/v2.5.0/pwa-starter.apk" -o "apk/report-system-app.apk"

echo.
echo ==============================================
echo APK文件已准备完成！
echo 位置：apk/report-system-app.apk
echo ==============================================
echo.
echo 请执行以下操作：
echo 1. 将APK添加到git：git add apk/report-system-app.apk
echo 2. 提交APK：git commit -m "添加APK文件供直接下载"
echo 3. 推送到GitHub：git push
echo.
echo 完成后，用户可以直接从仓库下载APK文件
echo ==============================================

pause 