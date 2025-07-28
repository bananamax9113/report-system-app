import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, Appbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

export default function CompanyInfoEditScreen({ navigation, route }) {
  const { fieldType, initialValue } = route.params;
  const [value, setValue] = useState(initialValue || '');
  const [companyInfo, setCompanyInfo] = useState(null);
  
  // 加載公司信息
  useEffect(() => {
    loadCompanyInfo();
  }, []);
  
  const loadCompanyInfo = async () => {
    try {
      const info = await AsyncStorage.getItem('companyInfo');
      if (info) {
        setCompanyInfo(JSON.parse(info));
      } else {
        setCompanyInfo({
          companyName: '',
          companyNameEn: '',
          email: '',
          phone: '',
          fax: '',
          logo: null,
          seal: null // 公司蓋章
        });
      }
    } catch (error) {
      console.log('獲取公司信息失敗', error);
      Alert.alert('錯誤', '獲取公司信息失敗');
    }
  };
  
  // 保存公司信息
  const saveCompanyInfo = async (updatedInfo) => {
    try {
      await AsyncStorage.setItem('companyInfo', JSON.stringify(updatedInfo));
      Alert.alert('成功', '保存成功');
      navigation.goBack();
    } catch (error) {
      console.log('保存公司信息失敗', error);
      Alert.alert('錯誤', '保存失敗，請重試');
    }
  };
  
  // 選擇公司Logo或蓋章
  const pickCompanyImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要權限', '需要訪問您的媒體庫才能選擇圖片');
        return;
      }
      
      // 根據當前編輯的字段類型決定縱橫比
      const aspect = fieldType === 'logo' ? [3, 1] : [1, 1]; // logo是3:1，蓋章是1:1的比例
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspect,
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // 創建目錄（如果不存在）
        const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'company/');
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'company/', { intermediates: true });
        }
        
        // 創建唯一文件名並保存到應用目錄
        const prefix = fieldType === 'logo' ? 'logo_' : 'seal_';
        const fileName = `${prefix}${Date.now()}.jpg`;
        const newUri = FileSystem.documentDirectory + 'company/' + fileName;
        
        // 複製圖片到應用目錄
        await FileSystem.copyAsync({
          from: selectedImage.uri,
          to: newUri
        });
        
        // 更新值
        setValue(newUri);
      }
    } catch (error) {
      console.log('選擇圖片失敗', error);
      Alert.alert('錯誤', `選擇${fieldType === 'logo' ? 'Logo' : '蓋章'}失敗，請重試`);
    }
  };
  
  // 保存更改
  const handleSave = () => {
    if (!companyInfo) return;
    
    const updatedInfo = { ...companyInfo };
    
    switch (fieldType) {
      case 'logo':
        updatedInfo.logo = value;
        break;
      case 'seal': // 新增蓋章處理
        updatedInfo.seal = value;
        break;
      case 'companyName':
        updatedInfo.companyName = value;
        break;
      case 'companyNameEn':
        updatedInfo.companyNameEn = value;
        break;
      case 'email':
        updatedInfo.email = value;
        break;
      case 'phone':
        updatedInfo.phone = value;
        break;
      case 'fax':
        updatedInfo.fax = value;
        break;
      case 'address':
        updatedInfo.address = value;
        break;
      default:
        break;
    }
    
    saveCompanyInfo(updatedInfo);
  };
  
  // 獲取標題
  const getTitle = () => {
    switch (fieldType) {
      case 'logo':
        return '編輯公司Logo';
      case 'seal':
        return '編輯公司蓋章';
      case 'companyName':
        return '編輯公司名稱';
      case 'companyNameEn':
        return '編輯英文名稱';
      case 'email':
        return '編輯電子郵箱';
      case 'phone':
        return '編輯聯繫電話';
      case 'fax':
        return '編輯傳真';
      default:
        return '編輯信息';
    }
  };
  
  // 獲取鍵盤類型
  const getKeyboardType = () => {
    switch (fieldType) {
      case 'email':
        return 'email-address';
      case 'phone':
      case 'fax':
        return 'phone-pad';
      default:
        return 'default';
    }
  };
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={getTitle()} />
        <Appbar.Action icon="check" onPress={handleSave} />
      </Appbar.Header>
      
      <ScrollView style={styles.content}>
        {fieldType === 'logo' || fieldType === 'seal' ? (
          <View style={styles.logoContainer}>
            {value ? (
              <Image 
                source={{ uri: value }} 
                style={fieldType === 'logo' ? styles.logoPreview : styles.sealPreview}
                resizeMode="contain"
              />
            ) : (
              <View style={fieldType === 'logo' ? styles.logoPlaceholder : styles.sealPlaceholder}>
                <Ionicons 
                  name={fieldType === 'logo' ? "business-outline" : "shield-outline"} 
                  size={60} 
                  color="#999" 
                />
                <Text style={styles.placeholderText}>
                  未設置公司{fieldType === 'logo' ? 'Logo' : '蓋章'}
                </Text>
              </View>
            )}
            
            <Button 
              mode="contained" 
              onPress={pickCompanyImage}
              style={styles.logoButton}
            >
              選擇{fieldType === 'logo' ? 'Logo' : '蓋章'}
            </Button>
          </View>
        ) : (
          <TextInput
            label={getTitle()}
            value={value}
            onChangeText={setValue}
            mode="outlined"
            style={styles.input}
            keyboardType={getKeyboardType()}
            autoFocus
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    backgroundColor: 'white',
    marginTop: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoPreview: {
    width: '100%',
    height: 120,
    marginBottom: 20,
  },
  sealPreview: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 20,
  },
  sealPlaceholder: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 75, // 圓形蓋章
    marginBottom: 20,
  },
  placeholderText: {
    color: '#999',
    marginTop: 8,
  },
  logoButton: {
    marginTop: 10,
  },
}); 