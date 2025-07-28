# 報告系統 - Report System App

[![GitHub Release](https://img.shields.io/github/v/release/bananamax9113/report-system-app?style=flat&color=blue)](https://github.com/bananamax9113/report-system-app/releases)
[![GitHub last commit](https://img.shields.io/github/last-commit/bananamax9113/report-system-app?style=flat&color=success)](https://github.com/bananamax9113/report-system-app/commits)

## 📱 立即下載
[<img src="https://img.shields.io/badge/-%E4%B8%8B%E8%BC%89%20APK%20%E5%AE%89%E8%A3%9D%E5%8C%85-green?style=for-the-badge&logo=android" height="40"/>](https://github.com/bananamax9113/report-system-app/releases/latest/download/report-system-app.apk)

## 📋 項目介紹
專業的報告管理系統，支持PDF生成、圖片管理、數據存儲、報告導出等完整功能。適用於工程項目、質量檢測、現場報告等多種業務場景。

## 🚀 開發技術
- 本項目使用**Expo框架**開發，支持iOS和Android
- 通過局域網IP（192.168.1.12:8080）進行調試
- 使用**React Navigation**進行頁面導航
- 使用**react-native-paper**實現iOS風格界面
- 使用**expo-print**生成PDF報告
- **PWA**支持，可直接在Web中使用

## 🔧 本地開發指南
1. 克隆項目：`git clone https://github.com/bananamax9113/report-system-app.git`
2. 安裝依賴：`npm install`
3. 啟動項目：`npm start` 或 `expo start`

### 局域網調試
- 確保移動設備與電腦在同一網絡下
- 使用Expo Go應用掃描控制台顯示的二維碼
- 或者在Expo Go應用中輸入URL: exp://192.168.1.12:8080

### 界面要求
- 首次登錄需要註冊用戶賬號和密碼，登錄後可以進入主界面，下次登錄時會自動登錄，要支持使用微信賬號登錄，獲取微信的賬號和頭像。
- 主界面使用參考簡約的UI風格，主要引用ios風格的ui
- 報告編制界面使用參考ios風格

### 計劃實現的功能
- ✅ 項目名管理（項目名稱、項目編號）
- ✅ 報告類型管理（報告類型、報告類型編號）
- ✅ 編制報告功能
  - 項目和報告類型選擇
  - 拍照功能和圖片列表
  - 圖片描述輸入
  - 緩存和自動保存
- ✅ PDF 報告生成
  - 公司信息抬頭
  - 多種圖片佈局（2x2、2x3、3x3、自動）
  - 報告內容和圖片整合
  - 簽名支持
- ✅ 報告管理
  - 查看已生成的報告
  - PDF 預覽功能
  - 報告分享和刪除

---

## 📱 APK生成支持

### PWA配置完成
- ✅ 完整的manifest.json配置
- ✅ Service Worker離線支持
- ✅ 自定義logo和主題色
- ✅ 協議處理器和深度鏈接

### 部署方案
- ✅ Netlify拖拽部署包
- ✅ GitHub Pages自動部署
- ✅ PWABuilder APK生成

---

## 🔄 版本更新歷史

### v1.0.0 (2025-07-28) - APK生成完整解決方案

#### 🛠️ 重大修復
- **修復APK安裝錯誤33 "packageinfo is null"**
  - 添加完整的PWA manifest.json配置
  - 修復HTML中PWA manifest鏈接
  - 添加Apple設備支持和PWA meta標籤
  - 優化圖標路徑和配置

#### ✅ PWABuilder警告完全解決
- **Service Worker**: 創建完整的sw.js，支持離線緩存
- **background_color**: 修復格式問題，使用有效十六進制顏色
- **description**: 增強為詳細多行描述（100+字符）
- **handle_links**: 添加auto配置，支持應用鏈接處理
- **protocol_handlers**: 配置自定義協議和深度鏈接

#### 📁 新增文件
- `dist/manifest.json` - PWA應用清單
- `dist/sw.js` - Service Worker離線支持
- `dist/index.html` - 優化的HTML文件
- `netlify-deploy/` - 完整部署包
- `🛠️ 修復APK安裝錯誤33指南.md` - 錯誤排除指南
- `✅ PWA優化完成 - 解決所有警告.md` - 技術優化說明
- `🚀 立即重新生成完美APK.txt` - 快速操作指南
- `📝 項目更新摘要 - 完整的APK生成解決方案.md` - 完整項目文檔

#### 🎯 技術優化
- **Service Worker功能**: 離線緩存、網絡優先策略、自動更新
- **PWA Manifest優化**: 完整配置、協議處理器、應用快捷方式
- **HTML PWA集成**: 自動Service Worker註冊、完整meta標籤

#### 📱 APK生成流程
1. **部署到公網**: Netlify拖拽部署 或 GitHub Pages
2. **PWABuilder生成**: 輸入公網URL，獲得所有綠色勾號
3. **高質量APK**: 無安裝錯誤、支持離線功能、包含自定義logo

#### 🎉 項目成就
- ✅ 100%解決APK安裝錯誤
- ✅ 達到PWA金標準
- ✅ 提供完整部署方案
- ✅ 支持離線使用功能
- ✅ 用戶體驗接近原生應用

---

## 🚀 快速開始

### 立即下載APK
1. **方法1：直接下載**
   - [📥 下載最新APK安裝包](https://github.com/bananamax9113/report-system-app/releases/latest/download/report-system-app.apk)
   - [查看所有版本](https://github.com/bananamax9113/report-system-app/releases)

2. **方法2：自行生成**
   - 查看 `🚀 立即重新生成完美APK.txt` 獲取2分鐘快速步驟
   - 訪問：https://bananamax9113.github.io/report-system-app/
   - 使用PWABuilder生成Android APK

### 故障排除
- APK安裝問題：參考 `🛠️ 修復APK安裝錯誤33指南.md`
- PWA配置問題：查看 `✅ PWA優化完成 - 解決所有警告.md`
- 完整項目文檔：閱讀 `📝 項目更新摘要 - 完整的APK生成解決方案.md`
