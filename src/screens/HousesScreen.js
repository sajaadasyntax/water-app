import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { squaresAPI, housesAPI } from '../services/api';
import { PAYMENT_TYPES, getPaymentTypeName, getPaymentAmount } from '../config/paymentTypes';

const HousesScreen = ({ navigation, route }) => {
  const { square, neighborhood } = route.params;
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    houseNumber: '',
    ownerName: '',
    ownerPhone: '',
    isOccupied: true,
    hasPaid: false,
    paymentType: 'SMALL_METER',
    requiredAmount: '',
  });

  const loadHouses = async () => {
    try {
      const response = await squaresAPI.getHouses(square.id);
      setHouses(response.data);
      setFilteredHouses(response.data);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل المنازل');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredHouses(houses);
    } else {
      const filtered = houses.filter(house =>
        house.houseNumber.toLowerCase().includes(query.toLowerCase()) ||
        house.ownerName.toLowerCase().includes(query.toLowerCase()) ||
        house.ownerPhone.includes(query) ||
        (house.hasPaid ? 'سدد' : 'لم يسدد').includes(query)
      );
      setFilteredHouses(filtered);
    }
  };

  useEffect(() => {
    loadHouses();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from HouseDetailsScreen)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHouses();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHouses();
  };

  const resetForm = () => {
    setFormData({
      houseNumber: '',
      ownerName: '',
      ownerPhone: '',
      isOccupied: true,
      hasPaid: false,
      paymentType: 'SMALL_METER',
      requiredAmount: '',
    });
    setEditingHouse(null);
  };

  const handleAddPress = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditPress = (house) => {
    setFormData({
      houseNumber: house.houseNumber,
      ownerName: house.ownerName,
      ownerPhone: house.ownerPhone,
      isOccupied: house.isOccupied,
      hasPaid: house.hasPaid,
      paymentType: house.paymentType || 'SMALL_METER',
      requiredAmount: house.requiredAmount?.toString() || '',
    });
    setEditingHouse(house);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.houseNumber.trim() || !formData.ownerName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم المنزل واسم صاحب المنزل');
      return;
    }

    // Check for duplicate house number
    const existingHouse = houses.find(house => 
      house.houseNumber === formData.houseNumber && 
      house.id !== editingHouse?.id
    );

    if (existingHouse) {
      Alert.alert('خطأ', 'رقم المنزل موجود بالفعل في هذا المربع');
      return;
    }

    try {
      const houseData = {
        ...formData,
        requiredAmount: formData.requiredAmount ? parseFloat(formData.requiredAmount) : getPaymentAmount(formData.paymentType),
        squareId: square.id,
      };

      if (editingHouse) {
        await housesAPI.update(editingHouse.id, houseData);
        Alert.alert('نجح', 'تم تحديث بيانات المنزل بنجاح');
      } else {
        await housesAPI.create(houseData);
        Alert.alert('نجح', 'تم إضافة المنزل بنجاح');
      }

      setShowAddModal(false);
      resetForm();
      loadHouses();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'فشل في حفظ البيانات';
      Alert.alert('خطأ', errorMessage);
    }
  };

  const handleDelete = (house) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا المنزل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await housesAPI.delete(house.id);
              Alert.alert('نجح', 'تم حذف المنزل بنجاح');
              loadHouses();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المنزل');
            }
          },
        },
      ]
    );
  };

  const renderHouse = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.houseItem,
        { backgroundColor: item.hasPaid ? '#e8f5e8' : '#ffebee' }
      ]}
      onPress={() => navigation.navigate('HouseDetails', { house: item, neighborhood, square })}
    >
      <View style={styles.houseRow}>
        <View style={styles.houseInfo}>
          <Text style={[styles.houseNumber, { color: item.hasPaid ? '#2e7d32' : '#d32f2f' }]}>
            {item.houseNumber}
          </Text>
          <Text style={[styles.ownerName, { color: item.hasPaid ? '#2e7d32' : '#d32f2f' }]}>
            {item.ownerName}
          </Text>
        </View>
        <View style={styles.paymentStatus}>
          <Text style={[styles.paymentText, { color: item.hasPaid ? '#2e7d32' : '#d32f2f' }]}>
            {item.hasPaid ? 'سدد' : 'لم يسدد'}
          </Text>
          <Text style={[styles.amountText, { color: item.hasPaid ? '#2e7d32' : '#d32f2f' }]}>
            {getPaymentTypeName(item.paymentType)} - {item.requiredAmount || getPaymentAmount(item.paymentType)} جنيه سوداني
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← العودة</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المنازل - {square.name}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPress}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#2e7d32' }]}>{houses.filter(h => h.hasPaid).length}</Text>
            <Text style={styles.summaryLabel}>سدد</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#d32f2f' }]}>
              {houses.filter(h => !h.hasPaid).length}
            </Text>
            <Text style={styles.summaryLabel}>لم يسدد</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{houses.length}</Text>
            <Text style={styles.summaryLabel}>المجموع</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="البحث في المنازل..."
            textAlign="right"
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {searchQuery.length > 0 && (
          <Text style={styles.searchResultsText}>
            {filteredHouses.length} من {houses.length} منزل
          </Text>
        )}
      </View>
      
      <FlatList
        data={filteredHouses}
        keyExtractor={(item) => item.id}
        renderItem={renderHouse}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد منازل متاحة'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingHouse ? 'تعديل المنزل' : 'إضافة منزل جديد'}
            </Text>
            
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
              placeholder="المبلغ المطلوب (اختياري)"
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
                onPress={() => setShowAddModal(false)}
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
    marginRight: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'right',
  },
  clearButton: {
    marginLeft: 10,
    padding: 5,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResultsText: {
    textAlign: 'right',
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 10,
  },
  houseItem: {
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  houseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  houseInfo: {
    flex: 1,
  },
  houseNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentStatus: {
    alignItems: 'flex-end',
  },
  paymentText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
    textAlign: 'center',
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
    textAlign: 'center',
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
    marginLeft: 10,
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
    marginRight: 10,
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
});

export default HousesScreen;
