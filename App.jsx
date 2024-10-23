import React, {useState} from 'react';
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
} from 'react-native';

import axios from 'axios'; // Add axios for HTTP requests
import DocumentPicker from 'react-native-document-picker'; // You can install this package for file picking
import FileMitraBot from './FileMitraBot';

const BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11'; // Your bot token
const CHAT_ID = '@your_channel_name'; // Your chat or channel ID

// File upload function
const uploadFileToTelegram = async (file) => {
  const formData = new FormData();
  formData.append('chat_id', CHAT_ID);
  formData.append('document', {
    uri: file.uri, // File URI
    type: file.type, // File type, e.g., 'image/jpeg'
    name: file.name, // File name, e.g., 'photo.jpg'
  });

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    if (response.data.ok) {
      Alert.alert('Success', 'File uploaded to Telegram');
    } else {
      Alert.alert('Error', 'Failed to upload file');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Something went wrong');
  }
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <FileMitraBot/>
  );
}

export default App;
