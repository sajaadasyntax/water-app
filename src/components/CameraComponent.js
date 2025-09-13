import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const CameraComponent = ({ visible, onClose, onImageTaken }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState('back');
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);

  // Get camera type constants safely
  const getCameraType = (type) => {
    try {
      if (Camera && Camera.Constants && Camera.Constants.Type) {
        return type === 'back' ? Camera.Constants.Type.back : Camera.Constants.Type.front;
      }
      return type; // Fallback to string
    } catch (error) {
      console.error('Camera constants error:', error);
      return type; // Fallback to string
    }
  };

  // Check if Camera is available
  const isCameraAvailable = () => {
    try {
      return Camera && typeof Camera === 'function';
    } catch (error) {
      console.error('Camera availability check error:', error);
      return false;
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('خطأ', 'يجب السماح بالوصول للكاميرا لالتقاط صورة الإيصال');
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('خطأ', 'فشل في طلب إذن الكاميرا');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert('خطأ', 'فشل في التقاط الصورة');
      }
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'يجب السماح بالوصول للمعرض لاختيار صورة');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
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

  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
  }, [visible]);

  // Handle camera errors
  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    Alert.alert('خطأ في الكاميرا', 'حدث خطأ في تشغيل الكاميرا. يرجى المحاولة مرة أخرى.');
  };

  if (!visible) return null;

  // Check if Camera is available
  if (!isCameraAvailable()) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          <Text style={styles.message}>الكاميرا غير متاحة</Text>
          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (hasPermission === null) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          <Text style={styles.message}>طلب إذن الكاميرا...</Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.message}>يجب السماح بالوصول للكاميرا</Text>
            <TouchableOpacity style={styles.button} onPress={handleClose}>
              <Text style={styles.buttonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

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
          <View style={styles.cameraContainer}>
            <Camera
              style={styles.camera}
              type={getCameraType(cameraType)}
              ref={cameraRef}
              onCameraReady={() => console.log('Camera ready')}
              onMountError={handleCameraError}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.topBar}>
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.cameraTitle}>التقاط صورة الإيصال</Text>
                  <TouchableOpacity
                    style={styles.flipButton}
                    onPress={() => {
                      try {
                        setCameraType(cameraType === 'back' ? 'front' : 'back');
                      } catch (error) {
                        console.error('Camera switch error:', error);
                      }
                    }}
                  >
                    <Text style={styles.flipButtonText}>🔄</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.bottomBar}>
                  <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
                    <Text style={styles.galleryButtonText}>📁 المعرض</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                  
                  <View style={styles.placeholder} />
                </View>
              </View>
            </Camera>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    color: 'white',
    fontSize: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  galleryButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  galleryButtonText: {
    color: 'white',
    fontSize: 14,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
  },
  placeholder: {
    width: 60,
  },
  imagePreviewContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  retakeButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});

export default CameraComponent;
