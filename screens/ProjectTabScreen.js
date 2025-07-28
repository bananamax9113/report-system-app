import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';
import ProjectScreen from './ProjectScreen';
import ReportTypeScreen from './ReportTypeScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProjectTabScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' 或 'reportTypes'

  const renderTabContent = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectScreen navigation={navigation} />;
      case 'reportTypes':
        return <ReportTypeScreen navigation={navigation} />;
      default:
        return <ProjectScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部選項卡 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'projects' && styles.activeTabButton]} 
          onPress={() => setActiveTab('projects')}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
            項目
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'reportTypes' && styles.activeTabButton]} 
          onPress={() => setActiveTab('reportTypes')}
        >
          <Text style={[styles.tabText, activeTab === 'reportTypes' && styles.activeTabText]}>
            報告類型
          </Text>
        </TouchableOpacity>
      </View>

      {/* 選項卡內容 */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
}); 