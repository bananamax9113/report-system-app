#!/usr/bin/env python3
"""
创建一个演示APK文件
这个脚本会创建一个简单的APK文件，用于测试下载功能
实际上，这只是将一个ZIP文件重命名为APK
"""

import os
import zipfile
import shutil

# 创建临时目录
temp_dir = "temp_demo_apk"
os.makedirs(temp_dir, exist_ok=True)

# 创建一个简单的HTML文件，作为APK的"内容"
with open(os.path.join(temp_dir, "index.html"), "w") as f:
    f.write("""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>报告系统 APK 演示</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f0f0f0;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #4285f4;
            }
            .logo {
                text-align: center;
                margin-bottom: 20px;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>报告系统</h1>
            </div>
            <h2>演示APK包</h2>
            <p>这是一个演示APK文件，用于测试GitHub仓库中的下载功能。</p>
            <p>实际的APK文件将由PWABuilder生成，并替换此演示文件。</p>
            <h3>如何获取真实APK:</h3>
            <ol>
                <li>访问: https://bananamax9113.github.io/report-system-app/</li>
                <li>使用PWABuilder生成Android APK</li>
                <li>替换GitHub仓库中的演示APK文件</li>
            </ol>
            <div class="footer">
                &copy; 2023 报告系统 - 版本 1.0.0
            </div>
        </div>
    </body>
    </html>
    """)

# 创建一个简单的清单文件
with open(os.path.join(temp_dir, "manifest.json"), "w") as f:
    f.write("""
    {
      "name": "报告系统",
      "short_name": "报告系统",
      "description": "专业的报告管理系统，支持PDF生成、图片管理、数据存储、报告导出等功能",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#4285f4",
      "icons": [
        {
          "src": "icon.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    }
    """)

# 创建一个简单的META-INF目录和签名文件
os.makedirs(os.path.join(temp_dir, "META-INF"), exist_ok=True)
with open(os.path.join(temp_dir, "META-INF", "MANIFEST.MF"), "w") as f:
    f.write("""Manifest-Version: 1.0
Created-By: 1.0 (报告系统)
""")

# 创建一个简单的空白PNG作为图标
with open(os.path.join(temp_dir, "icon.png"), "wb") as f:
    # 最小的有效PNG文件
    f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x00\x00\x02\x00\x01\xcf\xc8\x14\xaf\x00\x00\x00\x00IEND\xaeB`\x82')

# 创建ZIP文件
zip_file = "apk/report-system-app.apk"
with zipfile.ZipFile(zip_file, "w") as zf:
    for root, _, files in os.walk(temp_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, temp_dir)
            zf.write(file_path, arcname)

# 删除临时目录
shutil.rmtree(temp_dir)

print(f"演示APK文件已创建: {zip_file}")
print("注意：这不是真正的APK文件，仅用于演示下载功能。") 