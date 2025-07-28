import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 導入主要功能頁面
import HomeScreen from '../screens/HomeScreen';
import ProjectTabScreen from '../screens/ProjectTabScreen';
import ReportCreationScreen from '../screens/ReportCreationScreen';
import ReportListScreen from '../screens/ReportListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CompanyInfoEditScreen from '../screens/CompanyInfoEditScreen';
import SignatureEditScreen from '../screens/SignatureEditScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import PDFViewerScreen from '../screens/PDFViewerScreen';
// 導入新增頁面
import CompanyHeaderSettings from '../screens/CompanyHeaderSettings';
import PdfSettings from '../screens/PdfSettings';
import PdfSettingDetail from '../screens/PdfSettingDetail';
import DataManagement from '../screens/DataManagement';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const ReportStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator(); // 添加首頁導航堆棧

// 個人中心堆疊導航
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
        animation: 'slide_from_right',
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          title: '個人中心',
          headerShown: true
        }}
      />
      <ProfileStack.Screen 
        name="CompanyInfoEdit" 
        component={CompanyInfoEditScreen} 
        options={({ route }) => ({ 
          title: getCompanyInfoEditTitle(route.params?.fieldType)
        })}
      />
      <ProfileStack.Screen 
        name="SignatureEdit" 
        component={SignatureEditScreen} 
        options={{ title: '簽名' }}
      />
      {/* 新增的屏幕組件 */}
      <ProfileStack.Screen 
        name="CompanyHeaderSettings" 
        component={CompanyHeaderSettings} 
        options={{ title: '報告抬頭信息' }}
      />
      <ProfileStack.Screen 
        name="PdfSettings" 
        component={PdfSettings} 
        options={{ title: 'PDF頁面設置' }}
      />
      <ProfileStack.Screen 
        name="PdfSettingDetail" 
        component={PdfSettingDetail} 
        options={({ route }) => ({ 
          title: getPdfSettingTitle(route.params?.settingType)
        })}
      />
      <ProfileStack.Screen 
        name="DataManagement" 
        component={DataManagement} 
        options={{ title: '數據管理' }}
      />
    </ProfileStack.Navigator>
  );
}

// 報告管理堆疊導航
function ReportStackNavigator() {
  return (
    <ReportStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
        animation: 'slide_from_right',
      }}
    >
      <ReportStack.Screen 
        name="ReportList" 
        component={ReportListScreen} 
        options={{ 
          title: '報告管理',
          headerShown: true
        }}
      />
      <ReportStack.Screen 
        name="ReportDetail" 
        component={ReportDetailScreen} 
        options={{ 
          title: '報告詳情',
          headerShown: true,
          headerBackTitleVisible: false,
          headerBackTitle: '返回'
        }}
      />
      <ReportStack.Screen 
        name="PDFViewer" 
        component={PDFViewerScreen} 
        options={{ 
          title: '報告預覽',
          headerShown: true,
          headerBackTitleVisible: false,
          headerBackTitle: '返回'
        }}
      />
    </ReportStack.Navigator>
  );
}

// 首頁堆疊導航
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
        animation: 'slide_from_right',
      }}
    >
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ 
          title: '首頁',
          headerShown: true
        }}
      />
      <HomeStack.Screen 
        name="PDF預覽" 
        component={PDFViewerScreen} 
        options={{ title: '報告預覽' }}
      />
    </HomeStack.Navigator>
  );
}

// 獲取公司信息編輯頁面標題
function getCompanyInfoEditTitle(fieldType) {
  switch (fieldType) {
    case 'logo':
      return '編輯公司Logo';
    case 'companyName':
      return '編輯公司名稱';
    case 'companyNameEn':
      return '編輯英文名稱';
    case 'email':
      return '編輯電子郵箱';
    case 'phone':
      return '編輯聯繫電話';
    case 'fax':
      return '編輯傳真';
    case 'address':
      return '編輯公司地址';
    default:
      return '編輯信息';
  }
}

// 獲取PDF設置頁面標題
function getPdfSettingTitle(settingType) {
  switch (settingType) {
    case 'margins':
      return '頁面邊距設置';
    case 'header':
      return '頁面抬頭設置';
    case 'footer':
      return '頁面頁腳設置';
    case 'images':
      return '圖片設置';
    case 'fonts':
      return '字體設置';
    default:
      return 'PDF設置';
  }
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === '主頁') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === '項目') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === '新建報告') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === '報告列表') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === '個人') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="主頁" 
        component={HomeStackNavigator} 
        options={{
          headerShown: false
        }}
      />
      <Tab.Screen name="項目" component={ProjectTabScreen} />
      <Tab.Screen 
        name="新建報告" 
        component={ReportCreationScreen}
        options={{
          headerTitle: '編制報告'
        }}
      />
      <Tab.Screen 
        name="報告列表" 
        component={ReportStackNavigator}
        options={{
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="個人" 
        component={ProfileStackNavigator}
        options={{
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
} 