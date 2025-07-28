@echo off
echo 正在發布應用更新到Expo服務器...
set EAS_NO_VCS=1
npx eas-cli update --branch preview --message "ReportSystem 1.0"

echo.
echo 如果發布成功，您可以在以下URL查看更新:
echo https://expo.dev/accounts/bananamax/projects/report-system-app

echo.
echo 用戶可以通過ExpoLink.html中的QR碼訪問您的應用
echo.
pause 