import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// 導入頁面組件
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import SplashScreen from './screens/SplashScreen';
import Database from './utils/database';

const Stack = createNativeStackNavigator();

// 定義主題，參考iOS風格
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF', // iOS 藍色
    accent: '#FF9500',  // iOS 橙色
    background: '#F2F2F7', // iOS 淺灰背景
  },
  roundness: 16, // 大圓角設計，符合iOS 16以上的UI風格
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // 初始化數據庫並檢查登錄狀態
    const initialize = async () => {
      try {
        // 初始化數據庫
        await Database.initialize();
        
        // 檢查是否已經登錄
        const token = await SecureStore.getItemAsync('userToken');
        setUserToken(token);
        
        // 檢查是否有強制刷新的信號
        const forceRefresh = await SecureStore.getItemAsync('_forceRefresh');
        if (forceRefresh) {
          // 清除強制刷新信號
          await SecureStore.deleteItemAsync('_forceRefresh');
        }
      } catch (e) {
        console.log('初始化失敗', e);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
    
    // 設置一個定時器來定期檢查登錄狀態
    const intervalId = setInterval(async () => {
      const token = await SecureStore.getItemAsync('userToken');
      if (token !== userToken) {
        setUserToken(token);
      }
      
      // 檢查是否有強制刷新的信號
      const forceRefresh = await SecureStore.getItemAsync('_forceRefresh');
      if (forceRefresh) {
        // 清除強制刷新信號
        await SecureStore.deleteItemAsync('_forceRefresh');
        // 觸發刷新
        setRefreshTrigger(prev => prev + 1);
      }
    }, 1000);
    
    // 清理定時器
    return () => clearInterval(intervalId);
  }, [refreshTrigger]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator 
            screenOptions={{
              headerShown: false,
              gestureEnabled: true, // 啟用屏幕左側滑動返回
              gestureDirection: 'horizontal', // 設置滑動方向為水平
              animation: 'slide_from_right', // 從右側滑入的動畫
            }}
          >
            {userToken == null ? (
              // 用戶未登錄，顯示登錄相關頁面
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            ) : (
              // 用戶已登錄，顯示主應用頁面
              <Stack.Screen name="Main" component={MainTabNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
} 