import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, IconButton } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import Database from '../utils/database';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);

  // 在組件掛載時初始化數據庫
  useEffect(() => {
    Database.initialize();
  }, []);

  const handleRegister = async () => {
    // 驗證輸入
    if (!username || !password || !confirmPassword) {
      Alert.alert('提示', '請填寫所有必填字段');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('提示', '兩次輸入的密碼不一致');
      return;
    }

    // 驗證用戶名（僅允許字母、數字和下劃線）
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('提示', '用戶名只能包含字母、數字和下劃線');
      return;
    }

    // 如果提供了真實姓名，則驗證（允許中文、英文字母和空格）
    if (realName) {
      const nameRegex = /^[\u4e00-\u9fa5a-zA-Z\s]+$/;
      if (!nameRegex.test(realName)) {
        Alert.alert('提示', '真實姓名只能包含中文、英文字母和空格');
        return;
      }
    }

    setLoading(true);

    try {
      // 使用數據庫添加用戶
      const result = await Database.Users.add({
        username: username,
        password: password,
        realName: realName || username // 如果沒有提供真實姓名，則使用用戶名
      });

      if (result.success) {
        // 註冊成功，自動登錄用戶
        const userInfo = {
          ...result.user,
          token: 'new-user-token-' + Date.now()
        };
        
        await SecureStore.setItemAsync('userToken', userInfo.token);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));
        
        // 不使用 navigation.reset，而是通知 App.js 更新登錄狀態
        await SecureStore.setItemAsync('_forceRefresh', Date.now().toString());
        
        // 顯示成功訊息
        Alert.alert('成功', '註冊成功！', [
          { 
            text: '確定',
            onPress: () => {
              // 這裡不做任何導航操作，讓 App.js 的狀態更新來處理導航
            }
          }
        ]);
      } else {
        // 註冊失敗
        Alert.alert('錯誤', result.message || '註冊失敗，請重試');
      }
    } catch (error) {
      console.log('註冊錯誤', error);
      Alert.alert('錯誤', '註冊失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  // 統一按鈕高度
  const BUTTON_HEIGHT = 50;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="dark" />
      
      <View style={styles.headerContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>創建賬號</Text>
        <View style={styles.placeholder}></View>
      </View>
      
      <Surface style={styles.formContainer}>
        <TextInput
          label="用戶名 *"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          theme={{ roundness: 16 }}
          placeholder="僅允許字母、數字和下劃線"
        />
        
        <TextInput
          label="真實姓名"
          value={realName}
          onChangeText={setRealName}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          theme={{ roundness: 16 }}
          placeholder="選填，用於報告顯示"
        />
        
        <TextInput
          label="密碼 *"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureTextEntry}
          mode="outlined"
          style={styles.input}
          theme={{ roundness: 16 }}
          autoComplete="off"
          textContentType="none"
          right={
            <TextInput.Icon
              icon={secureTextEntry ? 'eye-off' : 'eye'}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
            />
          }
        />
        
        <TextInput
          label="確認密碼 *"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={confirmSecureTextEntry}
          mode="outlined"
          style={styles.input}
          theme={{ roundness: 16 }}
          autoComplete="off"
          textContentType="none"
          right={
            <TextInput.Icon
              icon={confirmSecureTextEntry ? 'eye-off' : 'eye'}
              onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
            />
          }
        />
        
        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.registerButton}
          contentStyle={{ height: BUTTON_HEIGHT }}
          loading={loading}
          disabled={loading}
        >
          註冊
        </Button>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>已有賬號？返回登錄</Text>
        </TouchableOpacity>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    padding: 12, // 減小邊距
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    marginLeft: -10,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  formContainer: {
    padding: 20,
    borderRadius: 20, // 大圓角
    elevation: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  registerButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    borderRadius: 16, // 大圓角按鈕
    height: 50, // 固定高度
  },
  loginLink: {
    marginTop: 20,
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '500',
  },
}); 