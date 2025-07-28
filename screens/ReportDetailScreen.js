import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, Portal, Dialog, RadioButton, List, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';

export default function ReportDetailScreen({ route, navigation }) {
  // 安全獲取路由參數
  const params = route.params || {};
  
  // 檢查參數中是否有報告對象或報告ID
  const initialReport = params.report; 
  const reportId = params.reportId;
  
  // 初始化報告狀態
  const [report, setReport] = useState(initialReport || {});
  const [reportLoaded, setReportLoaded] = useState(!!initialReport);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [layoutDialogVisible, setLayoutDialogVisible] = useState(false); 
  const [tempImageLayout, setTempImageLayout] = useState('');
  const [previewDialogVisible, setPreviewDialogVisible] = useState(false);
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
    content: {
      sectionSpacing: 30,    // 段落間距 (px)
      lineSpacing: 1.6,      // 行間距倍數
    }
  });
  
  // 用於存儲全局佈局設置的key
  const LAYOUT_STORAGE_KEY = 'pdfImageLayoutPreference';
  const PDF_SETTINGS_KEY = 'pdfPageSettings'; // PDF頁面設置存儲key
  
  const [pdfReady, setPdfReady] = useState(false); // 添加 pdfReady 狀態
  const [pdfUri, setPdfUri] = useState(initialReport?.pdfUri || null); // 安全獲取pdfUri
  
  // 使用ref跟蹤佈局對話框是否已顯示，避免因狀態更新異步導致的問題
  const layoutDialogShownRef = useRef(false);
  
  // 加載最新的報告數據和用戶信息
  useEffect(() => {
    const loadData = async () => {
      try {
        // 如果沒有初始報告對象，但有報告ID，則嘗試加載報告
        if (!initialReport && reportId) {
          console.log('嘗試通過reportId加載報告:', reportId);
        const reportsData = await AsyncStorage.getItem('reports');
        if (reportsData) {
          const reports = JSON.parse(reportsData);
            const loadedReport = reports.find(r => r.id === reportId);
            if (loadedReport) {
              console.log('已通過ID加載報告:', loadedReport.title);
              setReport(loadedReport);
              setReportLoaded(true);
              
              // 如果報告已有PDF，設置PDF URI
              if (loadedReport.pdfUri) {
                setPdfUri(loadedReport.pdfUri);
                setPdfReady(true);
              }
            } else {
              console.log('找不到指定ID的報告:', reportId);
              Alert.alert('錯誤', '找不到指定的報告');
              setTimeout(() => navigation.goBack(), 500);
              return;
            }
          } else {
            console.log('沒有找到任何報告數據');
            Alert.alert('錯誤', '沒有報告數據');
            setTimeout(() => navigation.goBack(), 500);
            return;
          }
        } else if (!initialReport && !reportId) {
          console.log('沒有提供報告數據或ID');
          Alert.alert('錯誤', '沒有報告數據');
          setTimeout(() => navigation.goBack(), 500);
          return;
        }
        
        // 1. 先嘗試從 SecureStore 加載當前登錄用戶信息 (更安全且可靠)
        let username = null;
        try {
          // 首先嘗試從 userInfo 中獲取真實姓名
          const userInfoString = await SecureStore.getItemAsync('userInfo');
          if (userInfoString) {
            const userInfo = JSON.parse(userInfoString);
            if (userInfo && userInfo.realName) {
              // 優先使用真實姓名
              username = userInfo.realName;
              console.log('報告加載時從SecureStore獲取到用戶真實姓名:', username);
            } else if (userInfo && userInfo.username) {
              // 如果沒有真實姓名，回退到使用用戶名
              username = userInfo.username;
              console.log('報告加載時從SecureStore獲取到用戶名(無真實姓名):', username);
            }
          }
          
          // 如果還沒有獲取到用戶名，從 userData 中獲取
          if (!username) {
            const secureUserDataString = await SecureStore.getItemAsync('userData');
            if (secureUserDataString) {
              const secureUserData = JSON.parse(secureUserDataString);
              if (secureUserData && secureUserData.username) {
                username = secureUserData.username;
                console.log('報告加載時從SecureStore userData獲取到用戶名:', username);
              }
            }
          }
        } catch (e) {
          console.log('從SecureStore加載用戶數據失敗:', e);
        }
        
        // 2. 如果 SecureStore 中沒有數據，則嘗試從 AsyncStorage 中加載
        if (!username) {
          // 先嘗試從 AsyncStorage 的 userInfo 獲取
          try {
            const userInfoString = await AsyncStorage.getItem('userInfo');
            if (userInfoString) {
              const userInfo = JSON.parse(userInfoString);
              if (userInfo && userInfo.realName) {
                username = userInfo.realName;
                console.log('從AsyncStorage userInfo獲取到用戶真實姓名:', username);
              } else if (userInfo && userInfo.username) {
                username = userInfo.username;
                console.log('從AsyncStorage userInfo獲取到用戶名(無真實姓名):', username);
              }
            }
          } catch (e) {
            console.log('從AsyncStorage獲取userInfo失敗:', e);
          }
          
          // 如果還沒有獲取到，從 AsyncStorage 的 userData 獲取
          if (!username) {
            try {
              const userDataString = await AsyncStorage.getItem('userData');
              if (userDataString) {
                const userData = JSON.parse(userDataString);
                if (userData && userData.username) {
                  username = userData.username;
                  console.log('從AsyncStorage userData獲取到用戶名:', username);
                }
              } else {
                console.log('未找到用戶登錄數據');
              }
            } catch (e) {
              console.log('用戶數據解析失敗:', e);
            }
          }
        }

        // 2. 加載報告數據
        const reportsData = await AsyncStorage.getItem('reports');
        if (reportsData) {
          const reports = JSON.parse(reportsData);
          let updatedReport = reports.find(r => r.id === initialReport.id);
          
          if (updatedReport) {
            let reportModified = false;
            
            // 確保報告對象有必要的屬性
            if (!updatedReport.hasOwnProperty('createdBy')) {
              updatedReport.createdBy = '';
              reportModified = true;
            }
            
            // 檢查報告是否有編制人
            if (username) {
              // 如果我們有用戶名，則直接設置到報告的專用字段
              updatedReport.reportCreatorName = username;
              
              // 同時也更新 createdBy 字段保持兼容性
              if (!updatedReport.createdBy || updatedReport.createdBy === '' || updatedReport.createdBy === '未指定') {
                updatedReport.createdBy = username;
              }
              
              reportModified = true;
              console.log('將報告編制人設置為當前用戶:', username);
            } else if (updatedReport.createdBy && updatedReport.createdBy !== '未指定') {
              console.log('報告已有編制人:', updatedReport.createdBy);
            } else {
              console.log('無法設置報告編制人: 無當前登錄用戶');
            }
            
            // 如果報告被修改了，更新儲存
            if (reportModified) {
              // 更新報告存儲
              const updatedReports = reports.map(r => 
                r.id === updatedReport.id ? updatedReport : r
              );
              await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
              console.log('已更新報告存儲，設置編制人:', updatedReport.createdBy);
            }
            
            setReport(updatedReport);
            
            // 檢查是否需要自動生成PDF（從報告列表頁面跳轉過來）
            if (params?.autoGeneratePdf && !layoutDialogShownRef.current) {
              console.log('檢測到autoGeneratePdf參數，將自動開始生成PDF...');
              layoutDialogShownRef.current = true; // 標記已經顯示過佈局對話框
              
              // 檢查是否需要顯示佈局選擇對話框
              if (params?.showLayoutDialog) {
                console.log('檢測到showLayoutDialog參數，顯示佈局選擇對話框');
                setTimeout(() => {
                  setLayoutDialogVisible(true);
                }, 300);
              }
              // 如果指定了佈局模式，則直接生成PDF
              else if (params?.pdfLayoutMode) {
                // 用定時器延遲一下，確保頁面和數據已完全加載
                setTimeout(() => {
                  generatePDFWithLayout(params.pdfLayoutMode, params?.directPreview || false);
                }, 500);
              }
              // 不再調用regeneratePDF，避免重複彈出對話框
            }
          }
        }
      } catch (error) {
        console.log('加載數據失敗', error);
      }
    };
    
    loadData();
    
    // 設置導航選項
    navigation.setOptions({
      title: report?.title || '報告詳情',
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {pdfReady ? (
            <>
              <TouchableOpacity
                onPress={previewPDF}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="document-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
              <TouchableOpacity
                onPress={shareReport}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="share-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={regeneratePDF}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="document-text-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={editReport}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="create-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [initialReport, reportId, params?.autoGeneratePdf, report?.title, pdfReady, navigation]);

  // 讀取保存的PDF頁面設置
  useEffect(() => {
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
    
    loadPdfSettings();
  }, []);

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // 查看大图
  const viewImage = (image) => {
    setSelectedImage(image);
    setImageViewerVisible(true);
  };

  // 关闭大图查看器
  const closeImageViewer = () => {
    setImageViewerVisible(false);
  };

  /**
   * 顯示佈局選擇對話框
   */
  const showLayoutDialog = async (isRegenerate = false) => {
    try {
      // 讀取上次選擇的佈局
      let savedLayout = 'auto';
      
      // 先檢查報告是否有保存的佈局
      if (report.imageLayout) {
        savedLayout = report.imageLayout;
        console.log('使用報告中保存的佈局:', savedLayout);
      } else {
        // 如果報告中沒有，則查詢全局設置
        const layoutPref = await AsyncStorage.getItem(LAYOUT_STORAGE_KEY);
        if (layoutPref) {
          savedLayout = layoutPref;
          console.log('使用全局保存的佈局:', savedLayout);
        } else {
          console.log('未找到已保存的佈局，使用默認值:', savedLayout);
        }
      }
      
      // 設置臨時佈局為上次選擇
      setTempImageLayout(savedLayout);
      console.log('設置臨時佈局為:', savedLayout);
      
      // 顯示對話框
      setLayoutDialogVisible(true);
    } catch (error) {
      console.log('讀取佈局偏好設置失敗:', error);
      setTempImageLayout('auto');
      setLayoutDialogVisible(true);
    }
  };
  
  /**
   * 確認佈局選擇並開始生成PDF
   */
  const confirmLayoutAndGeneratePDF = async (isRegenerate = false) => {
    try {
      if (!tempImageLayout) {
        console.log('未選擇佈局，使用默認值: auto');
        setTempImageLayout('auto');
      }
      
      const selectedLayout = tempImageLayout || 'auto';
      console.log('確認選擇佈局:', selectedLayout);
      
      // 保存佈局選擇到全局設置
      await AsyncStorage.setItem(LAYOUT_STORAGE_KEY, selectedLayout);
      console.log('已保存佈局設置到全局:', selectedLayout);
      
      // 保存到報告對象
      const newReport = { ...report, imageLayout: selectedLayout };
      setReport(newReport);
      
      // 更新報告存儲
      const reportsData = await AsyncStorage.getItem('reports');
      if (reportsData) {
        const reports = JSON.parse(reportsData);
        const updatedReports = reports.map(r => 
          r.id === report.id ? { ...r, imageLayout: selectedLayout } : r
        );
        await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
        console.log('已更新報告存儲的佈局設置');
      }
      
      // 關閉對話框
      setLayoutDialogVisible(false);
      
      // 確保不會再次觸發佈局選擇
      layoutDialogShownRef.current = true;
      
      // 根據選擇的佈局生成PDF
      console.log('開始使用所選佈局生成PDF:', selectedLayout);
      await generatePDFWithLayout(selectedLayout, true); // 設置第二個參數為true表示生成後直接預覽
    } catch (error) {
      console.log('保存佈局偏好設置失敗:', error);
      setLayoutDialogVisible(false);
      await generatePDFWithLayout('auto'); // 失敗時使用自動佈局
    }
  };

  /**
   * 生成PDF報告
   * 此函數為入口，會先彈出佈局選擇對話框
   */
  const generatePDF = async () => {
    console.log('開始生成PDF報告...');
    
    // 先顯示佈局選擇對話框
      showLayoutDialog(false);
  };

  /**
   * 重新生成PDF函數 - 先顯示佈局選擇對話框
   */
  const regeneratePDF = () => {
    console.log('準備重新生成PDF，首先顯示佈局選擇對話框');
    // 標記正在顯示佈局選擇對話框，避免重複觸發
    layoutDialogShownRef.current = true;
              showLayoutDialog(true);
  };

  // 預覽已生成的PDF
  const previewPDF = async () => {
    if (!report || !report.pdfUri) {
      Alert.alert('提示', '請先生成PDF文件');
      return;
    }
    
    try {
      // 檢查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(report.pdfUri);
      if (!fileInfo.exists) {
        Alert.alert('提示', 'PDF文件不存在，請重新生成');
        return;
      }
      
      console.log('開始預覽PDF文件:', report.pdfUri);
      // 確保使用最新的PDF URI，並使用正確的參數名稱
    navigation.navigate('PDFViewer', { 
      pdfUri: report.pdfUri, 
        title: report.title || '報告預覽',
        timestamp: new Date().getTime() // 添加時間戳以避免緩存問題
    });
    } catch (error) {
      console.log('檢查PDF文件失敗:', error);
      Alert.alert('錯誤', '無法預覽PDF文件: ' + error.message);
    }
  };

  // 分享报告
  const shareReport = async () => {
    if (!report) {
      Alert.alert('錯誤', '報告數據未加載');
      return;
    }
    
    try {
      // 檢查是否已生成PDF
      if (pdfUri || report.pdfUri) {
        const shareUri = pdfUri || report.pdfUri;
        
        // 檢查分享功能是否可用
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('錯誤', '您的設備不支持分享功能');
          return;
        }
        
        // 檢查文件是否存在
        const fileInfo = await FileSystem.getInfoAsync(shareUri);
        if (!fileInfo.exists) {
          Alert.alert('提示', 'PDF文件不存在，請重新生成');
          return;
        }
        
        await Sharing.shareAsync(shareUri, {
          mimeType: 'application/pdf',
          dialogTitle: `分享報告: ${report.title || '無標題報告'}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('提示', '請先生成PDF再分享');
      }
    } catch (error) {
      console.log('分享失敗:', error);
      Alert.alert('錯誤', '分享失敗: ' + (error.message || '未知錯誤'));
    }
  };

  // 編輯報告
  const editReport = () => {
    console.log('從詳情頁編輯報告:', report);
    navigation.navigate('新建報告', { 
      editMode: true, 
      reportData: report 
    });
  };



  /**
   * 生成HTML格式的报告
   * 此函數為入口，會根據傳入的佈局模式生成HTML
   */
  const generateReportHTML = (report, layoutMode, settings) => {
    // 获取今天的日期
    const today = new Date();
    const dateFormatted = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    // 根據選擇的佈局模式生成圖片模板
    let imageTemplates = '';
    if (report.images && report.images.length > 0) {
      // 確定每列顯示的圖片數量（每行有多少張圖片）
      let imagesPerRow;
      
      // 根據選擇的佈局模式決定每行圖片數量（列數）
      switch(layoutMode) {
        case '2x2':
          imagesPerRow = 2; // 2列2行（每行2張）
          break;
        case '2x3':
          imagesPerRow = 2; // 2列3行（每行2張）
          break;
        case '3x3':
          imagesPerRow = 3; // 3列3行（每行3張）
          break;
        case 'auto':
        default:
          // 自動模式：根據圖片總數決定佈局
          if (report.images.length <= 4) {
            imagesPerRow = 2; // 2列佈局
          } else {
            imagesPerRow = 3; // 3列佈局
          }
          break;
      }
      
      // 分組圖片
      for (let i = 0; i < report.images.length; i += imagesPerRow) {
        const rowImages = report.images.slice(i, i + imagesPerRow);
        
        // 計算間距和容器寬度
        const gapSize = 10; // 間隙為10px
        const totalGapWidth = (imagesPerRow - 1) * gapSize;
        
        // 創建行，使用平均分佈佈局和間隙
        imageTemplates += `<div class="image-row" style="display: flex; justify-content: space-between; width: 100%; gap: ${gapSize}px;">`;
         
        // 添加這一行的所有圖片
        rowImages.forEach((img, index) => {
          // 使用 base64 格式圖片，確保圖片能夠正確加載
          // 寬度使用計算值確保有間隙
          imageTemplates += `
            <div class="image-container" style="width: calc((100% - ${totalGapWidth}px) / ${imagesPerRow});">
              <div class="report-image-wrapper" style="width: 100%;">
                <img src="${img.uri}" class="report-image" />
              </div>
              <div class="image-description" style="width: 100%;">${img.description || '無描述'}</div>
            </div>
          `;
        });
        
        // 如果這行圖片不足固定數量，添加空白佔位
        const emptySlots = imagesPerRow - rowImages.length;
        for (let j = 0; j < emptySlots; j++) {
          imageTemplates += `<div class="image-container" style="width: calc((100% - ${totalGapWidth}px) / ${imagesPerRow}); visibility: hidden;">
            <div class="report-image-wrapper" style="width: 100%;"></div>
            <div class="image-description" style="width: 100%;"></div>
          </div>`;
        }
        
        imageTemplates += `</div>`;
      }
    }
    
    // 處理公司信息
    // 設置默認的公司信息
    const defaultCompanyInfo = {
      companyName: '未設置公司名稱',
      companyNameEn: '公司英文名稱',
      email: 'company@example.com',
      phone: '(+886) 12345678',
      fax: '(+886) 87654321',
      address: '公司地址',
      logo: null
    };
    
    // 調試輸出
    console.log('報告中的公司信息:', report.companyInfo);
    console.log('合併後的公司信息:', {
      ...defaultCompanyInfo,
      ...(report.companyInfo || {})
    });
    
    // 合併默認值和報告中的公司信息
    const companyInfo = {
      ...defaultCompanyInfo,
      ...(report.companyInfo || {})
    };
    
    // 公司Logo HTML
    let logoHTML = '';
    if (companyInfo.logo) {
      logoHTML = `<img src="${companyInfo.logo}" class="company-logo" alt="公司Logo" />`;
    }
    
    // 創建公司抬頭HTML - 將在每個頁面使用
    const createCompanyHeader = () => {
      if (settings.header.layout === 'horizontal') {
        return `
          <div class="company-header">
            <!-- Logo左側顯示 -->
            <div class="logo-container">
              ${logoHTML || `<div class="logo-placeholder"></div>`}
            </div>
            
            <!-- 中間區域 - 公司名稱 -->
            <div class="company-name-container">
              <h1 class="company-name">${companyInfo.companyName || '企業名稱'}</h1>
              <h2 class="company-name-en">${companyInfo.companyNameEn || ''}</h2>
            </div>
            
            <!-- 右側聯繫信息 - 添加分隔線和靠左對齊 -->
            <div class="company-contact-container">
              <div class="contact-item">
                <span class="contact-label">電話:</span>
                <span class="contact-value">${companyInfo.phone || ''}</span>
              </div>
              <div class="contact-item">
                <span class="contact-label">電郵:</span>
                <span class="contact-value">${companyInfo.email || ''}</span>
              </div>
              <div class="contact-item">
                <span class="contact-label">傳真:</span>
                <span class="contact-value">${companyInfo.fax || ''}</span>
              </div>
              <div class="contact-item">
                <span class="contact-label">地址:</span>
                <span class="contact-value">${companyInfo.address || ''}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="company-header">
            <!-- Logo頂部顯示 -->
            <div class="logo-container-vertical">
              ${logoHTML || `<div class="logo-placeholder-vertical"></div>`}
            </div>
            
            <!-- 垂直布局 - 公司名稱 -->
            <h1 class="company-name-vertical">${companyInfo.companyName || '企業名稱'}</h1>
            <h2 class="company-name-en-vertical">${companyInfo.companyNameEn || ''}</h2>
            
            <!-- 聯繫信息 -->
            <div class="contact-row">
              <span class="contact-item-vertical">Email: ${companyInfo.email || ''}</span>
              <span class="contact-item-vertical">Tel: ${companyInfo.phone || ''}</span>
            </div>
            
            <div class="contact-row">
              <span class="contact-item-vertical">Fax: ${companyInfo.fax || ''}</span>
              <span class="contact-item-vertical address">Address: ${companyInfo.address || ''}</span>
            </div>
          </div>
        `;
      }
    };
    
    // 創建頁腳HTML - 將在每個頁面使用
    const createFooter = (pageNumber = 1) => {
      return `
        <div class="page-footer">
          <div class="page-number">第 <span class="currentPage">${pageNumber}</span> 頁 / 共 2 頁</div>
        </div>
      `;
    };
    
    // 直接使用報告中預設的reportCreatorName或備用字段
    let reportCreator = '';
    
    // 檢查報告編製人姓名，優先級順序：
    // 1. 報告中的 reportCreatorName (最優先，這是我們在生成PDF時專門設置的)
    // 2. 報告中的 createdBy (如果不是"未指定"且不是空字符串)
    // 3. 默認值"報告編制人"
    if (report.reportCreatorName) {
      reportCreator = report.reportCreatorName;
      console.log('使用報告中的reportCreatorName字段:', reportCreator);
    } else if (report.createdBy && report.createdBy !== '未指定' && report.createdBy !== '') {
      reportCreator = report.createdBy;
      console.log('使用報告中的createdBy字段:', reportCreator);
    } else {
      reportCreator = '報告編制人';
      console.log('無可用的用戶名，使用默認值');
    }
    
    console.log('報告編製人設置為:', reportCreator);
    
    // 調試：打印完整的報告對象
    console.log('完整報告對象:', JSON.stringify({
      id: report.id,
      title: report.title,
      reportCreatorName: report.reportCreatorName,
      createdBy: report.createdBy,
      hasSignature: !!report.signature,
      hasImages: report.images && report.images.length > 0
    }));
    
    // 簽名區HTML (包含公司蓋章和簽名)
    let signatureHTML = '';
    
    // 使用已確定的報告編製人名稱
    const finalReportCreator = reportCreator;
    console.log('最終使用的報告編製人名稱:', finalReportCreator);
    
    // 檢查公司信息和蓋章
    const hasSeal = companyInfo && companyInfo.seal;
    console.log(`生成簽名區HTML - 有蓋章: ${hasSeal}, 報告編製人: ${finalReportCreator}`);
    
    // 生成簽名HTML - 兩列布局，左邊公章，右邊簽名
    // 檢查報告是否有簽名 - 確保總是顯示簽名區域
    console.log('報告簽名狀態:', report.signature ? '有簽名' : '無簽名');
    
    if (report.signature) {
      // 有簽名時顯示簽名圖像
      signatureHTML = `
        <div class="signature-section">
          <!-- 簽名行表格布局，增加間距並居中顯示 -->
          <table style="width: 90%; border-collapse: collapse; border: none; margin: 0 auto;">
            <tr>
              <td style="width: 40%; vertical-align: top; text-align: center; border: none; padding-right: 5%;">
                <!-- 左側公章 -->
                ${hasSeal ? `<img src="${companyInfo.seal}" class="company-seal-image" alt="公司蓋章" />` : '<div class="empty-seal"></div>'}
              </td>
              <td style="width: 10%; border: none;"></td> <!-- 增加中間間距 -->
              <td style="width: 40%; vertical-align: top; text-align: center; border: none; padding-left: 5%;">
                <!-- 右側簽名 -->
                <img src="${report.signature}" class="signature-image" alt="簽名" />
              </td>
            </tr>
            <tr>
              <td style="width: 40%; vertical-align: middle; text-align: center; border: none; padding-right: 5%;">
                <!-- 左側分割線 -->
                <div class="signature-divider-container">
                  <div class="signature-divider"></div>
                </div>
              </td>
              <td style="width: 10%; border: none;"></td> <!-- 增加中間間距 -->
              <td style="width: 40%; vertical-align: middle; text-align: center; border: none; padding-left: 5%;">
                <!-- 右側分割線 -->
                <div class="signature-divider-container">
                  <div class="signature-divider"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="width: 40%; vertical-align: top; text-align: center; border: none; padding-right: 5%;">
                <!-- 左側公司名稱 -->
                <p class="company-seal-text">${companyInfo.companyName || '公司名稱'}</p>
              </td>
              <td style="width: 10%; border: none;"></td> <!-- 增加中間間距 -->
              <td style="width: 40%; vertical-align: top; text-align: center; border: none; padding-left: 5%;">
                <!-- 右側報告編制人 -->
                <p class="signature-name"><strong>${finalReportCreator}</strong></p>
              </td>
            </tr>
          </table>
        </div>
      `;
    } else {
      // 沒有簽名時仍然顯示報告編制人和簽名區域
      signatureHTML = `
        <div class="signature-section">
          <!-- 簽名行表格布局，增加間距並居中顯示 -->
          <table style="width: 90%; border-collapse: collapse; border: none; margin: 0 auto;">
            <tr>
              <td style="width: 40%; vertical-align: top; text-align: center; border: none; padding-right: 5%;">
                <!-- 左側公章 -->
                ${hasSeal ? `<img src="${companyInfo.seal}" class="company-seal-image" alt="公司蓋章" />` : '<div class="empty-seal"></div>'}
              </td>
              <td style="width: 10%; border: none;"></td> <!-- 增加中間間距 -->
              <td style="width: 40%; vertical-align: top; text-align: center; border: none; padding-left: 5%;">
                <!-- 右側空白簽名區域 -->
                <div style="height: 80px; display: flex; align-items: center; justify-content: center;">
                  <p style="color: #999; font-style: italic;">無簽名</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="width: 40%; vertical-align: middle; text-align: center; border: none; padding-right: 5%;">
                <!-- 左側分割線 -->
                <div class="signature-divider-container">
                  <div class="signature-divider"></div>
                </div>
              </td>
              <td style="width: 10%; border: none;"></td> <!-- 增加中間間距 -->
              <td style="width: 40%; vertical-align: middle; text-align: center; border: none; padding-left: 5%;">
                <!-- 右側分割線 -->
                <div class="signature-divider-container">
                  <div class="signature-divider"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="width: 40%; vertical-align: top; text-align: center; border: none; padding-right: 5%;">
                <!-- 左側公司名稱 -->
                <p class="company-seal-text">${companyInfo.companyName || '公司名稱'}</p>
              </td>
              <td style="width: 10%; border: none;"></td> <!-- 增加中間間距 -->
              <td style="width: 40%; vertical-align: top; text-align: center; border: none; padding-left: 5%;">
                <!-- 右側報告編制人 -->
                <p class="signature-name"><strong>${finalReportCreator}</strong></p>
              </td>
            </tr>
          </table>
        </div>
      `;
    }
    
    // 描述HTML
    let descriptionsHTML = '';
    if (report.descriptions && report.descriptions.length > 0) {
      descriptionsHTML = `
        <div class="section">
          <h2>報告描述</h2>
          <div class="description-list" style="border: 1px solid #ddd; border-radius: 4px; padding: 15px;">
      `;
      
      report.descriptions.forEach((desc, index) => {
        descriptionsHTML += `
          <div class="description-item">
            <span class="description-number">${index + 1}.</span>
            <p class="description-content">${desc.content}</p>
          </div>
        `;
      });
      
      descriptionsHTML += `
          </div>
        </div>
      `;
    }
    
    // 總結HTML (不包含標題，標題在外部HTML結構中已包含)
    let summariesHTML = '';
    if (report.summaries && report.summaries.length > 0) {
      summariesHTML = `
          <div class="summary-list">
      `;
      
      report.summaries.forEach((summary, index) => {
        summariesHTML += `
          <div class="summary-item">
            <span class="summary-number">${index + 1}.</span>
            <p class="summary-content">${summary.content}</p>
          </div>
        `;
      });
      
      summariesHTML += `
        </div>
      `;
    }
    
          console.log('生成報告HTML，報告編制人:', report.createdBy || '未指定');
    
    // 輔助函數：生成第一頁圖片HTML，使用相同的佈局邏輯
    const generateFirstPageImageHTML = (images, layoutMode) => {
      if (!images || images.length === 0) return '';
      
      // 確定每列顯示的圖片數量（與主佈局一致）
      let imagesPerRow;
      
      // 根據選擇的佈局模式決定每行圖片數量（列數）
      switch(layoutMode) {
        case '2x2':
          imagesPerRow = 2;
          break;
        case '2x3':
          imagesPerRow = 2;
          break;
        case '3x3':
          imagesPerRow = 3;
          break;
        case 'auto':
        default:
          // 自動模式：根據圖片總數決定佈局
          if (images.length <= 4) {
            imagesPerRow = 2; // 2列佈局
          } else {
            imagesPerRow = 3; // 3列佈局
          }
          break;
      }
      
      // 從全局設置獲取圖片間距
      const gapSize = settings.images && settings.images.gap ? settings.images.gap : 10;
      
      // 確定第一頁最大行數
      let maxRows;
      switch(layoutMode) {
        case '2x2':
          maxRows = 2; // 2x2模式：最多2行
          break;
        case '2x3':
          maxRows = 2; // 2x3模式：最多2行
          break;
        case '3x3':
          maxRows = 3; // 3x3模式：最多3行
          break;
        default:
          maxRows = 2; // 默認最多2行
      }
      
      let html = '';
      // 分組圖片
      for (let i = 0; i < Math.min(images.length, imagesPerRow * maxRows); i += imagesPerRow) {
        const rowImages = images.slice(i, i + imagesPerRow);
        
        // 計算容器寬度
        const totalGapWidth = (imagesPerRow - 1) * gapSize;
        
        // 創建行，與主模板保持一致的樣式
        html += `<div class="image-row" style="display: flex; justify-content: space-between; width: 100%; gap: ${gapSize}px; margin-bottom: 15px;">`;
        
        // 添加這一行的所有圖片
        rowImages.forEach((img) => {
          html += `
            <div class="image-container" style="width: calc((100% - ${totalGapWidth}px) / ${imagesPerRow});">
              <div class="report-image-wrapper" style="width: 100%;">
                <img src="${img.uri}" class="report-image" />
              </div>
              <div class="image-description" style="width: 100%;">${img.description || '無描述'}</div>
            </div>
          `;
        });
        
        // 如果這行圖片不足固定數量，添加空白佔位
        const emptySlots = imagesPerRow - rowImages.length;
        for (let j = 0; j < emptySlots; j++) {
          html += `<div class="image-container" style="width: calc((100% - ${totalGapWidth}px) / ${imagesPerRow}); visibility: hidden;">
            <div class="report-image-wrapper" style="width: 100%;"></div>
            <div class="image-description" style="width: 100%;"></div>
          </div>`;
        }
        
        html += `</div>`;
      }
      
      return html;
    };
    
    // 輔助函數：生成剩餘圖片HTML
    const generateRemainingImagesHTML = (images, layoutMode) => {
      if (!images || images.length === 0) return '';
      
      // 確定每列顯示的圖片數量
      let imagesPerRow;
      
      // 根據佈局模式決定每行圖片數量
      switch(layoutMode) {
        case '2x2':
        case '2x3':
          imagesPerRow = 2;
          break;
        case '3x3':
          imagesPerRow = 3;
          break;
        case 'auto':
        default:
          imagesPerRow = 3;
          break;
      }
      
      // 從全局設置獲取圖片間距，與第一頁保持一致
      const gapSize = settings.images && settings.images.gap ? settings.images.gap : 10;
      
      let html = '';
      // 分組圖片
      for (let i = 0; i < images.length; i += imagesPerRow) {
        const rowImages = images.slice(i, i + imagesPerRow);
        
        // 計算間距和容器寬度
        const totalGapWidth = (imagesPerRow - 1) * gapSize;
        
        // 創建行，確保行之間有足夠的間距
        html += `<div class="image-row" style="display: flex; justify-content: space-between; width: 100%; gap: ${gapSize}px; margin-bottom: 15px;">`;
        
        // 添加這一行的所有圖片
        rowImages.forEach((img) => {
          html += `
            <div class="image-container" style="width: calc((100% - ${totalGapWidth}px) / ${imagesPerRow});">
              <div class="report-image-wrapper" style="width: 100%;">
                <img src="${img.uri}" class="report-image" />
              </div>
              <div class="image-description" style="width: 100%;">${img.description || '無描述'}</div>
            </div>
          `;
        });
        
        // 如果這行圖片不足固定數量，添加空白佔位
        const emptySlots = imagesPerRow - rowImages.length;
        for (let j = 0; j < emptySlots; j++) {
          html += `<div class="image-container" style="width: calc((100% - ${totalGapWidth}px) / ${imagesPerRow}); visibility: hidden;">
            <div class="report-image-wrapper" style="width: 100%;"></div>
            <div class="image-description" style="width: 100%;"></div>
          </div>`;
        }
        
        html += `</div>`;
      }
      
      return html;
    };
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${report.title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          
          <!-- 添加字體支援 -->
          <style>
            /* 確保字體可用性 */
            @font-face {
              font-family: 'PMingLiU';
              src: local('PMingLiU'), local('新細明體');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: '新細明體';
              src: local('新細明體'), local('PMingLiU');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: 'KaiTi';
              src: local('KaiTi'), local('楷體'), local('DFKai-SB');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: '楷體';
              src: local('楷體'), local('KaiTi'), local('DFKai-SB');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: 'SimSun';
              src: local('SimSun'), local('宋體');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: '宋體';
              src: local('宋體'), local('SimSun');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: 'SimHei';
              src: local('SimHei'), local('黑體');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: '黑體';
              src: local('黑體'), local('SimHei');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: 'Microsoft YaHei';
              src: local('Microsoft YaHei'), local('微軟雅黑');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
            @font-face {
              font-family: '微軟雅黑';
              src: local('微軟雅黑'), local('Microsoft YaHei');
              font-weight: normal;
              font-style: normal;
              unicode-range: U+0000-FFFF;
            }
          </style>
          <style>
            /* 強制啟用表頭在每頁重複顯示 */
            @media print {
              thead, .report-header {
                display: table-header-group !important;
                visibility: visible !important;
                position: static !important;
              }
              tfoot {
                display: table-footer-group !important;
                visibility: visible !important;
                position: static !important;
              }
              .pageNumber:after {
                content: counter(page);
              }
              .totalPages:after {
                content: counter(pages);
              }
            }
            
            @page {
              size: A4 portrait !important; /* 明確指定A4紙張和縱向 */
              margin: ${Math.max(5, settings.margins.top-3)}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm !important; /* 減少頂部邊距 */
              padding: 0 !important;
              counter-increment: page;
              counter-reset: page 1;
            }
                        
            /* 基本樣式 */
              body {
              font-family: ${settings.fonts && settings.fonts.family ? settings.fonts.family : '"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif'} !important;
              font-size: ${settings.fonts && settings.fonts.size ? settings.fonts.size : 11}pt !important;
                margin: 0;
                  padding: 0;
              color: #333;
              background-color: white;
            }
            
            /* 內容區域元素繼承字體，但排除頁面抬頭和頁腳 */
            .page-content * {
              font-family: inherit;
            }
            
            /* 確保HTML內容區域使用設定的字體 */
            .page-content p, .page-content span, .page-content div, 
            .page-content li, .page-content td, .page-content th, 
            .page-content caption, .summary-content, .description-content,
            .image-description, .report-title, h2 {
              font-family: ${settings.fonts && settings.fonts.family ? settings.fonts.family : '"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif'} !important;
            }
            
            /* 報告容器 */
            .report-container {
              width: 100%;
              position: relative;
            }
            
            /* PDF頁面 */
            .pdf-page {
              position: relative;
              width: 100%;
              box-sizing: border-box;
              margin: 0;
              padding: 0 0 30px 0; /* 最小化底部留出的頁腳空間 */
              page-break-after: always; /* 強制每頁後分頁 */
              min-height: 29.7cm; /* A4高度 */
            }
            
            /* 減小內容容器的外邊距，保持左右邊距一致 */
            .page-content, .title-section, .section {
              padding-left: 0;
              padding-right: 0;
              margin-left: 0;
              margin-right: 0;
            }
            
            /* 最後一頁不需要分頁 */
            .pdf-page:last-child {
                  page-break-after: auto;
                }
            
            /* 頁面內容區域 */
            .page-content {
              padding-top: 5px;
              padding-bottom: 45px; /* 為頁腳留出空間 */
              padding-left: 0;
              padding-right: 0;
            }
            
            /* 調整間距和佈局 */
            .title-section {
              margin-bottom: 12px;
            }
            
                .section {
              margin-bottom: 10px;
              page-break-inside: avoid; /* 避免段落內部分頁 */
            }
            
            /* 確保報告總結緊跟在附圖後面 */
            .section + .section {
              margin-top: 10px;
              padding-top: 5px;
            }
            
            /* 縮小h2標題的間距並設定字體 */
            h2 {
              font-family: ${settings.fonts && settings.fonts.family ? settings.fonts.family : '"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif'} !important;
              font-size: ${settings.content && settings.content.headingFontSize ? settings.content.headingFontSize : 14}pt !important;
              margin-top: 10px;
              margin-bottom: 10px;
              padding-bottom: 5px;
            }
            
                                      /* 頁眉頁腳樣式 */
            .company-header {
              margin-bottom: 10px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              background-color: white;
              width: 100%;
            }
            
            .page-footer {
              font-family: ${settings.footer && settings.footer.font ? `"${settings.footer.font}", ` : ''}"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif;
              margin-top: 10px;
              text-align: center;
              border-top: 1px solid #ddd;
              font-size: ${settings.footer && settings.footer.fontSize ? settings.footer.fontSize : 10}pt;
              color: #666;
              width: 100%;
              position: absolute;
              bottom: 15px;
              left: 0;
              right: 0;
              height: ${settings.footer && settings.footer.height ? settings.footer.height : 40}px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            /* 頁碼垂直居中 */
            .page-number {
              display: inline-block;
              line-height: normal;
              vertical-align: middle;
            }
            
            /* 打印相關樣式 */
            @media print {
              @page {
                size: A4 portrait;
                margin: ${Math.max(5, settings.margins.top-3)}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
              }
              
              /* 確保頁面正確分頁 */
              .pdf-page {
                height: calc(29.7cm - ${Math.max(5, settings.margins.top-3)}mm - ${settings.margins.bottom}mm);
              width: 100%;
                page-break-after: always;
                overflow: hidden;
              padding: 0;
              box-sizing: border-box;
              }
              
              /* 避免內容與頁眉頁腳重疊 */
              .page-content {
                padding-top: 5mm;
                padding-bottom: 12mm;
              }
              
              /* 防止元素被分頁 */
              h2 { page-break-after: avoid; }
              .image-row { page-break-inside: avoid; }
            }
            
            /* 公司抬頭樣式 */
            .company-header {
              display: flex;
              flex-direction: ${settings.header.layout === 'horizontal' ? 'row' : 'column'};
              align-items: ${settings.header.layout === 'horizontal' ? 'flex-start' : 'center'};
              border-bottom: 1px solid #eee;
              padding-bottom: 3px;
              margin-bottom: 10px;
              background-color: transparent;
            }
            
            /* 水平佈局樣式 */
            .logo-container {
              width: 80px;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              margin-right: 15px;
              margin-top: 0;
            }
            
            .logo-placeholder {
              height: 80px;
              width: 80px;
            }
            
            .company-name-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              text-align: left;
            }
            
            /* 公司名稱 - 確保使用抬頭設置而非全局字體 */
            .company-name {
              font-family: ${settings.header.companyNameFont ? `"${settings.header.companyNameFont}", ` : ''}"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, 'DFKai-SB', serif !important;
              font-size: ${settings.header.companyNameFontSize}pt !important;
              font-weight: bold;
              margin: 0 0 2px 0;
              line-height: 1.2;
              text-align: left;
            }
            
            /* 公司英文名稱 - 使用抬頭設置 */
            .company-name-en {
              font-family: ${settings.header.companyEnNameFont ? `"${settings.header.companyEnNameFont}", ` : ''}"新細明體", PMingLiU, Arial, Helvetica, sans-serif !important;
              font-size: ${settings.header.companyEnNameFontSize}pt !important;
              margin: 0 0 5px 0;
              line-height: 1.1;
              color: #333;
              border-bottom: none;
              text-align: left;
            }
            
            .company-contact-container {
              width: 260px;
              text-align: left;
              border-left: 1px solid #ccc;
              padding-left: 15px;
            }
            
            .contact-item {
              margin-bottom: 2px;
              text-align: left;
            }
            
            /* 聯繫信息標籤 - 使用抬頭設置 */
            .contact-label {
              font-family: ${settings.header.contactInfoFont ? `"${settings.header.contactInfoFont}", ` : ''}"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif !important;
              font-size: ${settings.header.contactInfoFontSize}pt !important;
              font-weight: bold;
            }
            
            /* 聯繫信息值 - 使用抬頭設置 */
            .contact-value {
              font-family: ${settings.header.contactInfoFont ? `"${settings.header.contactInfoFont}", ` : ''}"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif !important;
              font-size: ${settings.header.contactInfoFontSize}pt !important;
            }
            
            /* 垂直佈局樣式 */
            .logo-container-vertical {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 4px;
              margin-top: 0;
            }
            
            .logo-placeholder-vertical {
              height: 50px;
              width: 120px;
            }
            
            /* 垂直佈局公司名稱 - 使用抬頭設置 */
            .company-name-vertical {
              font-family: ${settings.header.companyNameFont ? `"${settings.header.companyNameFont}", ` : ''}"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, 'DFKai-SB', serif !important;
              font-size: ${settings.header.companyNameFontSize}pt !important;
              font-weight: bold;
              margin: 0 0 2px 0;
              line-height: 1.2;
              text-align: center;
            }
            
            /* 垂直佈局公司英文名稱 - 使用抬頭設置 */
            .company-name-en-vertical {
              font-family: ${settings.header.companyEnNameFont ? `"${settings.header.companyEnNameFont}", ` : ''}"新細明體", PMingLiU, Arial, Helvetica, sans-serif !important;
              font-size: ${settings.header.companyEnNameFontSize}pt !important;
              margin: 2px 0 8px 0;
              line-height: 1.1;
              color: #555;
              text-align: center;
              border-bottom: none;
            }
            
            .contact-row {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              margin: 0 0 3px 0;
              width: 100%;
            }
            
            /* 垂直佈局聯繫信息 - 使用抬頭設置 */
            .contact-item-vertical {
              font-family: ${settings.header.contactInfoFont ? `"${settings.header.contactInfoFont}", ` : ''}"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif !important;
              font-size: ${settings.header.contactInfoFontSize}pt !important;
              color: #555;
              margin: 0 5px;
              padding: 0;
              line-height: 1.3;
              white-space: nowrap;
              font-weight: 500;
            }
            
            .address {
              max-width: 300px;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            /* 公司Logo */
            .company-logo {
              max-width: 120px;
              max-height: 50px;
            }
            
            /* 頁腳樣式 */
            .page-footer {
              position: absolute;
              bottom: 5px; /* 從底部升高一點 */
              left: 0;
              right: 0;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 5px; /* 增加與上方分割線的間距 */
              padding-bottom: 0; /* 無底部間距 */
              margin-top: 0;
              display: flex;
              align-items: center; /* 垂直居中 */
              justify-content: center; /* 水平居中 */
              min-height: 22px; /* 稍微增加高度以適應上方間距 */
              height: 22px; /* 固定高度 */
              overflow: hidden; /* 防止內容溢出 */
            }
            
            .page-number {
              font-size: 10pt;
              color: #333;
              font-weight: 500;
              margin: 0; /* 無外邊距 */
              padding: 0; /* 無內邊距 */
              line-height: 1; /* 最小行高 */
            }
            
            /* 標題和信息區域 */
            .title-section {
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #eee;
            }
            
            .report-title {
                font-family: ${settings.fonts && settings.fonts.family ? settings.fonts.family : '"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif'} !important;
                font-size: ${settings.content && settings.content.titleFontSize ? settings.content.titleFontSize : 20}pt !important;
              font-weight: bold;
                margin: 0 0 4px 0;
            }
              
              /* 信息區域樣式 */
            .info-section {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
                font-size: 10pt;
              padding: 0;
            }
              
            .info-column {
              width: 49%;
            }
              
            .info-row {
              display: flex;
              margin-bottom: 6px;
            }
              
            .info-label {
              font-weight: bold;
                width: 80px;
              }
              
              /* 圖片相關樣式 */
              .image-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                padding: 0;
                width: 100%;
                box-sizing: border-box;
                gap: ${settings.images && settings.images.gap ? settings.images.gap : 10}px;
              }
              
              .image-container {
                width: calc((100% - 20px) / 3);
                display: inline-block;
                text-align: center;
                margin: 0;
                vertical-align: top;
              }
              
              .report-image-wrapper {
                height: ${settings.images && settings.images.height ? settings.images.height : 160}px;
                width: 100%;
                border: 1px solid #ddd;
                border-radius: 2px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 2px;
                padding: 6px;
                box-sizing: border-box;
              }
              
              .report-image {
                max-width: calc(100% - 12px);
                max-height: calc(100% - 12px);
                object-fit: contain;
              }
              
                          .image-description {
              font-family: ${settings.fonts && settings.fonts.family ? settings.fonts.family : '"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif'} !important;
              margin-top: 2px;
              font-size: ${settings.content && settings.content.captionFontSize ? settings.content.captionFontSize : 9}pt;
              color: #666;
              text-align: center;
              padding: 0;
              width: 100%;
              line-height: 1.2;
            }
              
              /* 段落和標題樣式 */
              .section {
                margin: ${settings && settings.content ? settings.content.sectionSpacing : 30}px 0;
              }
              
              /* 附圖部分特別設置 */
              .image-section {
                margin-top: ${settings && settings.content ? Math.max(10, settings.content.sectionSpacing - 10) : 20}px;
              }
              
              /* 第二頁附圖部分特殊設置 */
              .second-page-images {
                margin-top: 0 !important; /* 第二頁上方無邊距 */
                padding-top: 0 !important;
              }
              
              .image-title {
                margin-top: 0 !important;
                padding-top: 0;
              }
              
              /* 第二頁標題特殊設置 */
              .second-page-title {
                margin-top: 0 !important;
                padding-top: 0 !important;
                margin-bottom: 10px; /* 保持下方間距 */
              }
              
              h2 {
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                color: #333;
                text-align: center;
                font-size: 14pt;
                margin-top: 10px;
              }
              
              /* 描述和總結樣式 */
              .description-list, .summary-list {
              padding: 15px;
              }
              
              .description-box {
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 10px;
              }
              
              .description-item, .summary-item {
                display: flex;
                margin-bottom: 15px;
              }
              
              .description-number, .summary-number {
                font-weight: bold;
                margin-right: 10px;
                min-width: 20px;
              }
              
              .description-content, .summary-content {
                flex: 1;
                margin: 0;
                font-family: ${settings.fonts && settings.fonts.family ? settings.fonts.family : '"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif'} !important;
                font-size: ${settings.fonts && settings.fonts.size ? settings.fonts.size : 11}pt !important;
                line-height: ${settings && settings.content ? settings.content.lineSpacing : 1.6};
              }
              
                          /* 公司蓋章樣式 */
            .company-seal-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              padding: 5px 0;
            }
            
            .empty-seal {
              height: 120px; /* 與有蓋章時保持相同高度 */
            }
            
            .company-seal-image {
              width: 90px;
              height: 90px;
              opacity: 0.85; /* 稍微透明以顯示為蓋章效果 */
              object-fit: contain;
              margin-bottom: 0; /* 減少底部間距以使分割線更靠近 */
            }
            
            .company-seal-text {
              margin-top: 8px;
              margin-bottom: 5px;
              font-size: 12pt; /* 與簽名區域字體大小一致 */
              color: #333;
              text-align: center;
              width: 100%;
              word-wrap: break-word; /* 確保長文本換行 */
              font-weight: bold;
            }
            
            /* 簽名相關樣式 */
            .signature-section {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
            }
            
            .signature-left {
              width: 45%;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            .signature-right {
              width: 45%;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            .signature-image {
              max-width: 120px;
              max-height: 70px;
              margin-bottom: 0; /* 減少底部間距以使分割線更靠近 */
            }
            
            .signature-name {
              margin-top: 10px;
              font-weight: bold;
              font-size: 12pt;
              width: 100%;
            }
            
            .signature-date {
              color: #666;
              margin-bottom: 10px;
              font-size: 12pt;
              width: 100%;
            }
            
            .signature-divider-container {
              width: 60%; /* 縮短分割線長度 */
              margin-top: 5px; /* 減少與圖標/簽名的間距 */
              display: flex;
              justify-content: center;
              align-items: center;
              height: 20px; /* 降低固定高度使分割線更貼近上方元素 */
              margin: 0 auto; /* 居中顯示 */
            }
            
            .signature-divider {
              border-bottom: 1.5px solid #000; /* 稍微加粗分割線 */
              width: 100%;
            }
                          /* 打印相關樣式 */
              @media print {
                /* 基本打印設置 */
                body {
                  width: 21cm;
                  height: 29.7cm;
                  margin: 0;
                  padding: 0;
                }
                
                /* 確保頁面正確分頁 */
                .page {
                  page-break-after: always;
                  width: 100%;
                  height: auto;
                  position: relative;
                }
                
                .page:last-child {
                  page-break-after: auto;
                }
                
                /* 避免關鍵元素被分頁 */
                .image-container {
                  page-break-inside: avoid;
                }
                
                h2 {
                  page-break-after: avoid;
                }
                
                /* 確保內容顏色正確打印 */
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                /* 使用CSS計數器來顯示總頁數 */
                .total-pages:after {
                  content: counter(pages);
                }
            }
            .image-row {
              display: flex;
              justify-content: space-between; /* 平均分布 */
              margin-bottom: 12px; /* 縮小行間距 */
              padding: 0; /* 移除內邊距 */
              width: 100%; /* 確保佔滿容器寬度 */
              box-sizing: border-box; /* 確保寬度計算包含邊框和內邊距 */
              gap: ${settings.images && settings.images.gap ? settings.images.gap : 10}px; /* 使用設置中的圖片間距 */
              margin-left: 0;
              margin-right: 0;
            }
            .image-container {
              width: calc((100% - 20px) / 3); /* 寬度計算：(100% - 兩個10px間隙寬度)/3個容器 */
              display: inline-block;
              text-align: center;
              margin: 0 0 15px 0; /* 底部增加邊距，確保行間距 */
              vertical-align: top;
            }
            .report-image-wrapper {
              height: ${settings.images && settings.images.height ? settings.images.height : 140}px; /* 減小默認圖片高度以適應更多內容 */
              width: 100%; /* 使用100%寬度以適應容器 */
              border: 1px solid #ddd;
              border-radius: 2px; /* 減少圓角 */
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 2px; /* 減少與描述的間距 */
              padding: 6px; /* 添加內部間距，使圖片不貼緊框邊緣 */
              box-sizing: border-box; /* 確保padding不會增加總尺寸 */
            }
            .report-image {
              max-width: calc(100% - 12px); /* 減去左右內部間距 */
              max-height: calc(100% - 12px); /* 減去上下內部間距 */
              object-fit: contain; /* 保持原比例 */
            }
            
            /* 恢復使用全局設置的圖片容器尺寸 */
            .image-container-first-page .report-image-wrapper {
              height: ${settings.images && settings.images.height ? settings.images.height : 160}px; /* 使用全局設置的高度 */
            }
            .image-description {
              margin-top: 2px;
              font-size: 9pt; /* 縮小字體 */
              color: #666;
              text-align: center;
              padding: 0;
              width: 100%; /* 描述寬度與容器一致 */
              line-height: 1.2;
            }
            .section {
              margin: ${settings && settings.content ? settings.content.sectionSpacing : 30}px 0;
            }
            h2 {
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
              color: #333;
              text-align: center; /* 標題居中 */
              font-size: 14pt;
            }
            .description-list, .summary-list {
              padding: 15px;
            }
            .description-box {
              border: 1px solid #ddd;
              border-radius: 4px;
              margin-top: 10px;
            }
            .description-item, .summary-item {
              display: flex;
              margin-bottom: 15px;
            }
            .description-number, .summary-number {
              font-weight: bold;
              margin-right: 10px;
              min-width: 20px;
            }
            .description-content, .summary-content {
              font-family: ${settings.content && settings.content.font ? `"${settings.content.font}", ` : ''}"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif;
              font-size: ${settings.content && settings.content.fontSize ? settings.content.fontSize : 11}pt;
              flex: 1;
              margin: 0;
              line-height: ${settings && settings.content ? settings.content.lineSpacing : 1.6};
            }
            .signature-section {
              margin-top: 50px;
              text-align: right;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .signature-image {
              max-width: 150px;
              max-height: 80px;
            }
            .signature-name {
              margin-top: 10px;
              font-weight: bold;
            }
            .signature-date {
              color: #666;
            }
            /* 頁腳設定 - 總高度約為60px (包含邊距和邊框) */
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: ${settings.footer.fontSize}pt;
              color: #999;
              padding-top: 20px;
              padding-bottom: 10px; /* 確保頁腳有足夠底部間距 */
              border-top: 1px solid #eee;
              position: relative;
              height: ${settings.footer.height}px;
            }
            .page-number {
              position: running(footerPosition);
              text-align: center;
              font-size: 10pt;
              color: #666;
              height: 20px; /* 頁碼高度 */
            }
          </style>
        </head>
        <body onload="preparePdfDocument()">
          <!-- 使用硬分頁方式確保每頁都有抬頭和頁腳 -->
          <div class="report-container">
            <!-- 分頁1: 公司抬頭 + 基本信息 + 描述 + 附圖開始 -->
            <div class="pdf-page">
              <!-- 公司抬頭 -->
              ${createCompanyHeader()}
              
              <div class="page-content">
                <!-- 報告標題和基本信息 -->
                <div class="title-section">
                    <h1 class="report-title">${report.title}</h1>
                  <div class="info-section">
                    <div class="info-column">
                      <div class="info-row">
                          <span class="info-label">報告編號:</span>
                          <span>${report.reportNumber || '無編號'}</span>
                        </div>
                      <div class="info-row">
                          <span class="info-label">項目名稱:</span>
                          <span>${report.projectName}</span>
                        </div>
                      </div>
                      <div class="info-column">
                      <div class="info-row">
                          <span class="info-label">報告類型:</span>
                          <span>${report.reportTypeName}</span>
                        </div>
                      <div class="info-row">
                          <span class="info-label">生成日期:</span>
                          <span>${dateFormatted}</span>
                        </div>
                      </div>
                    </div>
                  </div>
            
                    <!-- 報告描述 -->
                      ${descriptionsHTML}
                  
                <!-- 報告附圖（第一頁） - 根據圖片數量動態顯示 -->
                ${report.images && report.images.length > 0 ? `
                <div class="section image-section">
                  <h2 class="image-title">報告附圖</h2>
                  <!-- 第一頁顯示適量圖片，根據佈局模式可能顯示2-9張 -->
                  <div class="image-container-first-page">
                    ${generateFirstPageImageHTML(report.images.slice(0, layoutMode === '2x2' || layoutMode === '2x3' ? 4 : (layoutMode === '3x3' ? 9 : 6)), layoutMode)}
                  </div>
                </div>
                ` : ''}
                      </div>

              <!-- 頁腳 -->
              ${createFooter(1)}
            </div>
            
            <!-- 分頁2: 附圖延續 + 報告總結 (如果有) -->
            ${(report.images && report.images.length > (layoutMode === '2x2' || layoutMode === '2x3' ? 4 : (layoutMode === '3x3' ? 9 : 6))) || (report.summaries && report.summaries.length > 0) ? `
            <div class="pdf-page">
              <!-- 公司抬頭 -->
              ${createCompanyHeader()}
              
              <div class="page-content">
                <!-- 附圖延續（如果有）-->
                ${report.images && report.images.length > (layoutMode === '2x2' || layoutMode === '2x3' ? 4 : (layoutMode === '3x3' ? 9 : 6)) ? `
                <div class="section image-section second-page-images">
                  <h2 class="image-title second-page-title">報告附圖（續）</h2>
                  <!-- 顯示剩餘的圖片 -->
                  ${generateRemainingImagesHTML(report.images.slice(layoutMode === '2x2' || layoutMode === '2x3' ? 4 : (layoutMode === '3x3' ? 9 : 6)), layoutMode)}
                </div>
                ` : ''}
                
                <!-- 報告總結（如果有）-->
                ${report.summaries && report.summaries.length > 0 ? `
                <div class="section">
                  <h2>報告總結</h2>
                      ${summariesHTML}
                </div>
                ` : ''}
            
                <!-- 簽名部分 - 始終顯示，無條件判斷 -->
                ${signatureHTML}
              </div>
              
              <!-- 頁腳 -->
              ${createFooter(2)}
                      </div>
            ` : `
            <!-- 當沒有額外內容時，仍然添加第二頁並顯示簽名 -->
            <div class="pdf-page">
              <!-- 公司抬頭 -->
              ${createCompanyHeader()}
              
              <div class="page-content">
                <!-- 簽名部分 -->
                ${signatureHTML}
              </div>
              
              <!-- 頁腳 -->
              ${createFooter(2)}
            </div>
            `}
                    </div>
          
          <script>
            // 只設置當前頁碼，總頁數已在HTML中硬編碼為2
            function preparePdfDocument() {
              try {
                // 僅設置當前頁碼
                var visiblePages = document.querySelectorAll('.pdf-page');
                if (visiblePages.length > 0) {
                  // 第一頁
                  var firstPage = visiblePages[0];
                  var firstPageNumElement = firstPage.querySelector('.currentPage');
                  if (firstPageNumElement) {
                    firstPageNumElement.textContent = "1";
                  }
                  
                  // 第二頁
                  if (visiblePages.length > 1) {
                    var secondPage = visiblePages[1];
                    var secondPageNumElement = secondPage.querySelector('.currentPage');
                    if (secondPageNumElement) {
                      secondPageNumElement.textContent = "2";
                    }
                  }
                }
              } catch (error) {
                console.error('頁碼更新錯誤:', error);
              }
            }
            
            // 在頁面加載後執行頁碼更新
            window.addEventListener('load', function() {
              setTimeout(preparePdfDocument, 300);
            });
          </script>
        </body>
      </html>
    `;
  };

  /**
   * 使用指定佈局生成PDF報告
   * 此函數包含實際的PDF生成邏輯
   * @param {string} layoutMode - 圖片佈局模式
   * @param {boolean} previewAfterGenerate - 生成後是否直接預覽
   */
  const generatePDFWithLayout = async (layoutMode, previewAfterGenerate = false) => {
    console.log('執行PDF生成函數 - 使用佈局模式:', layoutMode, '生成後預覽:', previewAfterGenerate);
    setGenerating(true);
    
    try {
      // 確保我們有最新的報告數據 (包括編製人信息)
      let updatedReportData = { ...report };
      let username = null;
      
      // 嘗試從SecureStore獲取用戶姓名 (這是最可靠的來源)
      try {
        // 首先嘗試從 SecureStore 的 userInfo 中獲取真實姓名
        const userInfoString = await SecureStore.getItemAsync('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          if (userInfo && userInfo.realName) {
            // 優先使用真實姓名
            username = userInfo.realName;
            console.log('從SecureStore獲取到用戶真實姓名:', username);
          } else if (userInfo && userInfo.username) {
            // 如果沒有真實姓名，回退到使用用戶名
            username = userInfo.username;
            console.log('從SecureStore獲取到用戶名(無真實姓名):', username);
          }
        }

        // 如果 userInfo 中沒有數據，嘗試從 userData 中獲取
        if (!username) {
          const secureUserDataString = await SecureStore.getItemAsync('userData');
          if (secureUserDataString) {
            const secureUserData = JSON.parse(secureUserDataString);
            if (secureUserData && secureUserData.username) {
              username = secureUserData.username;
              console.log('從SecureStore userData獲取到用戶名:', username);
            }
          }
        }
      } catch (e) {
        console.log('從SecureStore獲取用戶數據失敗:', e);
      }
      
      // 如果SecureStore中沒有數據，嘗試從AsyncStorage獲取
      if (!username) {
        // 先嘗試從 AsyncStorage 中的 userInfo 獲取
        try {
          const userInfoString = await AsyncStorage.getItem('userInfo');
          if (userInfoString) {
            const userInfo = JSON.parse(userInfoString);
            if (userInfo && userInfo.realName) {
              username = userInfo.realName;
              console.log('PDF生成時從AsyncStorage userInfo獲取到用戶真實姓名:', username);
            } else if (userInfo && userInfo.username) {
              username = userInfo.username;
              console.log('PDF生成時從AsyncStorage userInfo獲取到用戶名(無真實姓名):', username);
            }
          }
        } catch (e) {
          console.log('從AsyncStorage獲取userInfo失敗:', e);
        }
        
        // 如果還沒獲取到，再嘗試從userData獲取
        if (!username) {
          try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
              const userData = JSON.parse(userDataString);
              if (userData && userData.username) {
                username = userData.username;
                console.log('PDF生成時從AsyncStorage userData獲取到用戶名:', username);
              }
            }
          } catch (e) {
            console.log('從AsyncStorage獲取用戶數據失敗:', e);
          }
        }
      }
      
      // 直接使用已獲取的username更新報告編製人
      if (username) {
        // 設置報告編製人
        updatedReportData.createdBy = username;
        // 設置為直接可以訪問的屬性，以便HTML生成時使用
        updatedReportData.reportCreatorName = username;
        console.log('PDF生成過程中設置報告編製人:', username);
          
        // 同時更新報告存儲，確保下次不需要重新設置
        try {
          const reportsData = await AsyncStorage.getItem('reports');
          if (reportsData) {
            const reports = JSON.parse(reportsData);
            const updatedReports = reports.map(r => 
              r.id === report.id ? {...r, createdBy: username, reportCreatorName: username} : r
            );
            await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
            console.log('已更新報告存儲，永久設置編製人:', username);
            
            // 更新當前報告的state
            setReport({...updatedReportData});
          }
        } catch (e) {
          console.log('更新報告存儲失敗:', e);
        }
      } else {
        console.log('警告: 無法獲取用戶名稱，無法設置報告編製人');
      }
      
      // 直接獲取最新的PDF頁面設置
      let finalPdfSettings; // 初始化變數
      
      // 從本地儲存獲取最新設置
      try {
        const savedSettings = await AsyncStorage.getItem(PDF_SETTINGS_KEY);
        if (savedSettings) {
          console.log('從AsyncStorage獲取最新PDF設置');
          finalPdfSettings = JSON.parse(savedSettings);
          
          // 更新狀態但不依賴此狀態生成PDF
          setPdfSettings(finalPdfSettings);
        } else {
          console.log('AsyncStorage中沒有保存的PDF設置，使用默認設置');
          finalPdfSettings = {...pdfSettings};
        }
      } catch (loadSettingsError) {
        console.log('讀取PDF頁面設置失敗, 使用默認設置:', loadSettingsError);
        finalPdfSettings = {...pdfSettings};
      }
      
      // 確保有content屬性
      if (!finalPdfSettings.content) {
        finalPdfSettings.content = {
          sectionSpacing: 30,
          lineSpacing: 1.6
        };
      }
      
      // 確保字體設置正確
      if (!finalPdfSettings.fonts || !finalPdfSettings.fonts.family) {
        console.log('沒有找到字體設置，使用默認字體');
        if (!finalPdfSettings.fonts) {
          finalPdfSettings.fonts = {};
        }
        finalPdfSettings.fonts.family = '"新細明體", PMingLiU, "細明體", MingLiU, KaiTi, 楷體, serif';
        finalPdfSettings.fonts.size = 11;
      } else {
        console.log('使用設定的字體:', finalPdfSettings.fonts.family);
      }
      
      console.log('確認使用的最終PDF設置:', JSON.stringify(finalPdfSettings));
      console.log('使用的報告編製人:', updatedReportData.createdBy || '未指定');
      
      // 準備處理報告中的圖片
      let reportWithBase64Images = { ...updatedReportData };
      
      // 如果報告中有圖片，將它們轉換為 base64
      if (reportWithBase64Images.images && reportWithBase64Images.images.length > 0) {
        console.log('處理報告圖片，轉換為 base64...');
        const processedImages = await Promise.all(
          reportWithBase64Images.images.map(async (img) => {
            try {
              // 獲取圖片信息
              const imageInfo = await FileSystem.getInfoAsync(img.uri);
              console.log(`處理圖片: ${img.uri}, 大小: ${imageInfo.size ? (imageInfo.size / 1024 / 1024).toFixed(2) + 'MB' : '未知'}`);
              
              // 壓縮圖片
              let compressedImageUri = img.uri;
              
              // 更強力的圖片壓縮策略
              let compressionQuality = 0.7; // 默認壓縮質量
              let maxWidth = 1000; // 最大寬度
              
              // 根據文件大小調整壓縮質量
              if (imageInfo.size) {
                if (imageInfo.size > 5 * 1024 * 1024) { // 大於5MB
                  compressionQuality = 0.4;
                  maxWidth = 800;
                } else if (imageInfo.size > 2 * 1024 * 1024) { // 大於2MB
                  compressionQuality = 0.5;
                  maxWidth = 900;
                } else if (imageInfo.size > 1 * 1024 * 1024) { // 大於1MB
                  compressionQuality = 0.6;
                  maxWidth = 1000;
                }
              }
              
              // 使用ImageManipulator壓縮圖片
              console.log(`壓縮圖片，質量: ${compressionQuality}, 最大寬度: ${maxWidth}px`);
              const manipResult = await ImageManipulator.manipulateAsync(
                img.uri,
                [{ resize: { width: maxWidth } }],
                { compress: compressionQuality, format: ImageManipulator.SaveFormat.JPEG }
              );
              
              compressedImageUri = manipResult.uri;
              
              // 檢查壓縮後的大小
              const compressedInfo = await FileSystem.getInfoAsync(compressedImageUri);
              console.log(`圖片壓縮完成，原始大小: ${imageInfo.size ? (imageInfo.size / 1024 / 1024).toFixed(2) : '未知'}MB, 壓縮後: ${compressedInfo.size ? (compressedInfo.size / 1024 / 1024).toFixed(2) : '未知'}MB`);
              
              // 轉換為Base64
              const base64Data = await FileSystem.readAsStringAsync(compressedImageUri, {
                encoding: FileSystem.EncodingType.Base64
              });
              
              return {
                ...img,
                uri: `data:image/jpeg;base64,${base64Data}`
              };
            } catch (error) {
              console.log('圖片處理失敗:', error);
              return img; // 如果處理失敗，保留原始 URI
            }
          })
        );
        
        reportWithBase64Images.images = processedImages;
        console.log('圖片處理完成，共處理', processedImages.length, '張圖片');
      }
      
      console.log('處理公司信息和logo');
      
      // 從個人配置中獲取公司信息
      try {
        // 直接獲取companyInfo
        const companyInfoString = await AsyncStorage.getItem('companyInfo');
        let savedCompanyInfo = null;
        
        console.log('嘗試從AsyncStorage獲取companyInfo');
        if (companyInfoString) {
          savedCompanyInfo = JSON.parse(companyInfoString);
          console.log('找到已保存的公司信息:', JSON.stringify(savedCompanyInfo));
        } else {
          console.log('未找到已保存的公司信息');
        }
        
        // 確保公司信息對象存在
        if (!reportWithBase64Images.companyInfo) {
          reportWithBase64Images.companyInfo = {};
        }
        
        // 使用明確的賦值方式設置每個字段，確保順序正確：已保存值 > 報告中的值 > 默認值
        if (savedCompanyInfo) {
          // 公司名稱
          reportWithBase64Images.companyInfo.companyName = 
            savedCompanyInfo.companyName || 
            reportWithBase64Images.companyInfo.companyName || 
            '企業名稱';
            
          // 公司英文名稱
          reportWithBase64Images.companyInfo.companyNameEn = 
            savedCompanyInfo.companyNameEn || 
            reportWithBase64Images.companyInfo.companyNameEn || 
            '';
            
          // 電子郵箱
          reportWithBase64Images.companyInfo.email = 
            savedCompanyInfo.email || 
            reportWithBase64Images.companyInfo.email || 
            '';
            
          // 電話
          reportWithBase64Images.companyInfo.phone = 
            savedCompanyInfo.phone || 
            reportWithBase64Images.companyInfo.phone || 
            '';
            
          // 傳真
          reportWithBase64Images.companyInfo.fax = 
            savedCompanyInfo.fax || 
            reportWithBase64Images.companyInfo.fax || 
            '';
            
          // 地址 - 確保正確獲取
          reportWithBase64Images.companyInfo.address = 
            savedCompanyInfo.address || 
            reportWithBase64Images.companyInfo.address || 
            '';
            
          // Logo
          if (savedCompanyInfo.logo && !reportWithBase64Images.companyInfo.logo) {
            reportWithBase64Images.companyInfo.logo = savedCompanyInfo.logo;
          }
          
          // 公司蓋章
          if (savedCompanyInfo.seal) {
            reportWithBase64Images.companyInfo.seal = savedCompanyInfo.seal;
            console.log('已加載公司蓋章:', savedCompanyInfo.seal);
          }
        }
        
        console.log('最終使用的公司信息:', JSON.stringify({
          companyName: reportWithBase64Images.companyInfo.companyName,
          hasSeal: !!reportWithBase64Images.companyInfo.seal,
          hasLogo: !!reportWithBase64Images.companyInfo.logo
        }));
        
        // 處理公司 logo（如果有）
        if (reportWithBase64Images.companyInfo && reportWithBase64Images.companyInfo.logo) {
          try {
            // 壓縮logo
            const manipResult = await ImageManipulator.manipulateAsync(
              reportWithBase64Images.companyInfo.logo,
              [{ resize: { width: 200 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            
            const logoBase64 = await FileSystem.readAsStringAsync(manipResult.uri, {
              encoding: FileSystem.EncodingType.Base64
            });
            reportWithBase64Images.companyInfo.logo = `data:image/jpeg;base64,${logoBase64}`;
          } catch (error) {
            console.log('公司 logo 轉換失敗:', error);
          }
        }
        
        // 處理公司蓋章（如果有）
        if (reportWithBase64Images.companyInfo && reportWithBase64Images.companyInfo.seal) {
          try {
            console.log('處理公司蓋章...');
            // 壓縮蓋章圖片
            const manipResult = await ImageManipulator.manipulateAsync(
              reportWithBase64Images.companyInfo.seal,
              [{ resize: { width: 300 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.PNG }
            );
            
            const sealBase64 = await FileSystem.readAsStringAsync(manipResult.uri, {
              encoding: FileSystem.EncodingType.Base64
            });
            reportWithBase64Images.companyInfo.seal = `data:image/png;base64,${sealBase64}`;
            console.log('公司蓋章處理完成');
          } catch (error) {
            console.log('公司蓋章轉換失敗:', error);
          }
        }
      } catch (error) {
        console.log('處理公司信息時出錯:', error);
        
        // 確保至少有基本的公司信息
        if (!reportWithBase64Images.companyInfo) {
          reportWithBase64Images.companyInfo = {
            companyName: '企業名稱',
            companyNameEn: '公司英文名稱',
            email: 'company@example.com',
            phone: '(+886) 12345678',
            fax: '(+886) 87654321',
            address: '公司地址'
          };
        }
      }
      
      // 處理簽名（如果有）
      if (reportWithBase64Images.signature) {
        try {
          // 壓縮簽名
          const manipResult = await ImageManipulator.manipulateAsync(
            reportWithBase64Images.signature,
            [{ resize: { width: 300 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.PNG }
          );
          
          const signatureBase64 = await FileSystem.readAsStringAsync(manipResult.uri, {
            encoding: FileSystem.EncodingType.Base64
          });
          reportWithBase64Images.signature = `data:image/png;base64,${signatureBase64}`;
        } catch (error) {
          console.log('簽名轉換失敗:', error);
        }
      }
      
      // 生成HTML内容 - 使用統一的報告模板，並傳遞圖片佈局模式與最新頁面設置
      console.log('生成HTML報告模板，使用圖片佈局模式:', layoutMode);
      console.log('使用的PDF頁面設置:', JSON.stringify(finalPdfSettings));
      
      // 檢查並顯示字體設置信息
      console.log(`PDF將使用字體: ${finalPdfSettings.fonts.family}, 大小: ${finalPdfSettings.fonts.size}pt`);
      
      const htmlContent = generateReportHTML(reportWithBase64Images, layoutMode, finalPdfSettings);
      
      // 生成PDF文件名：報告編號+項目名稱+報告類型 (首次生成和重新生成使用相同格式)
      console.log('生成統一格式的PDF文件名');
      const reportNumber = report.reportNumber || 'NO_NUMBER';
      const projectName = report.projectName || 'NO_PROJECT';
      const reportType = report.reportTypeName || 'NO_TYPE';
      
      // 清除特殊字符，確保文件名合法
      const cleanReportNumber = reportNumber.replace(/[\\/:*?"<>|]/g, '_');
      const cleanProjectName = projectName.replace(/[\\/:*?"<>|]/g, '_');
      const cleanReportType = reportType.replace(/[\\/:*?"<>|]/g, '_');
      
      // 使用固定的文件名格式，確保每次重新生成都使用相同的文件名
      // 這樣可以保證只有一個PDF文件，避免多個版本共存
      const customFileName = `${cleanReportNumber}_${cleanProjectName}_${cleanReportType}`;
      console.log('使用自定義PDF文件名:', customFileName);
      
      // 首先獲取緩存目錄
      const cacheDir = FileSystem.cacheDirectory + 'Print/';
      
      // 確保緩存目錄存在
      const cacheDirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!cacheDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }
      
      // 創建完整的自定義文件路徑
      const customFilePath = `${cacheDir}${customFileName}.pdf`;
      
      console.log('開始生成PDF，使用A4紙張尺寸...');
      
      // 定義PDF生成選項 - 統一設置首次生成和重新生成的參數
      // 包含明確的邊距設置，確保與HTML模板中的設置一致
      const pdfOptions = {
        html: htmlContent,
        base64: false,
        width: 595.28, // A4 寬度（72 dpi）
        height: 841.89, // A4 高度（72 dpi）
        orientation: 'portrait', // 確保是縱向打印
        margins: {
          left: finalPdfSettings.margins.left,
          right: finalPdfSettings.margins.right,
          top: finalPdfSettings.margins.top,
          bottom: finalPdfSettings.margins.bottom
        },
        printerOptions: {
          paperSize: 'A4', // 明確指定A4紙張
        }
      };
      
      console.log('PDF選項設置:', JSON.stringify({
        dimensions: `${pdfOptions.width}x${pdfOptions.height}`,
        orientation: pdfOptions.orientation,
        paperSize: pdfOptions.printerOptions.paperSize
      }));
      
      // 使用Print模块将HTML转换为PDF，統一的生成邏輯
      let { uri } = await Print.printToFileAsync(pdfOptions);
      
      console.log('PDF文件已生成:', uri);
      console.log('嘗試重命名為:', customFilePath);
      
      try {
        // 先檢查目標路徑是否已存在文件，如果存在則先刪除
        try {
          const fileInfo = await FileSystem.getInfoAsync(customFilePath);
          if (fileInfo.exists) {
            console.log('目標路徑已存在PDF文件，先刪除:', customFilePath);
            await FileSystem.deleteAsync(customFilePath, { idempotent: true });
          }
        } catch (checkError) {
          console.log('檢查目標文件存在狀態失敗:', checkError);
        }
        
        // 將生成的臨時PDF文件複製到最終路徑
        console.log('複製新生成的PDF到固定路徑:', customFilePath);
        await FileSystem.copyAsync({
          from: uri,
          to: customFilePath
        });
        
        // 刪除臨時文件
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log('臨時PDF文件已刪除');
        
        // 更新uri為固定文件路徑
        uri = customFilePath;
        console.log('固定PDF路徑設置成功:', uri);
        
        // 檢查是否有舊的PDF需要刪除（路徑不同的情況）
        if (report.pdfUri && report.pdfUri !== uri) {
          console.log('檢測到舊PDF文件需要刪除:', report.pdfUri);
          try {
            const oldFileInfo = await FileSystem.getInfoAsync(report.pdfUri);
            if (oldFileInfo.exists) {
              await FileSystem.deleteAsync(report.pdfUri, { idempotent: true });
              console.log('舊PDF文件已刪除');
            }
          } catch (deleteError) {
            console.log('刪除舊PDF文件失敗:', deleteError);
          }
        }
      } catch (renameError) {
        console.log('重命名文件失敗:', renameError);
        // 繼續使用原始uri
      }
      
      // 檢查生成的PDF文件大小
      const pdfInfo = await FileSystem.getInfoAsync(uri);
      if (pdfInfo.exists && pdfInfo.size) {
        const pdfSizeMB = (pdfInfo.size / 1024 / 1024).toFixed(2);
        console.log(`生成的PDF文件大小: ${pdfSizeMB}MB`);
      }
      
                // 更新报告对象，添加PDF URI和確保有報告編製人
      console.log('更新報告對象，設置PDF URI和確保有報告編製人');
      try {
        const reportsData = await AsyncStorage.getItem('reports');
        if (reportsData) {
          const reports = JSON.parse(reportsData);
          const updatedReports = reports.map(r => {
            if (r.id === report.id) {
              // 檢查是否已有PDF URI (用於區分首次生成和重新生成)
              const isRegeneration = !!r.pdfUri;
              console.log(isRegeneration ? '重新生成PDF，更新URI' : '首次生成PDF，設置URI');
              console.log('設置PDF URI為:', uri);
              
              // 確保保留報告編製人信息
              const createdBy = reportWithBase64Images.createdBy || r.createdBy || '未指定';
              console.log('保存報告編製人:', createdBy);
              
              return { 
                ...r, 
                pdfUri: uri, 
                pdfGeneratedAt: new Date().toISOString(), 
                imageLayout: layoutMode,
                createdBy: createdBy  // 確保編製人信息被保存
              };
            }
            return r;
          });
          
          // 保存更新后的报告列表
          await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
          
          // 獲取要更新的報告
          const currentUpdatedReport = updatedReports.find(r => r.id === report.id);
          
          // 更新当前报告
          setReport(currentUpdatedReport);
          console.log('報告對象更新成功，新的PDF URI和編製人已設置:', currentUpdatedReport.createdBy);
        }
      } catch (updateError) {
        console.log('更新報告對象失敗:', updateError);
        Alert.alert('警告', 'PDF生成成功，但更新報告數據失敗，可能導致預覽問題');
      }
      
      // 保存 PDF URI
      try {
        // 更新報告存儲，保存 PDF URI
        const reportsData = await AsyncStorage.getItem('reports');
        if (reportsData) {
          const allReports = JSON.parse(reportsData);
          const updatedReports = allReports.map(r => 
            r.id === report.id ? { ...r, pdfUri: uri } : r
          );
          await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
          console.log('PDF URI 已更新到報告數據中');
        }
      } catch (error) {
        console.log('保存 PDF URI 失敗:', error);
      }
      
      // 處理生成後的動作
      setGenerating(false);
      setPdfReady(true);
      setPdfUri(uri);
      
      if (params?.showPreviewDialog) {
        // 詢問是否要預覽 PDF
        Alert.alert(
          '報告已生成',
          '報告PDF已成功生成，是否立即預覽?',
          [
            {
              text: '稍後預覽',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            },
            {
              text: '立即預覽',
              onPress: () => {
                navigation.navigate('PDFViewer', { 
                  pdfUri: uri, 
                  title: report.title || '報告預覽',
                  timestamp: new Date().getTime()
                });
              }
            }
          ]
        );
      } else if (previewAfterGenerate || params?.directPreview) {
        // 如果設定了生成後預覽，則直接導航到預覽頁面
        console.log('PDF已生成，直接跳轉到預覽頁面');
        navigation.navigate('PDFViewer', { 
          pdfUri: uri, 
          title: report.title || '報告預覽',
          timestamp: new Date().getTime()
        });
      }
    } catch (error) {
      console.log('生成PDF失败', error);
      Alert.alert('错误', '生成PDF失败，请重试');
      setGenerating(false);
    }
  };
  
  // 直接預覽PDF
  const directPreviewPDF = () => {
    if (!report || !report.pdfUri) {
      Alert.alert('錯誤', 'PDF文件不存在或尚未生成，請先生成PDF');
      setPreviewDialogVisible(false);
      return;
    }
    
      setPreviewDialogVisible(false); // 關閉對話框
      
      // 延遲一下再導航，確保對話框已經完全關閉
      setTimeout(() => {
        navigation.navigate('PDFViewer', { 
          pdfUri: report.pdfUri, 
        title: report.title || '報告預覽',
        timestamp: new Date().getTime()
        });
      }, 100);
  };

  // 在報告加載完成後，如果需要自動生成PDF，則執行生成
  useEffect(() => {
    // 只有在報告已加載且請求自動生成PDF時執行
    if (reportLoaded && params?.autoGeneratePdf) {
      console.log('報告已加載完成，準備自動生成PDF');
      
      // 檢查是否提供了佈局模式
      if (params?.pdfLayoutMode) {
        console.log('檢測到佈局模式參數:', params.pdfLayoutMode);
        // 直接使用提供的佈局模式生成PDF
        setTimeout(() => {
          generatePDFWithLayout(params.pdfLayoutMode, params.directPreview || false);
        }, 500);
      } else {
        // 若未提供佈局模式，則顯示佈局選擇對話框
        setTimeout(() => {
          showLayoutDialog(true);
        }, 500);
      }
    }
  }, [reportLoaded, params?.autoGeneratePdf, params?.pdfLayoutMode]);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 报告标题和基本信息 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>{report.title}</Text>
            <Text style={styles.date}>創建於 {formatDate(report.createdAt)}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>項目名稱:</Text>
              <Text style={styles.infoValue}>{report.projectName}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>報告類型:</Text>
              <Text style={styles.infoValue}>{report.reportTypeName}</Text>
            </View>
            
            {report.reportNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>報告編號:</Text>
                <Text style={styles.infoValue}>{report.reportNumber}</Text>
              </View>
            )}
            
            {report.pdfUri && (
              <View style={styles.pdfStatusContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.pdfStatusText}>PDF文件已生成</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* 报告描述 */}
        {report.descriptions && report.descriptions.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>報告描述</Text>
              {report.descriptions.map((desc, index) => (
                <View key={index} style={styles.descriptionItem}>
                  <Text style={styles.descriptionNumber}>{index + 1}.</Text>
                  <Text style={styles.descriptionContent}>{desc.content}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* 报告图片 */}
        {report.images && report.images.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>報告圖片</Text>
              <View style={styles.imageGrid}>
                {report.images.map((image, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.imageContainer}
                    onPress={() => viewImage(image)}
                  >
                    <Image source={{ uri: image.uri }} style={styles.image} />
                    {image.description && (
                      <Text style={styles.imageDescription} numberOfLines={2}>
                        {image.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* 报告总结 */}
        {report.summaries && report.summaries.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>報告總結</Text>
              {report.summaries.map((summary, index) => (
                <View key={index} style={styles.descriptionItem}>
                  <Text style={styles.descriptionNumber}>{index + 1}.</Text>
                  <Text style={styles.descriptionContent}>{summary.content}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* 签名 */}
        {report.signature && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>簽名</Text>
              <View style={styles.signatureContainer}>
                <Image source={{ uri: report.signature }} style={styles.signature} />
              </View>
            </Card.Content>
          </Card>
        )}
        
        {/* 移除圖片佈局選擇區域 */}

        {/* 操作按钮 */}
        <View style={styles.buttonContainer}>
          {!report.pdfUri ? (
            <>
              <Button 
                mode="contained" 
                icon="file-pdf-box" 
                style={styles.actionButton}
                onPress={generatePDF}
                loading={generating}
                disabled={generating}
              >
                保存PDF
              </Button>
            </>
          ) : (
            <>
              <Button 
                mode="contained" 
                icon="eye"
                style={styles.button}
                onPress={previewPDF}
                disabled={generating}
              >
                預覽PDF
              </Button>
              
              <Button 
                mode="outlined" 
                icon="refresh"
                style={styles.button}
                onPress={regeneratePDF}
                loading={generating}
                disabled={generating}
              >
                重新生成PDF
              </Button>
            </>
          )}
        </View>
          
        {/* 分享按鈕移至最下方 */}
        <View style={[styles.buttonContainer, styles.shareButtonContainer]}>
          <Button 
            mode="outlined" 
            icon="share-variant"
            style={styles.button}
            onPress={shareReport}
          >
            分享報告
          </Button>
        </View>
      </ScrollView>

      {/* 图片查看器 */}
      <Portal>
        <Dialog visible={imageViewerVisible} onDismiss={closeImageViewer} style={styles.imageViewerDialog}>
          <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
            <Ionicons name="close-circle" size={30} color="#FFF" />
          </TouchableOpacity>
          
          {selectedImage && (
            <View>
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.fullImage} 
                resizeMode="contain"
              />
              {selectedImage.description && (
                <Text style={styles.fullImageDescription}>
                  {selectedImage.description}
                </Text>
              )}
            </View>
          )}
        </Dialog>
      </Portal>

      {/* 加载指示器 */}
      {generating && (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.generatingText}>生成PDF中...</Text>
        </View>
      )}

      {/* 佈局選擇對話框 */}
      <Portal>
        <Dialog 
          visible={layoutDialogVisible} 
          onDismiss={() => setLayoutDialogVisible(false)}
          style={styles.layoutDialog}
        >
          <View>
            <Text style={styles.dialogTitle}>選擇圖片佈局</Text>
            <Text style={styles.dialogDescription}>
              請選擇報告附圖的排列方式：
            </Text>
            
            <ScrollView style={{maxHeight: 350}}>
            <RadioButton.Group onValueChange={value => setTempImageLayout(value)} value={tempImageLayout}>
              <List.Item
                title="自動佈局（推薦）"
                description="根據圖片數量自動選擇最合適的佈局"
                  left={() => (
                    <View style={styles.layoutIconContainer}>
                      <View style={styles.layoutAutoIcon}>
                        <View style={[styles.layoutBox, styles.layoutBoxSmall]}></View>
                        <View style={[styles.layoutBox, styles.layoutBoxSmall]}></View>
                        <View style={[styles.layoutBox, styles.layoutBoxLarge]}></View>
                      </View>
                    </View>
                  )}
                  right={props => <RadioButton {...props} value="auto" />}
                onPress={() => setTempImageLayout('auto')}
                style={tempImageLayout === 'auto' ? styles.selectedItem : styles.listItem}
              />
              <Divider style={styles.listDivider} />
              <List.Item
                title="2×3 佈局" 
                description="2列3行，每行2張圖片"
                  left={() => (
                    <View style={styles.layoutIconContainer}>
                      <View style={styles.layoutGridIcon}>
                        <View style={styles.layoutGridRow}>
                          <View style={[styles.layoutGridBox, {height: 10}]}></View>
                          <View style={[styles.layoutGridBox, {height: 10}]}></View>
                        </View>
                        <View style={styles.layoutGridRow}>
                          <View style={[styles.layoutGridBox, {height: 10}]}></View>
                          <View style={[styles.layoutGridBox, {height: 10}]}></View>
                        </View>
                        <View style={styles.layoutGridRow}>
                          <View style={[styles.layoutGridBox, {height: 10}]}></View>
                          <View style={[styles.layoutGridBox, {height: 10}]}></View>
                        </View>
                      </View>
                    </View>
                  )}
                  right={props => <RadioButton {...props} value="grid2x3" />}
                  onPress={() => setTempImageLayout('grid2x3')}
                  style={tempImageLayout === 'grid2x3' ? styles.selectedItem : styles.listItem}
              />
              <Divider style={styles.listDivider} />
              <List.Item
                title="3×3 佈局"
                description="3列3行，每行3張圖片"
                  left={() => (
                    <View style={styles.layoutIconContainer}>
                      <View style={styles.layoutGridIcon}>
                        <View style={styles.layoutGridRow}>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                        </View>
                        <View style={styles.layoutGridRow}>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                        </View>
                        <View style={styles.layoutGridRow}>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                          <View style={[styles.layoutGridBox, {width: 9, height: 9}]}></View>
                        </View>
                      </View>
                    </View>
                  )}
                  right={props => <RadioButton {...props} value="grid3x3" />}
                  onPress={() => setTempImageLayout('grid3x3')}
                  style={tempImageLayout === 'grid3x3' ? styles.selectedItem : styles.listItem}
              />
            </RadioButton.Group>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => confirmLayoutAndGeneratePDF()}
          >
            <View style={styles.confirmButtonContent}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.confirmButtonText}>確定</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setLayoutDialogVisible(false)}
          >
            <View style={styles.cancelButtonContent}>
              <Ionicons name="close-circle-outline" size={24} color="#666" style={{marginRight: 8}} />
              <Text style={styles.cancelButtonText}>取消</Text>
            </View>
          </TouchableOpacity>
        </Dialog>
      </Portal>

      {/* PDF預覽確認對話框 */}
      <Portal>
        <Dialog
          visible={previewDialogVisible}
          onDismiss={() => setPreviewDialogVisible(false)}
          style={styles.layoutDialog}
        >
          <Dialog.Title style={styles.dialogTitle}>PDF已生成</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              PDF文件已成功生成，是否要立即打開預覽？
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              onPress={() => setPreviewDialogVisible(false)} 
              style={styles.dialogButton} 
              labelStyle={styles.buttonLabel}
            >
              關閉
            </Button>
            <Button 
              onPress={directPreviewPDF} 
              mode="contained" 
              style={styles.dialogButton} 
              labelStyle={styles.buttonLabel}
            >
              查看PDF
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerButton: {
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontWeight: '500',
    color: '#333',
  },
  infoValue: {
    flex: 1,
    color: '#666',
  },
  pdfStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  pdfStatusText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 8,
  },
  descriptionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  descriptionNumber: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 20,
  },
  descriptionContent: {
    flex: 1,
    lineHeight: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '48%',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  imageDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  signatureContainer: {
    alignItems: 'center',
    padding: 16,
  },
  signature: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  shareButtonContainer: {
    marginBottom: 24, // 增加底部間距
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  imageViewerDialog: {
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  fullImage: {
    width: '100%',
    height: '90%',
    backgroundColor: '#000',
  },
  fullImageDescription: {
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  generatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  generatingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  layoutDialog: {
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: '80%',
    paddingBottom: 0,
    margin: 20,
  },
  dialogTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  dialogDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  selectedItem: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dialogScrollArea: {
    flexGrow: 1, // 允許內容區域可以滾動
  },
  dialogActions: {
    paddingVertical: 12, // 增加對話框底部間距
    paddingHorizontal: 16,
  },
  buttonListItem: {
    paddingVertical: 14,
  },
  confirmButtonListItem: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 17,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  dialogButton: {
    borderRadius: 8, // 增加按鈕圓角
  },
  buttonLabel: {
    fontWeight: 'bold', // 增加按鈕文字粗細
  },
  listDivider: {
    marginVertical: 8,
  },
  dialogBottomDivider: {
    marginTop: 10,
  },
  dialogText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  layoutIconContainer: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutAutoIcon: {
    width: 40,
    height: 35,
    justifyContent: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  layoutBox: {
    backgroundColor: '#007AFF',
    margin: 1,
  },
  layoutBoxSmall: {
    width: 15,
    height: 15,
  },
  layoutBoxLarge: {
    width: 32,
    height: 15,
  },
  layoutGridIcon: {
    width: 40,
    height: 40,
    justifyContent: 'space-between',
  },
  layoutGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  layoutGridBox: {
    width: 15,
    height: 15,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
    width: 60,
  },
  settingDivider: {
    marginVertical: 15,
  },
  radioGroup: {
    marginLeft: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 