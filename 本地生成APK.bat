@echo off
echo ===================================================
echo 報告系統 - 本地APK打包工具
echo ===================================================
echo.
echo 正在尝试在本地生成APK文件...
echo.
echo 步骤1: 安装必要的依赖
echo ===================================================
call npm install --save-dev @expo/cli @expo/webpack-config

echo.
echo 步骤2: 更新expo-cli工具
echo ===================================================
call npx expo install expo-cli

echo.
echo 步骤3: 准备Android构建环境
echo ===================================================
call npx expo prebuild --platform android --clean

echo.
echo 步骤4: 尝试使用开发客户端构建APK
echo ===================================================
call npx expo run:android --variant release

echo.
echo 如果生成成功，APK将位于: android/app/build/outputs/apk/release/
echo.
echo 如果上述方法失败，尝试使用expo-cli直接构建：
call npx eas build --local --platform android --profile preview
echo.

echo ===================================================
echo 完成!
echo ===================================================
echo.
pause 