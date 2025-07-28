import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, List, Divider, IconButton, SegmentedButtons, RadioButton } from 'react-native-paper';

// 字體選項
const FONT_FAMILIES = [
  { label: '新細明體', value: 'PMingLiU, 新細明體, serif' },
  { label: '楷體', value: 'KaiTi, 楷體, serif' },
  { label: '宋體', value: 'SimSun, 宋體, serif' },
  { label: '黑體', value: 'SimHei, 黑體, sans-serif' },
  { label: '微軟雅黑', value: 'Microsoft YaHei, 微軟雅黑, sans-serif' }
];

export default function PdfSettingDetail({ navigation, route }) {
  const { settingType, pdfSettings: initialSettings } = route.params;
  
  // 確保初始設置中有content屬性
  const completeInitialSettings = {...initialSettings};
  if (!completeInitialSettings.content) {
    completeInitialSettings.content = {
      sectionSpacing: 30,
      lineSpacing: 1.6
    };
  }
  
  // 確保有報告標題字體大小設定
  if (!completeInitialSettings.content.titleFontSize) {
    completeInitialSettings.content.titleFontSize = 20;
  }
  
  const [settings, setSettings] = useState(completeInitialSettings);
  
  // 更新標題
  useEffect(() => {
    let title = '設置';
    switch(settingType) {
      case 'margins':
        title = '頁面邊距設置';
        break;
      case 'header':
        title = '頁面抬頭設置';
        break;
      case 'footer':
        title = '頁面頁腳設置';
        break;
      case 'images':
        title = '圖片設置';
        break;
      case 'fonts':
        title = '字體設置';
        break;
      case 'content':
        title = '內容間距設置';
        break;
    }
    
    navigation.setOptions({
      title: title,
      // 添加保存按鈕
      headerRight: () => (
        <Button 
          onPress={handleSave} 
          mode="text" 
          compact
          labelStyle={{ color: '#007AFF', fontWeight: 'bold' }}
        >
          保存
        </Button>
      ),
    });
  }, [settingType, settings, navigation]);
  
  // 更新設置函數
  const updateSettings = (category, key, value) => {
    setSettings(prev => {
      const newSettings = {...prev};
      if (category) {
        newSettings[category] = {...newSettings[category], [key]: value};
      } else {
        newSettings[key] = value;
      }
      return newSettings;
    });
  };
  
  // 保存設置
  const handleSave = async () => {
    if (route.params?.onSave) {
      const success = await route.params.onSave(settings);
      if (success) {
        navigation.goBack();
      }
    } else {
      Alert.alert('錯誤', '保存功能未定義');
    }
  };
  
  // 渲染邊距設置
  const renderMarginsSettings = () => (
    <>
      <List.Item
        title="上邊距"
        description={`${settings.margins.top} mm`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('margins', 'top', Math.max(5, settings.margins.top - 1))
            } />
            <Text style={styles.controlValue}>{settings.margins.top}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('margins', 'top', Math.min(50, settings.margins.top + 1))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="下邊距"
        description={`${settings.margins.bottom} mm`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('margins', 'bottom', Math.max(5, settings.margins.bottom - 1))
            } />
            <Text style={styles.controlValue}>{settings.margins.bottom}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('margins', 'bottom', Math.min(50, settings.margins.bottom + 1))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="左邊距"
        description={`${settings.margins.left} mm`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('margins', 'left', Math.max(5, settings.margins.left - 1))
            } />
            <Text style={styles.controlValue}>{settings.margins.left}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('margins', 'left', Math.min(50, settings.margins.left + 1))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="右邊距"
        description={`${settings.margins.right} mm`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('margins', 'right', Math.max(5, settings.margins.right - 1))
            } />
            <Text style={styles.controlValue}>{settings.margins.right}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('margins', 'right', Math.min(50, settings.margins.right + 1))
            } />
          </View>
        )}
      />
      
      <View style={styles.previewContainer}>
        <View style={[styles.pagePreview, {
          paddingTop: settings.margins.top / 2,
          paddingRight: settings.margins.right / 2,
          paddingBottom: settings.margins.bottom / 2,
          paddingLeft: settings.margins.left / 2,
        }]}>
          <View style={styles.previewHeader}></View>
          <View style={styles.previewContent}></View>
          <View style={styles.previewFooter}></View>
        </View>
        <Text style={styles.previewLabel}>頁面邊距預覽</Text>
      </View>
    </>
  );
  
  // 渲染抬頭設置
  const renderHeaderSettings = () => (
    <>
      <List.Item
        title="抬頭佈局"
        description={settings.header.layout === 'horizontal' ? "水平佈局" : "垂直佈局"}
        right={() => (
          <SegmentedButtons
            value={settings.header.layout}
            onValueChange={(value) => updateSettings('header', 'layout', value)}
            buttons={[
              { value: 'horizontal', label: '水平' },
              { value: 'vertical', label: '垂直' }
            ]}
            style={styles.smallSegmentButtons}
          />
        )}
      />
      <Divider />
      
      <List.Item
        title="抬頭高度"
        description={`${settings.header.height} px`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('header', 'height', Math.max(80, settings.header.height - 10))
            } />
            <Text style={styles.controlValue}>{settings.header.height}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('header', 'height', Math.min(250, settings.header.height + 10))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="公司名稱字體大小"
        description={`${settings.header.companyNameFontSize} pt`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('header', 'companyNameFontSize', Math.max(10, settings.header.companyNameFontSize - 1))
            } />
            <Text style={styles.controlValue}>{settings.header.companyNameFontSize}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('header', 'companyNameFontSize', Math.min(24, settings.header.companyNameFontSize + 1))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="英文名稱字體大小"
        description={`${settings.header.companyEnNameFontSize} pt`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('header', 'companyEnNameFontSize', Math.max(8, settings.header.companyEnNameFontSize - 1))
            } />
            <Text style={styles.controlValue}>{settings.header.companyEnNameFontSize}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('header', 'companyEnNameFontSize', Math.min(20, settings.header.companyEnNameFontSize + 1))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="聯繫信息字體大小"
        description={`${settings.header.contactInfoFontSize} pt`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('header', 'contactInfoFontSize', Math.max(8, settings.header.contactInfoFontSize - 1))
            } />
            <Text style={styles.controlValue}>{settings.header.contactInfoFontSize}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('header', 'contactInfoFontSize', Math.min(16, settings.header.contactInfoFontSize + 1))
            } />
          </View>
        )}
      />
      
      <View style={styles.previewContainer}>
        <View style={[styles.headerPreview, {
          height: settings.header.height / 3,
          flexDirection: settings.header.layout === 'horizontal' ? 'row' : 'column',
          alignItems: settings.header.layout === 'horizontal' ? 'flex-start' : 'center',
        }]}>
          <View style={[styles.logoPreview, 
            settings.header.layout === 'horizontal' 
              ? { width: 30, height: 30, marginRight: 10 } 
              : { width: 50, height: 30, marginBottom: 5 }
          ]}></View>
          <View style={settings.header.layout === 'horizontal' ? { flex: 1 } : {}}>
            <View style={[styles.previewText, { 
              height: settings.header.companyNameFontSize / 2,
              width: settings.header.layout === 'horizontal' ? '60%' : '80%',
              alignSelf: settings.header.layout === 'horizontal' ? 'flex-start' : 'center'
            }]}></View>
            <View style={[styles.previewText, { 
              height: settings.header.companyEnNameFontSize / 2,
              width: settings.header.layout === 'horizontal' ? '40%' : '60%',
              marginTop: 2,
              alignSelf: settings.header.layout === 'horizontal' ? 'flex-start' : 'center'
            }]}></View>
          </View>
          {settings.header.layout === 'horizontal' && (
            <View style={{ width: '30%', alignItems: 'flex-end' }}>
              <View style={[styles.previewText, { height: settings.header.contactInfoFontSize / 2, width: '80%' }]}></View>
              <View style={[styles.previewText, { height: settings.header.contactInfoFontSize / 2, width: '60%', marginTop: 2 }]}></View>
            </View>
          )}
          {settings.header.layout === 'vertical' && (
            <View style={{ width: '80%', alignItems: 'center', marginTop: 2 }}>
              <View style={[styles.previewText, { height: settings.header.contactInfoFontSize / 2, width: '80%' }]}></View>
            </View>
          )}
        </View>
        <Text style={styles.previewLabel}>抬頭佈局預覽</Text>
      </View>
    </>
  );
  
  // 渲染頁腳設置
  const renderFooterSettings = () => (
    <>
      <List.Item
        title="頁腳高度"
        description={`${settings.footer.height} px`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('footer', 'height', Math.max(0, settings.footer.height - 5))
            } />
            <Text style={styles.controlValue}>{settings.footer.height}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('footer', 'height', Math.min(80, settings.footer.height + 5))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="頁腳字體大小"
        description={`${settings.footer.fontSize} pt`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('footer', 'fontSize', Math.max(8, settings.footer.fontSize - 0.5))
            } />
            <Text style={styles.controlValue}>{settings.footer.fontSize}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('footer', 'fontSize', Math.min(14, settings.footer.fontSize + 0.5))
            } />
          </View>
        )}
      />
      
      <View style={styles.previewContainer}>
        <View style={styles.footerPreview}>
          <View style={[styles.footerContent, { height: settings.footer.height / 2 }]}>
            <View style={[styles.previewText, { 
              height: settings.footer.fontSize / 2,
              width: '60%',
              alignSelf: 'center'
            }]}></View>
          </View>
        </View>
        <Text style={styles.previewLabel}>頁腳預覽</Text>
      </View>
    </>
  );
  
  // 渲染圖片設置
  const renderImagesSettings = () => (
    <>
      <List.Item
        title="圖片框高度"
        description={`${settings.images.height} px`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('images', 'height', Math.max(100, settings.images.height - 10))
            } />
            <Text style={styles.controlValue}>{settings.images.height}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('images', 'height', Math.min(800, settings.images.height + 10))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="圖片間距"
        description={`${settings.images.gap} px`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('images', 'gap', Math.max(0, settings.images.gap - 1))
            } />
            <Text style={styles.controlValue}>{settings.images.gap}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('images', 'gap', Math.min(30, settings.images.gap + 1))
            } />
          </View>
        )}
      />
      
      <View style={styles.previewContainer}>
        <View style={styles.imagesPreview}>
          <View style={styles.imagesRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.imageBox, { 
                height: settings.images.height / 3,
                marginRight: i < 3 ? settings.images.gap / 2 : 0
              }]}></View>
            ))}
          </View>
          <Text style={styles.previewLabel}>圖片佈局預覽</Text>
        </View>
      </View>
    </>
  );
  
  // 渲染內容間距設置
  const renderContentSettings = () => (
    <>
      <List.Item
        title="報告標題字體大小"
        description={`${settings.content.titleFontSize} pt`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('content', 'titleFontSize', Math.max(14, settings.content.titleFontSize - 1))
            } />
            <Text style={styles.controlValue}>{settings.content.titleFontSize}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('content', 'titleFontSize', Math.min(28, settings.content.titleFontSize + 1))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="段落間距"
        description={`${settings.content.sectionSpacing} px`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('content', 'sectionSpacing', Math.max(10, settings.content.sectionSpacing - 5))
            } />
            <Text style={styles.controlValue}>{settings.content.sectionSpacing}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('content', 'sectionSpacing', Math.min(60, settings.content.sectionSpacing + 5))
            } />
          </View>
        )}
      />
      <Divider />
      
      <List.Item
        title="行間距"
        description={`${settings.content.lineSpacing}`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('content', 'lineSpacing', Math.max(1, Number((settings.content.lineSpacing - 0.1).toFixed(1))))
            } />
            <Text style={styles.controlValue}>{settings.content.lineSpacing}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('content', 'lineSpacing', Math.min(3, Number((settings.content.lineSpacing + 0.1).toFixed(1))))
            } />
          </View>
        )}
      />
      
      <View style={styles.previewContainer}>
        <View style={styles.contentPreview}>
          <View style={{
            height: settings.content.titleFontSize * 1.5,
            backgroundColor: '#c0c0c0',
            borderRadius: 2,
            marginBottom: 15,
            width: '80%',
            alignSelf: 'center'
          }}></View>
          
          <View style={[styles.contentSection, { marginBottom: settings.content.sectionSpacing / 2 }]}>
            <View style={styles.contentHeading}></View>
            <View style={[styles.contentLine, { marginBottom: settings.content.lineSpacing * 5 }]}></View>
            <View style={[styles.contentLine, { marginBottom: settings.content.lineSpacing * 5 }]}></View>
            <View style={[styles.contentLine, { width: '60%' }]}></View>
          </View>
          
          <View style={styles.contentSection}>
            <View style={styles.contentHeading}></View>
            <View style={[styles.contentLine, { marginBottom: settings.content.lineSpacing * 5 }]}></View>
            <View style={[styles.contentLine, { marginBottom: settings.content.lineSpacing * 5 }]}></View>
            <View style={[styles.contentLine, { width: '70%' }]}></View>
          </View>
        </View>
        <Text style={styles.previewLabel}>標題與內容間距預覽</Text>
      </View>
    </>
  );
  
  // 渲染字體設置
  const renderFontsSettings = () => (
    <>
      <List.Subheader>字體</List.Subheader>
      <RadioButton.Group 
        onValueChange={value => updateSettings('fonts', 'family', value)} 
        value={settings.fonts.family}
      >
        {FONT_FAMILIES.map((font) => (
          <View key={font.value}>
            <RadioButton.Item
              label={font.label}
              value={font.value}
            />
            <Divider />
          </View>
        ))}
      </RadioButton.Group>
      
      <List.Item
        title="正文字體大小"
        description={`${settings.fonts.size} pt`}
        right={() => (
          <View style={styles.settingControls}>
            <IconButton icon="minus" size={20} onPress={() => 
              updateSettings('fonts', 'size', Math.max(8, settings.fonts.size - 0.5))
            } />
            <Text style={styles.controlValue}>{settings.fonts.size}</Text>
            <IconButton icon="plus" size={20} onPress={() => 
              updateSettings('fonts', 'size', Math.min(16, settings.fonts.size + 0.5))
            } />
          </View>
        )}
      />
      
      <View style={styles.previewContainer}>
        <View style={[styles.fontsPreview, {fontFamily: settings.fonts.family}]}>
          <Text style={{
            fontFamily: settings.fonts.family,
            fontSize: settings.fonts.size * 2,
            textAlign: 'center',
            marginBottom: 10
          }}>字體預覽: {settings.fonts.size}pt</Text>
          <Text style={{
            fontFamily: settings.fonts.family,
            fontSize: settings.fonts.size,
            lineHeight: settings.fonts.size * 1.5
          }}>這是使用 {settings.fonts.family.split(',')[0]} 字體的預覽文字。</Text>
          <Text style={{
            fontFamily: settings.fonts.family,
            fontSize: settings.fonts.size,
            lineHeight: settings.fonts.size * 1.5
          }}>報告內容將使用此字體進行排版。</Text>
        </View>
      </View>
    </>
  );
  
  // 根據設置類型渲染不同的設置界面
  const renderSettings = () => {
    switch(settingType) {
      case 'margins':
        return renderMarginsSettings();
      case 'header':
        return renderHeaderSettings();
      case 'footer':
        return renderFooterSettings();
      case 'images':
        return renderImagesSettings();
      case 'fonts':
        return renderFontsSettings();
      case 'content':
        return renderContentSettings();
      default:
        return <Text>未知設置類型</Text>;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        {renderSettings()}
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlValue: {
    minWidth: 30,
    textAlign: 'center',
  },
  smallSegmentButtons: {
    height: 30,
    maxWidth: 160,
  },
  previewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  pagePreview: {
    width: 200,
    height: 280,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
  },
  previewHeader: {
    height: 30,
    backgroundColor: '#e0e0e0',
    marginBottom: 5,
  },
  previewContent: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  previewFooter: {
    height: 15,
    backgroundColor: '#e0e0e0',
    marginTop: 5,
  },
  previewLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  headerPreview: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
  },
  logoPreview: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  previewText: {
    backgroundColor: '#c0c0c0',
    borderRadius: 2,
  },
  footerPreview: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
  },
  footerContent: {
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  imagesPreview: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
  },
  imagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageBox: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  fontsPreview: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
  },
  contentPreview: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
  },
  contentSection: {
    marginBottom: 10,
  },
  contentHeading: {
    height: 20,
    backgroundColor: '#c0c0c0',
    borderRadius: 2,
    marginBottom: 5,
  },
  contentLine: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
}); 