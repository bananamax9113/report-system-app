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
  ScrollView,
  FlatList
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SwipeListView } from 'react-native-swipe-list-view';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ROW_HEIGHT = 64; // 列表行高度

// 可選圖標列表
const AVAILABLE_ICONS = [
  { name: 'home-outline', provider: 'Ionicons' },
  { name: 'business-outline', provider: 'Ionicons' },
  { name: 'briefcase-outline', provider: 'Ionicons' },
  { name: 'construct-outline', provider: 'Ionicons' },
  { name: 'build-outline', provider: 'Ionicons' },
  { name: 'hammer-outline', provider: 'Ionicons' },
  { name: 'analytics-outline', provider: 'Ionicons' },
  { name: 'bar-chart-outline', provider: 'Ionicons' },
  { name: 'clipboard-outline', provider: 'Ionicons' },
  { name: 'document-text-outline', provider: 'Ionicons' },
  { name: 'flask-outline', provider: 'Ionicons' },
  { name: 'leaf-outline', provider: 'Ionicons' },
  { name: 'water-outline', provider: 'Ionicons' },
  { name: 'earth-outline', provider: 'Ionicons' },
  { name: 'git-branch-outline', provider: 'Ionicons' },
  { name: 'grid-outline', provider: 'Ionicons' },
  { name: 'layers-outline', provider: 'Ionicons' },
  { name: 'map-outline', provider: 'Ionicons' },
  { name: 'navigate-outline', provider: 'Ionicons' },
  { name: 'telescope-outline', provider: 'Ionicons' },
  { name: 'server-outline', provider: 'Ionicons' },
  { name: 'shield-outline', provider: 'Ionicons' },
  { name: 'speedometer-outline', provider: 'Ionicons' },
  { name: 'trending-up-outline', provider: 'Ionicons' },
];

// 渲染圖標的函數
const renderIcon = (iconName, provider, size = 24, color = '#666') => {
  switch (provider) {
    case 'Ionicons':
      return <Ionicons name={iconName} size={size} color={color} />;
    case 'MaterialIcons':
      return <MaterialIcons name={iconName} size={size} color={color} />;
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
    default:
      return <Ionicons name="help-circle-outline" size={size} color={color} />;
  }
};

export default function ProjectScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [visible, setVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoCode, setIsAutoCode] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState({ name: 'business-outline', provider: 'Ionicons' });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const listViewRef = useRef(null);

  useEffect(() => {
    // 加載項目數據
    loadProjects();
  }, []);

  // 當項目名稱變更時，如果啟用了自動編號，則生成編號
  useEffect(() => {
    if (isAutoCode && !editingProject && projectName.trim()) {
      // 使用年份後兩位+序號作為編號基礎
      generateProjectCode();
    }
  }, [projectName, isAutoCode, editingProject]);

  // 生成新的項目編號
  const generateProjectCode = async () => {
    try {
      // 獲取當前年份的後兩位
      const currentYear = new Date().getFullYear().toString().slice(-2);
      // 獲取所有項目
      const projectsData = await AsyncStorage.getItem('projects');
      const allProjects = projectsData ? JSON.parse(projectsData) : [];
      
      // 篩選出當前年份的項目
      const currentYearProjects = allProjects.filter(project => 
        project.code && project.code.startsWith(currentYear)
      );
      
      // 如果沒有當前年份的項目，設置編號為年份+01
      if (currentYearProjects.length === 0) {
        setProjectCode(`${currentYear}01`);
        return;
      }
      
      // 找出最大的序號
      let maxNumber = 0;
      currentYearProjects.forEach(project => {
        const codeNumber = parseInt(project.code.substring(2), 10);
        if (!isNaN(codeNumber) && codeNumber > maxNumber) {
          maxNumber = codeNumber;
        }
      });
      
      // 新序號為最大序號+1
      const newNumber = maxNumber + 1;
      // 格式化為兩位數，如01, 02...10, 11
      const formattedNumber = newNumber.toString().padStart(2, '0');
      setProjectCode(`${currentYear}${formattedNumber}`);
    } catch (error) {
      console.log('生成項目編號失敗', error);
      // 出錯時使用備用編號方案
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const timestamp = new Date().getTime().toString().slice(-2);
      setProjectCode(`${currentYear}${timestamp}`);
    }
  };

  const loadProjects = async () => {
    try {
      // 直接從 AsyncStorage 加載項目
      const projectsData = await AsyncStorage.getItem('projects');
      const loadedProjects = projectsData ? JSON.parse(projectsData) : [];
      
      // 確保所有項目都有圖標
      const updatedProjects = loadedProjects.map(project => {
        if (!project.icon) {
          return { 
            ...project, 
            icon: { name: 'business-outline', provider: 'Ionicons' } 
          };
        }
        return project;
      });
      
      if (JSON.stringify(loadedProjects) !== JSON.stringify(updatedProjects)) {
        await AsyncStorage.setItem('projects', JSON.stringify(updatedProjects));
      }
      
      setProjects(updatedProjects);
    } catch (error) {
      console.log('讀取項目列表失敗', error);
      Alert.alert('錯誤', '無法加載項目列表');
    } finally {
      setLoading(false);
    }
  };

  const saveProjects = async (updatedProjects) => {
    try {
      // 保存所有項目
      await AsyncStorage.setItem('projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    } catch (error) {
      console.log('保存項目列表失敗', error);
      Alert.alert('錯誤', '保存失敗');
    }
  };

  const showDialog = () => {
    // 清空表單
    setProjectName('');
    setProjectCode('');
    setIsAutoCode(true);
    setEditingProject(null);
    setSelectedIcon({ name: 'business-outline', provider: 'Ionicons' });
    setVisible(true);
  };

  const hideDialog = () => {
    Keyboard.dismiss();
    setVisible(false);
    setProjectName('');
    setProjectCode('');
    setEditingProject(null);
    setShowIconPicker(false);
  };

  const editProject = (project) => {
    // 關閉所有打開的滑動行
    if (listViewRef.current) {
      listViewRef.current.closeAllOpenRows();
    }
    
    setEditingProject(project);
    setProjectName(project.name);
    setProjectCode(project.code);
    setSelectedIcon(project.icon || { name: 'business-outline', provider: 'Ionicons' });
    setIsAutoCode(false); // 編輯時不自動生成編號
    setVisible(true);
  };

  const deleteProject = (projectId) => {
    Alert.alert(
      "確認刪除",
      "確定要刪除此項目嗎？此操作無法撤銷。",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "刪除",
          onPress: () => {
            const updatedProjects = projects.filter(p => p.id !== projectId);
            saveProjects(updatedProjects);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleSaveProject = () => {
    Keyboard.dismiss();
    
    if (!projectName.trim() || !projectCode.trim()) {
      Alert.alert("提示", "項目名稱和編號不能為空");
      return;
    }

    let updatedProjects = [];
    
    if (editingProject) {
      // 編輯現有項目
      updatedProjects = projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, name: projectName, code: projectCode, icon: selectedIcon } 
          : p
      );
    } else {
      // 添加新項目
      const newProject = {
        id: Date.now().toString(),
        name: projectName,
        code: projectCode,
        icon: selectedIcon,
        createdAt: new Date().toISOString()
      };
      updatedProjects = [...projects, newProject];
    }

    saveProjects(updatedProjects);
    hideDialog();
  };

  // 打開圖標選擇器
  const openIconPicker = () => {
    setShowIconPicker(true);
  };

  // 選擇圖標
  const selectIcon = (icon) => {
    setSelectedIcon(icon);
    setShowIconPicker(false);
  };

  // 關閉所有打開的行
  const closeAllRows = () => {
    if (listViewRef.current) {
      listViewRef.current.closeAllOpenRows();
    }
  };

  const filteredProjects = searchQuery
    ? projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.code.toLowerCase().includes(searchQuery.toLowerCase()))
    : projects;

  // 渲染項目行（可見內容）
  const renderItem = data => (
    <TouchableWithoutFeedback onPress={closeAllRows}>
      <View style={styles.rowContent}>
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
            <View style={styles.projectIconContainer}>
              {renderIcon(
                data.item.icon?.name || 'business-outline', 
                data.item.icon?.provider || 'Ionicons'
              )}
            </View>
            <Text 
              style={styles.projectName} 
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              {data.item.name}
            </Text>
          </View>
          <Text style={styles.projectCode}>編號: {data.item.code}</Text>
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
        onPress={() => editProject(data.item)}
      >
        <MaterialIcons name="edit" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => deleteProject(data.item.id)}
      >
        <MaterialIcons name="delete-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  // 渲染圖標選擇器項目
  const renderIconItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.iconItem, 
        selectedIcon.name === item.name && selectedIcon.provider === item.provider 
          ? styles.selectedIconItem 
          : null
      ]} 
      onPress={() => selectIcon(item)}
    >
      {renderIcon(item.name, item.provider)}
    </TouchableOpacity>
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
          placeholder="搜索項目"
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
        <Text style={styles.addButtonText}>新增項目</Text>
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

  // 圖標選擇器模態框
  const IconPickerModal = () => (
    <Modal
      visible={showIconPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowIconPicker(false)}
    >
      <View style={styles.iconPickerModalOverlay}>
        <View style={styles.iconPickerModalContent}>
          <View style={styles.iconPickerHeader}>
            <Text style={styles.iconPickerTitle}>選擇圖標</Text>
            <TouchableOpacity onPress={() => setShowIconPicker(false)}>
              <Ionicons name="close-circle-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={AVAILABLE_ICONS}
            renderItem={renderIconItem}
            keyExtractor={(item) => `${item.provider}-${item.name}`}
            numColumns={5}
            contentContainerStyle={styles.iconPickerList}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* 固定在頂部的搜索和添加按鈕 */}
      <FixedHeader />
      
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text>加載中...</Text>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暫無項目，點擊"新增項目"添加</Text>
        </View>
      ) : (
        <SwipeListView
          ref={listViewRef}
          data={filteredProjects}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-150}
          disableRightSwipe
          keyExtractor={item => item.id}
          style={styles.projectList}
          contentContainerStyle={styles.listContentContainer}
          closeOnRowBeginSwipe
          closeOnRowOpen
          closeOnScroll
          previewRowKey={filteredProjects.length > 0 ? filteredProjects[0].id : ''}
          previewOpenValue={-40}
          previewOpenDelay={3000}
          friction={10}
          tension={40}
          swipeToOpenPercent={30}
          swipeToClosePercent={50}
        />
      )}

      {/* 項目編輯模態框 */}
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
                  {editingProject ? '編輯項目' : '新建項目'}
                </Text>
                
                <View style={styles.iconSelectorContainer}>
                  <TouchableOpacity 
                    style={styles.iconSelector}
                    onPress={openIconPicker}
                  >
                    {renderIcon(selectedIcon.name, selectedIcon.provider, 32, '#007AFF')}
                  </TouchableOpacity>
                  <Text style={styles.iconSelectorLabel}>點擊選擇圖標</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>項目名稱 *</Text>
                  <TextInput
                    style={styles.nativeInput}
                    value={projectName}
                    onChangeText={text => setProjectName(text)}
                    placeholder="請輸入項目名稱"
                    placeholderTextColor="#999"
                  />
                </View>
                
                <View style={styles.codeInputContainer}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>項目編號 *</Text>
                    <TextInput
                      style={[
                        styles.nativeInput, 
                        isAutoCode && !editingProject && styles.disabledInput
                      ]}
                      value={projectCode}
                      onChangeText={text => setProjectCode(text)}
                      placeholder="項目編號"
                      placeholderTextColor="#999"
                      editable={!isAutoCode || editingProject}
                    />
                  </View>
                  
                  {!editingProject && (
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
                
                {!editingProject && (
                  <Text style={styles.autoCodeHint}>
                    {isAutoCode ? '編號將自動生成' : '手動輸入編號'}
                  </Text>
                )}
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={hideDialog}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={handleSaveProject}
                  >
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 圖標選擇器模態框 */}
      <IconPickerModal />
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
  projectList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContentContainer: {
    flexGrow: 1,
  },
  rowContent: {
    backgroundColor: '#FFFFFF',
    height: ROW_HEIGHT,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#E1E1E1',
    marginLeft: 16,
  },
  projectInfo: {
    justifyContent: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIconContainer: {
    marginRight: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 17,
    fontWeight: '500',
    flex: 1,
  },
  projectCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginLeft: 40, // 與圖標對齊
  },
  // 滑動操作按鈕樣式
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 'auto', // 自適應高度
    minHeight: ROW_HEIGHT, // 最小高度與行內容一致
    paddingVertical: 0, // 與行內容保持一致
  },
  backRightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0, // 與行內容對齊
    bottom: 0, // 與行內容對齊
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
  // 項目編輯模態框樣式
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
  iconSelectorContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconSelector: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconSelectorLabel: {
    fontSize: 14,
    color: '#666',
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
  // 圖標選擇器樣式
  iconPickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iconPickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  iconPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconPickerList: {
    paddingBottom: 20,
  },
  iconItem: {
    width: SCREEN_WIDTH / 5 - 16,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedIconItem: {
    backgroundColor: '#e6f2ff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
}); 