// API Configuration
// Update this IP address if your computer's IP changes
export const API_CONFIG = {
  // Your computer's IP address (run 'ipconfig' to find it)
  BASE_URL: 'http://192.168.0.103:3000/api',
  
  // Alternative URLs for different environments
  LOCALHOST: 'http://localhost:3000/api',
  PRODUCTION: 'https://gwsudan.xyz/api', // Production server
  SERVER: 'https://gwsudan.xyz/api', // Server IP
  GWSUDAN: 'https://gwsudan.xyz/api', // New backend URL
};

// Get the current API URL
export const getApiUrl = () => {
  // You can change this to switch between environments
  return API_CONFIG.GWSUDAN; // Using gwsudan.xyz backend
};
