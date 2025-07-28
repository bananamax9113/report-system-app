const config = {
  name: "報告系統",
  slug: "report-system-app",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.reportsystemapp",
    runtimeVersion: {
      policy: "appVersion"
    }
  },
  android: {
    package: "com.yourcompany.reportsystemapp",
    runtimeVersion: "1.0.0"
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-camera",
      {
        "cameraPermission": "允許應用程式使用相機拍攝報告照片"
      }
    ],
    [
      "expo-media-library",
      {
        "photosPermission": "允許應用程式訪問您的照片，以便選擇報告圖片",
        "savePhotosPermission": "允許應用程式保存照片到您的相冊",
        "isAccessMediaLocationEnabled": true
      }
    ]
  ],
  // 自定義配置
  extra: {
    // 在這裡添加自定義配置
    eas: {
      projectId: "bc7148f0-cc64-4619-9486-06354510d342"
    }
  },
  owner: "bananamax",
  web: {
    bundler: "metro"
  },
  updates: {
    url: "https://u.expo.dev/bc7148f0-cc64-4619-9486-06354510d342"
  }
};

export default config; 