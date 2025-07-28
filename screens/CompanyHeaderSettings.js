import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, List, Divider, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CompanyHeaderSettings({ navigation, route }) {
  // 从route参数获取初始公司信息
  const [companyInfo, setCompanyInfo] = useState(route.params?.companyInfo || {
    companyName: '',
    companyNameEn: '',
    email: '',
    phone: '',
    fax: '',
    address: '',
    logo: null
  });
  const [loading, setLoading] = useState(true);

  // 加载公司信息
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const info = await AsyncStorage.getItem('companyInfo');
        if (info) {
          setCompanyInfo(JSON.parse(info));
        }
        setLoading(false);
      } catch (error) {
        console.log('獲取公司信息失敗', error);
        setLoading(false);
      }
    };
    
    loadCompanyInfo();
  }, []);

  // 當從編輯頁面返回時，重新加載數據
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCompanyInfo();
    });

    return unsubscribe;
  }, [navigation]);

  // 加載公司信息
  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      const info = await AsyncStorage.getItem('companyInfo');
      if (info) {
        setCompanyInfo(JSON.parse(info));
      }
      setLoading(false);
    } catch (error) {
      console.log('獲取公司信息失敗', error);
      setLoading(false);
    }
  };
  
  // 導航到編輯頁面
  const navigateToEdit = (fieldType, initialValue) => {
    navigation.navigate('CompanyInfoEdit', { fieldType, initialValue });
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader style={styles.sectionHeader}>報告抬頭信息</List.Subheader>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>加載中...</Text>
          </View>
        ) : (
          <>
            {/* 公司Logo */}
            <List.Item
              title="公司Logo"
              description={companyInfo.logo ? "已設置" : "未設置"}
              left={props => 
                <List.Icon {...props} icon="image" />
              }
              right={props => 
                companyInfo.logo ? (
                  <View style={styles.rightContainer}>
                    <Image 
                      source={{ uri: companyInfo.logo }} 
                      style={styles.listItemImage}
                      resizeMode="contain"
                    />
                    <List.Icon icon="chevron-right" />
                  </View>
                ) : (
                  <List.Icon icon="chevron-right" />
                )
              }
              onPress={() => navigateToEdit('logo', companyInfo.logo)}
            />
            <Divider />
            
            {/* 公司名稱 */}
            <List.Item
              title="公司名稱"
              description={companyInfo.companyName || "未設置"}
              left={props => 
                <List.Icon {...props} icon="office-building" />
              }
              onPress={() => navigateToEdit('companyName', companyInfo.companyName)}
              right={props => <List.Icon icon="chevron-right" />}
            />
            <Divider />
            
            {/* 英文名稱 */}
            <List.Item
              title="英文名稱"
              description={companyInfo.companyNameEn || "未設置"}
              left={props => 
                <List.Icon {...props} icon="alphabetical" />
              }
              onPress={() => navigateToEdit('companyNameEn', companyInfo.companyNameEn)}
              right={props => <List.Icon icon="chevron-right" />}
            />
            <Divider />
            
            {/* 電子郵箱 */}
            <List.Item
              title="電子郵箱"
              description={companyInfo.email || "未設置"}
              left={props => 
                <List.Icon {...props} icon="email" />
              }
              onPress={() => navigateToEdit('email', companyInfo.email)}
              right={props => <List.Icon icon="chevron-right" />}
            />
            <Divider />
            
            {/* 聯繫電話 */}
            <List.Item
              title="聯繫電話"
              description={companyInfo.phone || "未設置"}
              left={props => 
                <List.Icon {...props} icon="phone" />
              }
              onPress={() => navigateToEdit('phone', companyInfo.phone)}
              right={props => <List.Icon icon="chevron-right" />}
            />
            <Divider />
            
            {/* 傳真 */}
            <List.Item
              title="傳真"
              description={companyInfo.fax || "未設置"}
              left={props => 
                <List.Icon {...props} icon="fax" />
              }
              onPress={() => navigateToEdit('fax', companyInfo.fax)}
              right={props => <List.Icon icon="chevron-right" />}
            />
            <Divider />
            
            {/* 公司地址 */}
            <List.Item
              title="公司地址"
              description={companyInfo.address || "未設置"}
              left={props => 
                <List.Icon {...props} icon="map-marker" />
              }
              onPress={() => navigateToEdit('address', companyInfo.address)}
              right={props => <List.Icon icon="chevron-right" />}
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
  listItemImage: {
    width: 60,
    height: 30,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  }
}); 