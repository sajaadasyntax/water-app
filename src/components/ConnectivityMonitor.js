import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import logger from '../utils/logger';
import { getApiUrl } from '../config/api';

const ConnectivityMonitor = ({ onConnectivityChange }) => {
  const [isConnected, setIsConnected] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnectivity = async () => {
    setIsChecking(true);
    const baseUrl = getApiUrl().replace('/api', '');
    
    try {
      logger.connectivity('Starting connectivity check', { baseUrl });
      const result = await logger.testConnectivity(baseUrl);
      
      setIsConnected(result.success);
      setLastCheck(new Date());
      setResponseTime(result.responseTime);
      
      if (onConnectivityChange) {
        onConnectivityChange(result.success, result);
      }
      
      logger.connectivity('Connectivity check completed', {
        success: result.success,
        responseTime: result.responseTime,
        status: result.status
      });
    } catch (error) {
      logger.error('Connectivity check failed', error);
      setIsConnected(false);
      setLastCheck(new Date());
      setResponseTime(null);
      
      if (onConnectivityChange) {
        onConnectivityChange(false, { error: error.message });
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnectivity();
    
    // Check every 30 seconds
    const interval = setInterval(checkConnectivity, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isConnected === null) return '#888888';
    return isConnected ? '#4CAF50' : '#F44336';
  };

  const getStatusText = () => {
    if (isConnected === null) return 'Unknown';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  const showLogs = () => {
    const logs = logger.getAllLogs();
    const connectivityLogs = logger.getLogsByCategory('connectivity');
    const apiLogs = logger.getLogsByCategory('api');
    
    Alert.alert(
      'Debug Logs',
      `Total Logs: ${logs.length}\nConnectivity: ${connectivityLogs.length}\nAPI: ${apiLogs.length}`,
      [
        { text: 'Export Logs', onPress: () => exportLogs() },
        { text: 'Clear Logs', onPress: () => clearLogs() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const exportLogs = () => {
    const logs = logger.exportLogs();
    logger.info('Logs exported', { logCount: JSON.parse(logs).length });
    // In a real app, you might want to save this to a file or send it somewhere
    Alert.alert('Logs Exported', `Exported ${JSON.parse(logs).length} log entries`);
  };

  const clearLogs = () => {
    logger.clearLogs();
    Alert.alert('Logs Cleared', 'All logs have been cleared');
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {isChecking && <Text style={styles.checkingText}>Checking...</Text>}
      </View>
      
      {lastCheck && (
        <Text style={styles.lastCheckText}>
          Last check: {lastCheck.toLocaleTimeString()}
        </Text>
      )}
      
      {responseTime && (
        <Text style={styles.responseTimeText}>
          Response time: {responseTime}ms
        </Text>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={checkConnectivity}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={showLogs}>
          <Text style={styles.buttonText}>View Logs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  lastCheckText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  responseTimeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ConnectivityMonitor;
