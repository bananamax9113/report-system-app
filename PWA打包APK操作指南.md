# 报告系统APK打包指南

## 方法一：使用PWABuilder（推荐 - 最简单）

### 步骤1: 访问应用的PWA版本
1. 打开浏览器访问您的GitHub Pages部署地址：
   ```
   https://bananamax9113.github.io/report-system-app/
   ```

2. 确保PWA已正确配置（已经配置好的）
   - manifest.json 包含所有必要信息
   - Service Worker已注册
   - 图标已准备好

### 步骤2: 使用PWABuilder生成APK
1. 访问PWABuilder网站：
   ```
   https://www.pwabuilder.com/
   ```

2. 在网站首页输入框中粘贴您的PWA URL：
   ```
   https://bananamax9113.github.io/report-system-app/
   ```

3. 点击"Start"或"开始"按钮

4. 等待分析完成，确保所有绿色勾选标记显示（表示PWA配置正确）

5. 点击"Build"或"构建"按钮

6. 选择"Android"平台

7. 点击"Options"可自定义设置（可选）：
   - 签名设置
   - 应用名称
   - 包名
   - 版本号等

8. 点击"Build"按钮开始生成APK

9. 等待构建完成，下载生成的APK文件（通常命名为"[your-app-name].apk"）

### 步骤3: 测试和部署
1. 将下载的APK传输到Android设备
2. 安装并测试应用
3. 重命名为"report-system-app.apk"并上传到GitHub仓库，替换演示APK

## 方法二：使用Bubblewrap CLI（高级用户）

如果您希望有更多自定义选项，可以使用Google的Bubblewrap CLI工具：

```bash
# 安装Bubblewrap
npm i -g @bubblewrap/cli

# 初始化项目
bubblewrap init --manifest="https://bananamax9113.github.io/report-system-app/manifest.json"

# 构建APK
bubblewrap build
```

## 方法三：使用Android Studio（复杂但完全可控）

1. 克隆PWA项目
2. 创建新的Android项目
3. 使用WebView加载PWA
4. 配置离线支持
5. 打包生成APK

## 我应该选择哪种方法？

对于大多数用户，**方法一**是最简单的选择：
- ✅ 无需编程技能
- ✅ 几分钟内完成
- ✅ 支持所有PWA功能
- ✅ 生成真正可安装的APK

## 常见问题解答

**Q: 生成的APK可以在所有Android设备上运行吗？**  
A: 是的，PWABuilder生成的APK兼容Android 6.0+设备。

**Q: APK大小有多大？**  
A: 通常在5-10MB之间，取决于您的PWA资源大小。

**Q: 需要签名密钥吗？**  
A: PWABuilder会生成调试签名的APK，可以直接安装；若要发布到应用商店，需要自己的签名密钥。

**Q: 会保留离线功能吗？**  
A: 是的，如果您的PWA配置了Service Worker和正确的缓存策略。 