import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Divider, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 字體選項
const FONT_FAMILIES = [
  { label: '楷體', value: 'KaiTi, 楷體, serif' },
  { label: '宋體', value: 'SimSun, 宋體, serif' },
  { label: '黑體', value: 'SimHei, 黑體, sans-serif' },
  { label: '微軟雅黑', value: 'Microsoft YaHei, 微軟雅黑, sans-serif' }
];

export default function PdfSettings({ navigation, route }) {
  const PDF_SETTINGS_KEY = 'pdfPageSettings';
  
  // 从route参数获取初始PDF设置
  const [pdfSettings, setPdfSettings] = useState(route.params?.pdfSettings || {
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
    },
    content: {
      sectionSpacing: 30,    // 段落間距 (px)
      lineSpacing: 1.6,      // 行間距倍數
    }
  });
  
  const [loading, setLoading] = useState(true);

  // 加载PDF设置信息
  useEffect(() => {
    loadPdfSettings();
  }, []);

  // 當從編輯頁面返回時，重新加載數據
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPdfSettings();
    });

    return unsubscribe;
  }, [navigation]);

  // 加載PDF頁面設置
  const loadPdfSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = await AsyncStorage.getItem(PDF_SETTINGS_KEY);
      if (savedSettings) {
        setPdfSettings(JSON.parse(savedSettings));
        console.log('已加載保存的PDF頁面設置');
      }
      setLoading(false);
    } catch (error) {
      console.log('讀取PDF頁面設置失敗:', error);
      setLoading(false);
    }
  };
  
  // 导航到各设置详情页
  const navigateToSettingDetail = (settingType) => {
    navigation.navigate('PdfSettingDetail', { 
      settingType, 
      pdfSettings,
      onSave: handleSaveSettings
    });
  };
  
  // 保存设置回调
  const handleSaveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(PDF_SETTINGS_KEY, JSON.stringify(newSettings));
      setPdfSettings(newSettings);
      Alert.alert('成功', 'PDF頁面設置已保存');
      console.log('PDF頁面設置已保存');
      return true;
    } catch (error) {
      console.log('保存PDF頁面設置失敗:', error);
      Alert.alert('錯誤', '保存設置失敗，請重試');
      return false;
    }
  };

  // 格式化设置描述
  const getSettingDescription = (type) => {
    switch(type) {
      case 'margins':
        return `上: ${pdfSettings.margins.top}mm 下: ${pdfSettings.margins.bottom}mm 左: ${pdfSettings.margins.left}mm 右: ${pdfSettings.margins.right}mm`;
      case 'header':
        return `佈局: ${pdfSettings.header.layout === 'horizontal' ? '水平' : '垂直'}, 高度: ${pdfSettings.header.height}px`;
      case 'footer':
        return `高度: ${pdfSettings.footer.height}px, 字體大小: ${pdfSettings.footer.fontSize}pt`;
      case 'images':
        return `高度: ${pdfSettings.images.height}px, 間距: ${pdfSettings.images.gap}px`;
      case 'fonts':
        const fontFamily = FONT_FAMILIES.find(f => f.value === pdfSettings.fonts.family)?.label || '默認字體';
        return `字體: ${fontFamily}, 大小: ${pdfSettings.fonts.size}pt`;
      case 'content':
        if (!pdfSettings.content) {
          return '未設置內容間距';
        }
        return `段落間距: ${pdfSettings.content.sectionSpacing}px, 行間距: ${pdfSettings.content.lineSpacing}`;
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader style={styles.sectionHeader}>PDF頁面設置</List.Subheader>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>加載中...</Text>
          </View>
        ) : (
          <>
            {/* 整體頁面預覽 */}
            <View style={styles.pagePreviewContainer}>
              <Text style={styles.previewTitle}>整體頁面佈局預覽</Text>
              <View style={styles.pagePreviewWrapper}>
                <View style={[styles.pagePreview, {
                  paddingTop: pdfSettings.margins.top / 2,
                  paddingRight: pdfSettings.margins.right / 2,
                  paddingBottom: pdfSettings.margins.bottom / 2,
                  paddingLeft: pdfSettings.margins.left / 2,
                }]}>
                  {/* 頁眉 */}
                  <View style={[styles.previewHeader, {height: pdfSettings.header.height / 5}]}>
                    <View style={styles.headerContent}>
                      <View style={styles.logoPlaceholder}></View>
                      <View style={styles.headerTextContainer}>
                        <View style={styles.companyNameLine}></View>
                        <View style={styles.companyEnNameLine}></View>
                      </View>
                    </View>
                  </View>
                  
                  {/* 頁面標題 */}
                  <View style={styles.titleContainer}>
                    <View style={styles.titleLine}></View>
                  </View>
                  
                  {/* 內容 */}
                  <View style={styles.contentContainer}>
                    <View style={styles.contentSection}>
                      <View style={styles.contentHeading}></View>
                      <View style={styles.contentParagraph}></View>
                    </View>
                    
                    <View style={styles.imagesSection}>
                      <View style={styles.contentHeading}></View>
                      <View style={styles.imagesGrid}>
                        <View style={styles.imageBox}></View>
                        <View style={styles.imageBox}></View>
                      </View>
                    </View>
                    
                    <View style={styles.contentSection}>
                      <View style={styles.contentHeading}></View>
                      <View style={styles.contentParagraph}></View>
                    </View>
                  </View>
                  
                  {/* 頁腳 */}
                  <View style={[styles.previewFooter, {height: pdfSettings.footer.height / 3}]}></View>
                </View>
              </View>
            </View>

            {/* 邊距設置 */}
            <List.Item
              title="頁面邊距"
              description={getSettingDescription('margins')}
              left={props => <List.Icon {...props} icon="page-layout-body" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateToSettingDetail('margins')}
            />
            <Divider />
            
            {/* 抬頭設置 */}
            <List.Item
              title="頁面抬頭"
              description={getSettingDescription('header')}
              left={props => <List.Icon {...props} icon="page-layout-header" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateToSettingDetail('header')}
            />
            <Divider />
            
            {/* 頁腳設置 */}
            <List.Item
              title="頁面頁腳"
              description={getSettingDescription('footer')}
              left={props => <List.Icon {...props} icon="page-layout-footer" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateToSettingDetail('footer')}
            />
            <Divider />
            
            {/* 圖片設置 */}
            <List.Item
              title="圖片設置"
              description={getSettingDescription('images')}
              left={props => <List.Icon {...props} icon="image-multiple" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateToSettingDetail('images')}
            />
            <Divider />
            
            {/* 字體設置 */}
            <List.Item
              title="字體設置"
              description={getSettingDescription('fonts')}
              left={props => <List.Icon {...props} icon="format-font" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateToSettingDetail('fonts')}
            />
            {/* 內容間距設置 */}
            <List.Item
              title="內容間距"
              description={getSettingDescription('content')}
              left={props => <List.Icon {...props} icon="format-text-size" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateToSettingDetail('content')}
            />
          </>
        )}
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  pagePreviewContainer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  pagePreviewWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  pagePreview: {
    width: 210,
    height: 297,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewHeader: {
    backgroundColor: '#f8f8f8',
    padding: 4,
    marginBottom: 4,
    borderRadius: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoPlaceholder: {
    width: 20,
    height: 15,
    backgroundColor: '#c0c0c0',
    marginRight: 5,
    borderRadius: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  companyNameLine: {
    height: 6,
    width: '70%',
    backgroundColor: '#c0c0c0',
    marginBottom: 3,
    borderRadius: 1,
  },
  companyEnNameLine: {
    height: 4,
    width: '50%',
    backgroundColor: '#d0d0d0',
    borderRadius: 1,
  },
  titleContainer: {
    marginVertical: 4,
    alignItems: 'center',
  },
  titleLine: {
    height: 8,
    width: '80%',
    backgroundColor: '#c0c0c0',
    borderRadius: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 4,
  },
  contentSection: {
    marginBottom: 8,
  },
  contentHeading: {
    height: 5,
    width: '50%',
    backgroundColor: '#d0d0d0',
    marginBottom: 3,
    borderRadius: 1,
  },
  contentParagraph: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 1,
  },
  imagesSection: {
    marginBottom: 8,
  },
  imagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageBox: {
    width: '48%',
    height: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  previewFooter: {
    backgroundColor: '#f8f8f8',
    padding: 2,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  }
}); 