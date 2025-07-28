@echo off
echo ===================================================
echo 報告系統 - 使用Gradle直接构建APK
echo ===================================================
echo.

echo 尝试使用Android项目中的Gradle直接构建APK...
echo.

cd android

echo 步骤1: 执行gradlew clean
echo ===================================================
call ./gradlew clean

echo.
echo 步骤2: 执行gradlew assembleRelease
echo ===================================================
call ./gradlew assembleRelease

echo.
echo 如果构建成功，APK将位于: 
echo android/app/build/outputs/apk/release/app-release.apk
echo.

echo ===================================================
echo 完成!
echo ===================================================
echo.

cd ..

pause 