import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

import axios from 'axios';
import DocumentPicker from 'react-native-document-picker';
import { PERMISSIONS, request } from 'react-native-permissions';
import Config from 'react-native-config'; // For environment variables

// Move sensitive data to .env file
const BOT_TOKEN = Config.TELEGRAM_BOT_TOKEN;
const CHAT_ID = Config.TELEGRAM_CHAT_ID;

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported file types
const SUPPORTED_TYPES = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

const FileMitraBot = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Check if file type is supported
  const isFileTypeSupported = (fileType) => {
    return Object.keys(SUPPORTED_TYPES).includes(fileType);
  };

  // Request storage permissions
  const requestStoragePermission = async () => {
    try {
      const result = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MEDIA_LIBRARY
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
      );
      return result === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  // Upload file to Telegram
  const uploadFileToTelegram = async (file) => {
    if (!file){ return;}

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      Alert.alert('Error', 'File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!isFileTypeSupported(file.type)) {
      Alert.alert('Error', 'Unsupported file type');
      return;
    }

    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    });

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      if (response.data.ok) {
        Alert.alert('Success', 'File uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.description || 'Failed to upload file'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file picking
  const pickFile = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Storage access is needed to pick files');
        return;
      }

      const file = await DocumentPicker.pick({
        type: Object.keys(SUPPORTED_TYPES),
      });
      setSelectedFile(file[0]);
      uploadFileToTelegram(file[0]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Picker Error:', err);
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>
            FileMitra Bot
          </Text>
          <Text style={[styles.description, isDarkMode && styles.darkText]}>
            Upload files securely to your Telegram storage.
          </Text>

          <View style={styles.supportedFiles}>
            <Text style={[styles.subtitle, isDarkMode && styles.darkText]}>
              Supported File Types:
            </Text>
            {Object.values(SUPPORTED_TYPES).map((type) => (
              <Text key={type} style={[styles.fileType, isDarkMode && styles.darkText]}>
                • {type}
              </Text>
            ))}
          </View>

          <Button
            title={isUploading ? 'Uploading...' : 'Pick a File'}
            onPress={pickFile}
            disabled={isUploading}
          />

          {isUploading && (
            <View style={styles.uploadProgress}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={[styles.progressText, isDarkMode && styles.darkText]}>
                Uploading: {uploadProgress}%
              </Text>
            </View>
          )}

          {selectedFile && !isUploading && (
            <View style={styles.fileInfo}>
              <Text style={[styles.fileInfoText, isDarkMode && styles.darkText]}>
                Selected File:
              </Text>
              <Text style={[styles.fileInfoText, isDarkMode && styles.darkText]}>
                Name: {selectedFile.name}
              </Text>
              <Text style={[styles.fileInfoText, isDarkMode && styles.darkText]}>
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
              <Text style={[styles.fileInfoText, isDarkMode && styles.darkText]}>
                Type: {SUPPORTED_TYPES[selectedFile.type] || 'Unknown'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  darkText: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666666',
  },
  supportedFiles: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000000',
  },
  fileType: {
    fontSize: 14,
    marginLeft: 10,
    color: '#666666',
  },
  uploadProgress: {
    marginTop: 20,
    alignItems: 'center',
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000000',
  },
  fileInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  fileInfoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#000000',
  },
});

export default FileMitraBot;
