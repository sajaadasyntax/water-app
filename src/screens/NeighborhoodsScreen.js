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
} from 'react-native';
import { neighborhoodsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NeighborhoodsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNeighborhoods = async () => {
    try {
      const response = await neighborhoodsAPI.getAll();
      setNeighborhoods(response.data);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل الأحياء');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNeighborhoods();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNeighborhoods();
  };

  const handleNeighborhoodPress = (neighborhood) => {
    navigation.navigate('Squares', { neighborhood });
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const renderNeighborhood = ({ item }) => (
    <TouchableOpacity
      style={styles.neighborhoodItem}
      onPress={() => handleNeighborhoodPress(item)}
    >
      <View style={styles.neighborhoodContent}>
        <Text style={styles.neighborhoodName}>{item.name}</Text>
        <Text style={styles.neighborhoodArrow}>←</Text>
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
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الأحياء</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <FlatList
        data={neighborhoods}
        keyExtractor={(item) => item.id}
        renderItem={renderNeighborhood}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد أحياء متاحة</Text>
          </View>
        }
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
    justifyContent: 'space-between',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 80, // Same width as logout button to center the title
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
  neighborhoodItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  neighborhoodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  neighborhoodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  neighborhoodArrow: {
    fontSize: 20,
    color: '#007AFF',
    marginLeft: 10,
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
});

export default NeighborhoodsScreen;
