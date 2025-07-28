import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert, 
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Animated,
  AppState
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Text, Button, TextInput, Divider, List, ProgressBar, IconButton, Menu } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 完全移除Camera相關引用，改為只使用ImagePicker
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ROW_HEIGHT = 64; // 列表行高度

export default function ReportCreationScreen({ route, navigation }) {
  // 獲取路由參數，檢查是否處於編輯模式
  const editMode = route.params?.editMode || false;
  const reportToEdit = route.params?.reportData || null;
  
  // 報告信息狀態
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [reportTypeId, setReportTypeId] = useState(null);
  const [reportNumber, setReportNumber] = useState(''); // 報告編號
  const [descriptions, setDescriptions] = useState([]); // 改為數組形式存儲多個描述
  const [currentDescription, setCurrentDescription] = useState(''); // 當前編輯的描述
  const [descriptionDialogVisible, setDescriptionDialogVisible] = useState(false); // 描述對話框可見性
  const [editingDescriptionIndex, setEditingDescriptionIndex] = useState(null); // 當前編輯的描述索引
  // 報告總結狀態
  const [summaries, setSummaries] = useState([]); // 總結數組
  const [currentSummary, setCurrentSummary] = useState(''); // 當前編輯的總結
  const [summaryDialogVisible, setSummaryDialogVisible] = useState(false); // 總結對話框可見性
  const [editingSummaryIndex, setEditingSummaryIndex] = useState(null); // 當前編輯的總結索引
  const [images, setImages] = useState([]);
  const [currentImageDescription, setCurrentImageDescription] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  
  // 圖片預覽狀態
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  // 數據列表狀態
  const [projects, setProjects] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  
  // UI 狀態
  const [projectDialogVisible, setProjectDialogVisible] = useState(false);
  const [reportTypeDialogVisible, setReportTypeDialogVisible] = useState(false);
  const [imageDialogVisible, setImageDialogVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [imageMenuVisible, setImageMenuVisible] = useState(false);
  
  // 報告自動草稿ID，用於自動保存
  const [draftId, setDraftId] = useState(editMode && reportToEdit ? reportToEdit.id : Date.now().toString());
  
  // 新增公司信息和簽名狀態
  const [companyInfo, setCompanyInfo] = useState(null);
  const [signature, setSignature] = useState(null);
  
  // AppState監聽器，用於檢測應用狀態變化
  const appState = useRef(AppState.currentState);
  
  // 初始化加載數據
  useEffect(() => {
    console.log('ReportCreationScreen初始化');
    console.log('路由參數:', route.params);
    
    loadProjects();
    loadReportTypes();
    loadCompanyInfo(); // 加載公司信息
    loadSignature(); // 加載簽名
    
    // 請求相機和媒體庫權限
    (async () => {
      try {
        // 請求相機權限
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        setHasPermission(cameraStatus.status === 'granted' && mediaLibraryStatus.status === 'granted');
        
        if (!cameraStatus.granted) {
          console.log('相機權限未獲授權');
        }
        
        if (!mediaLibraryStatus.granted) {
          console.log('媒體庫權限未獲授權');
        }
      } catch (error) {
        console.log('權限請求失敗', error);
        Alert.alert('權限錯誤', '無法獲取必要的權限，部分功能可能無法正常使用');
      }
    })();
    
    // 如果是編輯模式，加載報告數據
    if (editMode && reportToEdit) {
      console.log('加載報告進行編輯:', reportToEdit);
      loadReportForEdit(reportToEdit);
    } else {
      // 嘗試載入上次的草稿
      loadDraft();
    }
    
    // 監聽應用狀態變化，當應用進入後台時自動保存
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        console.log('應用進入後台，自動保存草稿');
        saveDraft();
      }
      appState.current = nextAppState;
    });
    
    // 清理函數
    return () => {
      subscription.remove();
    };
  }, [route.params]);
  
  // 加載報告進行編輯
  const loadReportForEdit = (report) => {
    if (!report) {
      console.log('沒有報告數據可供編輯');
      return;
    }
    
    console.log('開始加載報告數據:', JSON.stringify(report, null, 2));
    
    setTitle(report.title || '');
    setProjectId(report.projectId);
    setReportTypeId(report.reportTypeId);
    setReportNumber(report.reportNumber || '');
    setDescriptions(report.descriptions || []);
    setSummaries(report.summaries || []);
    
    // 確保圖片數據正確
    if (report.images && Array.isArray(report.images)) {
      console.log('加載報告圖片:', report.images.length);
      setImages(report.images);
    } else {
      console.log('報告沒有圖片或圖片格式不正確');
      setImages([]);
    }
    
    // 設置標題顯示編輯模式
    navigation.setOptions({
      headerTitle: '編輯報告'
    });
    
    console.log('報告數據加載完成');
  };
  
  // 自動保存草稿
  useEffect(() => {
    // 設置自動保存定時器
    const autosaveInterval = setInterval(() => {
      if (title || projectId || reportTypeId || descriptions.length > 0 || summaries.length > 0 || images.length > 0) {
        saveDraft();
      }
    }, 30000); // 每30秒保存一次
    
    return () => {
      clearInterval(autosaveInterval);
    };
  }, [title, projectId, reportTypeId, descriptions, summaries, images]);
  
  // 當項目或報告類型變化時，自動生成報告編號
  useEffect(() => {
    if (projectId && reportTypeId && !editMode) {
      generateReportNumber();
    }
  }, [projectId, reportTypeId]);
  
  // 生成報告編號
  const generateReportNumber = () => {
    const selectedProject = projects.find(p => p.id === projectId);
    const selectedType = reportTypes.find(t => t.id === reportTypeId);
    
    if (selectedProject && selectedType) {
      // 新格式：項目代碼+報告類型代碼+001序號
      const sequenceNumber = "001"; // 固定序號
      const newReportNumber = `${selectedProject.code}${selectedType.code}${sequenceNumber}`;
      
      setReportNumber(newReportNumber);
    }
  };
  
  // 加載項目列表
  const loadProjects = async () => {
    try {
      const projectsData = await AsyncStorage.getItem('projects');
      if (projectsData) {
        setProjects(JSON.parse(projectsData));
      }
    } catch (error) {
      console.log('讀取項目列表失敗', error);
    }
  };
  
  // 加載報告類型列表
  const loadReportTypes = async () => {
    try {
      const typesData = await AsyncStorage.getItem('reportTypes');
      if (typesData) {
        setReportTypes(JSON.parse(typesData));
      }
    } catch (error) {
      console.log('讀取報告類型失敗', error);
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
      console.log('讀取公司信息失敗', error);
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
      console.log('讀取簽名失敗', error);
    }
  };
  
  // 保存草稿
  const saveDraft = async () => {
    try {
      console.log('正在保存草稿...');
      // 创建一个不包含完整图片数据的副本，只保留必要信息
      const imagesToSave = images.map(img => ({
        id: img.id,
        uri: img.uri,
        description: img.description,
        dateTaken: img.dateTaken,
        width: img.width,
        height: img.height
        // 不保存exif等大型数据
      }));
      
      const draft = {
        id: draftId,
        title,
        projectId,
        reportTypeId,
        reportNumber, // 保存報告編號
        descriptions, // 保存描述數組
        summaries, // 保存總結數組
        images: imagesToSave,
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(`draft_${draftId}`, JSON.stringify(draft));
      console.log('草稿已自動保存');
    } catch (error) {
      console.log('保存草稿失敗', error);
    }
  };
  
  // 加載草稿
  const loadDraft = async () => {
    try {
      const draftKey = `draft_${draftId}`;
      const draftData = await AsyncStorage.getItem(draftKey);
      
      if (draftData) {
        const draft = JSON.parse(draftData);
        setTitle(draft.title || '');
        setProjectId(draft.projectId);
        setReportTypeId(draft.reportTypeId);
        setReportNumber(draft.reportNumber || ''); // 加載報告編號
        setDescriptions(draft.descriptions || []); // 加載描述數組
        setSummaries(draft.summaries || []); // 加載總結數組
        
        // 確保圖片文件仍然存在
        if (draft.images && draft.images.length > 0) {
          const validImages = [];
          for (const img of draft.images) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(img.uri);
              if (fileInfo.exists) {
                validImages.push(img);
              } else {
                console.log(`圖片文件不存在: ${img.uri}`);
              }
            } catch (err) {
              console.log(`檢查圖片文件時出錯: ${err}`);
            }
          }
          setImages(validImages);
        }
        
        console.log('已載入上次編輯的草稿');
      }
    } catch (error) {
      console.log('載入草稿失敗', error);
    }
  };
  
  // 處理選擇項目
  const handleSelectProject = (id) => {
    setProjectId(id);
    setProjectDialogVisible(false);
  };
  
  // 選擇報告類型時自動填充報告標題
  const handleSelectReportType = (id) => {
    setReportTypeId(id);
    setReportTypeDialogVisible(false);
    
    // 自動填充報告標題 - 只使用報告類型名稱
    const selectedType = reportTypes.find(t => t.id === id);
    if (selectedType) {
      setTitle(`${selectedType.name}檢測報告`);
    }
  };

  // 顯示添加描述對話框
  const showAddDescriptionDialog = () => {
    setCurrentDescription('');
    setEditingDescriptionIndex(null);
    setDescriptionDialogVisible(true);
  };

  // 顯示編輯描述對話框
  const showEditDescriptionDialog = (index) => {
    setCurrentDescription(descriptions[index].content);
    setEditingDescriptionIndex(index);
    setDescriptionDialogVisible(true);
  };

  // 保存描述
  const saveDescription = () => {
    if (!currentDescription.trim()) {
      Alert.alert('提示', '描述內容不能為空');
      return;
    }

    const newDescription = {
      id: Date.now().toString(),
      content: currentDescription,
      createdAt: new Date().toISOString()
    };

    if (editingDescriptionIndex !== null) {
      // 編輯現有描述
      const updatedDescriptions = [...descriptions];
      updatedDescriptions[editingDescriptionIndex] = {
        ...updatedDescriptions[editingDescriptionIndex],
        content: currentDescription,
        updatedAt: new Date().toISOString()
      };
      setDescriptions(updatedDescriptions);
    } else {
      // 添加新描述
      setDescriptions([...descriptions, newDescription]);
    }

    setDescriptionDialogVisible(false);
    setCurrentDescription('');
    setEditingDescriptionIndex(null);
  };

  // 刪除描述
  const deleteDescription = (index) => {
    Alert.alert(
      "確認刪除",
      "確定要刪除這條描述嗎？",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "刪除",
          onPress: () => {
            const updatedDescriptions = [...descriptions];
            updatedDescriptions.splice(index, 1);
            setDescriptions(updatedDescriptions);
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // 顯示添加總結對話框
  const showAddSummaryDialog = () => {
    setCurrentSummary('');
    setEditingSummaryIndex(null);
    setSummaryDialogVisible(true);
  };

  // 顯示編輯總結對話框
  const showEditSummaryDialog = (index) => {
    setCurrentSummary(summaries[index].content);
    setEditingSummaryIndex(index);
    setSummaryDialogVisible(true);
  };

  // 保存總結
  const saveSummary = () => {
    if (!currentSummary.trim()) {
      Alert.alert('提示', '總結內容不能為空');
      return;
    }

    const newSummary = {
      id: Date.now().toString(),
      content: currentSummary,
      createdAt: new Date().toISOString()
    };

    if (editingSummaryIndex !== null) {
      // 編輯現有總結
      const updatedSummaries = [...summaries];
      updatedSummaries[editingSummaryIndex] = {
        ...updatedSummaries[editingSummaryIndex],
        content: currentSummary,
        updatedAt: new Date().toISOString()
      };
      setSummaries(updatedSummaries);
    } else {
      // 添加新總結
      setSummaries([...summaries, newSummary]);
    }

    setSummaryDialogVisible(false);
    setCurrentSummary('');
    setEditingSummaryIndex(null);
  };

  // 刪除總結
  const deleteSummary = (index) => {
    Alert.alert(
      "確認刪除",
      "確定要刪除這條總結嗎？",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "刪除",
          onPress: () => {
            const updatedSummaries = [...summaries];
            updatedSummaries.splice(index, 1);
            setSummaries(updatedSummaries);
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // 從相機拍照
  const takePicture = async () => {
    if (!hasPermission) {
      Alert.alert('權限不足', '請在設置中開啟相機權限');
      return;
    }
    
    try {
      console.log("啟動相機拍照...");
      // 使用ImagePicker啟動相機
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // 不允許裁剪
        quality: 0.8, // 降低品質以避免OOM
      });
      
      console.log("拍照結果:", result.canceled ? "已取消" : "拍攝了照片");
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          const photo = result.assets[0];
          if (!photo || !photo.uri) {
            console.log("拍照獲取的照片數據無效");
            Alert.alert('錯誤', '獲取照片數據失敗，請重試');
            return;
          }
          
          console.log("拍攝的照片:", photo.uri);
          
          // 檢查源文件是否存在
          const sourceInfo = await FileSystem.getInfoAsync(photo.uri);
          if (!sourceInfo.exists) {
            console.log(`拍攝的照片文件不存在: ${photo.uri}`);
            Alert.alert('錯誤', '拍攝的照片文件不存在，請重試');
            return;
          }
          
          // 創建圖片目錄（如果不存在）
          const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'reports/');
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'reports/', { intermediates: true });
          }
          
          // 獲取當前日期時間並格式化
          const now = new Date();
          const dateString = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }) + ' ' + now.toLocaleTimeString('zh-CN', {
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
          
          // 創建唯一文件名並保存到應用目錄
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileName = `photo_${timestamp}_${randomStr}.jpg`;
          const newUri = FileSystem.documentDirectory + 'reports/' + fileName;
          
          console.log(`複製照片從 ${photo.uri} 到 ${newUri}`);
          // 複製照片到應用目錄
          await FileSystem.copyAsync({
            from: photo.uri,
            to: newUri
          });
          
          // 檢查目標文件是否已成功創建
          const targetInfo = await FileSystem.getInfoAsync(newUri);
          if (!targetInfo.exists) {
            console.log(`目標文件創建失敗: ${newUri}`);
            Alert.alert('錯誤', '保存照片失敗，請重試');
            return;
          }
          
          // 添加到報告圖片列表
          const newImage = {
            id: `${timestamp}_${randomStr}`,
            uri: newUri,
            description: '',
            dateTaken: dateString, // 保存拍照時間
            width: photo.width || 300, // 提供默認寬度
            height: photo.height || 400 // 提供默認高度
          };
          
          console.log("新圖片對象:", newImage);
          
          // 更新圖片列表
          const updatedImages = [...images, newImage];
          console.log(`圖片列表更新，現有 ${updatedImages.length} 張圖片`);
          setImages(updatedImages);
          
          // 顯示描述對話框
          const newIndex = images.length; // 新圖片在合併後的數組中的索引
          console.log(`顯示描述對話框，索引: ${newIndex}`);
          setCurrentImageIndex(newIndex);
          setCurrentImageDescription('');
          setImageDialogVisible(true);
          
          // 保存草稿
          setTimeout(() => {
            saveDraft();
          }, 500);
        } catch (processingError) {
          console.log('處理拍照圖片過程中出錯:', processingError);
          Alert.alert('錯誤', '處理拍照圖片過程中出錯: ' + processingError.message);
        }
      }
    } catch (error) {
      console.log('拍照失敗', error);
      Alert.alert('錯誤', '拍照失敗: ' + (error.message || '未知錯誤'));
    }
  };
  
  // 從相冊選擇照片
  const pickImage = async () => {
    try {
      console.log("啟動相冊選擇...");
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // 不允許裁剪
        quality: 0.8, // 降低品質以避免OOM
        allowsMultipleSelection: true, // 允許多選
      });
      
      console.log("相冊選擇結果:", result.canceled ? "已取消" : `選擇了 ${result.assets?.length || 0} 張圖片`);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          // 創建圖片目錄（如果不存在）
          const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'reports/');
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'reports/', { intermediates: true });
          }
          
          // 獲取當前日期時間並格式化
          const now = new Date();
          const dateString = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }) + ' ' + now.toLocaleTimeString('zh-CN', {
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
          
          // 處理所有選擇的圖片
          const newImages = [];
          console.log(`開始處理 ${result.assets.length} 張圖片...`);
          
          for (let i = 0; i < result.assets.length; i++) {
            const selectedImage = result.assets[i];
            if (!selectedImage || !selectedImage.uri) {
              console.log(`第 ${i+1} 張圖片數據無效，跳過`);
              continue;
            }
            
            console.log(`處理第 ${i+1} 張圖片: ${selectedImage.uri}`);
            
            try {
              // 檢查源文件是否存在
              const sourceInfo = await FileSystem.getInfoAsync(selectedImage.uri);
              if (!sourceInfo.exists) {
                console.log(`源文件不存在: ${selectedImage.uri}`);
                continue;
              }
              
              // 創建唯一文件名並保存到應用目錄
              const timestamp = Date.now() + i; // 確保每個ID都不同
              const randomStr = Math.random().toString(36).substring(2, 8);
              const fileName = `photo_${timestamp}_${randomStr}.jpg`;
              const newUri = FileSystem.documentDirectory + 'reports/' + fileName;
              
              console.log(`複製圖片從 ${selectedImage.uri} 到 ${newUri}`);
              await FileSystem.copyAsync({
                from: selectedImage.uri,
                to: newUri
              });
              
              // 檢查目標文件是否已成功創建
              const targetInfo = await FileSystem.getInfoAsync(newUri);
              if (!targetInfo.exists) {
                console.log(`目標文件創建失敗: ${newUri}`);
                continue;
              }
              
              // 添加到新圖片列表
              newImages.push({
                id: `${timestamp}_${randomStr}`,
                uri: newUri,
                description: '',
                dateTaken: dateString,
                width: selectedImage.width || 300, // 提供默認寬度
                height: selectedImage.height || 400 // 提供默認高度
              });
              console.log(`第 ${i+1} 張圖片處理完成`);
            } catch (err) {
              console.log(`處理第 ${i+1} 張圖片時出錯:`, err);
              Alert.alert('處理圖片出錯', `處理第 ${i+1} 張圖片時出錯: ${err.message}`);
            }
          }
          
          console.log(`成功處理 ${newImages.length} 張圖片`);
          
          if (newImages.length > 0) {
            // 更新圖片列表
            const currentImages = [...images]; // 創建當前圖片列表的副本
            const updatedImages = [...currentImages, ...newImages];
            console.log(`圖片列表更新，從 ${currentImages.length} 張增加到 ${updatedImages.length} 張`);
            setImages(updatedImages);
            
            // 如果只選擇了一張圖片，顯示描述對話框
            if (newImages.length === 1) {
              const newIndex = currentImages.length; // 新圖片在合併後的數組中的索引
              console.log(`顯示描述對話框，索引: ${newIndex}`);
              setCurrentImageIndex(newIndex);
              setCurrentImageDescription('');
              setImageDialogVisible(true);
            } else {
              // 如果選擇了多張圖片，顯示提示
              Alert.alert('成功', `已添加 ${newImages.length} 張圖片`);
            }
            
            // 保存草稿
            setTimeout(() => {
              saveDraft();
            }, 500);
          } else {
            console.log("沒有成功處理任何圖片");
            Alert.alert('提示', '沒有成功添加任何圖片，請重試');
          }
        } catch (processingError) {
          console.log('處理圖片過程中出錯:', processingError);
          Alert.alert('錯誤', '處理圖片過程中出錯: ' + processingError.message);
        }
      }
    } catch (error) {
      console.log('選擇照片失敗', error);
      Alert.alert('錯誤', '選擇照片失敗: ' + (error.message || '未知錯誤'));
    }
  };
  
  // 預覽圖片
  const previewImageHandler = (uri) => {
    setPreviewImage(uri);
    setPreviewVisible(true);
  };
  
  // 保存圖片描述
  const saveImageDescription = () => {
    if (currentImageIndex !== null) {
      const updatedImages = [...images];
      updatedImages[currentImageIndex] = {
        ...updatedImages[currentImageIndex],
        description: currentImageDescription
      };
      setImages(updatedImages);
      setImageDialogVisible(false);
      setCurrentImageIndex(null);
      setCurrentImageDescription('');
    }
  };
  
  // 編輯圖片描述
  const editImageDescription = (index) => {
    setCurrentImageIndex(index);
    setCurrentImageDescription(images[index].description);
    setImageDialogVisible(true);
  };
  
  // 刪除圖片
  const deleteImage = (index) => {
    Alert.alert(
      "確認刪除",
      "確定要刪除這張圖片嗎？",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "刪除",
          onPress: () => {
            const updatedImages = [...images];
            updatedImages.splice(index, 1);
            setImages(updatedImages);
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // 生成報告
  const generateReport = () => {
    // 驗證必填字段
    if (!title.trim()) {
      Alert.alert('提示', '請輸入報告標題');
      return;
    }
    
    if (!projectId) {
      Alert.alert('提示', '請選擇項目');
      return;
    }
    
    if (!reportTypeId) {
      Alert.alert('提示', '請選擇報告類型');
      return;
    }
    
    if (images.length === 0) {
      Alert.alert(
        '確認提交',
        '當前沒有添加任何圖片，確定要提交嗎？',
        [
          {
            text: '取消',
            style: 'cancel'
          },
          {
            text: '確定',
            onPress: continueGenerateReport
          }
        ]
      );
    } else {
      continueGenerateReport();
    }
  };
  
  // 繼續生成報告
  const continueGenerateReport = () => {
    setLoading(true);
    
    setTimeout(async () => {
      try {
        // 獲取選中的項目和報告類型
        const selectedProject = projects.find(p => p.id === projectId);
        const selectedType = reportTypes.find(t => t.id === reportTypeId);
        
        if (!selectedProject || !selectedType) {
          Alert.alert('錯誤', '無法獲取所選項目或報告類型信息');
          setLoading(false);
          return;
        }
        
        // 創建報告對象
        const report = {
          id: editMode && reportToEdit ? reportToEdit.id : Date.now().toString(),
          title,
          projectId,
          projectName: selectedProject.name,
          projectCode: selectedProject.code,
          reportTypeId,
          reportTypeName: selectedType.name,
          reportTypeCode: selectedType.code,
          reportNumber,
          descriptions,
          summaries,
          images,
          createdAt: editMode && reportToEdit ? reportToEdit.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          companyInfo,
          signature
        };
        
        // 保存報告
        const reportsData = await AsyncStorage.getItem('reports');
        let reports = [];
        
        if (reportsData) {
          reports = JSON.parse(reportsData);
          
          if (editMode && reportToEdit) {
            // 更新現有報告
            const index = reports.findIndex(r => r.id === report.id);
            if (index !== -1) {
              // 保留原有的PDF URI（如果有）
              if (reports[index].pdfUri) {
                report.pdfUri = reports[index].pdfUri;
              }
              reports[index] = report;
            } else {
              reports.push(report);
            }
          } else {
            // 添加新報告
            reports.push(report);
          }
        } else {
          reports.push(report);
        }
        
        await AsyncStorage.setItem('reports', JSON.stringify(reports));
        
        // 清除草稿
        if (!editMode) {
          await AsyncStorage.removeItem(`draft_${draftId}`);
        }
        
        setLoading(false);
        
        // 清空表單（如果是新建模式）
        if (!editMode) {
          // 重置表單數據
          setTitle('');
          setProjectId('');
          setReportTypeId('');
          setReportNumber(generateReportNumber());
          setDescriptions([]);
          setSummaries([]);
          setImages([]);
          setDraftId(Date.now().toString());
        }
        
        // 導航至報告詳情頁面並顯示佈局選擇對話框
        navigation.navigate('報告列表', {
          screen: 'ReportDetail',
          params: {
            report: report,
            showLayoutDialog: true,
            autoGeneratePdf: true
          }
        });
        
      } catch (error) {
        console.log('保存報告失敗', error);
        setLoading(false);
        Alert.alert('錯誤', '保存報告失敗，請重試');
      }
    }, 500);
  };
  
  // 主報告編制界面
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>正在生成報告...</Text>
            <ProgressBar indeterminate style={styles.progressBar} />
          </View>
        )}
        
        {/* 基本信息區域 */}
        <View style={styles.sectionContainer}>
          <TextInput
            label="報告標題"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.titleInput}
          />
          
          {reportNumber ? (
            <View style={styles.reportNumberContainer}>
              <Text style={styles.reportNumberLabel}>報告編號:</Text>
              <Text style={styles.reportNumberValue}>{reportNumber}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity 
            style={styles.listItem}
            onPress={() => setProjectDialogVisible(true)}
          >
            <Text style={styles.listItemLabel}>項目</Text>
            <View style={styles.listItemValueContainer}>
              <Text style={styles.listItemValue}>
                {projectId 
                  ? projects.find(p => p.id === projectId)?.name || '選擇項目'
                  : '選擇項目'
                }
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
          <Divider />
          
          <TouchableOpacity 
            style={styles.listItem}
            onPress={() => setReportTypeDialogVisible(true)}
          >
            <Text style={styles.listItemLabel}>報告類型</Text>
            <View style={styles.listItemValueContainer}>
              <Text style={styles.listItemValue}>
                {reportTypeId 
                  ? reportTypes.find(t => t.id === reportTypeId)?.name || '選擇報告類型'
                  : '選擇報告類型'
                }
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* 報告描述部分 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>報告描述</Text>
          </View>
          <Divider />
          
          {/* 描述列表 - 改為手動渲染，避免嵌套FlatList */}
          {descriptions.length > 0 && (
            <View style={styles.descriptionsContainer}>
              {descriptions.map((item, index) => (
                <View key={item.id || index}>
                  <Swipeable
                    renderRightActions={() => (
                      <View style={styles.swipeActionContainer}>
                        <TouchableOpacity 
                          style={[styles.swipeAction, {backgroundColor: '#FF3B30'}]}
                          onPress={() => deleteDescription(index)}
                        >
                          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                          <Text style={[styles.swipeActionText, {color: '#FFFFFF'}]}>刪除</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  >
                    <TouchableOpacity 
                      style={styles.subListItem}
                      onPress={() => showEditDescriptionDialog(index)}
                    >
                      <View style={styles.descriptionHeader}>
                        <Text style={styles.descriptionNumber}>#{index + 1}</Text>
                        <Text 
                          style={styles.descriptionContent}
                          numberOfLines={2}
                        >
                          {item.content}
                        </Text>
                      </View>
                      <View style={styles.descriptionActions}>
                        <Ionicons name="pencil" size={20} color="#007AFF" />
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                  {index < descriptions.length - 1 && <Divider />}
                </View>
              ))}
            </View>
          )}
          
          {/* 添加描述按钮 */}
          <Swipeable
            renderRightActions={() => (
              <View style={styles.swipeActionContainer}>
                <TouchableOpacity 
                  style={styles.swipeAction}
                  onPress={() => showAddDescriptionDialog()}
                >
                  <Ionicons name="add-circle" size={24} color="#4CD964" />
                  <Text style={styles.swipeActionText}>添加描述</Text>
                </TouchableOpacity>
              </View>
            )}
          >
            <TouchableOpacity 
              style={styles.listItem}
              onPress={() => showAddDescriptionDialog()}
            >
              <View style={styles.descriptionHeader}>
                <Ionicons name="document-text-outline" size={24} color="#007AFF" style={{marginRight: 12}} />
                <Text style={styles.listItemLabel}>添加描述</Text>
              </View>
              <View style={styles.listItemValueContainer}>
                <Ionicons name="add-circle" size={20} color="#007AFF" />
              </View>
            </TouchableOpacity>
          </Swipeable>
          <Divider />
        </View>
        
        {/* 報告附圖部分 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>報告附圖</Text>
          </View>
          <Divider />
          
          {/* 圖片列表 - 改為手動渲染，避免嵌套FlatList */}
          {images.length > 0 ? (
            <View style={styles.imagesContainer}>
              {images.map((item, index) => (
                <View key={item.id || index}>
                  <Swipeable
                    renderRightActions={() => (
                      <View style={styles.swipeActionContainer}>
                        <TouchableOpacity 
                          style={[styles.swipeAction, {backgroundColor: '#FF3B30'}]}
                          onPress={() => deleteImage(index)}
                        >
                          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                          <Text style={[styles.swipeActionText, {color: '#FFFFFF'}]}>刪除</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  >
                    <View style={styles.imageListItem}>
                      <Text style={styles.imageNumber}>#{index + 1}</Text>
                      <TouchableOpacity 
                        style={styles.imageContainer}
                        onPress={() => previewImageHandler(item.uri)}
                        activeOpacity={0.7}
                      >
                        <Image 
                          source={{ uri: item.uri }} 
                          style={styles.image}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.imageInfo}
                        onPress={() => editImageDescription(index)}
                      >
                        <Text 
                          style={styles.imageDescription}
                          numberOfLines={1}
                        >
                          {item.description || '無描述'}
                        </Text>
                        {item.dateTaken && (
                          <Text style={styles.imageDateText}>{item.dateTaken}</Text>
                        )}
                        <View style={styles.imageButtonContainer}>
                          <Ionicons name="create-outline" size={20} color="#007AFF" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </Swipeable>
                  {index < images.length - 1 && <Divider />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyImageContainer}>
              <Text style={styles.emptyImageText}>暫無圖片，請添加</Text>
            </View>
          )}
          
          {/* 底部單行佈局 - 左右分割 */}
          <View style={styles.attachmentRow}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={pickImage}
            >
              <Ionicons name="images-outline" size={24} color="#007AFF" style={{marginRight: 8}} />
              <Text style={styles.attachmentButtonText}>相冊選擇</Text>
            </TouchableOpacity>
            
            <View style={styles.attachmentDivider} />
            
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={takePicture}
            >
              <Ionicons name="camera-outline" size={24} color="#007AFF" style={{marginRight: 8}} />
              <Text style={styles.attachmentButtonText}>拍照</Text>
            </TouchableOpacity>
          </View>
          <Divider />
        </View>
        
        {/* 報告總結部分 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>報告總結</Text>
          </View>
          <Divider />
          
          {/* 總結列表 - 改為手動渲染，避免嵌套FlatList */}
          {summaries.length > 0 && (
            <View style={styles.summariesContainer}>
              {summaries.map((item, index) => (
                <View key={item.id || index}>
                  <Swipeable
                    renderRightActions={() => (
                      <View style={styles.swipeActionContainer}>
                        <TouchableOpacity 
                          style={[styles.swipeAction, {backgroundColor: '#FF3B30'}]}
                          onPress={() => deleteSummary(index)}
                        >
                          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                          <Text style={[styles.swipeActionText, {color: '#FFFFFF'}]}>刪除</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  >
                    <TouchableOpacity 
                      style={styles.subListItem}
                      onPress={() => showEditSummaryDialog(index)}
                    >
                      <View style={styles.descriptionHeader}>
                        <Text style={styles.descriptionNumber}>#{index + 1}</Text>
                        <Text 
                          style={styles.descriptionContent}
                          numberOfLines={2}
                        >
                          {item.content}
                        </Text>
                      </View>
                      <View style={styles.descriptionActions}>
                        <Ionicons name="pencil" size={20} color="#007AFF" />
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                  {index < summaries.length - 1 && <Divider />}
                </View>
              ))}
            </View>
          )}
          
          {/* 添加總結按钮 */}
          <Swipeable
            renderRightActions={() => (
              <View style={styles.swipeActionContainer}>
                <TouchableOpacity 
                  style={styles.swipeAction}
                  onPress={() => showAddSummaryDialog()}
                >
                  <Ionicons name="add-circle" size={24} color="#4CD964" />
                  <Text style={styles.swipeActionText}>添加總結</Text>
                </TouchableOpacity>
              </View>
            )}
          >
            <TouchableOpacity 
              style={styles.listItem}
              onPress={() => showAddSummaryDialog()}
            >
              <View style={styles.descriptionHeader}>
                <Ionicons name="document-text-outline" size={24} color="#007AFF" style={{marginRight: 12}} />
                <Text style={styles.listItemLabel}>添加總結</Text>
              </View>
              <View style={styles.listItemValueContainer}>
                <Ionicons name="add-circle" size={20} color="#007AFF" />
              </View>
            </TouchableOpacity>
          </Swipeable>
          <Divider />
        </View>
        
        <Button 
          mode="contained" 
          style={styles.submitButton}
          onPress={generateReport}
          loading={loading}
          disabled={loading}
        >
          {editMode ? '保存報告' : '保存報告'}
        </Button>
      </ScrollView>
      
      {/* 項目選擇對話框 */}
      <Modal
        visible={projectDialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProjectDialogVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setProjectDialogVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>選擇項目</Text>
                  <TouchableOpacity onPress={() => setProjectDialogVisible(false)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                <Divider />
                
                <ScrollView style={styles.modalScrollView}>
                  {projects.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>暫無項目，請先添加項目</Text>
                    </View>
                  ) : (
                    projects.map(item => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.modalListItem}
                        onPress={() => handleSelectProject(item.id)}
                      >
                        <View style={styles.modalItemContent}>
                          <Text style={styles.modalItemTitle}>{item.name}</Text>
                          <Text style={styles.modalItemSubtitle}>編號: {item.code}</Text>
                        </View>
                        {projectId === item.id && (
                          <Ionicons name="checkmark" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 報告類型選擇對話框 */}
      <Modal
        visible={reportTypeDialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReportTypeDialogVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setReportTypeDialogVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>選擇報告類型</Text>
                  <TouchableOpacity onPress={() => setReportTypeDialogVisible(false)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                <Divider />
                
                <ScrollView style={styles.modalScrollView}>
                  {reportTypes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>暫無報告類型，請先添加報告類型</Text>
                    </View>
                  ) : (
                    reportTypes.map(item => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.modalListItem}
                        onPress={() => handleSelectReportType(item.id)}
                      >
                        <View style={styles.modalItemContent}>
                          <Text style={styles.modalItemTitle}>{item.name}</Text>
                          <Text style={styles.modalItemSubtitle}>編號: {item.code}</Text>
                        </View>
                        {reportTypeId === item.id && (
                          <Ionicons name="checkmark" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 描述對話框 */}
      <Modal
        visible={descriptionDialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDescriptionDialogVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDescriptionDialogVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingDescriptionIndex !== null ? '編輯描述' : '添加描述'}
                  </Text>
                  <TouchableOpacity onPress={() => setDescriptionDialogVisible(false)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                <Divider />
                
                <TextInput
                  label="描述內容"
                  value={currentDescription}
                  onChangeText={setCurrentDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={6}
                  style={styles.dialogInput}
                />
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={() => setDescriptionDialogVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={saveDescription}
                  >
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 圖片描述對話框 */}
      <Modal
        visible={imageDialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageDialogVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setImageDialogVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>圖片描述</Text>
                  <TouchableOpacity onPress={() => setImageDialogVisible(false)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                <Divider />
                
                <TextInput
                  label="描述此圖片"
                  value={currentImageDescription}
                  onChangeText={setCurrentImageDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.dialogInput}
                />
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={() => setImageDialogVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={saveImageDescription}
                  >
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 總結對話框 */}
      <Modal
        visible={summaryDialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSummaryDialogVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSummaryDialogVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingSummaryIndex !== null ? '編輯總結' : '添加總結'}
                  </Text>
                  <TouchableOpacity onPress={() => setSummaryDialogVisible(false)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                <Divider />
                
                <TextInput
                  label="總結內容"
                  value={currentSummary}
                  onChangeText={setCurrentSummary}
                  mode="outlined"
                  multiline
                  numberOfLines={6}
                  style={styles.dialogInput}
                />
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={() => setSummaryDialogVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={saveSummary}
                  >
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 圖片預覽 */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPreviewVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>圖片預覽</Text>
                  <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                <Divider />
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: previewImage }} 
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 相機視圖 */}
      {/* 移除此部分，因為不再使用Camera */}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flexGrow: 1,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // 滑动动作相关样式
  swipeActionContainer: {
    width: 100,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeAction: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F2F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionText: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 4,
  },
  // 图片日期水印
  imageContainer: {
    width: 80,
    height: 60,
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  // 圖片列表項
  imageListItem: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    height: 80, // 固定高度
  },
  imageNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    marginRight: 10,
    width: 28,
    textAlign: 'center',
  },
  imageInfo: {
    flex: 1,
    paddingLeft: 12,
    height: '100%',
    justifyContent: 'space-between',
  },
  imageDescription: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  imageDateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  imageButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  // 圖片預覽
  imagePreviewContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  titleInput: {
    margin: 16,
    backgroundColor: '#FFFFFF',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  subListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingLeft: 32,
    backgroundColor: '#F9F9F9',
  },
  listItemLabel: {
    color: '#000',
    fontSize: 17,
  },
  listItemValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemValue: {
    marginRight: 8,
    fontSize: 16,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    marginLeft: 10,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
  },
  descriptionHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    marginRight: 12,
    width: 30,
  },
  descriptionContent: {
    flex: 1,
    fontSize: 16,
  },
  descriptionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  generateButton: {
    margin: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
  },
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
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dialogInput: {
    margin: 16,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
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
  loadingContainer: {
    padding: 20,
    margin: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    width: '100%',
  },
  attachmentOptionsContainer: {
    backgroundColor: '#FFFFFF',
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  attachmentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentOptionText: {
    fontSize: 16,
    color: '#007AFF',
  },
  cameraButton: {
    padding: 8,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  attachmentButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  attachmentDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  emptyImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  emptyImageText: {
    marginTop: 10,
    color: '#999',
  },
  reportNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F2F7FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reportNumberLabel: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
  },
  reportNumberValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    margin: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
  },
  descriptionsContainer: {
    paddingBottom: 1, // 添加一點底部間距以防止視覺上的壓縮
  },
  summariesContainer: {
    paddingBottom: 1, // 添加一點底部間距以防止視覺上的壓縮
  },
  imagesContainer: {
    paddingBottom: 1, // 添加一點底部間距以防止視覺上的壓縮
  },
}); 