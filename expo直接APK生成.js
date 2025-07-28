#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=============================================');
console.log('報告系統 - Expo APK自动构建工具');
console.log('=============================================\n');

// 检查eas.json文件
const easJsonPath = path.join(process.cwd(), 'eas.json');

// 确保eas.json存在并包含正确配置
let easConfig = {
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "local": {
      "android": {
        "buildType": "apk"
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "withoutCredentials": true
      }
    },
    "debug": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug",
        "withoutCredentials": true
      },
      "channel": "debug"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
};

// 写入或更新eas.json配置
console.log('正在更新EAS配置文件...');
fs.writeFileSync(easJsonPath, JSON.stringify(easConfig, null, 2), 'utf8');
console.log('✅ EAS配置文件已更新');

// 安装必要依赖
console.log('\n正在安装必要依赖...');
try {
  execSync('npm install -g eas-cli', { stdio: 'inherit' });
  execSync('npm install expo-dev-client', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️ 安装依赖时发生错误，但将继续执行');
}

// 检查app.json或app.config.js
let appConfig = {};
const appJsonPath = path.join(process.cwd(), 'app.json');
const appConfigPath = path.join(process.cwd(), 'app.config.js');

console.log('\n正在检查应用配置...');
if (fs.existsSync(appJsonPath)) {
  appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
} else if (fs.existsSync(appConfigPath)) {
  console.log('检测到app.config.js，将使用该配置');
} else {
  console.log('⚠️ 未找到app.json或app.config.js，将创建基本配置');
  appConfig = {
    "expo": {
      "name": "報告系統",
      "slug": "report-system-app",
      "version": "1.0.0",
      "orientation": "portrait",
      "icon": "./assets/icon.png",
      "userInterfaceStyle": "light",
      "splash": {
        "image": "./assets/splash.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      },
      "assetBundlePatterns": [
        "**/*"
      ],
      "ios": {
        "supportsTablet": true,
        "bundleIdentifier": "com.yourcompany.reportsystemapp"
      },
      "android": {
        "adaptiveIcon": {
          "foregroundImage": "./assets/adaptive-icon.png",
          "backgroundColor": "#ffffff"
        },
        "package": "com.yourcompany.reportsystemapp"
      },
      "web": {
        "favicon": "./assets/favicon.png"
      }
    }
  };
  fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2), 'utf8');
  console.log('✅ 创建了基本的app.json配置');
}

// 开始构建APK
console.log('\n=============================================');
console.log('开始构建APK');
console.log('=============================================\n');

console.log('尝试构建方式1: 使用Debug配置构建 (无需登录)');
try {
  execSync('npx eas build -p android --profile debug --non-interactive', { stdio: 'inherit' });
  console.log('✅ Debug构建已启动');
} catch (error) {
  console.log('❌ Debug构建失败，尝试其他方式');

  console.log('\n尝试构建方式2: 使用Development配置构建');
  try {
    execSync('npx eas build -p android --profile development --non-interactive', { stdio: 'inherit' });
    console.log('✅ Development构建已启动');
  } catch (error) {
    console.log('❌ Development构建也失败');
    
    console.log('\n尝试构建方式3: 使用Preview配置构建 (需要登录EAS)');
    console.log('请登录您的Expo账户:');
    try {
      execSync('npx eas login', { stdio: 'inherit' });
      execSync('npx eas build -p android --profile preview', { stdio: 'inherit' });
      console.log('✅ Preview构建已启动');
    } catch (error) {
      console.log('\n❌ 所有构建方式均失败');
      console.log('请尝试以下替代方案:');
      console.log('1. 使用 npx expo prebuild 准备Android项目');
      console.log('2. 使用Android Studio打开android目录');
      console.log('3. 使用Android Studio构建APK');
    }
  }
}

console.log('\n构建过程已启动，请按照指示完成剩余步骤');
console.log('构建完成后，APK将可在Expo网站或指定位置下载'); 