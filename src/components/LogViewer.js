import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import logger from '../utils/logger';

const LogViewer = ({ visible, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    if (visible) {
      refreshLogs();
    }
  }, [visible]);

  const refreshLogs = () => {
    const allLogs = logger.getAllLogs();
    setLogs(allLogs);
  };

  const getFilteredLogs = () => {
    let filteredLogs = [...logs];

    // Filter by category
    if (selectedCategory !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.category === selectedCategory);
    }

    // Filter by level
    if (selectedLevel !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === selectedLevel);
    }

    // Filter by text
    if (filter) {
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        JSON.stringify(log.data).toLowerCase().includes(filter.toLowerCase())
      );
    }

    return filteredLogs.reverse(); // Show newest first
  };

  const getLogColor = (level) => {
    const colors = {
      error: '#ff4444',
      warn: '#ffaa00',
      info: '#4444ff',
      debug: '#888888',
    };
    return colors[level] || '#000000';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const exportLogs = () => {
    const logsToExport = getFilteredLogs();
    const exportData = JSON.stringify(logsToExport, null, 2);
    
    // In a real app, you might want to save this to a file
    Alert.alert(
      'Export Logs',
      `Exported ${logsToExport.length} log entries`,
      [{ text: 'OK' }]
    );
  };

  const clearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            logger.clearLogs();
            refreshLogs();
          },
        },
      ]
    );
  };

  if (!visible) return null;

  const filteredLogs = getFilteredLogs();
  const categories = ['all', 'api', 'auth', 'connectivity', 'ui', 'error'];
  const levels = ['all', 'error', 'warn', 'info', 'debug'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Logs ({filteredLogs.length})</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          value={filter}
          onChangeText={setFilter}
        />

        <ScrollView horizontal style={styles.categoryFilter}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCategory === category && styles.filterButtonTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal style={styles.levelFilter}>
          {levels.map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterButton,
                selectedLevel === level && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedLevel === level && styles.filterButtonTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.logsContainer}>
        {filteredLogs.map((log, index) => (
          <View key={log.id || index} style={styles.logEntry}>
            <View style={styles.logHeader}>
              <Text style={styles.timestamp}>
                {formatTimestamp(log.timestamp)}
              </Text>
              <Text
                style={[
                  styles.level,
                  { color: getLogColor(log.level) },
                ]}
              >
                {log.level.toUpperCase()}
              </Text>
              <Text style={styles.category}>
                {log.category.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.message}>{log.message}</Text>
            {Object.keys(log.data).length > 0 && (
              <Text style={styles.data}>
                {JSON.stringify(log.data, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={refreshLogs}>
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={exportLogs}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={clearLogs}>
          <Text style={styles.actionButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  filters: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  categoryFilter: {
    marginBottom: 10,
  },
  levelFilter: {
    marginBottom: 5,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  logsContainer: {
    flex: 1,
    padding: 10,
  },
  logEntry: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 8,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#ddd',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
  },
  level: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 10,
    color: '#666',
  },
  message: {
    fontSize: 12,
    marginBottom: 5,
  },
  data: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LogViewer;
