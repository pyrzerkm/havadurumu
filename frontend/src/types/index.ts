export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Station {
  _id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city: string;
  country: string;
  isActive: boolean;
  description: string;
}

export interface Measurement {
  _id: string;
  stationId: string | Station;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  timestamp: string;
  notes?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}
