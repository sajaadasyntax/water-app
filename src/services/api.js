import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config/api';
import logger from '../utils/logger';

const API_BASE_URL = getApiUrl();

// Log API configuration
logger.connectivity('API Configuration', {
  baseUrl: API_BASE_URL,
  timestamp: new Date().toISOString()
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout for better reliability
  // Add HTTPS configuration for production
  httpsAgent: API_BASE_URL.startsWith('https') ? {
    rejectUnauthorized: true
  } : undefined
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const startTime = Date.now();
    config.metadata = { startTime };
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        logger.auth('Token added to request', true, {
          url: config.url,
          method: config.method
        });
      } else {
        logger.auth('No token found for request', false, {
          url: config.url,
          method: config.method
        });
      }
    } catch (error) {
      logger.error('Error getting token', error, {
        url: config.url,
        method: config.method
      });
    }
    
    logger.apiRequest(config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    logger.apiError('REQUEST', 'Unknown', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const { config } = response;
    const responseTime = Date.now() - (config.metadata?.startTime || Date.now());
    
    logger.apiResponse(
      config.method?.toUpperCase(),
      config.url,
      response.status,
      responseTime,
      response.data
    );
    
    return response;
  },
  (error) => {
    const { config } = error;
    const responseTime = config ? Date.now() - (config.metadata?.startTime || Date.now()) : 0;
    
    if (error.response) {
      // Server responded with error status
      logger.apiError(
        config?.method?.toUpperCase() || 'UNKNOWN',
        config?.url || 'Unknown',
        error,
        {
          status: error.response.status,
          data: error.response.data,
          responseTime
        }
      );
    } else if (error.request) {
      // Network error
      logger.connectivity('Network error - no response received', {
        url: config?.url,
        method: config?.method,
        error: error.message,
        responseTime
      });
    } else {
      // Other error
      logger.error('API request setup error', error, {
        url: config?.url,
        method: config?.method
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/login', { username, password }),
  register: (username, password) => api.post('/register', { username, password }),
};

// Neighborhoods API
export const neighborhoodsAPI = {
  getAll: () => api.get('/neighborhoods'),
  getSquares: (neighborhoodId) => api.get(`/neighborhoods/${neighborhoodId}/squares`),
  create: (name) => api.post('/neighborhoods', { name }),
};

// Squares API
export const squaresAPI = {
  getHouses: (squareId) => api.get(`/squares/${squareId}/houses`),
  create: (name, neighborhoodId) => api.post('/squares', { name, neighborhoodId }),
};

// Houses API
export const housesAPI = {
  create: (houseData) => api.post('/houses', houseData),
  update: (id, houseData) => api.put(`/houses/${id}`, houseData),
  delete: (id) => api.delete(`/houses/${id}`),
};

export default api;
