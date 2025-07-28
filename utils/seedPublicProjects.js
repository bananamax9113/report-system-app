import Database from './database';

/**
 * 模擬後端獲取的公共項目數據
 * 這個函數用於開發和演示，實際應用中應由後端服務提供數據
 */
export const seedPublicProjects = async () => {
  try {
    // 模擬公共項目數據
    const publicProjects = [
      {
        id: 'public-001',
        name: '智慧城市監測系統',
        code: '2301',
        createdAt: '2023-01-15T08:30:00.000Z',
        isPublic: true
      },
      {
        id: 'public-002',
        name: '環境保護監測網',
        code: '2302',
        createdAt: '2023-02-20T10:15:00.000Z',
        isPublic: true
      },
      {
        id: 'public-003',
        name: '交通安全監測平台',
        code: '2303',
        createdAt: '2023-03-10T14:45:00.000Z',
        isPublic: true
      },
      {
        id: 'public-004',
        name: '建築工程質量監測',
        code: '2304',
        createdAt: '2023-04-05T09:20:00.000Z',
        isPublic: true
      },
      {
        id: 'public-005',
        name: '水利工程監測系統',
        code: '2401',
        createdAt: '2024-01-18T13:10:00.000Z',
        isPublic: true
      },
      {
        id: 'public-006',
        name: '能源監測管理平台',
        code: '2402',
        createdAt: '2024-02-22T11:30:00.000Z',
        isPublic: true
      }
    ];

    // 將模擬數據保存到數據庫
    await Database.Projects.syncPublicProjects(publicProjects);
    console.log('公共項目數據初始化成功');
    return { success: true };
  } catch (error) {
    console.error('初始化公共項目失敗:', error);
    return { success: false, error };
  }
};

export default seedPublicProjects; 