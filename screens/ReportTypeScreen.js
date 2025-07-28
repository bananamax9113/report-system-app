import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  FlatList
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SwipeListView } from 'react-native-swipe-list-view';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ROW_HEIGHT = 64; // 列表行高度

export default function ReportTypeScreen({ navigation }) {
  const [reportTypes, setReportTypes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [reportTypeName, setReportTypeName] = useState('');
  const [reportTypeCode, setReportTypeCode] = useState('');
  const [defaultReportName, setDefaultReportName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingReportType, setEditingReportType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoCode, setIsAutoCode] = useState(true);
  const listViewRef = useRef(null);

  useEffect(() => {
    // 加載報告類型數據
    loadReportTypes();
  }, []);

  // 當報告類型名稱變更時，如果啟用了自動編號，則生成編號
  useEffect(() => {
    if (isAutoCode && !editingReportType && reportTypeName.trim()) {
      generateReportTypeCode();
    }
  }, [reportTypeName, isAutoCode, editingReportType]);

  // 生成新的報告類型編號 (格式: RPT-年份後兩位+月份)
  const generateReportTypeCode = () => {
    try {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      setReportTypeCode(`RPT-${year}${month}`);
    } catch (error) {
      console.log('生成報告類型編號失敗', error);
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-4);
      setReportTypeCode(`RPT-${timestamp}`);
    }
  };

  const loadReportTypes = async () => {
    try {
      // 從 AsyncStorage 加載報告類型
      const reportTypesData = await AsyncStorage.getItem('reportTypes');
      const loadedReportTypes = reportTypesData ? JSON.parse(reportTypesData) : [];
      setReportTypes(loadedReportTypes);
    } catch (error) {
      console.log('讀取報告類型列表失敗', error);
      Alert.alert('錯誤', '無法加載報告類型列表');
    } finally {
      setLoading(false);
    }
  };

  const saveReportTypes = async (updatedReportTypes) => {
    try {
      // 保存所有報告類型
      await AsyncStorage.setItem('reportTypes', JSON.stringify(updatedReportTypes));
      setReportTypes(updatedReportTypes);
    } catch (error) {
      console.log('保存報告類型列表失敗', error);
      Alert.alert('錯誤', '保存失敗');
    }
  };

  const showDialog = () => {
    // 清空表單
    setReportTypeName('');
    setReportTypeCode('');
    setDefaultReportName('');
    setIsAutoCode(true);
    setEditingReportType(null);
    setVisible(true);
  };

  const hideDialog = () => {
    Keyboard.dismiss();
    setVisible(false);
    setReportTypeName('');
    setReportTypeCode('');
    setDefaultReportName('');
    setEditingReportType(null);
  };

  const editReportType = (reportType) => {
    // 關閉所有打開的滑動行
    if (listViewRef.current) {
      listViewRef.current.closeAllOpenRows();
    }
    
    setEditingReportType(reportType);
    setReportTypeName(reportType.name);
    setReportTypeCode(reportType.code);
    setDefaultReportName(reportType.defaultName || '');
    setIsAutoCode(false); // 編輯時不自動生成編號
    setVisible(true);
  };

  const deleteReportType = (reportTypeId) => {
    Alert.alert(
      "確認刪除",
      "確定要刪除此報告類型嗎？此操作無法撤銷。",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "刪除",
          onPress: () => {
            const updatedReportTypes = reportTypes.filter(rt => rt.id !== reportTypeId);
            saveReportTypes(updatedReportTypes);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleSaveReportType = () => {
    Keyboard.dismiss();
    
    if (!reportTypeName.trim() || !reportTypeCode.trim()) {
      Alert.alert("提示", "報告類型名稱和編號不能為空");
      return;
    }

    let updatedReportTypes = [];
    
    if (editingReportType) {
      // 編輯現有報告類型
      updatedReportTypes = reportTypes.map(rt => 
        rt.id === editingReportType.id 
          ? { 
              ...rt, 
              name: reportTypeName, 
              code: reportTypeCode,
              defaultName: defaultReportName.trim() || reportTypeName,
              lastReportNumber: rt.lastReportNumber || 0
            } 
          : rt
      );
    } else {
      // 添加新報告類型
      const newReportType = {
        id: Date.now().toString(),
        name: reportTypeName,
        code: reportTypeCode,
        defaultName: defaultReportName.trim() || reportTypeName,
        lastReportNumber: 0, // 初始報告編號為0，下一個將是001
        createdAt: new Date().toISOString()
      };
      updatedReportTypes = [...reportTypes, newReportType];
    }

    saveReportTypes(updatedReportTypes);
    hideDialog();
  };

  // 關閉所有打開的行
  const closeAllRows = () => {
    if (listViewRef.current) {
      listViewRef.current.closeAllOpenRows();
    }
  };

  const filteredReportTypes = searchQuery
    ? reportTypes.filter(rt => 
        rt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        rt.code.toLowerCase().includes(searchQuery.toLowerCase()))
    : reportTypes;

  // 渲染報告類型行（可見內容）
  const renderItem = data => (
    <TouchableWithoutFeedback onPress={closeAllRows}>
      <View style={styles.rowContent}>
        <View style={styles.reportTypeInfo}>
          <View style={styles.reportTypeHeader}>
            <View style={styles.reportTypeIconContainer}>
              <Ionicons 
                name="document-text-outline" 
                size={24} 
                color="#666" 
              />
            </View>
            <Text 
              style={styles.reportTypeName} 
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              {data.item.name}
            </Text>
          </View>
          <View style={styles.reportTypeDetails}>
            <Text style={styles.reportTypeCode}>編號: {data.item.code}</Text>
            <Text style={styles.reportTypeDefaultName}>
              默認報告名稱: {data.item.defaultName || data.item.name}
            </Text>
          </View>
        </View>
        <Divider style={styles.rowDivider} />
      </View>
    </TouchableWithoutFeedback>
  );

  // 渲染隱藏的操作按鈕
  const renderHiddenItem = (data, rowMap) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnLeft]}
        onPress={() => editReportType(data.item)}
      >
        <MaterialIcons name="edit" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => deleteReportType(data.item.id)}
      >
        <MaterialIcons name="delete-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  // 搜索框組件
  const SearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <View style={styles.searchIconContainer}>
          <Ionicons name="search-outline" size={18} color="#999" />
        </View>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="搜索報告類型"
          placeholderTextColor="#999"
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );

  // 添加按鈕行
  const AddButtonRow = () => (
    <TouchableOpacity style={styles.addButtonRow} onPress={showDialog}>
      <View style={styles.addButtonContent}>
        <Ionicons name="add-circle-outline" size={22} color="#007AFF" style={styles.addButtonIcon} />
        <Text style={styles.addButtonText}>新增報告類型</Text>
      </View>
      <Divider style={styles.rowDivider} />
    </TouchableOpacity>
  );

  // 固定頂部組件
  const FixedHeader = () => (
    <View style={styles.fixedHeader}>
      <SearchBar />
      <AddButtonRow />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 固定在頂部的搜索和添加按鈕 */}
      <FixedHeader />
      
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text>加載中...</Text>
        </View>
      ) : reportTypes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暫無報告類型，點擊"新增報告類型"添加</Text>
        </View>
      ) : (
        <SwipeListView
          ref={listViewRef}
          data={filteredReportTypes}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-150}
          disableRightSwipe
          keyExtractor={item => item.id}
          style={styles.reportTypeList}
          contentContainerStyle={styles.listContentContainer}
          closeOnRowBeginSwipe
          closeOnRowOpen
          closeOnScroll
          previewRowKey={filteredReportTypes.length > 0 ? filteredReportTypes[0].id : ''}
          previewOpenValue={-40}
          previewOpenDelay={3000}
          friction={10}
          tension={40}
          swipeToOpenPercent={30}
          swipeToClosePercent={50}
          swipeGestureBegan={() => closeAllRows()}
        />
      )}

      {/* 報告類型編輯模態框 */}
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideDialog}
      >
        <TouchableWithoutFeedback onPress={hideDialog}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingReportType ? '編輯報告類型' : '新建報告類型'}
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>報告類型名稱 *</Text>
                  <TextInput
                    style={styles.nativeInput}
                    value={reportTypeName}
                    onChangeText={text => setReportTypeName(text)}
                    placeholder="請輸入報告類型名稱"
                    placeholderTextColor="#999"
                  />
                </View>
                
                <View style={styles.codeInputContainer}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>報告類型編號 *</Text>
                    <TextInput
                      style={[
                        styles.nativeInput, 
                        isAutoCode && !editingReportType && styles.disabledInput
                      ]}
                      value={reportTypeCode}
                      onChangeText={text => setReportTypeCode(text)}
                      placeholder="報告類型編號"
                      placeholderTextColor="#999"
                      editable={!isAutoCode || editingReportType}
                    />
                  </View>
                  
                  {!editingReportType && (
                    <TouchableOpacity
                      style={styles.codeToggleButton}
                      onPress={() => setIsAutoCode(!isAutoCode)}
                    >
                      {isAutoCode ? (
                        <Ionicons name="lock-closed-outline" size={22} color="#666" />
                      ) : (
                        <Ionicons name="lock-open-outline" size={22} color="#666" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                
                {!editingReportType && (
                  <Text style={styles.autoCodeHint}>
                    {isAutoCode ? '編號將自動生成 (RPT-年份月份)' : '手動輸入編號'}
                  </Text>
                )}
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>默認報告名稱 (選填)</Text>
                  <TextInput
                    style={styles.nativeInput}
                    value={defaultReportName}
                    onChangeText={text => setDefaultReportName(text)}
                    placeholder="留空則使用報告類型名稱"
                    placeholderTextColor="#999"
                  />
                </View>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={hideDialog}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={handleSaveReportType}
                  >
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  fixedHeader: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    height: 56,
    justifyContent: 'center',
  },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    position: 'absolute',
    left: 26,
    zIndex: 1,
  },
  searchInput: {
    height: 36,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingLeft: 36,
    paddingRight: 12,
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  addButtonRow: {
    backgroundColor: '#FFFFFF',
    height: ROW_HEIGHT,
  },
  addButtonContent: {
    paddingHorizontal: 16,
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '500',
  },
  reportTypeList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContentContainer: {
    flexGrow: 1,
  },
  rowContent: {
    backgroundColor: '#FFFFFF',
    minHeight: ROW_HEIGHT,
    paddingVertical: 8,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#E1E1E1',
    marginLeft: 16,
  },
  reportTypeInfo: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reportTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTypeIconContainer: {
    marginRight: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportTypeName: {
    fontSize: 17,
    fontWeight: '500',
    flex: 1,
  },
  reportTypeDetails: {
    marginLeft: 36,
    marginTop: 2,
  },
  reportTypeCode: {
    fontSize: 14,
    color: '#666',
  },
  reportTypeDefaultName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // 滑動操作按鈕樣式
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8, // 與行內容保持一致的內邊距
    height: 'auto', // 自適應高度
    minHeight: ROW_HEIGHT, // 最小高度與行內容一致
  },
  backRightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 8, // 與行內容的 paddingVertical 一致
    bottom: 8, // 與行內容的 paddingVertical 一致
    width: 75,
  },
  backRightBtnLeft: {
    backgroundColor: '#007AFF',
    right: 75,
  },
  backRightBtnRight: {
    backgroundColor: '#FF3B30',
    right: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  // 模態框樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  nativeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    height: 46,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  codeToggleButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 46,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  autoCodeHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#333',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 