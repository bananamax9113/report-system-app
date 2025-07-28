import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Share, Image, ScrollView } from 'react-native';
import { Text, Card, Chip, Menu, Divider, Button, ActivityIndicator, SegmentedButtons, Searchbar, List, Drawer, Modal, Surface, IconButton, Switch } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { SCREEN_WIDTH } from '../constants/Layout';
import { getRelativeTime } from '../utils/dateUtils';

export default function ReportListScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [projectFilterVisible, setProjectFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 明確設置默認值為 'card'

  // 確保 viewMode 總是有值
  useEffect(() => {
    if (!viewMode) {
      setViewMode('card');
      console.log('初始化視圖模式為卡片視圖');
    }
  }, []);

  // 加載報告列表
  useEffect(() => {
    loadReports();
    loadProjects();
    
    // 監聽頁面聚焦事件，每次回到此頁面時重新加載報告
    const unsubscribe = navigation.addListener('focus', () => {
      loadReports();
    });

    return unsubscribe;
  }, [navigation]);
  
  // 加載項目列表
  const loadProjects = async () => {
    try {
      const projectsData = await AsyncStorage.getItem('projects');
      if (projectsData) {
        const projects = JSON.parse(projectsData);
        const projectsWithAll = [
          { id: 'all', name: '全部項目' },
          ...projects.map(p => ({ id: p.id, name: p.name }))
        ];
        setProjectsList(projectsWithAll);
        setFilteredProjects(projectsWithAll);
      }
    } catch (error) {
      console.log('讀取項目列表失敗', error);
    }
  };

  // 過濾報告列表
  useEffect(() => {
    if (selectedProjectId === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.projectId === selectedProjectId));
    }
  }, [reports, selectedProjectId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const reportsData = await AsyncStorage.getItem('reports');
      if (reportsData) {
        // 解析報告數據並按創建時間降序排序（最新的在前）
        const parsedReports = JSON.parse(reportsData).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB - dateA; // 降序排序（最新的在前）
        });
        
        setReports(parsedReports);
        setFilteredReports(parsedReports);
      }
    } catch (error) {
      console.log('讀取報告列表失敗', error);
    } finally {
      setLoading(false);
    }
  };

  // 項目篩選搜索
  const onChangeSearch = (query) => {
    setSearchQuery(query);
    const filtered = projectsList.filter(project => 
      project.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  // 選擇項目進行篩選
  const selectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setProjectFilterVisible(false);
  };

  const deleteReport = (reportId) => {
    Alert.alert(
      "確認刪除",
      "確定要刪除此報告嗎？此操作無法撤銷。",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "刪除",
          onPress: async () => {
            try {
              const updatedReports = reports.filter(r => r.id !== reportId);
              await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
              setReports(updatedReports);
            } catch (error) {
              console.log('刪除報告失敗', error);
              Alert.alert('錯誤', '刪除報告失敗，請重試');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const showReportMenu = (report, event) => {
    setCurrentReport(report);
    // 設置菜單位置為觸發事件的位置
    setMenuPosition({
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY
    });
    setMenuVisible(true);
  };

  const hideMenu = () => {
    setMenuVisible(false);
  };

  // 編輯報告
  const editReport = (report) => {
    hideMenu();
    console.log('編輯報告:', report);
    navigation.navigate('新建報告', { 
      editMode: true, 
      reportData: report 
    });
  };

  // 生成HTML格式的報告
  const generateReportHTML = (report) => {
    // 獲取今天的日期
    const today = new Date();
    const dateFormatted = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    // 根據圖片數量選擇不同的佈局模板
    let imageTemplates = '';
    if (report.images && report.images.length > 0) {
      // 每行顯示的圖片數量
      const imagesPerRow = report.images.length <= 4 ? 2 : 3; // 4宮格或9宮格
      
      // 分組圖片
      for (let i = 0; i < report.images.length; i += imagesPerRow) {
        const rowImages = report.images.slice(i, i + imagesPerRow);
        
        // 創建行
        imageTemplates += `<div class="image-row">`;
        
        // 添加這一行的所有圖片
        rowImages.forEach(img => {
          // 使用 base64 格式圖片，確保圖片能夠正確加載
          imageTemplates += `
            <div class="image-container">
              <img src="${img.uri}" class="report-image" />
              <p class="image-description">${img.description || '無描述'}</p>
            </div>
          `;
        });
        
        imageTemplates += `</div>`;
      }
    }
    
    // 處理公司信息
    const companyInfo = report.companyInfo || {
      companyName: '未設置公司名稱',
      companyNameEn: '',
      email: '',
      phone: '',
      fax: '',
      logo: null
    };
    
    // 公司Logo HTML
    let logoHTML = '';
    if (companyInfo.logo) {
      logoHTML = `<img src="${companyInfo.logo}" class="company-logo" alt="公司Logo" />`;
    }
    
    // 簽名HTML - 無論是否有簽名都顯示簽名區域
    let signatureHTML = '';
    if (report.signature) {
      signatureHTML = `
        <div class="signature-section">
          <img src="${report.signature}" class="signature-image" alt="簽名" />
          <p class="signature-name">報告簽署人</p>
          <p class="signature-date">${dateFormatted}</p>
        </div>
      `;
    } else {
      signatureHTML = `
        <div class="signature-section">
          <div style="height: 80px; display: flex; align-items: center; justify-content: center;">
            <p style="color: #999; font-style: italic;">無簽名</p>
          </div>
          <p class="signature-name">報告簽署人</p>
          <p class="signature-date">${dateFormatted}</p>
        </div>
      `;
    }
    
    // 描述HTML
    let descriptionsHTML = '';
    if (report.descriptions && report.descriptions.length > 0) {
      descriptionsHTML = `
        <div class="section">
          <h2>報告描述</h2>
          <div class="description-list">
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
    
    // 總結HTML
    let summariesHTML = '';
    if (report.summaries && report.summaries.length > 0) {
      summariesHTML = `
        <div class="section">
          <h2>報告總結</h2>
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
        </div>
      `;
    }
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${report.title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            @media print {
              body {
                width: 21cm;
                height: 29.7cm;
                margin: 0;
              }
            }
            body {
              font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Heiti TC', '微軟正黑體', '黑體-繁', sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              width: 21cm;
              min-height: 29.7cm;
              box-sizing: border-box;
              background-color: white;
            }
            .container {
              width: 100%;
              margin: 0 auto;
              padding: 1cm;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eee;
            }
            .company-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eee;
            }
            .company-logo {
              max-width: 200px;
              max-height: 80px;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-name-en {
              font-size: 18px;
              margin-bottom: 10px;
              color: #666;
            }
            .company-contact {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 28px;
              font-weight: bold;
              margin: 20px 0;
            }
            .info-section {
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              width: 100px;
            }
            .description {
              margin: 20px 0;
              line-height: 1.6;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            .image-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .image-container {
              flex: 1;
              margin: 0 10px;
              text-align: center;
            }
            .report-image {
              width: 100%;
              max-width: 300px;
              max-height: 300px;
              object-fit: contain;
              border-radius: 5px;
              border: 1px solid #ddd;
            }
            .image-description {
              margin-top: 8px;
              font-size: 14px;
              color: #666;
              text-align: center;
            }
            .section {
              margin: 30px 0;
            }
            h2 {
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
              color: #333;
            }
            .description-list, .summary-list {
              padding: 0 15px;
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
              line-height: 1.6;
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
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #999;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- 公司信息 -->
            <div class="company-header">
              ${logoHTML}
              <h1 class="company-name">${companyInfo.companyName}</h1>
              ${companyInfo.companyNameEn ? `<h2 class="company-name-en">${companyInfo.companyNameEn}</h2>` : ''}
              ${companyInfo.email ? `<p class="company-contact">Email: ${companyInfo.email}</p>` : ''}
              ${companyInfo.phone ? `<p class="company-contact">Tel: ${companyInfo.phone}</p>` : ''}
              ${companyInfo.fax ? `<p class="company-contact">Fax: ${companyInfo.fax}</p>` : ''}
            </div>
            
            <!-- 報告標題 -->
            <div class="header">
              <h1 class="report-title">${report.title}</h1>
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">報告編號:</span>
                  <span>${report.reportNumber || '無編號'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">項目名稱:</span>
                  <span>${report.projectName}</span>
                </div>
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
            
            <!-- 報告描述 -->
            ${descriptionsHTML}
            
            <!-- 圖片部分 -->
            <div class="section">
              <h2>報告圖片</h2>
              ${imageTemplates}
            </div>
            
            <!-- 報告總結 -->
            ${summariesHTML}
            
            <!-- 簽名部分 - 始終顯示 -->
            ${signatureHTML}
            
            <!-- 頁腳 -->
            <div class="footer">
              <p>© ${today.getFullYear()} ${companyInfo.companyName} - 本報告由報告管理系統自動生成</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // 生成PDF - 直接調用報告詳情頁面的PDF生成方法
  const generatePDF = async () => {
    if (!currentReport) return;
    
    hideMenu();
    setGenerating(true); // 設置生成狀態，以顯示加載指示器
    
    try {
      // 檢查報告是否已有簽名，如果沒有，嘗試從AsyncStorage獲取
      let reportWithSignature = {...currentReport};
      
      if (!reportWithSignature.signature) {
        try {
          console.log('報告沒有簽名，嘗試從AsyncStorage獲取');
          const userSignature = await AsyncStorage.getItem('signature');
          if (userSignature) {
            console.log('從AsyncStorage獲取到用戶簽名');
            reportWithSignature.signature = userSignature;
          }
        } catch (signatureError) {
          console.log('獲取簽名失敗:', signatureError);
        }
      }
      
      setGenerating(false); // 關閉加載指示器，因為處理將移至ReportDetail頁面
      
      // 導航到ReportDetail頁面，並傳遞報告數據和自動生成PDF的標誌
      navigation.navigate('ReportDetail', { 
        report: reportWithSignature, 
        autoGeneratePdf: true,  // 這個標誌告訴ReportDetail頁面自動開始生成PDF
        directPreview: true     // 生成後直接預覽
      });
            } catch (error) {
      console.log('PDF生成請求失敗:', error);
      Alert.alert('錯誤', '無法開始PDF生成過程，請重試');
      setGenerating(false);
    }
  };

  // 預覽已生成的PDF
  const previewPDF = (report) => {
    hideMenu();
    
    if (!report.pdfUri) {
      Alert.alert('提示', '請先生成PDF文件');
      return;
    }
    
    navigation.navigate('PDFViewer', { 
      pdfUri: report.pdfUri, 
      reportTitle: report.title 
    });
  };

  // 修改分享報告功能，使用已生成的 PDF 文件
  const shareReport = async () => {
    if (!currentReport) return;
    
    hideMenu();
    
    // 如果已生成PDF，則分享PDF文件
    if (currentReport.pdfUri) {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(currentReport.pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: `分享報告: ${currentReport.title}`,
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert('錯誤', '分享功能不可用');
        }
    } catch (error) {
        console.log('分享PDF報告失敗', error);
        Alert.alert('錯誤', '分享PDF報告失敗');
      }
    } else {
      // 如果沒有PDF，提示先生成PDF
      Alert.alert('提示', '請先生成PDF文件再分享', [
        { text: '取消' },
        { 
          text: '生成PDF', 
          onPress: generatePDF 
        }
      ]);
    }
  };

  // 渲染卡片視圖項目
  const renderCardItem = ({ item }) => {
    // 使用相対时间格式化
    let timeDisplay = '未知时间';
    if (item.createdAt) {
      timeDisplay = getRelativeTime(item.createdAt);
    }
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ReportDetail', { report: item })}
        activeOpacity={0.7}
      >
        <Card style={styles.reportCard}>
          <Card.Content>
            <View style={styles.reportHeader}>
              <View>
                <Text style={styles.reportTitle}>{item.title}</Text>
                <View style={styles.reportMeta}>
                  {item.reportNumber && (
                    <Text style={styles.reportNumber}>#{item.reportNumber}</Text>
                  )}
                  <Text style={styles.reportDate}>{timeDisplay}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={(e) => {
                e.stopPropagation();
                showReportMenu(item, e);
              }}>
                <Ionicons name="ellipsis-vertical" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reportInfo}>
              <Chip icon="folder" style={styles.chip}>{item.projectName}</Chip>
              <Chip icon="file-document" style={styles.chip}>{item.reportTypeName}</Chip>
              {item.pdfUri ? (
                <Chip icon="file-pdf-box" style={[styles.chip, styles.pdfChip]}>PDF已生成</Chip>
              ) : (
                <Chip icon="alert-circle-outline" style={[styles.chip, styles.noPdfChip]}>未生成PDF</Chip>
              )}
            </View>
            
            {item.images && item.images.length > 0 && (
              <View style={styles.imageContainer}>
                <Text style={styles.imageLabel}>報告圖片 ({item.images.length}):</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
              >
                {item.images.map((img, index) => (
                    <View key={index} style={styles.thumbnailContainer}>
                  <Image 
                    source={{ uri: img.uri }} 
                    style={styles.thumbnailImage} 
                  />
                    </View>
                ))}
              </ScrollView>
              </View>
            )}
            
            {item.description && (
              <Text 
                style={styles.reportDescription}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.description}
              </Text>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // 渲染列表視圖項目
  const renderListItem = ({ item }) => {
    let timeDisplay = item.createdAt ? getRelativeTime(item.createdAt) : '未知時間';
    
    return (
      <List.Item
        title={item.title}
        description={`${item.projectName} · ${timeDisplay}`}
        left={props => <List.Icon {...props} icon="file-document-outline" color="#007AFF" />}
        right={props => (
          <View style={styles.listItemRight}>
            {item.pdfUri ? (
              <View style={styles.pdfStatusContainer}>
                <Ionicons name="document-text" size={18} color="#4CAF50" style={styles.listItemIcon} />
                <Text style={styles.pdfStatusText}>已生成</Text>
              </View>
            ) : (
              <View style={styles.pdfStatusContainer}>
                <Ionicons name="alert-circle-outline" size={18} color="#FF5722" style={styles.listItemIcon} />
                <Text style={[styles.pdfStatusText, styles.noPdfText]}>未生成</Text>
              </View>
            )}
            <TouchableOpacity onPress={(e) => {
              e.stopPropagation();
              showReportMenu(item, e);
            }}>
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        onPress={() => navigation.navigate('ReportDetail', { report: item })}
        style={styles.listItem}
      />
    );
  };

  // 主渲染函數，根據視圖模式選擇渲染方式
  const renderReportItem = (props) => {
    // 確保 viewMode 有值，預設為卡片視圖
    const currentViewMode = viewMode || 'card';
    return currentViewMode === 'card' ? renderCardItem(props) : renderListItem(props);
  };

  // 切換視圖模式
  const toggleViewMode = () => {
    // 確保切換到正確的值
    const newMode = (viewMode === 'card') ? 'list' : 'card';
    console.log('切換視圖模式:', viewMode, '->', newMode);
    setViewMode(newMode);
  };

  // 視圖模式按鈕內容
  const viewModeButtonContent = () => {
    // 確保 viewMode 有值
    const currentViewMode = viewMode || 'card';
    const iconName = currentViewMode === 'card' ? 'list' : 'grid';
    const label = currentViewMode === 'card' ? '列表視圖' : '卡片視圖';
    
    return (
      <>
        <Ionicons name={iconName} size={22} color="#555" />
        <Text style={styles.viewModeText}>{label}</Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* 頂部工具欄 */}
      <View style={styles.toolbar}>
        {/* 項目篩選下拉按鈕 */}
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setProjectFilterVisible(true)}
        >
          <Text style={styles.dropdownText}>
            {projectsList.find(p => p.id === selectedProjectId)?.name || '全部項目'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>
        
        {/* 視圖模式切換 */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity onPress={toggleViewMode} style={styles.viewModeButton}>
            {viewModeButtonContent()}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 改用覆蓋式下拉面板，不再使用模態框 */}
      {projectFilterVisible && (
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>選擇項目</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setProjectFilterVisible(false)}
              />
            </View>
            <Searchbar
              placeholder="搜索項目"
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchbar}
            />
            <FlatList
              data={filteredProjects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  onPress={() => selectProject(item.id)}
                  left={props => item.id === selectedProjectId && <List.Icon {...props} icon="check" />}
                  style={item.id === selectedProjectId ? styles.selectedProject : null}
                />
              )}
              ItemSeparatorComponent={() => <Divider />}
              style={styles.projectList}
            />
          </View>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>載入報告中...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color="#CCC" />
          <Text style={styles.emptyText}>暫無報告，請先創建報告</Text>
          <Button 
            mode="contained" 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('新建報告')}
          >
            新建報告
          </Button>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>沒有符合當前過濾條件的報告</Text>
          <Button 
            mode="outlined" 
            style={styles.emptyButton}
            onPress={() => setSelectedProjectId('all')}
          >
            顯示全部報告
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContainer, 
            { padding: (viewMode || 'card') === 'card' ? 16 : 0 }
          ]}
          ItemSeparatorComponent={
            (viewMode || 'card') === 'list' ? () => <Divider /> : null
          }
        />
      )}

      {/* 報告操作菜單 */}
      <Menu
        visible={menuVisible}
        onDismiss={hideMenu}
        anchor={{ x: menuPosition.x, y: menuPosition.y }}
        style={styles.menu}
      >
        <Menu.Item 
          icon="pencil" 
          onPress={() => editReport(currentReport)} 
          title="編輯報告" 
        />
        <Menu.Item 
          icon="file-pdf-box" 
          onPress={generatePDF} 
          title="生成PDF" 
          disabled={generating}
        />
        {currentReport && currentReport.pdfUri && (
          <Menu.Item 
            icon="eye" 
            onPress={() => previewPDF(currentReport)} 
            title="預覽PDF" 
          />
        )}
        <Menu.Item 
          icon="share-variant" 
          onPress={shareReport} 
          title="分享報告" 
        />
        <Divider />
        <Menu.Item 
          icon="delete" 
          onPress={() => {
            hideMenu();
            if (currentReport) {
              deleteReport(currentReport.id);
            }
          }} 
          title="刪除報告"
          titleStyle={styles.deleteText}
        />
      </Menu>
      
      {generating && (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.generatingText}>生成PDF中...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    flex: 1,
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  viewModeContainer: {
    alignItems: 'flex-end',
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
  },
  viewModeText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    padding: 0,
    borderRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchbar: {
    margin: 8,
    borderRadius: 8,
    elevation: 0,
  },
  projectList: {
    maxHeight: 400,
  },
  selectedProject: {
    backgroundColor: '#E8F4FD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 80,
  },
  // 卡片視圖樣式
  reportCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
  // 列表視圖樣式
  listItem: {
    paddingVertical: 4,
    backgroundColor: 'white',
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemIcon: {
    marginRight: 8,
  },
  // 其他樣式
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reportNumber: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 8,
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
  },
  reportInfo: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  pdfChip: {
    backgroundColor: '#E8F5E9',
  },
  noPdfChip: {
    backgroundColor: '#FEEAE6',
  },
  reportDescription: {
    marginTop: 8,
    color: '#666',
  },
  imageContainer: {
    marginVertical: 8,
  },
  imageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  imageScrollView: {
    flexDirection: 'row',
  },
  thumbnailContainer: {
    marginRight: 6,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  thumbnailImage: {
    width: 50, 
    height: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 20,
  },
  menu: {
    width: 250,
  },
  deleteText: {
    color: '#FF3B30',
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
  // 修改下拉面板樣式
  dropdownOverlay: {
    position: 'absolute',
    top: 61, // 工具欄高度 + 1px 邊框
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  dropdownPanel: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 400,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pdfStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  pdfStatusText: {
    fontSize: 14,
    color: '#4CAF50', // 已生成狀態顏色
    fontWeight: '500',
  },
  noPdfText: {
    color: '#FF5722', // 未生成狀態顏色
  },
}); 