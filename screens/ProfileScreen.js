import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, List, Avatar, Card, Divider, Dialog, Portal, TextInput } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// 字體選項
const FONT_FAMILIES = [
  { label: '楷體', value: 'KaiTi, 楷體, serif' },
  { label: '宋體', value: 'SimSun, 宋體, serif' },
  { label: '黑體', value: 'SimHei, 黑體, sans-serif' },
  { label: '微軟雅黑', value: 'Microsoft YaHei, 微軟雅黑, sans-serif' }
];

export default function ProfileScreen({ navigation }) {
  const [userInfo, setUserInfo] = useState({
    username: '',
    realName: '',
    avatar: null,
    loginType: '',
  });
  
  // 報告抬頭信息
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    companyNameEn: '',
    email: '',
    phone: '',
    fax: '',
    address: '',
    logo: null,
    seal: null // 公司蓋章
  });

  // PDF頁面設置
  const [pdfSettings, setPdfSettings] = useState({
    margins: {
      top: 15,     // 頂部邊距 (mm)
      right: 10,   // 右側邊距 (mm)
      bottom: 15,  // 底部邊距 (mm)
      left: 10,    // 左側邊距 (mm)
    },
    header: {
      height: 150,           // 抬頭高度 (px)
      companyNameFontSize: 16, // 公司名稱字體大小 (pt)
      companyEnNameFontSize: 12, // 公司英文名稱字體大小 (pt)
      contactInfoFontSize: 10,  // 聯繫信息字體大小 (pt)
      layout: 'horizontal',    // 抬頭布局: horizontal (水平) 或 vertical (垂直)
    },
    footer: {
      height: 40,            // 頁腳高度 (px)
      fontSize: 10,          // 頁腳字體大小 (pt)
    },
    images: {
      height: 180,           // 圖片框高度 (px)
      gap: 10,               // 圖片間距 (px)
    },
    fonts: {
      family: 'KaiTi, 楷體, serif', // 默認字體
      size: 11,              // 正文字體大小 (pt)
    }
  });
  
  // 簽名相關狀態
  const [signature, setSignature] = useState(null);
  const [userInfoDialogVisible, setUserInfoDialogVisible] = useState(false);
  const [editingRealName, setEditingRealName] = useState('');
  
  // PDF頁面設置對話框
  const [pageSettingsVisible, setPageSettingsVisible] = useState(false);
  const PDF_SETTINGS_KEY = 'pdfPageSettings';

  // 當前查看的設置類型
  const [currentSettingType, setCurrentSettingType] = useState('margins');

  useEffect(() => {
    loadUserInfo();
    loadCompanyInfo();
    loadSignature();
    loadPdfSettings();
  }, []);

  // 當從編輯頁面返回時，重新加載數據
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCompanyInfo();
      loadSignature();
      loadPdfSettings();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserInfo = async () => {
    try {
      const userInfoStr = await SecureStore.getItemAsync('userInfo');
      if (userInfoStr) {
        setUserInfo(JSON.parse(userInfoStr));
      }
    } catch (error) {
      console.log('獲取用戶信息失敗', error);
    }
  };
  
  // 加載公司信息
  const loadCompanyInfo = async () => {
    try {
      const info = await AsyncStorage.getItem('companyInfo');
      if (info) {
        setCompanyInfo(JSON.parse(info));
      }
    } catch (error) {
      console.log('獲取公司信息失敗', error);
    }
  };
  
  // 加載簽名
  const loadSignature = async () => {
    try {
      const signatureUri = await AsyncStorage.getItem('signature');
      if (signatureUri) {
        setSignature(signatureUri);
      }
    } catch (error) {
      console.log('獲取簽名失敗', error);
    }
  };
  
  // 加載PDF頁面設置
  const loadPdfSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(PDF_SETTINGS_KEY);
      if (savedSettings) {
        setPdfSettings(JSON.parse(savedSettings));
        console.log('已加載保存的PDF頁面設置');
      }
    } catch (error) {
      console.log('讀取PDF頁面設置失敗:', error);
    }
  };
  
  // 保存PDF頁面設置
  const savePdfSettings = async () => {
    try {
      await AsyncStorage.setItem(PDF_SETTINGS_KEY, JSON.stringify(pdfSettings));
      setPageSettingsVisible(false);
      Alert.alert('成功', 'PDF頁面設置已保存');
      console.log('PDF頁面設置已保存');
    } catch (error) {
      console.log('保存PDF頁面設置失敗:', error);
      Alert.alert('錯誤', '保存設置失敗，請重試');
    }
  };
  
  // 保存用戶信息
  const saveUserInfo = async (info) => {
    try {
      await SecureStore.setItemAsync('userInfo', JSON.stringify(info));
      setUserInfo(info);
      Alert.alert('成功', '用戶信息已更新');
    } catch (error) {
      console.log('保存用戶信息失敗', error);
      Alert.alert('錯誤', '保存用戶信息失敗');
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userInfo');
      
      // 不使用 navigation.reset，而是通知 App.js 更新登录状态
      // 这将触发 App.js 中的 useEffect 重新检查登录状态
      navigation.navigate('Main');
      
      // 强制刷新应用状态
      setTimeout(() => {
        // 这会触发 App.js 中的 useEffect 重新执行
        SecureStore.setItemAsync('_forceRefresh', Date.now().toString());
      }, 100);
    } catch (error) {
      console.log('登出錯誤', error);
      Alert.alert('錯誤', '退出登錄失敗，請重試');
    }
  };
  
  // 導航到公司信息編輯頁面
  const navigateToCompanyInfoEdit = (fieldType, initialValue) => {
    navigation.navigate('CompanyInfoEdit', { fieldType, initialValue });
  };
  
  // 導航到公司抬頭設置頁面
  const navigateToCompanyHeaderSettings = () => {
    navigation.navigate('CompanyHeaderSettings', { companyInfo });
  };
  
  // 導航到PDF頁面設置頁面
  const navigateToPdfSettings = () => {
    navigation.navigate('PdfSettings', { pdfSettings });
  };
  
  // 導航到簽名編輯頁面
  const navigateToSignatureEdit = () => {
    navigation.navigate('SignatureEdit');
  };
  
  // 打開用戶信息對話框
  const showUserInfoDialog = () => {
    setEditingRealName(userInfo.realName || '');
    setUserInfoDialogVisible(true);
  };
  
  // 關閉用戶信息對話框
  const hideUserInfoDialog = () => {
    setUserInfoDialogVisible(false);
  };
  
  // 保存用戶信息
  const handleSaveUserInfo = () => {
    const updatedUserInfo = {
      ...userInfo,
      realName: editingRealName
    };
    saveUserInfo(updatedUserInfo);
    hideUserInfoDialog();
  };
  
  // 選擇用戶頭像
  const pickUserAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要權限', '需要訪問您的媒體庫才能選擇圖片');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // 創建目錄（如果不存在）
        const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'avatar/');
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'avatar/', { intermediates: true });
        }
        
        // 創建唯一文件名並保存到應用目錄
        const fileName = `avatar_${Date.now()}.jpg`;
        const newUri = FileSystem.documentDirectory + 'avatar/' + fileName;
        
        // 複製圖片到應用目錄
        await FileSystem.copyAsync({
          from: selectedImage.uri,
          to: newUri
        });
        
        // 更新用戶信息
        const updatedUserInfo = {
          ...userInfo,
          avatar: newUri
        };
        saveUserInfo(updatedUserInfo);
      }
    } catch (error) {
      console.log('選擇頭像失敗', error);
      Alert.alert('錯誤', '選擇頭像失敗，請重試');
    }
  };

  const renderUserAvatar = () => {
    if (userInfo.avatar) {
      return (
        <Avatar.Image 
          size={80} 
          source={{ uri: userInfo.avatar }}
          backgroundColor="#007AFF" 
        />
      );
    } else {
      return (
        <Avatar.Text 
          size={80} 
          label={userInfo.username ? userInfo.username.substring(0, 1).toUpperCase() : "U"} 
          backgroundColor="#007AFF" 
        />
      );
    }
  };

  // 同步數據到服務器
  const syncDataToServer = async () => {
    try {
      setIsSyncing(true);
      setSyncOperation('upload');
      setSyncDialogVisible(true);
      setSyncStatus('開始同步數據...');
      setSyncProgress(0);

      // 收集需要同步的數據
      const dataToSync = {};
      
      // 1. 項目數據
      setSyncStatus('正在同步項目數據...');
      setSyncProgress(0.1);
      const projectsData = await AsyncStorage.getItem('projects');
      if (projectsData) {
        dataToSync.projects = JSON.parse(projectsData);
      }
      
      // 2. 報告類型
      setSyncStatus('正在同步報告類型...');
      setSyncProgress(0.2);
      const reportTypesData = await AsyncStorage.getItem('reportTypes');
      if (reportTypesData) {
        dataToSync.reportTypes = JSON.parse(reportTypesData);
      }
      
      // 3. 公司信息
      setSyncStatus('正在同步公司信息...');
      setSyncProgress(0.3);
      const companyInfoData = await AsyncStorage.getItem('companyInfo');
      if (companyInfoData) {
        dataToSync.companyInfo = JSON.parse(companyInfoData);
      }
      
      // 4. PDF頁面設置
      setSyncStatus('正在同步PDF設置...');
      setSyncProgress(0.4);
      const pdfSettingsData = await AsyncStorage.getItem('pdfPageSettings');
      if (pdfSettingsData) {
        dataToSync.pdfSettings = JSON.parse(pdfSettingsData);
      }
      
      // 5. 簽名數據
      setSyncStatus('正在同步簽名數據...');
      setSyncProgress(0.5);
      const signatureData = await AsyncStorage.getItem('signature');
      if (signatureData) {
        dataToSync.signature = signatureData;
      }

      // 將數據轉換為JSON字符串
      const jsonData = JSON.stringify(dataToSync);
      
      // 模擬服務器上傳延遲
      setSyncStatus('正在上傳到服務器...');
      setSyncProgress(0.7);
      
      // 使用FileSystem將數據保存到本地文件作為備份
      const backupFileName = `sync_backup_${Date.now()}.json`;
      const backupFilePath = FileSystem.documentDirectory + backupFileName;
      
      await FileSystem.writeAsStringAsync(backupFilePath, jsonData);
      
      // 在實際應用中，這裡應該使用API將數據上傳到服務器
      // 目前只是模擬上傳
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSyncStatus('同步完成！');
      setSyncProgress(1);
      
      // 延遲關閉對話框
      setTimeout(() => {
        setSyncDialogVisible(false);
        setIsSyncing(false);
        Alert.alert(
          '同步成功',
          `數據已成功同步到服務器。\n\n備份文件已保存至:\n${backupFileName}`
        );
      }, 1000);
      
    } catch (error) {
      console.error('數據同步失敗:', error);
      setSyncDialogVisible(false);
      setIsSyncing(false);
      Alert.alert('同步失敗', '數據同步過程中發生錯誤，請重試。');
    }
  };

  // 從服務器下載數據
  const downloadDataFromServer = async () => {
    try {
      setIsSyncing(true);
      setSyncOperation('download');
      setSyncDialogVisible(true);
      setSyncStatus('準備下載數據...');
      setSyncProgress(0);

      // 模擬從服務器下載數據
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSyncStatus('正在下載數據...');
      setSyncProgress(0.3);
      
      // 在實際應用中，這裡應該使用API從服務器獲取數據
      // 目前只是模擬下載，使用之前保存的備份文件
      
      // 列出文件目錄，查找最新的備份文件
      setSyncStatus('正在讀取同步數據...');
      setSyncProgress(0.5);
      
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const backupFiles = files.filter(file => file.startsWith('sync_backup_')).sort().reverse();
      
      if (backupFiles.length === 0) {
        throw new Error('沒有找到備份數據');
      }
      
      const latestBackupFile = backupFiles[0];
      const backupFilePath = FileSystem.documentDirectory + latestBackupFile;
      
      // 讀取備份文件
      const jsonData = await FileSystem.readAsStringAsync(backupFilePath);
      const serverData = JSON.parse(jsonData);
      
      // 保存數據到本地
      setSyncStatus('正在保存數據到本地...');
      setSyncProgress(0.7);
      
      if (serverData.projects) {
        await AsyncStorage.setItem('projects', JSON.stringify(serverData.projects));
      }
      
      if (serverData.reportTypes) {
        await AsyncStorage.setItem('reportTypes', JSON.stringify(serverData.reportTypes));
      }
      
      if (serverData.companyInfo) {
        await AsyncStorage.setItem('companyInfo', JSON.stringify(serverData.companyInfo));
        setCompanyInfo(serverData.companyInfo);
      }
      
      if (serverData.pdfSettings) {
        await AsyncStorage.setItem('pdfPageSettings', JSON.stringify(serverData.pdfSettings));
        setPdfSettings(serverData.pdfSettings);
      }
      
      if (serverData.signature) {
        await AsyncStorage.setItem('signature', serverData.signature);
        setSignature(serverData.signature);
      }
      
      setSyncStatus('下載完成！');
      setSyncProgress(1);
      
      // 延遲關閉對話框
      setTimeout(() => {
        setSyncDialogVisible(false);
        setIsSyncing(false);
        Alert.alert(
          '下載成功', 
          '數據已從服務器同步到本地。請重新啟動應用程序以查看更新的數據。'
        );
      }, 1000);
      
    } catch (error) {
      console.error('數據下載失敗:', error);
      setSyncDialogVisible(false);
      setIsSyncing(false);
      Alert.alert('下載失敗', `數據下載過程中發生錯誤: ${error.message}`);
    }
  };

  const navigateToDataManagement = () => {
    navigation.navigate('DataManagement');
  };

  return (
    <ScrollView style={styles.container}>
      {/* 用戶信息卡片 */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <TouchableOpacity style={styles.profileHeader} onPress={pickUserAvatar}>
            {renderUserAvatar()}
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{userInfo.username || '未登錄'}</Text>
              {userInfo.realName && userInfo.realName !== userInfo.username && (
                <Text style={styles.realName}>{userInfo.realName}</Text>
              )}
              <Text style={styles.userRole}>
                {userInfo.loginType === 'wechat' ? '微信用戶' : '管理員'}
              </Text>
              <Text style={styles.editHint}>點擊頭像更換</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              onPress={showUserInfoDialog}
              style={styles.actionButton}
              icon="account-edit"
            >
              編輯資料
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={handleLogout}
              style={styles.actionButton}
              icon="logout"
            >
              退出登錄
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      {/* 設置列表 */}
      <List.Section>
        <List.Subheader style={styles.sectionHeader}>系統設置</List.Subheader>
        
        {/* 報告抬頭信息 - 集合為單一列表項 */}
        <List.Item
          title="報告抬頭信息"
          description="公司名稱、Logo、聯繫方式等"
          left={props => <List.Icon {...props} icon="office-building" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={navigateToCompanyHeaderSettings}
        />
        <Divider />
        
        {/* PDF頁面設置 - 集合為單一列表項 */}
        <List.Item
          title="PDF頁面設置"
          description="邊距、抬頭、圖片、字體等"
          left={props => <List.Icon {...props} icon="file-pdf-box" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={navigateToPdfSettings}
        />
        <Divider />
        
        {/* 報告簽名 */}
        <List.Item
          title="報告簽名"
          description={signature ? "已設置" : "未設置"}
          left={props => <List.Icon {...props} icon="draw" />}
          onPress={navigateToSignatureEdit}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        
        {/* 公司蓋章 */}
        <List.Item
          title="公司蓋章"
          description={companyInfo.seal ? "已設置" : "未設置"}
          left={props => <List.Icon {...props} icon="stamper" />}
          onPress={() => navigateToCompanyInfoEdit('seal', companyInfo.seal)}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>
      
      {/* 數據管理部分 */}
      <List.Section>
        <List.Subheader style={styles.sectionHeader}>數據管理</List.Subheader>
        
        {/* 數據管理 */}
        <List.Item
          title="數據管理"
          description="上傳、恢復和刪除數據"
          left={props => <List.Icon {...props} icon="cloud-sync" color="#4CAF50" />}
          onPress={navigateToDataManagement}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>
      
      {/* 用戶信息對話框 */}
      <Portal>
        <Dialog visible={userInfoDialogVisible} onDismiss={hideUserInfoDialog}>
          <Dialog.Title>編輯個人資料</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="姓名"
              value={editingRealName}
              onChangeText={setEditingRealName}
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideUserInfoDialog}>取消</Button>
            <Button onPress={handleSaveUserInfo}>保存</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  profileCard: {
    margin: 16,
    borderRadius: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  realName: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  editHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#F2F2F7',
  },
  listItemImage: {
    width: 60,
    height: 30,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signaturePreviewContainer: {
    padding: 16,
    alignItems: 'center',
  },
  signaturePreview: {
    width: '100%',
    height: 100,
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
  },
  signaturePlaceholder: {
    height: 100,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  placeholderText: {
    color: '#999',
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  dialogInput: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  // 新增樣式
  syncDialogContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  syncIndicator: {
    marginBottom: 15,
  },
  syncStatusText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  syncProgress: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
  warningText: {
    color: '#F44336',
    marginBottom: 10,
    lineHeight: 20,
  },
}); 