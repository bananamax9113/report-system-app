import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, Portal, Dialog } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import Database from '../utils/database';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  // 在組件掛載時初始化數據庫
  useEffect(() => {
    Database.initialize();
    console.log('登錄界面已加載');
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('提示', '請輸入用戶名和密碼');
      return;
    }

    setLoading(true);
    
    try {
      // 使用數據庫驗證用戶
      const result = await Database.Users.authenticate(username, password);
      
      if (result.success) {
        // 登錄成功，保存用戶信息和令牌
        const userInfo = {
          ...result.user,
          token: 'user-token-' + Date.now()
        };
        
        await SecureStore.setItemAsync('userToken', userInfo.token);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));
        
        // 不使用 navigation.reset，而是通知 App.js 更新登錄狀態
        // 這將觸發 App.js 中的 useEffect 重新檢查登錄狀態
        await SecureStore.setItemAsync('_forceRefresh', Date.now().toString());
        
        // 顯示成功訊息
        Alert.alert('成功', '登錄成功！', [
          { 
            text: '確定',
            onPress: () => {
              // 這裡不做任何導航操作，讓 App.js 的狀態更新來處理導航
            }
          }
        ]);
      } else {
        // 登錄失敗
        Alert.alert('錯誤', result.message || '用戶名或密碼錯誤');
      }
    } catch (error) {
      console.log('登錄錯誤', error);
      Alert.alert('錯誤', '登錄失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  // 統一按鈕高度
  const BUTTON_HEIGHT = 50;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>報告</Text>
        </View>
        <Text style={styles.title}>報告系統</Text>
      </View>
      
      <View style={styles.formContainerWrapper}>
        <Surface style={styles.formContainer} theme={{ roundness: 20 }}>
          <TextInput
            label="用戶名"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            theme={{ roundness: 16 }} // 添加大圓角
          />
          
          <TextInput
            label="密碼"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
            theme={{ roundness: 16 }} // 添加大圓角
            autoComplete="off"
            textContentType="none"
            right={
              <TextInput.Icon
                icon={secureTextEntry ? 'eye-off' : 'eye'}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />
          
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            contentStyle={{ height: BUTTON_HEIGHT }}
            loading={loading}
            disabled={loading}
          >
            登錄
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerButton}
            labelStyle={styles.registerButtonLabel}
            contentStyle={{ height: BUTTON_HEIGHT }}
            disabled={loading}
          >
            還沒有賬號？立即註冊
          </Button>
        </Surface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 12, // 減小頁面邊距
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  formContainerWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  formContainer: {
    padding: 20,
    borderRadius: 20, // 更大的圓角
    elevation: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    borderRadius: 16, // 大圓角按鈕
    height: 50, // 固定高度
  },
  registerButton: {
    marginTop: 16,
    height: 50, // 固定高度
  },
  registerButtonLabel: {
    color: '#007AFF',
  },
}); 