import axios from 'axios';

export const API_URL = 'http://localhost:4000/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Setup request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (user.tenant) {
      config.headers['x-tenant-id'] = user.tenant;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup response interceptor to handle auth errors
export const setupAuthInterceptor = (onLogout) => {
  const interceptor = apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Authentication error - clearing session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
      }
      return Promise.reject(error);
    }
  );
  
  return () => {
    apiClient.interceptors.response.eject(interceptor);
  };
};

export default apiClient;
