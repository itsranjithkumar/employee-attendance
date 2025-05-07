// Utility for API requests to backend
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://employee-attendance-8skf.onrender.com/';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;
