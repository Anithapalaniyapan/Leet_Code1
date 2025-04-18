import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add token to all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Only use x-access-token header which is what the backend expects
      config.headers['x-access-token'] = token;
      
      // Log request details for debugging
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
      
      // For diagnostic purposes only log non-sensitive header info
      const headersCopy = {...config.headers};
      if (headersCopy['x-access-token']) {
        headersCopy['x-access-token'] = headersCopy['x-access-token'].substring(0, 10) + '...';
      }
      console.log('Headers:', JSON.stringify(headersCopy));
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    
    // For array responses, log the number of items
    if (Array.isArray(response.data)) {
      console.log(`Response contains ${response.data.length} items`);
    }
    
    return response;
  },
  (error) => {
    // Log failed responses
    if (error.response) {
      console.error(`API Error: ${error.response.status} ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'UNKNOWN'}`);
      console.error('Error details:', error.response.data);
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.log('Authentication error detected, clearing token');
        localStorage.clear();
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('login')) {
              window.location.href = '/login';
        }
      }
      
      // For 403 Forbidden errors - just log without alerts
      if (error.response.status === 403) {
        console.error('Access forbidden - you may not have the correct permissions');
      }
    } else if (error.request) {
      // The request was made but no response was received (network error)
      console.error('Network error - no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default API; 