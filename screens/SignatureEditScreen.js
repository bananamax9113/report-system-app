import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { Appbar, Text, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import SignatureCanvas from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';

export default function SignatureEditScreen({ navigation }) {
  const [signature, setSignature] = useState(null);
  const signatureRef = useRef();
  
  // 加載簽名
  useEffect(() => {
    loadSignature();
  }, []);
  
  const loadSignature = async () => {
    try {
      const signatureUri = await AsyncStorage.getItem('signature');
      if (signatureUri) {
        setSignature(signatureUri);
      }
    } catch (error) {
      console.log('獲取簽名失敗', error);
    }
  };
  
  // 保存簽名
  const saveSignature = async (uri) => {
    try {
      await AsyncStorage.setItem('signature', uri);
      setSignature(uri);
      Alert.alert('成功', '簽名已保存');
      navigation.goBack();
    } catch (error) {
      console.log('保存簽名失敗', error);
      Alert.alert('錯誤', '保存簽名失敗');
    }
  };
  
  // 處理簽名完成
  const handleSignature = (signature) => {
    const path = FileSystem.documentDirectory + 'signature.png';
    
    // 將base64圖像保存為文件
    FileSystem.writeAsStringAsync(
      path, 
      signature.replace('data:image/png;base64,', ''), 
      { encoding: FileSystem.EncodingType.Base64 }
    )
    .then(() => {
      console.log('簽名已保存到:', path);
      saveSignature(path);
    })
    .catch(err => {
      console.log('保存簽名失敗:', err);
      Alert.alert('錯誤', '保存簽名失敗，請重試');
    });
  };
  
  // 清除簽名
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="簽名" />
        <Appbar.Action icon="delete" onPress={clearSignature} />
      </Appbar.Header>
      
      <View style={styles.content}>
        {signature && (
          <View style={styles.currentSignatureContainer}>
            <Text style={styles.sectionTitle}>當前簽名</Text>
            <Image 
              source={{ uri: signature }} 
              style={styles.currentSignature}
              resizeMode="contain"
            />
          </View>
        )}
        
        <Text style={styles.sectionTitle}>請在下方簽名</Text>
        
        <View style={styles.signatureCanvasContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            descriptionText="簽名"
            clearText="清除"
            confirmText="保存"
            webStyle={`
              body, html {
                width: 100%; height: 100%;
              }
              .m-signature-pad {
                width: 100%; height: 100%;
                margin: 0;
                border: none;
                box-shadow: none;
              }
              .m-signature-pad--body {
                border: none;
              }
              .m-signature-pad--footer {
                display: none;
              }
            `}
            autoClear={false}
            imageType="image/png"
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={clearSignature}
            style={styles.button}
          >
            清除
          </Button>
          <Button 
            mode="contained" 
            onPress={() => {
              if (signatureRef.current) {
                signatureRef.current.readSignature();
              }
            }}
            style={styles.button}
          >
            保存
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  currentSignatureContainer: {
    marginBottom: 20,
  },
  currentSignature: {
    width: '100%',
    height: 100,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  signatureCanvasContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    overflow: 'hidden',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
}); 