import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Divider, Surface, ActivityIndicator, Avatar, List, Badge } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import seedPublicProjects from '../utils/seedPublicProjects';
import { getRelativeTime } from '../utils/dateUtils';

export default function HomeScreen({ navigation }) {
  const [userInfo, setUserInfo] = useState({
    username: '',
    realName: '',
    avatar: null,
    loginType: '',
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalReports: 0,
    pendingReports: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfoStr = await SecureStore.getItemAsync('userInfo');
        if (userInfoStr) {
          const parsedUserInfo = JSON.parse(userInfoStr);
          setUserInfo(parsedUserInfo);
        }
      } catch (error) {
        console.log('獲取用戶信息失敗', error);
      }
    };

    // 初始化公共項目數據（模擬後端數據）
    const initPublicProjects = async () => {
      try {
        // 檢查是否已經初始化過公共項目數據
        const initialized = await SecureStore.getItemAsync('public_projects_initialized');
        if (!initialized) {
          // 導入公共項目示例數據
          await seedPublicProjects();
          // 標記為已初始化
          await SecureStore.setItemAsync('public_projects_initialized', 'true');
          console.log('公共項目數據已初始化');
        }
      } catch (error) {
        console.log('初始化公共項目數據失敗', error);
      }
    };

    // 加載項目數據
    const loadProjects = async () => {
      try {
        // 獲取公共項目
        const publicProjectsData = await AsyncStorage.getItem('public_projects');
        const publicProjects = publicProjectsData ? JSON.parse(publicProjectsData) : [];
        
        // 獲取用戶私有項目
        const privateProjectsData = await AsyncStorage.getItem('projects');
        const privateProjects = privateProjectsData ? JSON.parse(privateProjectsData) : [];
        
        // 合併項目並按創建時間排序
        const allProjects = [...publicProjects, ...privateProjects].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setProjects(allProjects);
        return allProjects.length;
      } catch (error) {
        console.log('獲取項目列表失敗:', error);
        return 0;
      }
    };

    // 加載報告數據
    const loadReports = async () => {
      try {
        const reportsData = await AsyncStorage.getItem('reports');
        if (reportsData) {
          const parsedReports = JSON.parse(reportsData);
          
          // 按創建時間排序，獲取最近的5個報告
          const sortedReports = parsedReports.sort((a, b) => 
            new Date(b.createdAt || b.date || Date.now()) - new Date(a.createdAt || a.date || Date.now())
          );
          
          setRecentReports(sortedReports.slice(0, 5));
          
          return {
            total: parsedReports.length,
            pending: parsedReports.filter(r => !r.completed).length
          };
        }
        return { total: 0, pending: 0 };
      } catch (error) {
        console.log('讀取報告列表失敗', error);
        return { total: 0, pending: 0 };
      }
    };

    // 加載用戶信息和統計數據
    const loadData = async () => {
      setLoading(true);
      await loadUserInfo();
      // 初始化公共項目數據
      await initPublicProjects();
      
      // 加載真實數據而非模擬數據
      const projectCount = await loadProjects();
      const reportStats = await loadReports();
      
        setStats({
        totalProjects: projectCount,
        totalReports: reportStats.total,
        pendingReports: reportStats.pending,
        });
      
        setLoading(false);
    };

    loadData();
    
    // 監聽頁面聚焦事件，每次回到此頁面時重新加載數據
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userInfo');
      
      // 重新加載應用以更新登錄狀態
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.log('登出錯誤', error);
    }
  };

  const renderUserAvatar = () => {
    if (userInfo.avatar) {
      return (
        <Avatar.Image
          size={60}
          source={{ uri: userInfo.avatar }}
          style={styles.avatar}
        />
      );
    } else {
      return (
        <Avatar.Text
          size={60}
          label={userInfo.realName ? userInfo.realName.substring(0, 1).toUpperCase() : userInfo.username ? userInfo.username.substring(0, 1).toUpperCase() : "?"}
          backgroundColor="#007AFF"
          style={styles.avatar}
        />
      );
    }
  };

  const renderStatCard = (title, value, icon, color) => (
    <Surface style={styles.statCard} elevation={1}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Surface>
  );

  const renderActionCard = (title, description, icon, color, onPress) => (
    <TouchableOpacity onPress={onPress} style={{ width: '31%' }}>
      <Surface style={[styles.actionCard, { borderLeftColor: color }]} elevation={1}>
        <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="white" />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </Surface>
    </TouchableOpacity>
  );

  const renderReportItem = ({ item }) => {
    const projectName = projects.find(p => p.id === item.projectId)?.name || '未知項目';
    
    return (
      <List.Item
        title={item.title}
        description={`${projectName} • ${getRelativeTime(item.createdAt || item.date || Date.now())}`}
        left={props => <List.Icon {...props} icon="file-document-outline" color="#007AFF" />}
        right={props => item.completed ? 
          <Badge {...props} style={{backgroundColor: '#34C759', alignSelf: 'center'}}>完成</Badge> : 
          <Badge {...props} style={{backgroundColor: '#FF9500', alignSelf: 'center'}}>進行中</Badge>
        }
        onPress={() => {
          // 檢查報告是否有 PDF URI
          if (item.pdfUri) {
            // 如果有 PDF URI，直接在首頁導航堆棧中預覽
            navigation.navigate('PDF預覽', { 
              pdfUri: item.pdfUri,
              title: item.title
            });
          } else {
            // 如果沒有 PDF URI，先跳轉到報告詳情
            navigation.navigate('報告列表', { 
              screen: 'ReportDetail', 
              params: { report: item }
            });
          }
        }}
        style={styles.reportListItem}
      />
    );
  };

  const renderEmptyReports = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暫無最近報告</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 用戶信息卡片 */}
      <Surface style={styles.userInfoCard} elevation={2}>
        <View style={styles.userInfoContainer}>
          {renderUserAvatar()}
          <View style={styles.userTextContainer}>
            <Text style={styles.greeting}>你好，{userInfo.realName || userInfo.username || '用戶'}！</Text>
            <Text style={styles.subGreeting}>歡迎使用報告系統</Text>
          </View>
        </View>
      </Surface>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>統計概覽</Text>
          <View style={styles.statsContainer}>
            {renderStatCard('總項目數', stats.totalProjects, '📁', '#007AFF')}
            {renderStatCard('總報告數', stats.totalReports, '📊', '#FF9500')}
            {renderStatCard('待處理', stats.pendingReports, '⏳', '#34C759')}
          </View>

          <Text style={styles.sectionTitle}>快速操作</Text>
          <View style={styles.actionsContainer}>
            {renderActionCard('新建報告', '創建新的檢測報告', 'add-circle', '#007AFF', () => navigation.navigate('新建報告'))}
            {renderActionCard('添加項目', '管理檢測項目', 'folder-open', '#FF9500', () => navigation.navigate('項目'))}
            {renderActionCard('查看報告', '瀏覽所有報告', 'document-text', '#34C759', () => navigation.navigate('報告列表'))}
          </View>
              
          <View style={styles.recentReportsHeader}>
            <Text style={styles.sectionTitle}>最近的報告</Text>
            <TouchableOpacity onPress={() => navigation.navigate('報告列表')}>
              <Text style={styles.viewAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          
          <Card style={styles.card}>
            {recentReports.length > 0 ? (
              <FlatList
                data={recentReports}
                renderItem={renderReportItem}
                keyExtractor={item => item.id}
                ItemSeparatorComponent={() => <Divider />}
                style={styles.reportList}
                scrollEnabled={false}
              />
            ) : renderEmptyReports()}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    marginLeft: 12,
  },
  avatar: {
    marginRight: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: '31%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  actionCard: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    backgroundColor: 'white',
    borderLeftWidth: 4,
    height: 120,
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    marginTop: 8,
  },
  listSection: {
    paddingVertical: 0,
  },
  reportList: {
    maxHeight: 350, // 限制列表高度
  },
  reportListItem: {
    paddingVertical: 8,
  },
  recentReportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 24,
  },
  viewAllText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
  userInfoCard: {
    borderRadius: 12,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
  },
}); 