import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const CameraComponentSimple = ({ visible, onClose, onImageTaken }) => {
  const [capturedImage, setCapturedImage] = useState(null);

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'يجب السماح بالوصول للمعرض لاختيار صورة');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7, // Good quality with reasonable file size
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };

  const takePictureWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'يجب السماح بالوصول للكاميرا لالتقاط صورة');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7, // Good quality with reasonable file size
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('خطأ', 'فشل في التقاط الصورة');
    }
  };

  const confirmImage = () => {
    if (capturedImage) {
      onImageTaken(capturedImage);
      setCapturedImage(null);
      onClose();
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    setCapturedImage(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        {capturedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.previewTitle}>معاينة صورة الإيصال</Text>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                <Text style={styles.buttonText}>إعادة التقاط</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmImage}>
                <Text style={styles.buttonText}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            <Text style={styles.title}>إضافة صورة الإيصال</Text>
            <Text style={styles.subtitle}>اختر طريقة إضافة الصورة</Text>
            
            <TouchableOpacity style={styles.optionButton} onPress={takePictureWithCamera}>
              <Text style={styles.optionButtonText}>📷 التقاط صورة</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
              <Text style={styles.optionButtonText}>📁 اختيار من المعرض</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    minWidth: 200,
  },
  optionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    minWidth: 200,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  imagePreviewContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    maxWidth: '90%',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  previewImage: {
    width: 250,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  retakeButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CameraComponentSimple;
