import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, Station, Measurement } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post('/auth/login', data).then(res => res.data),
  
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    api.post('/auth/register', data).then(res => res.data),
  
  getProfile: (): Promise<any> =>
    api.post('/auth/profile').then(res => res.data),
};

export const stationsApi = {
  getAll: (): Promise<Station[]> =>
    api.get('/stations').then(res => res.data),
  
  getById: (id: string): Promise<Station> =>
    api.get(`/stations/${id}`).then(res => res.data),
  
  create: (data: Partial<Station>): Promise<Station> =>
    api.post('/stations', data).then(res => res.data),
  
  update: (id: string, data: Partial<Station>): Promise<Station> =>
    api.patch(`/stations/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<void> =>
    api.delete(`/stations/${id}`).then(res => res.data),
};

export const measurementsApi = {
  getAll: (): Promise<Measurement[]> =>
    api.get('/measurements').then(res => res.data),
  
  getLatest: (): Promise<Measurement[]> =>
    api.get('/measurements/latest').then(res => res.data),
  
  getByStation: (stationId: string, limit?: number): Promise<Measurement[]> =>
    api.get(`/measurements/station/${stationId}`, {
      params: { limit }
    }).then(res => res.data),
  
  getLatestByStation: (stationId: string): Promise<Measurement> =>
    api.get(`/measurements/station/${stationId}/latest`).then(res => res.data),
  
  getLatestDateByStation: (stationId: string): Promise<string> =>
    api.get(`/measurements/station/${stationId}/latest-date`).then(res => res.data),
  
  getByDateRange: (stationId: string, startDate: string, endDate: string): Promise<Measurement[]> =>
    api.get(`/measurements/station/${stationId}/range`, {
      params: { startDate, endDate }
    }).then(res => res.data),
  
  create: (data: Partial<Measurement>): Promise<Measurement> =>
    api.post('/measurements', data).then(res => res.data),
};

export const seedApi = {
  seed: (): Promise<any> =>
    api.post('/seed').then(res => res.data),
};

export default api;
