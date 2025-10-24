// GiftMind Frontend API Integration
// Railway deployment: https://giftmind-be-production.up.railway.app

const API_BASE_URL = 'https://giftmind-be-production.up.railway.app';

class GiftMindAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken') || null;
  }

  // Helper method for API calls
  async apiCall(method, endpoint, data = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'API request failed');
      }
      
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // 1. Register new user
  async register(email, password, firstName, lastName) {
    try {
      const result = await this.apiCall('POST', '/api/register', {
        email,
        password,
        firstName,
        lastName
      });

      // Save token
      if (result.session?.accessToken) {
        this.token = result.session.accessToken;
        localStorage.setItem('authToken', this.token);
      }

      return {
        success: true,
        user: result.user,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 2. Login user
  async login(email, password) {
    try {
      const result = await this.apiCall('POST', '/api/login', {
        email,
        password
      });

      // Save token
      if (result.token) {
        this.token = result.token;
        localStorage.setItem('authToken', this.token);
      }

      return {
        success: true,
        user: result.user,
        token: result.token,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 3. Get current user info
  async getCurrentUser() {
    try {
      const result = await this.apiCall('GET', '/api/user');
      return {
        success: true,
        user: result.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 4. Logout user
  async logout() {
    try {
      await this.apiCall('POST', '/api/logout');
      
      // Clear token
      this.token = null;
      localStorage.removeItem('authToken');

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      // Clear token even if API call fails
      this.token = null;
      localStorage.removeItem('authToken');
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 5. Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // 6. Clear authentication
  clearAuth() {
    this.token = null;
    localStorage.removeItem('authToken');
  }
}

// Export for use in frontend
export default GiftMindAPI;

// Usage example:
/*
const api = new GiftMindAPI();

// Register
const registerResult = await api.register('user@example.com', 'password123', 'John', 'Doe');

// Login
const loginResult = await api.login('user@example.com', 'password123');

// Get current user
const userResult = await api.getCurrentUser();

// Logout
const logoutResult = await api.logout();

// Check auth status
if (api.isAuthenticated()) {
  console.log('User is logged in');
}
*/
