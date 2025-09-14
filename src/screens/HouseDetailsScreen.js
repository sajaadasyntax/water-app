import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { housesAPI } from '../services/api';
import { PAYMENT_TYPES, getPaymentTypeName, getPaymentAmount } from '../config/paymentTypes';
import CameraComponentSimple from '../components/CameraComponentSimple';
import { useAuth } from '../context/AuthContext';
import * as FileSystem from 'expo-file-system/legacy';

const HouseDetailsScreen = ({ navigation, route }) => {
  const { house, neighborhood, square } = route.params;
  const { isAdmin } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    houseNumber: house.houseNumber,
    ownerName: house.ownerName,
    ownerPhone: house.ownerPhone,
    isOccupied: house.isOccupied,
    hasPaid: house.hasPaid,
    paymentType: house.paymentType || 'SMALL_METER',
    requiredAmount: house.requiredAmount?.toString() || '',
  });
  const [showCamera, setShowCamera] = useState(false);
  const [receiptImage, setReceiptImage] = useState(house.receiptImage);
  const [savingImage, setSavingImage] = useState(false);
  const [hasPaid, setHasPaid] = useState(house.hasPaid);

  const convertImageToBase64 = async (imageUri) => {
    try {
      // First, get image info to check size
      const imageInfo = await FileSystem.getInfoAsync(imageUri);
      console.log('Image size:', imageInfo.size, 'bytes');
      
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Check if base64 is too large (> 4MB base64 = ~3MB original image)
      const maxBase64Length = 4000000; // ~4MB base64
      if (base64.length > maxBase64Length) {
        console.log('Base64 too large, returning error message');
        throw new Error('Image too large. Please select a smaller image.');
      }
      
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  const handleEditPress = () => {
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.houseNumber.trim() || !formData.ownerName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم المنزل واسم صاحب المنزل');
      return;
    }

    // Check for duplicate house number
    const existingHouse = await housesAPI.getHouses(square.id);
    const duplicateHouse = existingHouse.data.find(h => 
      h.houseNumber === formData.houseNumber && h.id !== house.id
    );

    if (duplicateHouse) {
      Alert.alert('خطأ', 'رقم المنزل موجود بالفعل في هذا المربع');
      return;
    }

    try {
      const houseData = {
        ...formData,
        requiredAmount: formData.requiredAmount ? parseFloat(formData.requiredAmount) : getPaymentAmount(formData.paymentType),
        receiptImage,
      };

      await housesAPI.update(house.id, houseData);
      Alert.alert('نجح', 'تم تحديث بيانات المنزل بنجاح');
      setShowEditModal(false);
      navigation.goBack();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'فشل في حفظ البيانات';
      Alert.alert('خطأ', errorMessage);
    }
  };

  const handleImageTaken = async (imageUri) => {
    setSavingImage(true);
    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(imageUri);
      
      // Update the house with the receipt image and mark as paid
      const response = await housesAPI.updateReceipt(house.id, base64Image, true);
      
      if (response.data) {
        setReceiptImage(base64Image);
        setHasPaid(true);
        // Update the house object in the route params
        house.receiptImage = base64Image;
        house.hasPaid = true;
        house.lastPaymentDate = new Date().toISOString();
        Alert.alert('نجح', 'تم حفظ صورة الإيصال وتم تحديث حالة الدفع');
      }
    } catch (error) {
      console.error('Error saving receipt image:', error);
      if (error.message && error.message.includes('too large')) {
        Alert.alert('خطأ', 'الصورة كبيرة جداً. يرجى اختيار صورة أصغر حجماً.');
      } else {
        Alert.alert('خطأ', 'فشل في حفظ صورة الإيصال');
      }
    } finally {
      setSavingImage(false);
    }
  };

  const removeReceiptImage = async () => {
    setSavingImage(true);
    try {
      // Update the house to remove the receipt image and reset payment status
      const response = await housesAPI.updateReceipt(house.id, null, false);
      
      if (response.data) {
        setReceiptImage(null);
        setHasPaid(false);
        // Update the house object in the route params
        house.receiptImage = null;
        house.hasPaid = false;
        house.lastPaymentDate = null;
        Alert.alert('نجح', 'تم حذف صورة الإيصال وإعادة تعيين حالة الدفع');
      }
    } catch (error) {
      console.error('Error removing receipt image:', error);
      Alert.alert('خطأ', 'فشل في حذف صورة الإيصال');
    } finally {
      setSavingImage(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← العودة</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المنزل</Text>
        {isAdmin() && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditPress}
          >
            <Text style={styles.editButtonText}>تعديل</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>معلومات المنزل</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{house.houseNumber}</Text>
            <Text style={styles.detailLabel}>رقم المنزل:</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{house.ownerName}</Text>
            <Text style={styles.detailLabel}>اسم صاحب المنزل:</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{house.ownerPhone}</Text>
            <Text style={styles.detailLabel}>هاتف صاحب المنزل:</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{neighborhood.name}</Text>
            <Text style={styles.detailLabel}>اسم الحي:</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{square.name}</Text>
            <Text style={styles.detailLabel}>رقم المربع:</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[
              styles.detailValue,
              { color: house.isOccupied ? '#2e7d32' : '#d32f2f' }
            ]}>
              {house.isOccupied ? 'نعم' : 'لا'}
            </Text>
            <Text style={styles.detailLabel}>المنزل مسكون:</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {getPaymentTypeName(house.paymentType)}
            </Text>
            <Text style={styles.detailLabel}>نوع العداد:</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[
              styles.detailValue,
              { color: hasPaid ? '#2e7d32' : '#d32f2f' }
            ]}>
              {hasPaid ? 'سدد' : 'لم يسدد'}
            </Text>
            <Text style={styles.detailLabel}>حالة الدفع:</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {house.requiredAmount || getPaymentAmount(house.paymentType)} جنيه سوداني
            </Text>
            <Text style={styles.detailLabel}>المبلغ المطلوب:</Text>
          </View>

          {receiptImage && (
            <View style={styles.receiptContainer}>
              <Text style={styles.receiptLabel}>صورة الإيصال:</Text>
              <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
              {isAdmin() && (
                <TouchableOpacity
                  style={[styles.removeReceiptButton, savingImage && styles.disabledButton]}
                  onPress={savingImage ? null : removeReceiptImage}
                  disabled={savingImage}
                >
                  <Text style={styles.removeReceiptText}>
                    {savingImage ? 'جاري الحذف...' : 'حذف الصورة'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!receiptImage && (
            <View style={styles.receiptContainer}>
              <Text style={styles.receiptLabel}>صورة الإيصال:</Text>
              <TouchableOpacity
                style={[styles.addReceiptButton, savingImage && styles.disabledButton]}
                onPress={savingImage ? null : () => setShowCamera(true)}
                disabled={savingImage}
              >
                <Text style={styles.addReceiptText}>
                  {savingImage ? 'جاري الحفظ...' : '📷 إضافة صورة الإيصال'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal - Only for Admins */}
      {isAdmin() && (
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تعديل المنزل</Text>
            
            <TextInput
              style={styles.modalInput}
              value={formData.houseNumber}
              onChangeText={(text) => setFormData({ ...formData, houseNumber: text })}
              placeholder="رقم المنزل"
              textAlign="right"
            />
            
            <TextInput
              style={styles.modalInput}
              value={formData.ownerName}
              onChangeText={(text) => setFormData({ ...formData, ownerName: text })}
              placeholder="اسم صاحب المنزل"
              textAlign="right"
            />
            
            <TextInput
              style={styles.modalInput}
              value={formData.ownerPhone}
              onChangeText={(text) => setFormData({ ...formData, ownerPhone: text })}
              placeholder="هاتف صاحب المنزل"
              textAlign="right"
              keyboardType="phone-pad"
            />
            
            <Text style={styles.modalLabel}>نوع العداد:</Text>
            <View style={styles.paymentTypeContainer}>
              {Object.values(PAYMENT_TYPES).map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.paymentTypeButton,
                    { backgroundColor: formData.paymentType === type.id ? type.color : '#f5f5f5' }
                  ]}
                  onPress={() => setFormData({ ...formData, paymentType: type.id, requiredAmount: type.amount.toString() })}
                >
                  <Text style={[
                    styles.paymentTypeText,
                    { color: formData.paymentType === type.id ? 'white' : '#333' }
                  ]}>
                    {type.name} - {type.amount} جنيه
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              value={formData.requiredAmount}
              onChangeText={(text) => setFormData({ ...formData, requiredAmount: text })}
              placeholder="المبلغ المطلوب (جنيه سوداني)"
              textAlign="right"
              keyboardType="numeric"
            />

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setFormData({ ...formData, isOccupied: !formData.isOccupied })}
              >
                <Text style={styles.checkboxText}>
                  {formData.isOccupied ? '☑' : '☐'} المنزل مسكون
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setFormData({ ...formData, hasPaid: !formData.hasPaid })}
              >
                <Text style={styles.checkboxText}>
                  {formData.hasPaid ? '☑' : '☐'} صاحب المنزل سدد
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}

      {/* Camera Component */}
      <CameraComponentSimple
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onImageTaken={handleImageTaken}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 20,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'left',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 20,
    color: '#333',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
    textAlign: 'right',
  },
  paymentTypeContainer: {
    marginBottom: 15,
  },
  paymentTypeButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  paymentTypeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    textAlign: 'right',
  },
  receiptContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  receiptLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
    textAlign: 'right',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  addReceiptButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addReceiptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  removeReceiptButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeReceiptText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxText: {
    fontSize: 16,
    marginRight: 10,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default HouseDetailsScreen;
