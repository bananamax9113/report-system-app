
@echo off
chcp 65001
echo 正在使用指定的IP和端口啟動...
set EXPO_DEBUG=true
set EXPO_DEVTOOLS_LISTEN_ADDRESS=192.168.1.222
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.222
set EXPO_WEB_UI_LISTEN_ADDRESS=192.168.1.222
set EXPO_PACKAGER_PORT=8080
set EXPO_WEB_UI_PORT=8080

echo 啟動Expo服務器...
call npx expo start --port 8080 --lan

pause
