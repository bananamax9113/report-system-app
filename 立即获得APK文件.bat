@echo off
chcp 65001 >nul
title 立即获得APK文件
color 0E

echo ==========================================
echo        立即获得APK文件指南
echo ==========================================
echo.
echo ❗ 当前状态：项目中没有APK文件
echo.
echo 🎯 获得APK的两种快速方法：
echo.
echo ────────────────────────────────────────
echo 方法1: 在线APK生成器 (推荐 - 5分钟)
echo ────────────────────────────────────────
echo.
echo 步骤1: 访问 https://www.pwabuilder.com/
echo 步骤2: 输入地址 http://localhost:3000
echo 步骤3: 点击 Start 然后选择 Android
echo 步骤4: 下载APK文件
echo.
echo 💡 本地服务器正在运行在端口3000
echo.
echo ────────────────────────────────────────
echo 方法2: 安装Android Studio (传统方法)
echo ────────────────────────────────────────
echo.
echo 步骤1: 下载 Android Studio
echo        https://developer.android.com/studio
echo 步骤2: 安装并打开
echo 步骤3: 打开项目的 android/ 文件夹
echo 步骤4: Build ^> Build Bundle(s)/APK(s) ^> Build APK(s)
echo 步骤5: APK位置：android/app/build/outputs/apk/debug/
echo.
echo ========================================
echo 🚀 立即行动
echo ========================================
echo.

set /p user_action="选择方法 [1]在线生成器 [2]Android Studio [Enter]打开网站: "

if "%user_action%"=="2" (
    echo 正在打开Android Studio下载页面...
    start "Android Studio" "https://developer.android.com/studio"
) else (
    echo 正在打开PWABuilder网站...
    start "PWABuilder" "https://www.pwabuilder.com/"
    echo.
    echo 💡 请在网站中输入: http://localhost:3000
    echo 💡 然后按照上述步骤操作
)

echo.
echo ⚠️  重要提醒：
echo   - 确保本地服务器正在运行
echo   - 方法1生成的APK功能完全相同
echo   - 如有问题请查看详细说明文档
echo.
pause 