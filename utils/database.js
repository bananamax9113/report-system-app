import AsyncStorage from '@react-native-async-storage/async-storage';

// 數據庫表名
const DB_TABLES = {
  USERS: 'users',
  REPORT_TYPES: 'reportTypes',
  PROJECTS: 'projects',
  REPORTS: 'reports',
  PUBLIC_PROJECTS: 'public_projects', // 新增：公共項目表
};

/**
 * 數據庫工具類
 */
class Database {
  /**
   * 初始化數據庫
   */
  static async initialize() {
    try {
      // 檢查是否已初始化
      const initialized = await AsyncStorage.getItem('db_initialized');
      if (!initialized) {
        // 創建用戶表
        await AsyncStorage.setItem(DB_TABLES.USERS, JSON.stringify([]));
        // 創建報告類型表
        await AsyncStorage.setItem(DB_TABLES.REPORT_TYPES, JSON.stringify([]));
        // 創建項目表
        await AsyncStorage.setItem(DB_TABLES.PROJECTS, JSON.stringify([]));
        // 創建報告表
        await AsyncStorage.setItem(DB_TABLES.REPORTS, JSON.stringify([]));
        // 創建公共項目表
        await AsyncStorage.setItem(DB_TABLES.PUBLIC_PROJECTS, JSON.stringify([]));
        
        // 標記為已初始化
        await AsyncStorage.setItem('db_initialized', 'true');
        console.log('數據庫初始化完成');
      }
    } catch (error) {
      console.error('數據庫初始化失敗:', error);
    }
  }

  /**
   * 用戶相關操作
   */
  static Users = {
    /**
     * 獲取所有用戶
     */
    getAll: async () => {
      try {
        const users = await AsyncStorage.getItem(DB_TABLES.USERS);
        return users ? JSON.parse(users) : [];
      } catch (error) {
        console.error('獲取用戶列表失敗:', error);
        return [];
      }
    },

    /**
     * 通過用戶名查找用戶
     */
    findByUsername: async (username) => {
      try {
        const users = await Database.Users.getAll();
        return users.find(user => user.username === username) || null;
      } catch (error) {
        console.error('查找用戶失敗:', error);
        return null;
      }
    },

    /**
     * 添加新用戶
     */
    add: async (user) => {
      try {
        // 檢查用戶名是否已存在
        const existingUser = await Database.Users.findByUsername(user.username);
        if (existingUser) {
          return { success: false, message: '用戶名已存在' };
        }

        // 獲取現有用戶列表
        const users = await Database.Users.getAll();
        
        // 添加新用戶
        const newUser = {
          id: Date.now().toString(),
          username: user.username,
          password: user.password, // 實際應用中應該加密存儲
          realName: user.realName || user.username,
          avatar: user.avatar || null,
          createdAt: new Date().toISOString(),
        };
        
        users.push(newUser);
        
        // 保存更新後的用戶列表
        await AsyncStorage.setItem(DB_TABLES.USERS, JSON.stringify(users));
        
        // 返回不包含密碼的用戶信息
        const { password, ...userInfo } = newUser;
        return { success: true, user: userInfo };
      } catch (error) {
        console.error('添加用戶失敗:', error);
        return { success: false, message: '添加用戶失敗' };
      }
    },

    /**
     * 驗證用戶登錄
     */
    authenticate: async (username, password) => {
      try {
        const users = await Database.Users.getAll();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
          // 返回不包含密碼的用戶信息
          const { password, ...userInfo } = user;
          return { success: true, user: userInfo };
        } else {
          return { success: false, message: '用戶名或密碼錯誤' };
        }
      } catch (error) {
        console.error('用戶驗證失敗:', error);
        return { success: false, message: '登錄失敗' };
      }
    },

    /**
     * 更新用戶信息
     */
    update: async (userId, updates) => {
      try {
        const users = await Database.Users.getAll();
        const index = users.findIndex(user => user.id === userId);
        
        if (index !== -1) {
          // 更新用戶信息
          users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
          await AsyncStorage.setItem(DB_TABLES.USERS, JSON.stringify(users));
          
          // 返回不包含密碼的用戶信息
          const { password, ...userInfo } = users[index];
          return { success: true, user: userInfo };
        } else {
          return { success: false, message: '用戶不存在' };
        }
      } catch (error) {
        console.error('更新用戶信息失敗:', error);
        return { success: false, message: '更新用戶信息失敗' };
      }
    }
  };

  /**
   * 報告類型相關操作
   */
  static ReportTypes = {
    getAll: async () => {
      try {
        const types = await AsyncStorage.getItem(DB_TABLES.REPORT_TYPES);
        return types ? JSON.parse(types) : [];
      } catch (error) {
        console.error('獲取報告類型失敗:', error);
        return [];
      }
    },
    
    add: async (type) => {
      try {
        const types = await Database.ReportTypes.getAll();
        const newType = {
          id: Date.now().toString(),
          name: type.name,
          code: type.code,
          createdAt: new Date().toISOString()
        };
        
        types.push(newType);
        await AsyncStorage.setItem(DB_TABLES.REPORT_TYPES, JSON.stringify(types));
        return { success: true, type: newType };
      } catch (error) {
        console.error('添加報告類型失敗:', error);
        return { success: false, message: '添加報告類型失敗' };
      }
    }
  };

  /**
   * 項目相關操作
   */
  static Projects = {
    /**
     * 獲取所有項目（包括公共項目和用戶私有項目）
     */
    getAll: async () => {
      try {
        // 獲取公共項目
        const publicProjectsData = await AsyncStorage.getItem(DB_TABLES.PUBLIC_PROJECTS);
        const publicProjects = publicProjectsData ? JSON.parse(publicProjectsData) : [];
        
        // 獲取用戶私有項目
        const privateProjectsData = await AsyncStorage.getItem(DB_TABLES.PROJECTS);
        const privateProjects = privateProjectsData ? JSON.parse(privateProjectsData) : [];
        
        // 合併項目並按創建時間排序
        const allProjects = [...publicProjects, ...privateProjects].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        return allProjects;
      } catch (error) {
        console.error('獲取項目列表失敗:', error);
        return [];
      }
    },
    
    /**
     * 添加新項目
     */
    add: async (project) => {
      try {
        const projects = await AsyncStorage.getItem(DB_TABLES.PROJECTS);
        const currentProjects = projects ? JSON.parse(projects) : [];
        
        const newProject = {
          id: Date.now().toString(),
          name: project.name,
          code: project.code,
          createdAt: new Date().toISOString(),
          isPublic: project.isPublic || false // 標記是否為公共項目
        };
        
        currentProjects.push(newProject);
        await AsyncStorage.setItem(DB_TABLES.PROJECTS, JSON.stringify(currentProjects));
        return { success: true, project: newProject };
      } catch (error) {
        console.error('添加項目失敗:', error);
        return { success: false, message: '添加項目失敗' };
      }
    },
    
    /**
     * 獲取公共項目列表
     */
    getPublicProjects: async () => {
      try {
        const publicProjectsData = await AsyncStorage.getItem(DB_TABLES.PUBLIC_PROJECTS);
        return publicProjectsData ? JSON.parse(publicProjectsData) : [];
      } catch (error) {
        console.error('獲取公共項目列表失敗:', error);
        return [];
      }
    },
    
    /**
     * 更新公共項目列表（模擬從後端同步）
     */
    syncPublicProjects: async (projects) => {
      try {
        if (!Array.isArray(projects)) {
          return { success: false, message: '項目數據格式無效' };
        }
        
        // 確保每個項目有必需的字段
        const validProjects = projects.map(project => ({
          id: project.id || Date.now().toString(),
          name: project.name,
          code: project.code,
          createdAt: project.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublic: true
        }));
        
        // 保存到公共項目表
        await AsyncStorage.setItem(DB_TABLES.PUBLIC_PROJECTS, JSON.stringify(validProjects));
        return { success: true, projects: validProjects };
      } catch (error) {
        console.error('同步公共項目失敗:', error);
        return { success: false, message: '同步公共項目失敗' };
      }
    }
  };
}

export default Database; 