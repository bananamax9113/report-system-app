import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { List, Divider, Text, Portal, Dialog, Button, ActivityIndicator, ProgressBar, IconButton, Card, Surface } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

export default function DataManagement({ navigation }) {
  const [syncDialogVisible, setSyncDialogVisible] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncOperation, setSyncOperation] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [clearDataDialogVisible, setClearDataDialogVisible] = useState(false);
  const [clearReportsDialogVisible, setClearReportsDialogVisible] = useState(false);
  const [backupFiles, setBackupFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [actionType, setActionType] = useState('');
  
  // 創建一個ref對象來存儲所有swipeables的引用
  const swipeableRefs = useRef({});
  
  // 關閉指定ID的swipeable
  const closeSwipeable = (id) => {
    if (swipeableRefs.current[id]) {
      swipeableRefs.current[id].close();
    }
  };
  
  // 關閉所有swipeables
  const closeAllSwipeables = () => {
    Object.values(swipeableRefs.current).forEach(ref => {
      if (ref && typeof ref.close === 'function') {
        ref.close();
      }
    });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '數據管理'
    });
  }, [navigation]);

  // 格式化日期時間為文件名
  const formatDateTimeForFileName = (date) => {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
  };

  // 格式化日期時間為顯示
  const formatDateTimeForDisplay = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  // 加載已上傳的同步數據列表
  const loadBackupFiles = useCallback(async () => {
    try {
      setLoading(true);
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const syncFiles = files
        .filter(file => file.startsWith('sync_backup_'))
        .sort((a, b) => {
          // 從文件名中提取時間戳
          const timestampA = parseInt(a.replace('sync_backup_', '').replace('.json', ''));
          const timestampB = parseInt(b.replace('sync_backup_', '').replace('.json', ''));
          return timestampB - timestampA; // 降序排列，最新的在前面
        })
        .map(async (fileName) => {
          const filePath = FileSystem.documentDirectory + fileName;
          let displayDate = '';
          let timestamp = parseInt(fileName.replace('sync_backup_', '').replace('.json', ''));
          
          // 嘗試從文件內容中讀取備份日期信息
          try {
            const fileContent = await FileSystem.readAsStringAsync(filePath);
            const fileData = JSON.parse(fileContent);
            if (fileData.backupInfo && fileData.backupInfo.createdAt) {
              displayDate = fileData.backupInfo.createdAt;
            } else {
              // 如果沒有備份信息，則從文件名中提取日期
              const date = new Date(timestamp);
              displayDate = formatDateTimeForDisplay(date);
            }
          } catch (err) {
            // 如果讀取失敗，則從文件名中提取日期
            const date = new Date(timestamp);
            displayDate = formatDateTimeForDisplay(date);
          }
          
          return {
            id: fileName,
            fileName: fileName,
            timestamp: timestamp,
            date: displayDate,
            path: filePath
          };
        });
        
      // 等待所有Promise完成
      const syncFilesResolved = await Promise.all(syncFiles);
      setBackupFiles(syncFilesResolved);
      setLoading(false);
    } catch (error) {
      console.error('加載備份文件失敗:', error);
      setLoading(false);
      Alert.alert('錯誤', '加載同步數據列表失敗');
    }
  }, []);

  // 頁面獲得焦點時重新加載數據
  useFocusEffect(
    useCallback(() => {
      loadBackupFiles();
      return () => {
        // 離開頁面時關閉所有swipeable項
        closeAllSwipeables();
      };
    }, [loadBackupFiles])
  );

  // 從特定備份文件恢復數據
  const restoreFromBackup = async (backupFile) => {
    try {
      setIsSyncing(true);
      setSyncOperation('restore');
      setSyncDialogVisible(true);
      setSyncStatus('開始恢復數據...');
      setSyncProgress(0);
      
      // 讀取備份文件
      setSyncStatus('正在讀取備份數據...');
      setSyncProgress(0.3);
      
      const jsonData = await FileSystem.readAsStringAsync(backupFile.path);
      const backupData = JSON.parse(jsonData);
      
      // 保存數據到本地
      setSyncStatus('正在恢復數據到本地...');
      setSyncProgress(0.6);
      
      if (backupData.projects) {
        await AsyncStorage.setItem('projects', JSON.stringify(backupData.projects));
      }
      
      if (backupData.reportTypes) {
        await AsyncStorage.setItem('reportTypes', JSON.stringify(backupData.reportTypes));
      }
      
      if (backupData.companyInfo) {
        await AsyncStorage.setItem('companyInfo', JSON.stringify(backupData.companyInfo));
      }
      
      if (backupData.pdfSettings) {
        await AsyncStorage.setItem('pdfPageSettings', JSON.stringify(backupData.pdfSettings));
      }
      
      if (backupData.signature) {
        await AsyncStorage.setItem('signature', backupData.signature);
      }
      
      setSyncStatus('恢復完成！');
      setSyncProgress(1);
      
      // 延遲關閉對話框
      setTimeout(() => {
        setSyncDialogVisible(false);
        setIsSyncing(false);
        Alert.alert(
          '恢復成功', 
          '數據已從備份恢復到本地。'
        );
      }, 1000);
      
    } catch (error) {
      console.error('數據恢復失敗:', error);
      setSyncDialogVisible(false);
      setIsSyncing(false);
      Alert.alert('恢復失敗', `數據恢復過程中發生錯誤: ${error.message}`);
    }
  };

  // 刪除備份文件
  const deleteBackupFile = async (backupFile) => {
    try {
      await FileSystem.deleteAsync(backupFile.path);
      Alert.alert('成功', '備份文件已刪除');
      loadBackupFiles(); // 重新加載列表
    } catch (error) {
      console.error('刪除備份文件失敗:', error);
      Alert.alert('錯誤', '刪除備份文件失敗，請重試');
    }
  };

  // 確認對話框處理函數
  const handleConfirmAction = () => {
    setConfirmDialogVisible(false);
    if (!selectedBackup) return;
    
    if (actionType === 'restore') {
      restoreFromBackup(selectedBackup);
    } else if (actionType === 'delete') {
      deleteBackupFile(selectedBackup);
    }
  };

  // 顯示確認對話框
  const showConfirmDialog = (file, action) => {
    // 關閉所有已打開的swipeables
    closeAllSwipeables();
    
    setSelectedBackup(file);
    setActionType(action);
    setConfirmDialogVisible(true);
  };
  
  // 渲染向左滑動顯示的操作按鈕
  const renderRightActions = (item) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity 
          style={[styles.swipeAction, styles.restoreAction]}
          onPress={() => showConfirmDialog(item, 'restore')}
        >
          <MaterialCommunityIcons name="backup-restore" size={24} color="white" />
          <Text style={styles.swipeActionText}>恢復</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => showConfirmDialog(item, 'delete')}
        >
          <MaterialCommunityIcons name="delete" size={24} color="white" />
          <Text style={styles.swipeActionText}>刪除</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染備份文件列表項
  const renderBackupItem = (item, index) => {
    // 格式化顯示的日期時間，優先使用項目自帶日期
    const displayDate = item.date;
    
    return (
      <Swipeable
        key={item.id}
        ref={(ref) => ref && (swipeableRefs.current[item.id] = ref)}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        <View style={styles.listItemContainer}>
          <List.Item
            title={`備份 ${backupFiles.length - index}`}
            description={
              <View>
                <Text style={styles.backupDateText}>{displayDate}</Text>
              </View>
            }
            left={props => <List.Icon {...props} icon="database-sync" color="#007AFF" size={26} />}
            onPress={() => closeAllSwipeables()}
            style={styles.listItem}
          />
          <Divider />
        </View>
      </Swipeable>
    );
  };

  // 修改"數據操作"部分的顯示方式
  const renderDataOperations = () => {
    return (
      <View style={styles.dataOperationsContainer}>
        <List.Section title="數據操作">
          <List.Item
            title="清空報告列表"
            description="刪除所有已生成的報告"
            left={props => <List.Icon {...props} icon="file-document-remove" color="#FF9800" size={26} />}
            onPress={showClearReportsConfirm}
            disabled={isSyncing}
            style={styles.operationItem}
          />
          <Divider />
          <List.Item
            title="清空本地數據"
            description="清除所有本地保存的項目和設置信息"
            left={props => <List.Icon {...props} icon="database-remove" color="#F44336" size={26} />}
            onPress={showClearDataConfirm}
            disabled={isSyncing}
            style={styles.operationItem}
          />
        </List.Section>
      </View>
    );
  };

  // 上傳數據到服務器
  const uploadDataToServer = async () => {
    try {
      setIsSyncing(true);
      setSyncOperation('upload');
      setSyncDialogVisible(true);
      setSyncStatus('開始上傳數據...');
      setSyncProgress(0);

      // 收集需要上傳的數據
      const dataToSync = {};
      
      // 1. 項目數據
      setSyncStatus('正在上傳項目數據...');
      setSyncProgress(0.1);
      const projectsData = await AsyncStorage.getItem('projects');
      if (projectsData) {
        dataToSync.projects = JSON.parse(projectsData);
      }
      
      // 2. 報告類型
      setSyncStatus('正在上傳報告類型...');
      setSyncProgress(0.2);
      const reportTypesData = await AsyncStorage.getItem('reportTypes');
      if (reportTypesData) {
        dataToSync.reportTypes = JSON.parse(reportTypesData);
      }
      
      // 3. 公司信息
      setSyncStatus('正在上傳公司信息...');
      setSyncProgress(0.3);
      const companyInfoData = await AsyncStorage.getItem('companyInfo');
      if (companyInfoData) {
        dataToSync.companyInfo = JSON.parse(companyInfoData);
      }
      
      // 4. PDF頁面設置
      setSyncStatus('正在上傳PDF設置...');
      setSyncProgress(0.4);
      const pdfSettingsData = await AsyncStorage.getItem('pdfPageSettings');
      if (pdfSettingsData) {
        dataToSync.pdfSettings = JSON.parse(pdfSettingsData);
      }
      
      // 5. 簽名數據
      setSyncStatus('正在上傳簽名數據...');
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
      
      // 使用當前日期時間命名
      const now = new Date();
      const formattedDateTime = formatDateTimeForFileName(now);
      const backupFileName = `sync_backup_${formattedDateTime}.json`;
      const backupFilePath = FileSystem.documentDirectory + backupFileName;
      
      // 添加當前系統日期到數據中
      dataToSync.backupInfo = {
        createdAt: formatDateTimeForDisplay(now),
        fileName: backupFileName
      };
      
      // 更新jsonData包含備份信息
      const updatedJsonData = JSON.stringify(dataToSync);
      
      await FileSystem.writeAsStringAsync(backupFilePath, updatedJsonData);
      
      // 在實際應用中，這裡應該使用API將數據上傳到服務器
      // 目前只是模擬上傳
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSyncStatus('上傳完成！');
      setSyncProgress(1);
      
      // 延遲關閉對話框
      setTimeout(() => {
        setSyncDialogVisible(false);
        setIsSyncing(false);
        // 重新加載備份文件列表
        loadBackupFiles();
        Alert.alert(
          '上傳成功',
          `數據已成功上傳到服務器。\n\n備份文件已保存至:\n${backupFileName}`
        );
      }, 1000);
      
    } catch (error) {
      console.error('數據上傳失敗:', error);
      setSyncDialogVisible(false);
      setIsSyncing(false);
      Alert.alert('上傳失敗', '數據上傳過程中發生錯誤，請重試。');
    }
  };

  // 從服務器下載數據
  const downloadDataFromServer = async () => {
    try {
      if (backupFiles.length === 0) {
        Alert.alert('提示', '沒有可用的備份數據');
        return;
      }

      // 自動選擇最新的備份文件進行恢復
      const latestBackupFile = backupFiles[0];
      restoreFromBackup(latestBackupFile);
      
    } catch (error) {
      console.error('數據下載失敗:', error);
      Alert.alert('下載失敗', `數據下載過程中發生錯誤: ${error.message}`);
    }
  };

  // 清空報告列表
  const clearReports = async () => {
    try {
      setClearReportsDialogVisible(false);
      
      // 清除報告數據
      await AsyncStorage.removeItem('reports');
      
      // 清除個別報告數據
      const keys = await AsyncStorage.getAllKeys();
      const reportKeys = keys.filter(key => 
        key === 'reports' || 
        key.startsWith('report_') || 
        key.startsWith('pdf_')
      );
      
      if (reportKeys.length > 0) {
        console.log(`清除${reportKeys.length}個報告相關的存儲項`);
        await AsyncStorage.multiRemove(reportKeys);
      }
      
      // 嘗試刪除PDF文件
      try {
        const pdfDir = FileSystem.documentDirectory + 'reports/';
        const dirInfo = await FileSystem.getInfoAsync(pdfDir);
        
        if (dirInfo.exists) {
          console.log('清除報告PDF文件目錄');
          const files = await FileSystem.readDirectoryAsync(pdfDir);
          for (const file of files) {
            if (file.endsWith('.pdf')) {
              await FileSystem.deleteAsync(pdfDir + file, { idempotent: true });
              console.log(`已刪除: ${file}`);
            }
          }
        }
      } catch (fileError) {
        console.error('刪除PDF文件失敗:', fileError);
        // 繼續執行，不中斷流程
      }
      
      Alert.alert('操作成功', '報告列表已清空');
    } catch (error) {
      console.error('清空報告列表失敗:', error);
      Alert.alert('操作失敗', '清空報告列表過程中發生錯誤，請重試。');
    }
  };

  // 清空本地數據
  const clearLocalData = async () => {
    try {
      setClearDataDialogVisible(false);
      
      // 清除各種數據
      await AsyncStorage.removeItem('projects');
      await AsyncStorage.removeItem('reportTypes');
      await AsyncStorage.removeItem('companyInfo');
      await AsyncStorage.removeItem('pdfPageSettings');
      await AsyncStorage.removeItem('signature');
      
      // 清除報告數據
      const keys = await AsyncStorage.getAllKeys();
      const reportKeys = keys.filter(key => key.startsWith('report_'));
      
      if (reportKeys.length > 0) {
        await AsyncStorage.multiRemove(reportKeys);
      }
      
      Alert.alert('操作成功', '本地數據已清空');
    } catch (error) {
      console.error('清空數據失敗:', error);
      Alert.alert('操作失敗', '清空數據過程中發生錯誤，請重試。');
    }
  };

  // 顯示清空數據確認對話框
  const showClearDataConfirm = () => {
    setClearDataDialogVisible(true);
  };
  
  // 顯示清空報告確認對話框
  const showClearReportsConfirm = () => {
    setClearReportsDialogVisible(true);
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 上傳按鈕 */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={uploadDataToServer} 
            style={[styles.actionButton, styles.primaryButton]}
            icon="cloud-upload"
            disabled={isSyncing}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
          >
            上傳數據到服務器
          </Button>
        </View>

        {/* 已上傳數據列表 */}
        <List.Section 
          title="已上傳的數據" 
          titleStyle={styles.sectionTitle}
          style={styles.section}
        >
          <Text style={styles.swipeHintText}>
            向左滑動可操作恢復或刪除功能
          </Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>正在加載上傳數據...</Text>
            </View>
          ) : backupFiles.length > 0 ? (
            <View style={styles.dataListContainer}>
              {backupFiles.map((item, index) => renderBackupItem(item, index))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cloud-off-outline" size={60} color="#757575" />
              <Text style={styles.emptyText}>暫無上傳數據</Text>
              <Text style={styles.emptySubtext}>點擊上方按鈕上傳數據到服務器</Text>
            </View>
          )}
        </List.Section>
        
        {/* 數據操作部分 */}
        {renderDataOperations()}

        {/* 對話框部分 */}
        <Portal>
          <Dialog 
            visible={syncDialogVisible} 
            dismissable={false}
            style={styles.dialog}
          >
            <Dialog.Title>
              {syncOperation === 'upload' ? '正在上傳數據到服務器' : 
               syncOperation === 'download' ? '正在從服務器下載數據' :
               '正在恢復數據'}
            </Dialog.Title>
            <Dialog.Content>
              <View style={styles.syncDialogContent}>
                <ActivityIndicator animating={true} size="large" style={styles.syncIndicator} />
                <Text style={styles.syncStatusText}>{syncStatus}</Text>
                <ProgressBar progress={syncProgress} style={styles.syncProgress} />
              </View>
            </Dialog.Content>
          </Dialog>
        </Portal>
        
        {/* 清空數據確認對話框 */}
        <Portal>
          <Dialog 
            visible={clearDataDialogVisible} 
            onDismiss={() => setClearDataDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title>確認清空數據</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.warningText}>
                警告：此操作將清空所有本地保存的項目、報告類型、公司信息、設置等數據，無法恢復。
              </Text>
              <Text style={styles.warningText}>
                建議在清空前先上傳數據到服務器。
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setClearDataDialogVisible(false)}>取消</Button>
              <Button onPress={clearLocalData} textColor="#F44336">確認清空</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        
        {/* 清空報告列表確認對話框 */}
        <Portal>
          <Dialog 
            visible={clearReportsDialogVisible} 
            onDismiss={() => setClearReportsDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title>確認清空報告列表</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.warningText}>
                警告：此操作將刪除所有已生成的報告數據及PDF文件，無法恢復。
              </Text>
              <Text>
                項目信息和報告類型數據將被保留。
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setClearReportsDialogVisible(false)}>取消</Button>
              <Button onPress={clearReports} textColor="#FF9800">確認清空</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* 操作確認對話框 */}
        <Portal>
          <Dialog 
            visible={confirmDialogVisible} 
            onDismiss={() => setConfirmDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title>
              {actionType === 'restore' ? '確認恢復數據' : '確認刪除備份'}
            </Dialog.Title>
            <Dialog.Content>
              {actionType === 'restore' ? (
                <Text>
                  確定要從 {selectedBackup?.date} 的備份中恢復數據嗎？這將覆蓋當前的本地數據。
                </Text>
              ) : (
                <Text style={styles.warningText}>
                  警告：確定要刪除 {selectedBackup?.date} 的備份嗎？此操作無法撤銷。
                </Text>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmDialogVisible(false)}>取消</Button>
              <Button 
                onPress={handleConfirmAction} 
                textColor={actionType === 'restore' ? '#2196F3' : '#F44336'}
              >
                確認
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  swipeHintText: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
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
  // 按鈕樣式
  actionButtons: {
    padding: 16,
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    borderRadius: 4, // 減少圓角
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    height: 48,
  },
  // 列表樣式
  dataListContainer: {
    backgroundColor: '#fff',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  listItemContainer: {
    backgroundColor: '#fff',
  },
  listItem: {
    paddingVertical: 10,
  },
  backupDateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // 滑動操作樣式
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreAction: {
    backgroundColor: '#007AFF',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
  swipeActionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  // 數據操作區域
  dataOperationsContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  operationItem: {
    paddingVertical: 12,
  },
  // 加載與空狀態
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  // 對話框
  dialog: {
    borderRadius: 4, // 減少彈窗圓角
  }
}); 
 
 
 
 