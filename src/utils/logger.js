// Frontend Logger for WaterGB App
// Logs API requests, responses, errors, and connectivity issues

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    this.isEnabled = __DEV__; // Enable in development mode
  }

  // Log levels
  static LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  };

  // Log categories
  static CATEGORIES = {
    API: 'api',
    AUTH: 'auth',
    CONNECTIVITY: 'connectivity',
    UI: 'ui',
    ERROR: 'error'
  };

  log(level, category, message, data = {}) {
    if (!this.isEnabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      id: Date.now() + Math.random()
    };

    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with colors
    const color = this.getColor(level);
    console.log(
      `%c[${logEntry.timestamp}] [${level.toUpperCase()}] [${category.toUpperCase()}] ${message}`,
      `color: ${color}`,
      data
    );
  }

  getColor(level) {
    const colors = {
      error: '#ff4444',
      warn: '#ffaa00',
      info: '#4444ff',
      debug: '#888888'
    };
    return colors[level] || '#000000';
  }

  // API request logging
  apiRequest(method, url, data = null) {
    this.log(Logger.LEVELS.INFO, Logger.CATEGORIES.API, `API Request: ${method} ${url}`, {
      method,
      url,
      data,
      timestamp: Date.now()
    });
  }

  // API response logging
  apiResponse(method, url, status, responseTime, data = null) {
    const level = status >= 400 ? Logger.LEVELS.ERROR : Logger.LEVELS.INFO;
    this.log(level, Logger.CATEGORIES.API, `API Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      responseTime,
      data,
      timestamp: Date.now()
    });
  }

  // API error logging
  apiError(method, url, error, response = null) {
    this.log(Logger.LEVELS.ERROR, Logger.CATEGORIES.API, `API Error: ${method} ${url}`, {
      method,
      url,
      error: error.message || error,
      stack: error.stack,
      response,
      timestamp: Date.now()
    });
  }

  // Connectivity logging
  connectivity(message, data = {}) {
    this.log(Logger.LEVELS.INFO, Logger.CATEGORIES.CONNECTIVITY, message, {
      ...data,
      timestamp: Date.now()
    });
  }

  // Authentication logging
  auth(action, success, data = {}) {
    const level = success ? Logger.LEVELS.INFO : Logger.LEVELS.WARN;
    this.log(level, Logger.CATEGORIES.AUTH, `Auth: ${action}`, {
      action,
      success,
      ...data,
      timestamp: Date.now()
    });
  }

  // UI logging
  ui(action, data = {}) {
    this.log(Logger.LEVELS.DEBUG, Logger.CATEGORIES.UI, `UI: ${action}`, {
      action,
      ...data,
      timestamp: Date.now()
    });
  }

  // Error logging
  error(message, error = null, data = {}) {
    this.log(Logger.LEVELS.ERROR, Logger.CATEGORIES.ERROR, message, {
      error: error?.message || error,
      stack: error?.stack,
      ...data,
      timestamp: Date.now()
    });
  }

  // Get all logs
  getAllLogs() {
    return [...this.logs];
  }

  // Get logs by category
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }

  // Get logs by level
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs as JSON
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  // Test connectivity
  async testConnectivity(baseUrl) {
    this.connectivity('Testing connectivity', { baseUrl });
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/neighborhoods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.connectivity('Connectivity test successful', {
          baseUrl,
          status: response.status,
          responseTime
        });
        return { success: true, responseTime, status: response.status };
      } else {
        this.connectivity('Connectivity test failed', {
          baseUrl,
          status: response.status,
          responseTime
        });
        return { success: false, responseTime, status: response.status };
      }
    } catch (error) {
      this.connectivity('Connectivity test error', {
        baseUrl,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
