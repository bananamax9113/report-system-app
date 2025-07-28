import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, Alert, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PDFViewerScreen({ route, navigation }) {
  const { pdfUri, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);
  
  // 確保標題在導航欄中正確顯示
  useEffect(() => {
    if (title) {
      navigation.setOptions({
        title: title,
        headerLeft: () => (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        )
      });
    }
  }, [title, navigation]);

  console.log('PDFViewerScreen初始化 - URI:', pdfUri);

  useEffect(() => {
    // 設置標題和導航選項
    navigation.setOptions({
      title: title,
      headerLeft: () => (
        <TouchableOpacity onPress={goBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={sharePDF} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });

    // 檢查PDF文件是否存在
    const checkPdfFile = async () => {
      try {
        if (!pdfUri) {
          throw new Error('未提供PDF文件路徑');
        }
        
        const fileInfo = await FileSystem.getInfoAsync(pdfUri);
        if (!fileInfo.exists) {
          throw new Error('PDF文件不存在');
        }
        
        console.log('PDF文件驗證成功，大小:', fileInfo.size, 'bytes');
        setLoading(false);
      } catch (err) {
        console.log('PDF文件檢查失敗:', err.message);
        setError('無法載入PDF: ' + err.message);
        setLoading(false);
      }
    };
    
    checkPdfFile();
  }, [pdfUri, title, navigation]);

  // 分享PDF文件
  const sharePDF = async () => {
    try {
      if (!pdfUri) {
        Alert.alert('錯誤', '沒有可分享的PDF文件');
        return;
      }
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('錯誤', '您的設備不支持分享功能');
        return;
      }
      
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: '分享報告',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.log('分享PDF失敗:', error);
      Alert.alert('錯誤', '分享PDF失敗: ' + error.message);
    }
  };
  
  // 返回上一頁
  const goBack = () => {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('報告列表', { screen: 'ReportList' });
      }
    } catch (error) {
      console.log('導航錯誤:', error);
      navigation.navigate('報告列表');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>載入PDF中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>載入失敗</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained"
            onPress={goBack}
            style={styles.errorButton}
          >
            返回
          </Button>
        </View>
      ) : (
          <WebView
          ref={webViewRef}
          source={{ uri: pdfUri }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          originWhitelist={['*']}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>載入PDF中...</Text>
              </View>
            )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView錯誤:', nativeEvent);
            setError('無法顯示PDF: ' + nativeEvent.description);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
    color: '#666',
  },
  errorButton: {
    marginTop: 16,
    minWidth: 120,
  },
  headerButton: {
    paddingHorizontal: 12,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    paddingHorizontal: 12,
  }
}); 