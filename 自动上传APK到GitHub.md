# 自动上传APK到GitHub指南

有两种方式可以将APK文件提供在GitHub仓库中供用户下载：

## 方法一：直接存放在仓库中（推荐）

这种方法最简单，APK文件直接存储在仓库中，用户可以直接下载。

### 步骤：

1. **运行准备脚本获取临时APK**
   ```
   ./generateDemoApk.bat
   ```
   这将下载一个示例APK作为占位符放到`apk/`目录

2. **添加APK到仓库**
   ```
   git add apk/report-system-app.apk
   git commit -m "添加APK文件供直接下载"
   git push
   ```

3. **替换为真实APK**（当您使用PWABuilder生成自己的APK后）
   - 将生成的真实APK文件重命名为`report-system-app.apk`
   - 覆盖`apk/`目录中的文件
   - 再次提交和推送

4. **完成后**
   现在用户可以通过以下链接直接下载APK：
   - https://github.com/bananamax9113/report-system-app/raw/main/apk/report-system-app.apk
   - 或者通过README中的下载按钮

## 方法二：使用GitHub Releases

这种方法更正式，适合版本发布管理。

### 步骤：

1. **生成自己的APK**
   - 访问PWA部署地址（GitHub Pages或Netlify）
   - 使用PWABuilder生成APK

2. **创建Release**
   - 访问：https://github.com/bananamax9113/report-system-app/releases/new
   - 设置标签：`v1.0.0`
   - 设置标题：`报告系统 v1.0.0`
   - 添加发布说明

3. **上传APK文件**
   - 拖放您生成的APK文件到Release页面
   - 确保文件命名为`report-system-app.apk`

4. **发布Release**
   - 点击"Publish release"按钮

5. **完成后**
   用户可以通过以下链接下载：
   - https://github.com/bananamax9113/report-system-app/releases/latest/download/report-system-app.apk
   - 或通过Releases页面

## 建议做法

最好的方案是**两种方法都使用**：
1. 先用方法一提供一个立即可用的APK下载
2. 再用方法二创建正式的发布版本

这样既能满足用户的即时下载需求，又能保持良好的版本管理。 