# 在GitHub仓库中发布APK供下载的步骤

## 1. 生成APK文件

首先，使用我们已优化的PWA配置，通过PWABuilder生成APK：

1. 访问 https://bananamax9113.github.io/report-system-app/ 或Netlify部署链接
2. 确保所有PWA优化已完成（无警告）
3. 访问 https://www.pwabuilder.com/
4. 输入您的部署网址，完成分析
5. 点击"Build"按钮，选择Android平台
6. 生成并下载APK文件

## 2. 在GitHub上创建Release版本

1. 访问您的GitHub仓库: https://github.com/bananamax9113/report-system-app
2. 点击右侧"Releases"（如果没有，可点击"Create a new release"）
3. 点击"Draft a new release"（起草新版本）
4. 填写版本信息:
   - Tag version: `v1.0.0`（与README.MD中的版本一致）
   - Release title: `报告系统 v1.0.0 - APK发布版本`
   - 在描述中添加此次发布的内容（可直接复制README.MD中的版本更新内容）

## 3. 上传APK文件

1. 在Release页面下方的"Attach binaries by dropping them here or selecting them."区域
2. 点击选择文件或直接拖拽APK文件（PWABuilder生成的APK）
3. 等待上传完成
4. 如果有需要，还可以上传其他文件（如使用说明文档）

## 4. 发布Release

1. 检查所有信息和附件无误
2. 点击"Publish release"按钮发布

## 5. 设置直接下载链接

发布后，您可以:

1. 获取APK的直接下载链接
2. 更新README.MD，添加直接下载链接:

```markdown
## 📱 立即下载

- [📥 下载最新APK安装包](https://github.com/bananamax9113/report-system-app/releases/download/v1.0.0/report-system-app-v1.0.0.apk)
- [查看所有版本](https://github.com/bananamax9113/report-system-app/releases)
```

## 可选：直接在仓库中添加APK文件

如果您希望直接在仓库中保存APK文件（不使用Releases）:

1. 在仓库根目录创建`apk`文件夹
2. 上传APK文件到该文件夹
3. 在README.MD中添加链接:

```markdown
## 📱 立即下载

- [📥 下载最新APK安装包](/apk/report-system-app-v1.0.0.apk)
```

注意：直接存储大型二进制文件（如APK）在Git仓库中不是最佳实践，建议使用Releases功能。

## 提醒用户下载APK

在首页README.MD中突出显示下载链接，确保用户能立即看到并下载APK。 